/**
 * Main application entry point
 * Handles routing and view management
 */

import { initListView, renderList } from './views/list.js';
import { initEditorView, loadScan } from './views/editor.js';
import { initClassificationModal } from './views/classification.js';
import { getApiKey, setApiKey, hasApiKey } from './storage.js';
import { testApiKey } from './api/gemini.js';

// View elements
let listView;
let editorView;
let settingsModal;

// Current view state
let currentView = 'list';

/**
 * Initialize the application
 */
function init() {
  // Get view elements
  listView = document.getElementById('view-list');
  editorView = document.getElementById('view-editor');
  settingsModal = document.getElementById('settings-modal');
  
  // Initialize views
  initListView(handleEditScan, handleNewScan);
  initEditorView(handleBackToList);
  
  // Initialize classification modal
  initClassificationModal();
  
  // Initialize settings modal
  initSettingsModal();
  
  // Handle browser back/forward
  window.addEventListener('popstate', handlePopState);
  
  // Initial render based on URL
  const params = new URLSearchParams(window.location.search);
  const scanId = params.get('scan');
  
  if (scanId) {
    showEditor(scanId);
  } else if (params.has('new')) {
    showEditor(null);
  } else {
    showList();
  }
}

/**
 * Show the scan list view
 */
function showList() {
  currentView = 'list';
  
  listView.classList.add('active');
  editorView.classList.remove('active');
  
  renderList();
  
  // Update URL without creating history entry on initial load
  if (window.location.search) {
    history.replaceState({ view: 'list' }, '', window.location.pathname);
  }
}

/**
 * Show the editor view
 * @param {string|null} scanId - The scan ID to edit, or null for new
 */
function showEditor(scanId) {
  currentView = 'editor';
  
  listView.classList.remove('active');
  editorView.classList.add('active');
  
  loadScan(scanId);
  
  // Update URL
  const url = scanId 
    ? `${window.location.pathname}?scan=${scanId}`
    : `${window.location.pathname}?new`;
  history.pushState({ view: 'editor', scanId }, '', url);
}

/**
 * Handle editing an existing scan
 * @param {string} scanId - The scan ID
 */
function handleEditScan(scanId) {
  showEditor(scanId);
}

/**
 * Handle creating a new scan
 */
function handleNewScan() {
  showEditor(null);
}

/**
 * Handle going back to the list
 */
function handleBackToList() {
  showList();
  history.pushState({ view: 'list' }, '', window.location.pathname);
}

/**
 * Handle browser back/forward navigation
 * @param {PopStateEvent} event
 */
function handlePopState(event) {
  const state = event.state;
  
  if (state?.view === 'editor') {
    currentView = 'editor';
    listView.classList.remove('active');
    editorView.classList.add('active');
    loadScan(state.scanId || null);
  } else {
    currentView = 'list';
    listView.classList.add('active');
    editorView.classList.remove('active');
    renderList();
  }
}

// ============================================
// Settings Modal
// ============================================

/**
 * Initialize settings modal
 */
function initSettingsModal() {
  const settingsBtn = document.getElementById('settings-btn');
  const closeBtn = document.getElementById('settings-close-btn');
  const saveBtn = document.getElementById('settings-save-btn');
  const backdrop = settingsModal?.querySelector('.modal-backdrop');
  const apiKeyInput = document.getElementById('api-key-input');
  
  // Open modal
  settingsBtn?.addEventListener('click', openSettings);
  
  // Close modal
  closeBtn?.addEventListener('click', closeSettings);
  backdrop?.addEventListener('click', closeSettings);
  
  // Save settings
  saveBtn?.addEventListener('click', saveSettings);
  
  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal?.classList.contains('open')) {
      closeSettings();
    }
  });
  
  // Validate API key on input
  apiKeyInput?.addEventListener('input', debounce(validateApiKey, 500));
}

/**
 * Open settings modal
 */
function openSettings() {
  const apiKeyInput = document.getElementById('api-key-input');
  const currentKey = getApiKey();
  
  if (apiKeyInput && currentKey) {
    apiKeyInput.value = currentKey;
    updateApiKeyStatus('saved', 'API key is configured');
  } else {
    updateApiKeyStatus('', '');
  }
  
  settingsModal?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Close settings modal
 */
function closeSettings() {
  settingsModal?.classList.remove('open');
  document.body.style.overflow = '';
}

/**
 * Save settings
 */
async function saveSettings() {
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKey = apiKeyInput?.value?.trim() || null;
  
  if (apiKey) {
    updateApiKeyStatus('loading', 'Validating API key...');
    
    const isValid = await testApiKey(apiKey);
    
    if (isValid) {
      setApiKey(apiKey);
      updateApiKeyStatus('success', 'API key saved successfully');
      setTimeout(closeSettings, 1000);
    } else {
      updateApiKeyStatus('error', 'Invalid API key. Please check and try again.');
      return;
    }
  } else {
    setApiKey(null);
    updateApiKeyStatus('', '');
    closeSettings();
  }
}

/**
 * Validate API key
 */
async function validateApiKey() {
  const apiKeyInput = document.getElementById('api-key-input');
  const apiKey = apiKeyInput?.value?.trim();
  
  if (!apiKey) {
    updateApiKeyStatus('', '');
    return;
  }
  
  if (apiKey.length < 20) {
    updateApiKeyStatus('error', 'API key seems too short');
    return;
  }
  
  updateApiKeyStatus('loading', 'Checking API key...');
  
  const isValid = await testApiKey(apiKey);
  
  if (isValid) {
    updateApiKeyStatus('success', 'API key is valid');
  } else {
    updateApiKeyStatus('error', 'API key is invalid');
  }
}

/**
 * Update API key status display
 * @param {string} status - Status type: '', 'loading', 'success', 'error', 'saved'
 * @param {string} message - Status message
 */
function updateApiKeyStatus(status, message) {
  const statusEl = document.getElementById('api-key-status');
  if (!statusEl) return;
  
  statusEl.className = 'api-key-status';
  if (status) {
    statusEl.classList.add(`status-${status}`);
  }
  statusEl.textContent = message;
}

/**
 * Debounce helper
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
