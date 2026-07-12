/**
 * open-diagram-json.js
 * =====================
 */

'use strict';

const OpenDiagramJson = (() => {

  function open() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        ParseDiagramJson.parse(content);
      };
      reader.readAsText(file);
    };

    input.click();
  }

  function init() {
    const btn = document.getElementById('btn-open-json');
    if (btn) btn.addEventListener('click', open);
  }

  return { init, open };

})();
