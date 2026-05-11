namespace InsutriasAP.Models
{
    public class CotizacionCompleta
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string ClienteNombre { get; set; } = string.Empty;
        public string ClienteTelefono { get; set; } = string.Empty;
        public string ClienteEmail { get; set; } = string.Empty;
        public int UsuarioId { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string Estado { get; set; } = string.Empty;
        public List<PiezaCorteDetallada> Piezas { get; set; } = new();
        public List<DetalleHerrajeDetallado> Herrajes { get; set; } = new();
        public List<DetalleServicioDetallado> Servicios { get; set; } = new();
        public decimal TotalMateriales { get; set; }
        public decimal TotalHerrajes { get; set; }
        public decimal TotalServicios { get; set; }
        public decimal Total { get; set; }
    }

    public class PiezaCorteDetallada
    {
        public int Id { get; set; }
        public string NombrePieza { get; set; } = string.Empty;
        public int MaterialId { get; set; }
        public string MaterialNombre { get; set; } = string.Empty;
        public decimal Largo { get; set; }
        public decimal Ancho { get; set; }
        public int Cantidad { get; set; }
        public decimal MetroTapacanto { get; set; }
        public decimal CostoMaterial { get; set; }
    }

    public class DetalleHerrajeDetallado
    {
        public int Id { get; set; }
        public int HerrajeId { get; set; }
        public string HerrajeNombre { get; set; } = string.Empty;
        public string HerrajeMarca { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }

    public class DetalleServicioDetallado
    {
        public int Id { get; set; }
        public int ServicioId { get; set; }
        public string ServicioNombre { get; set; } = string.Empty;
        public string ServicioProveedor { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal Precio { get; set; }
        public decimal Subtotal { get; set; }
    }
}
