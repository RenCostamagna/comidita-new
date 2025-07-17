-- ACTUALIZACIÓN DE NIVELES DE USUARIO
-- Implementa los nuevos niveles gastronómicos con nombres temáticos

-- ============================================================================
-- 1. ACTUALIZAR NIVELES EXISTENTES
-- ============================================================================

-- Limpiar niveles existentes
DELETE FROM user_levels;

-- Insertar los nuevos niveles gastronómicos
INSERT INTO user_levels (name, min_points, max_points, color, icon) VALUES
('Novato Gourmet', 0, 999, '#6B7280', '🍽️'),
('Comensal Curioso', 1000, 2499, '#8B5CF6', '👀'),
('Crítico Casual', 2500, 4999, '📱', '#3B82F6'),
('Catador Urbano', 5000, 9999, '🍷', '#F59E0B'),
('Experto Gastronómico', 10000, 19999, '👨‍🍳', '#EF4444'),
('Maestro del Paladar', 20000, NULL, '🔥', '#DC2626');

-- ============================================================================
-- 2. FUNCIÓN MEJORADA PARA OBTENER INFORMACIÓN DETALLADA DEL NIVEL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_level_detailed(user_points INTEGER)
RETURNS TABLE(
  level_number INTEGER,
  level_name TEXT,
  level_color TEXT,
  level_icon TEXT,
  min_points INTEGER,
  max_points INTEGER,
  progress_percentage NUMERIC,
  points_to_next_level INTEGER,
  next_level_name TEXT
) AS $$
DECLARE
  current_level RECORD;
  next_level RECORD;
  points_needed INTEGER;
BEGIN
  -- Obtener el nivel actual del usuario
  SELECT 
    ROW_NUMBER() OVER (ORDER BY min_points) as level_num,
    *
  INTO current_level
  FROM user_levels
  WHERE user_points >= min_points 
    AND (max_points IS NULL OR user_points <= max_points)
  ORDER BY min_points DESC
  LIMIT 1;
  
  IF current_level IS NULL THEN
    -- Fallback al primer nivel
    SELECT 
      ROW_NUMBER() OVER (ORDER BY min_points) as level_num,
      *
    INTO current_level 
    FROM user_levels 
    ORDER BY min_points ASC 
    LIMIT 1;
  END IF;
  
  -- Obtener información del siguiente nivel
  SELECT * INTO next_level
  FROM user_levels
  WHERE min_points > current_level.min_points
  ORDER BY min_points ASC
  LIMIT 1;
  
  -- Calcular puntos necesarios para el siguiente nivel
  IF next_level IS NOT NULL THEN
    points_needed := next_level.min_points - user_points;
  ELSE
    points_needed := 0; -- Ya está en el nivel máximo
  END IF;
  
  -- Calcular porcentaje de progreso
  RETURN QUERY SELECT 
    current_level.level_num::INTEGER,
    current_level.name,
    current_level.color,
    current_level.icon,
    current_level.min_points,
    current_level.max_points,
    CASE 
      WHEN current_level.max_points IS NULL THEN 100.0
      ELSE ROUND(
        ((user_points - current_level.min_points)::NUMERIC / 
         (current_level.max_points - current_level.min_points)::NUMERIC) * 100, 1
      )
    END,
    GREATEST(points_needed, 0),
    COALESCE(next_level.name, 'Nivel Máximo');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FUNCIÓN PARA OBTENER TODOS LOS NIVELES (PARA MOSTRAR EN UI)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_user_levels()
RETURNS TABLE(
  level_number INTEGER,
  level_name TEXT,
  level_color TEXT,
  level_icon TEXT,
  min_points INTEGER,
  max_points INTEGER,
  points_range TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ul.min_points)::INTEGER as level_number,
    ul.name,
    ul.color,
    ul.icon,
    ul.min_points,
    ul.max_points,
    CASE 
      WHEN ul.max_points IS NULL THEN ul.min_points::TEXT || '+ puntos'
      ELSE ul.min_points::TEXT || ' - ' || ul.max_points::TEXT || ' puntos'
    END as points_range
  FROM user_levels ul
  ORDER BY ul.min_points;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. FUNCIÓN PARA OBTENER ESTADÍSTICAS DE NIVELES
-- ============================================================================

CREATE OR REPLACE FUNCTION get_level_statistics()
RETURNS TABLE(
  level_name TEXT,
  level_icon TEXT,
  user_count INTEGER,
  percentage NUMERIC
) AS $$
DECLARE
  total_users INTEGER;
BEGIN
  -- Obtener total de usuarios
  SELECT COUNT(*) INTO total_users FROM users WHERE points > 0;
  
  IF total_users = 0 THEN
    total_users := 1; -- Evitar división por cero
  END IF;
  
  RETURN QUERY
  WITH user_levels_with_counts AS (
    SELECT 
      ul.name,
      ul.icon,
      ul.min_points,
      ul.max_points,
      COUNT(u.id) as user_count
    FROM user_levels ul
    LEFT JOIN users u ON (
      u.points >= ul.min_points 
      AND (ul.max_points IS NULL OR u.points <= ul.max_points)
    )
    GROUP BY ul.name, ul.icon, ul.min_points, ul.max_points
  )
  SELECT 
    ulwc.name,
    ulwc.icon,
    ulwc.user_count::INTEGER,
    ROUND((ulwc.user_count::NUMERIC / total_users::NUMERIC) * 100, 1) as percentage
  FROM user_levels_with_counts ulwc
  ORDER BY ulwc.min_points;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. ACTUALIZAR LA FUNCIÓN ORIGINAL PARA MANTENER COMPATIBILIDAD
-- ============================================================================

-- Mantener la función original pero que use la nueva estructura
CREATE OR REPLACE FUNCTION get_user_level(user_points INTEGER)
RETURNS TABLE(
  level_name TEXT,
  level_color TEXT,
  level_icon TEXT,
  min_points INTEGER,
  max_points INTEGER,
  progress_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gul.level_name,
    gul.level_color,
    gul.level_icon,
    gul.min_points,
    gul.max_points,
    gul.progress_percentage
  FROM get_user_level_detailed(user_points) gul;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGER PARA NOTIFICAR CAMBIOS DE NIVEL
-- ============================================================================

-- Función para detectar cambios de nivel
CREATE OR REPLACE FUNCTION check_level_change()
RETURNS TRIGGER AS $$
DECLARE
  old_level RECORD;
  new_level RECORD;
BEGIN
  -- Solo procesar si los puntos cambiaron
  IF OLD.points IS DISTINCT FROM NEW.points THEN
    -- Obtener nivel anterior
    SELECT * INTO old_level FROM get_user_level_detailed(COALESCE(OLD.points, 0));
    
    -- Obtener nuevo nivel
    SELECT * INTO new_level FROM get_user_level_detailed(NEW.points);
    
    -- Si cambió de nivel, podrías registrar esto en una tabla de notificaciones
    -- o enviar una notificación (implementación futura)
    IF old_level.level_number != new_level.level_number THEN
      -- Aquí podrías insertar en una tabla de notificaciones
      RAISE NOTICE 'Usuario % subió del nivel % al nivel %', 
        NEW.id, old_level.level_name, new_level.level_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para detectar cambios de nivel
DROP TRIGGER IF EXISTS trigger_check_level_change ON users;
CREATE TRIGGER trigger_check_level_change
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_level_change();

-- ============================================================================
-- 7. RECALCULAR NIVELES PARA USUARIOS EXISTENTES
-- ============================================================================

-- Esta función no necesita cambios ya que los niveles se calculan dinámicamente
-- basándose en los puntos del usuario y la tabla user_levels

-- ============================================================================
-- 8. VERIFICACIONES Y MENSAJES FINALES
-- ============================================================================

DO $$
DECLARE
  level_count INTEGER;
  user_count INTEGER;
BEGIN
  -- Contar niveles
  SELECT COUNT(*) INTO level_count FROM user_levels;
  
  -- Contar usuarios
  SELECT COUNT(*) INTO user_count FROM users WHERE points > 0;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'NIVELES DE USUARIO ACTUALIZADOS EXITOSAMENTE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Nuevos niveles gastronómicos:';
  RAISE NOTICE '1. 🍽️ Novato Gourmet (0-999 puntos)';
  RAISE NOTICE '2. 👀 Comensal Curioso (1000-2499 puntos)';
  RAISE NOTICE '3. 📱 Crítico Casual (2500-4999 puntos)';
  RAISE NOTICE '4. 🍷 Catador Urbano (5000-9999 puntos)';
  RAISE NOTICE '5. 👨‍🍳 Experto Gastronómico (10000-19999 puntos)';
  RAISE NOTICE '6. 🔥 Maestro del Paladar (20000+ puntos)';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total de niveles: %', level_count;
  RAISE NOTICE 'Usuarios con puntos: %', user_count;
  RAISE NOTICE 'Funciones nuevas: get_user_level_detailed, get_all_user_levels, get_level_statistics';
  RAISE NOTICE '============================================================================';
END $$;

-- Mostrar distribución actual de usuarios por nivel
SELECT 
  level_name as "Nivel",
  level_icon as "Icono", 
  user_count as "Usuarios",
  percentage::TEXT || '%' as "Porcentaje"
FROM get_level_statistics()
ORDER BY user_count DESC;
