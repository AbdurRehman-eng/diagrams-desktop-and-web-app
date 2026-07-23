using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Models;
using DiagramsDesktop.Core.Repositories;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop.Services;

public interface ICredentialService
{
    Task<List<CredentialDto>> ListCredentialsAsync(string provider);
    Task<CredentialDto> SaveCredentialAsync(CredentialSaveRequest request);
    Task DeleteCredentialAsync(string credentialId);
    GcpImportJsonResponse ParseGcpJson(string jsonContent);
}

public class CredentialService : ICredentialService
{
    private readonly ICredentialRepository _repository;
    private const string AppName = "GMLDiagrams";

    public CredentialService(ICredentialRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CredentialDto>> ListCredentialsAsync(string provider)
    {
        // Provider is case-insensitive, but normalize it for DB query
        var normalizedProvider = NormalizeProvider(provider);
        return await _repository.ListMetadataByProviderAsync(normalizedProvider);
    }

    public async Task<CredentialDto> SaveCredentialAsync(CredentialSaveRequest request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.Provider)) throw new ArgumentException("Provider is required.");
        if (string.IsNullOrWhiteSpace(request.Description)) throw new ArgumentException("Description is required.");

        var provider = NormalizeProvider(request.Provider);

        // Edit Flow
        if (!string.IsNullOrWhiteSpace(request.CredentialId))
        {
            var existing = await _repository.GetMetadataByIdAsync(request.CredentialId);
            if (existing == null)
            {
                throw new KeyNotFoundException($"Credential with ID {request.CredentialId} not found.");
            }

            // Save new secret if entered
            if (!string.IsNullOrEmpty(request.SecretValue))
            {
                var username = GetUsernameField(provider, request);
                var secretSaved = CredentialManagerWrapper.SaveSecret(existing.TargetName, username, request.SecretValue);
                if (!secretSaved)
                {
                    throw new InvalidOperationException($"Unable to save the {provider} credential in Windows Credential Manager.");
                }
            }

            // Update metadata
            existing.Description = request.Description;
            existing.Identifier1 = request.Identifier1;
            existing.Identifier2 = request.Identifier2;
            existing.Identifier3 = request.Identifier3;
            existing.Identifier4 = request.Identifier4;
            existing.UpdatedAt = DateTime.UtcNow.ToString("o");

            await _repository.SaveMetadataAsync(existing);
            return existing;
        }

        // Add Flow
        if (string.IsNullOrEmpty(request.SecretValue))
        {
            throw new ArgumentException("Secret value is required for new credentials.");
        }

        var id = Guid.NewGuid().ToString();
        var secretType = GetSecretType(provider);
        var targetName = $"GML:{AppName}:{provider}:{id}:{secretType}";
        var usernameField = GetUsernameField(provider, request);

        // Save secret to Credential Manager first
        var saved = CredentialManagerWrapper.SaveSecret(targetName, usernameField, request.SecretValue);
        if (!saved)
        {
            throw new InvalidOperationException($"Unable to save the {provider} credential in Windows Credential Manager.");
        }

        var dto = new CredentialDto
        {
            CredentialId = id,
            Provider = provider,
            Description = request.Description,
            Identifier1 = request.Identifier1,
            Identifier2 = request.Identifier2,
            Identifier3 = request.Identifier3,
            Identifier4 = request.Identifier4,
            TargetName = targetName,
            CreatedAt = DateTime.UtcNow.ToString("o"),
            UpdatedAt = DateTime.UtcNow.ToString("o")
        };

        try
        {
            // Save metadata to SQLite
            await _repository.SaveMetadataAsync(dto);
        }
        catch (Exception ex)
        {
            // Rollback Windows Credential Manager secret if metadata save fails
            CredentialManagerWrapper.DeleteSecret(targetName);
            throw new InvalidOperationException($"Failed to save credential metadata locally. The Credential Manager entry was rolled back: {ex.Message}", ex);
        }

        return dto;
    }

    public async Task DeleteCredentialAsync(string credentialId)
    {
        if (string.IsNullOrWhiteSpace(credentialId)) throw new ArgumentException("Credential ID is required.");

        var existing = await _repository.GetMetadataByIdAsync(credentialId);
        if (existing == null) return; // Already deleted or doesn't exist

        // Delete from Credential Manager
        var deletedSecret = CredentialManagerWrapper.DeleteSecret(existing.TargetName);
        if (!deletedSecret)
        {
            System.Diagnostics.Debug.WriteLine($"[CredentialService] Failed to delete secret for target: {existing.TargetName}");
        }

        // Delete from SQLite
        await _repository.DeleteMetadataAsync(credentialId);
    }

    public GcpImportJsonResponse ParseGcpJson(string jsonContent)
    {
        if (string.IsNullOrWhiteSpace(jsonContent)) throw new ArgumentException("JSON content is required.");

        try
        {
            using var doc = JsonDocument.Parse(jsonContent);
            var root = doc.RootElement;

            var response = new GcpImportJsonResponse();

            if (root.TryGetProperty("project_id", out var projProp))
            {
                response.ProjectId = projProp.GetString() ?? string.Empty;
            }
            if (root.TryGetProperty("client_email", out var emailProp))
            {
                response.ClientEmail = emailProp.GetString() ?? string.Empty;
            }
            if (root.TryGetProperty("private_key_id", out var keyIdProp))
            {
                response.PrivateKeyId = keyIdProp.GetString() ?? string.Empty;
            }
            if (root.TryGetProperty("private_key", out var keyProp))
            {
                response.PrivateKey = keyProp.GetString() ?? string.Empty;
            }

            if (string.IsNullOrEmpty(response.ProjectId) || 
                string.IsNullOrEmpty(response.ClientEmail) || 
                string.IsNullOrEmpty(response.PrivateKeyId) || 
                string.IsNullOrEmpty(response.PrivateKey))
            {
                throw new ArgumentException("Selected file is not a valid GCP Service Account JSON keyfile (missing required fields).");
            }

            return response;
        }
        catch (Exception ex) when (ex is not ArgumentException)
        {
            throw new ArgumentException($"Failed to parse GCP service account JSON: {ex.Message}", ex);
        }
    }

    private static string NormalizeProvider(string provider)
    {
        var p = provider.Trim().ToLowerInvariant();
        return p switch
        {
            "aws" => "AWS",
            "azure" => "Azure",
            "gcp" => "GCP",
            "vmware" or "vmwarevcenter" or "vcenter" => "VMwareVCenter",
            _ => throw new ArgumentException($"Unsupported provider: {provider}")
        };
    }

    private static string GetSecretType(string provider)
    {
        return provider switch
        {
            "AWS" => "SecretKey",
            "Azure" => "SecretValue",
            "GCP" => "PrivateKey",
            "VMwareVCenter" => "Password",
            _ => "Secret"
        };
    }

    private static string GetUsernameField(string provider, CredentialSaveRequest request)
    {
        return provider switch
        {
            "AWS" => request.Identifier1 ?? string.Empty,       // Access Key
            "Azure" => request.Identifier1 ?? string.Empty,     // Client ID
            "GCP" => request.Identifier2 ?? string.Empty,       // Service Account Email
            "VMwareVCenter" => request.Identifier2 ?? string.Empty, // Username
            _ => string.Empty
        };
    }
}
