using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class TapacantoService
    {
        private readonly DatabaseConnection db;

        public TapacantoService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<Tapacanto> ObtenerTodos()
        {
            var lista = new List<Tapacanto>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, color, precio_metro, created_at FROM tapacantos";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    lista.Add(new Tapacanto
                    {
                        Id          = reader.GetInt32("id"),
                        Nombre      = reader.IsDBNull(reader.GetOrdinal("nombre")) ? null : reader.GetString("nombre"),
                        Color       = reader.IsDBNull(reader.GetOrdinal("color"))  ? null : reader.GetString("color"),
                        PrecioMetro = reader.IsDBNull(reader.GetOrdinal("precio_metro")) ? 0 : reader.GetDecimal("precio_metro"),
                        CreatedAt   = reader.GetDateTime("created_at")
                    });
                }
            }
            return lista;
        }

        public Tapacanto? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, color, precio_metro, created_at FROM tapacantos WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new Tapacanto
                    {
                        Id          = reader.GetInt32("id"),
                        Nombre      = reader.IsDBNull(reader.GetOrdinal("nombre")) ? null : reader.GetString("nombre"),
                        Color       = reader.IsDBNull(reader.GetOrdinal("color"))  ? null : reader.GetString("color"),
                        PrecioMetro = reader.IsDBNull(reader.GetOrdinal("precio_metro")) ? 0 : reader.GetDecimal("precio_metro"),
                        CreatedAt   = reader.GetDateTime("created_at")
                    };
                }
            }
            return null;
        }

        public void AgregarTapacanto(Tapacanto tapacanto)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO tapacantos (nombre, color, precio_metro) VALUES (@Nombre, @Color, @PrecioMetro)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",      tapacanto.Nombre);
                cmd.Parameters.AddWithValue("@Color",       tapacanto.Color);
                cmd.Parameters.AddWithValue("@PrecioMetro", tapacanto.PrecioMetro);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarTapacanto(int id, Tapacanto tapacanto)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE tapacantos SET nombre=@Nombre, color=@Color, precio_metro=@PrecioMetro WHERE id=@Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",      tapacanto.Nombre);
                cmd.Parameters.AddWithValue("@Color",       tapacanto.Color);
                cmd.Parameters.AddWithValue("@PrecioMetro", tapacanto.PrecioMetro);
                cmd.Parameters.AddWithValue("@Id",          id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarTapacanto(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM tapacantos WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
