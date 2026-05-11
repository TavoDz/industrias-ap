using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CotizacionCompletaController : ControllerBase
    {
        private readonly CotizacionCompletaService _service;

        public CotizacionCompletaController(CotizacionCompletaService service)
        {
            _service = service;
        }

        // GET api/CotizacionCompleta/5
        // Devuelve la cotización con cliente, piezas, herrajes y servicios en una sola llamada
        [HttpGet("{id}")]
        public IActionResult ObtenerCompleta(int id)
        {
            var cotizacion = _service.ObtenerCotizacionCompleta(id);
            if (cotizacion == null) return NotFound("Cotización no encontrada");
            return Ok(cotizacion);
        }
    }
}
