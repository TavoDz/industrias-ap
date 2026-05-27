using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class MaterialService
    {
        private readonly DatabaseConnection db;

        public MaterialService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<Material> ObtenerTodos()
        {
            var lista = new List<Material>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, tipo, grosor, largo, ancho, precio_tablero, estado, created_at FROM materiales WHERE estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    lista.Add(new Material
                    {
                        Id            = reader.GetInt32("id"),
                        Nombre        = reader.GetString("nombre"),
                        Tipo          = reader.IsDBNull(reader.GetOrdinal("tipo"))   ? null : reader.GetString("tipo"),
                        Grosor        = reader.IsDBNull(reader.GetOrdinal("grosor")) ? 0 : reader.GetDecimal("grosor"),
                        Largo         = reader.IsDBNull(reader.GetOrdinal("largo"))  ? 0 : reader.GetDecimal("largo"),
                        Ancho         = reader.IsDBNull(reader.GetOrdinal("ancho"))  ? 0 : reader.GetDecimal("ancho"),
                        PrecioTablero = reader.IsDBNull(reader.GetOrdinal("precio_tablero")) ? 0 : reader.GetDecimal("precio_tablero"),
                        Estado        = reader.GetInt32("estado"),
                        CreatedAt     = reader.GetDateTime("created_at")
                    });
                }
            }
            return lista;
        }

        public Material? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, tipo, grosor, largo, ancho, precio_tablero, estado, created_at FROM materiales WHERE id = @Id AND estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new Material
                    {
                        Id            = reader.GetInt32("id"),
                        Nombre        = reader.GetString("nombre"),
                        Tipo          = reader.IsDBNull(reader.GetOrdinal("tipo"))   ? null : reader.GetString("tipo"),
                        Grosor        = reader.IsDBNull(reader.GetOrdinal("grosor")) ? 0 : reader.GetDecimal("grosor"),
                        Largo         = reader.IsDBNull(reader.GetOrdinal("largo"))  ? 0 : reader.GetDecimal("largo"),
                        Ancho         = reader.IsDBNull(reader.GetOrdinal("ancho"))  ? 0 : reader.GetDecimal("ancho"),
                        PrecioTablero = reader.IsDBNull(reader.GetOrdinal("precio_tablero")) ? 0 : reader.GetDecimal("precio_tablero"),
                        Estado        = reader.GetInt32("estado"),
                        CreatedAt     = reader.GetDateTime("created_at")
                    };
                }
            }
            return null;
        }

        public void AgregarMaterial(Material material)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO materiales (nombre, tipo, grosor, largo, ancho, precio_tablero) VALUES (@Nombre, @Tipo, @Grosor, @Largo, @Ancho, @PrecioTablero)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",        material.Nombre);
                cmd.Parameters.AddWithValue("@Tipo",          material.Tipo);
                cmd.Parameters.AddWithValue("@Grosor",        material.Grosor);
                cmd.Parameters.AddWithValue("@Largo",         material.Largo);
                cmd.Parameters.AddWithValue("@Ancho",         material.Ancho);
                cmd.Parameters.AddWithValue("@PrecioTablero", material.PrecioTablero);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarMaterial(int id, Material material)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE materiales SET nombre=@Nombre, tipo=@Tipo, grosor=@Grosor, largo=@Largo, ancho=@Ancho, precio_tablero=@PrecioTablero WHERE id=@Id AND estado=1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",        material.Nombre);
                cmd.Parameters.AddWithValue("@Tipo",          material.Tipo);
                cmd.Parameters.AddWithValue("@Grosor",        material.Grosor);
                cmd.Parameters.AddWithValue("@Largo",         material.Largo);
                cmd.Parameters.AddWithValue("@Ancho",         material.Ancho);
                cmd.Parameters.AddWithValue("@PrecioTablero", material.PrecioTablero);
                cmd.Parameters.AddWithValue("@Id",            id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarMaterial(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE materiales SET estado = 0 WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
