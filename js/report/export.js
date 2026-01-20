/**
 * Report HTML generation and export
 */

import { formatKg, formatPercent, formatDateTime } from '../utils/format.js';

/**
 * Generate a self-contained HTML report for a scan
 * @param {Object} scan - The scan object
 * @returns {string} Complete HTML document as string
 */
export function generateReportHtml(scan) {
  const totalResidualKg = scan.totalResidualKg || 0;
  const extractedKg = scan.streams.reduce((sum, s) => sum + (s.weightKg || 0), 0);
  const remainingKg = Math.max(0, totalResidualKg - extractedKg);
  const separationPct = totalResidualKg > 0 ? (extractedKg / totalResidualKg * 100) : 0;
  
  const photoHtml = scan.photo 
    ? `<div class="photo-section">
        <img src="${scan.photo.dataUrl}" alt="Waste scan photo" class="scan-photo">
       </div>`
    : '';
  
  const streamsHtml = scan.streams.length > 0
    ? `<table class="streams-table">
        <thead>
          <tr>
            <th>Waste Stream</th>
            <th>Weight</th>
            <th>% of Total</th>
          </tr>
        </thead>
        <tbody>
          ${scan.streams.map(stream => {
            const pct = totalResidualKg > 0 ? (stream.weightKg / totalResidualKg * 100) : 0;
            return `
              <tr>
                <td>${escapeHtml(stream.name)}</td>
                <td>${formatKg(stream.weightKg)}</td>
                <td>${formatPercent(pct)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>`
    : '<p class="no-streams">No waste streams recorded</p>';
  
  const notesHtml = scan.notes 
    ? `<div class="notes-section">
        <h3>Notes</h3>
        <p>${escapeHtml(scan.notes)}</p>
       </div>`
    : '';
  
  const warningHtml = extractedKg > totalResidualKg 
    ? `<div class="warning">
        Note: Extracted weight exceeds total residual weight. Values may be estimates.
       </div>`
    : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Waste Scan Report - ${formatDateTime(scan.createdAt)}</title>
  <style>
    ${getReportStyles()}
  </style>
</head>
<body>
  <div class="report-container">
    <header class="report-header">
      <div class="logo">
        <svg width="40" height="40" viewBox="0 0 180 180" fill="#fff"><path d="M156.9 89.9c.1 31.5-22 58.8-52.8 65.4-22.6 4.7-42.7-1-59.8-16.6-10.1-9.2-17-21.4-19.7-34.7-.8-3.8 2-6.8 5.7-6.1 1.9.3 3.5 1.8 3.8 3.7.6 3 1.5 5.9 2.6 8.8 8.2 19.8 22.8 32.1 43.9 35.9 30 5.4 58.5-14.2 65.2-43.5 2.4-10.5 1.8-21.4-1.8-31.6-.6-1.1-.7-2.4-.6-3.7.4-2.1 2.1-3.6 4.2-3.9 2.2-.3 4.3.9 5.1 3 .9 2.4 1.7 4.9 2.3 7.4 1.2 5.2 1.9 10.5 1.9 15.9zM0 90.2C-.1 53.9 21.5 21.1 54.9 7c.8-.4 1.6-.6 2.5-.7 2.6-.1 4.9 1.9 5 4.5.1 1.8-.8 3.5-2.4 4.4-.6.3-1.2.5-1.8.8-25 11.4-41 30.3-46.8 57.1-5.3 24.3.2 46.6 15.3 66.5.7.8 1.3 1.7 1.6 2.7.6 2.1-.4 4.4-2.4 5.4-2 1.1-4.5.6-6-1.2-2.5-3.1-4.8-6.3-6.8-9.7C6.6 126 2.4 113.9.7 101.4.2 97.7 0 93.9 0 90.2zm138.7-43.6c-.1 1.7-1.1 3.2-2.7 3.9-1.6.9-3.7.7-5.1-.5-.5-.4-1-.8-1.5-1.3-8.4-8.2-19.3-13.5-30.9-15.2C70.1 29.2 42.9 46.7 35 74.3c-.1.5-.3.9-.4 1.4-.9 2.3-3.4 3.5-5.8 2.8-2.5-.6-4-3.1-3.5-5.6.8-3.5 1.9-6.9 3.5-10.1 9.8-21 26-34.3 48.8-38.6s42.5 2 59.3 17.9c1.2 1.1 1.9 2.8 1.8 4.5zM180 91c-.1 14.8-4 29.4-11.1 42.3-.2.4-.5.9-.8 1.3-1.5 2.2-4.4 2.7-6.6 1.2-1.9-1.3-2.6-3.7-1.6-5.8.6-1.2 1.3-2.4 1.9-3.7 4.4-8.5 7.1-17.8 8.1-27.3 2.5-24.3-4.5-45.5-20.8-63.7-.8-.8-1.6-1.7-2.4-2.5-2-1.7-2.2-4.7-.5-6.7s4.7-2.2 6.7-.5c.1.1.3.2.4.4 3.5 3.4 6.6 7.1 9.4 11 8.5 11.6 14.1 25.1 16.2 39.4.8 4.8 1.1 9.7 1.1 14.6zm-89.9 88.9c-16.8.1-33.2-4.6-47.5-13.4-.5-.3-1-.6-1.5-1-2-1.7-2.3-4.7-.6-6.7 1.4-1.6 3.7-2.2 5.6-1.3.4.2.9.5 1.3.7 10 6.3 21.3 10.3 33.1 11.6 20.6 2.3 39.5-2.5 56.5-14.6.5-.4 1-.7 1.5-1.1 2.1-1.6 5.1-1.2 6.7.8 1.6 2.1 1.2 5.1-.8 6.7-.1.1-.2.1-.2.2-4.2 3.2-8.7 6-13.4 8.4-9.6 4.8-19.9 7.9-30.5 9.1-3.5.4-6.9.6-10.2.6zm4-97.3c-1.8 0-3.6.1-5.4 0-2.6 0-4.7-2-4.8-4.6 0-.7.1-1.4.4-2 .6-1.6 2.1-2.7 3.8-2.7 5.5 0 11.1-.7 16.5.8 11.8 3.3 19.3 10.8 21.5 22.9 1.5 8.3-.9 15.8-6.6 22.2-1.2 1.5-3.1 2-4.9 1.5-1.8-.5-3.2-2-3.3-3.9-.2-1.4.3-2.9 1.3-3.9 1.8-1.9 3.1-4.2 3.8-6.6 2.2-7.9-1.1-16.4-8.2-20.6-3.1-2-6.7-3-10.4-3l-3.7-.1zm-5.5 23.8c-3.5.2-7.1-.1-10.5-1-10.6-3.4-17.6-10.2-20.3-21.1-1.1-4.4-.7-8.9.3-13.3.4-2.3 1.1-4.6 2-6.8 1-2.4 3.8-3.4 6.2-2.4 2.2 1 3.3 3.5 2.5 5.8-1 2.7-1.6 5.5-2 8.3-.9 5.7 1 11.5 5.2 15.4 3.5 3.6 8.3 5.7 13.4 5.8 3.3.1 6.6 0 9.9.1 2.6.1 4.5 2.3 4.4 4.9-.1 2.4-2 4.3-4.4 4.4-2 0-4-.1-6.7-.1zm.1 23.5c-7.8.1-15.4-1.8-22.2-5.7-5.3-3.1-9.9-7.1-13.7-11.9-1.8-1.9-1.6-4.9.3-6.6 0 0 .1-.1.2-.1 2.1-1.8 4.9-1.4 6.8.8 1.9 2.3 4 4.4 6.3 6.3 5.9 4.8 13.2 7.6 20.8 7.8 3.3 0 6.7-.1 10-.4 2.2-.2 4.3 1.2 4.9 3.3.8 2.4-.6 5-3.1 5.8-.3.1-.6.2-.9.2-3.1.3-6.3.5-9.4.5zm3.1-82.6c8.6.1 16.4 2.5 23.1 8.1 1.3 1.1 2.4 2.3 3.4 3.6 1.7 2 1.4 4.9-.6 6.6 0 0-.1 0-.1.1-1.9 1.6-4.8 1.4-6.4-.5l-.1-.1c-5.4-6.8-17.5-10-26.7-7.3-1.4.5-2.8 1-4.1 1.7-2.3 1.2-5.1.2-6.3-2.1s0-5.2 2.3-6.4c2.4-1.3 5-2.3 7.7-2.9 2.6-.5 5.2-.8 7.8-.8zM93.3 0c10.6.4 21 2.6 30.8 6.6 1.7.5 3 2 3.3 3.8.5 2.5-1.2 5-3.7 5.5-.9.2-1.9.1-2.8-.3-3-1.1-6-2.2-9-3.1-6.8-1.9-13.8-2.9-20.9-3-.7 0-1.3 0-2-.2-2.3-.4-3.9-2.5-3.8-4.9C85.3 2 87.1.1 89.5 0h3.8z"/></svg>
        <span>Seenons</span>
      </div>
      <h1>Waste Scan Report</h1>
    </header>
    
    <section class="meta-section">
      <div class="meta-item">
        <span class="meta-label">Date</span>
        <span class="meta-value">${formatDateTime(scan.createdAt)}</span>
      </div>
      ${scan.location ? `
      <div class="meta-item">
        <span class="meta-label">Location</span>
        <span class="meta-value">${escapeHtml(scan.location)}</span>
      </div>
      ` : ''}
    </section>
    
    ${photoHtml}
    
    <section class="summary-section">
      <h2>Summary</h2>
      <div class="summary-cards">
        <div class="summary-card">
          <span class="card-label">Total Residual</span>
          <span class="card-value">${formatKg(totalResidualKg)}</span>
        </div>
        <div class="summary-card highlight">
          <span class="card-label">Extractable</span>
          <span class="card-value">${formatKg(extractedKg)}</span>
        </div>
        <div class="summary-card highlight-primary">
          <span class="card-label">Separation Potential</span>
          <span class="card-value">${formatPercent(separationPct)}</span>
        </div>
        <div class="summary-card">
          <span class="card-label">Remaining Residual</span>
          <span class="card-value">${formatKg(remainingKg)}</span>
        </div>
      </div>
      ${warningHtml}
    </section>
    
    <section class="streams-section">
      <h2>Waste Streams Breakdown</h2>
      ${streamsHtml}
    </section>
    
    ${notesHtml}
    
    <footer class="report-footer">
      <p>Generated by Seenons Waste Scan</p>
      <p class="footer-date">Report created: ${new Date().toLocaleString()}</p>
    </footer>
  </div>
  
  <div class="print-button no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
}

/**
 * Get CSS styles for the report
 * @returns {string} CSS styles
 */
function getReportStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #1a2b3c;
      background: #f5f7fa;
      padding: 20px;
    }
    
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    
    .report-header {
      background: linear-gradient(135deg, #00A887 0%, #008B6E 100%);
      color: white;
      padding: 32px;
      text-align: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .logo svg circle {
      stroke: white;
    }
    
    .logo svg path {
      fill: white;
    }
    
    .logo span {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    
    .report-header h1 {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    
    .meta-section {
      display: flex;
      gap: 32px;
      padding: 24px 32px;
      background: #f8fafb;
      border-bottom: 1px solid #e8ecef;
    }
    
    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .meta-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7c8d;
      font-weight: 500;
    }
    
    .meta-value {
      font-size: 16px;
      font-weight: 500;
      color: #1a2b3c;
    }
    
    .photo-section {
      padding: 24px 32px;
      text-align: center;
    }
    
    .scan-photo {
      max-width: 100%;
      max-height: 400px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    
    .summary-section {
      padding: 32px;
    }
    
    .summary-section h2,
    .streams-section h2,
    .notes-section h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1a2b3c;
      margin-bottom: 20px;
      letter-spacing: -0.3px;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .summary-card {
      background: #f8fafb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    
    .summary-card.highlight {
      background: #e8f5f1;
    }
    
    .summary-card.highlight-primary {
      background: linear-gradient(135deg, #00A887 0%, #008B6E 100%);
      color: white;
    }
    
    .summary-card.highlight-primary .card-label {
      color: rgba(255,255,255,0.85);
    }
    
    .card-label {
      display: block;
      font-size: 13px;
      color: #6b7c8d;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .card-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .warning {
      margin-top: 16px;
      padding: 12px 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
      color: #e65100;
    }
    
    .streams-section {
      padding: 0 32px 32px;
    }
    
    .streams-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .streams-table th,
    .streams-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid #e8ecef;
    }
    
    .streams-table th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7c8d;
      font-weight: 600;
      background: #f8fafb;
    }
    
    .streams-table td {
      font-size: 15px;
    }
    
    .streams-table td:first-child {
      font-weight: 500;
    }
    
    .streams-table tr:last-child td {
      border-bottom: none;
    }
    
    .no-streams {
      padding: 24px;
      text-align: center;
      color: #6b7c8d;
      background: #f8fafb;
      border-radius: 8px;
    }
    
    .notes-section {
      padding: 0 32px 32px;
    }
    
    .notes-section p {
      background: #f8fafb;
      padding: 16px;
      border-radius: 8px;
      color: #4a5d6e;
      white-space: pre-wrap;
    }
    
    .report-footer {
      padding: 24px 32px;
      background: #f8fafb;
      border-top: 1px solid #e8ecef;
      text-align: center;
    }
    
    .report-footer p {
      color: #6b7c8d;
      font-size: 13px;
    }
    
    .footer-date {
      margin-top: 4px;
      font-size: 12px !important;
    }
    
    .print-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
    }
    
    .print-button button {
      background: #00A887;
      color: white;
      border: none;
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 30px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,168,135,0.3);
      transition: all 0.2s;
    }
    
    .print-button button:hover {
      background: #008B6E;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,168,135,0.4);
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .report-container {
        box-shadow: none;
        border-radius: 0;
      }
      
      .no-print {
        display: none !important;
      }
      
      .summary-cards {
        break-inside: avoid;
      }
      
      .streams-table {
        break-inside: avoid;
      }
      
      .photo-section {
        break-inside: avoid;
      }
    }
    
    @media (max-width: 600px) {
      body {
        padding: 0;
      }
      
      .report-container {
        border-radius: 0;
      }
      
      .report-header {
        padding: 24px;
      }
      
      .report-header h1 {
        font-size: 22px;
      }
      
      .meta-section {
        flex-direction: column;
        gap: 16px;
        padding: 20px 24px;
      }
      
      .summary-section,
      .streams-section,
      .notes-section {
        padding-left: 24px;
        padding-right: 24px;
      }
      
      .summary-cards {
        grid-template-columns: 1fr;
      }
      
      .card-value {
        font-size: 24px;
      }
      
      .print-button {
        bottom: 16px;
        right: 16px;
      }
      
      .print-button button {
        padding: 12px 20px;
        font-size: 14px;
      }
    }
  `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
