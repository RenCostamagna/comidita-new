-- Actualizar el esquema de la base de datos para soportar puntuaciones de 1 a 10

-- Actualizar las restricciones de la tabla detailed_reviews
ALTER TABLE detailed_reviews 
DROP CONSTRAINT IF EXISTS detailed_reviews_food_taste_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_presentation_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_portion_size_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_drinks_variety_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_veggie_options_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_gluten_free_options_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_vegan_options_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_music_acoustics_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_ambiance_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_furniture_comfort_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_cleanliness_check,
DROP CONSTRAINT IF EXISTS detailed_reviews_service_check;

-- Agregar nuevas restricciones para puntuaciones de 1 a 10
ALTER TABLE detailed_reviews 
ADD CONSTRAINT detailed_reviews_food_taste_check CHECK (food_taste >= 1 AND food_taste <= 10),
ADD CONSTRAINT detailed_reviews_presentation_check CHECK (presentation >= 1 AND presentation <= 10),
ADD CONSTRAINT detailed_reviews_portion_size_check CHECK (portion_size >= 1 AND portion_size <= 10),
ADD CONSTRAINT detailed_reviews_drinks_variety_check CHECK (drinks_variety >= 1 AND drinks_variety <= 10),
ADD CONSTRAINT detailed_reviews_veggie_options_check CHECK (veggie_options >= 1 AND veggie_options <= 10),
ADD CONSTRAINT detailed_reviews_gluten_free_options_check CHECK (gluten_free_options >= 1 AND gluten_free_options <= 10),
ADD CONSTRAINT detailed_reviews_vegan_options_check CHECK (vegan_options >= 1 AND vegan_options <= 10),
ADD CONSTRAINT detailed_reviews_music_acoustics_check CHECK (music_acoustics >= 1 AND music_acoustics <= 10),
ADD CONSTRAINT detailed_reviews_ambiance_check CHECK (ambiance >= 1 AND ambiance <= 10),
ADD CONSTRAINT detailed_reviews_furniture_comfort_check CHECK (furniture_comfort >= 1 AND furniture_comfort <= 10),
ADD CONSTRAINT detailed_reviews_cleanliness_check CHECK (cleanliness >= 1 AND cleanliness <= 10),
ADD CONSTRAINT detailed_reviews_service_check CHECK (service >= 1 AND service <= 10);

-- Actualizar la función de cálculo de rating promedio para la nueva escala
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

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ACTUALIZACIÓN DE ESCALA DE PUNTUACIÓN COMPLETADA';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Las puntuaciones ahora van de 1 a 10 en lugar de 1 a 5';
  RAISE NOTICE 'Se han actualizado las restricciones de la base de datos';
  RAISE NOTICE 'Se ha actualizado la función de cálculo de rating promedio';
  RAISE NOTICE '============================================================================';
END $$;
