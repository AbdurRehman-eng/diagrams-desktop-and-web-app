/**
 * connection-options-menu.js
 * ==========================
 * Presents a UI overlay letting the user choose the connection type,
 * generated dynamically based on the source and destination types.
 */
'use strict';

const ConnectionOptionsMenu = (() => {

  let _resolveSelection = null;
  let _container = null;

  function init() {
    _container = document.createElement('div');
    _container.id = 'connection-options-modal';
    _container.style.display = 'none';
    _container.style.position = 'fixed';
    _container.style.top = '0';
    _container.style.left = '0';
    _container.style.width = '100vw';
    _container.style.height = '100vh';
    _container.style.backgroundColor = 'rgba(0,0,0,0.5)';
    _container.style.zIndex = '2000';
    _container.style.alignItems = 'center';
    _container.style.justifyContent = 'center';

    _container.innerHTML = `
      <div style="background: #1e1e1e; color: #fff; padding: 20px; border-radius: 8px; width: 300px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <h3 style="margin-top:0; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">Select Connection Type</h3>
        <div id="connection-options-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
        <div style="margin-top: 15px; text-align: right;">
          <button id="connection-options-cancel" style="background: #444; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(_container);

    document.getElementById('connection-options-cancel').addEventListener('click', () => {
      _close();
    });
  }

  function showFor(sourceShapeId, destShapeId) {
    if (!_container) init();

    const shapes = CanvasState.getShapes();
    const s1 = shapes.find(s => s.ShapeID === sourceShapeId) 
      || CanvasState.getCircleOnContainers().find(c => c.CircleOnContainerID === sourceShapeId);
    const s2 = shapes.find(s => s.ShapeID === destShapeId) 
      || CanvasState.getCircleOnContainers().find(c => c.CircleOnContainerID === destShapeId);

    if (!s1 || !s2) {
      console.warn('[ConnectionOptionsMenu] Cannot find source or dest shape.');
      return;
    }

    // CSV uses category type-labels like "AWS NAT gateway", "AWS Route table".
    // s.Label is the INSTANCE name ("NAT-1"), not the type label — use ShapeCategories.
    let options = [];
    const _typeLabel = (s) => {
      if (typeof ShapeCategories !== 'undefined' && s.Type) {
        const def = ShapeCategories.getItemByType(s.Type);
        if (def && def.label) return def.label;
      }
      return s.DeviceOnContainerEdgeType || s.Label || s.Type;
    };
    const src  = _typeLabel(s1);
    const dest = _typeLabel(s2);

    if (typeof ConnectionTypeLookupCsv !== 'undefined') {
      options = ConnectionTypeLookupCsv.getPossibleConnections(src, dest);
    }

    // Fallback to DB
    if (!options && typeof ConnectionTypeLookupDb !== 'undefined') {
      options = ConnectionTypeLookupDb.getPossibleConnections(src, dest);
    }

    if (!options || options.length === 0) {
      alert(`No valid connection rules found between "${src}" and "${dest}".\nCheck connection_type_lookup.csv.`);
      return;
    }

    const listDiv = document.getElementById('connection-options-list');
    listDiv.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.background = '#3b82f6';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '10px';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '500';
      
      btn.addEventListener('mouseenter', () => btn.style.background = '#2563eb');
      btn.addEventListener('mouseleave', () => btn.style.background = '#3b82f6');
      
      btn.addEventListener('click', () => {
        _submit(sourceShapeId, destShapeId, opt);
      });
      listDiv.appendChild(btn);
    });

    _container.style.display = 'flex';
  }

  function _submit(sourceId, destId, connectionType) {
    _close();
    console.log(`[ConnectionOptionsMenu] User selected: ${connectionType}`);
    
    if (typeof ConnectionBuilder !== 'undefined') {
      ConnectionBuilder.buildAndSave(sourceId, destId, connectionType);
    } else {
      console.warn('[ConnectionOptionsMenu] ConnectionBuilder not defined.');
    }
  }

  function _close() {
    if (_container) _container.style.display = 'none';
    if (typeof ConnectionModeState !== 'undefined') {
      ConnectionModeState.reset();
    }
  }

  return { init, showFor };
})();
