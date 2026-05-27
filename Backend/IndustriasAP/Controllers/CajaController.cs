using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CajaController : ControllerBase
    {
        private readonly CajaService _service;

        public CajaController(CajaService service) { _service = service; }

        // GET /api/Caja/hoy
        [HttpGet("hoy")]
        public IActionResult Hoy() => Ok(_service.CajaHoy());

        // GET /api/Caja?fecha=2024-05-12
        [HttpGet]
        public IActionResult PorFecha([FromQuery] DateTime? fecha = null)
            => Ok(_service.ObtenerPorFecha(fecha ?? DateTime.Today));

        // GET /api/Caja/historial
        [HttpGet("historial")]
        public IActionResult Historial([FromQuery] int limite = 30)
            => Ok(_service.ListarCajas(limite));

        // POST /api/Caja/abrir
        [HttpPost("abrir")]
        public IActionResult Abrir([FromBody] AbrirCajaDto dto)
        {
            if (dto.UsuarioId <= 0) return BadRequest("UsuarioId requerido.");
            var id = _service.Abrir(dto);
            return Ok(new { id });
        }

        // PUT /api/Caja/{id}/cerrar
        [HttpPut("{id:int}/cerrar")]
        public IActionResult Cerrar(int id, [FromBody] CerrarCajaDto dto)
        {
            var ok = _service.Cerrar(id, dto);
            return ok ? Ok(new { message = "Caja cerrada" }) : BadRequest("No se pudo cerrar la caja.");
        }

        // POST /api/Caja/{id}/movimientos
        [HttpPost("{id:int}/movimientos")]
        public IActionResult AgregarMovimiento(int id, [FromBody] MovimientoManualDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Concepto)) return BadRequest("Concepto requerido.");
            if (dto.Monto <= 0) return BadRequest("El monto debe ser mayor a 0.");
            var movId = _service.AgregarMovimiento(id, dto);
            return Ok(new { id = movId });
        }
    }
}
