-- ============================================================================
-- COMIDITA - CONFIGURACIÓN COMPLETA DE BASE DE DATOS
-- Script unificado que incluye todas las tablas, funciones, triggers y datos
-- ============================================================================

-- ============================================================================
-- 1. CREAR TABLAS PRINCIPALES
-- ============================================================================

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de lugares
CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  website TEXT,
  rating DECIMAL(2, 1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  category TEXT,
  average_price_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reseñas simples
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

-- Crear tabla de reseñas detalladas (con puntuaciones de 1 a 10)
CREATE TABLE IF NOT EXISTS detailed_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  dish_name TEXT,
  
  -- Puntuaciones del 1 al 10
  food_taste INTEGER CHECK (food_taste >= 1 AND food_taste <= 10),
  presentation INTEGER CHECK (presentation >= 1 AND presentation <= 10),
  portion_size INTEGER CHECK (portion_size >= 1 AND presentation <= 10),
  drinks_variety INTEGER CHECK (drinks_variety >= 1 AND drinks_variety <= 10),
  veggie_options INTEGER CHECK (veggie_options >= 1 AND veggie_options <= 10),
  gluten_free_options INTEGER CHECK (gluten_free_options >= 1 AND gluten_free_options <= 10),
  vegan_options INTEGER CHECK (vegan_options >= 1 AND vegan_options <= 10),
  music_acoustics INTEGER CHECK (music_acoustics >= 1 AND music_acoustics <= 10),
  ambiance INTEGER CHECK (ambiance >= 1 AND ambiance <= 10),
  furniture_comfort INTEGER CHECK (furniture_comfort >= 1 AND furniture_comfort <= 10),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 10),
  service INTEGER CHECK (service >= 1 AND service <= 10),
  
  -- Rango de precio
  price_range TEXT CHECK (price_range IN (
    'under_10000',
    '10000_15000', 
    '15000_20000',
    '20000_30000',
    '30000_50000',
    '50000_80000',
    'over_80000'
  )),
  
  -- Categoría del restaurante
  restaurant_category TEXT CHECK (restaurant_category IN (
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
  
  -- URLs de fotos
  photo_1_url TEXT,
  photo_2_url TEXT,
  
  -- Comentario general
  comment TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, place_id)
);

-- Crear tabla de niveles/rangos de usuarios
CREATE TABLE IF NOT EXISTS user_levels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  max_points INTEGER,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '🌟',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para historial de puntos
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

-- Crear tabla de logros por categoría
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

-- Crear tabla de logros desbloqueados por usuario
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES category_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================================================
-- 2. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_places_location ON places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detailed_reviews_place_id ON detailed_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_detailed_reviews_user_id ON detailed_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_detailed_reviews_created_at ON detailed_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_user_levels_points ON user_levels(min_points);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_review_id ON points_history(review_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_category_achievements_category ON category_achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);

-- ============================================================================
-- 3. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE detailed_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all to view users" ON users;
DROP POLICY IF EXISTS "Allow all to insert users" ON users;
DROP POLICY IF EXISTS "Allow all to update users" ON users;
DROP POLICY IF EXISTS "Allow all to view places" ON places;
DROP POLICY IF EXISTS "Allow all to insert places" ON places;
DROP POLICY IF EXISTS "Allow all to update places" ON places;
DROP POLICY IF EXISTS "Allow all to view reviews" ON reviews;
DROP POLICY IF EXISTS "Allow all to insert reviews" ON reviews;
DROP POLICY IF EXISTS "Allow all to update reviews" ON reviews;
DROP POLICY IF EXISTS "Allow all to delete reviews" ON reviews;
DROP POLICY IF EXISTS "Allow all to view detailed reviews" ON detailed_reviews;
DROP POLICY IF EXISTS "Allow all to insert detailed reviews" ON detailed_reviews;
DROP POLICY IF EXISTS "Allow all to update detailed reviews" ON detailed_reviews;
DROP POLICY IF EXISTS "Allow all to delete detailed reviews" ON detailed_reviews;
DROP POLICY IF EXISTS "Allow all to view category achievements" ON category_achievements;
DROP POLICY IF EXISTS "Allow all to view user achievements" ON user_achievements;
DROP POLICY IF EXISTS "Allow all to insert user achievements" ON user_achievements;

-- Políticas permisivas para desarrollo
CREATE POLICY "Allow all to view users" ON users FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert users" ON users FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update users" ON users FOR UPDATE TO public USING (true);

CREATE POLICY "Allow all to view places" ON places FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert places" ON places FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update places" ON places FOR UPDATE TO public USING (true);

CREATE POLICY "Allow all to view reviews" ON reviews FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert reviews" ON reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update reviews" ON reviews FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all to delete reviews" ON reviews FOR DELETE TO public USING (true);

CREATE POLICY "Allow all to view detailed reviews" ON detailed_reviews FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert detailed reviews" ON detailed_reviews FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all to update detailed reviews" ON detailed_reviews FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all to delete detailed reviews" ON detailed_reviews FOR DELETE TO public USING (true);

CREATE POLICY "Allow all to view category achievements" ON category_achievements FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to view user achievements" ON user_achievements FOR SELECT TO public USING (true);
CREATE POLICY "Allow all to insert user achievements" ON user_achievements FOR INSERT TO public WITH CHECK (true);

-- ============================================================================
-- 4. CONFIGURAR SUPABASE STORAGE PARA FOTOS
-- ============================================================================

-- Crear bucket para fotos de reseñas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas existentes de storage
DROP POLICY IF EXISTS "Allow all operations on review photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload review photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow view review photos" ON storage.objects;

-- Políticas permisivas para storage
CREATE POLICY "Allow all operations on review photos" ON storage.objects
FOR ALL TO public USING (bucket_id = 'review-photos');

CREATE POLICY "Allow upload review photos" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id = 'review-photos');

CREATE POLICY "Allow view review photos" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'review-photos');

-- ============================================================================
-- 5. INSERTAR DATOS INICIALES
-- ============================================================================

-- Insertar niveles del sistema de puntuación (corregidos)
DELETE FROM user_levels;
INSERT INTO user_levels (name, min_points, max_points, color, icon) VALUES
('Novato Gourmet', 0, 999, '#6B7280', '🍽️'),
('Comensal Curioso', 1000, 2499, '#8B5CF6', '👀'),
('Crítico Casual', 2500, 4999, '#3B82F6', '📱'),
('Catador Urbano', 5000, 9999, '#F59E0B', '🍷'),
('Experto Gastronómico', 10000, 19999, '#EF4444', '👨‍🍳'),
('Maestro del Paladar', 20000, NULL, '#DC2626', '🔥');

-- Insertar todos los logros por categoría
DELETE FROM category_achievements;

-- PARRILLAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('PARRILLAS', 1, 'Asador Novato', 'Primeros pasos en el mundo de las parrillas', 2, 150, '🥩', '#EF4444'),
('PARRILLAS', 2, 'Catador de Achuras', 'Ya conoces los secretos de la parrilla', 4, 300, '🔥', '#DC2626'),
('PARRILLAS', 3, 'Maestro del Asado', 'Dominas el arte del asado argentino', 6, 600, '👨‍🍳', '#B91C1C'),
('PARRILLAS', 4, 'Parrillero Consagrado', 'Leyenda viviente de las parrillas', 10, 1000, '👑', '#991B1B');

-- CAFÉ Y DELI
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('CAFE_Y_DELI', 1, 'Tostado Inicial', 'Comenzando tu ruta cafetera', 2, 150, '☕', '#F59E0B'),
('CAFE_Y_DELI', 2, 'Cafetero Frecuente', 'El café ya es parte de tu rutina', 4, 300, '🫘', '#D97706'),
('CAFE_Y_DELI', 3, 'Fan de los Brunches', 'Experto en desayunos y meriendas', 6, 600, '🥐', '#B45309'),
('CAFE_Y_DELI', 4, 'Experto en Flat White', 'Maestro de todas las preparaciones', 10, 1000, '🎯', '#92400E');

-- BODEGONES
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('BODEGONES', 1, 'Plato del Día', 'Descubriendo la tradición porteña', 2, 150, '🍽️', '#3B82F6'),
('BODEGONES', 2, 'Tradición y Sabor', 'Conocedor de la cocina tradicional', 4, 300, '🏠', '#2563EB'),
('BODEGONES', 3, 'Cliente de la Casa', 'Ya eres parte de la familia', 6, 600, '❤️', '#1D4ED8'),
('BODEGONES', 4, 'Bodegonero Legendario', 'Guardián de las tradiciones culinarias', 10, 1000, '🏆', '#1E40AF');

-- RESTAURANTES
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('RESTAURANTES', 1, 'Comensal Formal', 'Iniciando en la alta gastronomía', 2, 150, '🍷', '#8B5CF6'),
('RESTAURANTES', 2, 'Foodie Activo', 'Explorador de nuevos sabores', 4, 300, '🌟', '#7C3AED'),
('RESTAURANTES', 3, 'Crítico Profesional', 'Tu paladar es tu mejor herramienta', 6, 600, '📝', '#6D28D9'),
('RESTAURANTES', 4, 'Gourmet Internacional', 'Conocedor de cocinas del mundo', 10, 1000, '🌍', '#5B21B6');

-- HAMBURGUESERÍAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('HAMBURGUESERIAS', 1, 'Triple con Cheddar', 'Primer mordisco al mundo burger', 2, 150, '🍔', '#F97316'),
('HAMBURGUESERIAS', 2, 'Ruta de la Hamburguesa', 'Cazador de las mejores burgers', 4, 300, '🛣️', '#EA580C'),
('HAMBURGUESERIAS', 3, 'Fanático del Smashed', 'Conoces todos los estilos', 6, 600, '🔨', '#DC2626'),
('HAMBURGUESERIAS', 4, 'Rey del Pan Brioche', 'Emperador de las hamburguesas', 10, 1000, '👑', '#B91C1C');

-- PIZZERÍAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('PIZZERIAS', 1, 'Fugazzeta Inicial', 'Comenzando tu amor por la pizza', 2, 150, '🍕', '#10B981'),
('PIZZERIAS', 2, 'Fan de la Muzza', 'La mozzarella no tiene secretos', 4, 300, '🧀', '#059669'),
('PIZZERIAS', 3, 'Maestro Pizzero', 'Conoces todas las variedades', 6, 600, '👨‍🍳', '#047857'),
('PIZZERIAS', 4, 'Campeón de la Fainá', 'Leyenda de las pizzerías porteñas', 10, 1000, '🏆', '#065F46');

-- PASTAS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('PASTAS', 1, 'Raviolero Casual', 'Primeros pasos en el mundo de las pastas', 2, 150, '🍝', '#EC4899'),
('PASTAS', 2, 'Amante de la Salsita', 'Las salsas ya no tienen secretos', 4, 300, '🍅', '#DB2777'),
('PASTAS', 3, 'Catador de Ñoquis', 'Experto en todas las formas', 6, 600, '🥟', '#BE185D'),
('PASTAS', 4, 'Emperador de la Pasta', 'Maestro de la tradición italiana', 10, 1000, '👑', '#9D174D');

-- CARRITOS
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('CARRITOS', 1, 'Callejero Nivel 1', 'Descubriendo la comida de la calle', 2, 150, '🚚', '#8B5CF6'),
('CARRITOS', 2, 'Ruta Street Food', 'Explorador de sabores urbanos', 4, 300, '🛣️', '#7C3AED'),
('CARRITOS', 3, 'Campeón de la Choriloca', 'Conoces todos los carritos', 6, 600, '🌭', '#6D28D9'),
('CARRITOS', 4, 'Leyenda del Trailer', 'Rey de la comida callejera', 10, 1000, '👑', '#5B21B6');

-- BARES
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('BARES', 1, 'Primer After', 'Iniciando en la vida nocturna', 2, 150, '🍺', '#F59E0B'),
('BARES', 2, 'Fan de las IPAs', 'Conocedor de cervezas artesanales', 4, 300, '🍻', '#D97706'),
('BARES', 3, 'Crítico de Cervezas', 'Tu paladar distingue cada estilo', 6, 600, '🎯', '#B45309'),
('BARES', 4, 'Maestro del After Office', 'Leyenda de los after office', 10, 1000, '🏆', '#92400E');

-- ============================================================================
-- 6. CREAR FUNCIONES
-- ============================================================================

-- Función para obtener el nivel detallado de un usuario
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

-- Función para obtener todos los niveles
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

-- Función para obtener estadísticas de niveles
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

-- Función para mantener compatibilidad
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

-- Función para calcular puntos detallados
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

-- Función para registrar puntos en historial
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

-- Función para obtener desglose de puntos de una reseña
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

-- Función para actualizar rating de lugares
CREATE OR REPLACE FUNCTION update_place_rating_detailed()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el rating promedio y categoría más común del lugar
  UPDATE places 
  SET 
    rating = (
      SELECT COALESCE(AVG(
        (food_taste + presentation + portion_size + drinks_variety + 
         veggie_options + gluten_free_options + vegan_options + 
         music_acoustics + ambiance + furniture_comfort + 
         cleanliness + service) / 12.0
      ), 0)
      FROM detailed_reviews 
      WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM detailed_reviews 
      WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
    ),
    category = (
      SELECT restaurant_category
      FROM detailed_reviews 
      WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
      GROUP BY restaurant_category
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    average_price_range = (
      SELECT price_range
      FROM detailed_reviews 
      WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)
      GROUP BY price_range
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar nuevo usuario con manejo de conflictos y valores por defecto
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'display_name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url', 
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'photo_url',
      ''
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN EXCLUDED.full_name != '' THEN EXCLUDED.full_name 
      ELSE users.full_name 
    END,
    avatar_url = CASE 
      WHEN EXCLUDED.avatar_url != '' THEN EXCLUDED.avatar_url 
      ELSE users.avatar_url 
    END,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar la autenticación
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar puntos y verificar logros
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
  
  -- Verificar y otorgar logros si hay categoría
  IF place_category IS NOT NULL THEN
    SELECT * INTO new_achievements
    FROM check_and_grant_achievements(NEW.user_id, place_category);
    
    -- Log de nuevos logros
    IF jsonb_array_length(new_achievements) > 0 THEN
      RAISE NOTICE 'Usuario % desbloqueó % nuevos logros en categoría %', 
        NEW.id, jsonb_array_length(new_achievements), place_category;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para restar puntos al eliminar reseña
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
    
    -- Si cambió de nivel, registrar
    IF old_level.level_number != new_level.level_number THEN
      RAISE NOTICE 'Usuario % subió del nivel % al nivel %', 
        NEW.id, old_level.level_name, new_level.level_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para recalcular puntos de todos los usuarios
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
-- 7. CREAR TRIGGERS
-- ============================================================================

-- Eliminar triggers existentes
DROP TRIGGER IF EXISTS trigger_update_place_rating_detailed_insert ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_update_place_rating_detailed_update ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_update_place_rating_detailed_delete ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_add_points_on_review ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_add_points_on_review_detailed ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_subtract_points_on_review_delete ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_subtract_points_on_review_delete_detailed ON detailed_reviews;
DROP TRIGGER IF EXISTS trigger_check_level_change ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Triggers para actualizar rating de lugares
CREATE TRIGGER trigger_update_place_rating_detailed_insert
  AFTER INSERT ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_place_rating_detailed();

CREATE TRIGGER trigger_update_place_rating_detailed_update
  AFTER UPDATE ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_place_rating_detailed();

CREATE TRIGGER trigger_update_place_rating_detailed_delete
  AFTER DELETE ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_place_rating_detailed();

-- Trigger para puntos y logros
CREATE TRIGGER trigger_add_points_on_review_detailed
  AFTER INSERT ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points_and_achievements();

-- Trigger para restar puntos al eliminar
CREATE TRIGGER trigger_subtract_points_on_review_delete_detailed
  AFTER DELETE ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION subtract_user_points_detailed();

-- Trigger para detectar cambios de nivel
CREATE TRIGGER trigger_check_level_change
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_level_change();

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 8. EJECUTAR CONFIGURACIONES FINALES
-- ============================================================================

-- Ejecutar recálculo inicial de puntos
SELECT recalculate_all_user_points_detailed();

-- ============================================================================
-- 9. VERIFICACIONES Y MENSAJES FINALES
-- ============================================================================

-- Verificar que las tablas se crearon correctamente
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
  level_count INTEGER;
  achievement_count INTEGER;
  category_count INTEGER;
BEGIN
  -- Contar tablas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'places', 'reviews', 'detailed_reviews', 'user_levels', 'points_history', 'category_achievements', 'user_achievements');
  
  -- Contar funciones principales
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname IN (
    'get_user_level_detailed', 'get_all_user_levels', 'get_level_statistics', 'get_user_level',
    'calculate_detailed_review_points', 'record_points_history', 'check_and_grant_achievements',
    'get_category_achievements_progress', 'get_user_all_achievements', 'get_achievements_statistics',
    'update_place_rating_detailed', 'handle_new_user', 'update_user_points_and_achievements',
    'subtract_user_points_detailed', 'check_level_change', 'recalculate_all_user_points_detailed'
  );
  
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_name LIKE '%detailed%' OR trigger_name LIKE '%points%' OR trigger_name LIKE '%level%' OR trigger_name = 'on_auth_user_created';
  
  -- Contar niveles y logros
  SELECT COUNT(*) INTO level_count FROM user_levels;
  SELECT COUNT(*) INTO achievement_count FROM category_achievements;
  SELECT COUNT(DISTINCT category) INTO category_count FROM category_achievements;
  
  -- Mostrar resultados
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'COMIDITA - CONFIGURACIÓN COMPLETA DE BASE DE DATOS';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Tablas creadas: % de 8', table_count;
  RAISE NOTICE 'Funciones creadas: % de 16', function_count;
  RAISE NOTICE 'Triggers creados: %', trigger_count;
  RAISE NOTICE 'Niveles de usuario: %', level_count;
  RAISE NOTICE 'Logros por categoría: %', achievement_count;
  RAISE NOTICE 'Categorías con logros: %', category_count;
  RAISE NOTICE 'Storage bucket: review-photos configurado';
  RAISE NOTICE 'RLS: Políticas permisivas aplicadas';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CARACTERÍSTICAS IMPLEMENTADAS:';
  RAISE NOTICE '✅ Sistema de usuarios y autenticación';
  RAISE NOTICE '✅ Lugares y reseñas (puntuaciones 1-10)';
  RAISE NOTICE '✅ Sistema de puntos con historial detallado';
  RAISE NOTICE '✅ Niveles gastronómicos (6 niveles)';
  RAISE NOTICE '✅ Logros por categoría (36 logros totales)';
  RAISE NOTICE '✅ Almacenamiento de fotos';
  RAISE NOTICE '✅ Triggers automáticos para puntos y logros';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '🎉 ¡La base de datos está completamente configurada y lista para usar!';
  RAISE NOTICE '============================================================================';
END $$;

-- Mostrar resumen de niveles
RAISE NOTICE 'NIVELES DE USUARIO:';
SELECT 
  '🍽️ ' || name || ' (' || min_points::TEXT || 
  CASE WHEN max_points IS NULL THEN '+ puntos)' ELSE '-' || max_points::TEXT || ' puntos)' END as nivel
FROM user_levels ORDER BY min_points;

-- Mostrar resumen de categorías con logros
RAISE NOTICE 'CATEGORÍAS CON LOGROS:';
SELECT DISTINCT 
  CASE category
    WHEN 'PARRILLAS' THEN '🥩 Parrillas'
    WHEN 'CAFE_Y_DELI' THEN '☕ Café y Deli'
    WHEN 'BODEGONES' THEN '🍽️ Bodegones'
    WHEN 'RESTAURANTES' THEN '🍷 Restaurantes'
    WHEN 'HAMBURGUESERIAS' THEN '🍔 Hamburgueserías'
    WHEN 'PIZZERIAS' THEN '🍕 Pizzerías'
    WHEN 'PASTAS' THEN '🍝 Pastas'
    WHEN 'CARRITOS' THEN '🚚 Carritos'
    WHEN 'BARES' THEN '🍺 Bares'
  END || ' (4 logros)' as categoria
FROM category_achievements ORDER BY category;
