namespace InsutriasAP.Models
{
    public class Caja
    {
        public int      Id             { get; set; }
        public DateTime Fecha          { get; set; }
        public int      UsuarioId      { get; set; }
        public string   UsuarioNombre  { get; set; } = string.Empty;
        public decimal  MontoApertura  { get; set; }
        public decimal? MontoCierre    { get; set; }
        public string   Estado         { get; set; } = "abierta"; // abierta | cerrada
        public string?  NotasApertura  { get; set; }
        public string?  NotasCierre    { get; set; }
        public DateTime CreatedAt      { get; set; }
    }

    public class MovimientoCaja
    {
        public int      Id         { get; set; }
        public int      CajaId     { get; set; }
        public string   Tipo       { get; set; } = string.Empty; // venta | entrada | salida
        public string   Concepto   { get; set; } = string.Empty;
        public decimal  Monto      { get; set; }
        public string   Metodo     { get; set; } = "efectivo";
        public string?  Referencia { get; set; }
        public int?     VentaId    { get; set; }
        public DateTime Fecha      { get; set; }
    }

    public class AbrirCajaDto
    {
        public int      UsuarioId     { get; set; }
        public string   UsuarioNombre { get; set; } = string.Empty;
        public decimal  MontoApertura { get; set; }
        public string?  NotasApertura { get; set; }
    }

    public class CerrarCajaDto
    {
        public decimal  MontoCierre { get; set; }
        public string?  NotasCierre { get; set; }
    }

    public class MovimientoManualDto
    {
        public string   Tipo       { get; set; } = string.Empty; // entrada | salida
        public string   Concepto   { get; set; } = string.Empty;
        public decimal  Monto      { get; set; }
        public string   Metodo     { get; set; } = "efectivo";
        public string?  Referencia { get; set; }
    }
}
