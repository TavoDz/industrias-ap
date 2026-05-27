using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class DetalleServicioService
    {
        private readonly DatabaseConnection db;

        public DetalleServicioService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<DetalleServicio> ObtenerPorCotizacion(int cotizacionId)
        {
            var lista = new List<DetalleServicio>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"SELECT id, cotizacion_id, servicio_id, cantidad, precio, subtotal
                                 FROM DetalleServicios WHERE cotizacion_id = @CotizacionId";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId", cotizacionId);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) lista.Add(MapDetalle(reader));
            }
            return lista;
        }

        public DetalleServicio? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"SELECT id, cotizacion_id, servicio_id, cantidad, precio, subtotal
                                 FROM DetalleServicios WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read()) return MapDetalle(reader);
            }
            return null;
        }

        public void AgregarDetalle(DetalleServicio detalle)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();

                // Obtener costo del servicio si no viene en el request
                if (detalle.Precio == 0)
                {
                    string queryPrecio = "SELECT costo FROM ServiciosExternos WHERE id = @ServicioId";
                    MySqlCommand cmdPrecio = new MySqlCommand(queryPrecio, conn);
                    cmdPrecio.Parameters.AddWithValue("@ServicioId", detalle.ServicioId);
                    var costo = cmdPrecio.ExecuteScalar();
                    detalle.Precio = costo != null ? Convert.ToDecimal(costo) : 0;
                }

                detalle.Subtotal = detalle.Cantidad * detalle.Precio;

                string query = @"INSERT INTO DetalleServicios (cotizacion_id, servicio_id, cantidad, precio, subtotal)
                                 VALUES (@CotizacionId, @ServicioId, @Cantidad, @Precio, @Subtotal)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId", detalle.CotizacionId);
                cmd.Parameters.AddWithValue("@ServicioId",   detalle.ServicioId);
                cmd.Parameters.AddWithValue("@Cantidad",     detalle.Cantidad);
                cmd.Parameters.AddWithValue("@Precio",       detalle.Precio);
                cmd.Parameters.AddWithValue("@Subtotal",     detalle.Subtotal);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarDetalle(int id, DetalleServicio detalle)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                detalle.Subtotal = detalle.Cantidad * detalle.Precio;

                string query = @"UPDATE DetalleServicios SET servicio_id=@ServicioId, cantidad=@Cantidad,
                                 precio=@Precio, subtotal=@Subtotal WHERE id=@Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@ServicioId", detalle.ServicioId);
                cmd.Parameters.AddWithValue("@Cantidad",   detalle.Cantidad);
                cmd.Parameters.AddWithValue("@Precio",     detalle.Precio);
                cmd.Parameters.AddWithValue("@Subtotal",   detalle.Subtotal);
                cmd.Parameters.AddWithValue("@Id",         id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarDetalle(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM DetalleServicios WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarPorCotizacion(int cotizacionId)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM DetalleServicios WHERE cotizacion_id = @CotizacionId";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId", cotizacionId);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        private DetalleServicio MapDetalle(MySqlDataReader reader)
        {
            return new DetalleServicio
            {
                Id           = reader.GetInt32("id"),
                CotizacionId = reader.GetInt32("cotizacion_id"),
                ServicioId   = reader.GetInt32("servicio_id"),
                Cantidad     = reader.GetInt32("cantidad"),
                Precio       = reader.IsDBNull(reader.GetOrdinal("precio"))   ? 0 : reader.GetDecimal("precio"),
                Subtotal     = reader.IsDBNull(reader.GetOrdinal("subtotal")) ? 0 : reader.GetDecimal("subtotal")
            };
        }
    }
}
