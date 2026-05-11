namespace InsutriasAP.Models
{
    public class Cliente
    {
        public int Id { get; set; }

        public string Nombre { get; set; }

        public string Telefono { get; set; }

        public string Email { get; set; }

        public string Direccion { get; set; }

        public int Estado { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}