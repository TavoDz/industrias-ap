namespace InsutriasAP.Models
{
    public class Proyecto
    {
        public int      Id            { get; set; }
        public int      CotizacionId  { get; set; }
        public string   Nombre        { get; set; } = string.Empty;
        public string   Estado        { get; set; } = "pendiente";
        public string?  Notas         { get; set; }
        public DateTime? FechaInicio  { get; set; }
        public DateTime? FechaEntrega { get; set; }
        public DateTime CreatedAt     { get; set; }
        public DateTime UpdatedAt     { get; set; }
    }

    public class ProyectoDto
    {
        public int      CotizacionId  { get; set; }
        public string   Nombre        { get; set; } = string.Empty;
        public string?  Notas         { get; set; }
        public DateTime? FechaInicio  { get; set; }
        public DateTime? FechaEntrega { get; set; }
    }

    public class ActualizarProyectoDto
    {
        public string?  Nombre        { get; set; }
        public string?  Estado        { get; set; }
        public string?  Notas         { get; set; }
        public DateTime? FechaInicio  { get; set; }
        public DateTime? FechaEntrega { get; set; }
    }
}
