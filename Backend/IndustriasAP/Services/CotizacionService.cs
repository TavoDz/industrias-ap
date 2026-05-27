using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CotizacionService
    {
        private readonly DatabaseConnection db;

        public CotizacionService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<Cotizacion> ObtenerTodos()
        {
            var lista = new List<Cotizacion>();
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT id, cliente_id, usuario_id, fecha,
                       total_materiales, total_herrajes, total_servicios, total_mano_obra,
                       subtotal_costos, monto_ganancia, porcentaje_ganancia, descuento, total,
                       estado, tipo_acabado, descripcion_general,
                       tiempo_estimado_dias, observaciones, terminos
                FROM cotizaciones
                ORDER BY fecha DESC";
            var cmd = new MySqlCommand(sql, conn);
            using var r = cmd.ExecuteReader();
            while (r.Read()) lista.Add(MapCotizacion(r));
            return lista;
        }

        public Cotizacion? ObtenerPorId(int id)
        {
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT id, cliente_id, usuario_id, fecha,
                       total_materiales, total_herrajes, total_servicios, total_mano_obra,
                       subtotal_costos, monto_ganancia, porcentaje_ganancia, descuento, total,
                       estado, tipo_acabado, descripcion_general,
                       tiempo_estimado_dias, observaciones, terminos
                FROM cotizaciones WHERE id = @Id";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            using var r = cmd.ExecuteReader();
            return r.Read() ? MapCotizacion(r) : null;
        }

        public List<Cotizacion> ObtenerPorCliente(int clienteId)
        {
            var lista = new List<Cotizacion>();
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                SELECT id, cliente_id, usuario_id, fecha,
                       total_materiales, total_herrajes, total_servicios, total_mano_obra,
                       subtotal_costos, monto_ganancia, porcentaje_ganancia, descuento, total,
                       estado, tipo_acabado, descripcion_general,
                       tiempo_estimado_dias, observaciones, terminos
                FROM cotizaciones WHERE cliente_id = @ClienteId ORDER BY fecha DESC";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ClienteId", clienteId);
            using var r = cmd.ExecuteReader();
            while (r.Read()) lista.Add(MapCotizacion(r));
            return lista;
        }

        public int AgregarCotizacion(Cotizacion cotizacion)
        {
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                INSERT INTO cotizaciones
                    (cliente_id, usuario_id, total_materiales, total_herrajes, total_servicios,
                     total_mano_obra, subtotal_costos, monto_ganancia, porcentaje_ganancia, descuento, total,
                     estado, tipo_acabado, descripcion_general, tiempo_estimado_dias, observaciones, terminos)
                VALUES
                    (@ClienteId, @UsuarioId, 0, 0, 0, 0, 0, 0, @PorcentajeGanancia, 0, 0,
                     @Estado, @TipoAcabado, @DescripcionGeneral, @TiempoEstimadoDias, @Observaciones, @Terminos);
                SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@ClienteId",         cotizacion.ClienteId);
            cmd.Parameters.AddWithValue("@UsuarioId",         cotizacion.UsuarioId);
            cmd.Parameters.AddWithValue("@PorcentajeGanancia", cotizacion.PorcentajeGanancia > 0 ? cotizacion.PorcentajeGanancia : 35m);
            cmd.Parameters.AddWithValue("@Estado",            cotizacion.Estado ?? "pendiente");
            cmd.Parameters.AddWithValue("@TipoAcabado",       cotizacion.TipoAcabado ?? "normal");
            cmd.Parameters.AddWithValue("@DescripcionGeneral", cotizacion.DescripcionGeneral ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TiempoEstimadoDias", cotizacion.TiempoEstimadoDias.HasValue ? cotizacion.TiempoEstimadoDias : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Observaciones",     cotizacion.Observaciones ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Terminos",          cotizacion.Terminos ?? (object)DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public bool ActualizarEstado(int id, string estado)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("UPDATE cotizaciones SET estado = @Estado WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Estado", estado);
            cmd.Parameters.AddWithValue("@Id",     id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ActualizarInfo(int id, string? descripcionGeneral, int? tiempoEstimadoDias, string? observaciones, string? terminos)
        {
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE cotizaciones SET
                    descripcion_general  = @DescripcionGeneral,
                    tiempo_estimado_dias = @TiempoEstimadoDias,
                    observaciones        = @Observaciones,
                    terminos             = @Terminos
                WHERE id = @Id";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@DescripcionGeneral", descripcionGeneral ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TiempoEstimadoDias", tiempoEstimadoDias.HasValue ? tiempoEstimadoDias : (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Observaciones",      observaciones ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Terminos",           terminos ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Id",                 id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ActualizarGanancia(int id, string tipoAcabado, decimal porcentajeGanancia)
        {
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE cotizaciones SET
                    tipo_acabado       = @TipoAcabado,
                    porcentaje_ganancia = @Porcentaje
                WHERE id = @Id";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@TipoAcabado", tipoAcabado);
            cmd.Parameters.AddWithValue("@Porcentaje",  porcentajeGanancia);
            cmd.Parameters.AddWithValue("@Id",          id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool RecalcularTotales(int id)
        {
            using var conn = db.GetConnection();
            conn.Open();
            const string sql = @"
                UPDATE cotizaciones c SET
                    total_materiales = COALESCE((SELECT SUM(subtotal) FROM cotizacion_materiales WHERE cotizacion_id = c.id), 0),
                    total_herrajes   = COALESCE((SELECT SUM(subtotal) FROM detalleherrajes       WHERE cotizacion_id = c.id), 0),
                    total_servicios  = COALESCE((SELECT SUM(subtotal) FROM detalleservicios      WHERE cotizacion_id = c.id), 0),
                    total_mano_obra  = COALESCE((SELECT SUM(costo)    FROM cotizacion_mano_obra  WHERE cotizacion_id = c.id), 0),
                    subtotal_costos  = (
                        COALESCE((SELECT SUM(subtotal) FROM cotizacion_materiales WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(subtotal) FROM detalleherrajes       WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(subtotal) FROM detalleservicios      WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(costo)    FROM cotizacion_mano_obra  WHERE cotizacion_id = c.id), 0)
                    ),
                    monto_ganancia   = (
                        COALESCE((SELECT SUM(subtotal) FROM cotizacion_materiales WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(subtotal) FROM detalleherrajes       WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(subtotal) FROM detalleservicios      WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(costo)    FROM cotizacion_mano_obra  WHERE cotizacion_id = c.id), 0)
                    ) * c.porcentaje_ganancia / 100,
                    total            = (
                        COALESCE((SELECT SUM(subtotal) FROM cotizacion_materiales WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(subtotal) FROM detalleherrajes       WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(subtotal) FROM detalleservicios      WHERE cotizacion_id = c.id), 0) +
                        COALESCE((SELECT SUM(costo)    FROM cotizacion_mano_obra  WHERE cotizacion_id = c.id), 0)
                    ) * (1 + c.porcentaje_ganancia / 100) - c.descuento
                WHERE c.id = @Id";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool ActualizarDescuento(int id, decimal descuento)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("UPDATE cotizaciones SET descuento = @Descuento WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Descuento", descuento);
            cmd.Parameters.AddWithValue("@Id",        id);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool EliminarCotizacion(int id)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("UPDATE cotizaciones SET estado = 'cancelada' WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        private static Cotizacion MapCotizacion(MySqlDataReader r) => new()
        {
            Id                  = r.GetInt32("id"),
            ClienteId           = r.GetInt32("cliente_id"),
            UsuarioId           = r.GetInt32("usuario_id"),
            Fecha               = r.GetDateTime("fecha"),
            TotalMateriales     = r.IsDBNull(r.GetOrdinal("total_materiales"))    ? 0    : r.GetDecimal("total_materiales"),
            TotalHerrajes       = r.IsDBNull(r.GetOrdinal("total_herrajes"))      ? 0    : r.GetDecimal("total_herrajes"),
            TotalServicios      = r.IsDBNull(r.GetOrdinal("total_servicios"))     ? 0    : r.GetDecimal("total_servicios"),
            TotalManoObra       = r.IsDBNull(r.GetOrdinal("total_mano_obra"))     ? 0    : r.GetDecimal("total_mano_obra"),
            SubtotalCostos      = r.IsDBNull(r.GetOrdinal("subtotal_costos"))     ? 0    : r.GetDecimal("subtotal_costos"),
            MontoGanancia       = r.IsDBNull(r.GetOrdinal("monto_ganancia"))      ? 0    : r.GetDecimal("monto_ganancia"),
            PorcentajeGanancia  = r.IsDBNull(r.GetOrdinal("porcentaje_ganancia")) ? 35m  : r.GetDecimal("porcentaje_ganancia"),
            Descuento           = r.IsDBNull(r.GetOrdinal("descuento"))           ? 0    : r.GetDecimal("descuento"),
            Total               = r.IsDBNull(r.GetOrdinal("total"))               ? 0    : r.GetDecimal("total"),
            Estado              = r.IsDBNull(r.GetOrdinal("estado"))              ? null : r.GetString("estado"),
            TipoAcabado         = r.IsDBNull(r.GetOrdinal("tipo_acabado"))        ? "normal" : r.GetString("tipo_acabado"),
            DescripcionGeneral  = r.IsDBNull(r.GetOrdinal("descripcion_general")) ? null : r.GetString("descripcion_general"),
            TiempoEstimadoDias  = r.IsDBNull(r.GetOrdinal("tiempo_estimado_dias")) ? null : r.GetInt32("tiempo_estimado_dias"),
            Observaciones       = r.IsDBNull(r.GetOrdinal("observaciones"))       ? null : r.GetString("observaciones"),
            Terminos            = r.IsDBNull(r.GetOrdinal("terminos"))            ? null : r.GetString("terminos"),
        };
    }
}
