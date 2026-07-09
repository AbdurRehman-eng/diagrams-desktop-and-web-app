using System.Collections.Generic;

namespace DiagramsDesktop.Models;

public class DiagramModel
{
    public string DiagramID { get; set; } = "";
    public string DiagramName { get; set; } = "Untitled Diagram";
    public int DiagramVersion { get; set; } = 1;
    public string CanvasID { get; set; } = "";
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    public int IsDeleted { get; set; } = 0;
    
    public CanvasModel Canvas { get; set; } = new CanvasModel();
    public List<ShapeModel> Shapes { get; set; } = new List<ShapeModel>();
    public List<ConnectionModel> Connections { get; set; } = new List<ConnectionModel>();
    public List<CircleOnContainerModel> CircleOnContainers { get; set; } = new List<CircleOnContainerModel>();
}
