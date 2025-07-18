-- Eliminar la columna wait_time de detailed_reviews
ALTER TABLE detailed_reviews 
DROP COLUMN IF EXISTS wait_time;

-- Comentario para documentar el cambio
-- Se eliminó la puntuación de "Demora" por decisión del producto
