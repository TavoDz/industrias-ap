using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class ParametrosService
    {
        private readonly DatabaseConnection db;

        public ParametrosService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<ParametroSistema> ObtenerTodos()
        {
            var lista = new List<ParametroSistema>();
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("SELECT id, clave, valor, descripcion FROM parametros_sistema ORDER BY clave", conn);
            using var r = cmd.ExecuteReader();
            while (r.Read())
                lista.Add(Map(r));
            return lista;
        }

        public ParametroSistema? ObtenerPorClave(string clave)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand("SELECT id, clave, valor, descripcion FROM parametros_sistema WHERE clave = @Clave", conn);
            cmd.Parameters.AddWithValue("@Clave", clave);
            using var r = cmd.ExecuteReader();
            return r.Read() ? Map(r) : null;
        }

        public decimal ObtenerDecimal(string clave, decimal defecto = 0)
        {
            var p = ObtenerPorClave(clave);
            return p != null && decimal.TryParse(p.Valor, out var v) ? v : defecto;
        }

        public bool Actualizar(string clave, string valor)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand(
                "INSERT INTO parametros_sistema (clave, valor) VALUES (@Clave, @Valor) ON DUPLICATE KEY UPDATE valor = @Valor",
                conn);
            cmd.Parameters.AddWithValue("@Clave", clave);
            cmd.Parameters.AddWithValue("@Valor", valor);
            return cmd.ExecuteNonQuery() > 0;
        }

        private static ParametroSistema Map(MySqlDataReader r) => new()
        {
            Id          = r.GetInt32("id"),
            Clave       = r.GetString("clave"),
            Valor       = r.GetString("valor"),
            Descripcion = r.IsDBNull(r.GetOrdinal("descripcion")) ? null : r.GetString("descripcion"),
        };
    }
}
