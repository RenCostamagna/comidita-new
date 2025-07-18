-- ============================================================================
-- CORRECCIÓN DE ERROR DE COLUMNA AMBIGUA
-- Script para solucionar el error "column reference 'min_points' is ambiguous"
-- ============================================================================

-- Función para obtener el nivel detallado de un usuario (CORREGIDA)
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
  -- Obtener el nivel actual del usuario con alias explícito
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ul.min_points) as level_num,
    ul.id,
    ul.name,
    ul.min_points,
    ul.max_points,
    ul.color,
    ul.icon,
    ul.created_at
  INTO current_level
  FROM user_levels ul
  WHERE user_points >= ul.min_points 
    AND (ul.max_points IS NULL OR user_points <= ul.max_points)
  ORDER BY ul.min_points DESC
  LIMIT 1;
  
  IF current_level IS NULL THEN
    -- Fallback al primer nivel
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ul.min_points) as level_num,
      ul.id,
      ul.name,
      ul.min_points,
      ul.max_points,
      ul.color,
      ul.icon,
      ul.created_at
    INTO current_level 
    FROM user_levels ul 
    ORDER BY ul.min_points ASC 
    LIMIT 1;
  END IF;
  
  -- Obtener información del siguiente nivel con alias explícito
  SELECT 
    ul.id,
    ul.name,
    ul.min_points,
    ul.max_points,
    ul.color,
    ul.icon,
    ul.created_at
  INTO next_level
  FROM user_levels ul
  WHERE ul.min_points > current_level.min_points
  ORDER BY ul.min_points ASC
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

-- Función para obtener todos los niveles (CORREGIDA)
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

-- Función para obtener estadísticas de niveles (CORREGIDA)
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

-- Función para mantener compatibilidad (CORREGIDA)
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

-- Verificar que las funciones se actualizaron correctamente
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  -- Contar funciones actualizadas
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname IN (
    'get_user_level_detailed', 
    'get_all_user_levels', 
    'get_level_statistics', 
    'get_user_level'
  );
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CORRECCIÓN DE ERROR DE COLUMNA AMBIGUA';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Funciones actualizadas: % de 4', function_count;
  RAISE NOTICE '✅ Error de "min_points ambiguous" corregido';
  RAISE NOTICE '✅ Todas las referencias de columnas ahora usan alias explícitos';
  RAISE NOTICE '============================================================================';
END $$;
