using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Models;
using DiagramsDesktop.Services;

namespace DiagramsDesktop.Controllers;

[ApiController]
[Route("api/credentials")]
public class CredentialController : ControllerBase
{
    private readonly ICredentialService _credentialService;

    public CredentialController(ICredentialService credentialService)
    {
        _credentialService = credentialService;
    }

    [HttpGet("{provider}/list")]
    public async Task<IActionResult> ListCredentials(string provider)
    {
        try
        {
            var list = await _credentialService.ListCredentialsAsync(provider);
            return Ok(list);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveCredential([FromBody] CredentialSaveRequest request)
    {
        try
        {
            var res = await _credentialService.SaveCredentialAsync(request);
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCredential(string id)
    {
        try
        {
            await _credentialService.DeleteCredentialAsync(id);
            return Ok(new { Success = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    public class GcpImportPayload
    {
        public string JsonContent { get; set; } = string.Empty;
    }

    [HttpPost("gcp/import-json")]
    public IActionResult ImportGcpJson([FromBody] GcpImportPayload payload)
    {
        if (payload == null || string.IsNullOrWhiteSpace(payload.JsonContent))
        {
            return BadRequest(new { Success = false, Message = "JSON content is required." });
        }

        try
        {
            var res = _credentialService.ParseGcpJson(payload.JsonContent);
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [HttpPost("ui/open")]
    public IActionResult OpenWindow()
    {
        Microsoft.Maui.ApplicationModel.MainThread.BeginInvokeOnMainThread(() =>
        {
            try
            {
                var newWindow = new Microsoft.Maui.Controls.Window(new CredentialsPage());
                Microsoft.Maui.Controls.Application.Current?.OpenWindow(newWindow);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[CredentialController] Failed to open native credentials window: {ex.Message}");
            }
        });
        return Ok(new { Success = true });
    }
}
