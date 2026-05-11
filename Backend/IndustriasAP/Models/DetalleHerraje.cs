namespace InsutriasAP.Models
{
    public class DetalleHerraje
    {
        public int Id { get; set; }

        public int CotizacionId { get; set; }

        public int HerrajeId { get; set; }

        public int Cantidad { get; set; }

        public decimal PrecioUnitario { get; set; }

        public decimal Subtotal { get; set; }
    }
}
