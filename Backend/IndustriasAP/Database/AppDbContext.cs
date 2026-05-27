using InsutriasAP.Database;
using InsutriasAP.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;


namespace InsutriasAP.Database
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Optimizacion> Optimizaciones { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Optimizacion>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Nombre).HasColumnName("nombre").HasMaxLength(200).IsRequired(false);
                entity.Property(e => e.Descripcion).HasColumnName("descripcion").HasColumnType("text").IsRequired(false);
                entity.Property(e => e.MaterialId).HasColumnName("material_id").IsRequired(false);
                entity.Property(e => e.MaterialNombre).HasColumnName("material_nombre").HasMaxLength(200).IsRequired(false);
                entity.Property(e => e.Fecha).HasColumnName("fecha").IsRequired();
                entity.Property(e => e.UltimaEjecucion).HasColumnName("ultima_ejecucion").IsRequired(false);
                entity.Property(e => e.CotizacionId).HasColumnName("cotizacion_id").IsRequired(false);
                entity.Property(e => e.TotalEjecuciones).HasColumnName("total_ejecuciones").HasDefaultValue(0);
                entity.Property(e => e.JsonResultado).HasColumnName("json_resultado").HasColumnType("longtext").IsRequired(false);
                entity.Property(e => e.JsonRequest).HasColumnName("json_request").HasColumnType("longtext").IsRequired(false);
            });
        }
    }
}

/// <summary>
/// Permite a 'dotnet ef migrations' instanciar AppDbContext sin arrancar la app completa.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        // Cadena de conexión de diseño (debe coincidir con appsettings.json)
        optionsBuilder.UseMySql(
            "server=localhost;port=3307;database=sistema_carpinteria;user=root;password=;",
            new MySqlServerVersion(new Version(8, 0, 21)));
        return new AppDbContext(optionsBuilder.Options);
    }
}
