namespace InsutriasAP.Models
{
    /// <summary>
    /// Entidad que representa una optimización de corte 2D guardada.
    /// </summary>
    public class Optimizacion
    {
        public int      Id             { get; set; }
        public string?  Nombre         { get; set; }
        public DateTime Fecha          { get; set; } = DateTime.UtcNow;
        public string   MaterialNombre { get; set; } = string.Empty;

        /// <summary>JSON serializado del objeto OptimizarResponse completo.</summary>
        public string   JsonResultado  { get; set; } = string.Empty;

        /// <summary>JSON serializado del OptimizarRequest original (opcional).</summary>
        public string?  JsonRequest    { get; set; }
    }
}
