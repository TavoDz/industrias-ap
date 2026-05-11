namespace InsutriasAP.Models
{
    // Request del login
    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // Response del login
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public DateTime Expira { get; set; }
    }

    // Request para cambiar password
    public class CambiarPasswordRequest
    {
        public string NuevaPassword { get; set; } = string.Empty;
    }
}
