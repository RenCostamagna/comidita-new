-- ============================================================================
-- AGREGAR CATEGORÍA HELADERÍAS CON SUS LOGROS
-- Script para agregar la nueva categoría HELADERIAS y sus 4 logros
-- ============================================================================

-- Primero, actualizar las restricciones de la tabla para incluir HELADERIAS
ALTER TABLE detailed_reviews 
DROP CONSTRAINT IF EXISTS detailed_reviews_restaurant_category_check;

ALTER TABLE detailed_reviews 
ADD CONSTRAINT detailed_reviews_restaurant_category_check 
CHECK (restaurant_category IN (
  'PARRILLAS',
  'CAFE_Y_DELI',
  'BODEGONES', 
  'RESTAURANTES',
  'HAMBURGUESERIAS',
  'PIZZERIAS',
  'PASTAS',
  'CARRITOS',
  'BARES',
  'HELADERIAS'
));

-- Actualizar la restricción de la tabla category_achievements
ALTER TABLE category_achievements 
DROP CONSTRAINT IF EXISTS category_achievements_category_check;

ALTER TABLE category_achievements 
ADD CONSTRAINT category_achievements_category_check 
CHECK (category IN (
  'PARRILLAS',
  'CAFE_Y_DELI',
  'BODEGONES', 
  'RESTAURANTES',
  'HAMBURGUESERIAS',
  'PIZZERIAS',
  'PASTAS',
  'CARRITOS',
  'BARES',
  'HELADERIAS'
));

-- Insertar los logros de HELADERIAS con los nombres específicos solicitados
INSERT INTO category_achievements (category, level, name, description, required_reviews, points_reward, icon, color) VALUES
('HELADERIAS', 1, 'Degustador de Sabores', 'Primeros pasos en el mundo de las heladerías', 2, 150, '🍦', '#EC4899'),
('HELADERIAS', 2, 'Fan del Dulce de Leche', 'El dulce de leche ya no tiene secretos', 4, 300, '🍨', '#DB2777'),
('HELADERIAS', 3, 'Explorador de Sabores Clásicos', 'Conoces todos los sabores tradicionales', 6, 600, '🧁', '#BE185D'),
('HELADERIAS', 4, 'Maestro Heladero', 'Leyenda de las heladerías rosarinas', 10, 1000, '👑', '#9D174D');

-- Verificar que los logros se insertaron correctamente
SELECT 
  category,
  level,
  name,
  description,
  required_reviews,
  points_reward,
  icon,
  color
FROM category_achievements 
WHERE category = 'HELADERIAS'
ORDER BY level;

-- Mostrar resumen de todas las categorías con logros
SELECT 
  category,
  COUNT(*) as total_achievements,
  MIN(required_reviews) as min_reviews_required,
  MAX(required_reviews) as max_reviews_required,
  SUM(points_reward) as total_points_available
FROM category_achievements 
GROUP BY category
ORDER BY category;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ CATEGORÍA HELADERÍAS AGREGADA EXITOSAMENTE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '🍦 Degustador de Sabores (Nivel 1) - 2 reseñas - 150 puntos';
  RAISE NOTICE '🍨 Fan del Dulce de Leche (Nivel 2) - 4 reseñas - 300 puntos';
  RAISE NOTICE '🧁 Explorador de Sabores Clásicos (Nivel 3) - 6 reseñas - 600 puntos';
  RAISE NOTICE '👑 Maestro Heladero (Nivel 4) - 10 reseñas - 1000 puntos';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '📊 Total de categorías con logros: 10';
  RAISE NOTICE '🏆 Total de logros disponibles: 40';
  RAISE NOTICE '============================================================================';
END $$;
