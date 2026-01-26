/**
 * Scan List View (Home)
 */

import { getAllScans, deleteScan } from '../storage.js';
import { formatKg, formatPercent, formatDate } from '../utils/format.js';

/**
 * Initialize the list view
 * @param {Function} onEditScan - Callback when editing a scan
 * @param {Function} onNewScan - Callback when creating a new scan
 */
export function initListView(onEditScan, onNewScan) {
  // Use event delegation on the list header to handle button clicks
  // This ensures it works even if buttons are re-rendered
  const listHeader = document.querySelector('.list-header');
  if (listHeader) {
    listHeader.addEventListener('click', (e) => {
      const target = e.target.closest('#new-scan-btn');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        if (onNewScan) {
          onNewScan();
        }
      }
    });
  }
  
  // Also attach directly as backup
  const newScanBtn = document.getElementById('new-scan-btn');
  if (newScanBtn) {
    newScanBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onNewScan) {
        onNewScan();
      }
    });
  }
  
  // Store callbacks for use in render
  window._listViewCallbacks = { onEditScan, onNewScan };
}

/**
 * Render the scan list
 */
export function renderList() {
  const container = document.getElementById('scan-list');
  if (!container) return;
  
  const scans = getAllScans();
  
  if (scans.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            <path d="M12 12v4M12 12l2 2M12 12l-2 2"/>
          </svg>
        </div>
        <h3>No scans yet</h3>
        <p>Create your first waste scan to start tracking separation potential.</p>
      </div>
    `;
    return;
  }
  
  const html = scans.map(scan => {
    const extractedKg = scan.streams.reduce((sum, s) => sum + (s.weightKg || 0), 0);
    const separationPct = scan.totalResidualKg > 0 
      ? (extractedKg / scan.totalResidualKg * 100) 
      : 0;
    
    const thumbnailHtml = scan.photo 
      ? `<img src="${scan.photo.dataUrl}" alt="Scan photo" class="scan-thumbnail">`
      : `<div class="scan-thumbnail scan-thumbnail-placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>`;
    
    return `
      <div class="scan-card" data-id="${scan.id}">
        <div class="scan-card-thumbnail">
          ${thumbnailHtml}
        </div>
        <div class="scan-card-content">
          <div class="scan-card-header">
            <span class="scan-card-date">${formatDate(scan.createdAt)}</span>
            ${scan.location ? `<span class="scan-card-location">${escapeHtml(scan.location)}</span>` : ''}
          </div>
          <div class="scan-card-stats">
            <div class="scan-stat">
              <span class="scan-stat-label">Total</span>
              <span class="scan-stat-value">${formatKg(scan.totalResidualKg)}</span>
            </div>
            <div class="scan-stat">
              <span class="scan-stat-label">Extracted</span>
              <span class="scan-stat-value">${formatKg(extractedKg)}</span>
            </div>
            <div class="scan-stat scan-stat-highlight">
              <span class="scan-stat-label">Separation</span>
              <span class="scan-stat-value">${formatPercent(separationPct)}</span>
            </div>
          </div>
        </div>
        <div class="scan-card-actions">
          <button class="btn btn-icon btn-edit" data-action="edit" data-id="${scan.id}" title="Edit scan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn-icon btn-delete" data-action="delete" data-id="${scan.id}" title="Delete scan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  
  // Attach event listeners
  container.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (window._listViewCallbacks?.onEditScan) {
        window._listViewCallbacks.onEditScan(id);
      }
    });
  });
  
  container.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      handleDelete(id);
    });
  });
  
  // Click on card to edit
  container.querySelectorAll('.scan-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (window._listViewCallbacks?.onEditScan) {
        window._listViewCallbacks.onEditScan(id);
      }
    });
  });
}

/**
 * Handle scan deletion with confirmation
 * @param {string} id - The scan ID to delete
 */
function handleDelete(id) {
  if (confirm('Are you sure you want to delete this scan? This cannot be undone.')) {
    deleteScan(id);
    renderList();
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
