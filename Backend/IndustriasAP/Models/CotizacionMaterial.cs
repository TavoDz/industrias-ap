namespace InsutriasAP.Models
{
    public class CotizacionMaterial
    {
        public int Id { get; set; }
        public int CotizacionId { get; set; }
        public int MaterialId { get; set; }
        public string? Descripcion { get; set; }
        public decimal CantidadPlanchas { get; set; } = 1;
        public decimal PorcentajeUso { get; set; } = 100;
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CotizacionMaterialDetallado
    {
        public int Id { get; set; }
        public int CotizacionId { get; set; }
        public int MaterialId { get; set; }
        public string MaterialNombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public decimal CantidadPlanchas { get; set; }
        public decimal PorcentajeUso { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}
