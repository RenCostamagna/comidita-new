-- COMIDITA - SCRIPT COMPLETO DE BASE DE DATOS
-- Este script incluye todas las tablas, funciones, triggers y configuraciones necesarias

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

-- Crear tabla de reseñas detalladas
CREATE TABLE IF NOT EXISTS detailed_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  dish_name TEXT,
  
  -- Puntuaciones del 1 al 5
  food_taste INTEGER CHECK (food_taste >= 1 AND food_taste <= 5),
  presentation INTEGER CHECK (presentation >= 1 AND presentation <= 5),
  portion_size INTEGER CHECK (portion_size >= 1 AND portion_size <= 5),
  drinks_variety INTEGER CHECK (drinks_variety >= 1 AND drinks_variety <= 5),
  veggie_options INTEGER CHECK (veggie_options >= 1 AND veggie_options <= 5),
  gluten_free_options INTEGER CHECK (gluten_free_options >= 1 AND gluten_free_options <= 5),
  vegan_options INTEGER CHECK (vegan_options >= 1 AND vegan_options <= 5),
  music_acoustics INTEGER CHECK (music_acoustics >= 1 AND music_acoustics <= 5),
  ambiance INTEGER CHECK (ambiance >= 1 AND ambiance <= 5),
  furniture_comfort INTEGER CHECK (furniture_comfort >= 1 AND furniture_comfort <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  service INTEGER CHECK (service >= 1 AND service <= 5),
  
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

-- ============================================================================
-- 3. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE detailed_reviews ENABLE ROW LEVEL SECURITY;

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

-- Insertar niveles del sistema de puntuación
INSERT INTO user_levels (name, min_points, max_points, color, icon) VALUES
('Nuevo', 0, 999, '#6B7280', '🥚'),
('Principiante', 1000, 4999, '#10B981', '🌱'),
('Explorador', 5000, 9999, '#3B82F6', '🗺️'),
('Conocedor', 10000, 24999, '#8B5CF6', '🎯'),
('Experto', 25000, 49999, '#F59E0B', '⭐'),
('Maestro', 50000, 99999, '#EF4444', '👑'),
('Leyenda', 100000, NULL, '#DC2626', '🏆')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. CREAR FUNCIONES
-- ============================================================================

-- Función para obtener el nivel de un usuario
CREATE OR REPLACE FUNCTION get_user_level(user_points INTEGER)
RETURNS TABLE(
  level_name TEXT,
  level_color TEXT,
  level_icon TEXT,
  min_points INTEGER,
  max_points INTEGER,
  progress_percentage NUMERIC
) AS $$
DECLARE
  current_level RECORD;
BEGIN
  -- Obtener el nivel actual del usuario
  SELECT * INTO current_level
  FROM user_levels
  WHERE user_points >= min_points 
    AND (max_points IS NULL OR user_points <= max_points)
  ORDER BY min_points DESC
  LIMIT 1;
  
  IF current_level IS NULL THEN
    -- Fallback al primer nivel
    SELECT * INTO current_level FROM user_levels ORDER BY min_points ASC LIMIT 1;
  END IF;
  
  -- Calcular porcentaje de progreso
  RETURN QUERY SELECT 
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
    END;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntos de una reseña
CREATE OR REPLACE FUNCTION calculate_review_points(place_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  base_points INTEGER := 100;
  bonus_points INTEGER := 0;
  total_reviews INTEGER;
BEGIN
  -- Verificar si es la primera reseña del lugar
  SELECT COUNT(*) INTO total_reviews
  FROM detailed_reviews
  WHERE place_id = place_id_param;
  
  -- Si es la primera reseña, agregar bonus
  IF total_reviews = 0 THEN
    bonus_points := 1000;
  END IF;
  
  RETURN base_points + bonus_points;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el rating promedio de un lugar (reseñas detalladas)
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

-- Función para actualizar puntos del usuario
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER;
BEGIN
  -- Calcular puntos para esta reseña
  points_to_add := calculate_review_points(NEW.place_id);
  
  -- Actualizar puntos del usuario
  UPDATE users 
  SET 
    points = COALESCE(points, 0) + points_to_add,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para restar puntos cuando se elimina una reseña
CREATE OR REPLACE FUNCTION subtract_user_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_subtract INTEGER;
BEGIN
  -- Calcular puntos que se deben restar
  points_to_subtract := calculate_review_points(OLD.place_id);
  
  -- Restar puntos del usuario
  UPDATE users 
  SET 
    points = GREATEST(COALESCE(points, 0) - points_to_subtract, 0),
    updated_at = NOW()
  WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Función mejorada para manejar nuevos usuarios
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

-- Función para recalcular puntos de todos los usuarios
CREATE OR REPLACE FUNCTION recalculate_all_user_points()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
  total_points INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    -- Calcular puntos totales para este usuario
    SELECT COALESCE(SUM(
      CASE 
        WHEN (SELECT COUNT(*) FROM detailed_reviews dr2 
              WHERE dr2.place_id = dr.place_id 
              AND dr2.created_at < dr.created_at) = 0 
        THEN 1100  -- Primera reseña del lugar
        ELSE 100   -- Reseña normal
      END
    ), 0) INTO total_points
    FROM detailed_reviews dr
    WHERE dr.user_id = user_record.id;
    
    -- Actualizar puntos del usuario
    UPDATE users 
    SET points = total_points 
    WHERE id = user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Puntos recalculados para todos los usuarios';
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
DROP TRIGGER IF EXISTS trigger_subtract_points_on_review_delete ON detailed_reviews;
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

-- Triggers para sistema de puntos
CREATE TRIGGER trigger_add_points_on_review
  AFTER INSERT ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();

CREATE TRIGGER trigger_subtract_points_on_review_delete
  AFTER DELETE ON detailed_reviews
  FOR EACH ROW
  EXECUTE FUNCTION subtract_user_points();

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 8. EJECUTAR CONFIGURACIONES FINALES
-- ============================================================================

-- Ejecutar recálculo inicial de puntos
SELECT recalculate_all_user_points();

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
BEGIN
  -- Contar tablas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('users', 'places', 'reviews', 'detailed_reviews', 'user_levels');
  
  -- Contar funciones
  SELECT COUNT(*) INTO function_count
  FROM pg_proc 
  WHERE proname IN ('get_user_level', 'calculate_review_points', 'update_place_rating_detailed', 
                    'update_user_points', 'subtract_user_points', 'handle_new_user', 'recalculate_all_user_points');
  
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_name LIKE '%detailed%' OR trigger_name LIKE '%points%' OR trigger_name = 'on_auth_user_created';
  
  -- Contar niveles
  SELECT COUNT(*) INTO level_count FROM user_levels;
  
  -- Mostrar resultados
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'COMIDITA - CONFIGURACIÓN DE BASE DE DATOS COMPLETADA';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Tablas creadas: % de 5', table_count;
  RAISE NOTICE 'Funciones creadas: % de 7', function_count;
  RAISE NOTICE 'Triggers creados: %', trigger_count;
  RAISE NOTICE 'Niveles de usuario: %', level_count;
  RAISE NOTICE 'Storage bucket: review-photos configurado';
  RAISE NOTICE 'RLS: Políticas permisivas aplicadas';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'La base de datos está lista para usar con Comidita!';
  RAISE NOTICE '============================================================================';
END $$;
