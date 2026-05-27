-- ============================================================
-- MIGRACIÓN v2: Cotizaciones con materiales reales y ganancia
-- Ejecutar en WAMP / sistema_carpinteria
-- ============================================================

-- 1. Nuevas columnas en cotizaciones
ALTER TABLE Cotizaciones
  ADD COLUMN IF NOT EXISTS descripcion_general   TEXT          NULL                     AFTER estado,
  ADD COLUMN IF NOT EXISTS tipo_acabado          VARCHAR(50)   NULL    DEFAULT 'normal'  AFTER descripcion_general,
  ADD COLUMN IF NOT EXISTS porcentaje_ganancia   DECIMAL(5,2)  NOT NULL DEFAULT 35.00    AFTER tipo_acabado,
  ADD COLUMN IF NOT EXISTS subtotal_costos       DECIMAL(12,2) NOT NULL DEFAULT 0        AFTER porcentaje_ganancia,
  ADD COLUMN IF NOT EXISTS monto_ganancia        DECIMAL(12,2) NOT NULL DEFAULT 0        AFTER subtotal_costos,
  ADD COLUMN IF NOT EXISTS total_mano_obra       DECIMAL(12,2) NOT NULL DEFAULT 0        AFTER monto_ganancia,
  ADD COLUMN IF NOT EXISTS tiempo_estimado_dias  INT           NULL                      AFTER total_mano_obra,
  ADD COLUMN IF NOT EXISTS observaciones         TEXT          NULL                      AFTER tiempo_estimado_dias,
  ADD COLUMN IF NOT EXISTS terminos              TEXT          NULL                      AFTER observaciones;

-- 2. Materiales por cotización (reemplaza piezas_corte en cotizaciones)
CREATE TABLE IF NOT EXISTS cotizacion_materiales (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  cotizacion_id     INT           NOT NULL,
  material_id       INT           NOT NULL,
  descripcion       VARCHAR(300)  NULL,
  cantidad_planchas DECIMAL(10,3) NOT NULL DEFAULT 1,
  porcentaje_uso    DECIMAL(5,2)  NOT NULL DEFAULT 100.00,
  precio_unitario   DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at        DATETIME      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (cotizacion_id) REFERENCES Cotizaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id)   REFERENCES Materiales(id)
);

-- 3. Mano de obra por cotización
CREATE TABLE IF NOT EXISTS cotizacion_mano_obra (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  cotizacion_id INT           NOT NULL,
  descripcion   VARCHAR(300)  NOT NULL,
  costo         DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at    DATETIME      NOT NULL DEFAULT NOW(),
  FOREIGN KEY (cotizacion_id) REFERENCES Cotizaciones(id) ON DELETE CASCADE
);

-- 4. Parámetros configurables del sistema
CREATE TABLE IF NOT EXISTS parametros_sistema (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  clave       VARCHAR(100) NOT NULL UNIQUE,
  valor       VARCHAR(500) NOT NULL,
  descripcion VARCHAR(300) NULL
);

INSERT IGNORE INTO parametros_sistema (clave, valor, descripcion) VALUES
  ('ganancia_basico',  '20', 'Porcentaje de ganancia para acabado básico'),
  ('ganancia_normal',  '35', 'Porcentaje de ganancia para acabado normal'),
  ('ganancia_premium', '55', 'Porcentaje de ganancia para acabado premium');
