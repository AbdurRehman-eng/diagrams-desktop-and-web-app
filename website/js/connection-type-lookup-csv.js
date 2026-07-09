/**
 * connection-type-lookup-csv.js
 * =============================
 * Fetches and parses the CSV rules for possible connections between shape types.
 * M9: Added "Maximum number of connections" column and isAutoConnect() helper.
 *     "No choices. Solid black line" is shown as a pre-selected single option.
 */
'use strict';

const ConnectionTypeLookupCsv = (() => {

  let _lookupRules = [];
  let _isLoaded = false;

  async function load() {
    if (_isLoaded) return;
    try {
      const v = new Date().getTime();
      const response = await fetch(`data/connection_type_lookup.csv?v=${v}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const csvText = await response.text();
      _parseCsv(csvText);
      _isLoaded = true;
      console.log('[ConnectionLookup] CSV rules loaded. Count:', _lookupRules.length);
    } catch (err) {
      console.warn('[ConnectionLookup] Failed to load CSV. Falling back to DB...', err);
    }
  }

  function _normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/^aws[\s-]+/, '')   // strip leading "aws " or "aws-"
      .replace(/[\s\-_]/g, '');    // collapse remaining spaces, hyphens, underscores
  }

  function _parseCsv(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    // Headers: SourceDeviceType,DestinationDeviceType,PossibleConnections,Maximum number of connections
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 3) continue;

      const possibleConnections = parts[2].split(' OR ').map(c => c.trim());
      const maxConnRaw = parts[3] ? parseInt(parts[3], 10) : null;

      _lookupRules.push({
        sourceDeviceType:      _normalize(parts[0]),
        destinationDeviceType: _normalize(parts[1]),
        possibleConnections,
        maxConnections: isNaN(maxConnRaw) ? null : maxConnRaw,
        // "No choices" = single pre-selected connection shown in dialog
        isAutoConnect: possibleConnections.length === 1 &&
                       possibleConnections[0].toLowerCase().startsWith('no choices'),
      });
    }
  }

  function getPossibleConnections(sourceLabel, destLabel) {
    const rule = _findRule(sourceLabel, destLabel);
    return rule ? rule.possibleConnections : null;
  }

  function getMaxConnections(sourceLabel, destLabel) {
    const rule = _findRule(sourceLabel, destLabel);
    return rule ? rule.maxConnections : null;
  }

  /**
   * isAutoConnect
   * Returns true when only "No choices. Solid black line" is available.
   * The dialog should still show but with the single option pre-selected.
   */
  function isAutoConnect(sourceLabel, destLabel) {
    const rule = _findRule(sourceLabel, destLabel);
    return rule ? (rule.isAutoConnect || false) : false;
  }

  function _findRule(sourceLabel, destLabel) {
    const normSrc = _normalize(sourceLabel);
    const normDst = _normalize(destLabel);
    const rule = _lookupRules.find(r =>
      r.sourceDeviceType === normSrc && r.destinationDeviceType === normDst
    );
    if (rule) return rule;
    return _lookupRules.find(r =>
      r.sourceDeviceType === normDst && r.destinationDeviceType === normSrc
    ) || null;
  }

  return { load, getPossibleConnections, getMaxConnections, isAutoConnect };
})();
