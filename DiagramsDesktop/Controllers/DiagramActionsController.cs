using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiagramActionsController : ControllerBase
    {
        private readonly IDiagramActionService _actionService;

        public DiagramActionsController(IDiagramActionService actionService)
        {
            _actionService = actionService;
        }

        public class SaveTempPayload
        {
            public string DiagramID { get; set; } = string.Empty;
            public string ActionsText { get; set; } = string.Empty;
        }

        [HttpPost("temp/save")]
        public async Task<IActionResult> SaveTempActions([FromBody] SaveTempPayload payload)
        {
            if (payload == null || string.IsNullOrWhiteSpace(payload.DiagramID))
            {
                return BadRequest(new { Success = false, Message = "Diagram ID is required." });
            }

            try
            {
                await _actionService.SaveTempActionsAsync(payload.DiagramID, payload.ActionsText);
                return Ok(new { Success = true });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("temp/read/{diagramId}")]
        public async Task<IActionResult> ReadTempActions(string diagramId)
        {
            if (string.IsNullOrWhiteSpace(diagramId))
            {
                return BadRequest(new { Success = false, Message = "Diagram ID is required." });
            }

            try
            {
                var text = await _actionService.ReadTempActionsAsync(diagramId);
                return Ok(new { Success = true, ActionsText = text });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpDelete("temp/delete/{diagramId}")]
        public async Task<IActionResult> DeleteTempActions(string diagramId)
        {
            if (string.IsNullOrWhiteSpace(diagramId))
            {
                return BadRequest(new { Success = false, Message = "Diagram ID is required." });
            }

            try
            {
                await _actionService.DeleteTempActionsAsync(diagramId);
                return Ok(new { Success = true });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        public class CommitPayload
        {
            public string DiagramID { get; set; } = string.Empty;
        }

        [HttpPost("commit")]
        public async Task<IActionResult> CommitActions([FromBody] CommitPayload payload)
        {
            if (payload == null || string.IsNullOrWhiteSpace(payload.DiagramID))
            {
                return BadRequest(new { Success = false, Message = "Diagram ID is required." });
            }

            try
            {
                var result = await _actionService.CommitActionsAsync(payload.DiagramID, "LocalUser");
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            try
            {
                var logs = await _actionService.GetAuditLogsAsync();
                return Ok(logs);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}
