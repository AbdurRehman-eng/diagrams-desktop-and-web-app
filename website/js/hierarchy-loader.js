/**
 * hierarchy-loader.js
 * ===================
 * Dynamically loads parent-child boundary rules from a CSV file
 * and maps them to the ShapeCategories definitions.
 */

'use strict';

const HierarchyLoader = (() => {

  async function load() {
    try {
      console.log('[HierarchyLoader] Fetching data/Diagram Child Parent.csv...');
      const response = await fetch('data/Diagram%20Child%20Parent.csv?t=' + Date.now());
      
      if (!response.ok) {
        console.warn(`[HierarchyLoader] Could not load hierarchy CSV (${response.status}). Shape parent-child rules will not be enforced.`);
        return false;
      }

      const csvText = await response.text();
      _parseAndApplyCsv(csvText);
      return true;

    } catch (err) {
      console.error('[HierarchyLoader] Error loading hierarchy CSV:', err);
      return false;
    }
  }

  function _parseAndApplyCsv(csvText) {
    if (!csvText) return;

    // Split into lines and filter empty
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return; // Only header

    // Start from line 1 to skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split, assuming no quotes
      const parts = line.split(',');
      if (parts.length < 2) continue;

      const rawChild = parts[0].trim();
      const rawParent = parts[1].trim();

      // Find the target child shape in ShapeCategories
      const childShape = _findShapeByFuzzyLabel(rawChild);
      if (!childShape) {
        console.warn(`[HierarchyLoader] Unmatched child shape in CSV: "${rawChild}"`);
        continue;
      }

      // Determine parent logic
      if (rawParent.toLowerCase() === 'null' || rawParent === '') {
        childShape.parentType = null;
        console.log(`[HierarchyLoader] Applied: ${childShape.label} -> ROOT (No Parent)`);
      } else {
        // Handle "OR" separated multiple parents
        const parentParts = rawParent.split(/\s+OR\s+/i);
        const parentTypes = [];

        parentParts.forEach(p => {
          const parentShape = _findShapeByFuzzyLabel(p.trim());
          if (parentShape) {
            parentTypes.push(parentShape.type);
          } else {
            console.warn(`[HierarchyLoader] Unmatched parent shape in CSV: "${p}"`);
          }
        });

        if (parentTypes.length === 0) {
           childShape.parentType = null;
        } else if (parentTypes.length === 1) {
           childShape.parentType = parentTypes[0];
        } else {
           childShape.parentType = parentTypes; // array for multiple allowed
        }
        
        console.log(`[HierarchyLoader] Applied: ${childShape.label} -> [${parentTypes.join(', ')}]`);
      }
    }
  }

  function _findShapeByFuzzyLabel(rawLabel) {
    if (!ShapeCategories) return null;

    const normalize = (s) => s.toLowerCase().trim();
    const stripAwsPrefix = (s) => s.toLowerCase().replace(/^aws\s+/, '').trim();

    const searchNorm     = normalize(rawLabel);
    const searchStripped = stripAwsPrefix(rawLabel);

    const items = ShapeCategories.getAllItems();

    // 1. Exact label match (case-insensitive)
    let found = items.find(item => normalize(item.label) === searchNorm);
    if (found) return found;

    // 2. Strip "aws " prefix from search term, then match against stripped label
    found = items.find(item => stripAwsPrefix(item.label) === searchStripped);
    if (found) return found;

    // 3. Match search against item type string (e.g. "aws-subnet")
    found = items.find(item => normalize(item.type) === normalize(rawLabel));
    if (found) return found;

    return null;
  }

  return { load };

})();
