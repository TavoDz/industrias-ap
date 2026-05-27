using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using InsutriasAP.DTOs;

namespace InsutriasAP.Services
{
    public class AdvancedOptimizerService
    {
        private readonly IHttpClientFactory _httpFactory;

        public AdvancedOptimizerService(IHttpClientFactory httpFactory)
        {
            _httpFactory = httpFactory;
        }

        public async Task<AdvancedOptimizeResponse> OptimizeAsync(AdvancedOptimizeRequest request)
        {
            var http = _httpFactory.CreateClient("optimizer");

            // Quick health check
            try
            {
                using var ping = await http.GetAsync("health");
                if (!ping.IsSuccessStatusCode)
                    throw new Exception("Servicio Python no disponible.");
            }
            catch (Exception ex) when (ex.Message != "Servicio Python no disponible.")
            {
                throw new Exception("No se puede conectar con el motor de optimización. Verificá que el servicio Python esté corriendo en el puerto 8001.");
            }

            var pyReq = new PyAdvRequest
            {
                BoardW    = request.BoardW,
                BoardH    = request.BoardH,
                Kerf      = request.Kerf,
                TimeLimit = request.TimeLimit,
                Pieces    = request.Pieces.Select(p => new PyAdvPiece
                {
                    Id            = p.Id,
                    Name          = p.Name,
                    Width         = p.Width,
                    Height        = p.Height,
                    Quantity      = p.Quantity,
                    CanRotate     = p.CanRotate,
                    GrainDirection = p.GrainDirection,
                    EdgeTop       = p.EdgeTop,
                    EdgeBottom    = p.EdgeBottom,
                    EdgeLeft      = p.EdgeLeft,
                    EdgeRight     = p.EdgeRight,
                    EdgeFlags     = p.EdgeFlags,
                }).ToList()
            };

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };
            var json    = JsonSerializer.Serialize(pyReq, options);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var resp = await http.PostAsync("optimize/advanced", content);

            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync();
                throw new Exception($"Error del motor de optimización: {err}");
            }

            var pyResult = await resp.Content.ReadFromJsonAsync<PyAdvResponse>(
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (pyResult == null)
                throw new Exception("Respuesta inválida del motor de optimización.");

            return MapResponse(pyResult);
        }

        private static AdvancedOptimizeResponse MapResponse(PyAdvResponse py)
        {
            return new AdvancedOptimizeResponse
            {
                BoardsUsed         = py.BoardsUsed,
                EfficiencyPercent  = py.EfficiencyPercent,
                WastePercent       = py.WastePercent,
                AreaUsed           = py.AreaUsed,
                AreaTotal          = py.AreaTotal,
                AreaWasted         = py.AreaWasted,
                TotalCuts          = py.TotalCuts,
                CutMeters          = py.CutMeters,
                ReusableOffcuts    = py.ReusableOffcuts,
                FragmentationIndex = py.FragmentationIndex,
                Score              = py.Score,
                Algorithm          = py.Algorithm,
                PassesRun          = py.PassesRun,
                TimeMs             = py.TimeMs,
                Boards = py.Boards.Select(b => new AdvancedBoardResult
                {
                    Number     = b.Number,
                    Efficiency = b.Efficiency,
                    AreaUsed   = b.AreaUsed,
                    Pieces = b.Pieces.Select(p => new AdvancedPlacedPiece
                    {
                        PieceId        = p.PieceId,
                        Name           = p.Name,
                        X              = p.X,
                        Y              = p.Y,
                        Width          = p.Width,
                        Height         = p.Height,
                        Rotated        = p.Rotated,
                        OriginalWidth  = p.OriginalWidth,
                        OriginalHeight = p.OriginalHeight,
                        EdgeTop        = p.EdgeTop,
                        EdgeBottom     = p.EdgeBottom,
                        EdgeLeft       = p.EdgeLeft,
                        EdgeRight      = p.EdgeRight,
                    }).ToList(),
                    FreeSpaces = b.FreeSpaces.Select(fs => new AdvancedFreeSpace
                    {
                        X = fs.X, Y = fs.Y,
                        Width = fs.Width, Height = fs.Height,
                        Area = fs.Area,
                    }).ToList(),
                    CutLines = b.CutLines.Select(cl => new AdvancedCutLine
                    {
                        X1 = cl.X1, Y1 = cl.Y1, X2 = cl.X2, Y2 = cl.Y2,
                        Direction = cl.Direction,
                        Sequence  = cl.Sequence,
                        Length    = cl.Length,
                    }).ToList(),
                }).ToList()
            };
        }
    }
}
