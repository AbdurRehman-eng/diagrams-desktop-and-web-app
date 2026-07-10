using DiagramsDesktop.Core.Models;
using DiagramsDesktop.Core.Repositories;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiagramsDesktop.Core.Services
{
    public interface IDiagramCanvasService
    {
        Task<DiagramCanvasDto?> GetDiagramAsync(string diagramId);
        Task SaveDiagramAsync(DiagramCanvasDto dto);
        Task<IEnumerable<DiagramSummaryDto>> ListDiagramsAsync();
    }

    public class DiagramCanvasService : IDiagramCanvasService
    {
        private readonly IDiagramCanvasRepository _repository;

        public DiagramCanvasService(IDiagramCanvasRepository repository)
        {
            _repository = repository;
        }

        public async Task<DiagramCanvasDto?> GetDiagramAsync(string diagramId)
        {
            if (string.IsNullOrWhiteSpace(diagramId))
                throw new ArgumentException("Diagram ID cannot be empty.", nameof(diagramId));

            return await _repository.GetDiagramAsync(diagramId);
        }

        public async Task SaveDiagramAsync(DiagramCanvasDto dto)
        {
            if (dto == null)
                throw new ArgumentNullException(nameof(dto));

            if (string.IsNullOrWhiteSpace(dto.DiagramID))
                throw new ArgumentException("Diagram ID cannot be empty.");

            if (string.IsNullOrWhiteSpace(dto.DiagramName))
                dto.DiagramName = "Untitled Diagram";

            // Enforce default canvas settings if empty
            if (string.IsNullOrWhiteSpace(dto.CanvasID))
                dto.CanvasID = Guid.NewGuid().ToString();

            if (string.IsNullOrWhiteSpace(dto.CanvasName))
                dto.CanvasName = "Default Canvas";

            await _repository.SaveDiagramAsync(dto);
        }

        public async Task<IEnumerable<DiagramSummaryDto>> ListDiagramsAsync()
        {
            return await _repository.ListDiagramsAsync();
        }
    }
}
