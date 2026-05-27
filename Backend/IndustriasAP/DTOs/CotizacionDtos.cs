namespace InsutriasAP.DTOs
{
    public class ActualizarInfoDto
    {
        public string? DescripcionGeneral { get; set; }
        public int? TiempoEstimadoDias { get; set; }
        public string? Observaciones { get; set; }
        public string? Terminos { get; set; }
    }

    public class ActualizarGananciaDto
    {
        public string Tipo { get; set; } = "normal"; // basico | normal | premium | manual
        public decimal? Porcentaje { get; set; }
    }

    public class AgregarMaterialCotizacionDto
    {
        public int MaterialId { get; set; }
        public string? Descripcion { get; set; }
        public decimal CantidadPlanchas { get; set; } = 1;
    }

    public class ActualizarMaterialCotizacionDto
    {
        public decimal CantidadPlanchas { get; set; }
        public string? Descripcion { get; set; }
    }

    public class AgregarManoObraDto
    {
        public string Descripcion { get; set; } = string.Empty;
        public decimal Costo { get; set; }
    }

    public class ActualizarDescuentoDto
    {
        public decimal Descuento { get; set; }
    }
}
