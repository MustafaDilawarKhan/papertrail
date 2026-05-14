// src/hooks/useFormatGuard.js
// Validates IEEE format rules and produces non-blocking warnings.

import { useMemo } from 'react'

export function useFormatGuard(blocks, citations) {
  return useMemo(() => {
    const warnings = []

    // 1. Abstract word count
    const abstractBlock = blocks.find(b => b.type === 'abstract')
    if (abstractBlock && abstractBlock.content) {
      const wc = abstractBlock.content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
      if (wc > 200) {
        warnings.push({ id: 'abstract-length', severity: 'warning', message: `Abstract is ${wc} words (IEEE max: 200)`, blockId: abstractBlock.id })
      }
    }

    // 2. Missing abstract
    if (!abstractBlock) {
      warnings.push({ id: 'missing-abstract', severity: 'info', message: 'No abstract block found — IEEE requires an abstract' })
    }

    // 3. Uncited references
    if (citations) {
      citations.filter(c => c.globalIndex === 0).forEach(c => {
        warnings.push({ id: `unused-${c.id}`, severity: 'warning', message: `"${c.title}" added but not cited in text`, citationId: c.id })
      })
    }

    // 4. No references block when citations exist
    const hasRefsBlock = blocks.some(b => b.type === 'references')
    if (citations && citations.length > 0 && !hasRefsBlock) {
      warnings.push({ id: 'missing-refs-block', severity: 'error', message: 'Citations exist but no References block found' })
    }

    // 5. Missing title block
    if (!blocks.some(b => b.type === 'title')) {
      warnings.push({ id: 'missing-title', severity: 'info', message: 'No title block — add Title & Authors section' })
    }

    // 6. Empty sections
    blocks.filter(b => b.type === 'section').forEach(b => {
      if (!b.content || b.content.replace(/<[^>]+>/g, '').trim().length === 0) {
        warnings.push({ id: `empty-${b.id}`, severity: 'info', message: `Section "${b.sectionTitle}" has no content`, blockId: b.id })
      }
    })

    return warnings
  }, [blocks, citations])
}
