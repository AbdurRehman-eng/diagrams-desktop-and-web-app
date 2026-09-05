using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using DiagramsDesktop.Services;

namespace DiagramsDesktop.Controllers;

[ApiController]
[Route("api/license")]
public class LicenseController : ControllerBase
{
    private readonly ILicenseManager _licenseManager;

    public LicenseController(ILicenseManager licenseManager)
    {
        _licenseManager = licenseManager;
    }

    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            isActivated = _licenseManager.IsActivated,
            isViolating = _licenseManager.IsViolating,
            violationType = _licenseManager.ViolationType,
            violationTitle = _licenseManager.ViolationTitle,
            violationMessage = _licenseManager.ViolationMessage,
            productKey = _licenseManager.ProductKey,
            productCode = _licenseManager.ProductCode,
            latestAd = _licenseManager.LatestAd,
            basePlan = _licenseManager.BasePlan,
            effectivePlan = _licenseManager.EffectivePlan,
            trialActive = _licenseManager.TrialActive,
            trialEndDate = _licenseManager.TrialEndDate,
            entitlements = _licenseManager.Entitlements,
            isOffline = _licenseManager.IsOffline,
            lastValidatedAt = _licenseManager.LastValidatedAt,
            offlineGracePeriodDays = _licenseManager.OfflineGracePeriodDays
        });
    }

    public class ActivatePayload
    {
        public string ProductKey { get; set; } = string.Empty;
    }

    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] ActivatePayload payload)
    {
        if (payload == null || string.IsNullOrWhiteSpace(payload.ProductKey))
        {
            return BadRequest(new { Success = false, Message = "Product key is required." });
        }

        try
        {
            var res = await _licenseManager.ActivateAsync(payload.ProductKey);
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [HttpPost("deactivate")]
    public async Task<IActionResult> Deactivate()
    {
        try
        {
            var res = await _licenseManager.DeactivateAsync();
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("ad")]
    public async Task<IActionResult> GetAd()
    {
        try
        {
            var res = await _licenseManager.FetchLatestAdAsync();
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }

    [HttpGet("update")]
    public async Task<IActionResult> CheckUpdate()
    {
        try
        {
            var res = await _licenseManager.CheckUpdateAsync();
            return Ok(res);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Success = false, Message = ex.Message });
        }
    }
}
