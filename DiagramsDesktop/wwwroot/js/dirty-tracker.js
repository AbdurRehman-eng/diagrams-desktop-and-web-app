/**
 * dirty-tracker.js
 * ================
 * Tracks whether the diagram has unsaved changes.
 * Registers the beforeunload handler to warn the user on page refresh/close.
 *
 * Fix 4 & 5: Prevent accidental data loss on refresh or browser close.
 */

'use strict';

const DirtyTracker = (() => {

  let _isDirty = false;

  function markDirty() {
    _isDirty = true;
  }

  function markClean() {
    _isDirty = false;
  }

  function isDirty() {
    return _isDirty;
  }

  function init() {
    // Register the native browser beforeunload warning
    window.addEventListener('beforeunload', (e) => {
      if (!_isDirty) return;
      // Modern browsers show their own standard dialog; the message is ignored by most.
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    });

    console.log('[DirtyTracker] Initialized — will warn on unsaved changes.');
  }

  return { init, markDirty, markClean, isDirty };

})();
