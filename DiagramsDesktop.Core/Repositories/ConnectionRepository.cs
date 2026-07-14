using Dapper;
using Microsoft.Data.Sqlite;
using DiagramsDesktop.Core.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiagramsDesktop.Core.Repositories
{
    public interface IConnectionRepository
    {
        Task<IEnumerable<ConnectionTypeLookupDto>> GetConnectionTypeLookupsAsync();
        Task<IEnumerable<ConnectionStyleDefaultDto>> GetConnectionStyleDefaultsAsync();
    }

    public class ConnectionRepository : IConnectionRepository
    {
        private readonly string _connectionString;

        public ConnectionRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<IEnumerable<ConnectionTypeLookupDto>> GetConnectionTypeLookupsAsync()
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            var sql = "SELECT * FROM ConnectionTypeLookups";
            return await connection.QueryAsync<ConnectionTypeLookupDto>(sql);
        }

        public async Task<IEnumerable<ConnectionStyleDefaultDto>> GetConnectionStyleDefaultsAsync()
        {
            using var connection = new SqliteConnection(_connectionString);
            await connection.OpenAsync();
            var sql = "SELECT * FROM ConnectionStyleDefaults";
            return await connection.QueryAsync<ConnectionStyleDefaultDto>(sql);
        }
    }
}
