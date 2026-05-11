using InsutriasAP.Models;

namespace InsutriasAP.DTOs
{
    // ── POST /api/optimizaciones ──────────────────────────────────────────────

    /// <summary>Payload para guardar una optimización.</summary>
    public class GuardarOptimizacionDto
    {
        /// <summary>Nombre descriptivo (opcional).</summary>
        public string? Nombre { get; set; }

        /// <summary>Nombre del material utilizado.</summary>
        public string MaterialNombre { get; set; } = string.Empty;

        /// <summary>Objeto resultado completo de la optimización (se serializa a JSON).</summary>
        public object Resultado { get; set; } = new();

        /// <summary>Request original enviado al optimizer (opcional, se serializa a JSON).</summary>
        public object? Request { get; set; }
    }

    // ── GET /api/optimizaciones ───────────────────────────────────────────────

    /// <summary>Resumen de una optimización para el listado.</summary>
    public class OptimizacionResumenDto
    {
        public int      Id             { get; set; }
        public DateTime Fecha          { get; set; }
        public string   MaterialNombre { get; set; } = string.Empty;
        public string?  Nombre        { get; set; }
    }

    // ── GET /api/optimizaciones/{id} ──────────────────────────────────────────

    /// <summary>Detalle completo de una optimización.</summary>
    public class OptimizacionDetalleDto
    {
        public int      Id             { get; set; }
        public string?  Nombre         { get; set; }
        public DateTime Fecha          { get; set; }
        public string   MaterialNombre { get; set; } = string.Empty;

        /// <summary>Resultado deserializado como objeto dinámico.</summary>
        public object? Resultado { get; set; }

        /// <summary>Request original deserializado como objeto dinámico (puede ser null).</summary>
        public object? Request { get; set; }
    }

    // ── POST response ─────────────────────────────────────────────────────────

    /// <summary>Respuesta al guardar una optimización.</summary>
    public class OptimizacionGuardadaDto
    {
        public int Id { get; set; }
    }
}
