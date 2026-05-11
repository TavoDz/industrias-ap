namespace InsutriasAP.Models
{
    // ── Request ───────────────────────────────────────────────────
    public class OptimizarRequest
    {
        public int      MaterialId    { get; set; }
        public bool PermitirRotar { get; set; } = true;
        public List<PiezaOptimizar> Piezas { get; set; } = new();

        
    }

    public class SobranteInfo
    {
        public decimal X { get; set; }
        public decimal Y { get; set; }
        public decimal Largo { get; set; }
        public decimal Ancho { get; set; }
    }

    public class PiezaOptimizar
    {
        public string Nombre      { get; set; } = string.Empty;
        public int    Cantidad    { get; set; }
        public decimal Largo      { get; set; }
        public decimal Ancho      { get; set; }
        public bool   TapacantoL1 { get; set; }  // lado largo 1
        public bool   TapacantoL2 { get; set; }  // lado largo 2
        public bool   TapacantoA1 { get; set; }  // lado ancho 1
        public bool   TapacantoA2 { get; set; }  // lado ancho 2
    }

    // ── Response ──────────────────────────────────────────────────
    public class OptimizarResponse
    {
        public int           TotalPlanchas    { get; set; }
        public decimal       PorcentajeUso    { get; set; }
        public decimal       PorcentajeDesperdicio { get; set; }
        public decimal       AreaTotal        { get; set; }
        public decimal       AreaUsada        { get; set; }
        public string        MaterialNombre   { get; set; } = string.Empty;
        public decimal       PlanchaLargo     { get; set; }
        public decimal       PlanchaAncho     { get; set; }
        public decimal MetrosLinealesCorte { get; set; }
        public decimal MetrosLinealesTapacanto { get; set; }
        public List<PlanchaResultado> Planchas { get; set; } = new();
    }

    public class PlanchaResultado
    {
        public int    Numero           { get; set; }
        public decimal PorcentajeUso   { get; set; }
        public List<PiezaUbicada> Piezas { get; set; } = new();
        public List<SobranteInfo> Sobrantes { get; set; } = new();
    }

    public class PiezaUbicada
    {
        public string  Nombre    { get; set; } = string.Empty;
        public decimal X         { get; set; }
        public decimal Y         { get; set; }
        public decimal Largo     { get; set; }
        public decimal Ancho     { get; set; }
        public bool    Rotada    { get; set; }
        public bool    TapacantoL1 { get; set; }
        public bool    TapacantoL2 { get; set; }
        public bool    TapacantoA1 { get; set; }
        public bool    TapacantoA2 { get; set; }
    }

    // ── Espacio libre interno del algoritmo ───────────────────────
    public class EspacioLibre
    {
        public decimal X      { get; set; }
        public decimal Y      { get; set; }
        public decimal Largo  { get; set; }
        public decimal Ancho  { get; set; }
    }
}
