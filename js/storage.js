/**
 * LocalStorage management with schema versioning
 */

import { generateUUID } from './utils/uuid.js';

const STORAGE_KEY = 'seenons_waste_scan';
const SETTINGS_KEY = 'seenons_settings';
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Get default empty data structure
 * @returns {Object} Default data structure
 */
function getDefaultData() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    scans: []
  };
}

/**
 * Migrate data from older schema versions
 * @param {Object} data - The stored data
 * @returns {Object} Migrated data
 */
function migrateSchema(data) {
  // Clone to avoid mutating original
  let migrated = JSON.parse(JSON.stringify(data));
  
  // Future migration logic goes here
  // Example:
  // if (migrated.schemaVersion === 1) {
  //   // Migrate from v1 to v2
  //   migrated.scans.forEach(scan => {
  //     // Add new fields, transform data, etc.
  //   });
  //   migrated.schemaVersion = 2;
  // }
  
  return migrated;
}

/**
 * Load all data from LocalStorage
 * @returns {Object} The stored data
 */
export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultData();
    }
    
    let data = JSON.parse(stored);
    
    // Check if migration is needed
    if (data.schemaVersion < CURRENT_SCHEMA_VERSION) {
      data = migrateSchema(data);
      saveData(data);
    }
    
    return data;
  } catch (error) {
    console.error('Error loading data from LocalStorage:', error);
    return getDefaultData();
  }
}

/**
 * Save all data to LocalStorage
 * @param {Object} data - The data to save
 */
export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to LocalStorage:', error);
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Try deleting some old scans.');
    }
  }
}

/**
 * Get all scans sorted by most recent first
 * @returns {Array} Array of scan objects
 */
export function getAllScans() {
  const data = loadData();
  return [...data.scans].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
  );
}

/**
 * Get a single scan by ID
 * @param {string} id - The scan ID
 * @returns {Object|null} The scan or null if not found
 */
export function getScanById(id) {
  const data = loadData();
  return data.scans.find(scan => scan.id === id) || null;
}

/**
 * Create a new scan
 * @param {Object} scanData - The scan data (without id/timestamps)
 * @returns {Object} The created scan with id and timestamps
 */
export function createScan(scanData) {
  const data = loadData();
  const now = new Date().toISOString();
  
  const newScan = {
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
    location: scanData.location || null,
    notes: scanData.notes || null,
    photo: scanData.photo || null,
    totalResidualKg: scanData.totalResidualKg || 0,
    streams: (scanData.streams || []).map(stream => ({
      id: stream.id || generateUUID(),
      name: stream.name,
      weightKg: stream.weightKg || 0
    }))
  };
  
  data.scans.push(newScan);
  saveData(data);
  
  return newScan;
}

/**
 * Update an existing scan
 * @param {string} id - The scan ID
 * @param {Object} updates - The fields to update
 * @returns {Object|null} The updated scan or null if not found
 */
export function updateScan(id, updates) {
  const data = loadData();
  const index = data.scans.findIndex(scan => scan.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedScan = {
    ...data.scans[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Ensure streams have IDs
  if (updatedScan.streams) {
    updatedScan.streams = updatedScan.streams.map(stream => ({
      id: stream.id || generateUUID(),
      name: stream.name,
      weightKg: stream.weightKg || 0
    }));
  }
  
  data.scans[index] = updatedScan;
  saveData(data);
  
  return updatedScan;
}

/**
 * Delete a scan by ID
 * @param {string} id - The scan ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteScan(id) {
  const data = loadData();
  const index = data.scans.findIndex(scan => scan.id === id);
  
  if (index === -1) {
    return false;
  }
  
  data.scans.splice(index, 1);
  saveData(data);
  
  return true;
}

/**
 * Create a new empty scan object (not saved)
 * @returns {Object} A new scan template
 */
export function createEmptyScan() {
  return {
    id: null,
    location: '',
    notes: '',
    photo: null,
    totalResidualKg: 0,
    streams: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Waste stream presets
 */
export const STREAM_PRESETS = [
  'Cardboard',
  'Paper',
  'Plastics (hard)',
  'Plastics (film)',
  'Metal',
  'Glass',
  'Bio/Food',
  'Wood',
  'Textiles',
  'E-waste',
  'Other'
];

// ============================================
// Settings / API Key Management
// ============================================

/**
 * Get default settings
 * @returns {Object} Default settings
 */
function getDefaultSettings() {
  return {
    geminiApiKey: null
  };
}

/**
 * Load settings from LocalStorage
 * @returns {Object} Settings object
 */
export function loadSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return getDefaultSettings();
    }
    return { ...getDefaultSettings(), ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save settings to LocalStorage
 * @param {Object} settings - Settings to save
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Get the Gemini API key
 * @returns {string|null} The API key or null
 */
export function getApiKey() {
  const settings = loadSettings();
  return settings.geminiApiKey || null;
}

/**
 * Set the Gemini API key
 * @param {string|null} apiKey - The API key to save
 */
export function setApiKey(apiKey) {
  const settings = loadSettings();
  settings.geminiApiKey = apiKey || null;
  saveSettings(settings);
}

/**
 * Check if API key is configured
 * @returns {boolean} True if API key exists
 */
export function hasApiKey() {
  return !!getApiKey();
}
