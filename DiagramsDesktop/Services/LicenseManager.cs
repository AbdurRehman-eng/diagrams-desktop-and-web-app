using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Maui.Storage;
using DiagramsDesktop.Core.Models;

namespace DiagramsDesktop.Services;

public interface ILicenseManager
{
    bool IsActivated { get; }
    bool IsViolating { get; }
    string ViolationType { get; }
    string ViolationTitle { get; }
    string ViolationMessage { get; }
    string ProductKey { get; }
    string ProductCode { get; }
    LatestAdV1Response? LatestAd { get; }

    Task InitializeAsync();
    Task<RegisterDeviceV1Response> ActivateAsync(string productKey);
    Task<DeactivateDeviceV1Response> DeactivateAsync();
    Task<CheckUpdateV1Response> CheckUpdateAsync();
    Task<LatestAdV1Response> FetchLatestAdAsync();
}

public class LicenseManager : ILicenseManager
{
    private const string PrefProductKey = "GML_Licensing_ProductKey";
    private const string PrefProductCode = "GML_Licensing_ProductCode";
    private const string PrefLastValidated = "GML_Licensing_LastValidatedAt";
    private const string PrefValidationInterval = "GML_Licensing_ValidationInterval";
    private const string PrefHeartbeatInterval = "GML_Licensing_HeartbeatInterval";
    private const string PrefOfflineGracePeriod = "GML_Licensing_OfflineGracePeriod";
    private const string PrefIsActivated = "GML_Licensing_IsActivated";

    private readonly ILicenseClient _client;
    private readonly IHardwareInfoProvider _hardwareProvider;
    private readonly string _serverUrl = "http://localhost:5080"; // Default remote website URL
    private readonly string _token = "GML-ACTIVE-TEST-KEY-1234"; // Default developer bypass key

    private CancellationTokenSource? _loopCts;
    private Task? _heartbeatTask;
    private Task? _validationTask;

    public bool IsActivated { get; private set; }
    public bool IsViolating { get; private set; }
    public string ViolationType { get; private set; } = string.Empty;
    public string ViolationTitle { get; private set; } = string.Empty;
    public string ViolationMessage { get; private set; } = string.Empty;
    public LatestAdV1Response? LatestAd { get; private set; }

    public string ProductKey => Preferences.Default.Get(PrefProductKey, string.Empty);
    public string ProductCode => "GML-DIAGRAMS"; // This app's product identifier
    public string AppVersion => "1.0.0";
    public string DeviceName => Environment.MachineName;

    public LicenseManager(ILicenseClient client, IHardwareInfoProvider hardwareProvider)
    {
        _client = client;
        _hardwareProvider = hardwareProvider;

        // Try getting remote server configuration from environment variables if defined
        var envUrl = Environment.GetEnvironmentVariable("GML_LICENSING_SERVER_URL");
        if (!string.IsNullOrWhiteSpace(envUrl))
        {
            _serverUrl = envUrl;
        }

        var envToken = Environment.GetEnvironmentVariable("GML_LICENSING_API_TOKEN");
        if (!string.IsNullOrWhiteSpace(envToken))
        {
            _token = envToken;
        }

        IsActivated = Preferences.Default.Get(PrefIsActivated, false);
    }

    public async Task InitializeAsync()
    {
        MauiProgram.LogToFile($"[LicenseManager] Initializing. IsActivated in prefs: {IsActivated}");

        if (!string.IsNullOrWhiteSpace(ProductKey))
        {
            try
            {
                // Verify license on startup
                await RunRuntimeValidationAsync();
            }
            catch (Exception ex)
            {
                MauiProgram.LogToFile($"[LicenseManager] Startup validation failed: {ex.Message}. Applying offline checks.");
                ApplyOfflineGraceChecks();
            }

            if (IsActivated && !IsViolating)
            {
                StartBackgroundLoops();
            }
        }
        else
        {
            IsActivated = false;
            Preferences.Default.Set(PrefIsActivated, false);
        }
    }

    public async Task<RegisterDeviceV1Response> ActivateAsync(string productKey)
    {
        if (string.IsNullOrWhiteSpace(productKey))
        {
            return new RegisterDeviceV1Response { Registered = false, Status = "invalid", Message = "Product key cannot be empty." };
        }

        productKey = productKey.Trim();

        try
        {
            MauiProgram.LogToFile($"[LicenseManager] Activating product key: {productKey}");
            
            // 1. Validate product key
            var valResponse = await _client.ValidateProductKeyAsync(_serverUrl, _token, productKey, ProductCode);
            if (!valResponse.Valid)
            {
                return new RegisterDeviceV1Response
                {
                    Registered = false,
                    Status = valResponse.Status,
                    Message = valResponse.Message
                };
            }

            // 2. Gather hardware information
            var hardware = _hardwareProvider.GetHardwareInfo();

            // 3. Register device
            var regRequest = new RegisterDeviceV1Request
            {
                ProductKey = productKey,
                ProductCode = ProductCode,
                HardwareInfo = hardware,
                DeviceName = DeviceName,
                AppVersion = AppVersion
            };

            var regResponse = await _client.RegisterDeviceAsync(_serverUrl, _token, regRequest);
            if (regResponse.Registered)
            {
                Preferences.Default.Set(PrefProductKey, productKey);
                Preferences.Default.Set(PrefIsActivated, true);
                Preferences.Default.Set(PrefLastValidated, DateTime.UtcNow.Ticks);

                IsActivated = true;
                IsViolating = false;
                ViolationType = string.Empty;
                ViolationTitle = string.Empty;
                ViolationMessage = string.Empty;

                // Sync settings
                await FetchSettingsAsync();

                StartBackgroundLoops();
            }

            return regResponse;
        }
        catch (Exception ex)
        {
            MauiProgram.LogToFile($"[LicenseManager] Activation failed: {ex.Message}");
            return new RegisterDeviceV1Response
            {
                Registered = false,
                Status = "network_error",
                Message = $"Failed to reach licensing server. Please check your internet connection: {ex.Message}"
            };
        }
    }

    public async Task<DeactivateDeviceV1Response> DeactivateAsync()
    {
        var key = ProductKey;
        if (string.IsNullOrWhiteSpace(key))
        {
            ClearLocalActivation();
            return new DeactivateDeviceV1Response { Deactivated = true, Message = "Device already deactivated locally." };
        }

        try
        {
            var hardware = _hardwareProvider.GetHardwareInfo();
            var req = new DeactivateDeviceV1Request
            {
                ProductKey = key,
                HardwareFingerprint = hardware.HardwareFingerprint
            };

            var res = await _client.DeactivateDeviceAsync(_serverUrl, _token, req);
            ClearLocalActivation();
            return res;
        }
        catch (Exception ex)
        {
            MauiProgram.LogToFile($"[LicenseManager] Remote deactivation failed: {ex.Message}. Clearing locally anyway.");
            ClearLocalActivation();
            return new DeactivateDeviceV1Response { Deactivated = true, Message = $"Deactivated locally. Remote error: {ex.Message}" };
        }
    }

    public async Task<CheckUpdateV1Response> CheckUpdateAsync()
    {
        try
        {
            return await _client.CheckUpdateAsync(_serverUrl, _token, ProductCode, AppVersion);
        }
        catch (Exception ex)
        {
            MauiProgram.LogToFile($"[LicenseManager] Check update failed: {ex.Message}");
            return new CheckUpdateV1Response { UpdateAvailable = false, ReleaseNotes = ex.Message };
        }
    }

    public async Task<LatestAdV1Response> FetchLatestAdAsync()
    {
        try
        {
            var ad = await _client.GetLatestAdAsync(_serverUrl, _token, ProductCode);
            LatestAd = ad;
            return ad;
        }
        catch (Exception ex)
        {
            MauiProgram.LogToFile($"[LicenseManager] Fetch ad failed: {ex.Message}");
            return new LatestAdV1Response { HasAd = false };
        }
    }

    private void ClearLocalActivation()
    {
        StopBackgroundLoops();
        Preferences.Default.Remove(PrefProductKey);
        Preferences.Default.Remove(PrefIsActivated);
        Preferences.Default.Remove(PrefLastValidated);

        IsActivated = false;
        IsViolating = false;
        ViolationType = string.Empty;
        ViolationTitle = string.Empty;
        ViolationMessage = string.Empty;
    }

    private async Task FetchSettingsAsync()
    {
        try
        {
            var response = await _client.GetSettingsAsync(_serverUrl, _token, ProductCode);
            if (response.Success && response.Settings != null)
            {
                Preferences.Default.Set(PrefValidationInterval, response.Settings.ValidationIntervalMinutes);
                Preferences.Default.Set(PrefHeartbeatInterval, response.Settings.HeartbeatIntervalMinutes);
                Preferences.Default.Set(PrefOfflineGracePeriod, response.Settings.OfflineGracePeriodDays);
            }
        }
        catch (Exception ex)
        {
            MauiProgram.LogToFile($"[LicenseManager] Fetch settings failed: {ex.Message}");
        }
    }

    private async Task RunRuntimeValidationAsync()
    {
        var hardware = _hardwareProvider.GetHardwareInfo();
        var req = new ValidateRuntimeV1Request
        {
            ProductKey = ProductKey,
            ProductCode = ProductCode,
            HardwareInfo = hardware,
            AppVersion = AppVersion
        };

        var response = await _client.ValidateRuntimeAsync(_serverUrl, _token, req);
        Preferences.Default.Set(PrefLastValidated, DateTime.UtcNow.Ticks);

        if (response.Valid)
        {
            IsViolating = false;
            IsActivated = true;
            ViolationType = string.Empty;
            ViolationTitle = string.Empty;
            ViolationMessage = string.Empty;

            // Sync updated intervals from validation
            Preferences.Default.Set(PrefValidationInterval, response.ValidationIntervalMinutes);
            Preferences.Default.Set(PrefHeartbeatInterval, response.HeartbeatIntervalMinutes);
        }
        else
        {
            IsViolating = true;
            ViolationType = response.Status;
            
            // Get rich violation details
            await FetchViolationDetailsAsync(response.Status);
        }
    }

    private async Task FetchViolationDetailsAsync(string violationType)
    {
        try
        {
            var req = new ViolationMessageV1Request
            {
                ProductKey = ProductKey,
                ProductCode = ProductCode,
                ViolationType = violationType
            };
            var res = await _client.GetViolationMessageAsync(_serverUrl, _token, req);
            ViolationTitle = res.Title;
            ViolationMessage = $"{res.Message}\nSupport: {res.SupportEmail}\nAccount Portal: {res.ResolutionUrl}";
        }
        catch
        {
            // Default generic violation message
            ViolationTitle = "License Violation Detected";
            ViolationMessage = $"Your product key validation failed with status: {violationType}. Please verify your network connection or contact support.";
        }
    }

    private void ApplyOfflineGraceChecks()
    {
        var lastTicks = Preferences.Default.Get(PrefLastValidated, 0L);
        var graceDays = Preferences.Default.Get(PrefOfflineGracePeriod, 7);

        if (lastTicks == 0L)
        {
            // Never successfully validated before — block
            IsViolating = true;
            ViolationType = "offline_validation_required";
            ViolationTitle = "Offline Activation Pending";
            ViolationMessage = "The application requires an initial internet connection to validate your license and cannot be run offline at this time.";
            return;
        }

        var lastValidated = new DateTime(lastTicks, DateTimeKind.Utc);
        var timeSinceValidation = DateTime.UtcNow - lastValidated;

        if (timeSinceValidation.TotalDays > graceDays)
        {
            // Offline grace period exceeded — block
            IsViolating = true;
            ViolationType = "offline_grace_expired";
            ViolationTitle = "Offline Grace Period Expired";
            ViolationMessage = $"The application has been offline for more than the allowed {graceDays} days. Please connect to the internet to perform license validation.";
        }
        else
        {
            // Still within grace period — allow usage but log
            IsViolating = false;
            MauiProgram.LogToFile($"[LicenseManager] Server unreachable. Operating offline under grace period. Days remaining: {graceDays - timeSinceValidation.TotalDays:F1}");
        }
    }

    private void StartBackgroundLoops()
    {
        StopBackgroundLoops();

        _loopCts = new CancellationTokenSource();
        var token = _loopCts.Token;

        var heartbeatMin = Preferences.Default.Get(PrefHeartbeatInterval, 15);
        var validationMin = Preferences.Default.Get(PrefValidationInterval, 60);

        MauiProgram.LogToFile($"[LicenseManager] Starting background timers. Heartbeat: {heartbeatMin}m, Validation: {validationMin}m");

        _heartbeatTask = Task.Run(() => HeartbeatLoopAsync(TimeSpan.FromMinutes(heartbeatMin), token), token);
        _validationTask = Task.Run(() => ValidationLoopAsync(TimeSpan.FromMinutes(validationMin), token), token);
    }

    private void StopBackgroundLoops()
    {
        if (_loopCts != null)
        {
            _loopCts.Cancel();
            _loopCts.Dispose();
            _loopCts = null;
        }
        _heartbeatTask = null;
        _validationTask = null;
    }

    private async Task HeartbeatLoopAsync(TimeSpan interval, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                // Wait for interval
                await Task.Delay(interval, cancellationToken);

                if (IsActivated && !IsViolating)
                {
                    var hardware = _hardwareProvider.GetHardwareInfo();
                    var req = new HeartbeatV1Request
                    {
                        ProductKey = ProductKey,
                        HardwareFingerprint = hardware.HardwareFingerprint,
                        AppVersion = AppVersion
                    };
                    MauiProgram.LogToFile("[LicenseManager] Sending periodic heartbeat...");
                    var res = await _client.SendHeartbeatAsync(_serverUrl, _token, req);
                    MauiProgram.LogToFile($"[LicenseManager] Heartbeat response: acknowledged={res.Acknowledged}, status={res.Status}");
                }
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                MauiProgram.LogToFile($"[LicenseManager] Heartbeat loop error: {ex.Message}");
            }
        }
    }

    private async Task ValidationLoopAsync(TimeSpan interval, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            try
            {
                // Wait for interval
                await Task.Delay(interval, cancellationToken);

                if (IsActivated)
                {
                    MauiProgram.LogToFile("[LicenseManager] Running periodic runtime validation...");
                    await RunRuntimeValidationAsync();
                    MauiProgram.LogToFile($"[LicenseManager] Validation result: IsViolating={IsViolating}");
                }
            }
            catch (TaskCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                MauiProgram.LogToFile($"[LicenseManager] Validation loop error: {ex.Message}. Falling back to offline grace checks.");
                ApplyOfflineGraceChecks();
            }
        }
    }
}
