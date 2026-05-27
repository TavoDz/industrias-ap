using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CotizacionManoObraService
    {
        private readonly DatabaseConnection db;

        public CotizacionManoObraService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<CotizacionManoObra> ObtenerPorCotizacion(int cotizacionId)
        {
            var lista = new List<CotizacionManoObra>();
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand(
                "SELECT id, cotizacion_id, descripcion, costo, created_at FROM cotizacion_mano_obra WHERE cotizacion_id = @CotId ORDER BY created_at",
                conn);
            cmd.Parameters.AddWithValue("@CotId", cotizacionId);
            using var r = cmd.ExecuteReader();
            while (r.Read())
                lista.Add(new CotizacionManoObra
                {
                    Id            = r.GetInt32("id"),
                    CotizacionId  = r.GetInt32("cotizacion_id"),
                    Descripcion   = r.GetString("descripcion"),
                    Costo         = r.GetDecimal("costo"),
                    CreatedAt     = r.GetDateTime("created_at"),
                });
            return lista;
        }

        public int Agregar(int cotizacionId, string descripcion, decimal costo)
        {
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO cotizacion_mano_obra (cotizacion_id, descripcion, costo)
                VALUES (@CotId, @Desc, @Costo);
                SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CotId", cotizacionId);
            cmd.Parameters.AddWithValue("@Desc",  descripcion);
            cmd.Parameters.AddWithValue("@Costo", costo);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Eliminar(int id)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("DELETE FROM cotizacion_mano_obra WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}
