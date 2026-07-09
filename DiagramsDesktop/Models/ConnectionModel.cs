namespace DiagramsDesktop.Models;

public class ConnectionModel
{
    public string ConnectionID { get; set; } = "";
    public string DiagramID { get; set; } = "";
    public string SourceItemID { get; set; } = "";
    public string SourceItemKind { get; set; } = "";
    public string DestinationItemID { get; set; } = "";
    public string DestinationItemKind { get; set; } = "";
    public string ConnectionType { get; set; } = "";
    public int IsDeleted { get; set; } = 0;
}
