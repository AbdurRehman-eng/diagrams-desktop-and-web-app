using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Models;

namespace DiagramsDesktop.Services;

public interface ILicenseClient
{
    Task<ValidateProductKeyV1Response> ValidateProductKeyAsync(string serverUrl, string token, string productKey, string productCode);
    Task<RegisterDeviceV1Response> RegisterDeviceAsync(string serverUrl, string token, RegisterDeviceV1Request request);
    Task<ValidateRuntimeV1Response> ValidateRuntimeAsync(string serverUrl, string token, ValidateRuntimeV1Request request);
    Task<DesktopSettingsV1Response> GetSettingsAsync(string serverUrl, string token, string productCode);
    Task<HeartbeatV1Response> SendHeartbeatAsync(string serverUrl, string token, HeartbeatV1Request request);
    Task<LatestAdV1Response> GetLatestAdAsync(string serverUrl, string token, string productCode);
    Task<ViolationMessageV1Response> GetViolationMessageAsync(string serverUrl, string token, ViolationMessageV1Request request);
    Task<CheckUpdateV1Response> CheckUpdateAsync(string serverUrl, string token, string productCode, string currentVersion);
    Task<DeactivateDeviceV1Response> DeactivateDeviceAsync(string serverUrl, string token, DeactivateDeviceV1Request request);
    Task<CheckExpiryV1Response> CheckExpiryAsync(string serverUrl, string token, CheckExpiryV1Request request);
}

public class LicenseClient : ILicenseClient
{
    private readonly HttpClient _httpClient;

    public LicenseClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ValidateProductKeyV1Response> ValidateProductKeyAsync(string serverUrl, string token, string productKey, string productCode)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/license/validate-product-key";
        var payload = new ValidateProductKeyV1Request { ProductKey = productKey, ProductCode = productCode };
        return await SendPostAsync<ValidateProductKeyV1Request, ValidateProductKeyV1Response>(url, token, payload);
    }

    public async Task<RegisterDeviceV1Response> RegisterDeviceAsync(string serverUrl, string token, RegisterDeviceV1Request request)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/device/register";
        return await SendPostAsync<RegisterDeviceV1Request, RegisterDeviceV1Response>(url, token, request);
    }

    public async Task<ValidateRuntimeV1Response> ValidateRuntimeAsync(string serverUrl, string token, ValidateRuntimeV1Request request)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/license/validate-runtime";
        return await SendPostAsync<ValidateRuntimeV1Request, ValidateRuntimeV1Response>(url, token, request);
    }

    public async Task<DesktopSettingsV1Response> GetSettingsAsync(string serverUrl, string token, string productCode)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/settings?product_code={Uri.EscapeDataString(productCode)}";
        return await SendGetAsync<DesktopSettingsV1Response>(url, token);
    }

    public async Task<HeartbeatV1Response> SendHeartbeatAsync(string serverUrl, string token, HeartbeatV1Request request)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/license/heartbeat";
        return await SendPostAsync<HeartbeatV1Request, HeartbeatV1Response>(url, token, request);
    }

    public async Task<LatestAdV1Response> GetLatestAdAsync(string serverUrl, string token, string productCode)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/advertisements/latest?product_code={Uri.EscapeDataString(productCode)}";
        return await SendGetAsync<LatestAdV1Response>(url, token);
    }

    public async Task<ViolationMessageV1Response> GetViolationMessageAsync(string serverUrl, string token, ViolationMessageV1Request request)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/license/violation-message";
        return await SendPostAsync<ViolationMessageV1Request, ViolationMessageV1Response>(url, token, request);
    }

    public async Task<CheckUpdateV1Response> CheckUpdateAsync(string serverUrl, string token, string productCode, string currentVersion)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/app/check-update?product_code={Uri.EscapeDataString(productCode)}&current_version={Uri.EscapeDataString(currentVersion)}";
        return await SendGetAsync<CheckUpdateV1Response>(url, token);
    }

    public async Task<DeactivateDeviceV1Response> DeactivateDeviceAsync(string serverUrl, string token, DeactivateDeviceV1Request request)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/device/deactivate";
        return await SendPostAsync<DeactivateDeviceV1Request, DeactivateDeviceV1Response>(url, token, request);
    }

    public async Task<CheckExpiryV1Response> CheckExpiryAsync(string serverUrl, string token, CheckExpiryV1Request request)
    {
        var url = $"{serverUrl.TrimEnd('/')}/api/desktop/v1/license/check-expiry";
        return await SendPostAsync<CheckExpiryV1Request, CheckExpiryV1Response>(url, token, request);
    }

    private async Task<TResponse> SendPostAsync<TRequest, TResponse>(string url, string token, TRequest payload) where TResponse : new()
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("X-GML-Desktop-Token", token);
            
            var json = JsonSerializer.Serialize(payload);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Server returned status code {response.StatusCode}: {errorMsg}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TResponse>(responseJson) ?? new TResponse();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[LicenseClient] POST error on {url}: {ex.Message}");
            throw;
        }
    }

    private async Task<TResponse> SendGetAsync<TResponse>(string url, string token) where TResponse : new()
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("X-GML-Desktop-Token", token);

            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorMsg = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Server returned status code {response.StatusCode}: {errorMsg}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TResponse>(responseJson) ?? new TResponse();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[LicenseClient] GET error on {url}: {ex.Message}");
            throw;
        }
    }
}
