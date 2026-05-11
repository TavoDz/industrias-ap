using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
     [Authorize]                         // todos los endpoints requieren token
    public class UsuariosController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;

        public UsuariosController(UsuarioService usuarioService)
        {
            _usuarioService = usuarioService;
        }

        //GET api/Usuarios  — solo admin
        [HttpGet]
        [Authorize(Roles = "admin")]
        public IActionResult ObtenerTodos()
        {
            var usuarios = _usuarioService.ObtenerTodos();
            return Ok(usuarios);
        }

        // GET api/Usuarios/3  — solo admin
        [HttpGet("{id}")]
        [Authorize(Roles = "admin")]
        public IActionResult ObtenerPorId(int id)
        {
            var usuario = _usuarioService.ObtenerPorId(id);
            if (usuario == null) return NotFound("Usuario no encontrado");
            return Ok(usuario);
        }

        // POST api/Usuarios  — solo admin puede crear usuarios
        [HttpPost]
         [Authorize(Roles = "admin")]
        public IActionResult AgregarUsuario([FromBody] Usuario usuario)
        {
            _usuarioService.AgregarUsuario(usuario);
            return Ok("Usuario creado correctamente");
        }

        // PUT api/Usuarios/3  — solo admin
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public IActionResult ActualizarUsuario(int id, [FromBody] Usuario usuario)
        {
            var actualizado = _usuarioService.ActualizarUsuario(id, usuario);
            if (!actualizado) return NotFound("Usuario no encontrado");
            return Ok("Usuario actualizado correctamente");
        }

        // PUT api/Usuarios/3/password  — cualquier usuario autenticado puede cambiar su propia contraseña
        [HttpPut("{id}/password")]
        public IActionResult CambiarPassword(int id, [FromBody] CambiarPasswordRequest request)
        {
            var actualizado = _usuarioService.CambiarPassword(id, request.NuevaPassword);
            if (!actualizado) return NotFound("Usuario no encontrado");
            return Ok("Contraseña actualizada correctamente");
        }

        // DELETE api/Usuarios/3  — solo admin
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public IActionResult EliminarUsuario(int id)
        {
            var eliminado = _usuarioService.EliminarUsuario(id);
            if (!eliminado) return NotFound("Usuario no encontrado");
            return Ok("Usuario eliminado correctamente");
        }
    }
}
