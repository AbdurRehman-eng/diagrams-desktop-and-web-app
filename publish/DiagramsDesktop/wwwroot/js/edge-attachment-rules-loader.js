/**
 * edge-attachment-rules-loader.js
 * ================================
 * Milestone 8 — Loads device-on-container-edge-rules.csv and
 * exposes isEdgeAllowed(deviceType, containerType).
 * M9: Also parses "Maximum number of devices" column.
 */

'use strict';

const EdgeAttachmentRulesLoader = (() => {

  let _rules  = []; // [{ device, container, maxDevices }]
  let _loaded = false;

  async function load() {
    try {
      const res = await fetch('data/device-on-container-edge-rules.csv');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();

      _rules = [];
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 2) {
          const maxDev = cols[2] ? parseInt(cols[2], 10) : null;
          _rules.push({
            device:     _normalize(cols[0]),
            container:  _normalize(cols[1]),
            maxDevices: isNaN(maxDev) ? null : maxDev,
          });
        }
      }

      _loaded = true;
      console.log(`[EdgeAttachmentRulesLoader] Loaded ${_rules.length} rule(s):`, _rules);
    } catch (err) {
      console.error('[EdgeAttachmentRulesLoader] Failed to load CSV:', err);
    }
  }

  /**
   * isEdgeAllowed
   * Returns true if the given device type is allowed on the given container type.
   * @param {string} deviceType    - e.g. 'AWS Internet Gateway' or 'aws-igw'
   * @param {string} containerType - e.g. 'AWS VPC' or 'aws-vpc'
   */
  function isEdgeAllowed(deviceType, containerType) {
    const d = _normalize(deviceType);
    const c = _normalize(containerType);
    return _rules.some(r => r.device === d && r.container === c);
  }

  /**
   * getMaxDevices
   * Returns the maximum number of this device type allowed on the container, or null.
   */
  function getMaxDevices(deviceType, containerType) {
    const d = _normalize(deviceType);
    const c = _normalize(containerType);
    const rule = _rules.find(r => r.device === d && r.container === c);
    return rule ? rule.maxDevices : null;
  }

  function isLoaded() { return _loaded; }

  function _normalize(str) {
    return (str || '')
      .replace(/^aws[-\s]/i, '')      // strip "aws-" or "aws "
      .replace(/[-_]/g, ' ')          // normalise separators
      .trim()
      .toLowerCase();
  }

  return { load, isEdgeAllowed, getMaxDevices, isLoaded };

})();
