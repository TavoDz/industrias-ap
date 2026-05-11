using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CotizacionCompletaService
    {
        DatabaseConnection db = new DatabaseConnection();

        public CotizacionCompleta? ObtenerCotizacionCompleta(int cotizacionId)
        {
            CotizacionCompleta? cotizacion = null;

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();

                // ── 1. Datos principales de la cotización ────────────────
                string queryCotizacion = @"
                    SELECT
                        c.id, c.cliente_id, c.usuario_id, c.fecha, c.estado,
                        c.total_materiales, c.total_herrajes, c.total_servicios, c.total,
                        cl.nombre   AS cliente_nombre,
                        cl.telefono AS cliente_telefono,
                        cl.email    AS cliente_email,
                        u.nombre    AS usuario_nombre
                    FROM Cotizaciones c
                    LEFT JOIN Clientes  cl ON cl.id = c.cliente_id
                    LEFT JOIN Usuarios  u  ON u.id  = c.usuario_id
                    WHERE c.id = @Id";

                MySqlCommand cmdCot = new MySqlCommand(queryCotizacion, conn);
                cmdCot.Parameters.AddWithValue("@Id", cotizacionId);
                using (var reader = cmdCot.ExecuteReader())
                {
                    if (!reader.Read()) return null;

                    cotizacion = new CotizacionCompleta
                    {
                        Id               = reader.GetInt32("id"),
                        ClienteId        = reader.GetInt32("cliente_id"),
                        ClienteNombre    = reader.IsDBNull(reader.GetOrdinal("cliente_nombre"))    ? "" : reader.GetString("cliente_nombre"),
                        ClienteTelefono  = reader.IsDBNull(reader.GetOrdinal("cliente_telefono"))  ? "" : reader.GetString("cliente_telefono"),
                        ClienteEmail     = reader.IsDBNull(reader.GetOrdinal("cliente_email"))     ? "" : reader.GetString("cliente_email"),
                        UsuarioId        = reader.GetInt32("usuario_id"),
                        UsuarioNombre    = reader.IsDBNull(reader.GetOrdinal("usuario_nombre"))    ? "" : reader.GetString("usuario_nombre"),
                        Fecha            = reader.GetDateTime("fecha"),
                        Estado           = reader.IsDBNull(reader.GetOrdinal("estado"))            ? "" : reader.GetString("estado"),
                        TotalMateriales  = reader.IsDBNull(reader.GetOrdinal("total_materiales"))  ? 0  : reader.GetDecimal("total_materiales"),
                        TotalHerrajes    = reader.IsDBNull(reader.GetOrdinal("total_herrajes"))    ? 0  : reader.GetDecimal("total_herrajes"),
                        TotalServicios   = reader.IsDBNull(reader.GetOrdinal("total_servicios"))   ? 0  : reader.GetDecimal("total_servicios"),
                        Total            = reader.IsDBNull(reader.GetOrdinal("total"))             ? 0  : reader.GetDecimal("total")
                    };
                }

                // ── 2. Piezas de corte con nombre del material ───────────
                string queryPiezas = @"
                    SELECT
                        p.id, p.nombre_pieza, p.material_id, p.largo, p.ancho,
                        p.cantidad, p.metro_tapacanto, p.costo_material,
                        m.nombre AS material_nombre
                    FROM PiezasCorte p
                    LEFT JOIN Materiales m ON m.id = p.material_id
                    WHERE p.cotizacion_id = @Id";

                MySqlCommand cmdPiezas = new MySqlCommand(queryPiezas, conn);
                cmdPiezas.Parameters.AddWithValue("@Id", cotizacionId);
                using (var reader = cmdPiezas.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        cotizacion.Piezas.Add(new PiezaCorteDetallada
                        {
                            Id             = reader.GetInt32("id"),
                            NombrePieza    = reader.IsDBNull(reader.GetOrdinal("nombre_pieza"))    ? "" : reader.GetString("nombre_pieza"),
                            MaterialId     = reader.GetInt32("material_id"),
                            MaterialNombre = reader.IsDBNull(reader.GetOrdinal("material_nombre")) ? "" : reader.GetString("material_nombre"),
                            Largo          = reader.IsDBNull(reader.GetOrdinal("largo"))           ? 0  : reader.GetDecimal("largo"),
                            Ancho          = reader.IsDBNull(reader.GetOrdinal("ancho"))           ? 0  : reader.GetDecimal("ancho"),
                            Cantidad       = reader.IsDBNull(reader.GetOrdinal("cantidad"))        ? 0  : reader.GetInt32("cantidad"),
                            MetroTapacanto = reader.IsDBNull(reader.GetOrdinal("metro_tapacanto")) ? 0  : reader.GetDecimal("metro_tapacanto"),
                            CostoMaterial  = reader.IsDBNull(reader.GetOrdinal("costo_material"))  ? 0  : reader.GetDecimal("costo_material")
                        });
                    }
                }

                // ── 3. Herrajes con nombre y marca ───────────────────────
                string queryHerrajes = @"
                    SELECT
                        dh.id, dh.herraje_id, dh.cantidad, dh.precio_unitario, dh.subtotal,
                        h.nombre AS herraje_nombre,
                        h.marca  AS herraje_marca
                    FROM DetalleHerrajes dh
                    LEFT JOIN Herrajes h ON h.id = dh.herraje_id
                    WHERE dh.cotizacion_id = @Id";

                MySqlCommand cmdHerrajes = new MySqlCommand(queryHerrajes, conn);
                cmdHerrajes.Parameters.AddWithValue("@Id", cotizacionId);
                using (var reader = cmdHerrajes.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        cotizacion.Herrajes.Add(new DetalleHerrajeDetallado
                        {
                            Id             = reader.GetInt32("id"),
                            HerrajeId      = reader.GetInt32("herraje_id"),
                            HerrajeNombre  = reader.IsDBNull(reader.GetOrdinal("herraje_nombre")) ? "" : reader.GetString("herraje_nombre"),
                            HerrajeMarca   = reader.IsDBNull(reader.GetOrdinal("herraje_marca"))  ? "" : reader.GetString("herraje_marca"),
                            Cantidad       = reader.GetInt32("cantidad"),
                            PrecioUnitario = reader.IsDBNull(reader.GetOrdinal("precio_unitario")) ? 0 : reader.GetDecimal("precio_unitario"),
                            Subtotal       = reader.IsDBNull(reader.GetOrdinal("subtotal"))        ? 0 : reader.GetDecimal("subtotal")
                        });
                    }
                }

                // ── 4. Servicios con nombre y proveedor ──────────────────
                string queryServicios = @"
                    SELECT
                        ds.id, ds.servicio_id, ds.cantidad, ds.precio, ds.subtotal,
                        s.nombre    AS servicio_nombre,
                        s.proveedor AS servicio_proveedor
                    FROM DetalleServicios ds
                    LEFT JOIN ServiciosExternos s ON s.id = ds.servicio_id
                    WHERE ds.cotizacion_id = @Id";

                MySqlCommand cmdServicios = new MySqlCommand(queryServicios, conn);
                cmdServicios.Parameters.AddWithValue("@Id", cotizacionId);
                using (var reader = cmdServicios.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        cotizacion.Servicios.Add(new DetalleServicioDetallado
                        {
                            Id                = reader.GetInt32("id"),
                            ServicioId        = reader.GetInt32("servicio_id"),
                            ServicioNombre    = reader.IsDBNull(reader.GetOrdinal("servicio_nombre"))    ? "" : reader.GetString("servicio_nombre"),
                            ServicioProveedor = reader.IsDBNull(reader.GetOrdinal("servicio_proveedor")) ? "" : reader.GetString("servicio_proveedor"),
                            Cantidad          = reader.GetInt32("cantidad"),
                            Precio            = reader.IsDBNull(reader.GetOrdinal("precio"))   ? 0 : reader.GetDecimal("precio"),
                            Subtotal          = reader.IsDBNull(reader.GetOrdinal("subtotal")) ? 0 : reader.GetDecimal("subtotal")
                        });
                    }
                }
            }

            return cotizacion;
        }
    }
}
