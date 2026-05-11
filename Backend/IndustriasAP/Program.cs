using System.Reflection;
using System.Text;
using InsutriasAP.Database;
using InsutriasAP.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// ─── EF Core (MySQL vía Pomelo) ───────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connStr, new MySqlServerVersion(new Version(8, 0, 21))));

// ─── Servicios ────────────────────────────────────────────
builder.Services.AddScoped<ClienteService>();
builder.Services.AddScoped<MaterialService>();
builder.Services.AddScoped<HerrajeService>();
builder.Services.AddScoped<ServicioExternoService>();
builder.Services.AddScoped<TapacantoService>();
builder.Services.AddScoped<InventarioService>();
builder.Services.AddScoped<CotizacionService>();
builder.Services.AddScoped<PiezaCorteService>();
builder.Services.AddScoped<DetalleHerrajeService>();
builder.Services.AddScoped<DetalleServicioService>();
builder.Services.AddScoped<CotizacionCompletaService>();
builder.Services.AddScoped<UsuarioService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<OptimizerService>();

// ─── JWT ──────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ─── Swagger con soporte JWT ──────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Escribe: Bearer {tu_token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

try
{
    app.MapControllers();
    app.Run();
}
catch (ReflectionTypeLoadException ex)
{
    Console.WriteLine("=== LOADER EXCEPTIONS ===");
    if (ex.LoaderExceptions != null)
    {
        foreach (var le in ex.LoaderExceptions)
        {
            if (le != null)
            {
                Console.WriteLine(">> " + le.Message);
                if (le.InnerException != null)
                    Console.WriteLine("   INNER: " + le.InnerException.Message);
            }
        }
    }
    Console.ReadLine();
}
