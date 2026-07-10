/**
 * dropdown-controller.js
 * ======================
 * Manages UI interactions for the File and Edit dropdown menus.
 */

'use strict';

const DropdownController = (() => {

  function init() {
    // 1. Setup Click listeners on the buttons
    const dropdownBtns = document.querySelectorAll('.dropdown-btn');
    dropdownBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = btn.closest('.dropdown');
        const isOpen = parent.classList.contains('open');
        
        // Close all others first
        _closeAllDropdowns();
        
        if (!isOpen) {
          parent.classList.add('open');
        }
      });
    });

    // 2. Click outside to close
    document.addEventListener('click', () => {
      _closeAllDropdowns();
    });

    // 3. Prevent clicking inside menu from closing unless it's an item
    const menus = document.querySelectorAll('.dropdown-menu');
    menus.forEach(menu => {
      menu.addEventListener('click', (e) => {
        // If they click an actual item, close it
        if (e.target.closest('.dropdown-item')) {
           _closeAllDropdowns();
        } else {
           e.stopPropagation();
        }
      });
    });

    console.log('[DropdownController] Initialized.');
  }

  function _closeAllDropdowns() {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
  }

  return { init };

})();
