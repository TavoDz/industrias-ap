namespace InsutriasAP.Models
{
    public class PiezaCorte
    {
        public int Id { get; set; }

        public int CotizacionId { get; set; }

        public string NombrePieza { get; set; }

        public int MaterialId { get; set; }

        public decimal Largo { get; set; }

        public decimal Ancho { get; set; }

        public int Cantidad { get; set; }

        public decimal MetroTapacanto { get; set; }

        public decimal CostoMaterial { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}