namespace InsutriasAP.Models
{
    public class Cotizacion
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public int UsuarioId { get; set; }
        public DateTime Fecha { get; set; }
        public string? DescripcionGeneral { get; set; }
        public string TipoAcabado { get; set; } = "normal";
        public decimal PorcentajeGanancia { get; set; } = 35;
        public decimal TotalMateriales { get; set; }
        public decimal TotalHerrajes { get; set; }
        public decimal TotalServicios { get; set; }
        public decimal TotalManoObra { get; set; }
        public decimal SubtotalCostos { get; set; }
        public decimal MontoGanancia { get; set; }
        public decimal Descuento { get; set; }
        public decimal Total { get; set; }
        public int? TiempoEstimadoDias { get; set; }
        public string? Observaciones { get; set; }
        public string? Terminos { get; set; }
        public string Estado { get; set; } = "pendiente";
    }
}
