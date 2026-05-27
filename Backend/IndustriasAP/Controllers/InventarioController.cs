using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly InventarioService _inventarioService;

        public InventarioController(InventarioService inventarioService)
        {
            _inventarioService = inventarioService;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var items = _inventarioService.ObtenerTodos();
            return Ok(items);
        }

        [HttpGet("disponible")]
        public IActionResult ObtenerDisponible()
            => Ok(_inventarioService.ObtenerDisponible());

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var item = _inventarioService.ObtenerPorId(id);
            if (item == null) return NotFound("Item de inventario no encontrado");
            return Ok(item);
        }

        [HttpPost]
        public IActionResult AgregarInventario([FromBody] Inventario inventario)
        {
            _inventarioService.AgregarInventario(inventario);
            return Ok("Item de inventario guardado correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarInventario(int id, [FromBody] Inventario inventario)
        {
            var actualizado = _inventarioService.ActualizarInventario(id, inventario);
            if (!actualizado) return NotFound("Item de inventario no encontrado");
            return Ok("Inventario actualizado correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarInventario(int id)
        {
            var eliminado = _inventarioService.EliminarInventario(id);
            if (!eliminado) return NotFound("Item de inventario no encontrado");
            return Ok("Item eliminado correctamente");
        }
    }
}
