using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MaterialesController : ControllerBase
    {
        private readonly MaterialService _materialService;

        public MaterialesController(MaterialService materialService)
        {
            _materialService = materialService;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var materiales = _materialService.ObtenerTodos();
            return Ok(materiales);
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var material = _materialService.ObtenerPorId(id);
            if (material == null) return NotFound("Material no encontrado");
            return Ok(material);
        }

        [HttpPost]
        public IActionResult AgregarMaterial([FromBody] Material material)
        {
            _materialService.AgregarMaterial(material);
            return Ok("Material guardado correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarMaterial(int id, [FromBody] Material material)
        {
            var actualizado = _materialService.ActualizarMaterial(id, material);
            if (!actualizado) return NotFound("Material no encontrado");
            return Ok("Material actualizado correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarMaterial(int id)
        {
            var eliminado = _materialService.EliminarMaterial(id);
            if (!eliminado) return NotFound("Material no encontrado");
            return Ok("Material eliminado correctamente");
        }
    }
}
