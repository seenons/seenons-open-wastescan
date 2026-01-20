/**
 * Main application entry point
 * Handles routing and view management
 */

import { initListView, renderList } from './views/list.js';
import { initEditorView, loadScan } from './views/editor.js';

// View elements
let listView;
let editorView;

// Current view state
let currentView = 'list';

/**
 * Initialize the application
 */
function init() {
  // Get view elements
  listView = document.getElementById('view-list');
  editorView = document.getElementById('view-editor');
  
  // Initialize views
  initListView(handleEditScan, handleNewScan);
  initEditorView(handleBackToList);
  
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

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
