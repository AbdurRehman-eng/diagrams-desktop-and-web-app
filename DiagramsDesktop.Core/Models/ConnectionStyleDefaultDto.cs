namespace DiagramsDesktop.Core.Models
{
    public class ConnectionStyleDefaultDto
    {
        public string? ConnectionType { get; set; }
        public string? StrokeColor { get; set; }
        public string? LineType { get; set; }
        public double LineWidth { get; set; }
        public bool DrawArrows { get; set; }
        public double TargetRadiusPaddingRatio { get; set; }
    }
}
