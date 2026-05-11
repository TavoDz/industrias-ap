namespace InsutriasAP.Models
{
    public class DetalleServicio
    {
        public int Id { get; set; }

        public int CotizacionId { get; set; }

        public int ServicioId { get; set; }

        public int Cantidad { get; set; }

        public decimal Precio { get; set; }

        public decimal Subtotal { get; set; }
    }
}
