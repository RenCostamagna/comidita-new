-- SISTEMA DE LOGROS POR CATEGORÍA
-- Implementa el sistema de gamificación con objetivos específicos por cada tipo de restaurante

-- ============================================================================
-- 1. CREAR TABLAS PARA EL SISTEMA DE LOGROS
-- ============================================================================

-- Tabla de logros por categoría
CREATE TABLE IF NOT EXISTS category_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN (
    'PARRILLAS',
    'CAFE_Y_DELI',
    'BODEGONES', 
    'RESTAURANTES',
    'HAMBURGUESERIAS',
    'PIZZERIAS',
    'PASTAS',
    'CARRITOS',
    'BARES'
  )),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 4),
  name TEXT NOT NULL,
  description TEXT,
  required_reviews INTEGER NOT NULL,
  points_reward INTEGER NOT NULL,
  icon TEXT DEFAULT '🏆',
  color TEXT DEFAULT '#F59E0B',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, level)
);

-- Tabla de logros desbloqueados por usuario
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES category_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_category_achievements_category ON category_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- ============================================================================
-- 2. INSERTAR TODOS LOS LOGROS POR CATEGORÍA
-- ============================================================================

-- Limpiar logros existentes
DELETE FROM category_achievements;

-- PARRILLAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('PARRILLAS', 1, 'Asador Novato', 'Primeros pasos en el mundo de las parrillas', 3, 150, '🥩', '#EF4444'),
('PARRILLAS', 2, 'Catador de Achuras', 'Ya conoces los secretos de la parrilla', 10, 300, '🔥', '#DC2626'),
('PARRILLAS', 3, 'Maestro del Asado', 'Dominas el arte del asado argentino', 25, 600, '👨‍🍳', '#B91C1C'),
('PARRILLAS', 4, 'Parrillero Consagrado', 'Leyenda viviente de las parrillas', 50, 1000, '👑', '#991B1B');

-- CAFÉ Y DELI
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('CAFE_Y_DELI', 1, 'Tostado Inicial', 'Comenzando tu ruta cafetera', 3, 150, '☕', '#F59E0B'),
('CAFE_Y_DELI', 2, 'Cafetero Frecuente', 'El café ya es parte de tu rutina', 10, 300, '🫘', '#D97706'),
('CAFE_Y_DELI', 3, 'Fan de los Brunches', 'Experto en desayunos y meriendas', 25, 600, '🥐', '#B45309'),
('CAFE_Y_DELI', 4, 'Experto en Flat White', 'Maestro de todas las preparaciones', 50, 1000, '🎯', '#92400E');

-- BODEGONES
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('BODEGONES', 1, 'Plato del Día', 'Descubriendo la tradición porteña', 3, 150, '🍽️', '#3B82F6'),
('BODEGONES', 2, 'Tradición y Sabor', 'Conocedor de la cocina tradicional', 10, 300, '🏠', '#2563EB'),
('BODEGONES', 3, 'Cliente de la Casa', 'Ya eres parte de la familia', 25, 600, '❤️', '#1D4ED8'),
('BODEGONES', 4, 'Bodegonero Legendario', 'Guardián de las tradiciones culinarias', 50, 1000, '🏆', '#1E40AF');

-- RESTAURANTES
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('RESTAURANTES', 1, 'Comensal Formal', 'Iniciando en la alta gastronomía', 3, 150, '🍷', '#8B5CF6'),
('RESTAURANTES', 2, 'Foodie Activo', 'Explorador de nuevos sabores', 10, 300, '🌟', '#7C3AED'),
('RESTAURANTES', 3, 'Crítico Profesional', 'Tu paladar es tu mejor herramienta', 25, 600, '📝', '#6D28D9'),
('RESTAURANTES', 4, 'Gourmet Internacional', 'Conocedor de cocinas del mundo', 50, 1000, '🌍', '#5B21B6');

-- HAMBURGUESERÍAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('HAMBURGUESERIAS', 1, 'Triple con Cheddar', 'Primer mordisco al mundo burger', 3, 150, '🍔', '#F97316'),
('HAMBURGUESERIAS', 2, 'Ruta de la Hamburguesa', 'Cazador de las mejores burgers', 10, 300, '🛣️', '#EA580C'),
('HAMBURGUESERIAS', 3, 'Fanático del Smashed', 'Conoces todos los estilos', 25, 600, '🔨', '#DC2626'),
('HAMBURGUESERIAS', 4, 'Rey del Pan Brioche', 'Emperador de las hamburguesas', 50, 1000, '👑', '#B91C1C');

-- PIZZERÍAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('PIZZERIAS', 1, 'Fugazzeta Inicial', 'Comenzando tu amor por la pizza', 3, 150, '🍕', '#10B981'),
('PIZZERIAS', 2, 'Fan de la Muzza', 'La mozzarella no tiene secretos', 10, 300, '🧀', '#059669'),
('PIZZERIAS', 3, 'Maestro Pizzero', 'Conoces todas las variedades', 25, 600, '👨‍🍳', '#047857'),
('PIZZERIAS', 4, 'Campeón de la Fainá', 'Leyenda de las pizzerías porteñas', 50, 1000, '🏆', '#065F46');

-- PASTAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('PASTAS', 1, 'Raviolero Casual', 'Primeros pasos en el mundo de las pastas', 3, 150, '🍝', '#EC4899'),
('PASTAS', 2, 'Amante de la Salsita', 'Las salsas ya no tienen secretos', 10, 300, '🍅', '#DB2777'),
('PASTAS', 3, 'Catador de Ñoquis', 'Experto en todas las formas', 25, 600, '🥟', '#BE185D'),
('PASTAS', 4, 'Emperador de la Pasta', 'Maestro de la tradición italiana', 50, 1000, '👑', '#9D174D');

-- CARRITOS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('CARRITOS', 1, 'Callejero Nivel 1', 'Descubriendo la comida de la calle', 3, 150, '🚚', '#8B5CF6'),
('CARRITOS', 2, 'Ruta Street Food', 'Explorador de sabores urbanos', 10, 300, '🛣️', '#7C3AED'),
('CARRITOS', 3, 'Campeón de la Choriloca', 'Conoces todos los carritos', 25, 600, '🌭', '#6D28D9'),
('CARRITOS', 4, 'Leyenda del Trailer', 'Rey de la comida callejera', 50, 1000, '👑', '#5B21B6');

-- BARES
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('BARES', 1, 'Primer After', 'Iniciando en la vida nocturna', 3, 150, '🍺', '#F59E0B'),
('BARES', 2, 'Fan de las IPAs', 'Conocedor de cervezas artesanales', 10, 300, '🍻', '#D97706'),
('BARES', 3, 'Crítico de Cervezas', 'Tu paladar distingue cada estilo', 25, 600, '🎯', '#B45309'),
('BARES', 4, 'Maestro del After Office', 'Leyenda de los after office', 50, 1000, '🏆', '#92400E');

-- ============================================================================
-- 3. FUNCIONES PARA EL SISTEMA DE LOGROS
-- ============================================================================

-- Función para verificar y otorgar logros
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
  
  RETURN QUERY SELECT new_achievements_array;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener progreso de logros por categoría
CREATE OR REPLACE FUNCTION get_category_achievements_progress(user_id_param UUID, category_param TEXT)
RETURNS TABLE(
  achievement_id UUID,
  name TEXT,
  description TEXT,
  level INTEGER,
  required_reviews INTEGER,
  points_reward INTEGER,
  icon TEXT,
  color TEXT,
  is_unlocked BOOLEAN,
  current_progress INTEGER,
  progress_percentage NUMERIC,
  unlocked_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  review_count INTEGER;
BEGIN
  -- Contar reseñas del usuario en esta categoría
  SELECT COUNT(*) INTO review_count
  FROM detailed_reviews dr
  JOIN places p ON dr.place_id = p.id
  WHERE dr.user_id = user_id_param 
    AND p.category = category_param;
  
  RETURN QUERY
  SELECT 
    ca.id,
    ca.name,
    ca.description,
    ca.level,
    ca.required_reviews,
    ca.points_reward,
    ca.icon,
    ca.color,
    (ua.id IS NOT NULL) as is_unlocked,
    LEAST(review_count, ca.required_reviews) as current_progress,
    ROUND((LEAST(review_count, ca.required_reviews)::NUMERIC / ca.required_reviews::NUMERIC) * 100, 1) as progress_percentage,
    ua.unlocked_at
  FROM category_achievements ca
  LEFT JOIN user_achievements ua ON (ca.id = ua.achievement_id AND ua.user_id = user_id_param)
  WHERE ca.category = category_param
  ORDER BY ca.level ASC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener todos los logros de un usuario
CREATE OR REPLACE FUNCTION get_user_all_achievements(user_id_param UUID)
RETURNS TABLE(
  achievement_id UUID,
  name TEXT,
  description TEXT,
  level INTEGER,
  category TEXT,
  points_reward INTEGER,
  icon TEXT,
  color TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.name,
    ca.description,
    ca.level,
    ca.category,
    ca.points_reward,
    ca.icon,
    ca.color,
    ua.unlocked_at
  FROM user_achievements ua
  JOIN category_achievements ca ON ua.achievement_id = ca.id
  WHERE ua.user_id = user_id_param
  ORDER BY ua.unlocked_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de logros
CREATE OR REPLACE FUNCTION get_achievements_statistics(user_id_param UUID)
RETURNS TABLE(
  total_achievements INTEGER,
  unlocked_achievements INTEGER,
  completion_percentage NUMERIC,
  total_bonus_points INTEGER,
  achievements_by_category JSONB
) AS $$
DECLARE
  total_count INTEGER;
  unlocked_count INTEGER;
  bonus_points INTEGER;
  category_stats JSONB;
BEGIN
  -- Contar logros totales
  SELECT COUNT(*) INTO total_count FROM category_achievements;
  
  -- Contar logros desbloqueados
  SELECT COUNT(*) INTO unlocked_count 
  FROM user_achievements 
  WHERE user_id = user_id_param;
  
  -- Calcular puntos bonus totales
  SELECT COALESCE(SUM(ca.points_reward), 0) INTO bonus_points
  FROM user_achievements ua
  JOIN category_achievements ca ON ua.achievement_id = ca.id
  WHERE ua.user_id = user_id_param;
  
  -- Estadísticas por categoría
  SELECT jsonb_object_agg(
    category,
    jsonb_build_object(
      'total', category_total,
      'unlocked', category_unlocked,
      'percentage', ROUND((category_unlocked::NUMERIC / category_total::NUMERIC) * 100, 1)
    )
  ) INTO category_stats
  FROM (
    SELECT 
      ca.category,
      COUNT(*) as category_total,
      COUNT(ua.id) as category_unlocked
    FROM category_achievements ca
    LEFT JOIN user_achievements ua ON (ca.id = ua.achievement_id AND ua.user_id = user_id_param)
    GROUP BY ca.category
  ) category_summary;
  
  RETURN QUERY SELECT 
    total_count,
    unlocked_count,
    CASE WHEN total_count > 0 THEN ROUND((unlocked_count::NUMERIC / total_count::NUMERIC) * 100, 1) ELSE 0 END,
    bonus_points,
    COALESCE(category_stats, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ACTUALIZAR TRIGGER PARA VERIFICAR LOGROS
-- ============================================================================

-- Función actualizada para verificar logros al crear reseña
CREATE OR REPLACE FUNCTION update_user_points_and_achievements()
RETURNS TRIGGER AS $$
DECLARE
  points_breakdown RECORD;
  place_category TEXT;
  new_achievements JSONB;
BEGIN
  -- Obtener categoría del lugar
  SELECT category INTO place_category
  FROM places 
  WHERE id = NEW.place_id;
  
  -- Calcular puntos para esta reseña (función existente)
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
  
  -- Registrar en historial de puntos (función existente)
  PERFORM record_points_history(NEW.user_id, NEW.id, points_breakdown);
  
  -- Verificar y otorgar logros si hay categoría
  IF place_category IS NOT NULL THEN
    SELECT * INTO new_achievements
    FROM check_and_grant_achievements(NEW.user_id, place_category);
    
    -- Aquí podrías registrar los nuevos logros en una tabla de notificaciones
    -- o enviar notificaciones en tiempo real
    IF jsonb_array_length(new_achievements) > 0 THEN
      RAISE NOTICE 'Usuario % desbloqueó % nuevos logros en categoría %', 
        NEW.user_id, jsonb_array_length(new_achievements), place_category;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar el trigger existente
DROP TRIGGER IF EXISTS trigger_add_points_on_review_detailed ON detailed_reviews;
CREATE TRIGGER trigger_add_points_on_review_detailed
  AFTER INSERT ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points_and_achievements();

-- ============================================================================
-- 5. CONFIGURAR RLS PARA LAS NUEVAS TABLAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE category_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
CREATE POLICY "Allow all to view category achievements" ON category_achievements FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to view user achievements" ON user_achievements FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert user achievements" ON user_achievements FOR INSERT TO public WITH CHECK (true);

-- ============================================================================
-- 6. MENSAJES FINALES
-- ============================================================================

DO $$
DECLARE
  achievement_count INTEGER;
  category_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO achievement_count FROM category_achievements;
  SELECT COUNT(DISTINCT category) INTO category_count FROM category_achievements;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SISTEMA DE LOGROS POR CATEGORÍA IMPLEMENTADO';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total de logros creados: %', achievement_count;
  RAISE NOTICE 'Categorías con logros: %', category_count;
  RAISE NOTICE 'Niveles por categoría: 4 (Novato, Frecuente, Experto, Maestro)';
  RAISE NOTICE 'Sistema de puntos bonus: 150-1000 pts por logro';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '- check_and_grant_achievements()';
  RAISE NOTICE '- get_category_achievements_progress()';
  RAISE NOTICE '- get_user_all_achievements()';
  RAISE NOTICE '- get_achievements_statistics()';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '¡El sistema de gamificación está listo para usar!';
  RAISE NOTICE '============================================================================';
END $$;
