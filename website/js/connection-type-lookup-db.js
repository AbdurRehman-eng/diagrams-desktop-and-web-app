/**
 * connection-type-lookup-db.js
 * ============================
 * Fallback connection lookup using the C# REST API.
 */
'use strict';

const ConnectionTypeLookupDb = (() => {

  let _dbRules = null;

  async function load() {
    if (_dbRules !== null) return;
    try {
      const res = await fetch('/api/connections/lookups');
      if (!res.ok) throw new Error('DB Lookup fetch failed');
      const data = await res.json();
      _dbRules = data;
      console.log('[ConnectionLookup] DB rules loaded. Count:', _dbRules.length);
    } catch (err) {
      console.warn('[ConnectionLookup] DB rules could not be loaded.', err);
      _dbRules = []; // Prevent infinite retries
    }
  }

  function _normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[\s-]/g, '');
  }

  function getPossibleConnections(sourceLabel, destLabel) {
    if (_dbRules === null) return null;

    const normSrc = _normalize(sourceLabel);
    const normDst = _normalize(destLabel);

    // DB might return camelCase or PascalCase depending on JSON config
    // We check both or use the safe fallback
    const rule = _dbRules.find(r => {
      const src = r.SourceDeviceType || r.sourceDeviceType;
      const dst = r.DestinationDeviceType || r.destinationDeviceType;
      return _normalize(src) === normSrc && _normalize(dst) === normDst;
    });

    if (rule) {
      const conns = rule.PossibleConnections || rule.possibleConnections;
      if (conns) return _splitConnections(conns);
    }

    // Bidirectional fallback
    const revRule = _dbRules.find(r => {
      const src = r.SourceDeviceType || r.sourceDeviceType;
      const dst = r.DestinationDeviceType || r.destinationDeviceType;
      return _normalize(src) === normDst && _normalize(dst) === normSrc;
    });

    if (revRule) {
      const conns = revRule.PossibleConnections || revRule.possibleConnections;
      if (conns) return _splitConnections(conns);
    }

    return null;
  }

  function _splitConnections(connStr) {
    if (!connStr) return [];
    if (Array.isArray(connStr)) return connStr; // If API returned a JSON array
    return connStr.split(' OR ').map(c => c.trim()).filter(c => c.length > 0);
  }

  return { load, getPossibleConnections };
})();
