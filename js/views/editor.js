/**
 * Scan Editor View
 */

import { getScanById, createScan, updateScan, createEmptyScan, STREAM_PRESETS } from '../storage.js';
import { generateUUID } from '../utils/uuid.js';
import { processImage } from '../utils/image.js';
import { formatKg, formatPercent, formatDateTimeLocal, parseNumber } from '../utils/format.js';
import { generateReportHtml } from '../report/export.js';

let currentScan = null;
let isNewScan = true;
let onBackCallback = null;

/**
 * Initialize the editor view
 * @param {Function} onBack - Callback when going back to list
 */
export function initEditorView(onBack) {
  onBackCallback = onBack;
  
  // Back button
  document.getElementById('editor-back-btn')?.addEventListener('click', handleBack);
  document.getElementById('editor-back-btn-mobile')?.addEventListener('click', handleBack);
  
  // Save button
  document.getElementById('save-btn')?.addEventListener('click', handleSave);
  document.getElementById('save-btn-mobile')?.addEventListener('click', handleSave);
  
  // Download report button
  document.getElementById('download-btn')?.addEventListener('click', handleDownload);
  document.getElementById('download-btn-mobile')?.addEventListener('click', handleDownload);
  
  // Print button
  document.getElementById('print-btn')?.addEventListener('click', handlePrint);
  document.getElementById('print-btn-mobile')?.addEventListener('click', handlePrint);
  
  // Photo input
  const photoInput = document.getElementById('photo-input');
  photoInput?.addEventListener('change', handlePhotoChange);
  
  // Photo buttons
  document.getElementById('photo-capture-btn')?.addEventListener('click', () => photoInput?.click());
  document.getElementById('photo-remove-btn')?.addEventListener('click', handlePhotoRemove);
  
  // Form inputs - live update
  document.getElementById('scan-location')?.addEventListener('input', handleInputChange);
  document.getElementById('scan-datetime')?.addEventListener('input', handleInputChange);
  document.getElementById('scan-notes')?.addEventListener('input', handleInputChange);
  document.getElementById('total-weight')?.addEventListener('input', handleTotalWeightChange);
  
  // Add stream button
  document.getElementById('add-stream-btn')?.addEventListener('click', handleAddStream);
}

/**
 * Load a scan into the editor
 * @param {string|null} scanId - The scan ID to edit, or null for new scan
 */
export function loadScan(scanId) {
  if (scanId) {
    currentScan = getScanById(scanId);
    if (!currentScan) {
      alert('Scan not found');
      if (onBackCallback) onBackCallback();
      return;
    }
    isNewScan = false;
  } else {
    currentScan = createEmptyScan();
    isNewScan = true;
  }
  
  renderEditor();
}

/**
 * Render the editor form
 */
function renderEditor() {
  if (!currentScan) return;
  
  // Update form fields
  const locationInput = document.getElementById('scan-location');
  const datetimeInput = document.getElementById('scan-datetime');
  const notesInput = document.getElementById('scan-notes');
  const totalWeightInput = document.getElementById('total-weight');
  
  if (locationInput) locationInput.value = currentScan.location || '';
  if (datetimeInput) datetimeInput.value = formatDateTimeLocal(currentScan.createdAt);
  if (notesInput) notesInput.value = currentScan.notes || '';
  if (totalWeightInput) totalWeightInput.value = currentScan.totalResidualKg || '';
  
  // Update photo preview
  renderPhotoPreview();
  
  // Update streams
  renderStreams();
  
  // Update summary
  updateSummary();
  
  // Update title
  const title = document.getElementById('editor-title');
  if (title) {
    title.textContent = isNewScan ? 'New Scan' : 'Edit Scan';
  }
}

/**
 * Render photo preview
 */
function renderPhotoPreview() {
  const preview = document.getElementById('photo-preview');
  const captureBtn = document.getElementById('photo-capture-btn');
  const removeBtn = document.getElementById('photo-remove-btn');
  
  if (currentScan.photo) {
    preview.innerHTML = `<img src="${currentScan.photo.dataUrl}" alt="Scan photo">`;
    preview.classList.add('has-photo');
    if (captureBtn) captureBtn.textContent = 'Replace Photo';
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  } else {
    preview.innerHTML = `
      <div class="photo-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <span>No photo</span>
      </div>
    `;
    preview.classList.remove('has-photo');
    if (captureBtn) captureBtn.textContent = 'Take Photo';
    if (removeBtn) removeBtn.style.display = 'none';
  }
}

/**
 * Render streams list
 */
function renderStreams() {
  const container = document.getElementById('streams-list');
  if (!container) return;
  
  if (currentScan.streams.length === 0) {
    container.innerHTML = `
      <div class="streams-empty">
        <p>No waste streams added yet. Click "Add Stream" to start.</p>
      </div>
    `;
    return;
  }
  
  const html = currentScan.streams.map((stream, index) => `
    <div class="stream-row" data-index="${index}">
      <div class="stream-name">
        <select class="stream-select" data-index="${index}">
          <option value="">Select stream...</option>
          ${STREAM_PRESETS.map(preset => 
            `<option value="${preset}" ${stream.name === preset ? 'selected' : ''}>${preset}</option>`
          ).join('')}
          <option value="__custom__" ${!STREAM_PRESETS.includes(stream.name) && stream.name ? 'selected' : ''}>Custom...</option>
        </select>
        <input type="text" 
               class="stream-custom-name input" 
               placeholder="Custom stream name"
               value="${!STREAM_PRESETS.includes(stream.name) ? escapeHtml(stream.name) : ''}"
               data-index="${index}"
               style="display: ${!STREAM_PRESETS.includes(stream.name) && stream.name ? 'block' : 'none'}">
      </div>
      <div class="stream-weight">
        <input type="number" 
               class="stream-weight-input input" 
               placeholder="0.0"
               step="0.1"
               min="0"
               value="${stream.weightKg || ''}"
               data-index="${index}">
        <span class="stream-weight-unit">kg</span>
      </div>
      <button class="btn btn-icon btn-remove-stream" data-index="${index}" title="Remove stream">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
  
  container.innerHTML = html;
  
  // Attach event listeners
  container.querySelectorAll('.stream-select').forEach(select => {
    select.addEventListener('change', handleStreamNameChange);
  });
  
  container.querySelectorAll('.stream-custom-name').forEach(input => {
    input.addEventListener('input', handleCustomNameChange);
  });
  
  container.querySelectorAll('.stream-weight-input').forEach(input => {
    input.addEventListener('input', handleStreamWeightChange);
  });
  
  container.querySelectorAll('.btn-remove-stream').forEach(btn => {
    btn.addEventListener('click', handleRemoveStream);
  });
}

/**
 * Update summary panel with calculations
 */
function updateSummary() {
  const totalResidualKg = currentScan.totalResidualKg || 0;
  const extractedKg = currentScan.streams.reduce((sum, s) => sum + (s.weightKg || 0), 0);
  const remainingKg = Math.max(0, totalResidualKg - extractedKg);
  const separationPct = totalResidualKg > 0 ? (extractedKg / totalResidualKg * 100) : 0;
  
  // Update summary values
  document.getElementById('summary-total').textContent = formatKg(totalResidualKg);
  document.getElementById('summary-extracted').textContent = formatKg(extractedKg);
  document.getElementById('summary-remaining').textContent = formatKg(remainingKg);
  document.getElementById('summary-separation').textContent = formatPercent(separationPct);
  
  // Update per-stream breakdown
  const breakdownContainer = document.getElementById('summary-breakdown');
  if (breakdownContainer) {
    if (currentScan.streams.length === 0) {
      breakdownContainer.innerHTML = '<p class="muted">No streams added</p>';
    } else {
      const html = currentScan.streams
        .filter(s => s.name)
        .map(stream => {
          const pct = totalResidualKg > 0 ? (stream.weightKg / totalResidualKg * 100) : 0;
          return `
            <div class="breakdown-row">
              <span class="breakdown-name">${escapeHtml(stream.name)}</span>
              <span class="breakdown-value">${formatKg(stream.weightKg)} (${formatPercent(pct)})</span>
            </div>
          `;
        }).join('');
      breakdownContainer.innerHTML = html || '<p class="muted">No streams added</p>';
    }
  }
  
  // Show warning if extracted > total
  const warningEl = document.getElementById('summary-warning');
  if (warningEl) {
    if (extractedKg > totalResidualKg && totalResidualKg > 0) {
      warningEl.style.display = 'block';
      warningEl.textContent = `Warning: Extracted weight (${formatKg(extractedKg)}) exceeds total residual weight.`;
    } else {
      warningEl.style.display = 'none';
    }
  }
  
  // Update save button state
  const saveBtn = document.getElementById('save-btn');
  const saveBtnMobile = document.getElementById('save-btn-mobile');
  const isValid = totalResidualKg > 0;
  
  if (saveBtn) saveBtn.disabled = !isValid;
  if (saveBtnMobile) saveBtnMobile.disabled = !isValid;
}

// Event Handlers

function handleInputChange(e) {
  const field = e.target.id;
  if (field === 'scan-location') {
    currentScan.location = e.target.value || null;
  } else if (field === 'scan-datetime') {
    currentScan.createdAt = new Date(e.target.value).toISOString();
  } else if (field === 'scan-notes') {
    currentScan.notes = e.target.value || null;
  }
}

function handleTotalWeightChange(e) {
  currentScan.totalResidualKg = parseNumber(e.target.value);
  updateSummary();
}

async function handlePhotoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
    const photo = await processImage(file);
    currentScan.photo = photo;
    renderPhotoPreview();
  } catch (error) {
    console.error('Error processing photo:', error);
    alert('Failed to process photo. Please try again.');
  }
  
  // Reset input so same file can be selected again
  e.target.value = '';
}

function handlePhotoRemove() {
  currentScan.photo = null;
  renderPhotoPreview();
}

function handleAddStream() {
  currentScan.streams.push({
    id: generateUUID(),
    name: '',
    weightKg: 0
  });
  renderStreams();
  updateSummary();
}

function handleStreamNameChange(e) {
  const index = parseInt(e.target.dataset.index);
  const value = e.target.value;
  
  const customInput = e.target.parentElement.querySelector('.stream-custom-name');
  
  if (value === '__custom__') {
    customInput.style.display = 'block';
    customInput.focus();
    currentScan.streams[index].name = customInput.value || '';
  } else {
    customInput.style.display = 'none';
    currentScan.streams[index].name = value;
  }
  
  updateSummary();
}

function handleCustomNameChange(e) {
  const index = parseInt(e.target.dataset.index);
  currentScan.streams[index].name = e.target.value;
  updateSummary();
}

function handleStreamWeightChange(e) {
  const index = parseInt(e.target.dataset.index);
  currentScan.streams[index].weightKg = parseNumber(e.target.value);
  updateSummary();
}

function handleRemoveStream(e) {
  const index = parseInt(e.target.dataset.index);
  currentScan.streams.splice(index, 1);
  renderStreams();
  updateSummary();
}

function handleBack() {
  if (onBackCallback) onBackCallback();
}

function handleSave() {
  if (!currentScan.totalResidualKg || currentScan.totalResidualKg <= 0) {
    alert('Please enter the total residual waste weight.');
    return;
  }
  
  // Filter out empty streams
  currentScan.streams = currentScan.streams.filter(s => s.name && s.name.trim());
  
  if (isNewScan) {
    const saved = createScan(currentScan);
    currentScan = saved;
    isNewScan = false;
  } else {
    updateScan(currentScan.id, currentScan);
  }
  
  // Update title
  const title = document.getElementById('editor-title');
  if (title) title.textContent = 'Edit Scan';
  
  // Show feedback
  showToast('Scan saved successfully');
}

function handleDownload() {
  if (!currentScan.totalResidualKg || currentScan.totalResidualKg <= 0) {
    alert('Please enter the total residual waste weight before exporting.');
    return;
  }
  
  const html = generateReportHtml(currentScan);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `waste-scan-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Report downloaded');
}

function handlePrint() {
  if (!currentScan.totalResidualKg || currentScan.totalResidualKg <= 0) {
    alert('Please enter the total residual waste weight before printing.');
    return;
  }
  
  const html = generateReportHtml(currentScan);
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for images to load before printing
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
