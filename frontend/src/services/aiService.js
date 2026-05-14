// src/services/aiService.js
// AI text assistance service stub.

import { apiRequest } from '../apiConfig.js'

export async function improveText(text, instruction = 'improve') {
  try {
    return await apiRequest('/ai/improve', {
      method: 'POST',
      body: JSON.stringify({ text, instruction }),
    })
  } catch {
    return { result: text, error: 'AI service not available' }
  }
}

export async function generateOutline(title, abstract) {
  try {
    return await apiRequest('/ai/outline', {
      method: 'POST',
      body: JSON.stringify({ title, abstract }),
    })
  } catch {
    return { sections: [], error: 'AI service not available' }
  }
}

export async function summarizeForAbstract(content) {
  try {
    return await apiRequest('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  } catch {
    return { summary: '', error: 'AI service not available' }
  }
}
