using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetalleHerrajesController : ControllerBase
    {
        private readonly DetalleHerrajeService _detalleService;
        private readonly CotizacionService _cotizacionService;

        public DetalleHerrajesController(DetalleHerrajeService detalleService, CotizacionService cotizacionService)
        {
            _detalleService     = detalleService;
            _cotizacionService  = cotizacionService;
        }

        // GET api/DetalleHerrajes/cotizacion/5
        [HttpGet("cotizacion/{cotizacionId}")]
        public IActionResult ObtenerPorCotizacion(int cotizacionId)
        {
            var detalles = _detalleService.ObtenerPorCotizacion(cotizacionId);
            return Ok(detalles);
        }

        // GET api/DetalleHerrajes/3
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var detalle = _detalleService.ObtenerPorId(id);
            if (detalle == null) return NotFound("Detalle de herraje no encontrado");
            return Ok(detalle);
        }

        // POST api/DetalleHerrajes
        [HttpPost]
        public IActionResult AgregarDetalle([FromBody] DetalleHerraje detalle)
        {
            _detalleService.AgregarDetalle(detalle);
            _cotizacionService.RecalcularTotales(detalle.CotizacionId);
            return Ok("Herraje agregado a la cotización correctamente");
        }

        // PUT api/DetalleHerrajes/3
        [HttpPut("{id}")]
        public IActionResult ActualizarDetalle(int id, [FromBody] DetalleHerraje detalle)
        {
            var actualizado = _detalleService.ActualizarDetalle(id, detalle);
            if (!actualizado) return NotFound("Detalle de herraje no encontrado");
            _cotizacionService.RecalcularTotales(detalle.CotizacionId);
            return Ok("Detalle de herraje actualizado correctamente");
        }

        // DELETE api/DetalleHerrajes/3
        [HttpDelete("{id}")]
        public IActionResult EliminarDetalle(int id)
        {
            var detalle = _detalleService.ObtenerPorId(id);
            if (detalle == null) return NotFound("Detalle de herraje no encontrado");

            _detalleService.EliminarDetalle(id);
            _cotizacionService.RecalcularTotales(detalle.CotizacionId);
            return Ok("Detalle de herraje eliminado correctamente");
        }

        // DELETE api/DetalleHerrajes/cotizacion/5
        [HttpDelete("cotizacion/{cotizacionId}")]
        public IActionResult EliminarPorCotizacion(int cotizacionId)
        {
            _detalleService.EliminarPorCotizacion(cotizacionId);
            _cotizacionService.RecalcularTotales(cotizacionId);
            return Ok("Herrajes de la cotización eliminados correctamente");
        }
    }
}
