-- Migración: Ampliar tabla Optimizaciones
-- Ejecutar en la base de datos: sistema_carpinteria
-- Última actualización: 2026-05-12

ALTER TABLE Optimizaciones
  ADD COLUMN IF NOT EXISTS Descripcion      TEXT           NULL                AFTER Nombre,
  ADD COLUMN IF NOT EXISTS UltimaEjecucion  DATETIME       NULL                AFTER Fecha,
  ADD COLUMN IF NOT EXISTS CotizacionId     INT            NULL                AFTER UltimaEjecucion,
  ADD COLUMN IF NOT EXISTS MaterialId       INT            NOT NULL DEFAULT 0   AFTER CotizacionId,
  ADD COLUMN IF NOT EXISTS MaterialNombre   VARCHAR(200)   NOT NULL DEFAULT ''  AFTER MaterialId,
  ADD COLUMN IF NOT EXISTS TotalEjecuciones INT            NOT NULL DEFAULT 0   AFTER MaterialNombre;

-- Verificar resultado
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'sistema_carpinteria'
  AND TABLE_NAME   = 'Optimizaciones'
ORDER BY ORDINAL_POSITION;
