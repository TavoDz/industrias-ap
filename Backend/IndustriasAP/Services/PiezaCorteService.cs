using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class PiezaCorteService
    {
        private readonly DatabaseConnection db;

        public PiezaCorteService(DatabaseConnection db)
        {
            this.db = db;
        }

        public List<PiezaCorte> ObtenerPorCotizacion(int cotizacionId)
        {
            var lista = new List<PiezaCorte>();

            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"SELECT id, cotizacion_id, nombre_pieza, material_id, largo, ancho,
                                 cantidad, metro_tapacanto, costo_material, created_at
                                 FROM PiezasCorte WHERE cotizacion_id = @CotizacionId";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId", cotizacionId);
                using var reader = cmd.ExecuteReader();
                while (reader.Read()) lista.Add(MapPieza(reader));
            }
            return lista;
        }

        public PiezaCorte? ObtenerPorId(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = @"SELECT id, cotizacion_id, nombre_pieza, material_id, largo, ancho,
                                 cantidad, metro_tapacanto, costo_material, created_at
                                 FROM PiezasCorte WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                using var reader = cmd.ExecuteReader();
                if (reader.Read()) return MapPieza(reader);
            }
            return null;
        }

        public void AgregarPieza(PiezaCorte pieza)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                pieza.CostoMaterial = CalcularCosto(conn, pieza);

                string query = @"INSERT INTO PiezasCorte
                                 (cotizacion_id, nombre_pieza, material_id, largo, ancho, cantidad, metro_tapacanto, costo_material)
                                 VALUES (@CotizacionId, @NombrePieza, @MaterialId, @Largo, @Ancho, @Cantidad, @MetroTapacanto, @CostoMaterial)";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CotizacionId",   pieza.CotizacionId);
                cmd.Parameters.AddWithValue("@NombrePieza",    pieza.NombrePieza);
                cmd.Parameters.AddWithValue("@MaterialId",     pieza.MaterialId);
                cmd.Parameters.AddWithValue("@Largo",          pieza.Largo);
                cmd.Parameters.AddWithValue("@Ancho",          pieza.Ancho);
                cmd.Parameters.AddWithValue("@Cantidad",       pieza.Cantidad);
                cmd.Parameters.AddWithValue("@MetroTapacanto", pieza.MetroTapacanto);
                cmd.Parameters.AddWithValue("@CostoMaterial",  pieza.CostoMaterial);
                cmd.ExecuteNonQuery();
            }
        }

        public bool ActualizarPieza(int id, PiezaCorte pieza)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                pieza.CostoMaterial = CalcularCosto(conn, pieza);

                string query = @"UPDATE PiezasCorte SET
                                 nombre_pieza=@NombrePieza, material_id=@MaterialId,
                                 largo=@Largo, ancho=@Ancho, cantidad=@Cantidad,
                                 metro_tapacanto=@MetroTapacanto, costo_material=@CostoMaterial
                                 WHERE id=@Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@NombrePieza",    pieza.NombrePieza);
                cmd.Parameters.AddWithValue("@MaterialId",     pieza.MaterialId);
                cmd.Parameters.AddWithValue("@Largo",          pieza.Largo);
                cmd.Parameters.AddWithValue("@Ancho",          pieza.Ancho);
                cmd.Parameters.AddWithValue("@Cantidad",       pieza.Cantidad);
                cmd.Parameters.AddWithValue("@MetroTapacanto", pieza.MetroTapacanto);
                cmd.Parameters.AddWithValue("@CostoMaterial",  pieza.CostoMaterial);
                cmd.Parameters.AddWithValue("@Id",             id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        public bool EliminarPieza(int id)
        {
            using (MySqlConnection conn = db.GetConnection())
            {
                conn.Open();
                string query = "DELETE FROM PiezasCorte WHERE id = @Id";
                MySqlCommand cmd = new MySqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@Id", id);
                return cmd.ExecuteNonQuery() > 0;
            }
        }

        // Fórmula: (largo_pieza × ancho_pieza × cantidad) / (largo_tablero × ancho_tablero) × precio_tablero
        private decimal CalcularCosto(MySqlConnection conn, PiezaCorte pieza)
        {
            string query = "SELECT largo, ancho, precio_tablero FROM Materiales WHERE id = @MaterialId AND estado = 1";
            MySqlCommand cmd = new MySqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@MaterialId", pieza.MaterialId);
            using var reader = cmd.ExecuteReader();

            if (!reader.Read()) return 0;

            decimal largoTablero  = reader.GetDecimal("largo");
            decimal anchoTablero  = reader.GetDecimal("ancho");
            decimal precioTablero = reader.GetDecimal("precio_tablero");

            reader.Close();

            if (largoTablero == 0 || anchoTablero == 0 || precioTablero == 0) return 0;

            decimal areaPieza   = pieza.Largo * pieza.Ancho * pieza.Cantidad;
            decimal areaTablero = largoTablero * anchoTablero;

            return Math.Round((areaPieza / areaTablero) * precioTablero, 2);
        }

        private PiezaCorte MapPieza(MySqlDataReader reader)
        {
            return new PiezaCorte
            {
                Id             = reader.GetInt32("id"),
                CotizacionId   = reader.GetInt32("cotizacion_id"),
                NombrePieza    = reader.IsDBNull(reader.GetOrdinal("nombre_pieza"))    ? null : reader.GetString("nombre_pieza"),
                MaterialId     = reader.GetInt32("material_id"),
                Largo          = reader.IsDBNull(reader.GetOrdinal("largo"))           ? 0 : reader.GetDecimal("largo"),
                Ancho          = reader.IsDBNull(reader.GetOrdinal("ancho"))           ? 0 : reader.GetDecimal("ancho"),
                Cantidad       = reader.IsDBNull(reader.GetOrdinal("cantidad"))        ? 0 : reader.GetInt32("cantidad"),
                MetroTapacanto = reader.IsDBNull(reader.GetOrdinal("metro_tapacanto")) ? 0 : reader.GetDecimal("metro_tapacanto"),
                CostoMaterial  = reader.IsDBNull(reader.GetOrdinal("costo_material"))  ? 0 : reader.GetDecimal("costo_material"),
                CreatedAt      = reader.GetDateTime("created_at")
            };
        }
    }
}
