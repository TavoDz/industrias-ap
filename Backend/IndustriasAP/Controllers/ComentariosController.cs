using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ComentariosController : ControllerBase
    {
        private readonly ComentarioService _service;

        public ComentariosController(ComentarioService service) { _service = service; }

        // GET /api/Comentarios/cotizacion/{cotizacionId}
        [HttpGet("cotizacion/{cotizacionId:int}")]
        public IActionResult ObtenerPorCotizacion(int cotizacionId)
            => Ok(_service.ObtenerPorCotizacion(cotizacionId));

        // POST /api/Comentarios
        [HttpPost]
        public IActionResult Agregar([FromBody] ComentarioDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Comentario))
                return BadRequest("El comentario no puede estar vacío.");

            var id = _service.Agregar(dto);
            return Ok(new { id });
        }

        // DELETE /api/Comentarios/{id}
        [HttpDelete("{id:int}")]
        public IActionResult Eliminar(int id)
        {
            var ok = _service.Eliminar(id);
            return ok ? NoContent() : NotFound("Comentario no encontrado.");
        }
    }
}
