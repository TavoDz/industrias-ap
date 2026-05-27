using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class ProyectoService
    {
        private readonly DatabaseConnection _db;

        public ProyectoService(DatabaseConnection db) { _db = db; }

        public List<object> ObtenerTodos(string? estado = null)
        {
            var lista = new List<object>();
            using var conn = _db.GetConnection();
            conn.Open();

            var where = estado != null ? "WHERE p.estado = @Estado" : "";
            var sql = $@"
                SELECT p.id, p.cotizacion_id, p.nombre, p.estado, p.notas,
                       p.fecha_inicio, p.fecha_entrega, p.created_at, p.updated_at,
                       c.total AS cotizacion_total, c.estado AS cotizacion_estado,
                       cl.nombre AS cliente_nombre,
                       (SELECT COUNT(*) FROM optimizaciones o WHERE o.cotizacion_id = p.cotizacion_id) AS total_optimizaciones
                FROM proyectos p
                LEFT JOIN cotizaciones c  ON c.id  = p.cotizacion_id
                LEFT JOIN clientes     cl ON cl.id = c.cliente_id
                {where}
                ORDER BY p.created_at DESC";

            var cmd = new MySqlCommand(sql, conn);
            if (estado != null) cmd.Parameters.AddWithValue("@Estado", estado);

            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                lista.Add(new
                {
                    Id                  = r.GetInt32("id"),
                    CotizacionId        = r.GetInt32("cotizacion_id"),
                    Nombre              = r.IsDBNull(r.GetOrdinal("nombre"))          ? "" : r.GetString("nombre"),
                    Estado              = r.IsDBNull(r.GetOrdinal("estado"))           ? "pendiente" : r.GetString("estado"),
                    Notas               = r.IsDBNull(r.GetOrdinal("notas"))            ? null : (string?)r.GetString("notas"),
                    FechaInicio         = r.IsDBNull(r.GetOrdinal("fecha_inicio"))     ? null : (DateTime?)r.GetDateTime("fecha_inicio"),
                    FechaEntrega        = r.IsDBNull(r.GetOrdinal("fecha_entrega"))    ? null : (DateTime?)r.GetDateTime("fecha_entrega"),
                    CreatedAt           = r.GetDateTime("created_at"),
                    UpdatedAt           = r.GetDateTime("updated_at"),
                    CotizacionTotal     = r.IsDBNull(r.GetOrdinal("cotizacion_total")) ? 0m : r.GetDecimal("cotizacion_total"),
                    CotizacionEstado    = r.IsDBNull(r.GetOrdinal("cotizacion_estado"))? "" : r.GetString("cotizacion_estado"),
                    ClienteNombre       = r.IsDBNull(r.GetOrdinal("cliente_nombre"))   ? "" : r.GetString("cliente_nombre"),
                    TotalOptimizaciones = r.GetInt64("total_optimizaciones"),
                });
            }
            return lista;
        }

        public object? ObtenerPorId(int id)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"
                SELECT p.id, p.cotizacion_id, p.nombre, p.estado, p.notas,
                       p.fecha_inicio, p.fecha_entrega, p.created_at, p.updated_at,
                       c.total AS cotizacion_total, c.estado AS cotizacion_estado,
                       cl.nombre AS cliente_nombre, cl.telefono AS cliente_telefono,
                       (SELECT COUNT(*) FROM optimizaciones o WHERE o.cotizacion_id = p.cotizacion_id) AS total_optimizaciones
                FROM proyectos p
                LEFT JOIN cotizaciones c  ON c.id  = p.cotizacion_id
                LEFT JOIN clientes     cl ON cl.id = c.cliente_id
                WHERE p.id = @Id";

            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            using var r = cmd.ExecuteReader();
            if (!r.Read()) return null;

            return new
            {
                Id                  = r.GetInt32("id"),
                CotizacionId        = r.GetInt32("cotizacion_id"),
                Nombre              = r.IsDBNull(r.GetOrdinal("nombre"))           ? "" : r.GetString("nombre"),
                Estado              = r.IsDBNull(r.GetOrdinal("estado"))            ? "pendiente" : r.GetString("estado"),
                Notas               = r.IsDBNull(r.GetOrdinal("notas"))             ? null : (string?)r.GetString("notas"),
                FechaInicio         = r.IsDBNull(r.GetOrdinal("fecha_inicio"))      ? null : (DateTime?)r.GetDateTime("fecha_inicio"),
                FechaEntrega        = r.IsDBNull(r.GetOrdinal("fecha_entrega"))     ? null : (DateTime?)r.GetDateTime("fecha_entrega"),
                CreatedAt           = r.GetDateTime("created_at"),
                UpdatedAt           = r.GetDateTime("updated_at"),
                CotizacionTotal     = r.IsDBNull(r.GetOrdinal("cotizacion_total"))  ? 0m : r.GetDecimal("cotizacion_total"),
                CotizacionEstado    = r.IsDBNull(r.GetOrdinal("cotizacion_estado")) ? "" : r.GetString("cotizacion_estado"),
                ClienteNombre       = r.IsDBNull(r.GetOrdinal("cliente_nombre"))    ? "" : r.GetString("cliente_nombre"),
                ClienteTelefono     = r.IsDBNull(r.GetOrdinal("cliente_telefono"))  ? "" : r.GetString("cliente_telefono"),
                TotalOptimizaciones = r.GetInt64("total_optimizaciones"),
            };
        }

        public bool ExistePorCotizacion(int cotizacionId)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("SELECT COUNT(*) FROM proyectos WHERE cotizacion_id = @CotId", conn);
            cmd.Parameters.AddWithValue("@CotId", cotizacionId);
            return Convert.ToInt64(cmd.ExecuteScalar()) > 0;
        }

        public int Crear(ProyectoDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"INSERT INTO proyectos (cotizacion_id, nombre, estado, notas, fecha_inicio, fecha_entrega)
                        VALUES (@CotId, @Nombre, 'pendiente', @Notas, @FechaInicio, @FechaEntrega);
                        SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CotId",       dto.CotizacionId);
            cmd.Parameters.AddWithValue("@Nombre",      dto.Nombre);
            cmd.Parameters.AddWithValue("@Notas",       (object?)dto.Notas ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@FechaInicio", (object?)dto.FechaInicio ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@FechaEntrega",(object?)dto.FechaEntrega ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool Actualizar(int id, ActualizarProyectoDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"UPDATE proyectos SET
                            nombre        = COALESCE(@Nombre, nombre),
                            estado        = COALESCE(@Estado, estado),
                            notas         = @Notas,
                            fecha_inicio  = @FechaInicio,
                            fecha_entrega = @FechaEntrega,
                            updated_at    = NOW()
                        WHERE id = @Id";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id",           id);
            cmd.Parameters.AddWithValue("@Nombre",       (object?)dto.Nombre ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Estado",       (object?)dto.Estado ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Notas",        (object?)dto.Notas ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@FechaInicio",  (object?)dto.FechaInicio ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@FechaEntrega", (object?)dto.FechaEntrega ?? DBNull.Value);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool Eliminar(int id)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("DELETE FROM proyectos WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }
    }
}
