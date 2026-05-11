namespace InsutriasAP.Models { 
    public class Inventario
    {
        public int Id { get; set; }

        public string TipoItem { get; set; }

        public int ItemId { get; set; }

        public decimal Cantidad { get; set; }

        public decimal Minimo { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}