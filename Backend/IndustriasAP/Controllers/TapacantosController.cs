using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TapacantosController : ControllerBase
    {
        private readonly TapacantoService _tapacantoService;

        public TapacantosController(TapacantoService tapacantoService)
        {
            _tapacantoService = tapacantoService;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var tapacantos = _tapacantoService.ObtenerTodos();
            return Ok(tapacantos);
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var tapacanto = _tapacantoService.ObtenerPorId(id);
            if (tapacanto == null) return NotFound("Tapacanto no encontrado");
            return Ok(tapacanto);
        }

        [HttpPost]
        public IActionResult AgregarTapacanto([FromBody] Tapacanto tapacanto)
        {
            _tapacantoService.AgregarTapacanto(tapacanto);
            return Ok("Tapacanto guardado correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarTapacanto(int id, [FromBody] Tapacanto tapacanto)
        {
            var actualizado = _tapacantoService.ActualizarTapacanto(id, tapacanto);
            if (!actualizado) return NotFound("Tapacanto no encontrado");
            return Ok("Tapacanto actualizado correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarTapacanto(int id)
        {
            var eliminado = _tapacantoService.EliminarTapacanto(id);
            if (!eliminado) return NotFound("Tapacanto no encontrado");
            return Ok("Tapacanto eliminado correctamente");
        }
    }
}
