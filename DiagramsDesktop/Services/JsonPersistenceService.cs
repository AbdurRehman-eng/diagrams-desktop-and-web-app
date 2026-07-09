using System;
using System.IO;
using System.Text.Json;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Services;

public class JsonPersistenceService
{
    private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
    {
        WriteIndented = true,
        PropertyNameCaseInsensitive = true
    };

    public void SaveToFile(DiagramModel diagram, string filePath)
    {
        if (diagram == null) throw new ArgumentNullException(nameof(diagram));
        if (string.IsNullOrWhiteSpace(filePath)) throw new ArgumentException("Path cannot be empty", nameof(filePath));

        string jsonText = JsonSerializer.Serialize(diagram, JsonOptions);
        File.WriteAllText(filePath, jsonText);
    }

    public DiagramModel? LoadFromFile(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath)) throw new ArgumentException("Path cannot be empty", nameof(filePath));
        if (!File.Exists(filePath)) throw new FileNotFoundException("File not found", filePath);

        string jsonText = File.ReadAllText(filePath);
        return JsonSerializer.Deserialize<DiagramModel>(jsonText, JsonOptions);
    }
}
