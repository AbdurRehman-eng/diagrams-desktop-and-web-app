/**
 * commit-console.js
 * =================
 * Handles trigger UI and the step-by-step progress logging in the Commit modal.
 */

'use strict';

const CommitConsole = (() => {

  const BASE_URL = '/api/DiagramActions';
  let _isOpen = false;

  function init() {
    const btn = document.getElementById('btn-commit-plan');
    if (btn) {
      if (typeof Licensing !== 'undefined' && !Licensing.hasEntitlement('live_deployment')) {
        btn.disabled = true;
        btn.title = "Upgrade to GML Professional to enable live topology deployments.";
        btn.style.backgroundColor = '#475569';
        btn.style.cursor = 'not-allowed';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
        };
      } else {
        btn.disabled = false;
        btn.title = "Commit AWS plan";
        btn.style.backgroundColor = '#2563eb';
        btn.style.cursor = 'pointer';
        btn.onclick = open;
      }
    }
  }

  function open() {
    const activeDiagram = CanvasState.getActiveDiagram();
    if (!activeDiagram) {
      alert('No active diagram to commit.');
      return;
    }

    _isOpen = true;
    const overlay = document.getElementById('commit-console-overlay');
    if (overlay) overlay.classList.remove('hidden');

    const logDiv = document.getElementById('commit-console-log');
    if (logDiv) logDiv.innerHTML = '';

    const statusDiv = document.getElementById('commit-console-status');
    if (statusDiv) {
      statusDiv.textContent = 'Initializing commit transaction...';
      statusDiv.style.color = '#94a3b8';
    }

    const closeBtn = document.getElementById('btn-commit-close');
    if (closeBtn) closeBtn.style.display = 'none';

    // Freeze diagram UI interactions
    document.getElementById('app-root').classList.add('interface-locked');

    _log('>>> STARTING AWS COMMIT WORKFLOW');
    _log(`>>> Diagram ID: ${activeDiagram.DiagramID}`);
    _log('>>> Freezing diagram editor...');
    
    // Trigger commit call
    setTimeout(startCommit, 800);
  }

  function close() {
    _isOpen = false;
    const overlay = document.getElementById('commit-console-overlay');
    if (overlay) overlay.classList.add('hidden');

    // Unfreeze diagram UI
    document.getElementById('app-root').classList.remove('interface-locked');
  }

  async function startCommit() {
    const activeDiagram = CanvasState.getActiveDiagram();
    if (!activeDiagram) return;

    _log('>>> Contacting local API server...');

    try {
      const response = await fetch(`${BASE_URL}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ DiagramID: activeDiagram.DiagramID })
      });

      const result = await response.json();

      if (!response.ok || !result.Success) {
        _log('!!! COMMIT VALIDATION OR EXECUTION FAILED');
        if (result.ValidationErrors && result.ValidationErrors.length > 0) {
          result.ValidationErrors.forEach(err => {
            _log(`ERROR: ${err}`, 'error');
          });
        }
        if (result.Steps && result.Steps.length > 0) {
          result.Steps.forEach(step => {
            if (step.Result === 'Failed') {
              _log(`FAILED: ${step.Action} (${step.GmlID}) - ${step.FailureReason}`, 'error');
            } else {
              _log(`SUCCESS: ${step.Action} (${step.GmlID}) -> ${step.ProviderResourceID}`);
            }
          });
        }
        
        _setStatus('Commit Rejected', '#f87171');
        _log(`Reference Number: ${result.CorrelationID || 'N/A'}`);
        
        const closeBtn = document.getElementById('btn-commit-close');
        if (closeBtn) closeBtn.style.display = 'block';
        return;
      }

      // Success! Playback the steps log for nice UX
      _log(`>>> Commit transaction accepted. Reference ID: ${result.CorrelationID}`);
      _log('>>> Temporary actions file deleted.');
      _log('>>> Processing AWS adapter provisioning...');

      let delay = 0;
      result.Steps.forEach((step, idx) => {
        setTimeout(() => {
          if (step.Result === 'Success') {
            _log(`[Step ${idx+1}/${result.Steps.length}] SUCCESS: ${step.Action} (${step.GmlID}) -> ${step.ProviderResourceID}`);
          } else {
            _log(`[Step ${idx+1}/${result.Steps.length}] FAILED: ${step.Action} (${step.GmlID})`, 'error');
          }
          
          if (idx === result.Steps.length - 1) {
            _log('>>> AWS adapter provisioning completed successfully.');
            _log('>>> Updating diagram state...');
            
            // Mark clean
            if (typeof DirtyTracker !== 'undefined') {
              DirtyTracker.markClean();
            }
            
            _setStatus('Commit Successful!', '#4ade80');
            const closeBtn = document.getElementById('btn-commit-close');
            if (closeBtn) closeBtn.style.display = 'block';
          }
        }, delay);
        delay += 300; // 300ms between steps
      });

    } catch (err) {
      _log(`!!! CONNECTION ERROR: ${err.message}`, 'error');
      _setStatus('Network Failure', '#f87171');
      const closeBtn = document.getElementById('btn-commit-close');
      if (closeBtn) closeBtn.style.display = 'block';
    }
  }

  function _log(message, type = 'info') {
    const logDiv = document.getElementById('commit-console-log');
    if (!logDiv) return;

    const line = document.createElement('div');
    line.style.marginBottom = '4px';
    if (type === 'error') {
      line.style.color = '#f87171';
    } else {
      line.style.color = '#10b981';
    }
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(line);
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  function _setStatus(text, color) {
    const statusDiv = document.getElementById('commit-console-status');
    if (statusDiv) {
      statusDiv.textContent = text;
      statusDiv.style.color = color;
    }
  }

  return { init, open, close };
})();
