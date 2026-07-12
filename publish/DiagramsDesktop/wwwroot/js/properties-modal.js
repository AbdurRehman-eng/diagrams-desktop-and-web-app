/**
 * properties-modal.js
 * ===================
 * Milestone 3: Added Circle and Rectangle tabs to Global Variables modal.
 * Rules enforced:
 *   - ProtectionPaddingRatio must always be > HoverPaddingRatio
 *   - Default ResizeControlPointColor = Transparent
 *   - Default ResizeControlPointHoverColor = White
 */

'use strict';

const PropertiesModal = (() => {

  let _activeMode = 'canvas';
  let _activeShapeId = null;

  // ── Palette ──────────────────────────────────────────────────────────────
  const PALETTE = [
    '#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#64748b',
    '#ffffff', '#f1f5f9', '#94a3b8', '#1e293b', '#0f172a', '#000000'
  ];

  // Selected color state
  let _sel = {
    stroke: PALETTE[0], fill: PALETTE[0],
    bg: PALETTE[7],     grid: PALETTE[8],
    rectFill: PALETTE[0], rectStroke: PALETTE[0],
    rectResizeDefault: 'transparent', rectResizeHover: '#ffffff',
    circleFill: PALETTE[0], circleStroke: PALETTE[0],
    circleResizeDefault: 'transparent', circleResizeHover: '#ffffff',
  };

  // ── HTML Template ─────────────────────────────────────────────────────────
  function init() {
    const html = `
      <div id="properties-modal-overlay" class="hidden">
        <div class="prop-modal">
          <div class="prop-sidebar">
            <div class="prop-sidebar-item active" id="tab-canvas"    data-target="form-canvas"   >Canvas</div>
            <div class="prop-sidebar-item"         id="tab-rectangle" data-target="form-rectangle">Rectangle</div>
            <div class="prop-sidebar-item"         id="tab-circle"    data-target="form-circle"   >Circle</div>
            <div class="prop-sidebar-item hidden"  id="tab-shape"     data-target="form-shape"    >Shape Properties</div>
          </div>
          <div class="prop-content">
            <div class="prop-header" id="prop-header-title">Global Variables - Canvas</div>

            <div class="prop-body">

              <!-- ═══ Canvas Form ═══ -->
              <div class="prop-form active" id="form-canvas">
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
                  <div class="prop-label">Background color</div>
                  <div class="prop-swatch-grid" id="swatch-grid-bg"></div>
                </div>
                <div class="prop-row" style="margin-top:12px;">
                  <div class="prop-label">Grid visible</div>
                  <div class="prop-checkbox-wrap">
                    <input type="checkbox" class="prop-input" id="prop-grid-visible" />
                    <span>Enabled</span>
                  </div>
                </div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:12px;">
                  <div class="prop-label">Grid color</div>
                  <div class="prop-swatch-grid" id="swatch-grid-grid"></div>
                </div>
                <div class="prop-row" style="margin-top:12px;">
                  <div class="prop-label">GridSpacingX</div>
                  <input type="number" class="prop-input" id="prop-grid-x" min="5" max="200" />
                </div>
                <div class="prop-row">
                  <div class="prop-label">GridSpacingY</div>
                  <input type="number" class="prop-input" id="prop-grid-y" min="5" max="200" />
                </div>
                <div class="prop-row">
                  <div class="prop-label">ShowOriginMarker</div>
                  <div class="prop-checkbox-wrap">
                    <input type="checkbox" class="prop-input" id="prop-show-origin" />
                    <span>Enabled</span>
                  </div>
                </div>
                <div class="prop-row">
                  <div class="prop-label">ShowAxes</div>
                  <div class="prop-checkbox-wrap">
                    <input type="checkbox" class="prop-input" id="prop-show-axes" />
                    <span>Enabled</span>
                  </div>
                </div>
                <div class="prop-hint">Rule: when Grid visible is unchecked, grid controls are disabled.</div>
              </div>

              <!-- ═══ Rectangle Global Defaults Form ═══ -->
              <div class="prop-form" id="form-rectangle">
                <div class="prop-section-title">Default Colors</div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
                  <div class="prop-label">Default Fill Color</div>
                  <div class="prop-swatch-grid" id="swatch-rect-fill"></div>
                </div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:10px;">
                  <div class="prop-label">Default Stroke Color</div>
                  <div class="prop-swatch-grid" id="swatch-rect-stroke"></div>
                </div>

                <div class="prop-section-title" style="margin-top:16px;">Padding Ratios</div>
                <div class="prop-row">
                  <div class="prop-label">Hover Padding Ratio</div>
                  <input type="number" class="prop-input" id="prop-rect-hover-ratio" min="0" max="0.9" step="0.01" />
                </div>
                <div class="prop-row">
                  <div class="prop-label">Protection Padding Ratio</div>
                  <input type="number" class="prop-input" id="prop-rect-protection-ratio" min="0" max="0.9" step="0.01" />
                </div>
                <div class="prop-hint" id="rect-padding-hint">Rule: Protection Padding Ratio must be greater than Hover Padding Ratio.</div>

                <div class="prop-section-title" style="margin-top:16px;">Resize Control Points</div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
                  <div class="prop-label">Default Color (transparent by default)</div>
                  <div class="prop-swatch-grid" id="swatch-rect-resize-default"></div>
                </div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:10px;">
                  <div class="prop-label">Hover / Active Color (white by default)</div>
                  <div class="prop-swatch-grid" id="swatch-rect-resize-hover"></div>
                </div>
              </div>

              <!-- ═══ Circle Global Defaults Form ═══ -->
              <div class="prop-form" id="form-circle">
                <div class="prop-section-title">Default Colors</div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
                  <div class="prop-label">Default Fill Color</div>
                  <div class="prop-swatch-grid" id="swatch-circle-fill"></div>
                </div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:10px;">
                  <div class="prop-label">Default Stroke Color</div>
                  <div class="prop-swatch-grid" id="swatch-circle-stroke"></div>
                </div>

                <div class="prop-section-title" style="margin-top:16px;">Padding Ratios</div>
                <div class="prop-row">
                  <div class="prop-label">Hover Padding Ratio</div>
                  <input type="number" class="prop-input" id="prop-circle-hover-ratio" min="0" max="0.9" step="0.01" />
                </div>
                <div class="prop-row">
                  <div class="prop-label">Protection Padding Ratio</div>
                  <input type="number" class="prop-input" id="prop-circle-protection-ratio" min="0" max="0.9" step="0.01" />
                </div>
                <div class="prop-hint" id="circle-padding-hint">Rule: Protection Padding Ratio must be greater than Hover Padding Ratio.</div>

                <div class="prop-section-title" style="margin-top:16px;">Resize Control Points</div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
                  <div class="prop-label">Default Color (transparent by default)</div>
                  <div class="prop-swatch-grid" id="swatch-circle-resize-default"></div>
                </div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:10px;">
                  <div class="prop-label">Hover / Active Color (white by default)</div>
                  <div class="prop-swatch-grid" id="swatch-circle-resize-hover"></div>
                </div>
              </div>

              <!-- ═══ Shape Properties Form ═══ -->
              <div class="prop-form" id="form-shape">
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;">
                  <div class="prop-label">Boundary Colour (Stroke)</div>
                  <div class="prop-swatch-grid" id="swatch-grid-stroke"></div>
                </div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:8px;margin-top:12px;">
                  <div class="prop-label">Inner Colour (Fill)</div>
                  <div class="prop-swatch-grid" id="swatch-grid-fill"></div>
                </div>
                <div class="prop-row" style="margin-top:16px;">
                  <div class="prop-label">Width</div>
                  <input type="number" class="prop-input" id="prop-shape-width" min="1" max="2000" />
                </div>
                <div class="prop-row">
                  <div class="prop-label">Height</div>
                  <input type="number" class="prop-input" id="prop-shape-height" min="0" max="2000" />
                </div>
              </div>

            </div><!-- end prop-body -->

            <div class="prop-footer">
              <button class="prop-btn prop-btn-cancel" id="btn-prop-cancel">Cancel</button>
              <button class="prop-btn prop-btn-apply"  id="btn-prop-apply">Apply</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Palette setup — all swatches
    _initPalette('swatch-grid-bg',            'bg',                  true);
    _initPalette('swatch-grid-grid',          'grid',                false);
    _initPalette('swatch-grid-stroke',        'stroke',              false);
    _initPalette('swatch-grid-fill',          'fill',                false);
    _initPalette('swatch-rect-fill',          'rectFill',            false);
    _initPalette('swatch-rect-stroke',        'rectStroke',          false);
    _initPalette('swatch-rect-resize-default','rectResizeDefault',   true);
    _initPalette('swatch-rect-resize-hover',  'rectResizeHover',     false);
    _initPalette('swatch-circle-fill',        'circleFill',          false);
    _initPalette('swatch-circle-stroke',      'circleStroke',        false);
    _initPalette('swatch-circle-resize-default','circleResizeDefault',true);
    _initPalette('swatch-circle-resize-hover','circleResizeHover',   false);

    // Buttons
    document.getElementById('btn-prop-cancel').onclick = close;
    document.getElementById('btn-prop-apply').onclick  = apply;
    document.getElementById('properties-modal-overlay').onclick = (e) => {
      if (e.target.id === 'properties-modal-overlay') close();
    };

    // Tab navigation
    document.querySelectorAll('.prop-sidebar-item').forEach(t =>
      t.addEventListener('click', () => _switchTab(t.dataset.target))
    );

    console.log('[PropertiesModal] Initialized — M3 (Circle + Rectangle global tabs).');
  }

  // ── Palette builder ───────────────────────────────────────────────────────
  function _initPalette(containerId, key, includeTransparent) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = includeTransparent ? ['transparent', ...PALETTE] : PALETTE;

    colors.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'prop-swatch';
      if (color === 'transparent') {
        swatch.style.background = 'repeating-conic-gradient(#aaa 0% 25%, #fff 0% 50%) 0 0 / 10px 10px';
        swatch.title = 'Transparent';
      } else {
        swatch.style.backgroundColor = color;
      }
      swatch.dataset.color = color;
      swatch.onclick = () => {
        container.querySelectorAll('.prop-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        _sel[key] = color;
      };
      container.appendChild(swatch);
    });
  }

  // ── Tab switching ─────────────────────────────────────────────────────────
  function _switchTab(targetId) {
    document.querySelectorAll('.prop-sidebar-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prop-form').forEach(f => f.classList.remove('active'));

    const tab  = document.querySelector(`[data-target="${targetId}"]`);
    const form = document.getElementById(targetId);
    if (tab)  tab.classList.add('active');
    if (form) form.classList.add('active');

    const titles = {
      'form-canvas':    'Global Variables - Canvas',
      'form-rectangle': 'Global Variables - Rectangle',
      'form-circle':    'Global Variables - Circle',
      'form-shape':     'Shape Properties',
    };
    const h = document.getElementById('prop-header-title');
    if (h) h.textContent = titles[targetId] || '';
    _activeMode = targetId;
  }

  // ── Open for canvas (Edit menu → Global Variables) ────────────────────────
  function openForCanvas() {
    _activeShapeId = null;
    document.getElementById('tab-shape').classList.add('hidden');
    document.getElementById('tab-shape').style.display = 'none';
    _switchTab('form-canvas');
    _populateCanvasForm();
    _populateRectangleForm();
    _populateCircleForm();
    document.getElementById('properties-modal-overlay').classList.remove('hidden');
  }

  // ── Open for individual shape ─────────────────────────────────────────────
  function openForShape(shapeId) {
    _activeShapeId = shapeId;
    const tabShape = document.getElementById('tab-shape');
    tabShape.classList.remove('hidden');
    tabShape.style.display = 'block';
    _switchTab('form-shape');
    _populateShapeForm(shapeId);
    document.getElementById('properties-modal-overlay').classList.remove('hidden');
  }

  function close() {
    document.getElementById('properties-modal-overlay').classList.add('hidden');
  }

  function apply() {
    if (_activeMode === 'form-canvas') {
      _applyCanvasForm();
    } else if (_activeMode === 'form-rectangle') {
      _applyRectangleForm();
    } else if (_activeMode === 'form-circle') {
      _applyCircleForm();
    } else if (_activeMode === 'form-shape' && _activeShapeId) {
      _applyShapeForm();
    }
    close();
  }

  // ── Canvas populate/apply ─────────────────────────────────────────────────
  function _populateCanvasForm() {
    const canvas = CanvasState.getCanvas();
    if (!canvas) return;
    _sel.bg   = canvas.BackgroundColor || PALETTE[7];
    _sel.grid = canvas.GridColor       || PALETTE[8];
    _updateActiveSwatches('swatch-grid-bg',   _sel.bg);
    _updateActiveSwatches('swatch-grid-grid', _sel.grid);
    document.getElementById('prop-grid-visible').checked  = canvas.GridVisible !== false;
    document.getElementById('prop-grid-x').value          = canvas.GridSpacingX || 25;
    document.getElementById('prop-grid-y').value          = canvas.GridSpacingY || 25;
    document.getElementById('prop-show-origin').checked   = canvas.ShowOriginMarker !== false;
    document.getElementById('prop-show-axes').checked     = canvas.ShowAxes !== false;
  }

  function _applyCanvasForm() {
    CanvasState.updateCanvas({
      BackgroundColor:  _sel.bg,
      GridVisible:      document.getElementById('prop-grid-visible').checked,
      GridColor:        _sel.grid,
      GridSpacingX:     parseInt(document.getElementById('prop-grid-x').value, 10),
      GridSpacingY:     parseInt(document.getElementById('prop-grid-y').value, 10),
      ShowOriginMarker: document.getElementById('prop-show-origin').checked,
      ShowAxes:         document.getElementById('prop-show-axes').checked,
    });
    RenderCanvas.render();
    if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
  }

  // ── Rectangle global defaults populate/apply ──────────────────────────────
  function _populateRectangleForm() {
    const gv = CanvasState.getGlobalVars().rectangle;
    _sel.rectFill          = gv.defaultFillColor;
    _sel.rectStroke        = gv.defaultStrokeColor;
    _sel.rectResizeDefault = gv.resizeControlPointDefaultColor;
    _sel.rectResizeHover   = gv.resizeControlPointHoverColor;
    _updateActiveSwatches('swatch-rect-fill',           _sel.rectFill);
    _updateActiveSwatches('swatch-rect-stroke',         _sel.rectStroke);
    _updateActiveSwatches('swatch-rect-resize-default', _sel.rectResizeDefault);
    _updateActiveSwatches('swatch-rect-resize-hover',   _sel.rectResizeHover);
    document.getElementById('prop-rect-hover-ratio').value      = gv.hoverPaddingRatio;
    document.getElementById('prop-rect-protection-ratio').value = gv.protectionPaddingRatio;
  }

  function _applyRectangleForm() {
    const hRatio = parseFloat(document.getElementById('prop-rect-hover-ratio').value);
    const pRatio = parseFloat(document.getElementById('prop-rect-protection-ratio').value);
    if (pRatio <= hRatio) {
      document.getElementById('rect-padding-hint').style.color = '#f87171';
      alert('Protection Padding Ratio must be greater than Hover Padding Ratio.');
      return;
    }
    document.getElementById('rect-padding-hint').style.color = '';
    CanvasState.updateGlobalVar('rectangle', {
      defaultFillColor:              _sel.rectFill,
      defaultStrokeColor:            _sel.rectStroke,
      hoverPaddingRatio:             hRatio,
      protectionPaddingRatio:        pRatio,
      resizeControlPointDefaultColor: _sel.rectResizeDefault,
      resizeControlPointHoverColor:  _sel.rectResizeHover,
    });
  }

  // ── Circle global defaults populate/apply ─────────────────────────────────
  function _populateCircleForm() {
    const gv = CanvasState.getGlobalVars().circle;
    _sel.circleFill          = gv.defaultFillColor;
    _sel.circleStroke        = gv.defaultStrokeColor;
    _sel.circleResizeDefault = gv.resizeControlPointDefaultColor;
    _sel.circleResizeHover   = gv.resizeControlPointHoverColor;
    _updateActiveSwatches('swatch-circle-fill',           _sel.circleFill);
    _updateActiveSwatches('swatch-circle-stroke',         _sel.circleStroke);
    _updateActiveSwatches('swatch-circle-resize-default', _sel.circleResizeDefault);
    _updateActiveSwatches('swatch-circle-resize-hover',   _sel.circleResizeHover);
    document.getElementById('prop-circle-hover-ratio').value      = gv.hoverPaddingRatio;
    document.getElementById('prop-circle-protection-ratio').value = gv.protectionPaddingRatio;
  }

  function _applyCircleForm() {
    const hRatio = parseFloat(document.getElementById('prop-circle-hover-ratio').value);
    const pRatio = parseFloat(document.getElementById('prop-circle-protection-ratio').value);
    if (pRatio <= hRatio) {
      document.getElementById('circle-padding-hint').style.color = '#f87171';
      alert('Protection Padding Ratio must be greater than Hover Padding Ratio.');
      return;
    }
    document.getElementById('circle-padding-hint').style.color = '';
    CanvasState.updateGlobalVar('circle', {
      defaultFillColor:              _sel.circleFill,
      defaultStrokeColor:            _sel.circleStroke,
      hoverPaddingRatio:             hRatio,
      protectionPaddingRatio:        pRatio,
      resizeControlPointDefaultColor: _sel.circleResizeDefault,
      resizeControlPointHoverColor:  _sel.circleResizeHover,
    });
  }

  // ── Individual shape form populate/apply ──────────────────────────────────
  function _populateShapeForm(shapeId) {
    const shape = CanvasState.getShapes().find(s => s.ShapeID === shapeId);
    if (!shape) return;
    _sel.stroke = shape.StrokeColor || shape.Color || PALETTE[0];
    _sel.fill   = shape.FillColor   || shape.Color || PALETTE[0];
    _updateActiveSwatches('swatch-grid-stroke', _sel.stroke);
    _updateActiveSwatches('swatch-grid-fill',   _sel.fill);
    document.getElementById('prop-shape-width').value  = shape.Width;
    document.getElementById('prop-shape-height').value = shape.Height;
  }

  function _applyShapeForm() {
    const w = parseInt(document.getElementById('prop-shape-width').value, 10);
    const h = parseInt(document.getElementById('prop-shape-height').value, 10);
    const shape = CanvasState.getShapes().find(s => s.ShapeID === _activeShapeId);
    if (!shape) return;

    let newSvg = shape.SvgIcon;
    if (newSvg) {
      newSvg = newSvg.replace(/fill="([^"]*)"/g,   (m, p) => p === 'none' || p === 'currentColor' ? m : `fill="${_sel.fill}"`);
      newSvg = newSvg.replace(/stroke="([^"]*)"/g, (m, p) => p === 'none' || p === 'currentColor' ? m : `stroke="${_sel.stroke}"`);
    }
    CanvasState.updateShape(_activeShapeId, {
      Width: w, Height: h,
      StrokeColor: _sel.stroke, FillColor: _sel.fill,
      Color: _sel.fill, SvgIcon: newSvg,
    });
    RenderCanvas.render();
    if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
  }

  // ── Swatch highlight helper ───────────────────────────────────────────────
  function _updateActiveSwatches(containerId, color) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.prop-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.color.toLowerCase() === (color || '').toLowerCase());
    });
  }

  return { init, openForCanvas, openForShape, close };

})();
