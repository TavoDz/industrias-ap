using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CotizacionService
    {
        DatabaseConnection db = new DatabaseConnection();

        public List<Cotizacion> ObtenerTodos()
        {
            var lista = new List<Cotizacion>();
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, cliente_id, usuario_id, fecha, total_materiales, total_herrajes, total_servicios, total, estado FROM Cotizaciones";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) lista.Add(MapCotizacion(reader));
            }
            return lista;
        }

        public Cotizacion? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, cliente_id, usuario_id, fecha, total_materiales, total_herrajes, total_servicios, total, estado FROM Cotizaciones WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read()) return MapCotizacion(reader);
            }
            return null;
        }

        public List<Cotizacion> ObtenerPorCliente(int clienteId)
        {
            var lista = new List<Cotizacion>();
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, cliente_id, usuario_id, fecha, total_materiales, total_herrajes, total_servicios, total, estado FROM Cotizaciones WHERE cliente_id = @ClienteId";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@ClienteId", clienteId);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) lista.Add(MapCotizacion(reader));
            }
            return lista;
        }

        public CotizacionCompleta? ObtenerCompleta(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();

                // 1. Encabezado
                string queryEnc = @"
                    SELECT c.id, c.cliente_id, c.usuario_id, c.fecha, c.estado,
                           c.total_materiales, c.total_herrajes, c.total_servicios, c.total,
                           cl.nombre   AS cliente_nombre,
                           cl.telefono AS cliente_telefono,
                           cl.email    AS cliente_email,
                           u.nombre    AS usuario_nombre
                    FROM Cotizaciones c
                    LEFT JOIN Clientes cl ON cl.id = c.cliente_id
                    LEFT JOIN Usuarios u  ON u.id  = c.usuario_id
                    WHERE c.id = @Id";
                MySqlCommand cmdEnc = new MySqlCommand(queryEnc, conn);
                cmdEnc.Parameters.AddWithValue("@Id", id);

                CotizacionCompleta? cotizacion = null;
                using (var r = cmdEnc.ExecuteReader())
                {
                    if (r.Read())
                    {
                        cotizacion = new CotizacionCompleta
                        {
                            Id = r.GetInt32("id"),
                            ClienteId = r.GetInt32("cliente_id"),
                            UsuarioId = r.GetInt32("usuario_id"),
                            Fecha = r.GetDateTime("fecha"),
                            Estado = r.IsDBNull(r.GetOrdinal("estado")) ? "" : r.GetString("estado"),
                            ClienteNombre = r.IsDBNull(r.GetOrdinal("cliente_nombre")) ? "" : r.GetString("cliente_nombre"),
                            ClienteTelefono = r.IsDBNull(r.GetOrdinal("cliente_telefono")) ? "" : r.GetString("cliente_telefono"),
                            ClienteEmail = r.IsDBNull(r.GetOrdinal("cliente_email")) ? "" : r.GetString("cliente_email"),
                            UsuarioNombre = r.IsDBNull(r.GetOrdinal("usuario_nombre")) ? "" : r.GetString("usuario_nombre"),
                            TotalMateriales = r.IsDBNull(r.GetOrdinal("total_materiales")) ? 0 : r.GetDecimal("total_materiales"),
                            TotalHerrajes = r.IsDBNull(r.GetOrdinal("total_herrajes")) ? 0 : r.GetDecimal("total_herrajes"),
                            TotalServicios = r.IsDBNull(r.GetOrdinal("total_servicios")) ? 0 : r.GetDecimal("total_servicios"),
                            Total = r.IsDBNull(r.GetOrdinal("total")) ? 0 : r.GetDecimal("total")
                        };
                    }
                }
                if (cotizacion == null) return null;

                // 2. Piezas
                string queryPiezas = @"
                    SELECT p.id, p.nombre_pieza, p.material_id, p.largo, p.ancho,
                           p.cantidad, p.metro_tapacanto, p.costo_material,
                           m.nombre AS material_nombre
                    FROM PiezasCorte p
                    LEFT JOIN Materiales m ON m.id = p.material_id
                    WHERE p.cotizacion_id = @Id";
                MySqlCommand cmdPiezas = new MySqlCommand(queryPiezas, conn);
                cmdPiezas.Parameters.AddWithValue("@Id", id);
                using (var r = cmdPiezas.ExecuteReader())
                {
                    while (r.Read())
                    {
                        cotizacion.Piezas.Add(new PiezaCorteDetallada
                        {
                            Id = r.GetInt32("id"),
                            NombrePieza = r.IsDBNull(r.GetOrdinal("nombre_pieza")) ? "" : r.GetString("nombre_pieza"),
                            MaterialId = r.GetInt32("material_id"),
                            MaterialNombre = r.IsDBNull(r.GetOrdinal("material_nombre")) ? "" : r.GetString("material_nombre"),
                            Largo = r.IsDBNull(r.GetOrdinal("largo")) ? 0 : r.GetDecimal("largo"),
                            Ancho = r.IsDBNull(r.GetOrdinal("ancho")) ? 0 : r.GetDecimal("ancho"),
                            Cantidad = r.IsDBNull(r.GetOrdinal("cantidad")) ? 0 : r.GetInt32("cantidad"),
                            MetroTapacanto = r.IsDBNull(r.GetOrdinal("metro_tapacanto")) ? 0 : r.GetDecimal("metro_tapacanto"),
                            CostoMaterial = r.IsDBNull(r.GetOrdinal("costo_material")) ? 0 : r.GetDecimal("costo_material")
                        });
                    }
                }

                // 3. Herrajes
                string queryHerrajes = @"
                    SELECT dh.id, dh.herraje_id, dh.cantidad, dh.precio_unitario, dh.subtotal,
                           h.nombre AS herraje_nombre, h.marca AS herraje_marca
                    FROM DetalleHerrajes dh
                    LEFT JOIN Herrajes h ON h.id = dh.herraje_id
                    WHERE dh.cotizacion_id = @Id";
                MySqlCommand cmdHerrajes = new MySqlCommand(queryHerrajes, conn);
                cmdHerrajes.Parameters.AddWithValue("@Id", id);
                using (var r = cmdHerrajes.ExecuteReader())
                {
                    while (r.Read())
                    {
                        cotizacion.Herrajes.Add(new DetalleHerrajeDetallado
                        {
                            Id = r.GetInt32("id"),
                            HerrajeId = r.GetInt32("herraje_id"),
                            HerrajeNombre = r.IsDBNull(r.GetOrdinal("herraje_nombre")) ? "" : r.GetString("herraje_nombre"),
                            HerrajeMarca = r.IsDBNull(r.GetOrdinal("herraje_marca")) ? "" : r.GetString("herraje_marca"),
                            Cantidad = r.GetInt32("cantidad"),
                            PrecioUnitario = r.IsDBNull(r.GetOrdinal("precio_unitario")) ? 0 : r.GetDecimal("precio_unitario"),
                            Subtotal = r.IsDBNull(r.GetOrdinal("subtotal")) ? 0 : r.GetDecimal("subtotal")
                        });
                    }
                }

                // 4. Servicios
                string queryServicios = @"
                    SELECT ds.id, ds.servicio_id, ds.cantidad, ds.precio, ds.subtotal,
                           s.nombre AS servicio_nombre, s.proveedor AS servicio_proveedor
                    FROM DetalleServicios ds
                    LEFT JOIN ServiciosExternos s ON s.id = ds.servicio_id
                    WHERE ds.cotizacion_id = @Id";
                MySqlCommand cmdServicios = new MySqlCommand(queryServicios, conn);
                cmdServicios.Parameters.AddWithValue("@Id", id);
                using (var r = cmdServicios.ExecuteReader())
                {
                    while (r.Read())
                    {
                        cotizacion.Servicios.Add(new DetalleServicioDetallado
                        {
                            Id = r.GetInt32("id"),
                            ServicioId = r.GetInt32("servicio_id"),
                            ServicioNombre = r.IsDBNull(r.GetOrdinal("servicio_nombre")) ? "" : r.GetString("servicio_nombre"),
                            ServicioProveedor = r.IsDBNull(r.GetOrdinal("servicio_proveedor")) ? "" : r.GetString("servicio_proveedor"),
                            Cantidad = r.GetInt32("cantidad"),
                            Precio = r.IsDBNull(r.GetOrdinal("precio")) ? 0 : r.GetDecimal("precio"),
                            Subtotal = r.IsDBNull(r.GetOrdinal("subtotal")) ? 0 : r.GetDecimal("subtotal")
                        });
                    }
                }

                return cotizacion;
            }
        }

        public int AgregarCotizacion(Cotizacion cotizacion)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"INSERT INTO Cotizaciones (cliente_id, usuario_id, total_materiales, total_herrajes, total_servicios, total, estado)
                                 VALUES (@ClienteId, @UsuarioId, @TotalMateriales, @TotalHerrajes, @TotalServicios, @Total, @Estado);
                                 SELECT LAST_INSERT_ID();";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@ClienteId", cotizacion.ClienteId);
                cmd.Parameters.AddWithValue("@UsuarioId", cotizacion.UsuarioId);
                cmd.Parameters.AddWithValue("@TotalMateriales", cotizacion.TotalMateriales);
                cmd.Parameters.AddWithValue("@TotalHerrajes", cotizacion.TotalHerrajes);
                cmd.Parameters.AddWithValue("@TotalServicios", cotizacion.TotalServicios);
                cmd.Parameters.AddWithValue("@Total", cotizacion.Total);
                cmd.Parameters.AddWithValue("@Estado", cotizacion.Estado ?? "pendiente");
                return Convert.ToInt32(cmd.ExecuteScalar());
            }
        }

        public bool ActualizarEstado(int id, string estado)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Cotizaciones SET estado = @Estado WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Estado", estado);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool RecalcularTotales(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"
                    UPDATE Cotizaciones c SET
                        total_materiales = (SELECT IFNULL(SUM(costo_material), 0) FROM PiezasCorte      WHERE cotizacion_id = c.id),
                        total_herrajes   = (SELECT IFNULL(SUM(subtotal),       0) FROM DetalleHerrajes  WHERE cotizacion_id = c.id),
                        total_servicios  = (SELECT IFNULL(SUM(subtotal),       0) FROM DetalleServicios WHERE cotizacion_id = c.id),
                        total = (
                            (SELECT IFNULL(SUM(costo_material), 0) FROM PiezasCorte      WHERE cotizacion_id = c.id) +
                            (SELECT IFNULL(SUM(subtotal),       0) FROM DetalleHerrajes  WHERE cotizacion_id = c.id) +
                            (SELECT IFNULL(SUM(subtotal),       0) FROM DetalleServicios WHERE cotizacion_id = c.id)
                        )
                    WHERE c.id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarCotizacion(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Cotizaciones SET estado = 'cancelada' WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        private Cotizacion MapCotizacion(MySqlDataReader reader)
        {
            return new Cotizacion
            {
                Id = reader.GetInt32("id"),
                ClienteId = reader.GetInt32("cliente_id"),
                UsuarioId = reader.GetInt32("usuario_id"),
                Fecha = reader.GetDateTime("fecha"),
                TotalMateriales = reader.IsDBNull(reader.GetOrdinal("total_materiales")) ? 0 : reader.GetDecimal("total_materiales"),
                TotalHerrajes = reader.IsDBNull(reader.GetOrdinal("total_herrajes")) ? 0 : reader.GetDecimal("total_herrajes"),
                TotalServicios = reader.IsDBNull(reader.GetOrdinal("total_servicios")) ? 0 : reader.GetDecimal("total_servicios"),
                Total = reader.IsDBNull(reader.GetOrdinal("total")) ? 0 : reader.GetDecimal("total"),
                Estado = reader.IsDBNull(reader.GetOrdinal("estado")) ? null : reader.GetString("estado")
            };
        }
    }
}