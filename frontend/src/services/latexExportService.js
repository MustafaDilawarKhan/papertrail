// src/services/latexExportService.js
// LaTeX export — downloads .tex and .bib files directly.

import { generateLatex } from '../utils/latexGenerator.js'

export function downloadTexFile(state, citations, filename = 'paper') {
  const { tex, bib } = generateLatex(state, citations)

  // Download .tex
  const texBlob = new Blob([tex], { type: 'text/plain' })
  const texUrl = URL.createObjectURL(texBlob)
  const texLink = document.createElement('a')
  texLink.href = texUrl
  texLink.download = `${filename}.tex`
  texLink.click()
  URL.revokeObjectURL(texUrl)

  // Download .bib if citations exist
  if (bib && bib.trim()) {
    const bibBlob = new Blob([bib], { type: 'text/plain' })
    const bibUrl = URL.createObjectURL(bibBlob)
    const bibLink = document.createElement('a')
    bibLink.href = bibUrl
    bibLink.download = 'references.bib'
    bibLink.click()
    URL.revokeObjectURL(bibUrl)
  }
}
