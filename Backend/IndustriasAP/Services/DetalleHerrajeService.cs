using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class DetalleHerrajeService
    {
        DatabaseConnection db = new DatabaseConnection();

        public List<DetalleHerraje> ObtenerPorCotizacion(int cotizacionId)
        {
            var lista = new List<DetalleHerraje>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"SELECT id, cotizacion_id, herraje_id, cantidad, precio_unitario, subtotal
                                 FROM DetalleHerrajes WHERE cotizacion_id = @CotizacionId";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId", cotizacionId);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) lista.Add(MapDetalle(reader));
            }
            return lista;
        }

        public DetalleHerraje? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"SELECT id, cotizacion_id, herraje_id, cantidad, precio_unitario, subtotal
                                 FROM DetalleHerrajes WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read()) return MapDetalle(reader);
            }
            return null;
        }

        public void AgregarDetalle(DetalleHerraje detalle)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();

                // Obtener precio_unitario del herraje si no viene en el request
                if (detalle.PrecioUnitario == 0)
                {
                    string queryPrecio = "SELECT precio_unitario FROM Herrajes WHERE id = @HerrajeId";
                    MySqlCommand cmdPrecio = new MySqlCommand(queryPrecio, conn);
                    cmdPrecio.Parameters.AddWithValue("@HerrajeId", detalle.HerrajeId);
                    var precio = cmdPrecio.ExecuteScalar();
                    detalle.PrecioUnitario = precio != null ? Convert.ToDecimal(precio) : 0;
                }

                detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;

                string query = @"INSERT INTO DetalleHerrajes (cotizacion_id, herraje_id, cantidad, precio_unitario, subtotal)
                                 VALUES (@CotizacionId, @HerrajeId, @Cantidad, @PrecioUnitario, @Subtotal)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId",   detalle.CotizacionId);
                cmd.Parameters.AddWithValue("@HerrajeId",      detalle.HerrajeId);
                cmd.Parameters.AddWithValue("@Cantidad",        detalle.Cantidad);
                cmd.Parameters.AddWithValue("@PrecioUnitario", detalle.PrecioUnitario);
                cmd.Parameters.AddWithValue("@Subtotal",        detalle.Subtotal);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarDetalle(int id, DetalleHerraje detalle)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                detalle.Subtotal = detalle.Cantidad * detalle.PrecioUnitario;

                string query = @"UPDATE DetalleHerrajes SET herraje_id=@HerrajeId, cantidad=@Cantidad,
                                 precio_unitario=@PrecioUnitario, subtotal=@Subtotal WHERE id=@Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@HerrajeId",      detalle.HerrajeId);
                cmd.Parameters.AddWithValue("@Cantidad",        detalle.Cantidad);
                cmd.Parameters.AddWithValue("@PrecioUnitario", detalle.PrecioUnitario);
                cmd.Parameters.AddWithValue("@Subtotal",        detalle.Subtotal);
                cmd.Parameters.AddWithValue("@Id",              id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarDetalle(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM DetalleHerrajes WHERE id = @Id";
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
                string query = "DELETE FROM DetalleHerrajes WHERE cotizacion_id = @CotizacionId";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId", cotizacionId);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        private DetalleHerraje MapDetalle(MySqlDataReader reader)
        {
            return new DetalleHerraje
            {
                Id             = reader.GetInt32("id"),
                CotizacionId   = reader.GetInt32("cotizacion_id"),
                HerrajeId      = reader.GetInt32("herraje_id"),
                Cantidad       = reader.GetInt32("cantidad"),
                PrecioUnitario = reader.IsDBNull(reader.GetOrdinal("precio_unitario")) ? 0 : reader.GetDecimal("precio_unitario"),
                Subtotal       = reader.IsDBNull(reader.GetOrdinal("subtotal"))        ? 0 : reader.GetDecimal("subtotal")
            };
        }
    }
}
