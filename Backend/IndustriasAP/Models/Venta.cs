namespace InsutriasAP.Models
{
    public class Venta
    {
        public int      Id             { get; set; }
        public string   Tipo           { get; set; } = "cotizacion"; // cotizacion | suelta
        public int?     CotizacionId   { get; set; }
        public int?     ClienteId      { get; set; }
        public string?  ClienteNombre  { get; set; }
        public int      UsuarioId      { get; set; }
        public string   UsuarioNombre  { get; set; } = string.Empty;
        public DateTime Fecha          { get; set; }
        public decimal  Subtotal       { get; set; }
        public decimal  Descuento      { get; set; }
        public decimal  Total          { get; set; }
        public string   Estado         { get; set; } = "pendiente_pago"; // pendiente_pago | pagada | anulada
        public string?  Notas          { get; set; }
    }

    public class DetalleVenta
    {
        public int     Id             { get; set; }
        public int     VentaId        { get; set; }
        public string  Descripcion    { get; set; } = string.Empty;
        public decimal Cantidad       { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal       { get; set; }
    }

    public class PagoVenta
    {
        public int      Id         { get; set; }
        public int      VentaId    { get; set; }
        public string   Metodo     { get; set; } = string.Empty; // efectivo | transferencia | tarjeta
        public decimal  Monto      { get; set; }
        public string?  Referencia { get; set; }
        public DateTime Fecha      { get; set; }
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public class CrearVentaDto
    {
        public string   Tipo          { get; set; } = "cotizacion";
        public int?     CotizacionId  { get; set; }
        public int?     ClienteId     { get; set; }
        public string?  ClienteNombre { get; set; }
        public int      UsuarioId     { get; set; }
        public string   UsuarioNombre { get; set; } = string.Empty;
        public decimal  Descuento     { get; set; } = 0;
        public string?  Notas         { get; set; }
        public List<DetalleVentaDto>  Detalle { get; set; } = new(); // solo para sueltas
        public List<PagoVentaDto>     Pagos   { get; set; } = new();
    }

    public class DetalleVentaDto
    {
        public string  Descripcion    { get; set; } = string.Empty;
        public decimal Cantidad       { get; set; } = 1;
        public decimal PrecioUnitario { get; set; }
        public int?    InventarioId   { get; set; }  // si vino del inventario, descuenta stock
    }

    public class PagoVentaDto
    {
        public string  Metodo     { get; set; } = string.Empty;
        public decimal Monto      { get; set; }
        public string? Referencia { get; set; }
    }

    public class AgregarPagoDto
    {
        public string  Metodo     { get; set; } = string.Empty;
        public decimal Monto      { get; set; }
        public string? Referencia { get; set; }
    }
}
