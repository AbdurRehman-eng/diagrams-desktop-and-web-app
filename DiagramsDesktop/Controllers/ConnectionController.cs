using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop.Controllers
{
    [ApiController]
    [Route("api/connections")]
    public class ConnectionController : ControllerBase
    {
        private readonly IConnectionService _service;

        public ConnectionController(IConnectionService service)
        {
            _service = service;
        }

        [HttpGet("lookups")]
        public async Task<IActionResult> GetLookups()
        {
            try
            {
                var lookups = await _service.GetConnectionTypeLookupsAsync();
                return Ok(lookups);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("defaults")]
        public async Task<IActionResult> GetDefaults()
        {
            try
            {
                var defaults = await _service.GetConnectionStyleDefaultsAsync();
                return Ok(defaults);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}
