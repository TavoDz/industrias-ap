using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CotizacionCompletaService
    {
        private readonly DatabaseConnection db;

        public CotizacionCompletaService(DatabaseConnection db)
        {
            this.db = db;
        }

        public CotizacionCompleta? ObtenerCotizacionCompleta(int cotizacionId)
        {
            CotizacionCompleta? cotizacion = null;

            using var conn = db.GetConnection();
            conn.Open();

            // 1. Encabezado con todos los campos nuevos
            const string queryCotizacion = @"
                SELECT
                    c.id, c.cliente_id, c.usuario_id, c.fecha, c.estado,
                    c.total_materiales, c.total_herrajes, c.total_servicios,
                    c.total_mano_obra, c.subtotal_costos, c.monto_ganancia,
                    c.porcentaje_ganancia, c.descuento, c.total,
                    c.descripcion_general, c.tipo_acabado, c.tiempo_estimado_dias,
                    c.observaciones, c.terminos,
                    cl.nombre   AS cliente_nombre,
                    cl.telefono AS cliente_telefono,
                    cl.email    AS cliente_email,
                    u.nombre    AS usuario_nombre
                FROM Cotizaciones c
                LEFT JOIN Clientes cl ON cl.id = c.cliente_id
                LEFT JOIN Usuarios u  ON u.id  = c.usuario_id
                WHERE c.id = @Id";

            var cmdCot = new MySqlCommand(queryCotizacion, conn);
            cmdCot.Parameters.AddWithValue("@Id", cotizacionId);
            using (var r = cmdCot.ExecuteReader())
            {
                if (!r.Read()) return null;
                cotizacion = new CotizacionCompleta
                {
                    Id                 = r.GetInt32("id"),
                    ClienteId          = r.GetInt32("cliente_id"),
                    UsuarioId          = r.GetInt32("usuario_id"),
                    Fecha              = r.GetDateTime("fecha"),
                    Estado             = r.IsDBNull(r.GetOrdinal("estado"))              ? "" : r.GetString("estado"),
                    ClienteNombre      = r.IsDBNull(r.GetOrdinal("cliente_nombre"))      ? "" : r.GetString("cliente_nombre"),
                    ClienteTelefono    = r.IsDBNull(r.GetOrdinal("cliente_telefono"))    ? "" : r.GetString("cliente_telefono"),
                    ClienteEmail       = r.IsDBNull(r.GetOrdinal("cliente_email"))       ? "" : r.GetString("cliente_email"),
                    UsuarioNombre      = r.IsDBNull(r.GetOrdinal("usuario_nombre"))      ? "" : r.GetString("usuario_nombre"),
                    TotalMateriales    = r.IsDBNull(r.GetOrdinal("total_materiales"))    ? 0  : r.GetDecimal("total_materiales"),
                    TotalHerrajes      = r.IsDBNull(r.GetOrdinal("total_herrajes"))      ? 0  : r.GetDecimal("total_herrajes"),
                    TotalServicios     = r.IsDBNull(r.GetOrdinal("total_servicios"))     ? 0  : r.GetDecimal("total_servicios"),
                    TotalManoObra      = r.IsDBNull(r.GetOrdinal("total_mano_obra"))     ? 0  : r.GetDecimal("total_mano_obra"),
                    SubtotalCostos     = r.IsDBNull(r.GetOrdinal("subtotal_costos"))     ? 0  : r.GetDecimal("subtotal_costos"),
                    MontoGanancia      = r.IsDBNull(r.GetOrdinal("monto_ganancia"))      ? 0  : r.GetDecimal("monto_ganancia"),
                    PorcentajeGanancia = r.IsDBNull(r.GetOrdinal("porcentaje_ganancia")) ? 35m : r.GetDecimal("porcentaje_ganancia"),
                    Descuento          = r.IsDBNull(r.GetOrdinal("descuento"))           ? 0  : r.GetDecimal("descuento"),
                    Total              = r.IsDBNull(r.GetOrdinal("total"))               ? 0  : r.GetDecimal("total"),
                    DescripcionGeneral = r.IsDBNull(r.GetOrdinal("descripcion_general")) ? null : r.GetString("descripcion_general"),
                    TipoAcabado        = r.IsDBNull(r.GetOrdinal("tipo_acabado"))        ? "normal" : r.GetString("tipo_acabado"),
                    TiempoEstimadoDias = r.IsDBNull(r.GetOrdinal("tiempo_estimado_dias")) ? null : r.GetInt32("tiempo_estimado_dias"),
                    Observaciones      = r.IsDBNull(r.GetOrdinal("observaciones"))       ? null : r.GetString("observaciones"),
                    Terminos           = r.IsDBNull(r.GetOrdinal("terminos"))            ? null : r.GetString("terminos"),
                };
            }

            // 2. Materiales de cotización (nueva tabla)
            const string queryMateriales = @"
                SELECT cm.id, cm.cotizacion_id, cm.material_id, cm.descripcion,
                       cm.cantidad_planchas, cm.porcentaje_uso, cm.precio_unitario, cm.subtotal,
                       m.nombre AS material_nombre
                FROM cotizacion_materiales cm
                LEFT JOIN Materiales m ON m.id = cm.material_id
                WHERE cm.cotizacion_id = @Id
                ORDER BY cm.created_at";
            var cmdMat = new MySqlCommand(queryMateriales, conn);
            cmdMat.Parameters.AddWithValue("@Id", cotizacionId);
            using (var r = cmdMat.ExecuteReader())
            {
                while (r.Read())
                    cotizacion.Materiales.Add(new CotizacionMaterialDetallado
                    {
                        Id               = r.GetInt32("id"),
                        CotizacionId     = r.GetInt32("cotizacion_id"),
                        MaterialId       = r.GetInt32("material_id"),
                        MaterialNombre   = r.IsDBNull(r.GetOrdinal("material_nombre")) ? "" : r.GetString("material_nombre"),
                        Descripcion      = r.IsDBNull(r.GetOrdinal("descripcion"))     ? null : r.GetString("descripcion"),
                        CantidadPlanchas = r.GetDecimal("cantidad_planchas"),
                        PorcentajeUso    = r.GetDecimal("porcentaje_uso"),
                        PrecioUnitario   = r.GetDecimal("precio_unitario"),
                        Subtotal         = r.GetDecimal("subtotal"),
                    });
            }

            // 3. Piezas de corte (se conservan para el optimizador)
            const string queryPiezas = @"
                SELECT p.id, p.nombre_pieza, p.material_id, p.largo, p.ancho,
                       p.cantidad, p.metro_tapacanto, p.costo_material,
                       m.nombre AS material_nombre
                FROM PiezasCorte p
                LEFT JOIN Materiales m ON m.id = p.material_id
                WHERE p.cotizacion_id = @Id";
            var cmdPiezas = new MySqlCommand(queryPiezas, conn);
            cmdPiezas.Parameters.AddWithValue("@Id", cotizacionId);
            using (var r = cmdPiezas.ExecuteReader())
            {
                while (r.Read())
                    cotizacion.Piezas.Add(new PiezaCorteDetallada
                    {
                        Id             = r.GetInt32("id"),
                        NombrePieza    = r.IsDBNull(r.GetOrdinal("nombre_pieza"))    ? "" : r.GetString("nombre_pieza"),
                        MaterialId     = r.GetInt32("material_id"),
                        MaterialNombre = r.IsDBNull(r.GetOrdinal("material_nombre")) ? "" : r.GetString("material_nombre"),
                        Largo          = r.IsDBNull(r.GetOrdinal("largo"))           ? 0  : r.GetDecimal("largo"),
                        Ancho          = r.IsDBNull(r.GetOrdinal("ancho"))           ? 0  : r.GetDecimal("ancho"),
                        Cantidad       = r.IsDBNull(r.GetOrdinal("cantidad"))        ? 0  : r.GetInt32("cantidad"),
                        MetroTapacanto = r.IsDBNull(r.GetOrdinal("metro_tapacanto")) ? 0  : r.GetDecimal("metro_tapacanto"),
                        CostoMaterial  = r.IsDBNull(r.GetOrdinal("costo_material"))  ? 0  : r.GetDecimal("costo_material"),
                    });
            }

            // 4. Herrajes
            const string queryHerrajes = @"
                SELECT dh.id, dh.herraje_id, dh.cantidad, dh.precio_unitario, dh.subtotal,
                       h.nombre AS herraje_nombre, h.marca AS herraje_marca
                FROM DetalleHerrajes dh
                LEFT JOIN Herrajes h ON h.id = dh.herraje_id
                WHERE dh.cotizacion_id = @Id";
            var cmdHerrajes = new MySqlCommand(queryHerrajes, conn);
            cmdHerrajes.Parameters.AddWithValue("@Id", cotizacionId);
            using (var r = cmdHerrajes.ExecuteReader())
            {
                while (r.Read())
                    cotizacion.Herrajes.Add(new DetalleHerrajeDetallado
                    {
                        Id             = r.GetInt32("id"),
                        HerrajeId      = r.GetInt32("herraje_id"),
                        HerrajeNombre  = r.IsDBNull(r.GetOrdinal("herraje_nombre")) ? "" : r.GetString("herraje_nombre"),
                        HerrajeMarca   = r.IsDBNull(r.GetOrdinal("herraje_marca"))  ? "" : r.GetString("herraje_marca"),
                        Cantidad       = r.GetInt32("cantidad"),
                        PrecioUnitario = r.IsDBNull(r.GetOrdinal("precio_unitario")) ? 0 : r.GetDecimal("precio_unitario"),
                        Subtotal       = r.IsDBNull(r.GetOrdinal("subtotal"))        ? 0 : r.GetDecimal("subtotal"),
                    });
            }

            // 5. Servicios
            const string queryServicios = @"
                SELECT ds.id, ds.servicio_id, ds.cantidad, ds.precio, ds.subtotal,
                       s.nombre AS servicio_nombre, s.proveedor AS servicio_proveedor
                FROM DetalleServicios ds
                LEFT JOIN ServiciosExternos s ON s.id = ds.servicio_id
                WHERE ds.cotizacion_id = @Id";
            var cmdServicios = new MySqlCommand(queryServicios, conn);
            cmdServicios.Parameters.AddWithValue("@Id", cotizacionId);
            using (var r = cmdServicios.ExecuteReader())
            {
                while (r.Read())
                    cotizacion.Servicios.Add(new DetalleServicioDetallado
                    {
                        Id                = r.GetInt32("id"),
                        ServicioId        = r.GetInt32("servicio_id"),
                        ServicioNombre    = r.IsDBNull(r.GetOrdinal("servicio_nombre"))    ? "" : r.GetString("servicio_nombre"),
                        ServicioProveedor = r.IsDBNull(r.GetOrdinal("servicio_proveedor")) ? "" : r.GetString("servicio_proveedor"),
                        Cantidad          = r.GetInt32("cantidad"),
                        Precio            = r.IsDBNull(r.GetOrdinal("precio"))   ? 0 : r.GetDecimal("precio"),
                        Subtotal          = r.IsDBNull(r.GetOrdinal("subtotal")) ? 0 : r.GetDecimal("subtotal"),
                    });
            }

            // 6. Mano de obra
            const string queryManoObra = @"
                SELECT id, cotizacion_id, descripcion, costo, created_at
                FROM cotizacion_mano_obra
                WHERE cotizacion_id = @Id
                ORDER BY created_at";
            var cmdMO = new MySqlCommand(queryManoObra, conn);
            cmdMO.Parameters.AddWithValue("@Id", cotizacionId);
            using (var r = cmdMO.ExecuteReader())
            {
                while (r.Read())
                    cotizacion.ManoObra.Add(new CotizacionManoObra
                    {
                        Id           = r.GetInt32("id"),
                        CotizacionId = r.GetInt32("cotizacion_id"),
                        Descripcion  = r.GetString("descripcion"),
                        Costo        = r.GetDecimal("costo"),
                        CreatedAt    = r.GetDateTime("created_at"),
                    });
            }

            return cotizacion;
        }
    }
}
