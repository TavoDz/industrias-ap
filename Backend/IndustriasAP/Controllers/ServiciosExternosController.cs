using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServiciosExternosController : ControllerBase
    {
        private readonly ServicioExternoService _servicioService;

        public ServiciosExternosController(ServicioExternoService servicioService)
        {
            _servicioService = servicioService;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var servicios = _servicioService.ObtenerTodos();
            return Ok(servicios);
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var servicio = _servicioService.ObtenerPorId(id);
            if (servicio == null) return NotFound("Servicio no encontrado");
            return Ok(servicio);
        }

        [HttpPost]
        public IActionResult AgregarServicio([FromBody] ServicioExterno servicio)
        {
            _servicioService.AgregarServicio(servicio);
            return Ok("Servicio guardado correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarServicio(int id, [FromBody] ServicioExterno servicio)
        {
            var actualizado = _servicioService.ActualizarServicio(id, servicio);
            if (!actualizado) return NotFound("Servicio no encontrado");
            return Ok("Servicio actualizado correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarServicio(int id)
        {
            var eliminado = _servicioService.EliminarServicio(id);
            if (!eliminado) return NotFound("Servicio no encontrado");
            return Ok("Servicio eliminado correctamente");
        }
    }
}
