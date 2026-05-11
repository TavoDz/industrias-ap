namespace InsutriasAP.Models { 
    public class Cotizacion
    {
        public int Id { get; set; }

        public int ClienteId { get; set; }

        public int UsuarioId { get; set; }

        public DateTime Fecha { get; set; }

        public decimal TotalMateriales { get; set; }

        public decimal TotalHerrajes { get; set; }

        public decimal TotalServicios { get; set; }

        public decimal Total { get; set; }

        public string Estado { get; set; }
    }
}