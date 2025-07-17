-- ============================================================================
-- SISTEMA DE NOTIFICACIONES
-- Script para crear el sistema completo de notificaciones
-- ============================================================================

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'achievement_unlocked',
    'review_published',
    'level_up',
    'points_earned'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para notificaciones
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE TO public USING (auth.uid() = user_id);

CREATE POLICY "Allow insert notifications" ON notifications
  FOR INSERT TO public WITH CHECK (true);

-- Función para crear notificación de logro desbloqueado
CREATE OR REPLACE FUNCTION create_achievement_notification(
  user_id_param UUID,
  achievement_data JSONB
)
RETURNS VOID AS $$
DECLARE
  achievement JSONB;
BEGIN
  -- Iterar sobre cada logro en el array
  FOR achievement IN SELECT * FROM jsonb_array_elements(achievement_data)
  LOOP
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      user_id_param,
      'achievement_unlocked',
      '¡Logro Desbloqueado!',
      'Has desbloqueado: ' || (achievement->>'name'),
      jsonb_build_object(
        'achievement_id', achievement->>'id',
        'achievement_name', achievement->>'name',
        'achievement_icon', achievement->>'icon',
        'achievement_color', achievement->>'color',
        'points_reward', achievement->>'points_reward',
        'category', achievement->>'category'
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función para crear notificación de reseña publicada
CREATE OR REPLACE FUNCTION create_review_notification(
  user_id_param UUID,
  review_id_param UUID,
  place_name TEXT,
  points_earned INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_id_param,
    'review_published',
    '¡Reseña Publicada!',
    'Tu reseña de "' || place_name || '" ha sido publicada. Ganaste ' || points_earned || ' puntos.',
    jsonb_build_object(
      'review_id', review_id_param,
      'place_name', place_name,
      'points_earned', points_earned
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Función para crear notificación de subida de nivel
CREATE OR REPLACE FUNCTION create_level_up_notification(
  user_id_param UUID,
  old_level_name TEXT,
  new_level_name TEXT,
  new_level_icon TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    user_id_param,
    'level_up',
    '¡Nuevo Nivel!',
    'Has alcanzado el nivel: ' || new_level_name,
    jsonb_build_object(
      'old_level', old_level_name,
      'new_level', new_level_name,
      'new_level_icon', new_level_icon
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener notificaciones de un usuario
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 20,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  time_ago TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.data,
    n.is_read,
    n.created_at,
    CASE 
      WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 60 || ' min'
      WHEN n.created_at > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 3600 || ' h'
      WHEN n.created_at > NOW() - INTERVAL '1 week' THEN 
        EXTRACT(EPOCH FROM (NOW() - n.created_at))::INTEGER / 86400 || ' d'
      ELSE 
        TO_CHAR(n.created_at, 'DD/MM')
    END as time_ago
  FROM notifications n
  WHERE n.user_id = user_id_param
  ORDER BY n.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Función para contar notificaciones no leídas
CREATE OR REPLACE FUNCTION get_unread_notifications_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = user_id_param AND is_read = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Función para marcar notificación como leída
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_id_param;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar todas las notificaciones como leídas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, updated_at = NOW()
  WHERE user_id = user_id_param AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Actualizar función de logros para crear notificaciones
CREATE OR REPLACE FUNCTION check_and_grant_achievements(user_id_param UUID, category_param TEXT)
RETURNS TABLE(
  new_achievements JSONB
) AS $$
DECLARE
  review_count INTEGER;
  achievement_record RECORD;
  new_achievements_array JSONB := '[]'::JSONB;
  achievement_json JSONB;
BEGIN
  -- Contar reseñas del usuario en esta categoría
  SELECT COUNT(*) INTO review_count
  FROM detailed_reviews dr
  JOIN places p ON dr.place_id = p.id
  WHERE dr.user_id = user_id_param 
    AND p.category = category_param;
  
  -- Verificar cada logro de la categoría
  FOR achievement_record IN 
    SELECT * FROM category_achievements 
    WHERE category = category_param 
    AND required_reviews <= review_count
    ORDER BY level ASC
  LOOP
    -- Verificar si el usuario ya tiene este logro
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = user_id_param 
      AND achievement_id = achievement_record.id
    ) THEN
      -- Otorgar el logro
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES (user_id_param, achievement_record.id);
      
      -- Otorgar puntos bonus
      UPDATE users 
      SET points = COALESCE(points, 0) + achievement_record.points_reward,
          updated_at = NOW()
      WHERE id = user_id_param;
      
      -- Agregar al array de nuevos logros
      achievement_json := jsonb_build_object(
        'id', achievement_record.id,
        'name', achievement_record.name,
        'description', achievement_record.description,
        'level', achievement_record.level,
        'category', achievement_record.category,
        'points_reward', achievement_record.points_reward,
        'icon', achievement_record.icon,
        'color', achievement_record.color
      );
      
      new_achievements_array := new_achievements_array || achievement_json;
    END IF;
  END LOOP;
  
  -- Crear notificaciones para los nuevos logros
  IF jsonb_array_length(new_achievements_array) > 0 THEN
    PERFORM create_achievement_notification(user_id_param, new_achievements_array);
  END IF;
  
  RETURN QUERY SELECT new_achievements_array;
END;
$$ LANGUAGE plpgsql;

-- Actualizar función de puntos para crear notificaciones
CREATE OR REPLACE FUNCTION update_user_points_and_achievements()
RETURNS TRIGGER AS $$
DECLARE
  points_breakdown RECORD;
  place_category TEXT;
  place_name TEXT;
  new_achievements JSONB;
  old_level RECORD;
  new_level RECORD;
BEGIN
  -- Obtener información del lugar
  SELECT category, name INTO place_category, place_name
  FROM places 
  WHERE id = NEW.place_id;
  
  -- Obtener nivel actual del usuario
  SELECT * INTO old_level 
  FROM get_user_level_detailed((SELECT COALESCE(points, 0) FROM users WHERE id = NEW.user_id));
  
  -- Calcular puntos para esta reseña
  SELECT * INTO points_breakdown
  FROM calculate_detailed_review_points(
    NEW.place_id,
    (NEW.photo_1_url IS NOT NULL OR NEW.photo_2_url IS NOT NULL),
    COALESCE(LENGTH(NEW.comment), 0)
  );
  
  -- Actualizar puntos del usuario
  UPDATE users 
  SET 
    points = COALESCE(points, 0) + points_breakdown.total_points,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Registrar en historial de puntos
  PERFORM record_points_history(NEW.user_id, NEW.id, points_breakdown);
  
  -- Crear notificación de reseña publicada
  PERFORM create_review_notification(
    NEW.user_id, 
    NEW.id, 
    COALESCE(place_name, 'lugar desconocido'), 
    points_breakdown.total_points
  );
  
  -- Verificar cambio de nivel
  SELECT * INTO new_level 
  FROM get_user_level_detailed((SELECT points FROM users WHERE id = NEW.user_id));
  
  IF old_level.level_number != new_level.level_number THEN
    PERFORM create_level_up_notification(
      NEW.user_id,
      old_level.level_name,
      new_level.level_name,
      new_level.level_icon
    );
  END IF;
  
  -- Verificar y otorgar logros si hay categoría
  IF place_category IS NOT NULL THEN
    SELECT * INTO new_achievements
    FROM check_and_grant_achievements(NEW.user_id, place_category);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar notificaciones antiguas (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  -- Eliminar notificaciones leídas de más de 30 días
  DELETE FROM notifications 
  WHERE is_read = TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  
  -- Mantener máximo 100 notificaciones por usuario
  WITH ranked_notifications AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM notifications
  )
  DELETE FROM notifications 
  WHERE id IN (
    SELECT id FROM ranked_notifications WHERE rn > 100
  );
END;
$$ LANGUAGE plpgsql;

-- Verificar instalación
DO $$
DECLARE
  table_exists BOOLEAN;
  function_count INTEGER;
BEGIN
  -- Verificar tabla
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO table_exists;
  
  -- Contar funciones
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname IN (
    'create_achievement_notification',
    'create_review_notification', 
    'create_level_up_notification',
    'get_user_notifications',
    'get_unread_notifications_count',
    'mark_notification_as_read',
    'mark_all_notifications_as_read'
  );
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SISTEMA DE NOTIFICACIONES INSTALADO';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Tabla notifications: %', CASE WHEN table_exists THEN '✅ Creada' ELSE '❌ Error' END;
  RAISE NOTICE 'Funciones creadas: % de 7', function_count;
  RAISE NOTICE 'Triggers actualizados: ✅ Completado';
  RAISE NOTICE 'RLS configurado: ✅ Completado';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'TIPOS DE NOTIFICACIONES:';
  RAISE NOTICE '• achievement_unlocked: Logro desbloqueado';
  RAISE NOTICE '• review_published: Reseña publicada';
  RAISE NOTICE '• level_up: Subida de nivel';
  RAISE NOTICE '• points_earned: Puntos ganados';
  RAISE NOTICE '============================================================================';
END $$;
