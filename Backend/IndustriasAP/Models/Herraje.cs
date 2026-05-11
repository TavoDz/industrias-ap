namespace InsutriasAP.Models { 
    public class Herraje
    {
        public int Id { get; set; }

        public string Nombre { get; set; }

        public string Marca { get; set; }

        public decimal PrecioUnitario { get; set; }

        public int Estado { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}