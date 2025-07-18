-- Actualizar el esquema de puntuaciones en detailed_reviews
-- Eliminar columnas drinks_variety y cleanliness, agregar wait_time

ALTER TABLE detailed_reviews 
DROP COLUMN IF EXISTS drinks_variety,
DROP COLUMN IF EXISTS cleanliness,
ADD COLUMN IF NOT EXISTS wait_time INTEGER DEFAULT 5 CHECK (wait_time >= 1 AND wait_time <= 10);

-- Actualizar comentarios de las columnas existentes
COMMENT ON COLUMN detailed_reviews.food_taste IS 'Puntuación del sabor de la comida (1-10)';
COMMENT ON COLUMN detailed_reviews.presentation IS 'Puntuación de la presentación del plato (1-10)';
COMMENT ON COLUMN detailed_reviews.portion_size IS 'Puntuación del tamaño de la porción (1-10)';
COMMENT ON COLUMN detailed_reviews.wait_time IS 'Puntuación de la demora en el servicio (1-10)';
COMMENT ON COLUMN detailed_reviews.music_acoustics IS 'Puntuación de música y acústica (1-10)';
COMMENT ON COLUMN detailed_reviews.ambiance IS 'Puntuación de la ambientación (1-10)';
COMMENT ON COLUMN detailed_reviews.furniture_comfort IS 'Puntuación del confort del mobiliario (1-10)';
COMMENT ON COLUMN detailed_reviews.service IS 'Puntuación del servicio de mesa (1-10)';
