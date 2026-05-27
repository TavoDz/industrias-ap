using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class ClienteService
    {
        private readonly DatabaseConnection db;

        public ClienteService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<Cliente> ObtenerTodos()
        {
            var lista = new List<Cliente>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, telefono, email, direccion, estado, created_at FROM Clientes WHERE estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    lista.Add(new Cliente
                    {
                        Id         = reader.GetInt32("id"),
                        Nombre     = reader.GetString("nombre"),
                        Telefono   = reader.IsDBNull(reader.GetOrdinal("telefono")) ? null : reader.GetString("telefono"),
                        Email      = reader.IsDBNull(reader.GetOrdinal("email"))    ? null : reader.GetString("email"),
                        Direccion  = reader.IsDBNull(reader.GetOrdinal("direccion"))? null : reader.GetString("direccion"),
                        Estado     = reader.GetInt32("estado"),
                        CreatedAt  = reader.GetDateTime("created_at")
                    });
                }
            }
            return lista;
        }

        public Cliente? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, nombre, telefono, email, direccion, estado, created_at FROM Clientes WHERE id = @Id AND estado = 1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new Cliente
                    {
                        Id        = reader.GetInt32("id"),
                        Nombre    = reader.GetString("nombre"),
                        Telefono  = reader.IsDBNull(reader.GetOrdinal("telefono")) ? null : reader.GetString("telefono"),
                        Email     = reader.IsDBNull(reader.GetOrdinal("email"))    ? null : reader.GetString("email"),
                        Direccion = reader.IsDBNull(reader.GetOrdinal("direccion"))? null : reader.GetString("direccion"),
                        Estado    = reader.GetInt32("estado"),
                        CreatedAt = reader.GetDateTime("created_at")
                    };
                }
            }
            return null;
        }

        public void AgregarCliente(Cliente cliente)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO Clientes (nombre, telefono, email, direccion) VALUES (@Nombre, @Telefono, @Email, @Direccion)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",    cliente.Nombre);
                cmd.Parameters.AddWithValue("@Telefono",  cliente.Telefono);
                cmd.Parameters.AddWithValue("@Email",     cliente.Email);
                cmd.Parameters.AddWithValue("@Direccion", cliente.Direccion);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarCliente(int id, Cliente cliente)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Clientes SET nombre=@Nombre, telefono=@Telefono, email=@Email, direccion=@Direccion WHERE id=@Id AND estado=1";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Nombre",    cliente.Nombre);
                cmd.Parameters.AddWithValue("@Telefono",  cliente.Telefono);
                cmd.Parameters.AddWithValue("@Email",     cliente.Email);
                cmd.Parameters.AddWithValue("@Direccion", cliente.Direccion);
                cmd.Parameters.AddWithValue("@Id",        id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarCliente(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Clientes SET estado = 0 WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
