using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class InventarioService
    {
        DatabaseConnection db = new DatabaseConnection();

        public List<Inventario> ObtenerTodos()
        {
            var lista = new List<Inventario>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, tipo_item, item_id, cantidad, minimo, updated_at FROM Inventario";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    lista.Add(new Inventario
                    {
                        Id        = reader.GetInt32("id"),
                        TipoItem  = reader.IsDBNull(reader.GetOrdinal("tipo_item")) ? null : reader.GetString("tipo_item"),
                        ItemId    = reader.GetInt32("item_id"),
                        Cantidad  = reader.IsDBNull(reader.GetOrdinal("cantidad")) ? 0 : reader.GetDecimal("cantidad"),
                        Minimo    = reader.IsDBNull(reader.GetOrdinal("minimo"))   ? 0 : reader.GetDecimal("minimo"),
                        UpdatedAt = reader.GetDateTime("updated_at")
                    });
                }
            }
            return lista;
        }

        public Inventario? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "SELECT id, tipo_item, item_id, cantidad, minimo, updated_at FROM Inventario WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read())
                {
                    return new Inventario
                    {
                        Id        = reader.GetInt32("id"),
                        TipoItem  = reader.IsDBNull(reader.GetOrdinal("tipo_item")) ? null : reader.GetString("tipo_item"),
                        ItemId    = reader.GetInt32("item_id"),
                        Cantidad  = reader.IsDBNull(reader.GetOrdinal("cantidad")) ? 0 : reader.GetDecimal("cantidad"),
                        Minimo    = reader.IsDBNull(reader.GetOrdinal("minimo"))   ? 0 : reader.GetDecimal("minimo"),
                        UpdatedAt = reader.GetDateTime("updated_at")
                    };
                }
            }
            return null;
        }

        public void AgregarInventario(Inventario inventario)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "INSERT INTO Inventario (tipo_item, item_id, cantidad, minimo) VALUES (@TipoItem, @ItemId, @Cantidad, @Minimo)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@TipoItem", inventario.TipoItem);
                cmd.Parameters.AddWithValue("@ItemId",   inventario.ItemId);
                cmd.Parameters.AddWithValue("@Cantidad", inventario.Cantidad);
                cmd.Parameters.AddWithValue("@Minimo",   inventario.Minimo);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarInventario(int id, Inventario inventario)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "UPDATE Inventario SET tipo_item=@TipoItem, item_id=@ItemId, cantidad=@Cantidad, minimo=@Minimo WHERE id=@Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@TipoItem", inventario.TipoItem);
                cmd.Parameters.AddWithValue("@ItemId",   inventario.ItemId);
                cmd.Parameters.AddWithValue("@Cantidad", inventario.Cantidad);
                cmd.Parameters.AddWithValue("@Minimo",   inventario.Minimo);
                cmd.Parameters.AddWithValue("@Id",       id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarInventario(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM Inventario WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }
    }
}
