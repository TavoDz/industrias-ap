using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class ServicioExternoService
    {
        DatabaseConnection db = new DatabaseConnection();

        public List<ServicioExterno> ObtenerTodos()
        {
            var lista = new List<ServicioExterno>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, proveedor, costo, created_at FROM ServiciosExternos";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    lista.Add(new ServicioExterno
                    {
                        Id         = reader.GetInt32("id"),
                        Nombre     = reader.GetString("nombre"),
                        Proveedor  = reader.IsDBNull(reader.GetOrdinal("proveedor")) ? null : reader.GetString("proveedor"),
                        Costo      = reader.IsDBNull(reader.GetOrdinal("costo")) ? 0 : reader.GetDecimal("costo"),
                        CreatedAt  = reader.GetDateTime("created_at")
                    });
                }
            }
            return lista;
        }

        public ServicioExterno? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, proveedor, costo, created_at FROM ServiciosExternos WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new ServicioExterno
                    {
                        Id        = reader.GetInt32("id"),
                        Nombre    = reader.GetString("nombre"),
                        Proveedor = reader.IsDBNull(reader.GetOrdinal("proveedor")) ? null : reader.GetString("proveedor"),
                        Costo     = reader.IsDBNull(reader.GetOrdinal("costo")) ? 0 : reader.GetDecimal("costo"),
                        CreatedAt = reader.GetDateTime("created_at")
                    };
                }
            }
            return null;
        }

        public void AgregarServicio(ServicioExterno servicio)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO ServiciosExternos (nombre, proveedor, costo) VALUES (@Nombre, @Proveedor, @Costo)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",    servicio.Nombre);
                cmd.Parameters.AddWithValue("@Proveedor", servicio.Proveedor);
                cmd.Parameters.AddWithValue("@Costo",     servicio.Costo);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarServicio(int id, ServicioExterno servicio)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE ServiciosExternos SET nombre=@Nombre, proveedor=@Proveedor, costo=@Costo WHERE id=@Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",    servicio.Nombre);
                cmd.Parameters.AddWithValue("@Proveedor", servicio.Proveedor);
                cmd.Parameters.AddWithValue("@Costo",     servicio.Costo);
                cmd.Parameters.AddWithValue("@Id",        id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarServicio(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM ServiciosExternos WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
