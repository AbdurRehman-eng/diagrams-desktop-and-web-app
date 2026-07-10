using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Models;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagramCanvasController : ControllerBase
    {
        private readonly IDiagramCanvasService _service;

        public DiagramCanvasController(IDiagramCanvasService service)
        {
            _service = service;
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveDiagram([FromBody] DiagramCanvasDto dto)
        {
            try
            {
                await _service.SaveDiagramAsync(dto);
                return Ok(new { DiagramID = dto.DiagramID, Version = dto.DiagramVersion, Success = true });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDiagram(string id)
        {
            var diagram = await _service.GetDiagramAsync(id);
            if (diagram == null)
            {
                return NotFound(new { Success = false, Message = $"Diagram with ID {id} not found." });
            }
            return Ok(diagram);
        }

        [HttpGet("list")]
        public async Task<IActionResult> ListDiagrams()
        {
            var list = await _service.ListDiagramsAsync();
            return Ok(list);
        }
    }
}
