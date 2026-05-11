using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;
using System.Security.Cryptography;
using System.Text;

namespace InsutriasAP.Services
{
    public class UsuarioService
    {
        DatabaseConnection db = new DatabaseConnection();

        // ─── Helpers ──────────────────────────────────────────────

        private string HashSHA256(string texto)
        {
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(texto));
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }

        private Usuario MapUsuario(MySqlDataReader reader)
        {
            return new Usuario
            {
                Id           = reader.GetInt32("id"),
                Nombre       = reader.GetString("nombre"),
                Email        = reader.GetString("email"),
                PasswordHash = reader.GetString("password_hash"),
                Rol          = reader.IsDBNull(reader.GetOrdinal("rol"))    ? null : reader.GetString("rol"),
                Estado       = reader.GetInt32("estado"),
                CreatedAt    = reader.GetDateTime("created_at"),
                UpdatedAt    = reader.GetDateTime("updated_at")
            };
        }

        // ─── CRUD ─────────────────────────────────────────────────

        public List<Usuario> ObtenerTodos()
        {
            var lista = new List<Usuario>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, email, password_hash, rol, estado, created_at, updated_at FROM Usuarios WHERE estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) lista.Add(MapUsuario(reader));
            }
            return lista;
        }

        public Usuario? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, email, password_hash, rol, estado, created_at, updated_at FROM Usuarios WHERE id = @Id AND estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read()) return MapUsuario(reader);
            }
            return null;
        }

        public Usuario? ObtenerPorEmail(string email)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, email, password_hash, rol, estado, created_at, updated_at FROM Usuarios WHERE email = @Email AND estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Email", email);
                using var reader = cmd.ExecuteReader();
                if (reader.Read()) return MapUsuario(reader);
            }
            return null;
        }

        public void AgregarUsuario(Usuario usuario)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO Usuarios (nombre, email, password_hash, rol) VALUES (@Nombre, @Email, @PasswordHash, @Rol)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",       usuario.Nombre);
                cmd.Parameters.AddWithValue("@Email",        usuario.Email);
                cmd.Parameters.AddWithValue("@PasswordHash", HashSHA256(usuario.PasswordHash));
                cmd.Parameters.AddWithValue("@Rol",          usuario.Rol ?? "vendedor");
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarUsuario(int id, Usuario usuario)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Usuarios SET nombre=@Nombre, email=@Email, rol=@Rol WHERE id=@Id AND estado=1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre", usuario.Nombre);
                cmd.Parameters.AddWithValue("@Email",  usuario.Email);
                cmd.Parameters.AddWithValue("@Rol",    usuario.Rol);
                cmd.Parameters.AddWithValue("@Id",     id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool CambiarPassword(int id, string nuevaPassword)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Usuarios SET password_hash=@Hash WHERE id=@Id AND estado=1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Hash", HashSHA256(nuevaPassword));
                cmd.Parameters.AddWithValue("@Id",   id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarUsuario(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Usuarios SET estado = 0 WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        // ─── Login ────────────────────────────────────────────────

        public Usuario? ValidarCredenciales(string email, string password)
        {
            var usuario = ObtenerPorEmail(email);
            if (usuario == null) return null;
            if (usuario.PasswordHash != HashSHA256(password)) return null;
            return usuario;
        }
    }
}
