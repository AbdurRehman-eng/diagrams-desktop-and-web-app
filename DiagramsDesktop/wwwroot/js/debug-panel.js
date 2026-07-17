/**
 * debug-panel.js
 * ==============
 * Version M5.0 — Live diagnostic display.
 *
 * M5.0 additions:
 *   - Selected shape world-space info (WorldX, WorldY, Width, Height)
 *   - Hovered shape ID
 *   - GlobalVars rectangle/circle hover + protection padding ratios
 *
 * Trigger:     Called by RenderCanvas.render() at end of each frame.
 * Input:       Reads CanvasState directly — no side effects.
 * Output:      Updated innerHTML in #debug-panel.
 */

'use strict';

const DebugPanel = (() => {

  function update() {
    const panel = document.getElementById('debug-panel');
    if (!panel) return;

    const canvas  = CanvasState.getCanvas();
    const diagram = CanvasState.getActiveDiagram();
    if (!canvas || !diagram) {
      panel.classList.add('hidden');
      return;
    }

    if (canvas.TroubleshootingConsoleVisible) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
      return;
    }

    const shapes     = CanvasState.getShapes();
    const selectedId = CanvasState.getSelectedId();
    const hoveredId  = CanvasState.getHoveredId();
    const gv         = CanvasState.getGlobalVars();

    const svg = document.getElementById('canvas-svg');
    const sW  = svg ? svg.clientWidth  : 0;
    const sH  = svg ? svg.clientHeight : 0;

    // ── Selected shape/COC rows ───────────────────────────────
    let selectedRows = `<div class="debug-row"><span class="debug-label">Selected:</span><span class="debug-value">none</span></div>`;
    const selectedCocId = (typeof CircleOnContainerState !== 'undefined') ? CircleOnContainerState.getSelectedId() : null;

    if (selectedId) {
      const s = shapes.find(sh => sh.ShapeID === selectedId);
      if (s) {
        const sPos = WorldToScreen.convert(s.WorldX, s.WorldY, sW, sH);
        selectedRows = `
          <div class="debug-row"><span class="debug-label">Selected:</span><span class="debug-value" style="color:#60a5fa">${s.Label || s.Type}</span></div>
          <div class="debug-row"><span class="debug-label">World (X,Y):</span><span class="debug-value">(${s.WorldX.toFixed(1)}, ${s.WorldY.toFixed(1)})</span></div>
          <div class="debug-row"><span class="debug-label">Screen (X,Y):</span><span class="debug-value">(${Math.round(sPos.x)}, ${Math.round(sPos.y)})</span></div>
          <div class="debug-row"><span class="debug-label">W × H:</span><span class="debug-value">${s.Width.toFixed(0)} × ${s.Height.toFixed(0)}</span></div>
        `;
      }
    } else if (selectedCocId) {
      const coc = CircleOnContainerState.getById(selectedCocId);
      if (coc) {
        const sPos = WorldToScreen.convert(coc.CenterX, coc.CenterY, sW, sH);
        selectedRows = `
          <div class="debug-row"><span class="debug-label">Selected:</span><span class="debug-value" style="color:#a855f7">${coc.Label || coc.DeviceOnContainerEdgeType}</span></div>
          <div class="debug-row"><span class="debug-label">World (X,Y):</span><span class="debug-value">(${coc.CenterX.toFixed(1)}, ${coc.CenterY.toFixed(1)})</span></div>
          <div class="debug-row"><span class="debug-label">Screen (X,Y):</span><span class="debug-value">(${Math.round(sPos.x)}, ${Math.round(sPos.y)})</span></div>
          <div class="debug-row"><span class="debug-label">Radius:</span><span class="debug-value">${coc.Radius.toFixed(1)}</span></div>
          <div class="debug-row"><span class="debug-label">Edge:</span><span class="debug-value">${coc.HostEdge} (t=${coc.EdgeParameterT.toFixed(2)})</span></div>
        `;
      }
    }

    // ── Hovered shape/COC row ─────────────────────────────────
    let hoveredRow = `<div class="debug-row"><span class="debug-label">Hovered:</span><span class="debug-value">none</span></div>`;
    const hoveredCocId = (typeof CircleOnContainerState !== 'undefined') ? CircleOnContainerState.getHoveredId() : null;

    if (hoveredId) {
      const h = shapes.find(sh => sh.ShapeID === hoveredId);
      if (h) {
        hoveredRow = `<div class="debug-row"><span class="debug-label">Hovered:</span><span class="debug-value" style="color:#93c5fd">${h.Label || h.Type}</span></div>`;
      }
    } else if (hoveredCocId) {
      const h = CircleOnContainerState.getById(hoveredCocId);
      if (h) {
        hoveredRow = `<div class="debug-row"><span class="debug-label">Hovered:</span><span class="debug-value" style="color:#c084fc">${h.Label || h.DeviceOnContainerEdgeType}</span></div>`;
      }
    }

    panel.innerHTML = `
      <div class="debug-main-title">Troubleshooting Console</div>
      <div class="debug-title">Diagram</div>
      <div class="debug-row"><span class="debug-label">ID:</span><span class="debug-value">${diagram.DiagramID.slice(-8)}</span></div>
      <div class="debug-row"><span class="debug-label">Name:</span><span class="debug-value">${diagram.DiagramName}</span></div>
      <div class="debug-row"><span class="debug-label">Shapes:</span><span class="debug-value">${shapes.length}</span></div>

      <div class="debug-title">Viewport</div>
      <div class="debug-row"><span class="debug-label">Center X:</span><span class="debug-value">${canvas.ViewportCenterX.toFixed(2)}</span></div>
      <div class="debug-row"><span class="debug-label">Center Y:</span><span class="debug-value">${canvas.ViewportCenterY.toFixed(2)}</span></div>
      <div class="debug-row"><span class="debug-label">Zoom:</span><span class="debug-value">${(canvas.ZoomScale * 100).toFixed(0)}%</span></div>
      <div class="debug-row"><span class="debug-label">Canvas:</span><span class="debug-value">${sW}×${sH}px</span></div>

      <div class="debug-title">Interaction (M5)</div>
      ${selectedRows}
      ${hoveredRow}

      <div class="debug-title">GlobalVars</div>
      <div class="debug-row"><span class="debug-label">Rect hover:</span><span class="debug-value">${gv.rectangle.hoverPaddingRatio}</span></div>
      <div class="debug-row"><span class="debug-label">Rect prot:</span><span class="debug-value">${gv.rectangle.protectionPaddingRatio}</span></div>
      <div class="debug-row"><span class="debug-label">Circle hover:</span><span class="debug-value">${gv.circle.hoverPaddingRatio}</span></div>
      <div class="debug-row"><span class="debug-label">Circle prot:</span><span class="debug-value">${gv.circle.protectionPaddingRatio}</span></div>
    `;
  }

  return { update };

})();
