/**
 * canvasconfig.js
 * ================
 * Default configuration constants for the DiagramCanvas.
 *
 * BUG-20 fix: Added AXIS_ORIENTATION_Z, IS_INFINITE_X/Y/Z defaults.
 */

'use strict';

const CanvasConfig = {
  DEFAULT_CANVAS_NAME:       'MainCanvasViewport',
  DEFAULT_BACKGROUND_COLOR:  '#f8fafc',   // Slate 50
  DEFAULT_GRID_COLOR:        '#e2e8f0',   // Slate 200
  DEFAULT_GRID_SPACING:      25,

  DEFAULT_VIEWPORT_WIDTH:    1000,
  DEFAULT_VIEWPORT_HEIGHT:   800,

  MIN_ZOOM:   0.1,
  MAX_ZOOM:   5.0,
  ZOOM_STEP:  0.1,

  COORDINATE_SYSTEM: 'CenterBasedWorld',
  ORIGIN_DEFINITION: 'Center',

  AXIS_ORIENTATION_X: 'RightPositive',
  AXIS_ORIENTATION_Y: 'UpPositive',
  AXIS_ORIENTATION_Z: 'FrontPositive',   // BUG-20 fix: was missing

  IS_INFINITE_X: true,                   // BUG-20 fix: was missing
  IS_INFINITE_Y: true,                   // BUG-20 fix: was missing
  IS_INFINITE_Z: true,                   // BUG-20 fix: was missing

  DEBUG_UPDATE_INTERVAL_MS: 100
};
