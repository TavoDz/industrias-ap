using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HerrajesController : ControllerBase
    {
        private readonly HerrajeService _herrajeService;

        public HerrajesController(HerrajeService herrajeService)
        {
            _herrajeService = herrajeService;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var herrajes = _herrajeService.ObtenerTodos();
            return Ok(herrajes);
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var herraje = _herrajeService.ObtenerPorId(id);
            if (herraje == null) return NotFound("Herraje no encontrado");
            return Ok(herraje);
        }

        [HttpPost]
        public IActionResult AgregarHerraje([FromBody] Herraje herraje)
        {
            _herrajeService.AgregarHerraje(herraje);
            return Ok("Herraje guardado correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarHerraje(int id, [FromBody] Herraje herraje)
        {
            var actualizado = _herrajeService.ActualizarHerraje(id, herraje);
            if (!actualizado) return NotFound("Herraje no encontrado");
            return Ok("Herraje actualizado correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarHerraje(int id)
        {
            var eliminado = _herrajeService.EliminarHerraje(id);
            if (!eliminado) return NotFound("Herraje no encontrado");
            return Ok("Herraje eliminado correctamente");
        }
    }
}
