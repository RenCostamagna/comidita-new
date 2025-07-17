-- ============================================================================
-- ACTUALIZACIÓN DE ESQUEMA PARA OPCIONES DIETÉTICAS
-- Eliminar campos de puntuación y agregar campos booleanos informativos
-- ============================================================================

-- Agregar nuevos campos booleanos para opciones dietéticas
ALTER TABLE detailed_reviews 
ADD COLUMN IF NOT EXISTS celiac_friendly BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vegetarian_friendly BOOLEAN DEFAULT FALSE;

-- Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_detailed_reviews_celiac_friendly ON detailed_reviews(celiac_friendly);
CREATE INDEX IF NOT EXISTS idx_detailed_reviews_vegetarian_friendly ON detailed_reviews(vegetarian_friendly);

-- Actualizar función de cálculo de puntos para excluir los campos eliminados
CREATE OR REPLACE FUNCTION update_place_rating_detailed()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el rating promedio excluyendo los campos de opciones dietéticas
  UPDATE places 
  SET 
    rating = (
      SELECT COALESCE(AVG(
        (food_taste + presentation + portion_size + drinks_variety + 
         music_acoustics + ambiance + furniture_comfort + 
         cleanliness + service) / 9.0  -- Ahora son 9 campos en lugar de 12
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

-- Verificar que los cambios se aplicaron correctamente
DO $$
BEGIN
  -- Verificar que las columnas existen
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'detailed_reviews' 
    AND column_name IN ('celiac_friendly', 'vegetarian_friendly')
  ) THEN
    RAISE NOTICE '✅ Nuevas columnas agregadas correctamente';
  ELSE
    RAISE WARNING '❌ Error: Las nuevas columnas no se agregaron';
  END IF;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ACTUALIZACIÓN DE ESQUEMA COMPLETADA';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '• Agregadas columnas: celiac_friendly, vegetarian_friendly';
  RAISE NOTICE '• Actualizada función de cálculo de rating (9 campos en lugar de 12)';
  RAISE NOTICE '• Creados índices para los nuevos campos';
  RAISE NOTICE '============================================================================';
END $$;
