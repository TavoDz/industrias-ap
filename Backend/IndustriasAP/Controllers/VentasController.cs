using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VentasController : ControllerBase
    {
        private readonly VentaService     _ventas;
        private readonly CajaService      _caja;
        private readonly CotizacionService _cotizaciones;

        public VentasController(VentaService ventas, CajaService caja, CotizacionService cotizaciones)
        {
            _ventas       = ventas;
            _caja         = caja;
            _cotizaciones = cotizaciones;
        }

        // GET /api/Ventas?estado=pagada&desde=2024-01-01&hasta=2024-12-31
        [HttpGet]
        public IActionResult ObtenerTodos(
            [FromQuery] string?   estado = null,
            [FromQuery] DateTime? desde  = null,
            [FromQuery] DateTime? hasta  = null)
            => Ok(_ventas.ObtenerTodos(estado, desde, hasta));

        // GET /api/Ventas/{id}
        [HttpGet("{id:int}")]
        public IActionResult ObtenerPorId(int id)
        {
            var v = _ventas.ObtenerCompleta(id);
            return v == null ? NotFound("Venta no encontrada") : Ok(v);
        }

        // GET /api/Ventas/resumen-dia?fecha=2024-05-12
        [HttpGet("resumen-dia")]
        public IActionResult ResumenDia([FromQuery] DateTime? fecha = null)
            => Ok(_ventas.ResumenDia(fecha ?? DateTime.Today));

        // POST /api/Ventas
        [HttpPost]
        public IActionResult Crear([FromBody] CrearVentaDto dto)
        {
            if (dto.UsuarioId <= 0) return BadRequest("UsuarioId requerido.");

            decimal totalBase = 0;
            if (dto.Tipo == "cotizacion" && dto.CotizacionId.HasValue)
            {
                var cot = _cotizaciones.ObtenerPorId(dto.CotizacionId.Value);
                if (cot == null) return BadRequest("Cotización no encontrada.");
                totalBase = cot.Total;

                // Poblar cliente si no viene
                if (string.IsNullOrEmpty(dto.ClienteNombre))
                    dto.ClienteId = cot.ClienteId;
            }
            else if (dto.Tipo == "suelta" && (dto.Detalle == null || dto.Detalle.Count == 0))
            {
                return BadRequest("Las ventas sueltas requieren al menos un ítem en Detalle.");
            }

            var id = _ventas.Crear(dto, totalBase);

            // Registrar en caja si hay pagos y la caja está abierta
            var cajaHoy = _caja.CajaHoy();
            if (cajaHoy != null && dto.Pagos.Count > 0)
            {
                dynamic c = cajaHoy;
                if (c.Caja.Estado == "abierta")
                    _caja.RegistrarVentaEnCaja(
                        (int)c.Caja.Id,
                        id,
                        dto.Tipo == "cotizacion"
                            ? $"Venta cotización #{dto.CotizacionId}"
                            : "Venta directa",
                        dto.Pagos);
            }

            return Ok(new { id });
        }

        // POST /api/Ventas/{id}/pagos
        [HttpPost("{id:int}/pagos")]
        public IActionResult AgregarPago(int id, [FromBody] AgregarPagoDto dto)
        {
            if (dto.Monto <= 0) return BadRequest("El monto debe ser mayor a 0.");
            _ventas.AgregarPago(id, dto);

            // Registrar en caja si está abierta
            var cajaHoy = _caja.CajaHoy();
            if (cajaHoy != null)
            {
                dynamic c = cajaHoy;
                if (c.Caja.Estado == "abierta")
                    _caja.RegistrarVentaEnCaja(
                        (int)c.Caja.Id, id,
                        $"Pago venta #{id}",
                        new List<PagoVentaDto> { new() { Metodo = dto.Metodo, Monto = dto.Monto, Referencia = dto.Referencia } });
            }

            return Ok(new { message = "Pago registrado" });
        }

        // PUT /api/Ventas/{id}/anular
        [HttpPut("{id:int}/anular")]
        public IActionResult Anular(int id)
        {
            var ok = _ventas.Anular(id);
            return ok ? Ok(new { message = "Venta anulada" }) : NotFound("Venta no encontrada.");
        }
    }
}
