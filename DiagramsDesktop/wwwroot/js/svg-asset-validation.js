/**
 * svg-asset-validation.js
 * =======================
 * Sanitizes and validates SVG XML inputs to block XSS (script tags, event handlers) and ensure valid XML format.
 */

'use strict';

const SvgAssetValidation = (() => {

  /**
   * validate
   * Validates an SVG content string.
   * @param {string} svgContent - Raw SVG content to validate.
   * @returns {Object} { ok: boolean, reason: string|null }
   */
  function validate(svgContent) {
    if (!svgContent || typeof svgContent !== 'string') {
      return { ok: false, reason: 'SVG content must be a non-empty string' };
    }

    // 1. Script tag check (XSS prevention)
    if (/<script/i.test(svgContent) || /<\/script/i.test(svgContent)) {
      return { ok: false, reason: 'Security violation: script tags are not allowed in SVGs.' };
    }

    // 2. Inline Javascript handlers check (e.g. onload, onclick)
    if (/\bon[a-z]+\s*=/i.test(svgContent)) {
      return { ok: false, reason: 'Security violation: inline JS event handlers are not allowed in SVGs.' };
    }

    // 3. XML Structure validation using browser DOMParser
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return { ok: false, reason: `XML Parsing Error: ${parserError.textContent}` };
      }

      if (doc.documentElement.nodeName.toLowerCase() !== 'svg') {
        return { ok: false, reason: 'Invalid root node: root element must be an <svg> tag.' };
      }
    } catch (err) {
      return { ok: false, reason: `Parser exception: ${err.message}` };
    }

    return { ok: true };
  }

  return {
    validate
  };

})();
