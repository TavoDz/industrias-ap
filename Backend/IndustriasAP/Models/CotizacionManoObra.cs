namespace InsutriasAP.Models
{
    public class CotizacionManoObra
    {
        public int Id { get; set; }
        public int CotizacionId { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public decimal Costo { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
