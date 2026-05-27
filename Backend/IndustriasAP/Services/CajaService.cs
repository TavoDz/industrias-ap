using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class CajaService
    {
        private readonly DatabaseConnection _db;

        public CajaService(DatabaseConnection db) { _db = db; }

        // ── Caja del día ──────────────────────────────────────────────────────
        public object? CajaHoy()
        {
            using var conn = _db.GetConnection();
            conn.Open();
            return ObtenerCajaPorFecha(conn, DateTime.Today);
        }

        public object? ObtenerPorFecha(DateTime fecha)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            return ObtenerCajaPorFecha(conn, fecha.Date);
        }

        public List<object> ListarCajas(int limite = 30)
        {
            var lista = new List<object>();
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = $@"
                SELECT c.*,
                    (SELECT IFNULL(SUM(m.monto),0) FROM movimientos_caja m WHERE m.caja_id = c.id AND m.tipo IN ('venta','entrada')) AS total_entradas,
                    (SELECT IFNULL(SUM(m.monto),0) FROM movimientos_caja m WHERE m.caja_id = c.id AND m.tipo = 'salida')           AS total_salidas
                FROM caja c
                ORDER BY c.fecha DESC
                LIMIT {limite}";
            var cmd = new MySqlCommand(sql, conn);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                lista.Add(new
                {
                    Id             = r.GetInt32("id"),
                    Fecha          = r.GetDateTime("fecha"),
                    UsuarioNombre  = r.GetString("usuario_nombre"),
                    MontoApertura  = r.GetDecimal("monto_apertura"),
                    MontoCierre    = r.IsDBNull(r.GetOrdinal("monto_cierre")) ? (decimal?)null : r.GetDecimal("monto_cierre"),
                    Estado         = r.GetString("estado"),
                    TotalEntradas  = r.GetDecimal("total_entradas"),
                    TotalSalidas   = r.GetDecimal("total_salidas"),
                });
            }
            return lista;
        }

        // ── Abrir caja ────────────────────────────────────────────────────────
        public int Abrir(AbrirCajaDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            // Solo una caja por día
            var exist = new MySqlCommand("SELECT id FROM caja WHERE fecha = @Fecha", conn);
            exist.Parameters.AddWithValue("@Fecha", DateTime.Today);
            var existId = exist.ExecuteScalar();
            if (existId != null) return Convert.ToInt32(existId);

            var sql = @"INSERT INTO caja (fecha, usuario_id, usuario_nombre, monto_apertura, estado, notas_apertura)
                        VALUES (@Fecha, @UserId, @UserNombre, @Monto, 'abierta', @Notas);
                        SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Fecha",      DateTime.Today);
            cmd.Parameters.AddWithValue("@UserId",     dto.UsuarioId);
            cmd.Parameters.AddWithValue("@UserNombre", dto.UsuarioNombre);
            cmd.Parameters.AddWithValue("@Monto",      dto.MontoApertura);
            cmd.Parameters.AddWithValue("@Notas",      (object?)dto.NotasApertura ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        // ── Cerrar caja ───────────────────────────────────────────────────────
        public bool Cerrar(int cajaId, CerrarCajaDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"UPDATE caja SET
                            monto_cierre  = @Monto,
                            estado        = 'cerrada',
                            notas_cierre  = @Notas
                        WHERE id = @Id AND estado = 'abierta'";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Id",    cajaId);
            cmd.Parameters.AddWithValue("@Monto", dto.MontoCierre);
            cmd.Parameters.AddWithValue("@Notas", (object?)dto.NotasCierre ?? DBNull.Value);
            return cmd.ExecuteNonQuery() > 0;
        }

        // ── Movimiento manual ─────────────────────────────────────────────────
        public int AgregarMovimiento(int cajaId, MovimientoManualDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var sql = @"INSERT INTO movimientos_caja (caja_id, tipo, concepto, monto, metodo, referencia)
                        VALUES (@CajaId, @Tipo, @Concepto, @Monto, @Metodo, @Ref);
                        SELECT LAST_INSERT_ID();";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@CajaId",   cajaId);
            cmd.Parameters.AddWithValue("@Tipo",     dto.Tipo);
            cmd.Parameters.AddWithValue("@Concepto", dto.Concepto);
            cmd.Parameters.AddWithValue("@Monto",    dto.Monto);
            cmd.Parameters.AddWithValue("@Metodo",   dto.Metodo);
            cmd.Parameters.AddWithValue("@Ref",      (object?)dto.Referencia ?? DBNull.Value);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        // ── Registrar venta en caja ───────────────────────────────────────────
        public void RegistrarVentaEnCaja(int cajaId, int ventaId, string concepto, List<PagoVentaDto> pagos)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            foreach (var p in pagos)
            {
                var sql = @"INSERT INTO movimientos_caja (caja_id, tipo, concepto, monto, metodo, venta_id)
                            VALUES (@CajaId, 'venta', @Concepto, @Monto, @Metodo, @VentaId)";
                var cmd = new MySqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@CajaId",   cajaId);
                cmd.Parameters.AddWithValue("@Concepto", concepto);
                cmd.Parameters.AddWithValue("@Monto",    p.Monto);
                cmd.Parameters.AddWithValue("@Metodo",   p.Metodo);
                cmd.Parameters.AddWithValue("@VentaId",  ventaId);
                cmd.ExecuteNonQuery();
            }
        }

        // ── Helper ────────────────────────────────────────────────────────────
        private object? ObtenerCajaPorFecha(MySqlConnection conn, DateTime fecha)
        {
            var cmd = new MySqlCommand("SELECT * FROM caja WHERE fecha = @Fecha", conn);
            cmd.Parameters.AddWithValue("@Fecha", fecha);
            Caja? caja = null;
            using (var r = cmd.ExecuteReader())
            {
                if (!r.Read()) return null;
                caja = new Caja
                {
                    Id            = r.GetInt32("id"),
                    Fecha         = r.GetDateTime("fecha"),
                    UsuarioId     = r.GetInt32("usuario_id"),
                    UsuarioNombre = r.GetString("usuario_nombre"),
                    MontoApertura = r.GetDecimal("monto_apertura"),
                    MontoCierre   = r.IsDBNull(r.GetOrdinal("monto_cierre")) ? null : r.GetDecimal("monto_cierre"),
                    Estado        = r.GetString("estado"),
                    NotasApertura = r.IsDBNull(r.GetOrdinal("notas_apertura")) ? null : r.GetString("notas_apertura"),
                    NotasCierre   = r.IsDBNull(r.GetOrdinal("notas_cierre"))   ? null : r.GetString("notas_cierre"),
                    CreatedAt     = r.GetDateTime("created_at"),
                };
            }

            // Movimientos
            var movs = new List<object>();
            var cmdM = new MySqlCommand(
                "SELECT * FROM movimientos_caja WHERE caja_id = @Id ORDER BY fecha", conn);
            cmdM.Parameters.AddWithValue("@Id", caja.Id);
            using (var r = cmdM.ExecuteReader())
            {
                while (r.Read()) movs.Add(new
                {
                    Id         = r.GetInt32("id"),
                    Tipo       = r.GetString("tipo"),
                    Concepto   = r.GetString("concepto"),
                    Monto      = r.GetDecimal("monto"),
                    Metodo     = r.GetString("metodo"),
                    Referencia = r.IsDBNull(r.GetOrdinal("referencia")) ? null : (string?)r.GetString("referencia"),
                    VentaId    = r.IsDBNull(r.GetOrdinal("venta_id"))   ? null : (int?)r.GetInt32("venta_id"),
                    Fecha      = r.GetDateTime("fecha"),
                });
            }

            // Totales por método
            decimal totalEfectivo = 0, totalTransferencia = 0, totalTarjeta = 0, totalSalidas = 0;
            foreach (dynamic m in movs)
            {
                if (m.Tipo == "salida") { totalSalidas += (decimal)m.Monto; continue; }
                if (m.Metodo == "efectivo")      totalEfectivo      += (decimal)m.Monto;
                if (m.Metodo == "transferencia") totalTransferencia += (decimal)m.Monto;
                if (m.Metodo == "tarjeta")       totalTarjeta       += (decimal)m.Monto;
            }

            return new
            {
                Caja                = caja,
                Movimientos         = movs,
                TotalEfectivo       = totalEfectivo,
                TotalTransferencia  = totalTransferencia,
                TotalTarjeta        = totalTarjeta,
                TotalSalidas        = totalSalidas,
                TotalEntradas       = totalEfectivo + totalTransferencia + totalTarjeta,
                SaldoEsperado       = caja.MontoApertura + totalEfectivo - totalSalidas,
            };
        }
    }
}
