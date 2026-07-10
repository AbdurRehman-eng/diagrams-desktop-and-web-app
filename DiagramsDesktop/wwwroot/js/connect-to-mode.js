/**
 * connect-to-mode.js
 * ==================
 * Engages the "Connect To" mode, locks canvas drag/drop, and intercepts the next click.
 */
'use strict';

const ConnectToMode = (() => {

  function start(sourceShapeId) {
    if (!sourceShapeId) return;
    ConnectionModeState.isActive = true;
    ConnectionModeState.sourceShapeId = sourceShapeId;
    
    // Change cursor
    document.body.style.cursor = 'crosshair';
    
    // Add visual banner
    _showBanner();

    // Intercept next click
    // Use capture to prevent DragHandler from selecting or moving things
    document.getElementById('MainCanvasViewport').addEventListener('mousedown', _onViewportClick, { capture: true, once: true });
    
    console.log('[ConnectToMode] Started for source:', sourceShapeId);
  }

  function _onViewportClick(e) {
    if (!ConnectionModeState.isActive) return;
    
    // We handle the click, stop other handlers
    e.stopPropagation();
    e.preventDefault();

    let targetShapeId = null;
    const path = e.composedPath();
    for (const el of path) {
      if (el.getAttribute && el.getAttribute('data-obj-id')) {
        targetShapeId = el.getAttribute('data-obj-id');
        break;
      }
      if (el.getAttribute && el.getAttribute('data-coc-id')) {
        targetShapeId = el.getAttribute('data-coc-id');
        break;
      }
      if (el.id === 'MainCanvasViewport') break;
    }

    _end(targetShapeId);
  }

  function _end(destinationShapeId) {
    ConnectionModeState.isActive = false;
    document.body.style.cursor = 'default';
    _hideBanner();

    if (!destinationShapeId) {
      console.log('[ConnectToMode] Cancelled, clicked empty canvas.');
      ConnectionModeState.reset();
      return;
    }

    if (destinationShapeId === ConnectionModeState.sourceShapeId) {
      console.log('[ConnectToMode] Cancelled, clicked source shape.');
      ConnectionModeState.reset();
      return;
    }

    ConnectionModeState.destinationShapeId = destinationShapeId;
    console.log(`[ConnectToMode] Success! Source: ${ConnectionModeState.sourceShapeId} -> Dest: ${destinationShapeId}`);

    // Proceed to connection type lookup
    if (typeof ConnectionOptionsMenu !== 'undefined') {
      ConnectionOptionsMenu.showFor(ConnectionModeState.sourceShapeId, destinationShapeId);
    } else {
      console.warn('[ConnectToMode] ConnectionOptionsMenu is not defined.');
    }
  }

  function cancel() {
    if (!ConnectionModeState.isActive) return;
    ConnectionModeState.reset();
    document.body.style.cursor = 'default';
    _hideBanner();
    document.getElementById('MainCanvasViewport').removeEventListener('mousedown', _onViewportClick, { capture: true });
    console.log('[ConnectToMode] Force cancelled.');
  }

  function _showBanner() {
    let banner = document.getElementById('connect-to-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'connect-to-banner';
      banner.innerHTML = `
        <div style="background-color: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 500; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px;">
          <span>Select destination shape to connect...</span>
          <button id="connect-to-cancel-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">✕</button>
        </div>
      `;
      banner.style.position = 'absolute';
      banner.style.top = '20px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.zIndex = '1000';
      document.body.appendChild(banner);

      document.getElementById('connect-to-cancel-btn').addEventListener('click', cancel);
    }
    banner.style.display = 'block';
  }

  function _hideBanner() {
    const banner = document.getElementById('connect-to-banner');
    if (banner) banner.style.display = 'none';
  }

  return { start, cancel };
})();
