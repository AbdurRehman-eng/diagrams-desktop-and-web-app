/**
 * theme-controller.js
 * ===================
 * Manages the application's light/dark mode state.
 * Syncs the theme class on document.body and updates default canvas
 * background/grid colors in CanvasState accordingly.
 */

'use strict';

const ThemeController = (() => {
  const STORAGE_KEY = 'diagram-theme';
  const CLASS_DARK = 'dark-theme';

  function init() {
    // Check local storage or system preference
    let savedTheme = localStorage.getItem(STORAGE_KEY);
    if (!savedTheme) {
      // Default to light theme for baseline, but check system preferences
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      savedTheme = prefersDark ? 'dark' : 'light';
    }

    setTheme(savedTheme === 'dark');
  }

  function toggle() {
    const isCurrentlyDark = document.body.classList.contains(CLASS_DARK);
    setTheme(!isCurrentlyDark);
  }

  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add(CLASS_DARK);
      localStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      document.body.classList.remove(CLASS_DARK);
      localStorage.setItem(STORAGE_KEY, 'light');
    }

    // Sync canvas background and grid colors if they are defaults
    if (typeof CanvasState !== 'undefined') {
      const canvas = CanvasState.getCanvas();
      if (canvas) {
        // Detect current values and check if they match defaults
        const currentBg = (canvas.BackgroundColor || '').toLowerCase();
        const currentGrid = (canvas.GridColor || '').toLowerCase();

        const lightBgDefaults = ['#f1f5f9', '#f8fafc', '#ffffff'];
        const darkBgDefaults = ['#0d1017', '#0f172a', '#1e293b'];
        const lightGridDefaults = ['#cbd5e1', '#e2e8f0', '#94a3b8'];
        const darkGridDefaults = ['#2e3650', '#334155', '#1e293d'];

        const isDefaultBg = lightBgDefaults.includes(currentBg) || darkBgDefaults.includes(currentBg);
        const isDefaultGrid = lightGridDefaults.includes(currentGrid) || darkGridDefaults.includes(currentGrid);

        if (isDefaultBg) {
          canvas.BackgroundColor = isDark ? '#0d1017' : '#f1f5f9';
        }
        if (isDefaultGrid) {
          canvas.GridColor = isDark ? '#2e3650' : '#cbd5e1';
        }

        // Trigger rerender of the canvas background and grid
        if (typeof RenderCanvas !== 'undefined') {
          RenderCanvas.render();
        }
      }
    }

    // Update status message if available
    const statusMsg = document.getElementById('status-message');
    if (statusMsg) {
      statusMsg.textContent = `Theme updated: ${isDark ? 'Dark Mode' : 'Light Mode'}`;
      setTimeout(() => {
        if (statusMsg.textContent.startsWith('Theme updated:')) {
          statusMsg.textContent = 'Ready';
        }
      }, 3000);
    }
  }

  return {
    init,
    toggle,
    isDark: () => document.body.classList.contains(CLASS_DARK)
  };
})();
