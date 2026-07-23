using System;
using System.Text.Json.Serialization;

namespace DiagramsDesktop.Core.Models;

public sealed class HardwareInfoV1
{
    [JsonPropertyName("system_uuid")]
    public string SystemUuid { get; set; } = string.Empty;

    [JsonPropertyName("motherboard_serial")]
    public string MotherboardSerial { get; set; } = string.Empty;

    [JsonPropertyName("bios_serial")]
    public string BiosSerial { get; set; } = string.Empty;

    [JsonPropertyName("cpu_id")]
    public string CpuId { get; set; } = string.Empty;

    [JsonPropertyName("primary_disk_serial")]
    public string PrimaryDiskSerial { get; set; } = string.Empty;

    [JsonPropertyName("os_machine_guid")]
    public string OsMachineGuid { get; set; } = string.Empty;

    [JsonPropertyName("mac_primary")]
    public string MacPrimary { get; set; } = string.Empty;

    [JsonPropertyName("hardware_fingerprint")]
    public string HardwareFingerprint { get; set; } = string.Empty;
}

public sealed class ValidateProductKeyV1Request
{
    [JsonPropertyName("product_key")]
    public string ProductKey { get; set; } = string.Empty;

    [JsonPropertyName("product_code")]
    public string ProductCode { get; set; } = string.Empty;
}

public sealed class ValidateProductKeyV1Response
{
    [JsonPropertyName("valid")]
    public bool Valid { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("product_code")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("product_name")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public sealed class RegisterDeviceV1Request
{
    [JsonPropertyName("product_key")]
    public string ProductKey { get; set; } = string.Empty;

    [JsonPropertyName("product_code")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("hardware_info")]
    public HardwareInfoV1? HardwareInfo { get; set; }

    [JsonPropertyName("device_name")]
    public string? DeviceName { get; set; }

    [JsonPropertyName("app_version")]
    public string? AppVersion { get; set; }
}

public sealed class RegisterDeviceV1Response
{
    [JsonPropertyName("registered")]
    public bool Registered { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("device_id")]
    public string DeviceId { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public sealed class ValidateRuntimeV1Request
{
    [JsonPropertyName("product_key")]
    public string ProductKey { get; set; } = string.Empty;

    [JsonPropertyName("product_code")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("hardware_info")]
    public HardwareInfoV1? HardwareInfo { get; set; }

    [JsonPropertyName("app_version")]
    public string? AppVersion { get; set; }
}

public sealed class ValidateRuntimeV1Response
{
    [JsonPropertyName("valid")]
    public bool Valid { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("action")]
    public string Action { get; set; } = "allow"; // "allow", "block", "warn", "support"

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("validation_interval_minutes")]
    public int ValidationIntervalMinutes { get; set; } = 60;

    [JsonPropertyName("heartbeat_interval_minutes")]
    public int HeartbeatIntervalMinutes { get; set; } = 15;
}

public sealed class DesktopSettingsV1Response
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("product_code")]
    public string ProductCode { get; set; } = string.Empty;

    [JsonPropertyName("settings")]
    public DesktopSettingsValues Settings { get; set; } = new();
}

public sealed class DesktopSettingsValues
{
    [JsonPropertyName("validation_interval_minutes")]
    public int ValidationIntervalMinutes { get; set; } = 60;

    [JsonPropertyName("heartbeat_interval_minutes")]
    public int HeartbeatIntervalMinutes { get; set; } = 15;

    [JsonPropertyName("ad_check_interval_minutes")]
    public int AdCheckIntervalMinutes { get; set; } = 120;

    [JsonPropertyName("offline_grace_period_days")]
    public int OfflineGracePeriodDays { get; set; } = 7;
}

public sealed class HeartbeatV1Request
{
    [JsonPropertyName("product_key")]
    public string ProductKey { get; set; } = string.Empty;

    [JsonPropertyName("hardware_fingerprint")]
    public string HardwareFingerprint { get; set; } = string.Empty;

    [JsonPropertyName("app_version")]
    public string? AppVersion { get; set; }
}

public sealed class HeartbeatV1Response
{
    [JsonPropertyName("acknowledged")]
    public bool Acknowledged { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public sealed class LatestAdV1Response
{
    [JsonPropertyName("has_ad")]
    public bool HasAd { get; set; }

    [JsonPropertyName("ad_id")]
    public int? AdId { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }

    [JsonPropertyName("click_url")]
    public string? ClickUrl { get; set; }

    [JsonPropertyName("display_duration_seconds")]
    public int DisplayDurationSeconds { get; set; } = 10;

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }
}

public sealed class ViolationMessageV1Request
{
    [JsonPropertyName("product_key")]
    public string? ProductKey { get; set; }

    [JsonPropertyName("product_code")]
    public string? ProductCode { get; set; }

    [JsonPropertyName("violation_type")]
    public string ViolationType { get; set; } = string.Empty; // "hardware_mismatch", "seat_limit_exceeded", "inactive", "expired"
}

public sealed class ViolationMessageV1Response
{
    [JsonPropertyName("violation_type")]
    public string ViolationType { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("support_email")]
    public string SupportEmail { get; set; } = "support@grademylabs.com";

    [JsonPropertyName("resolution_url")]
    public string ResolutionUrl { get; set; } = "https://grademylabs.com/account";
}

public sealed class CheckUpdateV1Response
{
    [JsonPropertyName("update_available")]
    public bool UpdateAvailable { get; set; }

    [JsonPropertyName("latest_version")]
    public string LatestVersion { get; set; } = string.Empty;

    [JsonPropertyName("release_notes")]
    public string? ReleaseNotes { get; set; }

    [JsonPropertyName("download_url")]
    public string? DownloadUrl { get; set; }

    [JsonPropertyName("is_mandatory")]
    public bool IsMandatory { get; set; }
}

public sealed class DeactivateDeviceV1Request
{
    [JsonPropertyName("product_key")]
    public string ProductKey { get; set; } = string.Empty;

    [JsonPropertyName("hardware_fingerprint")]
    public string HardwareFingerprint { get; set; } = string.Empty;
}

public sealed class DeactivateDeviceV1Response
{
    [JsonPropertyName("deactivated")]
    public bool Deactivated { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public sealed class CheckExpiryV1Request
{
    [JsonPropertyName("product_key")]
    public string ProductKey { get; set; } = string.Empty;

    [JsonPropertyName("product_code")]
    public string ProductCode { get; set; } = string.Empty;
}

public sealed class CheckExpiryV1Response
{
    [JsonPropertyName("is_expired")]
    public bool IsExpired { get; set; }

    [JsonPropertyName("expiry_date")]
    public DateTime? ExpiryDate { get; set; }

    [JsonPropertyName("days_remaining")]
    public int DaysRemaining { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}
