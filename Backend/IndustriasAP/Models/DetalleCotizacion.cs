namespace InsutriasAP.Models
{
    public class DetalleCotizacion
    {
        public int Id { get; set; }

        public int CotizacionId { get; set; }

        public string TipoItem { get; set; }

        public int ItemId { get; set; }

        public string Descripcion { get; set; }

        public decimal Cantidad { get; set; }

        public decimal PrecioUnitario { get; set; }

        public decimal Subtotal { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}