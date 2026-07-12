/**
 * global-connection-defaults.js
 * =============================
 * Fetches and stores the default styling configurations for connections.
 */
'use strict';

const GlobalConnectionDefaults = (() => {

  let _defaults = {}; // connectionType -> default config

  async function load() {
    try {
      const res = await fetch('/api/connections/defaults');
      if (!res.ok) throw new Error('Failed to fetch connection defaults');
      const data = await res.json();
      
      data.forEach(d => {
        _defaults[d.ConnectionType] = d;
      });
      
      console.log('[GlobalConnectionDefaults] Loaded config for connection types:', Object.keys(_defaults).length);
    } catch (err) {
      console.warn('[GlobalConnectionDefaults] Could not load from DB, using internal fallbacks.', err);
      // Hardcoded fallbacks if API is missing
      _defaults = {
        'VPC to VPC': { StrokeColor: '#22c55e', LineType: 'solid', LineWidth: 3, DrawArrows: false, TargetRadiusPaddingRatio: 1.0 },
        'Subnet to Subnet': { StrokeColor: '#3b82f6', LineType: 'dashed', LineWidth: 2, DrawArrows: false, TargetRadiusPaddingRatio: 1.0 },
        'IPsec tunnel': { StrokeColor: '#f59e0b', LineType: 'dashed', LineWidth: 2, DrawArrows: false, TargetRadiusPaddingRatio: 1.0 },
        'VPC peer link': { StrokeColor: '#000000', LineType: 'solid', LineWidth: 5, DrawArrows: false, TargetRadiusPaddingRatio: 1.0 }
      };
    }
  }

  function getDefaults(connectionType) {
    return _defaults[connectionType] || {
      StrokeColor: '#6366f1',
      LineType: 'solid',
      LineWidth: 2,
      DrawArrows: false,
      TargetRadiusPaddingRatio: 1.0
    };
  }

  function setDefaults(connectionType, newDefaults) {
    if (!_defaults[connectionType]) _defaults[connectionType] = {};
    Object.assign(_defaults[connectionType], newDefaults);
    // Ideally this would PUT/POST back to the server
  }

  return { load, getDefaults, setDefaults };
})();
