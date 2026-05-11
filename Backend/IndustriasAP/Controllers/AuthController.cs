using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UsuarioService _usuarioService;
        private readonly JwtService _jwtService;

        public AuthController(UsuarioService usuarioService, JwtService jwtService)
        {
            _usuarioService = usuarioService;
            _jwtService     = jwtService;
        }

        // POST api/Auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var usuario = _usuarioService.ValidarCredenciales(request.Email, request.Password);

            if (usuario == null)
                return Unauthorized("Email o contraseña incorrectos");

            var token = _jwtService.GenerarToken(usuario);

            return Ok(new LoginResponse
            {
                Token  = token,
                Nombre = usuario.Nombre,
                Email  = usuario.Email,
                Rol    = usuario.Rol ?? "vendedor",
                Expira = DateTime.UtcNow.AddHours(8)
            });
        }
    }
}
