// src/services/paperService.js
// Save/load paper state via backend.

import { apiRequest } from '../apiConfig.js'

export async function savePaper(paperState) {
  return apiRequest('/papers', {
    method: 'POST',
    body: JSON.stringify(paperState),
  })
}

export async function loadPaper(paperId) {
  return apiRequest(`/papers/${paperId}`)
}

export async function listPapers() {
  return apiRequest('/papers')
}

export async function deletePaper(paperId) {
  return apiRequest(`/papers/${paperId}`, { method: 'DELETE' })
}
