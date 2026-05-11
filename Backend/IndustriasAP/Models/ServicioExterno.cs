namespace InsutriasAP.Models
{
    public class ServicioExterno
    {
        public int Id { get; set; }

        public string Nombre { get; set; }

        public string Proveedor { get; set; }

        public decimal Costo { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}