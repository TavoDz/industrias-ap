using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ParametrosController : ControllerBase
    {
        private readonly ParametrosService _service;

        public ParametrosController(ParametrosService service)
        {
            _service = service;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
            => Ok(_service.ObtenerTodos());

        [HttpGet("{clave}")]
        public IActionResult ObtenerPorClave(string clave)
        {
            var p = _service.ObtenerPorClave(clave);
            return p == null ? NotFound() : Ok(p);
        }

        [HttpPut("{clave}")]
        public IActionResult Actualizar(string clave, [FromBody] string valor)
        {
            _service.Actualizar(clave, valor);
            return Ok(_service.ObtenerPorClave(clave));
        }
    }
}
