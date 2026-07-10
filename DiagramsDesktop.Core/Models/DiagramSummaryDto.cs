using System;

namespace DiagramsDesktop.Core.Models
{
    public class DiagramSummaryDto
    {
        public string? DiagramID { get; set; }
        public string? DiagramName { get; set; }
        public int DiagramVersion { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }
    }
}
