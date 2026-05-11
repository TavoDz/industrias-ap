using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetalleServiciosController : ControllerBase
    {
        private readonly DetalleServicioService _detalleService;
        private readonly CotizacionService _cotizacionService;

        public DetalleServiciosController(DetalleServicioService detalleService, CotizacionService cotizacionService)
        {
            _detalleService    = detalleService;
            _cotizacionService = cotizacionService;
        }

        // GET api/DetalleServicios/cotizacion/5
        [HttpGet("cotizacion/{cotizacionId}")]
        public IActionResult ObtenerPorCotizacion(int cotizacionId)
        {
            var detalles = _detalleService.ObtenerPorCotizacion(cotizacionId);
            return Ok(detalles);
        }

        // GET api/DetalleServicios/3
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var detalle = _detalleService.ObtenerPorId(id);
            if (detalle == null) return NotFound("Detalle de servicio no encontrado");
            return Ok(detalle);
        }

        // POST api/DetalleServicios
        [HttpPost]
        public IActionResult AgregarDetalle([FromBody] DetalleServicio detalle)
        {
            _detalleService.AgregarDetalle(detalle);
            _cotizacionService.RecalcularTotales(detalle.CotizacionId);
            return Ok("Servicio agregado a la cotización correctamente");
        }

        // PUT api/DetalleServicios/3
        [HttpPut("{id}")]
        public IActionResult ActualizarDetalle(int id, [FromBody] DetalleServicio detalle)
        {
            var actualizado = _detalleService.ActualizarDetalle(id, detalle);
            if (!actualizado) return NotFound("Detalle de servicio no encontrado");
            _cotizacionService.RecalcularTotales(detalle.CotizacionId);
            return Ok("Detalle de servicio actualizado correctamente");
        }

        // DELETE api/DetalleServicios/3
        [HttpDelete("{id}")]
        public IActionResult EliminarDetalle(int id)
        {
            var detalle = _detalleService.ObtenerPorId(id);
            if (detalle == null) return NotFound("Detalle de servicio no encontrado");

            _detalleService.EliminarDetalle(id);
            _cotizacionService.RecalcularTotales(detalle.CotizacionId);
            return Ok("Detalle de servicio eliminado correctamente");
        }

        // DELETE api/DetalleServicios/cotizacion/5
        [HttpDelete("cotizacion/{cotizacionId}")]
        public IActionResult EliminarPorCotizacion(int cotizacionId)
        {
            _detalleService.EliminarPorCotizacion(cotizacionId);
            _cotizacionService.RecalcularTotales(cotizacionId);
            return Ok("Servicios de la cotización eliminados correctamente");
        }
    }
}
