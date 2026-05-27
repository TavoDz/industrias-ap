using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProyectosController : ControllerBase
    {
        private readonly ProyectoService _service;

        public ProyectosController(ProyectoService service) { _service = service; }

        // GET /api/Proyectos?estado=pendiente
        [HttpGet]
        public IActionResult ObtenerTodos([FromQuery] string? estado = null)
            => Ok(_service.ObtenerTodos(estado));

        // GET /api/Proyectos/{id}
        [HttpGet("{id:int}")]
        public IActionResult ObtenerPorId(int id)
        {
            var p = _service.ObtenerPorId(id);
            return p == null ? NotFound("Proyecto no encontrado") : Ok(p);
        }

        // GET /api/Proyectos/cotizacion/{cotizacionId}/existe
        [HttpGet("cotizacion/{cotizacionId:int}/existe")]
        public IActionResult Existe(int cotizacionId)
            => Ok(new { existe = _service.ExistePorCotizacion(cotizacionId) });

        // POST /api/Proyectos
        [HttpPost]
        public IActionResult Crear([FromBody] ProyectoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
                return BadRequest("El nombre del proyecto es requerido.");

            if (_service.ExistePorCotizacion(dto.CotizacionId))
                return Conflict("Ya existe un proyecto para esta cotización.");

            var id = _service.Crear(dto);
            return Ok(new { id });
        }

        // PUT /api/Proyectos/{id}
        [HttpPut("{id:int}")]
        public IActionResult Actualizar(int id, [FromBody] ActualizarProyectoDto dto)
        {
            var ok = _service.Actualizar(id, dto);
            return ok ? Ok(new { id }) : NotFound("Proyecto no encontrado.");
        }

        // DELETE /api/Proyectos/{id}
        [HttpDelete("{id:int}")]
        public IActionResult Eliminar(int id)
        {
            var ok = _service.Eliminar(id);
            return ok ? NoContent() : NotFound("Proyecto no encontrado.");
        }
    }
}
