namespace InsutriasAP.Models
{
    public class Optimizacion
    {
        public int       Id               { get; set; }
        public string?   Nombre           { get; set; }
        public string?   Descripcion      { get; set; }
        public DateTime  Fecha            { get; set; } = DateTime.UtcNow;
        public DateTime? UltimaEjecucion  { get; set; }
        public int?      CotizacionId     { get; set; }
        public int?      MaterialId       { get; set; }
        public string    MaterialNombre   { get; set; } = string.Empty;
        public int       TotalEjecuciones { get; set; } = 0;
        public string    JsonResultado    { get; set; } = string.Empty;
        public string?   JsonRequest      { get; set; }
    }
}
