using System;
using System.Text.Json.Serialization;

namespace DiagramsDesktop.Core.Models;

public sealed class CredentialDto
{
    [JsonPropertyName("credential_id")]
    public string CredentialId { get; set; } = string.Empty;

    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty; // AWS, Azure, GCP, VMwareVCenter

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("identifier1")]
    public string? Identifier1 { get; set; } // AWS: AccessKey, Azure: ClientId, GCP: ProjectId, VMware: ServerAddress

    [JsonPropertyName("identifier2")]
    public string? Identifier2 { get; set; } // Azure: TenantId, GCP: ServiceAccountEmail, VMware: Username

    [JsonPropertyName("identifier3")]
    public string? Identifier3 { get; set; } // Azure: SubscriptionId, GCP: PrivateKeyId

    [JsonPropertyName("identifier4")]
    public string? Identifier4 { get; set; } // Azure: SecretId

    [JsonPropertyName("target_name")]
    public string TargetName { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("updated_at")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public sealed class CredentialSaveRequest
{
    [JsonPropertyName("credential_id")]
    public string? CredentialId { get; set; } // Null for new, set for edit

    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("identifier1")]
    public string? Identifier1 { get; set; }

    [JsonPropertyName("identifier2")]
    public string? Identifier2 { get; set; }

    [JsonPropertyName("identifier3")]
    public string? Identifier3 { get; set; }

    [JsonPropertyName("identifier4")]
    public string? Identifier4 { get; set; }

    [JsonPropertyName("secret_value")]
    public string? SecretValue { get; set; } // Null/empty when editing if secret remains unchanged
}

public sealed class GcpImportJsonResponse
{
    [JsonPropertyName("project_id")]
    public string ProjectId { get; set; } = string.Empty;

    [JsonPropertyName("client_email")]
    public string ClientEmail { get; set; } = string.Empty;

    [JsonPropertyName("private_key_id")]
    public string PrivateKeyId { get; set; } = string.Empty;

    [JsonPropertyName("private_key")]
    public string PrivateKey { get; set; } = string.Empty;
}
