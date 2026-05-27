using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class ComentarioService
    {
        private readonly DatabaseConnection _db;

        public ComentarioService(DatabaseConnection db) { _db = db; }

        public List<ComentarioCotizacion> ObtenerPorCotizacion(int cotizacionId)
        {
            var lista = new List<ComentarioCotizacion>();
            using var conn = _db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand(
                "SELECT id, cotizacion_id, usuario_id, usuario_nombre, comentario, created_at " +
                "FROM comentarios_cotizacion WHERE cotizacion_id = @CotId ORDER BY created_at ASC", conn);
            cmd.Parameters.AddWithValue("@CotId", cotizacionId);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                lista.Add(new ComentarioCotizacion
                {
                    Id            = r.GetInt32("id"),
                    CotizacionId  = r.GetInt32("cotizacion_id"),
                    UsuarioId     = r.GetInt32("usuario_id"),
                    UsuarioNombre = r.IsDBNull(r.GetOrdinal("usuario_nombre")) ? "" : r.GetString("usuario_nombre"),
                    Comentario    = r.IsDBNull(r.GetOrdinal("comentario"))     ? "" : r.GetString("comentario"),
                    CreatedAt     = r.GetDateTime("created_at"),
                });
            }
            return lista;
        }

        public int Agregar(ComentarioDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"INSERT INTO comentarios_cotizacion (cotizacion_id, usuario_id, usuario_nombre, comentario)
                        VALUES (@CotId, @UserId, @UserNombre, @Comentario);
                        SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CotId",      dto.CotizacionId);
            cmd.Parameters.AddWithValue("@UserId",     dto.UsuarioId);
            cmd.Parameters.AddWithValue("@UserNombre", dto.UsuarioNombre);
            cmd.Parameters.AddWithValue("@Comentario", dto.Comentario);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Eliminar(int id)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("DELETE FROM comentarios_cotizacion WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}
