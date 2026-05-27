using System.Text.Json.Serialization;

namespace InsutriasAP.DTOs
{
    // ── Request ──────────────────────────────────────────────────────────────

    public class AdvancedOptimizeRequest
    {
        public float  BoardW     { get; set; }
        public float  BoardH     { get; set; }
        public float  Kerf       { get; set; } = 3f;
        public float  TimeLimit  { get; set; } = 45f;
        public List<AdvancedPieceRequest> Pieces { get; set; } = new();
    }

    public class AdvancedPieceRequest
    {
        public string Id            { get; set; } = "";
        public string Name          { get; set; } = "";
        public float  Width         { get; set; }
        public float  Height        { get; set; }
        public int    Quantity      { get; set; } = 1;
        public bool   CanRotate     { get; set; } = true;
        public bool   GrainDirection { get; set; } = false;
        public bool   EdgeTop       { get; set; } = false;
        public bool   EdgeBottom    { get; set; } = false;
        public bool   EdgeLeft      { get; set; } = false;
        public bool   EdgeRight     { get; set; } = false;
        public int    EdgeFlags     { get; set; } = 0;
    }

    // ── Response ─────────────────────────────────────────────────────────────

    public class AdvancedOptimizeResponse
    {
        public int    BoardsUsed        { get; set; }
        public float  EfficiencyPercent { get; set; }
        public float  WastePercent      { get; set; }
        public double AreaUsed          { get; set; }
        public double AreaTotal         { get; set; }
        public double AreaWasted        { get; set; }
        public int    TotalCuts         { get; set; }
        public double CutMeters         { get; set; }
        public int    ReusableOffcuts   { get; set; }
        public double FragmentationIndex { get; set; }
        public double Score             { get; set; }
        public string Algorithm         { get; set; } = "";
        public int    PassesRun         { get; set; }
        public int    TimeMs            { get; set; }
        public List<AdvancedBoardResult> Boards { get; set; } = new();
    }

    public class AdvancedBoardResult
    {
        public int    Number     { get; set; }
        public float  Efficiency { get; set; }
        public double AreaUsed   { get; set; }
        public List<AdvancedPlacedPiece> Pieces     { get; set; } = new();
        public List<AdvancedFreeSpace>   FreeSpaces { get; set; } = new();
        public List<AdvancedCutLine>     CutLines   { get; set; } = new();
    }

    public class AdvancedPlacedPiece
    {
        public string PieceId       { get; set; } = "";
        public string Name          { get; set; } = "";
        public double X             { get; set; }
        public double Y             { get; set; }
        public double Width         { get; set; }
        public double Height        { get; set; }
        public bool   Rotated       { get; set; }
        public double OriginalWidth  { get; set; }
        public double OriginalHeight { get; set; }
        public bool   EdgeTop       { get; set; }
        public bool   EdgeBottom    { get; set; }
        public bool   EdgeLeft      { get; set; }
        public bool   EdgeRight     { get; set; }
    }

    public class AdvancedFreeSpace
    {
        public double X      { get; set; }
        public double Y      { get; set; }
        public double Width  { get; set; }
        public double Height { get; set; }
        public double Area   { get; set; }
    }

    public class AdvancedCutLine
    {
        public double X1        { get; set; }
        public double Y1        { get; set; }
        public double X2        { get; set; }
        public double Y2        { get; set; }
        public string Direction { get; set; } = "";
        public int    Sequence  { get; set; }
        public double Length    { get; set; }
    }

    // ── Python internal DTOs ─────────────────────────────────────────────────

    internal class PyAdvRequest
    {
        [JsonPropertyName("board_w")]    public float BoardW    { get; set; }
        [JsonPropertyName("board_h")]    public float BoardH    { get; set; }
        [JsonPropertyName("kerf")]       public float Kerf      { get; set; }
        [JsonPropertyName("time_limit")] public float TimeLimit { get; set; }
        [JsonPropertyName("pieces")]     public List<PyAdvPiece> Pieces { get; set; } = new();
    }

    internal class PyAdvPiece
    {
        [JsonPropertyName("id")]             public string Id            { get; set; } = "";
        [JsonPropertyName("name")]           public string Name          { get; set; } = "";
        [JsonPropertyName("width")]          public float  Width         { get; set; }
        [JsonPropertyName("height")]         public float  Height        { get; set; }
        [JsonPropertyName("quantity")]       public int    Quantity      { get; set; }
        [JsonPropertyName("can_rotate")]     public bool   CanRotate     { get; set; }
        [JsonPropertyName("grain_direction")] public bool  GrainDirection { get; set; }
        [JsonPropertyName("edge_top")]       public bool   EdgeTop       { get; set; }
        [JsonPropertyName("edge_bottom")]    public bool   EdgeBottom    { get; set; }
        [JsonPropertyName("edge_left")]      public bool   EdgeLeft      { get; set; }
        [JsonPropertyName("edge_right")]     public bool   EdgeRight     { get; set; }
        [JsonPropertyName("edge_flags")]     public int    EdgeFlags     { get; set; }
    }

    internal class PyAdvResponse
    {
        [JsonPropertyName("boards_used")]         public int    BoardsUsed        { get; set; }
        [JsonPropertyName("efficiency_percent")]  public float  EfficiencyPercent { get; set; }
        [JsonPropertyName("waste_percent")]       public float  WastePercent      { get; set; }
        [JsonPropertyName("area_used")]           public double AreaUsed          { get; set; }
        [JsonPropertyName("area_total")]          public double AreaTotal         { get; set; }
        [JsonPropertyName("area_wasted")]         public double AreaWasted        { get; set; }
        [JsonPropertyName("total_cuts")]          public int    TotalCuts         { get; set; }
        [JsonPropertyName("cut_meters")]          public double CutMeters         { get; set; }
        [JsonPropertyName("reusable_offcuts")]    public int    ReusableOffcuts   { get; set; }
        [JsonPropertyName("fragmentation_index")] public double FragmentationIndex { get; set; }
        [JsonPropertyName("score")]               public double Score             { get; set; }
        [JsonPropertyName("algorithm")]           public string Algorithm         { get; set; } = "";
        [JsonPropertyName("passes_run")]          public int    PassesRun         { get; set; }
        [JsonPropertyName("time_ms")]             public int    TimeMs            { get; set; }
        [JsonPropertyName("boards")]              public List<PyAdvBoard> Boards  { get; set; } = new();
    }

    internal class PyAdvBoard
    {
        [JsonPropertyName("number")]      public int    Number     { get; set; }
        [JsonPropertyName("efficiency")]  public float  Efficiency { get; set; }
        [JsonPropertyName("area_used")]   public double AreaUsed   { get; set; }
        [JsonPropertyName("pieces")]      public List<PyAdvPlacedPiece> Pieces     { get; set; } = new();
        [JsonPropertyName("free_spaces")] public List<PyAdvFreeSpace>   FreeSpaces { get; set; } = new();
        [JsonPropertyName("cut_lines")]   public List<PyAdvCutLine>     CutLines   { get; set; } = new();
    }

    internal class PyAdvPlacedPiece
    {
        [JsonPropertyName("piece_id")]       public string PieceId       { get; set; } = "";
        [JsonPropertyName("name")]           public string Name          { get; set; } = "";
        [JsonPropertyName("x")]              public double X             { get; set; }
        [JsonPropertyName("y")]              public double Y             { get; set; }
        [JsonPropertyName("width")]          public double Width         { get; set; }
        [JsonPropertyName("height")]         public double Height        { get; set; }
        [JsonPropertyName("rotated")]        public bool   Rotated       { get; set; }
        [JsonPropertyName("original_width")] public double OriginalWidth  { get; set; }
        [JsonPropertyName("original_height")] public double OriginalHeight { get; set; }
        [JsonPropertyName("edge_top")]       public bool   EdgeTop       { get; set; }
        [JsonPropertyName("edge_bottom")]    public bool   EdgeBottom    { get; set; }
        [JsonPropertyName("edge_left")]      public bool   EdgeLeft      { get; set; }
        [JsonPropertyName("edge_right")]     public bool   EdgeRight     { get; set; }
    }

    internal class PyAdvFreeSpace
    {
        [JsonPropertyName("x")]      public double X      { get; set; }
        [JsonPropertyName("y")]      public double Y      { get; set; }
        [JsonPropertyName("width")]  public double Width  { get; set; }
        [JsonPropertyName("height")] public double Height { get; set; }
        [JsonPropertyName("area")]   public double Area   { get; set; }
    }

    internal class PyAdvCutLine
    {
        [JsonPropertyName("x1")]        public double X1        { get; set; }
        [JsonPropertyName("y1")]        public double Y1        { get; set; }
        [JsonPropertyName("x2")]        public double X2        { get; set; }
        [JsonPropertyName("y2")]        public double Y2        { get; set; }
        [JsonPropertyName("direction")] public string Direction { get; set; } = "";
        [JsonPropertyName("sequence")]  public int    Sequence  { get; set; }
        [JsonPropertyName("length")]    public double Length    { get; set; }
    }
}
