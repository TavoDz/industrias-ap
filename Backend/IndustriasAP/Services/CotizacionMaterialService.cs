using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CotizacionMaterialService
    {
        private readonly DatabaseConnection db;

        public CotizacionMaterialService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<CotizacionMaterialDetallado> ObtenerPorCotizacion(int cotizacionId)
        {
            var lista = new List<CotizacionMaterialDetallado>();
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT cm.id, cm.cotizacion_id, cm.material_id, cm.descripcion,
                       cm.cantidad_planchas, cm.porcentaje_uso, cm.precio_unitario, cm.subtotal,
                       m.nombre AS material_nombre
                FROM cotizacion_materiales cm
                LEFT JOIN Materiales m ON m.id = cm.material_id
                WHERE cm.cotizacion_id = @CotId
                ORDER BY cm.created_at";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CotId", cotizacionId);
            using var r = cmd.ExecuteReader();
            while (r.Read())
                lista.Add(MapDetallado(r));
            return lista;
        }

        public int Agregar(int cotizacionId, int materialId, string? descripcion, decimal cantidadPlanchas)
        {
            using var conn = db.GetConnection();
            conn.Open();

            decimal precioUnitario = 0;
            var cmdPrecio = new MySqlCommand("SELECT precio_tablero FROM Materiales WHERE id = @Id", conn);
            cmdPrecio.Parameters.AddWithValue("@Id", materialId);
            var precioObj = cmdPrecio.ExecuteScalar();
            if (precioObj != null && precioObj != DBNull.Value)
                precioUnitario = Convert.ToDecimal(precioObj);

            decimal subtotal = precioUnitario * cantidadPlanchas;

            const string sql = @"
                INSERT INTO cotizacion_materiales
                    (cotizacion_id, material_id, descripcion, cantidad_planchas, porcentaje_uso, precio_unitario, subtotal)
                VALUES
                    (@CotId, @MatId, @Desc, @Cantidad, 100, @Precio, @Subtotal);
                SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CotId",    cotizacionId);
            cmd.Parameters.AddWithValue("@MatId",    materialId);
            cmd.Parameters.AddWithValue("@Desc",     descripcion ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Cantidad", cantidadPlanchas);
            cmd.Parameters.AddWithValue("@Precio",   precioUnitario);
            cmd.Parameters.AddWithValue("@Subtotal", subtotal);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Actualizar(int id, decimal cantidadPlanchas, string? descripcion)
        {
            using var conn = db.GetConnection();
            conn.Open();

            decimal precioUnitario = 0;
            var cmdPrecio = new MySqlCommand("SELECT precio_unitario FROM cotizacion_materiales WHERE id = @Id", conn);
            cmdPrecio.Parameters.AddWithValue("@Id", id);
            var obj = cmdPrecio.ExecuteScalar();
            if (obj != null && obj != DBNull.Value)
                precioUnitario = Convert.ToDecimal(obj);

            decimal subtotal = precioUnitario * cantidadPlanchas;

            const string sql = @"
                UPDATE cotizacion_materiales
                SET cantidad_planchas = @Cantidad,
                    descripcion       = @Desc,
                    subtotal          = @Subtotal
                WHERE id = @Id";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Cantidad", cantidadPlanchas);
            cmd.Parameters.AddWithValue("@Desc",     descripcion ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Subtotal", subtotal);
            cmd.Parameters.AddWithValue("@Id",       id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Eliminar(int id)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("DELETE FROM cotizacion_materiales WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        private static CotizacionMaterialDetallado MapDetallado(MySqlDataReader r) => new()
        {
            Id              = r.GetInt32("id"),
            CotizacionId    = r.GetInt32("cotizacion_id"),
            MaterialId      = r.GetInt32("material_id"),
            MaterialNombre  = r.IsDBNull(r.GetOrdinal("material_nombre")) ? "" : r.GetString("material_nombre"),
            Descripcion     = r.IsDBNull(r.GetOrdinal("descripcion"))     ? null : r.GetString("descripcion"),
            CantidadPlanchas = r.GetDecimal("cantidad_planchas"),
            PorcentajeUso   = r.GetDecimal("porcentaje_uso"),
            PrecioUnitario  = r.GetDecimal("precio_unitario"),
            Subtotal        = r.GetDecimal("subtotal"),
        };
    }
}
