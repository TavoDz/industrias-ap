using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ClienteService _clienteService;

        public ClientesController(ClienteService clienteService)
        {
            _clienteService = clienteService;
        }

        [HttpGet]
        public IActionResult ObtenerTodos()
        {
            var clientes = _clienteService.ObtenerTodos();
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public IActionResult ObtenerPorId(int id)
        {
            var cliente = _clienteService.ObtenerPorId(id);
            if (cliente == null) return NotFound("Cliente no encontrado");
            return Ok(cliente);
        }

        [HttpPost]
        public IActionResult AgregarCliente([FromBody] Cliente cliente)
        {
            _clienteService.AgregarCliente(cliente);
            return Ok("Cliente guardado correctamente");
        }

        [HttpPut("{id}")]
        public IActionResult ActualizarCliente(int id, [FromBody] Cliente cliente)
        {
            var actualizado = _clienteService.ActualizarCliente(id, cliente);
            if (!actualizado) return NotFound("Cliente no encontrado");
            return Ok("Cliente actualizado correctamente");
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarCliente(int id)
        {
            var eliminado = _clienteService.EliminarCliente(id);
            if (!eliminado) return NotFound("Cliente no encontrado");
            return Ok("Cliente eliminado correctamente");
        }
    }
}
