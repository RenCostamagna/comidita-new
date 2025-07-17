-- ACTUALIZACIÓN DEL SISTEMA DE PUNTOS
-- Implementa el nuevo sistema de puntos basado en diferentes acciones

-- ============================================================================
-- 1. CREAR TABLA PARA HISTORIAL DE PUNTOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  review_id UUID REFERENCES detailed_reviews(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'review_existing_place',
    'review_new_place', 
    'add_photo',
    'extended_review'
  )),
  points_earned INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla de historial
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_review_id ON points_history(review_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);

-- ============================================================================
-- 2. FUNCIÓN MEJORADA PARA CALCULAR PUNTOS
-- ============================================================================

-- Función principal para calcular puntos con desglose detallado
CREATE OR REPLACE FUNCTION calculate_detailed_review_points(
  place_id_param UUID,
  has_photos BOOLEAN DEFAULT FALSE,
  comment_length INTEGER DEFAULT 0
)
RETURNS TABLE(
  total_points INTEGER,
  base_points INTEGER,
  first_review_bonus INTEGER,
  photo_bonus INTEGER,
  extended_review_bonus INTEGER,
  breakdown JSONB
) AS $$
DECLARE
  base_review_points INTEGER := 100;
  first_review_bonus_points INTEGER := 0;
  photo_bonus_points INTEGER := 0;
  extended_review_bonus_points INTEGER := 0;
  total_reviews INTEGER;
  breakdown_json JSONB;
BEGIN
  -- Verificar si es la primera reseña del lugar
  SELECT COUNT(*) INTO total_reviews
  FROM detailed_reviews
  WHERE place_id = place_id_param;
  
  -- Bonus por primera reseña del lugar
  IF total_reviews = 0 THEN
    first_review_bonus_points := 500; -- +500 por lugar no reseñado anteriormente
  END IF;
  
  -- Bonus por agregar fotos
  IF has_photos THEN
    photo_bonus_points := 50; -- +50 por agregar foto
  END IF;
  
  -- Bonus por reseña extensa (+300 caracteres)
  IF comment_length >= 300 THEN
    extended_review_bonus_points := 50; -- +50 por reseña extensa
  END IF;
  
  -- Crear JSON con el desglose
  breakdown_json := jsonb_build_object(
    'base_review', base_review_points,
    'first_review_bonus', first_review_bonus_points,
    'photo_bonus', photo_bonus_points,
    'extended_review_bonus', extended_review_bonus_points,
    'is_first_review', (total_reviews = 0),
    'has_photos', has_photos,
    'is_extended_review', (comment_length >= 300),
    'comment_length', comment_length
  );
  
  RETURN QUERY SELECT 
    base_review_points + first_review_bonus_points + photo_bonus_points + extended_review_bonus_points,
    base_review_points,
    first_review_bonus_points,
    photo_bonus_points,
    extended_review_bonus_points,
    breakdown_json;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FUNCIÓN PARA REGISTRAR PUNTOS EN HISTORIAL
-- ============================================================================

CREATE OR REPLACE FUNCTION record_points_history(
  user_id_param UUID,
  review_id_param UUID,
  points_breakdown RECORD
)
RETURNS VOID AS $$
BEGIN
  -- Registrar puntos base por reseña
  INSERT INTO points_history (user_id, review_id, action_type, points_earned, description)
  VALUES (
    user_id_param, 
    review_id_param, 
    CASE WHEN points_breakdown.first_review_bonus > 0 
         THEN 'review_new_place' 
         ELSE 'review_existing_place' 
    END,
    points_breakdown.base_points + points_breakdown.first_review_bonus,
    CASE WHEN points_breakdown.first_review_bonus > 0 
         THEN 'Primera reseña del lugar (+500 bonus)'
         ELSE 'Reseña de lugar existente'
    END
  );
  
  -- Registrar bonus por foto si aplica
  IF points_breakdown.photo_bonus > 0 THEN
    INSERT INTO points_history (user_id, review_id, action_type, points_earned, description)
    VALUES (user_id_param, review_id_param, 'add_photo', points_breakdown.photo_bonus, 'Agregar foto a la reseña');
  END IF;
  
  -- Registrar bonus por reseña extensa si aplica
  IF points_breakdown.extended_review_bonus > 0 THEN
    INSERT INTO points_history (user_id, review_id, action_type, points_earned, description)
    VALUES (user_id_param, review_id_param, 'extended_review', points_breakdown.extended_review_bonus, 'Reseña extensa (+300 caracteres)');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ACTUALIZAR TRIGGERS PARA USAR EL NUEVO SISTEMA
-- ============================================================================

-- Función actualizada para manejar puntos al crear reseña
CREATE OR REPLACE FUNCTION update_user_points_detailed()
RETURNS TRIGGER AS $$
DECLARE
  points_breakdown RECORD;
BEGIN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función actualizada para restar puntos al eliminar reseña
CREATE OR REPLACE FUNCTION subtract_user_points_detailed()
RETURNS TRIGGER AS $$
DECLARE
  points_breakdown RECORD;
BEGIN
  -- Calcular puntos que se deben restar
  SELECT * INTO points_breakdown
  FROM calculate_detailed_review_points(
    OLD.place_id,
    (OLD.photo_1_url IS NOT NULL OR OLD.photo_2_url IS NOT NULL),
    COALESCE(LENGTH(OLD.comment), 0)
  );
  
  -- Restar puntos del usuario
  UPDATE users 
  SET 
    points = GREATEST(COALESCE(points, 0) - points_breakdown.total_points, 0),
    updated_at = NOW()
  WHERE id = OLD.user_id;
  
  -- Eliminar registros del historial de puntos
  DELETE FROM points_history WHERE review_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. RECREAR TRIGGERS CON LAS NUEVAS FUNCIONES
-- ============================================================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS trigger_add_points_on_review ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_subtract_points_on_review_delete ON detailed_reviews;

-- Crear nuevos triggers
CREATE TRIGGER trigger_add_points_on_review_detailed
  AFTER INSERT ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points_detailed();

CREATE TRIGGER trigger_subtract_points_on_review_delete_detailed
  AFTER DELETE ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION subtract_user_points_detailed();

-- ============================================================================
-- 6. FUNCIÓN PARA OBTENER DESGLOSE DE PUNTOS DE UNA RESEÑA
-- ============================================================================

CREATE OR REPLACE FUNCTION get_review_points_breakdown(review_id_param UUID)
RETURNS TABLE(
  action_type TEXT,
  points_earned INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.action_type,
    ph.points_earned,
    ph.description,
    ph.created_at
  FROM points_history ph
  WHERE ph.review_id = review_id_param
  ORDER BY ph.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. FUNCIÓN PARA RECALCULAR PUNTOS CON EL NUEVO SISTEMA
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_all_user_points_detailed()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  review_record RECORD;
  points_breakdown RECORD;
  total_points INTEGER;
BEGIN
  -- Limpiar historial de puntos existente
  DELETE FROM points_history;
  
  FOR user_record IN SELECT id FROM users LOOP
    total_points := 0;
    
    -- Procesar cada reseña del usuario
    FOR review_record IN 
      SELECT * FROM detailed_reviews 
      WHERE user_id = user_record.id 
      ORDER BY created_at ASC
    LOOP
      -- Calcular puntos para esta reseña
      SELECT * INTO points_breakdown
      FROM calculate_detailed_review_points(
        review_record.place_id,
        (review_record.photo_1_url IS NOT NULL OR review_record.photo_2_url IS NOT NULL),
        COALESCE(LENGTH(review_record.comment), 0)
      );
      
      -- Sumar al total
      total_points := total_points + points_breakdown.total_points;
      
      -- Registrar en historial
      PERFORM record_points_history(user_record.id, review_record.id, points_breakdown);
    END LOOP;
    
    -- Actualizar puntos del usuario
    UPDATE users 
    SET points = total_points 
    WHERE id = user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Puntos recalculados para todos los usuarios con el nuevo sistema';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. EJECUTAR RECÁLCULO INICIAL
-- ============================================================================

-- Ejecutar recálculo con el nuevo sistema
SELECT recalculate_all_user_points_detailed();

-- ============================================================================
-- 9. MENSAJES FINALES
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SISTEMA DE PUNTOS ACTUALIZADO EXITOSAMENTE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Nuevo sistema de puntos implementado:';
  RAISE NOTICE '- Reseñar lugar existente: +100 puntos';
  RAISE NOTICE '- Reseñar lugar nuevo: +600 puntos (100 base + 500 bonus)';
  RAISE NOTICE '- Agregar foto: +50 puntos';
  RAISE NOTICE '- Reseña extensa (+300 chars): +50 puntos';
  RAISE NOTICE '- Historial de puntos: Habilitado';
  RAISE NOTICE '- Triggers: Actualizados';
  RAISE NOTICE '============================================================================';
END $$;
