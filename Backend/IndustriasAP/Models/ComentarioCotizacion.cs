namespace InsutriasAP.Models
{
    public class ComentarioCotizacion
    {
        public int      Id             { get; set; }
        public int      CotizacionId   { get; set; }
        public int      UsuarioId      { get; set; }
        public string   UsuarioNombre  { get; set; } = string.Empty;
        public string   Comentario     { get; set; } = string.Empty;
        public DateTime CreatedAt      { get; set; }
    }

    public class ComentarioDto
    {
        public int    CotizacionId  { get; set; }
        public int    UsuarioId     { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
        public string Comentario    { get; set; } = string.Empty;
    }
}
