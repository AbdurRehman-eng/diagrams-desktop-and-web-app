/**
 * connection-mode-state.js
 * ========================
 * Stores the runtime state of the Connect-To workflow (source and destination shapes).
 */
'use strict';

const ConnectionModeState = (() => {

  let _isActive = false;
  let _sourceShapeId = null;
  let _destinationShapeId = null;

  return {
    get isActive() { return _isActive; },
    set isActive(val) { _isActive = val; },

    get sourceShapeId() { return _sourceShapeId; },
    set sourceShapeId(val) { _sourceShapeId = val; },

    get destinationShapeId() { return _destinationShapeId; },
    set destinationShapeId(val) { _destinationShapeId = val; },

    reset() {
      _isActive = false;
      _sourceShapeId = null;
      _destinationShapeId = null;
      console.log('[ConnectionModeState] Reset.');
    }
  };

})();
