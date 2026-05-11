using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CotizacionesController : ControllerBase
    {
        private readonly CotizacionService _cotizacionService;
        private readonly PiezaCorteService _piezaService;

        public CotizacionesController(CotizacionService cotizacionService, PiezaCorteService piezaService)
        {
            _cotizacionService = cotizacionService;
            _piezaService      = piezaService;
        }

        // GET api/Cotizaciones
        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var cotizaciones = _cotizacionService.ObtenerTodos();
            return Ok(cotizaciones);
        }

        // GET api/Cotizaciones/5
        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var cotizacion = _cotizacionService.ObtenerPorId(id);
            if (cotizacion == null) return NotFound("Cotización no encontrada");
            return Ok(cotizacion);
        }

        // GET api/Cotizaciones/5/completa  ← nuevo endpoint
        [HttpGet("{id}/completa")]
        public IActionResult ObtenerCompleta(int id)
        {
            var cotizacion = _cotizacionService.ObtenerCompleta(id);
            if (cotizacion == null) return NotFound("Cotización no encontrada");
            return Ok(cotizacion);
        }

        // GET api/Cotizaciones/cliente/3
        [HttpGet("cliente/{clienteId}")]
        public IActionResult ObtenerPorCliente(int clienteId)
        {
            var cotizaciones = _cotizacionService.ObtenerPorCliente(clienteId);
            return Ok(cotizaciones);
        }

        // POST api/Cotizaciones
        [HttpPost]
        public IActionResult AgregarCotizacion([FromBody] Cotizacion cotizacion)
        {
            var id = _cotizacionService.AgregarCotizacion(cotizacion);
            return Ok(new { mensaje = "Cotización creada correctamente", id });
        }

        // PUT api/Cotizaciones/5/estado
        [HttpPut("{id}/estado")]
        public IActionResult ActualizarEstado(int id, [FromBody] string estado)
        {
            var actualizado = _cotizacionService.ActualizarEstado(id, estado);
            if (!actualizado) return NotFound("Cotización no encontrada");
            return Ok("Estado actualizado correctamente");
        }

        // PUT api/Cotizaciones/5/recalcular
        [HttpPut("{id}/recalcular")]
        public IActionResult RecalcularTotales(int id)
        {
            var ok = _cotizacionService.RecalcularTotales(id);
            if (!ok) return NotFound("Cotización no encontrada");
            var cotizacion = _cotizacionService.ObtenerPorId(id);
            return Ok(cotizacion);
        }

        // DELETE api/Cotizaciones/5
        [HttpDelete("{id}")]
        public IActionResult EliminarCotizacion(int id)
        {
            var eliminado = _cotizacionService.EliminarCotizacion(id);
            if (!eliminado) return NotFound("Cotización no encontrada");
            return Ok("Cotización cancelada correctamente");
        }
    }
}
