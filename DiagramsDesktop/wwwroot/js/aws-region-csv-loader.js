/**
 * aws-region-csv-loader.js
 * ========================
 * Loads and parses the aws_regions_zones.csv configuration file.
 * Handles quoted CSV parsing for Availability Zones and AZ IDs.
 */

'use strict';

const AwsRegionCsvLoader = (() => {

  let _regions = [];
  let _isLoaded = false;

  async function load() {
    if (_isLoaded) return;
    try {
      const v = new Date().getTime();
      const response = await fetch(`data/aws_regions_zones.csv?v=${v}`);
      if (!response.ok) throw new Error('Failed to load Region/AZ CSV');
      const csvText = await response.text();
      _parseCsv(csvText);
      _isLoaded = true;
      console.log('[AwsRegionCsvLoader] Loaded regions count:', _regions.length);
    } catch (err) {
      console.error('[AwsRegionCsvLoader] Error loading CSV:', err);
    }
  }

  function _parseCsv(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;
    
    for (let i = 1; i < lines.length; i++) {
      const parts = _parseCsvLine(lines[i]);
      if (parts.length < 5) continue;
      
      const regionName = parts[0];
      const regionCode = parts[1];
      
      // Clean quotes and split CSV subarrays
      const zonesRaw = parts[2].replace(/^"|"$/g, '');
      const zoneIdsRaw = parts[3].replace(/^"|"$/g, '');
      
      const zones = zonesRaw.split(',').map(z => z.trim());
      const zoneIds = zoneIdsRaw.split(',').map(z => z.trim());
      
      const azList = [];
      for (let j = 0; j < zones.length; j++) {
        azList.push({
          name: zones[j],
          id: zoneIds[j] || ''
        });
      }
      
      _regions.push({
        name: regionName,
        code: regionCode,
        zones: azList,
        geography: parts[4].replace(/^"|"$/g, '')
      });
    }
  }

  function _parseCsvLine(text) {
    let fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);
    return fields;
  }

  function getRegions() {
    return _regions.map(r => ({ code: r.code, name: r.name }));
  }

  function getZonesForRegion(regionCode) {
    const reg = _regions.find(r => r.code === regionCode);
    return reg ? reg.zones : [];
  }

  function getRandomRegion() {
    if (_regions.length === 0) return null;
    const idx = Math.floor(Math.random() * _regions.length);
    return { code: _regions[idx].code, name: _regions[idx].name };
  }

  function getRegionNameByCode(regionCode) {
    const reg = _regions.find(r => r.code === regionCode);
    return reg ? reg.name : regionCode;
  }

  return { load, getRegions, getZonesForRegion, getRandomRegion, getRegionNameByCode, isLoaded: () => _isLoaded };
})();
