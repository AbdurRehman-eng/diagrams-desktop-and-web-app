namespace DiagramsDesktop.Core.Models
{
    public class ConnectionTypeLookupDto
    {
        public string? SourceDeviceType { get; set; }
        public string? DestinationDeviceType { get; set; }
        public string? PossibleConnections { get; set; }
        public int MaxConnections { get; set; }
    }
}
