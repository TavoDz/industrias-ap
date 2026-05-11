namespace InsutriasAP.Models
{
    public class Material
    {
        public int Id { get; set; }

        public string Nombre { get; set; }

        public string Tipo { get; set; }

        public decimal Grosor { get; set; }

        public decimal Largo { get; set; }

        public decimal Ancho { get; set; }

        public decimal PrecioTablero { get; set; }

        public int Estado { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}