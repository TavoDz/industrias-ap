using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class HerrajeService
    {
        private readonly DatabaseConnection db;

        public HerrajeService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<Herraje> ObtenerTodos()
        {
            var lista = new List<Herraje>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, marca, precio_unitario, estado, created_at FROM Herrajes WHERE estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    lista.Add(new Herraje
                    {
                        Id             = reader.GetInt32("id"),
                        Nombre         = reader.GetString("nombre"),
                        Marca          = reader.IsDBNull(reader.GetOrdinal("marca")) ? null : reader.GetString("marca"),
                        PrecioUnitario = reader.IsDBNull(reader.GetOrdinal("precio_unitario")) ? 0 : reader.GetDecimal("precio_unitario"),
                        Estado         = reader.GetInt32("estado"),
                        CreatedAt      = reader.GetDateTime("created_at")
                    });
                }
            }
            return lista;
        }

        public Herraje? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, marca, precio_unitario, estado, created_at FROM Herrajes WHERE id = @Id AND estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new Herraje
                    {
                        Id             = reader.GetInt32("id"),
                        Nombre         = reader.GetString("nombre"),
                        Marca          = reader.IsDBNull(reader.GetOrdinal("marca")) ? null : reader.GetString("marca"),
                        PrecioUnitario = reader.IsDBNull(reader.GetOrdinal("precio_unitario")) ? 0 : reader.GetDecimal("precio_unitario"),
                        Estado         = reader.GetInt32("estado"),
                        CreatedAt      = reader.GetDateTime("created_at")
                    };
                }
            }
            return null;
        }

        public void AgregarHerraje(Herraje herraje)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO Herrajes (nombre, marca, precio_unitario) VALUES (@Nombre, @Marca, @PrecioUnitario)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",         herraje.Nombre);
                cmd.Parameters.AddWithValue("@Marca",          herraje.Marca);
                cmd.Parameters.AddWithValue("@PrecioUnitario", herraje.PrecioUnitario);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarHerraje(int id, Herraje herraje)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Herrajes SET nombre=@Nombre, marca=@Marca, precio_unitario=@PrecioUnitario WHERE id=@Id AND estado=1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",         herraje.Nombre);
                cmd.Parameters.AddWithValue("@Marca",          herraje.Marca);
                cmd.Parameters.AddWithValue("@PrecioUnitario", herraje.PrecioUnitario);
                cmd.Parameters.AddWithValue("@Id",             id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarHerraje(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Herrajes SET estado = 0 WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
