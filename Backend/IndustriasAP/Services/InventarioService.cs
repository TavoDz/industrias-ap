using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class InventarioService
    {
        private readonly DatabaseConnection db;

        public InventarioService(DatabaseConnection db)
        {
            this.db = db;
        }

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

        public List<object> ObtenerDisponible()
        {
            var lista = new List<object>();
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT
                    inv.id       AS inventario_id,
                    inv.tipo_item,
                    inv.cantidad,
                    inv.minimo,
                    CASE
                        WHEN inv.tipo_item = 'material' THEN m.nombre
                        WHEN inv.tipo_item = 'herraje'  THEN h.nombre
                        ELSE CONCAT(inv.tipo_item, ' #', inv.item_id)
                    END AS nombre,
                    CASE
                        WHEN inv.tipo_item = 'material' THEN m.precio_tablero
                        WHEN inv.tipo_item = 'herraje'  THEN h.precio_unitario
                        ELSE 0
                    END AS precio
                FROM Inventario inv
                LEFT JOIN Materiales m ON inv.tipo_item = 'material' AND m.id = inv.item_id
                LEFT JOIN Herrajes   h ON inv.tipo_item = 'herraje'  AND h.id = inv.item_id
                WHERE inv.cantidad > 0
                ORDER BY nombre";
            var cmd = new MySqlCommand(sql, conn);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                lista.Add(new
                {
                    InventarioId = r.GetInt32("inventario_id"),
                    TipoItem     = r.GetString("tipo_item"),
                    Nombre       = r.IsDBNull(r.GetOrdinal("nombre")) ? "" : r.GetString("nombre"),
                    Precio       = r.IsDBNull(r.GetOrdinal("precio")) ? 0m : r.GetDecimal("precio"),
                    Cantidad     = r.GetDecimal("cantidad"),
                    Minimo       = r.GetDecimal("minimo"),
                });
            }
            return lista;
        }

        public bool DescontarStock(int inventarioId, decimal cantidad)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand(
                "UPDATE Inventario SET cantidad = cantidad - @Cantidad WHERE id = @Id AND cantidad >= @Cantidad",
                conn);
            cmd.Parameters.AddWithValue("@Cantidad", cantidad);
            cmd.Parameters.AddWithValue("@Id",       inventarioId);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}
