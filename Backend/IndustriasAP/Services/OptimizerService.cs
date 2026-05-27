using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using InsutriasAP.Database;
using InsutriasAP.Models;
using MySql.Data.MySqlClient;

namespace InsutriasAP.Services
{
    public class OptimizerService
    {
        private readonly DatabaseConnection _db;
        private readonly IHttpClientFactory _httpFactory;
        private const decimal Kerf            = 3m;
        private const float   TimeLimitSec    = 25f;

        public OptimizerService(DatabaseConnection db, IHttpClientFactory httpFactory)
        {
            _db         = db;
            _httpFactory = httpFactory;
        }

        // ── Punto de entrada (async) ──────────────────────────────────────────
        public async Task<OptimizarResponse> OptimizarAsync(OptimizarRequest request)
        {
            var material = ObtenerMaterial(request.MaterialId)
                ?? throw new Exception("Material no encontrado");

            try
            {
                var python = await LlamarPythonAsync(request, material);
                if (python != null)
                {
                    Console.WriteLine(
                        $"[Optimizer] Python → {python.TotalPlanchas} tablero(s), {python.PorcentajeUso}% eficiencia");
                    return python;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Optimizer] Python no disponible ({ex.Message}). Usando MaxRects local.");
            }

            return OptimizarLocal(request, material);
        }

        // ── Llamada HTTP al servicio Python ───────────────────────────────────
        private async Task<OptimizarResponse?> LlamarPythonAsync(
            OptimizarRequest request, Material material)
        {
            var http = _httpFactory.CreateClient("optimizer");

            // Health check rápido
            try
            {
                using var ping = await http.GetAsync("health");
                if (!ping.IsSuccessStatusCode) return null;
            }
            catch { return null; }

            // Construir body
            var pyReq = new PyOptimizeRequest
            {
                BoardW    = (float)material.Largo,
                BoardH    = (float)material.Ancho,
                Kerf      = (float)Kerf,
                TimeLimit = TimeLimitSec,
                Pieces    = request.Piezas.Select((p, i) => new PyPieceRequest
                {
                    Id        = i,
                    Name      = p.Nombre,
                    W         = (float)p.Largo,
                    H         = (float)p.Ancho,
                    CanRotate = request.PermitirRotar,
                    Quantity  = p.Cantidad,
                }).ToList()
            };

            var json    = JsonSerializer.Serialize(pyReq,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower });
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var resp = await http.PostAsync("optimize", content);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync();
                Console.WriteLine($"[Optimizer] Python error {resp.StatusCode}: {err}");
                return null;
            }

            var pyResult = await resp.Content.ReadFromJsonAsync<PyOptimizeResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return pyResult == null ? null : MapearDesdePython(pyResult, request, material);
        }

        // ── Mapeo Python → OptimizarResponse ─────────────────────────────────
        private OptimizarResponse MapearDesdePython(
            PyOptimizeResponse py, OptimizarRequest request, Material material)
        {
            decimal pLargo = material.Largo;
            decimal pAncho = material.Ancho;
            var planchas   = new List<PlanchaResultado>();

            foreach (var board in py.Boards)
            {
                var piezas = board.Pieces.Select(pp =>
                {
                    PiezaOptimizar? orig = pp.PieceId >= 0 && pp.PieceId < request.Piezas.Count
                        ? request.Piezas[pp.PieceId] : null;

                    return new PiezaUbicada
                    {
                        Nombre      = pp.Name,
                        X           = (decimal)pp.X,
                        Y           = (decimal)pp.Y,
                        Largo       = (decimal)pp.W,
                        Ancho       = (decimal)pp.H,
                        Rotada      = pp.Rotated,
                        TapacantoL1 = orig != null && (pp.Rotated ? orig.TapacantoA1 : orig.TapacantoL1),
                        TapacantoL2 = orig != null && (pp.Rotated ? orig.TapacantoA2 : orig.TapacantoL2),
                        TapacantoA1 = orig != null && (pp.Rotated ? orig.TapacantoL1 : orig.TapacantoA1),
                        TapacantoA2 = orig != null && (pp.Rotated ? orig.TapacantoL2 : orig.TapacantoA2),
                        TapacantoId = orig?.TapacantoId,
                    };
                }).ToList();

                var sobrantes = RecalcularSobrantes(piezas, pLargo, pAncho);
                planchas.Add(ConstruirResultado(board.Number, piezas, pLargo, pAncho, sobrantes));
            }

            return ConstruirResponse(planchas, material, pLargo, pAncho);
        }

        // Recalcula sobrantes reproduciendo las piezas en un MaxRects vacío
        private static List<SobranteInfo> RecalcularSobrantes(
            List<PiezaUbicada> piezas, decimal largo, decimal ancho)
        {
            var sheet = new MaxRectsSheet(largo, ancho, Kerf);
            foreach (var p in piezas)
                sheet.PlaceAt(p.X, p.Y, p.Largo, p.Ancho);
            return sheet.GetSobrantes();
        }

        // ── MaxRects local (fallback) ─────────────────────────────────────────
        private OptimizarResponse OptimizarLocal(OptimizarRequest request, Material material)
        {
            decimal pLargo = material.Largo;
            decimal pAncho = material.Ancho;

            var base_ = new List<PiezaOptimizar>();
            foreach (var pieza in request.Piezas)
                for (int i = 0; i < pieza.Cantidad; i++)
                    base_.Add(new PiezaOptimizar
                    {
                        Nombre      = pieza.Nombre, Cantidad    = 1,
                        Largo       = pieza.Largo,  Ancho       = pieza.Ancho,
                        TapacantoL1 = pieza.TapacantoL1, TapacantoL2 = pieza.TapacantoL2,
                        TapacantoA1 = pieza.TapacantoA1, TapacantoA2 = pieza.TapacantoA2,
                        TapacantoId = pieza.TapacantoId
                    });

            var ordenamientos = new List<List<PiezaOptimizar>>
            {
                base_.OrderByDescending(p => p.Largo * p.Ancho).ToList(),
                base_.OrderBy(p => p.Largo * p.Ancho).ToList(),
                base_.OrderByDescending(p => p.Largo + p.Ancho).ToList(),
                base_.OrderBy(p => p.Largo + p.Ancho).ToList(),
                base_.OrderByDescending(p => Math.Max(p.Largo, p.Ancho)).ToList(),
                base_.OrderByDescending(p => Math.Min(p.Largo, p.Ancho)).ToList(),
                base_.OrderBy(p => Math.Min(p.Largo, p.Ancho)).ToList(),
                base_.OrderByDescending(p => p.Largo).ToList(),
                base_.OrderByDescending(p => p.Ancho).ToList(),
                base_.OrderBy(p => p.Largo).ToList(),
                base_.OrderBy(p => p.Ancho).ToList(),
                base_.OrderByDescending(p => (double)p.Largo / (double)(p.Ancho > 0 ? p.Ancho : 1)).ToList(),
            };

            var rng = new Random(2024);
            for (int s = 0; s < 200; s++)
                ordenamientos.Add(base_.OrderBy(_ => rng.Next()).ToList());

            var heuristicas = new[] { Heuristica.BAF, Heuristica.BSSF, Heuristica.BLSF };
            List<PlanchaResultado>? planchas = null;

            foreach (var ord in ordenamientos)
                foreach (var h in heuristicas)
                {
                    var cand = EjecutarPacking(ord, pLargo, pAncho, request.PermitirRotar, h);
                    if (planchas == null || EsMejor(cand, planchas)) planchas = cand;
                }

            if (planchas!.Count > 1)
            {
                var ultimas = planchas.Last().Piezas
                    .Select(pu => (pu.Nombre, pu.Largo, pu.Ancho)).ToHashSet();
                foreach (var h in heuristicas)
                {
                    var cand = EjecutarPacking(
                        base_.OrderByDescending(p => ultimas.Contains((p.Nombre, p.Largo, p.Ancho)) ? 1 : 0)
                             .ThenByDescending(p => p.Largo * p.Ancho).ToList(),
                        pLargo, pAncho, request.PermitirRotar, h);
                    if (EsMejor(cand, planchas)) planchas = cand;
                }
            }

            return ConstruirResponse(planchas!, material, pLargo, pAncho);
        }

        // ── Helpers compartidos ───────────────────────────────────────────────

        private static OptimizarResponse ConstruirResponse(
            List<PlanchaResultado> planchas, Material material,
            decimal pLargo, decimal pAncho)
        {
            decimal areaPlancha    = pLargo * pAncho;
            decimal areaTotalUsada = planchas.SelectMany(p => p.Piezas).Sum(p => p.Largo * p.Ancho);
            decimal areaTotal      = planchas.Count * areaPlancha;
            decimal pctUso         = Math.Round(areaTotal > 0 ? areaTotalUsada / areaTotal * 100 : 0, 1);

            decimal mlCorte = planchas.SelectMany(p => p.Piezas)
                .Sum(p => 2 * (p.Largo + p.Ancho)) / 1000m;

            decimal mlTapa = 0;
            foreach (var p in planchas.SelectMany(pl => pl.Piezas))
            {
                if (p.TapacantoL1) mlTapa += p.Largo;
                if (p.TapacantoL2) mlTapa += p.Largo;
                if (p.TapacantoA1) mlTapa += p.Ancho;
                if (p.TapacantoA2) mlTapa += p.Ancho;
            }

            return new OptimizarResponse
            {
                TotalPlanchas           = planchas.Count,
                PorcentajeUso           = pctUso,
                PorcentajeDesperdicio   = Math.Round(100 - pctUso, 1),
                AreaTotal               = areaTotal,
                AreaUsada               = areaTotalUsada,
                AreaDesperdiciada       = Math.Round(areaTotal - areaTotalUsada, 2),
                AreaSobrantes           = Math.Round(planchas.SelectMany(p => p.Sobrantes).Sum(s => s.Largo * s.Ancho), 2),
                TotalCortes             = planchas.Sum(p => p.LineasCorte.Count),
                MaterialNombre          = material.Nombre,
                PlanchaLargo            = pLargo,
                PlanchaAncho            = pAncho,
                MetrosLinealesCorte     = Math.Round(mlCorte, 2),
                MetrosLinealesTapacanto = Math.Round(mlTapa / 1000m, 2),
                Planchas                = planchas
            };
        }

        private static PlanchaResultado ConstruirResultado(
            int numero, List<PiezaUbicada> piezas,
            decimal largo, decimal ancho, List<SobranteInfo> sobrantes)
        {
            decimal areaUsada = piezas.Sum(p => p.Largo * p.Ancho);
            decimal pct = Math.Round(largo * ancho > 0 ? areaUsada / (largo * ancho) * 100 : 0, 1);

            var yCortes = piezas
                .SelectMany(p => new[] { p.Y, p.Y + p.Ancho })
                .Where(y => y > 0 && y < ancho).Distinct().OrderBy(y => y).ToList();

            var yCuad = new[] { 0m }.Concat(yCortes).Concat(new[] { ancho }).OrderBy(y => y).ToList();

            var lineasH = yCortes.Select((y, i) => new LineaCorte
            {
                Tipo = "H", Posicion = y, Desde = 0, Hasta = largo, Numero = i + 1, Orden = i + 1
            }).ToList();

            var xCortes = piezas
                .SelectMany(p => new[] { p.X, p.X + p.Largo })
                .Where(x => x > 0 && x < largo).Distinct().OrderBy(x => x).ToList();

            var lineasV = new List<LineaCorte>();
            for (int vi = 0; vi < xCortes.Count; vi++)
            {
                decimal x = xCortes[vi];
                var enX   = piezas.Where(p => Math.Abs(p.X - x) < 0.5m || Math.Abs(p.X + p.Largo - x) < 0.5m).ToList();
                if (!enX.Any()) continue;
                decimal desde = yCuad.Where(y => y <= enX.Min(p => p.Y)).DefaultIfEmpty(0m).Max();
                decimal hasta = yCuad.Where(y => y >= enX.Max(p => p.Y + p.Ancho)).DefaultIfEmpty(ancho).Min();
                lineasV.Add(new LineaCorte
                {
                    Tipo = "V", Posicion = x, Desde = desde, Hasta = hasta,
                    Numero = vi + 1, Orden = lineasH.Count + vi + 1
                });
            }

            return new PlanchaResultado
            {
                Numero        = numero,
                PorcentajeUso = pct,
                Piezas        = piezas,
                Sobrantes     = sobrantes,
                LineasCorte   = lineasH.Concat(lineasV).ToList()
            };
        }

        // ── MaxRects (fallback local) ─────────────────────────────────────────

        private static List<PlanchaResultado> EjecutarPacking(
            List<PiezaOptimizar> piezas, decimal largo, decimal ancho,
            bool permitirRotar, Heuristica h)
        {
            var planchas = new List<PlanchaResultado>();
            var hoja = new MaxRectsSheet(largo, ancho, Kerf);

            foreach (var pieza in piezas)
            {
                if (hoja.TryPlace(pieza, permitirRotar, h) != null) continue;
                if (hoja.TienePiezas())
                    planchas.Add(CerrarHoja(hoja, planchas.Count + 1, largo, ancho));
                hoja = new MaxRectsSheet(largo, ancho, Kerf);
                if (hoja.TryPlace(pieza, permitirRotar, h) == null)
                    throw new Exception(
                        $"La pieza '{pieza.Nombre}' ({pieza.Largo}×{pieza.Ancho}mm) no cabe en la plancha ({largo}×{ancho}mm)");
            }
            if (hoja.TienePiezas())
                planchas.Add(CerrarHoja(hoja, planchas.Count + 1, largo, ancho));

            return planchas;
        }

        private static bool EsMejor(List<PlanchaResultado> a, List<PlanchaResultado> b)
        {
            if (a.Count != b.Count) return a.Count < b.Count;
            return a.SelectMany(p => p.Piezas).Sum(p => p.Largo * p.Ancho)
                 > b.SelectMany(p => p.Piezas).Sum(p => p.Largo * p.Ancho);
        }

        private static PlanchaResultado CerrarHoja(MaxRectsSheet hoja, int numero, decimal largo, decimal ancho)
            => ConstruirResultado(numero, hoja.GetPiezas(), largo, ancho, hoja.GetSobrantes());

        // ── Base de datos ─────────────────────────────────────────────────────

        private Material? ObtenerMaterial(int id)
        {
            using var conn = _db.GetConnection();
            conn.Open();
            var cmd = new MySqlCommand(
                "SELECT id, nombre, largo, ancho, precio_tablero FROM Materiales WHERE id=@Id AND estado=1", conn);
            cmd.Parameters.AddWithValue("@Id", id);
            using var r = cmd.ExecuteReader();
            if (!r.Read()) return null;
            return new Material
            {
                Id            = r.GetInt32("id"),
                Nombre        = r.GetString("nombre"),
                Largo         = r.GetDecimal("largo"),
                Ancho         = r.GetDecimal("ancho"),
                PrecioTablero = r.GetDecimal("precio_tablero")
            };
        }
    }

    // ─── DTOs internos Python ─────────────────────────────────────────────────

    internal class PyOptimizeRequest
    {
        [JsonPropertyName("board_w")]    public float BoardW    { get; set; }
        [JsonPropertyName("board_h")]    public float BoardH    { get; set; }
        [JsonPropertyName("kerf")]       public float Kerf      { get; set; }
        [JsonPropertyName("time_limit")] public float TimeLimit { get; set; }
        [JsonPropertyName("pieces")]     public List<PyPieceRequest> Pieces { get; set; } = new();
    }

    internal class PyPieceRequest
    {
        [JsonPropertyName("id")]         public int    Id        { get; set; }
        [JsonPropertyName("name")]       public string Name      { get; set; } = "";
        [JsonPropertyName("w")]          public float  W         { get; set; }
        [JsonPropertyName("h")]          public float  H         { get; set; }
        [JsonPropertyName("can_rotate")] public bool   CanRotate { get; set; }
        [JsonPropertyName("quantity")]   public int    Quantity  { get; set; }
    }

    internal class PyOptimizeResponse
    {
        [JsonPropertyName("boards_used")]        public int    BoardsUsed        { get; set; }
        [JsonPropertyName("efficiency_percent")] public float  EfficiencyPercent { get; set; }
        [JsonPropertyName("algorithm")]          public string Algorithm          { get; set; } = "";
        [JsonPropertyName("boards")]             public List<PyBoard> Boards      { get; set; } = new();
    }

    internal class PyBoard
    {
        [JsonPropertyName("number")] public int           Number { get; set; }
        [JsonPropertyName("pieces")] public List<PyPiece> Pieces { get; set; } = new();
    }

    internal class PyPiece
    {
        [JsonPropertyName("piece_id")] public int    PieceId { get; set; }
        [JsonPropertyName("name")]     public string Name    { get; set; } = "";
        [JsonPropertyName("x")]        public float  X       { get; set; }
        [JsonPropertyName("y")]        public float  Y       { get; set; }
        [JsonPropertyName("w")]        public float  W       { get; set; }
        [JsonPropertyName("h")]        public float  H       { get; set; }
        [JsonPropertyName("rotated")]  public bool   Rotated { get; set; }
    }

    // ─── Algoritmo MaxRects ───────────────────────────────────────────────────

    internal enum Heuristica { BAF, BSSF, BLSF }

    internal class MaxRectsSheet
    {
        private readonly decimal _largo, _ancho, _kerf;
        private readonly List<PiezaUbicada> _piezas = new();
        private readonly List<MaxRect>      _libres  = new();

        public MaxRectsSheet(decimal largo, decimal ancho, decimal kerf)
        {
            _largo = largo; _ancho = ancho; _kerf = kerf;
            _libres.Add(new MaxRect(0, 0, largo, ancho));
        }

        public bool              TienePiezas() => _piezas.Count > 0;
        public List<PiezaUbicada> GetPiezas()  => _piezas;

        public void PlaceAt(decimal x, decimal y, decimal largo, decimal ancho)
        {
            _piezas.Add(new PiezaUbicada { X = x, Y = y, Largo = largo, Ancho = ancho });
            ActualizarLibres(x, y, largo + _kerf, ancho + _kerf);
            EliminarContenidos();
        }

        public List<SobranteInfo> GetSobrantes()
        {
            var s = _libres
                .Where(r => r.Largo > 10 && r.Ancho > 10)
                .Select(r => new SobranteInfo { X = r.X, Y = r.Y, Largo = r.Largo, Ancho = r.Ancho })
                .ToList();
            return s.Where(x => !s.Any(o => o != x &&
                x.X >= o.X && x.Y >= o.Y &&
                x.X + x.Largo <= o.X + o.Largo &&
                x.Y + x.Ancho  <= o.Y + o.Ancho)).ToList();
        }

        public PiezaUbicada? TryPlace(PiezaOptimizar pieza, bool permitirRotar, Heuristica h = Heuristica.BAF)
        {
            decimal best = decimal.MaxValue;
            MaxRect? bRect = null; bool bRot = false;

            foreach (var r in _libres)
            {
                Fit(pieza.Largo, pieza.Ancho, r, false, h, ref best, ref bRect, ref bRot);
                if (permitirRotar && pieza.Largo != pieza.Ancho)
                    Fit(pieza.Ancho, pieza.Largo, r, true, h, ref best, ref bRect, ref bRot);
            }
            if (bRect == null) return null;

            decimal pL = bRot ? pieza.Ancho : pieza.Largo;
            decimal pA = bRot ? pieza.Largo : pieza.Ancho;
            var u = new PiezaUbicada
            {
                Nombre = pieza.Nombre, X = bRect.X, Y = bRect.Y, Largo = pL, Ancho = pA, Rotada = bRot,
                TapacantoL1 = bRot ? pieza.TapacantoA1 : pieza.TapacantoL1,
                TapacantoL2 = bRot ? pieza.TapacantoA2 : pieza.TapacantoL2,
                TapacantoA1 = bRot ? pieza.TapacantoL1 : pieza.TapacantoA1,
                TapacantoA2 = bRot ? pieza.TapacantoL2 : pieza.TapacantoA2,
                TapacantoId = pieza.TapacantoId,
            };
            _piezas.Add(u);
            ActualizarLibres(bRect.X, bRect.Y, pL + _kerf, pA + _kerf);
            EliminarContenidos();
            return u;
        }

        private void Fit(decimal w, decimal h, MaxRect r, bool rot, Heuristica heur,
            ref decimal best, ref MaxRect? bRect, ref bool bRot)
        {
            if (w + _kerf > r.Largo || h + _kerf > r.Ancho) return;
            decimal sc = heur switch
            {
                Heuristica.BSSF => Math.Min(r.Largo - w - _kerf, r.Ancho - h - _kerf),
                Heuristica.BLSF => Math.Max(r.Largo - w - _kerf, r.Ancho - h - _kerf),
                _               => r.Largo * r.Ancho - w * h
            };
            if (sc < best) { best = sc; bRect = r; bRot = rot; }
        }

        private void ActualizarLibres(decimal px, decimal py, decimal pw, decimal ph)
        {
            var add = new List<MaxRect>(); var rem = new List<MaxRect>();
            foreach (var r in _libres)
            {
                if (!(px < r.X + r.Largo && px + pw > r.X && py < r.Y + r.Ancho && py + ph > r.Y)) continue;
                rem.Add(r);
                if (px + pw < r.X + r.Largo) add.Add(new MaxRect(px + pw, r.Y, r.X + r.Largo - (px + pw), r.Ancho));
                if (px > r.X)               add.Add(new MaxRect(r.X, r.Y, px - r.X, r.Ancho));
                if (py + ph < r.Y + r.Ancho) add.Add(new MaxRect(r.X, py + ph, r.Largo, r.Y + r.Ancho - (py + ph)));
                if (py > r.Y)               add.Add(new MaxRect(r.X, r.Y, r.Largo, py - r.Y));
            }
            foreach (var r in rem) _libres.Remove(r);
            _libres.AddRange(add);
        }

        private void EliminarContenidos()
        {
            for (int i = 0; i < _libres.Count; i++)
                for (int j = i + 1; j < _libres.Count; j++)
                {
                    if (Cont(_libres[j], _libres[i])) { _libres.RemoveAt(i--); break; }
                    if (Cont(_libres[i], _libres[j])) _libres.RemoveAt(j--);
                }
        }

        private static bool Cont(MaxRect o, MaxRect i)
            => i.X >= o.X && i.Y >= o.Y &&
               i.X + i.Largo <= o.X + o.Largo &&
               i.Y + i.Ancho  <= o.Y + o.Ancho;
    }

    internal class MaxRect
    {
        public decimal X, Y, Largo, Ancho;
        public MaxRect(decimal x, decimal y, decimal l, decimal a) { X=x; Y=y; Largo=l; Ancho=a; }
    }
}
