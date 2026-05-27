using InsutriasAP.DTOs;
using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CotizacionesController : ControllerBase
    {
        private readonly CotizacionService          _cotizacionService;
        private readonly PiezaCorteService          _piezaService;
        private readonly CotizacionMaterialService  _materialService;
        private readonly CotizacionManoObraService  _manoObraService;
        private readonly ParametrosService          _parametrosService;

        public CotizacionesController(
            CotizacionService         cotizacionService,
            PiezaCorteService         piezaService,
            CotizacionMaterialService materialService,
            CotizacionManoObraService manoObraService,
            ParametrosService         parametrosService)
        {
            _cotizacionService = cotizacionService;
            _piezaService      = piezaService;
            _materialService   = materialService;
            _manoObraService   = manoObraService;
            _parametrosService = parametrosService;
        }

        // ── CRUD básico ──────────────────────────────────────────────────

        [HttpGet]
        public IActionResult ObtenerTodos()
            => Ok(_cotizacionService.ObtenerTodos());

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var c = _cotizacionService.ObtenerPorId(id);
            return c == null ? NotFound("Cotización no encontrada") : Ok(c);
        }

        [HttpGet("{id}/completa")]
        public IActionResult ObtenerCompleta(int id)
        {
            var c = _cotizacionService.ObtenerPorId(id);
            return c == null ? NotFound("Cotización no encontrada") : Ok(c);
        }

        [HttpGet("cliente/{clienteId}")]
        public IActionResult ObtenerPorCliente(int clienteId)
            => Ok(_cotizacionService.ObtenerPorCliente(clienteId));

        [HttpPost]
        public IActionResult AgregarCotizacion([FromBody] Cotizacion cotizacion)
        {
            var id = _cotizacionService.AgregarCotizacion(cotizacion);
            return Ok(new { mensaje = "Cotización creada correctamente", id });
        }

        [HttpPut("{id}/estado")]
        public IActionResult ActualizarEstado(int id, [FromBody] string estado)
        {
            var ok = _cotizacionService.ActualizarEstado(id, estado);
            return ok ? Ok("Estado actualizado") : NotFound("Cotización no encontrada");
        }

        [HttpPut("{id}/recalcular")]
        public IActionResult RecalcularTotales(int id)
        {
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return c == null ? NotFound() : Ok(c);
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarCotizacion(int id)
        {
            var ok = _cotizacionService.EliminarCotizacion(id);
            return ok ? Ok("Cotización cancelada") : NotFound("Cotización no encontrada");
        }

        // ── Info general ─────────────────────────────────────────────────

        [HttpPut("{id}/info")]
        public IActionResult ActualizarInfo(int id, [FromBody] ActualizarInfoDto dto)
        {
            _cotizacionService.ActualizarInfo(id, dto.DescripcionGeneral, dto.TiempoEstimadoDias, dto.Observaciones, dto.Terminos);
            var c = _cotizacionService.ObtenerPorId(id);
            return c == null ? NotFound() : Ok(c);
        }

        // ── Ganancia ─────────────────────────────────────────────────────

        [HttpPut("{id}/ganancia")]
        public IActionResult ActualizarGanancia(int id, [FromBody] ActualizarGananciaDto dto)
        {
            decimal porcentaje = dto.Tipo switch
            {
                "basico"  => _parametrosService.ObtenerDecimal("ganancia_basico",  20m),
                "premium" => _parametrosService.ObtenerDecimal("ganancia_premium", 55m),
                "manual"  => dto.Porcentaje ?? 35m,
                _         => _parametrosService.ObtenerDecimal("ganancia_normal",  35m),
            };

            _cotizacionService.ActualizarGanancia(id, dto.Tipo, porcentaje);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return c == null ? NotFound() : Ok(c);
        }

        // ── Materiales ───────────────────────────────────────────────────

        [HttpGet("{id}/materiales")]
        public IActionResult ObtenerMateriales(int id)
            => Ok(_materialService.ObtenerPorCotizacion(id));

        [HttpPost("{id}/materiales")]
        public IActionResult AgregarMaterial(int id, [FromBody] AgregarMaterialCotizacionDto dto)
        {
            var itemId = _materialService.Agregar(id, dto.MaterialId, dto.Descripcion, dto.CantidadPlanchas);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return Ok(new { id = itemId, cotizacion = c });
        }

        [HttpPut("{id}/materiales/{itemId}")]
        public IActionResult ActualizarMaterial(int id, int itemId, [FromBody] ActualizarMaterialCotizacionDto dto)
        {
            _materialService.Actualizar(itemId, dto.CantidadPlanchas, dto.Descripcion);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return Ok(c);
        }

        // ── Descuento ────────────────────────────────────────────────────

        [HttpPut("{id}/descuento")]
        public IActionResult ActualizarDescuento(int id, [FromBody] ActualizarDescuentoDto dto)
        {
            _cotizacionService.ActualizarDescuento(id, dto.Descuento);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return c == null ? NotFound() : Ok(c);
        }

        [HttpDelete("{id}/materiales/{itemId}")]
        public IActionResult EliminarMaterial(int id, int itemId)
        {
            _materialService.Eliminar(itemId);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return Ok(c);
        }

        // ── Mano de obra ─────────────────────────────────────────────────

        [HttpGet("{id}/mano-obra")]
        public IActionResult ObtenerManoObra(int id)
            => Ok(_manoObraService.ObtenerPorCotizacion(id));

        [HttpPost("{id}/mano-obra")]
        public IActionResult AgregarManoObra(int id, [FromBody] AgregarManoObraDto dto)
        {
            var itemId = _manoObraService.Agregar(id, dto.Descripcion, dto.Costo);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return Ok(new { id = itemId, cotizacion = c });
        }

        [HttpDelete("{id}/mano-obra/{itemId}")]
        public IActionResult EliminarManoObra(int id, int itemId)
        {
            _manoObraService.Eliminar(itemId);
            _cotizacionService.RecalcularTotales(id);
            var c = _cotizacionService.ObtenerPorId(id);
            return Ok(c);
        }
    }
}
