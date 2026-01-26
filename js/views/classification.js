/**
 * Waste Classification View
 */

import { getApiKey, hasApiKey } from '../storage.js';
import { processImage } from '../utils/image.js';
import { classifyWasteImage } from '../api/gemini.js';

let classificationPhoto = null;
let isClassifying = false;

/**
 * Initialize the classification modal
 */
export function initClassificationModal() {
  const modal = document.getElementById('classification-modal');
  const openBtn = document.getElementById('classify-waste-btn');
  const closeBtn = document.getElementById('classification-close-btn');
  const backdrop = modal?.querySelector('.modal-backdrop');
  const photoInput = document.getElementById('classification-photo-input');
  const photoCaptureBtn = document.getElementById('classification-photo-capture-btn');
  const photoRemoveBtn = document.getElementById('classification-photo-remove-btn');
  const classifyBtn = document.getElementById('classify-btn');
  const locationInput = document.getElementById('classification-location');
  
  // Open modal - use event delegation as backup
  const listHeader = document.querySelector('.list-header');
  if (listHeader) {
    listHeader.addEventListener('click', (e) => {
      const target = e.target.closest('#classify-waste-btn');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        openClassification();
      }
    });
  }
  
  // Also attach directly
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openClassification();
    });
  }
  
  // Close modal
  closeBtn?.addEventListener('click', closeClassification);
  backdrop?.addEventListener('click', closeClassification);
  
  // Photo handling
  photoInput?.addEventListener('change', handlePhotoChange);
  photoCaptureBtn?.addEventListener('click', () => photoInput?.click());
  photoRemoveBtn?.addEventListener('click', handlePhotoRemove);
  
  // Location input - enable/disable classify button
  locationInput?.addEventListener('input', handleLocationChange);
  
  // Classify button
  classifyBtn?.addEventListener('click', handleClassify);
  
  // Handle escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) {
      closeClassification();
    }
  });
}

/**
 * Open the classification modal
 */
function openClassification() {
  const modal = document.getElementById('classification-modal');
  if (!modal) return;
  
  // Check if API key is configured
  if (!hasApiKey()) {
    alert('Please configure your Gemini API key in Settings first.');
    return;
  }
  
  // Reset form
  classificationPhoto = null;
  const locationInput = document.getElementById('classification-location');
  const resultDiv = document.getElementById('classification-result');
  
  if (locationInput) locationInput.value = '';
  if (resultDiv) {
    resultDiv.style.display = 'none';
    resultDiv.querySelector('#classification-content').innerHTML = '';
  }
  
  renderPhotoPreview();
  updateClassifyButton();
  
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the classification modal
 */
function closeClassification() {
  const modal = document.getElementById('classification-modal');
  if (!modal) return;
  
  modal.classList.remove('open');
  document.body.style.overflow = '';
  
  // Reset state
  classificationPhoto = null;
  isClassifying = false;
}

/**
 * Render photo preview
 */
function renderPhotoPreview() {
  const preview = document.getElementById('classification-photo-preview');
  const captureBtn = document.getElementById('classification-photo-capture-btn');
  const removeBtn = document.getElementById('classification-photo-remove-btn');
  
  if (classificationPhoto) {
    preview.innerHTML = `<img src="${classificationPhoto.dataUrl}" alt="Waste photo">`;
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
  
  updateClassifyButton();
}

/**
 * Update classify button state
 */
function updateClassifyButton() {
  const classifyBtn = document.getElementById('classify-btn');
  const locationInput = document.getElementById('classification-location');
  
  if (!classifyBtn) return;
  
  const hasLocation = locationInput?.value?.trim();
  const hasPhoto = !!classificationPhoto;
  const canClassify = hasLocation && hasPhoto && !isClassifying;
  
  classifyBtn.disabled = !canClassify;
}

/**
 * Handle photo change
 */
async function handlePhotoChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  
  try {
    const photo = await processImage(file);
    classificationPhoto = photo;
    renderPhotoPreview();
  } catch (error) {
    console.error('Error processing photo:', error);
    alert('Failed to process photo. Please try again.');
  }
  
  // Reset input so same file can be selected again
  e.target.value = '';
}

/**
 * Handle photo remove
 */
function handlePhotoRemove() {
  classificationPhoto = null;
  renderPhotoPreview();
}

/**
 * Handle location input change
 */
function handleLocationChange() {
  updateClassifyButton();
}

/**
 * Handle classify button click
 */
async function handleClassify() {
  if (isClassifying) return;
  
  const locationInput = document.getElementById('classification-location');
  const location = locationInput?.value?.trim();
  
  if (!location) {
    alert('Please enter a town/region.');
    return;
  }
  
  if (!classificationPhoto) {
    alert('Please add a photo first.');
    return;
  }
  
  const apiKey = getApiKey();
  if (!apiKey) {
    alert('Please configure your Gemini API key in Settings first.');
    return;
  }
  
  const classifyBtn = document.getElementById('classify-btn');
  const resultDiv = document.getElementById('classification-result');
  const contentDiv = document.getElementById('classification-content');
  
  try {
    isClassifying = true;
    updateClassifyButton();
    
    if (classifyBtn) {
      classifyBtn.disabled = true;
      classifyBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        Classifying...
      `;
    }
    
    // Show loading indicator
    if (resultDiv) {
      resultDiv.style.display = 'block';
    }
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div class="classification-loading">
          <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <p>Analyzing waste image...</p>
        </div>
      `;
    }
    
    const result = await classifyWasteImage(apiKey, classificationPhoto.dataUrl, location);
    
    // Display results as markdown
    if (resultDiv && contentDiv) {
      const markdownHtml = convertMarkdownToHtml(result.markdown || '');
      
      contentDiv.innerHTML = markdownHtml;
      resultDiv.style.display = 'block';
      
      // Scroll to results
      setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
  } catch (error) {
    console.error('Classification failed:', error);
    alert(`Classification failed: ${error.message}`);
  } finally {
    isClassifying = false;
    updateClassifyButton();
    
    if (classifyBtn) {
      classifyBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        Classify Waste
      `;
    }
  }
}

/**
 * Convert simple markdown to HTML
 * @param {string} markdown - Markdown text
 * @returns {string} HTML
 */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  // First escape all HTML to prevent XSS
  const div = document.createElement('div');
  div.textContent = markdown;
  let html = div.innerHTML;
  
  // Convert **bold** to <strong> (after escaping)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert line breaks to <br>
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in a div for styling
  return `<div class="classification-markdown">${html}</div>`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
