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
                <div class="prop-row" style="margin-top:12px;">
                  <div class="prop-label">Troubleshooting console visible</div>
                  <div class="prop-checkbox-wrap">
                    <input type="checkbox" class="prop-input" id="prop-trouble-visible" />
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

                <div class="prop-section-title" style="margin-top:16px;">SVG Attachments</div>
                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
                  <div class="prop-label">Upload custom SVG</div>
                  <input type="file" id="prop-svg-upload-file" accept=".svg" style="font-size: 11px; margin-top: 4px;" />
                  <div id="prop-svg-upload-error" style="color: #f87171; font-size: 10px; margin-top: 4px;" class="hidden"></div>
                </div>

                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px;margin-top:12px;">
                  <div class="prop-label">Attach Existing Asset</div>
                  <select id="prop-svg-asset-select" class="prop-input" style="width: 100%; font-size:12px;"></select>
                  <button type="button" class="prop-btn" id="btn-prop-attach-svg" style="margin-top: 6px; padding: 4px 8px; font-size: 11px;">Attach</button>
                </div>

                <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:4px;margin-top:12px;">
                  <div class="prop-label">Active Attachments</div>
                  <div id="prop-svg-attachments-list" style="width: 100%; display: flex; flex-direction: column; gap: 6px;"></div>
                </div>

                <!-- SVG Attachment Configuration Subform (Hidden unless an attachment is selected) -->
                <div id="prop-svg-attachment-details" class="hidden" style="border: 1px solid var(--color-border); border-radius: 6px; padding: 10px; margin-top: 12px; background-color: var(--color-bg-secondary);">
                  <div class="prop-label" style="font-weight: 600; margin-bottom: 8px;">Attachment Settings</div>
                  <div class="prop-row">
                    <div class="prop-label">Fitting Type</div>
                    <select id="prop-svg-fit-type" class="prop-input" style="font-size:12px;">
                      <option value="fit-aspect">Fit Aspect Ratio</option>
                      <option value="fit-stretch">Stretch to Fill</option>
                      <option value="custom-offset">Custom Scaling & Offset</option>
                    </select>
                  </div>
                  <div id="prop-svg-custom-settings" class="hidden">
                    <div class="prop-row" style="margin-top: 8px;">
                      <div class="prop-label">Scale X</div>
                      <input type="number" id="prop-svg-scale-x" class="prop-input" step="0.05" min="0.05" max="5.0" style="font-size:12px;" />
                    </div>
                    <div class="prop-row">
                      <div class="prop-label">Scale Y</div>
                      <input type="number" id="prop-svg-scale-y" class="prop-input" step="0.05" min="0.05" max="5.0" style="font-size:12px;" />
                    </div>
                    <div class="prop-row">
                      <div class="prop-label">Offset X</div>
                      <input type="number" id="prop-svg-offset-x" class="prop-input" step="1" style="font-size:12px;" />
                    </div>
                    <div class="prop-row">
                      <div class="prop-label">Offset Y</div>
                      <input type="number" id="prop-svg-offset-y" class="prop-input" step="1" style="font-size:12px;" />
                    </div>
                  </div>
                  <div class="prop-row" style="margin-top: 10px; justify-content: flex-end; gap: 8px;">
                    <button type="button" class="prop-btn" id="btn-prop-remove-svg" style="background-color: #ef4444; color: white; padding: 4px 8px; font-size: 11px;">Remove</button>
                    <button type="button" class="prop-btn" id="btn-prop-save-svg-settings" style="padding: 4px 8px; font-size: 11px;">Save Settings</button>
                  </div>
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

    // SVG Attachments event bindings
    const fileInput = document.getElementById('prop-svg-upload-file');
    const assetSelect = document.getElementById('prop-svg-asset-select');
    const attachBtn = document.getElementById('btn-prop-attach-svg');
    const fitSelect = document.getElementById('prop-svg-fit-type');
    const customSettings = document.getElementById('prop-svg-custom-settings');
    const removeBtn = document.getElementById('btn-prop-remove-svg');
    const saveSettingsBtn = document.getElementById('btn-prop-save-svg-settings');
    const uploadError = document.getElementById('prop-svg-upload-error');

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        try {
          if (typeof SvgAttachmentManager === 'undefined') throw new Error('SvgAttachmentManager module not loaded.');
          const asset = SvgAttachmentManager.addAsset(CanvasState.getActiveDiagram(), file.name, text);
          uploadError.classList.add('hidden');
          uploadError.textContent = '';
          fileInput.value = ''; // Reset input
          _refreshAssetDropdown();
          assetSelect.value = asset.AssetID;
        } catch (err) {
          uploadError.textContent = err.message;
          uploadError.classList.remove('hidden');
        }
      };
      reader.readAsText(file);
    };

    attachBtn.onclick = () => {
      const assetId = assetSelect.value;
      if (!assetId) {
        alert('Please upload or select an SVG asset first.');
        return;
      }
      try {
        if (typeof SvgAttachmentManager === 'undefined') throw new Error('SvgAttachmentManager module not loaded.');
        const att = SvgAttachmentManager.attachAsset(CanvasState.getActiveDiagram(), assetId, _activeShapeId);
        _refreshAttachmentsList();
        _selectAttachment(att.AttachmentID);
        RenderCanvas.render();
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
      } catch (err) {
        alert(err.message);
      }
    };

    fitSelect.onchange = () => {
      if (fitSelect.value === 'custom-offset') {
        customSettings.classList.remove('hidden');
      } else {
        customSettings.classList.add('hidden');
      }
    };

    saveSettingsBtn.onclick = () => {
      if (!_selectedAttachmentId) return;
      const updates = {
        FittingType: fitSelect.value,
        ScaleX: parseFloat(document.getElementById('prop-svg-scale-x').value) || 1.0,
        ScaleY: parseFloat(document.getElementById('prop-svg-scale-y').value) || 1.0,
        OffsetX: parseFloat(document.getElementById('prop-svg-offset-x').value) || 0,
        OffsetY: parseFloat(document.getElementById('prop-svg-offset-y').value) || 0
      };
      if (typeof SvgAttachmentManager !== 'undefined') {
        SvgAttachmentManager.updateAttachment(CanvasState.getActiveDiagram(), _selectedAttachmentId, updates);
        _refreshAttachmentsList();
        RenderCanvas.render();
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
      }
    };

    removeBtn.onclick = () => {
      if (!_selectedAttachmentId) return;
      if (confirm('Are you sure you want to remove this SVG attachment?')) {
        if (typeof SvgAttachmentManager !== 'undefined') {
          SvgAttachmentManager.removeAttachment(CanvasState.getActiveDiagram(), _selectedAttachmentId);
          _selectedAttachmentId = null;
          document.getElementById('prop-svg-attachment-details').classList.add('hidden');
          _refreshAttachmentsList();
          RenderCanvas.render();
          if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
        }
      }
    };

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
    document.getElementById('prop-trouble-visible').checked = !!canvas.TroubleshootingConsoleVisible;
    document.getElementById('prop-grid-x').value          = canvas.GridSpacingX || 25;
    document.getElementById('prop-grid-y').value          = canvas.GridSpacingY || 25;
    document.getElementById('prop-show-origin').checked   = canvas.ShowOriginMarker !== false;
    document.getElementById('prop-show-axes').checked     = canvas.ShowAxes !== false;
  }

  function _applyCanvasForm() {
    CanvasState.updateCanvas({
      BackgroundColor:  _sel.bg,
      GridVisible:      document.getElementById('prop-grid-visible').checked,
      TroubleshootingConsoleVisible: document.getElementById('prop-trouble-visible').checked,
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

    // M12: Populate custom SVG list and dropdowns
    _selectedAttachmentId = null;
    const detailsDiv = document.getElementById('prop-svg-attachment-details');
    if (detailsDiv) detailsDiv.classList.add('hidden');
    _refreshAssetDropdown();
    _refreshAttachmentsList();
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

  // ── M12 SVG attachment helper functions ────────────────────────────────────
  let _selectedAttachmentId = null;

  function _refreshAssetDropdown() {
    const select = document.getElementById('prop-svg-asset-select');
    if (!select) return;
    select.innerHTML = '';
    const assets = typeof CanvasState !== 'undefined' ? CanvasState.getSvgAssets() : [];
    if (assets.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- No SVG Assets Uploaded --';
      select.appendChild(opt);
      return;
    }
    assets.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.AssetID;
      opt.textContent = a.AssetName;
      select.appendChild(opt);
    });
  }

  function _refreshAttachmentsList() {
    const list = document.getElementById('prop-svg-attachments-list');
    if (!list) return;
    list.innerHTML = '';
    if (typeof CanvasState === 'undefined' || typeof SvgAttachmentManager === 'undefined') return;

    const atts = SvgAttachmentManager.getAttachmentsForShape(CanvasState.getActiveDiagram(), _activeShapeId);
    if (atts.length === 0) {
      list.innerHTML = '<div style="font-size: 11px; color: var(--color-text-secondary); font-style:italic;">No active attachments for this shape.</div>';
      return;
    }

    atts.forEach(att => {
      const asset = CanvasState.getSvgAssets().find(a => a.AssetID === att.AssetID);
      const name = asset ? asset.AssetName : 'Unknown Asset';

      const row = document.createElement('div');
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border: 1px solid var(--color-border); border-radius: 4px; background-color: var(--color-bg-tertiary); cursor: pointer; font-size: 11px;';
      if (_selectedAttachmentId === att.AttachmentID) {
        row.style.borderColor = 'var(--color-primary-active, #3b82f6)';
        row.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      }
      row.onclick = () => _selectAttachment(att.AttachmentID);

      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      row.appendChild(nameSpan);

      const typeSpan = document.createElement('span');
      typeSpan.style.fontSize = '9px';
      typeSpan.style.color = 'var(--color-text-secondary, #64748b)';
      typeSpan.textContent = att.FittingType || 'fit-aspect';
      row.appendChild(typeSpan);

      list.appendChild(row);
    });
  }

  function _selectAttachment(attId) {
    _selectedAttachmentId = attId;
    if (typeof CanvasState === 'undefined') return;
    const att = CanvasState.getSvgAttachments().find(a => a.AttachmentID === attId);
    if (!att) return;

    document.getElementById('prop-svg-fit-type').value = att.FittingType || 'fit-aspect';
    document.getElementById('prop-svg-scale-x').value = att.ScaleX !== undefined ? att.ScaleX : 1.0;
    document.getElementById('prop-svg-scale-y').value = att.ScaleY !== undefined ? att.ScaleY : 1.0;
    document.getElementById('prop-svg-offset-x').value = att.OffsetX !== undefined ? att.OffsetX : 0;
    document.getElementById('prop-svg-offset-y').value = att.OffsetY !== undefined ? att.OffsetY : 0;

    const customSettings = document.getElementById('prop-svg-custom-settings');
    if (att.FittingType === 'custom-offset') {
      customSettings.classList.remove('hidden');
    } else {
      customSettings.classList.add('hidden');
    }

    document.getElementById('prop-svg-attachment-details').classList.remove('hidden');
    _refreshAttachmentsList();
  }

  return { init, openForCanvas, openForShape, close };

})();
