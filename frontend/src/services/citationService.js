// src/services/citationService.js
// CrossRef + Semantic Scholar API integration for citation search.

import axios from 'axios'
import { parseBibTeX } from '../utils/bibtexParser.js'

function parseCrossRefWork(item) {
  return {
    title: (item.title && item.title[0]) || '',
    authors: (item.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()),
    year: item.published?.['date-parts']?.[0]?.[0] || item.created?.['date-parts']?.[0]?.[0] || 0,
    journal: (item['container-title'] && item['container-title'][0]) || '',
    booktitle: '',
    doi: item.DOI || '',
    url: item.URL || '',
    pages: item.page || '',
    volume: item.volume || '',
    type: item.type === 'proceedings-article' ? 'inproceedings' : 'article',
    source: 'crossref',
  }
}

function parseSemanticScholarResult(item) {
  return {
    title: item.title || '',
    authors: (item.authors || []).map(a => a.name || ''),
    year: item.year || 0,
    journal: item.venue || item.publicationVenue?.name || '',
    booktitle: '',
    doi: item.externalIds?.DOI || '',
    url: `https://www.semanticscholar.org/paper/${item.paperId || ''}`,
    pages: '',
    volume: '',
    type: 'article',
    source: 'semantic-scholar',
    paperId: item.paperId,
  }
}

export async function searchByDOI(doi) {
  try {
    const res = await axios.get(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)
    return [parseCrossRefWork(res.data.message)]
  } catch (err) {
    console.error('CrossRef DOI search failed:', err)
    return []
  }
}

export async function searchByTitle(query) {
  try {
    const res = await axios.get(
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=10`
    )
    return (res.data.message.items || []).map(parseCrossRefWork)
  } catch (err) {
    console.error('CrossRef title search failed:', err)
    return []
  }
}

export async function searchSemanticScholar(query) {
  try {
    const res = await axios.get(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,authors,year,externalIds,venue,publicationVenue&limit=10`
    )
    return (res.data.data || []).map(parseSemanticScholarResult)
  } catch (err) {
    console.error('Semantic Scholar search failed:', err)
    return []
  }
}

export function parseBibTeXInput(bibtexString) {
  return parseBibTeX(bibtexString)
}
