// src/utils/bibtexParser.js
// Parse raw BibTeX string into a citation object.

/**
 * Parse a BibTeX string into a structured citation object.
 */
export function parseBibTeX(bibtexString) {
  if (!bibtexString || typeof bibtexString !== 'string') return null

  try {
    const typeMatch = bibtexString.match(/@(\w+)\{([^,]+),/)
    if (!typeMatch) return null

    const type = typeMatch[1].toLowerCase()
    const citeKey = typeMatch[2].trim()

    const fields = {}
    const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g
    let match
    while ((match = fieldRegex.exec(bibtexString)) !== null) {
      fields[match[1].toLowerCase()] = match[2].trim()
    }

    const authors = (fields.author || '')
      .split(/\s+and\s+/i)
      .map(a => a.trim())
      .filter(Boolean)

    return {
      citeKey,
      type: mapBibType(type),
      title: fields.title || '',
      authors,
      year: parseInt(fields.year) || 0,
      journal: fields.journal || '',
      booktitle: fields.booktitle || '',
      doi: fields.doi || '',
      url: fields.url || '',
      pages: fields.pages || '',
      volume: fields.volume || '',
      number: fields.number || '',
      publisher: fields.publisher || '',
      bibtex: bibtexString,
    }
  } catch {
    return null
  }
}

function mapBibType(type) {
  const map = {
    article: 'article',
    inproceedings: 'inproceedings',
    conference: 'inproceedings',
    book: 'book',
    incollection: 'incollection',
    phdthesis: 'phdthesis',
    mastersthesis: 'mastersthesis',
    techreport: 'techreport',
  }
  return map[type] || 'misc'
}

/**
 * Format a citation into IEEE reference style string.
 */
export function formatIEEEReference(citation) {
  const { authors, title, journal, booktitle, year, volume, pages, doi } = citation

  const authorStr = authors.length > 0
    ? authors.map(a => {
        const parts = a.split(/,\s*/)
        if (parts.length === 2) return `${parts[1].trim().charAt(0)}. ${parts[0].trim()}`
        return a
      }).join(', ')
    : ''

  const parts = []
  if (authorStr) parts.push(authorStr)
  if (title) parts.push(`"${title}"`)
  if (journal) parts.push(`\\textit{${journal}}`)
  if (booktitle) parts.push(`in \\textit{${booktitle}}`)
  if (volume) parts.push(`vol. ${volume}`)
  if (pages) parts.push(`pp. ${pages}`)
  if (year) parts.push(`${year}`)
  if (doi) parts.push(`doi: ${doi}`)

  return parts.join(', ') + '.'
}
