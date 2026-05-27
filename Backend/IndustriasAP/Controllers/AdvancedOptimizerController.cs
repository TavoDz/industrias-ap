using InsutriasAP.DTOs;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdvancedOptimizerController : ControllerBase
    {
        private readonly AdvancedOptimizerService _svc;

        public AdvancedOptimizerController(AdvancedOptimizerService svc)
        {
            _svc = svc;
        }

        // POST /api/AdvancedOptimizer
        [HttpPost]
        public async Task<IActionResult> Optimize([FromBody] AdvancedOptimizeRequest request)
        {
            if (request.Pieces == null || request.Pieces.Count == 0)
                return BadRequest("Debe ingresar al menos una pieza.");

            if (request.BoardW <= 0 || request.BoardH <= 0)
                return BadRequest("Las dimensiones del tablero deben ser mayores a 0.");

            try
            {
                var result = await _svc.OptimizeAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
