using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using DiagramsDesktop.Services;

namespace DiagramsDesktop.Filters;

public class LocalLicenseAuthorizationFilter : IAsyncActionFilter
{
    private readonly ILicenseManager _licenseManager;

    public LocalLicenseAuthorizationFilter(ILicenseManager licenseManager)
    {
        _licenseManager = licenseManager;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var path = context.HttpContext.Request.Path.Value ?? string.Empty;

        // Bypass authorization filter for license endpoints so activation and checks can occur
        if (path.Contains("/api/license", StringComparison.OrdinalIgnoreCase))
        {
            await next();
            return;
        }

        // Block all other API operations (like saving or listing diagrams) if unactivated or violating
        if (!_licenseManager.IsActivated || _licenseManager.IsViolating)
        {
            var msg = "Product key activation is required to use this application.";
            if (_licenseManager.IsViolating)
            {
                msg = $"{_licenseManager.ViolationTitle}: {_licenseManager.ViolationMessage}";
            }

            context.Result = new ObjectResult(new
            {
                Success = false,
                Message = $"License Violation: {msg}"
            })
            {
                StatusCode = 403
            };
            return;
        }

        await next();
    }
}
