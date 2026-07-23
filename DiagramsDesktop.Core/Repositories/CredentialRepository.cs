using Microsoft.Data.Sqlite;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Models;

namespace DiagramsDesktop.Core.Repositories;

public interface ICredentialRepository
{
    Task SaveMetadataAsync(CredentialDto dto);
    Task<CredentialDto?> GetMetadataByIdAsync(string credentialId);
    Task<List<CredentialDto>> ListMetadataByProviderAsync(string provider);
    Task DeleteMetadataAsync(string credentialId);
}

public class CredentialRepository : ICredentialRepository
{
    private readonly string _connectionString;

    public CredentialRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task SaveMetadataAsync(CredentialDto dto)
    {
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            INSERT OR REPLACE INTO CredentialsMetadata (
                CredentialId, Provider, Description, 
                Identifier1, Identifier2, Identifier3, Identifier4, 
                TargetName, CreatedAt, UpdatedAt
            ) VALUES (
                $id, $provider, $description, 
                $id1, $id2, $id3, $id4, 
                $target, $created, $updated
            );";

        using var command = new SqliteCommand(query, connection);
        command.Parameters.AddWithValue("$id", dto.CredentialId);
        command.Parameters.AddWithValue("$provider", dto.Provider);
        command.Parameters.AddWithValue("$description", dto.Description);
        command.Parameters.AddWithValue("$id1", (object?)dto.Identifier1 ?? DBNull.Value);
        command.Parameters.AddWithValue("$id2", (object?)dto.Identifier2 ?? DBNull.Value);
        command.Parameters.AddWithValue("$id3", (object?)dto.Identifier3 ?? DBNull.Value);
        command.Parameters.AddWithValue("$id4", (object?)dto.Identifier4 ?? DBNull.Value);
        command.Parameters.AddWithValue("$target", dto.TargetName);
        command.Parameters.AddWithValue("$created", dto.CreatedAt);
        command.Parameters.AddWithValue("$updated", dto.UpdatedAt);

        await command.ExecuteNonQueryAsync();
    }

    public async Task<CredentialDto?> GetMetadataByIdAsync(string credentialId)
    {
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM CredentialsMetadata WHERE CredentialId = $id;";
        using var command = new SqliteCommand(query, connection);
        command.Parameters.AddWithValue("$id", credentialId);

        using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapReaderToDto(reader);
        }

        return null;
    }

    public async Task<List<CredentialDto>> ListMetadataByProviderAsync(string provider)
    {
        var list = new List<CredentialDto>();
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT * FROM CredentialsMetadata WHERE Provider = $provider ORDER BY CreatedAt DESC;";
        using var command = new SqliteCommand(query, connection);
        command.Parameters.AddWithValue("$provider", provider);

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            list.Add(MapReaderToDto(reader));
        }

        return list;
    }

    public async Task DeleteMetadataAsync(string credentialId)
    {
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM CredentialsMetadata WHERE CredentialId = $id;";
        using var command = new SqliteCommand(query, connection);
        command.Parameters.AddWithValue("$id", credentialId);

        await command.ExecuteNonQueryAsync();
    }

    private static CredentialDto MapReaderToDto(SqliteDataReader reader)
    {
        return new CredentialDto
        {
            CredentialId = reader.GetString(reader.GetOrdinal("CredentialId")),
            Provider = reader.GetString(reader.GetOrdinal("Provider")),
            Description = reader.GetString(reader.GetOrdinal("Description")),
            Identifier1 = reader.IsDBNull(reader.GetOrdinal("Identifier1")) ? null : reader.GetString(reader.GetOrdinal("Identifier1")),
            Identifier2 = reader.IsDBNull(reader.GetOrdinal("Identifier2")) ? null : reader.GetString(reader.GetOrdinal("Identifier2")),
            Identifier3 = reader.IsDBNull(reader.GetOrdinal("Identifier3")) ? null : reader.GetString(reader.GetOrdinal("Identifier3")),
            Identifier4 = reader.IsDBNull(reader.GetOrdinal("Identifier4")) ? null : reader.GetString(reader.GetOrdinal("Identifier4")),
            TargetName = reader.GetString(reader.GetOrdinal("TargetName")),
            CreatedAt = reader.GetString(reader.GetOrdinal("CreatedAt")),
            UpdatedAt = reader.GetString(reader.GetOrdinal("UpdatedAt"))
        };
    }
}
