using System.Text.Json;
using InsutriasAP.Database;
using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OptimizerController : ControllerBase
    {
        private readonly OptimizerService _optimizerService;
        private readonly AppDbContext     _db;

        public OptimizerController(OptimizerService optimizerService, AppDbContext db)
        {
            _optimizerService = optimizerService;
            _db               = db;
        }

        // ── POST /api/Optimizer ─────────────────────────────── Ejecutar optimización
        [HttpPost]
        public async Task<IActionResult> Optimizar([FromBody] OptimizarRequest request)
        {
            if (request.Piezas == null || request.Piezas.Count == 0)
                return BadRequest("Debe ingresar al menos una pieza.");

            try
            {
                var resultado = await _optimizerService.OptimizarAsync(request);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ── GET /api/Optimizer ──────────────────────────────── Listar con búsqueda
        [HttpGet]
        public async Task<IActionResult> Listar(
            [FromQuery] string? buscar      = null,
            [FromQuery] string? material    = null,
            [FromQuery] DateTime? desde     = null,
            [FromQuery] DateTime? hasta     = null)
        {
            var query = _db.Optimizaciones.AsQueryable();

            if (!string.IsNullOrWhiteSpace(buscar))
                query = query.Where(o =>
                    (o.Nombre      != null && o.Nombre.Contains(buscar)) ||
                    (o.Descripcion != null && o.Descripcion.Contains(buscar)) ||
                    o.MaterialNombre.Contains(buscar));

            if (!string.IsNullOrWhiteSpace(material))
                query = query.Where(o => o.MaterialNombre.Contains(material));

            if (desde.HasValue)
                query = query.Where(o => o.Fecha >= desde.Value);

            if (hasta.HasValue)
                query = query.Where(o => o.Fecha <= hasta.Value.AddDays(1));

            var lista = await query
                .OrderByDescending(o => o.Fecha)
                .Select(o => new
                {
                    o.Id,
                    o.Nombre,
                    o.Descripcion,
                    o.Fecha,
                    o.UltimaEjecucion,
                    o.CotizacionId,
                    o.MaterialId,
                    o.MaterialNombre,
                    o.TotalEjecuciones,
                    ResumenResultado = ObtenerResumen(o.JsonResultado)
                })
                .ToListAsync();

            return Ok(lista);
        }

        // ── GET /api/Optimizer/{id} ─────────────────────────── Obtener completo
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Obtener(int id)
        {
            var opt = await _db.Optimizaciones.FindAsync(id);
            if (opt == null) return NotFound("Optimización no encontrada.");

            JsonElement? resultado = null;
            if (!string.IsNullOrEmpty(opt.JsonResultado))
                resultado = JsonSerializer.Deserialize<JsonElement>(opt.JsonResultado);

            JsonElement? request = null;
            if (!string.IsNullOrEmpty(opt.JsonRequest))
                request = JsonSerializer.Deserialize<JsonElement>(opt.JsonRequest);

            return Ok(new
            {
                opt.Id,
                opt.Nombre,
                opt.Descripcion,
                opt.Fecha,
                opt.UltimaEjecucion,
                opt.CotizacionId,
                opt.MaterialId,
                opt.MaterialNombre,
                opt.TotalEjecuciones,
                Resultado = resultado,
                Request   = request
            });
        }

        // ── POST /api/Optimizer/guardar ─────────────────────── Guardar nueva
        [HttpPost("guardar")]
        public async Task<IActionResult> Guardar([FromBody] GuardarOptimizacionDto dto)
        {
            var opt = new Optimizacion
            {
                Nombre           = dto.Nombre ?? "Optimización sin nombre",
                Descripcion      = dto.Descripcion,
                Fecha            = DateTime.UtcNow,
                UltimaEjecucion  = DateTime.UtcNow,
                CotizacionId     = dto.CotizacionId,
                MaterialId       = dto.MaterialId,
                MaterialNombre   = dto.MaterialNombre ?? string.Empty,
                TotalEjecuciones = 1,
                JsonResultado    = JsonSerializer.Serialize(dto.Resultado),
                JsonRequest      = dto.Request != null
                                   ? JsonSerializer.Serialize(dto.Request)
                                   : null
            };

            _db.Optimizaciones.Add(opt);
            await _db.SaveChangesAsync();

            return Ok(new { opt.Id, opt.Nombre, opt.Fecha });
        }

        // ── PUT /api/Optimizer/{id} ─────────────────────────── Sobrescribir
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Actualizar(int id, [FromBody] GuardarOptimizacionDto dto)
        {
            var opt = await _db.Optimizaciones.FindAsync(id);
            if (opt == null) return NotFound("Optimización no encontrada.");

            opt.Nombre          = dto.Nombre ?? opt.Nombre;
            opt.Descripcion     = dto.Descripcion ?? opt.Descripcion;
            opt.UltimaEjecucion = DateTime.UtcNow;
            opt.CotizacionId    = dto.CotizacionId ?? opt.CotizacionId;
            opt.MaterialId      = dto.MaterialId > 0 ? dto.MaterialId : (opt.MaterialId ?? 0);
            opt.MaterialNombre  = !string.IsNullOrEmpty(dto.MaterialNombre)
                                  ? dto.MaterialNombre
                                  : opt.MaterialNombre;
            opt.TotalEjecuciones += 1;
            opt.JsonResultado   = JsonSerializer.Serialize(dto.Resultado);

            if (dto.Request != null)
                opt.JsonRequest = JsonSerializer.Serialize(dto.Request);

            await _db.SaveChangesAsync();

            return Ok(new { opt.Id, opt.Nombre, opt.UltimaEjecucion, opt.TotalEjecuciones });
        }

        // ── DELETE /api/Optimizer/{id} ──────────────────────── Eliminar
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Eliminar(int id)
        {
            var opt = await _db.Optimizaciones.FindAsync(id);
            if (opt == null) return NotFound("Optimización no encontrada.");

            _db.Optimizaciones.Remove(opt);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // ── POST /api/Optimizer/{id}/ejecutar ──────────────── Re-ejecutar guardada
        [HttpPost("{id:int}/ejecutar")]
        public async Task<IActionResult> Reejecutar(int id)
        {
            var opt = await _db.Optimizaciones.FindAsync(id);
            if (opt == null) return NotFound("Optimización no encontrada.");

            if (string.IsNullOrEmpty(opt.JsonRequest))
                return BadRequest("Esta optimización no tiene configuración guardada para re-ejecutar.");

            var request = JsonSerializer.Deserialize<OptimizarRequest>(opt.JsonRequest,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (request == null)
                return BadRequest("No se pudo deserializar la configuración.");

            OptimizarResponse resultado;
            try
            {
                resultado = await _optimizerService.OptimizarAsync(request);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

            opt.JsonResultado    = JsonSerializer.Serialize(resultado);
            opt.UltimaEjecucion  = DateTime.UtcNow;
            opt.TotalEjecuciones += 1;

            await _db.SaveChangesAsync();

            return Ok(resultado);
        }

        // ── Helper ─────────────────────────────────────────────────────────────────
        private static object? ObtenerResumen(string json)
        {
            if (string.IsNullOrEmpty(json)) return null;
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                return new
                {
                    TotalPlanchas       = root.TryGetProperty("totalPlanchas",       out var tp)  ? tp.GetInt32()     : 0,
                    PorcentajeUso       = root.TryGetProperty("porcentajeUso",       out var pu)  ? pu.GetDecimal()   : 0m,
                    PorcentajeDesperdicio = root.TryGetProperty("porcentajeDesperdicio", out var pd) ? pd.GetDecimal() : 0m,
                    MetrosLinealesCorte = root.TryGetProperty("metrosLinealesCorte", out var ml) ? ml.GetDecimal()    : 0m,
                    MetrosLinealesTapacanto = root.TryGetProperty("metrosLinealesTapacanto", out var mt) ? mt.GetDecimal() : 0m,
                };
            }
            catch { return null; }
        }
    }

    public class GuardarOptimizacionDto
    {
        public string?  Nombre        { get; set; }
        public string?  Descripcion   { get; set; }
        public int?     CotizacionId  { get; set; }
        public int      MaterialId    { get; set; }
        public string?  MaterialNombre { get; set; }
        public object?  Resultado     { get; set; }
        public object?  Request       { get; set; }
    }
}
