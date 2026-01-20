/**
 * Gemini API integration for waste image analysis
 * https://ai.google.dev/gemini-api/docs
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Analyze a waste image using Gemini API
 * @param {string} apiKey - The Gemini API key
 * @param {string} imageDataUrl - Base64 data URL of the image
 * @returns {Promise<{streams: Array<{name: string, weightKg: number}>, totalEstimateKg: number}>}
 */
export async function analyzeWasteImage(apiKey, imageDataUrl) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  if (!imageDataUrl) {
    throw new Error('Image is required');
  }
  
  // Extract base64 data and mime type from data URL
  const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image data URL');
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  
  const prompt = `Analyze this waste image. Identify waste streams and estimate weights in kg.

Return JSON only: {"streams":[{"name":"...","weightKg":0.0}],"totalEstimateKg":0.0,"confidence":"low|medium|high","notes":"..."}

Categories: Cardboard, Paper, Plastics (hard), Plastics (film), Metal, Glass, Bio/Food, Wood, Textiles, E-waste, Other

Be conservative with estimates. Only include clearly visible streams.`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 32,
      topP: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: "application/json"
    }
  };
  
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  
  // Check for truncated response
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Response was truncated. Please try again with a simpler image.');
  }
  
  // Extract the text response
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    throw new Error('No response from API');
  }
  
  // Parse the JSON response
  try {
    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = textResponse.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.slice(7);
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith('```')) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();
    
    const result = JSON.parse(cleanedResponse);
    
    // Validate the response structure
    if (!result.streams || !Array.isArray(result.streams)) {
      throw new Error('Invalid response structure');
    }
    
    // Ensure all streams have required fields
    result.streams = result.streams.map(stream => ({
      name: String(stream.name || 'Unknown'),
      weightKg: parseFloat(stream.weightKg) || 0
    })).filter(stream => stream.name && stream.weightKg >= 0);
    
    result.totalEstimateKg = parseFloat(result.totalEstimateKg) || 
      result.streams.reduce((sum, s) => sum + s.weightKg, 0);
    
    return result;
  } catch (parseError) {
    console.error('Failed to parse API response:', textResponse);
    throw new Error('Failed to parse API response as JSON');
  }
}

/**
 * Test if an API key is valid
 * @param {string} apiKey - The API key to test
 * @returns {Promise<boolean>} True if valid
 */
export async function testApiKey(apiKey) {
  if (!apiKey) {
    return false;
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET' }
    );
    return response.ok;
  } catch {
    return false;
  }
}
