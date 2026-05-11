using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PiezasCorteController : ControllerBase
    {
        private readonly PiezaCorteService _piezaService;

        public PiezasCorteController(PiezaCorteService piezaService)
        {
            _piezaService = piezaService;
        }

        [HttpGet("cotizacion/{cotizacionId}")]
        public IActionResult ObtenerPorCotizacion(int cotizacionId)
        {
            var piezas = _piezaService.ObtenerPorCotizacion(cotizacionId);
            return Ok(piezas);
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var pieza = _piezaService.ObtenerPorId(id);
            if (pieza == null) return NotFound("Pieza de corte no encontrada");
            return Ok(pieza);
        }

        [HttpPost]
        public IActionResult AgregarPieza([FromBody] PiezaCorte pieza)
        {
            _piezaService.AgregarPieza(pieza);
            return Ok("Pieza de corte guardada correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarPieza(int id, [FromBody] PiezaCorte pieza)
        {
            var actualizado = _piezaService.ActualizarPieza(id, pieza);
            if (!actualizado) return NotFound("Pieza de corte no encontrada");
            return Ok("Pieza de corte actualizada correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarPieza(int id)
        {
            var eliminado = _piezaService.EliminarPieza(id);
            if (!eliminado) return NotFound("Pieza de corte no encontrada");
            return Ok("Pieza de corte eliminada correctamente");
        }
    }
}
