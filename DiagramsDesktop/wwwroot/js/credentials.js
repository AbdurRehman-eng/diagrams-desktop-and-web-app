/**
 * credentials.js
 * ==============
 * Controls standalone Credentials Manager window UI, API actions, and GCP imports.
 */

'use strict';

const CredentialsUI = (() => {

  const BASE_URL = '/api/credentials';
  let activeTab = 'AWS'; // AWS, Azure, GCP, VMwareVCenter
  let currentCredentialsList = [];
  let editingId = null;

  document.addEventListener('DOMContentLoaded', () => {
    selectTab('AWS');
  });

  function selectTab(tabName) {
    activeTab = tabName;
    editingId = null;
    hideForm();

    // Toggle active classes in navigation sidebar
    const tabs = {
      'AWS': 'tab-aws',
      'Azure': 'tab-azure',
      'GCP': 'tab-gcp',
      'VMwareVCenter': 'tab-vmware'
    };

    Object.entries(tabs).forEach(([name, id]) => {
      const el = document.getElementById(id);
      if (el) {
        if (name === tabName) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // Update main header title
    const headerTitle = document.getElementById('list-title');
    if (headerTitle) {
      headerTitle.textContent = getProviderDisplayName(tabName) + ' Credentials';
    }

    loadCredentials();
  }

  async function loadCredentials() {
    try {
      const response = await fetch(`${BASE_URL}/${activeTab}/list`);
      if (!response.ok) throw new Error('Failed to load list.');

      currentCredentialsList = await response.json();
      renderTable();
    } catch (err) {
      console.error('[CredentialsUI] Load error:', err);
      alert(`Error fetching credential list: ${err.message}`);
    }
  }

  function renderTable() {
    const table = document.getElementById('credential-table');
    const tableBody = document.getElementById('credential-table-body');
    const emptyState = document.getElementById('empty-state');

    if (!table || !tableBody || !emptyState) return;

    tableBody.innerHTML = '';

    if (currentCredentialsList.length === 0) {
      table.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    table.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Render Table Headers
    const thead = table.querySelector('thead');
    if (thead) {
      thead.innerHTML = getTableHeaderMarkup();
    }

    // Render Table Rows
    currentCredentialsList.forEach(cred => {
      const tr = document.createElement('tr');
      tr.innerHTML = getTableRowMarkup(cred);
      tableBody.appendChild(tr);
    });
  }

  function getProviderDisplayName(provider) {
    switch (provider) {
      case 'AWS': return 'AWS';
      case 'Azure': return 'Microsoft Azure';
      case 'GCP': return 'Google Cloud';
      case 'VMwareVCenter': return 'VMware vCenter';
      default: return provider;
    }
  }

  function getTableHeaderMarkup() {
    switch (activeTab) {
      case 'AWS':
        return `
          <tr>
            <th>Description</th>
            <th>Access Key ID</th>
            <th>Secret Key</th>
            <th style="text-align: right;">Actions</th>
          </tr>`;
      case 'Azure':
        return `
          <tr>
            <th>Description</th>
            <th>Client ID</th>
            <th>Tenant ID</th>
            <th>Secret ID</th>
            <th style="text-align: right;">Actions</th>
          </tr>`;
      case 'GCP':
        return `
          <tr>
            <th>Description</th>
            <th>Project ID</th>
            <th>Service Account Email</th>
            <th style="text-align: right;">Actions</th>
          </tr>`;
      case 'VMwareVCenter':
        return `
          <tr>
            <th>Description</th>
            <th>vCenter Address</th>
            <th>Username</th>
            <th style="text-align: right;">Actions</th>
          </tr>`;
      default:
        return '';
    }
  }

  function getTableRowMarkup(cred) {
    const maskText = '<span class="masked-value">••••••••••••••••</span>';
    
    // AWS partially masks AccessKey (Identifier1)
    const getMaskedAccessKey = (key) => {
      if (!key) return '';
      if (key.length <= 8) return maskText;
      return `${key.substring(0, 4)}••••${key.substring(key.length - 4)}`;
    };

    const actions = `
      <td class="actions-cell">
        <button class="action-icon-btn" onclick="CredentialsUI.showEditForm('${cred.credential_id}')" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-icon-btn delete" onclick="CredentialsUI.deleteCredential('${cred.credential_id}', '${cred.description.replace(/'/g, "\\'")}')" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </td>`;

    switch (activeTab) {
      case 'AWS':
        return `
          <td><strong>${escapeHtml(cred.description)}</strong></td>
          <td style="font-family: monospace;">${escapeHtml(getMaskedAccessKey(cred.identifier1))}</td>
          <td>${maskText}</td>
          ${actions}`;
      case 'Azure':
        return `
          <td><strong>${escapeHtml(cred.description)}</strong></td>
          <td style="font-family: monospace; font-size:12px;">${escapeHtml(cred.identifier1)}</td>
          <td style="font-family: monospace; font-size:12px;">${escapeHtml(cred.identifier2)}</td>
          <td style="font-family: monospace; font-size:12px;">${escapeHtml(cred.identifier4)}</td>
          ${actions}`;
      case 'GCP':
        return `
          <td><strong>${escapeHtml(cred.description)}</strong></td>
          <td style="font-family: monospace;">${escapeHtml(cred.identifier1)}</td>
          <td>${escapeHtml(cred.identifier2)}</td>
          ${actions}`;
      case 'VMwareVCenter':
        return `
          <td><strong>${escapeHtml(cred.description)}</strong></td>
          <td>${escapeHtml(cred.identifier1)}</td>
          <td>${escapeHtml(cred.identifier2)}</td>
          ${actions}`;
      default:
        return '';
    }
  }

  function showAddForm() {
    editingId = null;
    document.getElementById('form-field-id').value = '';
    document.getElementById('form-field-desc').value = '';
    
    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = 'Add ' + getProviderDisplayName(activeTab) + ' Credential';

    renderDynamicFormFields(false);

    document.getElementById('panel-list').classList.add('hidden');
    document.getElementById('panel-form').classList.remove('hidden');
  }

  function showEditForm(id) {
    const cred = currentCredentialsList.find(c => c.credential_id === id);
    if (!cred) return;

    editingId = id;
    document.getElementById('form-field-id').value = id;
    document.getElementById('form-field-desc').value = cred.description;

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = 'Edit ' + getProviderDisplayName(activeTab) + ' Credential';

    renderDynamicFormFields(true, cred);

    document.getElementById('panel-list').classList.add('hidden');
    document.getElementById('panel-form').classList.remove('hidden');
  }

  function hideForm() {
    document.getElementById('panel-form').classList.add('hidden');
    document.getElementById('panel-list').classList.remove('hidden');
    
    // Clear inputs
    document.getElementById('form-field-id').value = '';
    document.getElementById('form-field-desc').value = '';
    const dynamicContainer = document.getElementById('dynamic-form-fields');
    if (dynamicContainer) dynamicContainer.innerHTML = '';
  }

  function renderDynamicFormFields(isEdit, cred = null) {
    const container = document.getElementById('dynamic-form-fields');
    if (!container) return;

    container.innerHTML = '';

    const secretPlaceholder = isEdit ? 'Saved in Windows Credential Manager (Leave empty to keep unchanged)' : 'Enter Secret Key / Password';

    if (activeTab === 'AWS') {
      container.innerHTML = `
        <div class="form-group">
          <label for="aws-access-key">Access Key ID</label>
          <input type="text" id="aws-access-key" class="form-control" placeholder="e.g. AKIAIOSFODNN7EXAMPLE" value="${cred ? escapeHtml(cred.identifier1) : ''}" required />
        </div>
        <div class="form-group">
          <label for="aws-secret-key">Secret Access Key</label>
          <input type="password" id="aws-secret-key" class="form-control" placeholder="${secretPlaceholder}" ${isEdit ? '' : 'required'} />
        </div>`;
    } 
    else if (activeTab === 'Azure') {
      container.innerHTML = `
        <div class="form-group">
          <label for="azure-client-id">Application (Client) ID</label>
          <input type="text" id="azure-client-id" class="form-control" placeholder="UUID Format" value="${cred ? escapeHtml(cred.identifier1) : ''}" required />
        </div>
        <div class="form-group">
          <label for="azure-tenant-id">Directory (Tenant) ID</label>
          <input type="text" id="azure-tenant-id" class="form-control" placeholder="UUID Format" value="${cred ? escapeHtml(cred.identifier2) : ''}" required />
        </div>
        <div class="form-group">
          <label for="azure-sub-id">Subscription ID</label>
          <input type="text" id="azure-sub-id" class="form-control" placeholder="UUID Format" value="${cred ? escapeHtml(cred.identifier3) : ''}" required />
        </div>
        <div class="form-group">
          <label for="azure-secret-id">Client Secret ID</label>
          <input type="text" id="azure-secret-id" class="form-control" placeholder="Identifier for the secret key" value="${cred ? escapeHtml(cred.identifier4) : ''}" required />
        </div>
        <div class="form-group">
          <label for="azure-secret-val">Client Secret Value</label>
          <input type="password" id="azure-secret-val" class="form-control" placeholder="${secretPlaceholder}" ${isEdit ? '' : 'required'} />
        </div>`;
    } 
    else if (activeTab === 'GCP') {
      container.innerHTML = `
        <div class="file-import-row">
          <div class="file-import-text">Import GCP configuration automatically from a Service Account JSON file:</div>
          <button type="button" class="btn btn-secondary" onclick="CredentialsUI.triggerJsonImport()">Import JSON</button>
          <input type="file" id="gcp-json-file" class="file-input" accept=".json" onchange="CredentialsUI.handleJsonFileSelect(event)" />
        </div>
        <div class="form-group">
          <label for="gcp-project-id">Project ID</label>
          <input type="text" id="gcp-project-id" class="form-control" placeholder="e.g. gml-production-123" value="${cred ? escapeHtml(cred.identifier1) : ''}" required />
        </div>
        <div class="form-group">
          <label for="gcp-sa-email">Service Account Client Email</label>
          <input type="email" id="gcp-sa-email" class="form-control" placeholder="e.g. sync-agent@project.iam.gserviceaccount.com" value="${cred ? escapeHtml(cred.identifier2) : ''}" required />
        </div>
        <div class="form-group">
          <label for="gcp-key-id">Private Key ID</label>
          <input type="text" id="gcp-key-id" class="form-control" placeholder="40-character hex code" value="${cred ? escapeHtml(cred.identifier3) : ''}" required />
        </div>
        <div class="form-group">
          <label for="gcp-private-key">Private Key (PEM format)</label>
          <textarea id="gcp-private-key" class="form-control" rows="8" style="font-family: monospace; font-size: 11px;" placeholder="${secretPlaceholder}" ${isEdit ? '' : 'required'}></textarea>
        </div>`;

      // If editing, textarea gets placeholder but empty value
      if (isEdit && cred) {
        // Nothing extra needed since placeholders default correctly
      }
    } 
    else if (activeTab === 'VMwareVCenter') {
      container.innerHTML = `
        <div class="form-group">
          <label for="vc-address">vCenter Server Address (Host / URL)</label>
          <input type="text" id="vc-address" class="form-control" placeholder="e.g. vcenter.corp.local or https://10.20.30.40" value="${cred ? escapeHtml(cred.identifier1) : ''}" required />
        </div>
        <div class="form-group">
          <label for="vc-username">Username</label>
          <input type="text" id="vc-username" class="form-control" placeholder="e.g. administrator@vsphere.local" value="${cred ? escapeHtml(cred.identifier2) : ''}" required />
        </div>
        <div class="form-group">
          <label for="vc-password">Password</label>
          <input type="password" id="vc-password" class="form-control" placeholder="${secretPlaceholder}" ${isEdit ? '' : 'required'} />
        </div>`;
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    const desc = document.getElementById('form-field-desc').value.trim();
    const payload = {
      CredentialId: editingId,
      Provider: activeTab,
      Description: desc
    };

    // Extract dynamic fields per provider
    if (activeTab === 'AWS') {
      payload.Identifier1 = document.getElementById('aws-access-key').value.trim();
      payload.SecretValue = document.getElementById('aws-secret-key').value;
    } 
    else if (activeTab === 'Azure') {
      payload.Identifier1 = document.getElementById('azure-client-id').value.trim();
      payload.Identifier2 = document.getElementById('azure-tenant-id').value.trim();
      payload.Identifier3 = document.getElementById('azure-sub-id').value.trim();
      payload.Identifier4 = document.getElementById('azure-secret-id').value.trim();
      payload.SecretValue = document.getElementById('azure-secret-val').value;
    } 
    else if (activeTab === 'GCP') {
      payload.Identifier1 = document.getElementById('gcp-project-id').value.trim();
      payload.Identifier2 = document.getElementById('gcp-sa-email').value.trim();
      payload.Identifier3 = document.getElementById('gcp-key-id').value.trim();
      payload.SecretValue = document.getElementById('gcp-private-key').value;
    } 
    else if (activeTab === 'VMwareVCenter') {
      payload.Identifier1 = document.getElementById('vc-address').value.trim();
      payload.Identifier2 = document.getElementById('vc-username').value.trim();
      payload.SecretValue = document.getElementById('vc-password').value;
    }

    try {
      const response = await fetch(`${BASE_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Message || errorData.message || 'Failed to save credential.');
      }

      hideForm();
      await loadCredentials();
    } catch (err) {
      alert(`Save Error: ${err.message}`);
    }
  }

  async function deleteCredential(id, description) {
    if (!confirm(`Are you sure you want to delete the credential "${description}"? This will permanently delete both the database record and the related secret in Windows Credential Manager.`)) {
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Deletion failed.');

      await loadCredentials();
    } catch (err) {
      alert(`Delete Error: ${err.message}`);
    }
  }

  /* GCP JSON Import Logic */
  function triggerJsonImport() {
    const fileInput = document.getElementById('gcp-json-file');
    if (fileInput) fileInput.click();
  }

  function handleJsonFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const contents = e.target.result;
      try {
        const response = await fetch(`${BASE_URL}/gcp/import-json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ JsonContent: contents })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.Message || errData.message || 'Invalid key file.');
        }

        const data = await response.json();
        
        // Populate GCP form fields
        document.getElementById('gcp-project-id').value = data.project_id || '';
        document.getElementById('gcp-sa-email').value = data.client_email || '';
        document.getElementById('gcp-key-id').value = data.private_key_id || '';
        document.getElementById('gcp-private-key').value = data.private_key || '';

        // If description field is empty, autofill it
        const descInput = document.getElementById('form-field-desc');
        if (descInput && !descInput.value.trim()) {
          descInput.value = `GCP Account (${data.project_id})`;
        }
      } catch (err) {
        alert(`GCP JSON Import Error: ${err.message}`);
      } finally {
        // Reset file input
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  return { selectTab, showAddForm, showEditForm, hideForm, handleFormSubmit, deleteCredential, triggerJsonImport, handleJsonFileSelect };

})();
