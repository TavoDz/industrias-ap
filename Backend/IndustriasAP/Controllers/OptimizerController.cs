using System.Data;
using System.Text.Json;
using InsutriasAP.Models;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OptimizerController : ControllerBase
    {
        private readonly OptimizerService _optimizerService;
        private readonly IConfiguration _config;

        public OptimizerController(OptimizerService optimizerService, IConfiguration config)
        {
            _optimizerService = optimizerService;
            _config = config;
        }

        // 🔵 OPTIMIZAR
        [HttpPost]
        public IActionResult Optimizar([FromBody] OptimizarRequest request)
        {
            try
            {
                if (request.Piezas == null || request.Piezas.Count == 0)
                    return BadRequest("Debe ingresar al menos una pieza");

                var resultado = _optimizerService.Optimizar(request);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 🟢 GUARDAR
        [HttpPost("guardar")]
        public async Task<IActionResult> Guardar([FromBody] JsonElement data)
        {
            try
            {
                var connectionString = _config.GetConnectionString("DefaultConnection");

                using var conn = new MySqlConnection(connectionString);
                await conn.OpenAsync();

                var nombre = data.GetProperty("nombre").GetString();
                var material = data.GetProperty("material").GetString();
                var resultado = data.GetProperty("resultado");

                string json = JsonSerializer.Serialize(resultado);

                var cmd = new MySqlCommand(@"
            INSERT INTO Optimizaciones
            (nombre, fecha, material_nombre, json_resultado)
            VALUES
            (@nombre, @fecha, @material, @json);
            SELECT LAST_INSERT_ID();
        ", conn);

                cmd.Parameters.AddWithValue("@nombre", nombre ?? "Optimización");
                cmd.Parameters.AddWithValue("@fecha", DateTime.UtcNow);
                cmd.Parameters.AddWithValue("@material", material ?? "Material");
                cmd.Parameters.AddWithValue("@json", json);

                var id = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest("ERROR BACKEND: " + ex.Message);
            }
        }

        // 🔍 OBTENER POR ID
        [HttpGet("{id}")]
        public async Task<IActionResult> Obtener(int id)
        {
            var connectionString = _config.GetConnectionString("DefaultConnection");

            using var conn = new MySqlConnection(connectionString);
            await conn.OpenAsync();

            var cmd = new MySqlCommand(@"
                SELECT * FROM Optimizaciones WHERE id = @id
            ", conn);

            cmd.Parameters.AddWithValue("@id", id);

            using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                return NotFound("No encontrado");

            var json = reader.GetString("json_resultado");

            var resultado = JsonSerializer.Deserialize<object>(json);

            return Ok(new
            {
                Id = reader.GetInt32("id"),
                Nombre = reader.GetString("nombre"),
                Fecha = reader.GetDateTime("fecha"),
                Material = reader.GetString("material_nombre"),
                Resultado = resultado
            });
        }
    }
}