/**
 * Formatting utilities
 */

/**
 * Format a number as kg with specified decimal places
 * @param {number} value - The value in kg
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted string
 */
export function formatKg(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0 kg';
  }
  return `${value.toFixed(decimals)} kg`;
}

/**
 * Format a number as percentage with specified decimal places
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted string
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date for display
 * @param {string|Date} date - ISO string or Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format a date and time for display
 * @param {string|Date} date - ISO string or Date object
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a date for datetime-local input
 * @param {string|Date} date - ISO string or Date object
 * @returns {string} Formatted for datetime-local input
 */
export function formatDateTimeLocal(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Format: YYYY-MM-DDTHH:MM
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a number from input, returning 0 for invalid values
 * @param {string|number} value - Input value
 * @returns {number} Parsed number
 */
export function parseNumber(value) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}
