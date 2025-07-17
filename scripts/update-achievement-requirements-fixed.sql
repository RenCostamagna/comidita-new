-- ============================================================================
-- ACTUALIZACIÓN DE REQUISITOS DE LOGROS
-- Script para actualizar los requisitos de reseñas en todos los logros
-- ============================================================================

-- Mostrar estado actual antes del cambio
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ACTUALIZANDO REQUISITOS DE LOGROS POR CATEGORÍA';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CAMBIOS A APLICAR:';
  RAISE NOTICE '• Nivel 1: 3 → 2 reseñas';
  RAISE NOTICE '• Nivel 2: 10 → 4 reseñas';
  RAISE NOTICE '• Nivel 3: 25 → 6 reseñas';
  RAISE NOTICE '• Nivel 4: 50 → 10 reseñas';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ESTADO ACTUAL:';
END $$;

-- Mostrar estado actual
SELECT 
  category as categoria,
  level as nivel,
  name as nombre,
  required_reviews as requisitos_actuales,
  points_reward as puntos
FROM category_achievements 
ORDER BY category, level;

-- Actualizar requisitos para todos los logros
UPDATE category_achievements 
SET required_reviews = CASE 
  WHEN level = 1 THEN 2
  WHEN level = 2 THEN 4
  WHEN level = 3 THEN 6
  WHEN level = 4 THEN 10
  ELSE required_reviews
END;

-- Verificar los cambios aplicados
DO $$
DECLARE
  total_updated INTEGER;
  level1_count INTEGER;
  level2_count INTEGER;
  level3_count INTEGER;
  level4_count INTEGER;
BEGIN
  -- Contar logros actualizados por nivel
  SELECT COUNT(*) INTO level1_count FROM category_achievements WHERE level = 1 AND required_reviews = 2;
  SELECT COUNT(*) INTO level2_count FROM category_achievements WHERE level = 2 AND required_reviews = 4;
  SELECT COUNT(*) INTO level3_count FROM category_achievements WHERE level = 3 AND required_reviews = 6;
  SELECT COUNT(*) INTO level4_count FROM category_achievements WHERE level = 4 AND required_reviews = 10;
  
  total_updated := level1_count + level2_count + level3_count + level4_count;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ACTUALIZACIÓN COMPLETADA';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Logros actualizados por nivel:';
  RAISE NOTICE '• Nivel 1 (2 reseñas): % logros', level1_count;
  RAISE NOTICE '• Nivel 2 (4 reseñas): % logros', level2_count;
  RAISE NOTICE '• Nivel 3 (6 reseñas): % logros', level3_count;
  RAISE NOTICE '• Nivel 4 (10 reseñas): % logros', level4_count;
  RAISE NOTICE '• Total actualizado: % logros', total_updated;
  RAISE NOTICE '============================================================================';
END $$;

-- Mostrar estado final
DO $$
BEGIN
  RAISE NOTICE 'ESTADO FINAL DE LOGROS:';
END $$;

SELECT 
  category as categoria,
  level as nivel,
  name as nombre,
  required_reviews as nuevos_requisitos,
  points_reward as puntos
FROM category_achievements 
ORDER BY category, level;

-- Verificar que todos los logros tienen los nuevos requisitos
DO $$
DECLARE
  incorrect_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO incorrect_count
  FROM category_achievements
  WHERE (level = 1 AND required_reviews != 2)
     OR (level = 2 AND required_reviews != 4)
     OR (level = 3 AND required_reviews != 6)
     OR (level = 4 AND required_reviews != 10);
  
  IF incorrect_count > 0 THEN
    RAISE WARNING 'ATENCIÓN: % logros no tienen los requisitos correctos', incorrect_count;
  ELSE
    RAISE NOTICE '✅ Todos los logros tienen los requisitos correctos';
  END IF;
END $$;

-- Mostrar resumen por categoría
DO $$
BEGIN
  RAISE NOTICE 'RESUMEN POR CATEGORÍA:';
END $$;

SELECT 
  category as categoria,
  COUNT(*) as total_logros,
  STRING_AGG(required_reviews::TEXT, ', ' ORDER BY level) as requisitos_por_nivel
FROM category_achievements 
GROUP BY category 
ORDER BY category;

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '🎉 ACTUALIZACIÓN DE REQUISITOS COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '============================================================================';
END $$;
