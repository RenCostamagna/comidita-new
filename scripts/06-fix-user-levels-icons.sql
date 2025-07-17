-- CORRECCIÓN DE ICONOS EN NIVELES DE USUARIO
-- Arregla los emojis que se mostraban como códigos hexadecimales

-- ============================================================================
-- 1. CORREGIR LOS ICONOS DE LOS NIVELES
-- ============================================================================

-- Actualizar los niveles con los emojis correctos
UPDATE user_levels SET 
  icon = '🍽️',
  color = '#6B7280'
WHERE name = 'Novato Gourmet';

UPDATE user_levels SET 
  icon = '👀',
  color = '#8B5CF6'
WHERE name = 'Comensal Curioso';

UPDATE user_levels SET 
  icon = '📱',
  color = '#3B82F6'
WHERE name = 'Crítico Casual';

UPDATE user_levels SET 
  icon = '🍷',
  color = '#F59E0B'
WHERE name = 'Catador Urbano';

UPDATE user_levels SET 
  icon = '👨‍🍳',
  color = '#EF4444'
WHERE name = 'Experto Gastronómico';

UPDATE user_levels SET 
  icon = '🔥',
  color = '#DC2626'
WHERE name = 'Maestro del Paladar';

-- ============================================================================
-- 2. VERIFICAR QUE LOS CAMBIOS SE APLICARON CORRECTAMENTE
-- ============================================================================

-- Mostrar los niveles actualizados
SELECT 
  name as "Nivel",
  icon as "Emoji",
  color as "Color",
  min_points as "Puntos Mínimos",
  CASE 
    WHEN max_points IS NULL THEN 'Sin límite'
    ELSE max_points::TEXT
  END as "Puntos Máximos"
FROM user_levels 
ORDER BY min_points;

-- ============================================================================
-- 3. MENSAJE DE CONFIRMACIÓN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ICONOS DE NIVELES CORREGIDOS EXITOSAMENTE';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Los emojis ahora se mostrarán correctamente en lugar de códigos hexadecimales';
  RAISE NOTICE 'Niveles actualizados:';
  RAISE NOTICE '🍽️ Novato Gourmet';
  RAISE NOTICE '👀 Comensal Curioso'; 
  RAISE NOTICE '📱 Crítico Casual';
  RAISE NOTICE '🍷 Catador Urbano';
  RAISE NOTICE '👨‍🍳 Experto Gastronómico';
  RAISE NOTICE '🔥 Maestro del Paladar';
  RAISE NOTICE '============================================================================';
END $$;
