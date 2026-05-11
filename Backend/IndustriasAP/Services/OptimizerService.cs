using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class OptimizerService
    {
        DatabaseConnection db = new DatabaseConnection();

        // Grosor de sierra (kerf) en mm
        private const decimal Kerf = 3m;

        public OptimizarResponse Optimizar(OptimizarRequest request)
        {
            var material = ObtenerMaterial(request.MaterialId);
            if (material == null)
                throw new Exception("Material no encontrado");

            decimal planchaLargo = material.Largo;
            decimal planchaAncho = material.Ancho;

            // Expandir piezas por cantidad
            var piezasExpandidas = new List<PiezaOptimizar>();
            foreach (var pieza in request.Piezas)
            {
                for (int i = 0; i < pieza.Cantidad; i++)
                {
                    piezasExpandidas.Add(new PiezaOptimizar
                    {
                        Nombre      = pieza.Nombre,
                        Cantidad    = 1,
                        Largo       = pieza.Largo,
                        Ancho       = pieza.Ancho,
                        TapacantoL1 = pieza.TapacantoL1,
                        TapacantoL2 = pieza.TapacantoL2,
                        TapacantoA1 = pieza.TapacantoA1,
                        TapacantoA2 = pieza.TapacantoA2
                    });
                }
            }

            // Ordenar de mayor a menor área
            piezasExpandidas = piezasExpandidas
                .OrderByDescending(p => p.Largo * p.Ancho)
                .ToList();

            // Algoritmo Guillotine
            var planchas = new List<PlanchaResultado>();
            var espaciosLibres = new List<EspacioLibre>();
            var planchaActual = new PlanchaResultado { Numero = 1 };
            planchas.Add(planchaActual);
            espaciosLibres.Add(new EspacioLibre
            {
                X = 0, Y = 0,
                Largo = planchaLargo,
                Ancho = planchaAncho
            });

            foreach (var pieza in piezasExpandidas)
            {
                bool colocada = false;

                // Dimensiones reales de la pieza + kerf en cada corte
                decimal largoConKerf = pieza.Largo + Kerf;
                decimal anchoConKerf = pieza.Ancho + Kerf;

                for (int i = 0; i < espaciosLibres.Count; i++)
                {
                    var espacio = espaciosLibres[i];

                    // Sin rotar
                    if (largoConKerf <= espacio.Largo && anchoConKerf <= espacio.Ancho)
                    {
                        ColocarPieza(pieza, espacio, espaciosLibres, i, planchaActual, false);
                        colocada = true;
                        break;
                    }

                    // Rotada
                    if (request.PermitirRotar &&
                        anchoConKerf <= espacio.Largo && largoConKerf <= espacio.Ancho)
                    {
                        ColocarPieza(pieza, espacio, espaciosLibres, i, planchaActual, true);
                        colocada = true;
                        break;
                    }
                }

                if (!colocada)
                {
                    planchaActual = new PlanchaResultado { Numero = planchas.Count + 1 };
                    planchas.Add(planchaActual);
                    espaciosLibres.Clear();
                    espaciosLibres.Add(new EspacioLibre
                    {
                        X = 0, Y = 0,
                        Largo = planchaLargo,
                        Ancho = planchaAncho
                    });

                    var espacio = espaciosLibres[0];
                    if (largoConKerf <= espacio.Largo && anchoConKerf <= espacio.Ancho)
                        ColocarPieza(pieza, espacio, espaciosLibres, 0, planchaActual, false);
                    else if (request.PermitirRotar &&
                             anchoConKerf <= espacio.Largo && largoConKerf <= espacio.Ancho)
                        ColocarPieza(pieza, espacio, espaciosLibres, 0, planchaActual, true);
                }
            }

            // Calcular porcentajes por plancha (usando área real sin kerf)
            decimal areaPlanchaTot = planchaLargo * planchaAncho;
            foreach (var plancha in planchas)
            {
                decimal areaUsada = plancha.Piezas.Sum(p => p.Largo * p.Ancho);
                plancha.PorcentajeUso = Math.Round((areaUsada / areaPlanchaTot) * 100, 1);

                // Calcular sobrantes de esta plancha
                plancha.Sobrantes = CalcularSobrantes(plancha.Piezas, planchaLargo, planchaAncho);
            }

            // Totales
            decimal areaTotalUsada = planchas.SelectMany(p => p.Piezas).Sum(p => p.Largo * p.Ancho);
            decimal areaTotal = planchas.Count * areaPlanchaTot;
            decimal pctUso    = Math.Round((areaTotalUsada / areaTotal) * 100, 1);

            // Metros lineales de corte (perímetro total de todas las piezas)
            decimal mlCorte = planchas.SelectMany(p => p.Piezas)
                .Sum(p => 2 * (p.Largo + p.Ancho)) / 1000m;

            // Metros lineales de tapacanto
            decimal mlTapacanto = 0;
            foreach (var p in planchas.SelectMany(pl => pl.Piezas))
            {
                if (p.TapacantoL1) mlTapacanto += p.Largo;
                if (p.TapacantoL2) mlTapacanto += p.Largo;
                if (p.TapacantoA1) mlTapacanto += p.Ancho;
                if (p.TapacantoA2) mlTapacanto += p.Ancho;
            }
            mlTapacanto /= 1000m;

            return new OptimizarResponse
            {
                TotalPlanchas         = planchas.Count,
                PorcentajeUso         = pctUso,
                PorcentajeDesperdicio = Math.Round(100 - pctUso, 1),
                AreaTotal             = areaTotal,
                AreaUsada             = areaTotalUsada,
                MaterialNombre        = material.Nombre,
                PlanchaLargo          = planchaLargo,
                PlanchaAncho          = planchaAncho,
                MetrosLinealesCorte   = Math.Round(mlCorte, 2),
                MetrosLinealesTapacanto = Math.Round(mlTapacanto, 2),
                Planchas              = planchas
            };
        }

        private List<SobranteInfo> CalcularSobrantes(List<PiezaUbicada> piezas, decimal planchaLargo, decimal planchaAncho)
        {
            // Sobrante simple: área no cubierta dividida en rectángulos por columna/fila
            var sobrantes = new List<SobranteInfo>();
            if (!piezas.Any()) return sobrantes;

            // Sobrante derecho: desde el máximo X usado hasta el borde
            decimal maxX = piezas.Max(p => p.X + p.Largo + Kerf);
            if (planchaLargo - maxX > 10)
            {
                sobrantes.Add(new SobranteInfo
                {
                    X     = maxX,
                    Y     = 0,
                    Largo = planchaLargo - maxX,
                    Ancho = planchaAncho
                });
            }

            // Sobrante inferior: desde el máximo Y usado hasta el borde
            decimal maxY = piezas.Max(p => p.Y + p.Ancho + Kerf);
            if (planchaAncho - maxY > 10)
            {
                sobrantes.Add(new SobranteInfo
                {
                    X     = 0,
                    Y     = maxY,
                    Largo = maxX > 0 ? maxX : planchaLargo,
                    Ancho = planchaAncho - maxY
                });
            }

            return sobrantes;
        }

        private void ColocarPieza(
            PiezaOptimizar pieza,
            EspacioLibre espacio,
            List<EspacioLibre> espacios,
            int indice,
            PlanchaResultado plancha,
            bool rotar)
        {
            decimal largo = rotar ? pieza.Ancho : pieza.Largo;
            decimal ancho = rotar ? pieza.Largo : pieza.Ancho;

            plancha.Piezas.Add(new PiezaUbicada
            {
                Nombre      = pieza.Nombre,
                X           = espacio.X,
                Y           = espacio.Y,
                Largo       = largo,
                Ancho       = ancho,
                Rotada      = rotar,
                TapacantoL1 = rotar ? pieza.TapacantoA1 : pieza.TapacantoL1,
                TapacantoL2 = rotar ? pieza.TapacantoA2 : pieza.TapacantoL2,
                TapacantoA1 = rotar ? pieza.TapacantoL1 : pieza.TapacantoA1,
                TapacantoA2 = rotar ? pieza.TapacantoL2 : pieza.TapacantoA2
            });

            espacios.RemoveAt(indice);

            // Espacio derecho (incluye kerf)
            decimal espacioDerLargo = espacio.Largo - largo - Kerf;
            if (espacioDerLargo > 0)
            {
                espacios.Add(new EspacioLibre
                {
                    X     = espacio.X + largo + Kerf,
                    Y     = espacio.Y,
                    Largo = espacioDerLargo,
                    Ancho = ancho
                });
            }

            // Espacio inferior (incluye kerf)
            decimal espacioInfAncho = espacio.Ancho - ancho - Kerf;
            if (espacioInfAncho > 0)
            {
                espacios.Add(new EspacioLibre
                {
                    X     = espacio.X,
                    Y     = espacio.Y + ancho + Kerf,
                    Largo = espacio.Largo,
                    Ancho = espacioInfAncho
                });
            }

            espacios.Sort((a, b) => (a.Largo * a.Ancho).CompareTo(b.Largo * b.Ancho));
        }

        private Material? ObtenerMaterial(int id)
        {
            using var conn = db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand(
                "SELECT id, nombre, largo, ancho, precio_tablero FROM Materiales WHERE id = @Id AND estado = 1", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            using var r = cmd.ExecuteReader();
            if (r.Read())
                return new Material
                {
                    Id            = r.GetInt32("id"),
                    Nombre        = r.GetString("nombre"),
                    Largo         = r.GetDecimal("largo"),
                    Ancho         = r.GetDecimal("ancho"),
                    PrecioTablero = r.GetDecimal("precio_tablero")
                };
            return null;
        }
    }
}
