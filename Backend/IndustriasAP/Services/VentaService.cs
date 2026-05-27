using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class VentaService
    {
        private readonly DatabaseConnection _db;

        public VentaService(DatabaseConnection db) { _db = db; }

        // ── Listar ventas con pagos sumados ───────────────────────────────────
        public List<object> ObtenerTodos(string? estado = null, DateTime? desde = null, DateTime? hasta = null)
        {
            var lista = new List<object>();
            using var conn = _db.GetConnection();
            conn.Open();

            var where = new List<string>();
            if (estado != null) where.Add("v.estado = @Estado");
            if (desde  != null) where.Add("v.fecha >= @Desde");
            if (hasta  != null) where.Add("v.fecha <= @Hasta");
            var whereClause = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";

            var sql = $@"
                SELECT v.id, v.tipo, v.cotizacion_id, v.cliente_id, v.cliente_nombre,
                       v.usuario_id, v.usuario_nombre, v.fecha,
                       v.subtotal, v.descuento, v.total, v.estado, v.notas,
                       IFNULL(cl.nombre, v.cliente_nombre) AS nombre_cliente,
                       IFNULL(SUM(p.monto), 0) AS total_pagado
                FROM ventas v
                LEFT JOIN clientes cl ON cl.id = v.cliente_id
                LEFT JOIN pagos_venta p ON p.venta_id = v.id
                {whereClause}
                GROUP BY v.id
                ORDER BY v.fecha DESC";

            var cmd = new MySqlCommand(sql, conn);
            if (estado != null) cmd.Parameters.AddWithValue("@Estado", estado);
            if (desde  != null) cmd.Parameters.AddWithValue("@Desde",  desde.Value.Date);
            if (hasta  != null) cmd.Parameters.AddWithValue("@Hasta",  hasta.Value.Date.AddDays(1));

            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                lista.Add(new
                {
                    Id            = r.GetInt32("id"),
                    Tipo          = r.GetString("tipo"),
                    CotizacionId  = r.IsDBNull(r.GetOrdinal("cotizacion_id"))  ? (int?)null : r.GetInt32("cotizacion_id"),
                    ClienteId     = r.IsDBNull(r.GetOrdinal("cliente_id"))     ? (int?)null : r.GetInt32("cliente_id"),
                    ClienteNombre = r.IsDBNull(r.GetOrdinal("nombre_cliente")) ? "" : r.GetString("nombre_cliente"),
                    UsuarioNombre = r.GetString("usuario_nombre"),
                    Fecha         = r.GetDateTime("fecha"),
                    Subtotal      = r.GetDecimal("subtotal"),
                    Descuento     = r.GetDecimal("descuento"),
                    Total         = r.GetDecimal("total"),
                    TotalPagado   = r.GetDecimal("total_pagado"),
                    Estado        = r.GetString("estado"),
                    Notas         = r.IsDBNull(r.GetOrdinal("notas")) ? null : (string?)r.GetString("notas"),
                });
            }
            return lista;
        }

        // ── Obtener venta completa con detalle y pagos ────────────────────────
        public object? ObtenerCompleta(int id)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            // Encabezado
            var cmdV = new MySqlCommand(@"
                SELECT v.*, IFNULL(cl.nombre, v.cliente_nombre) AS nombre_cliente
                FROM ventas v LEFT JOIN clientes cl ON cl.id = v.cliente_id
                WHERE v.id = @Id", conn);
            cmdV.Parameters.AddWithValue("@Id", id);

            Venta? venta = null;
            string clienteNombre = "";
            using (var r = cmdV.ExecuteReader())
            {
                if (!r.Read()) return null;
                venta = MapVenta(r);
                clienteNombre = r.IsDBNull(r.GetOrdinal("nombre_cliente")) ? "" : r.GetString("nombre_cliente");
            }

            // Detalle
            var detalle = new List<object>();
            var cmdD = new MySqlCommand("SELECT * FROM detalle_venta WHERE venta_id = @Id ORDER BY id", conn);
            cmdD.Parameters.AddWithValue("@Id", id);
            using (var r = cmdD.ExecuteReader())
            {
                while (r.Read()) detalle.Add(new {
                    Id             = r.GetInt32("id"),
                    Descripcion    = r.GetString("descripcion"),
                    Cantidad       = r.GetDecimal("cantidad"),
                    PrecioUnitario = r.GetDecimal("precio_unitario"),
                    Subtotal       = r.GetDecimal("subtotal"),
                });
            }

            // Pagos
            var pagos = new List<object>();
            var cmdP = new MySqlCommand("SELECT * FROM pagos_venta WHERE venta_id = @Id ORDER BY fecha", conn);
            cmdP.Parameters.AddWithValue("@Id", id);
            using (var r = cmdP.ExecuteReader())
            {
                while (r.Read()) pagos.Add(new {
                    Id         = r.GetInt32("id"),
                    Metodo     = r.GetString("metodo"),
                    Monto      = r.GetDecimal("monto"),
                    Referencia = r.IsDBNull(r.GetOrdinal("referencia")) ? null : (string?)r.GetString("referencia"),
                    Fecha      = r.GetDateTime("fecha"),
                });
            }

            return new { Venta = venta, ClienteNombre = clienteNombre, Detalle = detalle, Pagos = pagos };
        }

        // ── Crear venta ───────────────────────────────────────────────────────
        public int Crear(CrearVentaDto dto, decimal totalCotizacion = 0)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            // Calcular subtotal
            decimal subtotal = dto.Tipo == "suelta"
                ? dto.Detalle.Sum(d => d.Cantidad * d.PrecioUnitario)
                : totalCotizacion;
            decimal total = subtotal - dto.Descuento;

            var sqlV = @"INSERT INTO ventas (tipo, cotizacion_id, cliente_id, cliente_nombre,
                            usuario_id, usuario_nombre, subtotal, descuento, total, estado, notas)
                         VALUES (@Tipo, @CotId, @ClienteId, @ClienteNombre,
                            @UserId, @UserNombre, @Subtotal, @Descuento, @Total, 'pendiente_pago', @Notas);
                         SELECT LAST_INSERT_ID();";
            var cmdV = new MySqlCommand(sqlV, conn);
            cmdV.Parameters.AddWithValue("@Tipo",         dto.Tipo);
            cmdV.Parameters.AddWithValue("@CotId",        (object?)dto.CotizacionId ?? DBNull.Value);
            cmdV.Parameters.AddWithValue("@ClienteId",    (object?)dto.ClienteId    ?? DBNull.Value);
            cmdV.Parameters.AddWithValue("@ClienteNombre",(object?)dto.ClienteNombre ?? DBNull.Value);
            cmdV.Parameters.AddWithValue("@UserId",       dto.UsuarioId);
            cmdV.Parameters.AddWithValue("@UserNombre",   dto.UsuarioNombre);
            cmdV.Parameters.AddWithValue("@Subtotal",     subtotal);
            cmdV.Parameters.AddWithValue("@Descuento",    dto.Descuento);
            cmdV.Parameters.AddWithValue("@Total",        total);
            cmdV.Parameters.AddWithValue("@Notas",        (object?)dto.Notas ?? DBNull.Value);
            int ventaId = Convert.ToInt32(cmdV.ExecuteScalar());

            // Insertar detalle (sueltas)
            foreach (var d in dto.Detalle)
            {
                var sqlD = @"INSERT INTO detalle_venta (venta_id, descripcion, cantidad, precio_unitario, subtotal)
                             VALUES (@VId, @Desc, @Cant, @Precio, @Sub)";
                var cmdD = new MySqlCommand(sqlD, conn);
                cmdD.Parameters.AddWithValue("@VId",    ventaId);
                cmdD.Parameters.AddWithValue("@Desc",   d.Descripcion);
                cmdD.Parameters.AddWithValue("@Cant",   d.Cantidad);
                cmdD.Parameters.AddWithValue("@Precio", d.PrecioUnitario);
                cmdD.Parameters.AddWithValue("@Sub",    d.Cantidad * d.PrecioUnitario);
                cmdD.ExecuteNonQuery();

                if (d.InventarioId.HasValue)
                {
                    var cmdStock = new MySqlCommand(
                        "UPDATE Inventario SET cantidad = cantidad - @Cant WHERE id = @Id",
                        conn);
                    cmdStock.Parameters.AddWithValue("@Cant", d.Cantidad);
                    cmdStock.Parameters.AddWithValue("@Id",   d.InventarioId.Value);
                    cmdStock.ExecuteNonQuery();
                }
            }

            // Insertar pagos iniciales
            foreach (var p in dto.Pagos)
                InsertarPago(conn, ventaId, p.Metodo, p.Monto, p.Referencia);

            // Recalcular estado
            ActualizarEstadoPago(conn, ventaId, total);

            return ventaId;
        }

        // ── Agregar pago a venta existente ────────────────────────────────────
        public bool AgregarPago(int ventaId, AgregarPagoDto dto)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            InsertarPago(conn, ventaId, dto.Metodo, dto.Monto, dto.Referencia);

            var cmdT = new MySqlCommand("SELECT total FROM ventas WHERE id = @Id", conn);
            cmdT.Parameters.AddWithValue("@Id", ventaId);
            var total = Convert.ToDecimal(cmdT.ExecuteScalar());
            ActualizarEstadoPago(conn, ventaId, total);
            return true;
        }

        // ── Anular venta ──────────────────────────────────────────────────────
        public bool Anular(int id)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("UPDATE ventas SET estado = 'anulada' WHERE id = @Id", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            return cmd.ExecuteNonQuery() > 0;
        }

        // ── Resumen para caja (ventas del día por método) ─────────────────────
        public object ResumenDia(DateTime fecha)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var sql = @"
                SELECT
                    COUNT(DISTINCT v.id)                                          AS total_ventas,
                    IFNULL(SUM(CASE WHEN p.metodo = 'efectivo'      THEN p.monto END), 0) AS efectivo,
                    IFNULL(SUM(CASE WHEN p.metodo = 'transferencia' THEN p.monto END), 0) AS transferencia,
                    IFNULL(SUM(CASE WHEN p.metodo = 'tarjeta'       THEN p.monto END), 0) AS tarjeta,
                    IFNULL(SUM(p.monto), 0)                                       AS total_cobrado
                FROM ventas v
                JOIN pagos_venta p ON p.venta_id = v.id
                WHERE DATE(v.fecha) = @Fecha AND v.estado != 'anulada'";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@Fecha", fecha.Date);
            using var r = cmd.ExecuteReader();
            r.Read();
            return new
            {
                TotalVentas   = r.GetInt64("total_ventas"),
                Efectivo      = r.GetDecimal("efectivo"),
                Transferencia = r.GetDecimal("transferencia"),
                Tarjeta       = r.GetDecimal("tarjeta"),
                TotalCobrado  = r.GetDecimal("total_cobrado"),
            };
        }

        // ── Helpers ───────────────────────────────────────────────────────────
        private static void InsertarPago(MySqlConnection conn, int ventaId, string metodo, decimal monto, string? referencia)
        {
            var sql = @"INSERT INTO pagos_venta (venta_id, metodo, monto, referencia)
                        VALUES (@VId, @Metodo, @Monto, @Ref)";
            var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@VId",    ventaId);
            cmd.Parameters.AddWithValue("@Metodo", metodo);
            cmd.Parameters.AddWithValue("@Monto",  monto);
            cmd.Parameters.AddWithValue("@Ref",    (object?)referencia ?? DBNull.Value);
            cmd.ExecuteNonQuery();
        }

        private static void ActualizarEstadoPago(MySqlConnection conn, int ventaId, decimal total)
        {
            var cmdSum = new MySqlCommand("SELECT IFNULL(SUM(monto),0) FROM pagos_venta WHERE venta_id = @Id", conn);
            cmdSum.Parameters.AddWithValue("@Id", ventaId);
            var pagado = Convert.ToDecimal(cmdSum.ExecuteScalar());
            var estado = pagado >= total ? "pagada" : "pendiente_pago";
            var cmdU = new MySqlCommand("UPDATE ventas SET estado = @Estado WHERE id = @Id", conn);
            cmdU.Parameters.AddWithValue("@Estado", estado);
            cmdU.Parameters.AddWithValue("@Id",     ventaId);
            cmdU.ExecuteNonQuery();
        }

        private static Venta MapVenta(MySqlDataReader r) => new()
        {
            Id            = r.GetInt32("id"),
            Tipo          = r.GetString("tipo"),
            CotizacionId  = r.IsDBNull(r.GetOrdinal("cotizacion_id"))  ? null : r.GetInt32("cotizacion_id"),
            ClienteId     = r.IsDBNull(r.GetOrdinal("cliente_id"))     ? null : r.GetInt32("cliente_id"),
            ClienteNombre = r.IsDBNull(r.GetOrdinal("cliente_nombre")) ? null : r.GetString("cliente_nombre"),
            UsuarioId     = r.GetInt32("usuario_id"),
            UsuarioNombre = r.GetString("usuario_nombre"),
            Fecha         = r.GetDateTime("fecha"),
            Subtotal      = r.GetDecimal("subtotal"),
            Descuento     = r.GetDecimal("descuento"),
            Total         = r.GetDecimal("total"),
            Estado        = r.GetString("estado"),
            Notas         = r.IsDBNull(r.GetOrdinal("notas")) ? null : r.GetString("notas"),
        };
    }
}
