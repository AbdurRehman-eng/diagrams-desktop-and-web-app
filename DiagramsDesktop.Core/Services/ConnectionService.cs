using DiagramsDesktop.Core.Models;
using DiagramsDesktop.Core.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiagramsDesktop.Core.Services
{
    public interface IConnectionService
    {
        Task<IEnumerable<ConnectionTypeLookupDto>> GetConnectionTypeLookupsAsync();
        Task<IEnumerable<ConnectionStyleDefaultDto>> GetConnectionStyleDefaultsAsync();
    }

    public class ConnectionService : IConnectionService
    {
        private readonly IConnectionRepository _repository;

        public ConnectionService(IConnectionRepository repository)
        {
            _repository = repository;
        }

        public Task<IEnumerable<ConnectionTypeLookupDto>> GetConnectionTypeLookupsAsync()
        {
            return _repository.GetConnectionTypeLookupsAsync();
        }

        public Task<IEnumerable<ConnectionStyleDefaultDto>> GetConnectionStyleDefaultsAsync()
        {
            return _repository.GetConnectionStyleDefaultsAsync();
        }
    }
}
