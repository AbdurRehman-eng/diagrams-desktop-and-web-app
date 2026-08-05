/**
 * licensing.js
 * ============
 * Coordinates licensing checks, activation modal screens, and advertisements.
 */

'use strict';

const Licensing = (() => {

  const BASE_URL = '/api/license';

  async function init() {
    console.log('[Licensing] Initializing check...');
    await checkStatus();
    await checkUpdatesOnStartup();
  }

  async function checkStatus() {
    try {
      const response = await fetch(`${BASE_URL}/status`);
      if (!response.ok) {
        throw new Error(`Failed to check license status (HTTP ${response.status})`);
      }
      
      const status = await response.json();
      console.log('[Licensing] Status check response:', status);

      const activationOverlay = document.getElementById('activation-overlay');
      const violationOverlay = document.getElementById('violation-overlay');

      if (!status.isActivated) {
        // Show Activation overlay
        if (activationOverlay) activationOverlay.classList.remove('hidden');
        if (violationOverlay) violationOverlay.classList.add('hidden');
        blockInterface(true);
      } 
      else if (status.isViolating) {
        // Show Violation overlay
        if (activationOverlay) activationOverlay.classList.add('hidden');
        if (violationOverlay) {
          violationOverlay.classList.remove('hidden');
          
          document.getElementById('violation-title').textContent = status.violationTitle || 'License Violation';
          document.getElementById('violation-message').textContent = status.violationMessage || 'An active license violation was detected.';
        }
        blockInterface(true);
      } 
      else {
        // License is OK! Hide overlays and unlock editor
        if (activationOverlay) activationOverlay.classList.add('hidden');
        if (violationOverlay) violationOverlay.classList.add('hidden');
        blockInterface(false);

        // Display ad if configured on the server
        if (status.latestAd && status.latestAd.has_ad) {
          showAd(status.latestAd);
        } else {
          hideAd();
        }
      }
    } catch (err) {
      console.error('[Licensing] Status check error:', err);
      // If the local server is running but remote API fails and grace period is not resolved yet
      showToast('activation-status-msg', `Connection Error: ${err.message}`, 'error');
    }
  }

  async function activateProductKey() {
    const keyInput = document.getElementById('product-key-input');
    const btn = document.getElementById('btn-activate-submit');
    const msgId = 'activation-status-msg';

    if (!keyInput) return;
    const key = keyInput.value.trim();

    if (!key) {
      showToast(msgId, 'Please enter a product key.', 'error');
      return;
    }

    // Disable input and button
    if (btn) btn.disabled = true;
    keyInput.disabled = true;
    showToast(msgId, 'Contacting validation server... Please wait.', 'info');

    try {
      const response = await fetch(`${BASE_URL}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProductKey: key })
      });

      const res = await response.json();

      if (response.ok && res.registered) {
        showToast(msgId, 'Activation Successful! Unlocking editor...', 'info');
        keyInput.value = '';
        
        // Let user see success for a second, then check status again to unlock
        setTimeout(async () => {
          if (btn) btn.disabled = false;
          keyInput.disabled = false;
          await checkStatus();
        }, 1200);
      } else {
        throw new Error(res.message || 'The product key is invalid or restricted.');
      }
    } catch (err) {
      showToast(msgId, `Activation Failed: ${err.message}`, 'error');
      if (btn) btn.disabled = false;
      keyInput.disabled = false;
    }
  }

  async function deactivateDevice() {
    if (!confirm('Are you sure you want to deactivate and remove this device registration? You will need to enter your product key to activate it again.')) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/deactivate`, { method: 'POST' });
      if (!response.ok) throw new Error('Deactivation failed.');
      
      alert('Device deactivated successfully.');
      await checkStatus();
    } catch (err) {
      alert(`Error deactivating device: ${err.message}`);
    }
  }

  async function checkAppUpdate() {
    try {
      const response = await fetch(`${BASE_URL}/update`);
      if (!response.ok) throw new Error('Update check failed.');

      const res = await response.json();
      if (res.update_available) {
        alert(`A new version is available: ${res.latest_version}\n\nNotes:\n${res.release_notes || 'No release notes.'}\n\nTo download the update, please visit: https://grademylabs.com`);
      } else {
        alert('Your application is up to date.');
      }
    } catch (err) {
      console.error('[Licensing] Update check error:', err);
      alert('GML Web site is not available.');
    }
  }

  function showAd(ad) {
    const panel = document.getElementById('ad-panel');
    if (!panel) return;

    document.getElementById('ad-title-text').textContent = ad.title || 'Sponsored';
    
    const img = document.getElementById('ad-img');
    if (img && ad.image_url) {
      img.src = ad.image_url;
      img.style.display = 'block';
      if (ad.click_url) {
        img.onclick = () => window.open(ad.click_url, '_blank');
      }
    } else if (img) {
      img.style.display = 'none';
    }

    const link = document.getElementById('ad-btn');
    if (link && ad.click_url) {
      link.href = ad.click_url;
      link.style.display = 'block';
    } else if (link) {
      link.style.display = 'none';
    }

    panel.classList.remove('hidden');
  }

  function hideAd() {
    const panel = document.getElementById('ad-panel');
    if (panel) panel.classList.add('hidden');
  }

  function blockInterface(block) {
    // If blocked, we prevent opening files, saving, etc.
    const appRoot = document.getElementById('app-root');
    if (block) {
      console.log('[Licensing] Locking editor interface.');
      appRoot.classList.add('interface-locked');
    } else {
      console.log('[Licensing] Unlocking editor interface.');
      appRoot.classList.remove('interface-locked');
    }
  }

  function showToast(elemId, text, type) {
    const el = document.getElementById(elemId);
    if (!el) return;

    el.textContent = text;
    el.className = 'license-status-msg'; // Reset
    el.classList.add(type);
  }

  async function checkUpdatesOnStartup() {
    try {
      const response = await fetch(`${BASE_URL}/update`);
      if (!response.ok) throw new Error('Update check failed on backend.');

      const res = await response.json();
      if (res.update_available) {
        const updateOverlay = document.getElementById('update-overlay');
        const updateTitle   = document.getElementById('update-overlay-title');
        const updateMsg     = document.getElementById('update-overlay-message');
        const downloadLink  = document.getElementById('btn-update-download');
        const dismissBtn    = document.getElementById('btn-update-dismiss');
        const notesBox      = document.getElementById('update-notes-box');
        const notesText     = document.getElementById('update-notes-text');

        if (updateOverlay) {
          if (downloadLink) downloadLink.href = 'https://grademylabs.com';

          if (res.release_notes) {
            if (notesText) notesText.textContent = res.release_notes;
            if (notesBox) notesBox.style.display = 'block';
          } else {
            if (notesBox) notesBox.style.display = 'none';
          }

          if (res.is_mandatory) {
            if (updateTitle) updateTitle.textContent = 'Mandatory Update Required';
            if (updateMsg) updateMsg.textContent = `A mandatory update (version ${res.latest_version}) is required. You cannot use the application until it is updated.`;
            if (dismissBtn) dismissBtn.style.display = 'none';
            blockInterface(true);
            updateOverlay.classList.remove('hidden');
          } else {
            if (updateTitle) updateTitle.textContent = 'Update Available';
            if (updateMsg) updateMsg.textContent = `A new version (${res.latest_version}) is available. You can update now or continue with the current version.`;
            if (dismissBtn) dismissBtn.style.display = 'block';
            updateOverlay.classList.remove('hidden');
          }
        }
      }
    } catch (err) {
      console.error('[Licensing] Startup update check failed:', err);
      alert('GML Web site is not available.');
    }
  }

  function dismissUpdate() {
    const updateOverlay = document.getElementById('update-overlay');
    if (updateOverlay) updateOverlay.classList.add('hidden');
  }

  return { init, checkStatus, activateProductKey, deactivateDevice, checkAppUpdate, hideAd, dismissUpdate };

})();
