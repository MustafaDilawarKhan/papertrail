// src/contexts/CitationContext.jsx
// Citation store + index management.

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { nanoid } from 'nanoid'
import { recalculateCitationIndices, computeUsedInBlocks } from '../utils/citationIndexer.js'

const CitationContext = createContext(null)

const initialState = {
  citations: [],
  highlightedCitationId: null,
}

function citationReducer(state, action) {
  switch (action.type) {
    case 'ADD_CITATION': {
      const newCitation = {
        id: nanoid(8),
        citeKey: action.data.citeKey || `ref-${nanoid(4)}`,
        globalIndex: state.citations.length + 1,
        usedInBlocks: [],
        type: action.data.type || 'article',
        title: action.data.title || '',
        authors: action.data.authors || [],
        year: action.data.year || 0,
        journal: action.data.journal || '',
        booktitle: action.data.booktitle || '',
        doi: action.data.doi || '',
        url: action.data.url || '',
        pages: action.data.pages || '',
        volume: action.data.volume || '',
        bibtex: action.data.bibtex || '',
      }
      return { ...state, citations: [...state.citations, newCitation] }
    }
    case 'REMOVE_CITATION':
      return { ...state, citations: state.citations.filter(c => c.id !== action.citationId) }
    case 'UPDATE_CITATION':
      return { ...state, citations: state.citations.map(c => c.id === action.citationId ? { ...c, ...action.updates } : c) }
    case 'REINDEX_CITATIONS':
      return { ...state, citations: recalculateCitationIndices(action.blocks, state.citations) }
    case 'UPDATE_USAGE':
      return { ...state, citations: computeUsedInBlocks(action.blocks, state.citations) }
    case 'SET_HIGHLIGHTED':
      return { ...state, highlightedCitationId: action.citationId }
    case 'CLEAR_HIGHLIGHTED':
      return { ...state, highlightedCitationId: null }
    case 'LOAD_CITATIONS':
      return { ...state, citations: action.citations }
    default:
      return state
  }
}

export function CitationProvider({ children }) {
  const [state, dispatch] = useReducer(citationReducer, initialState)
  return <CitationContext.Provider value={{ state, dispatch }}>{children}</CitationContext.Provider>
}

export function useCitationContext() {
  const ctx = useContext(CitationContext)
  if (!ctx) throw new Error('useCitationContext must be used within CitationProvider')
  return ctx
}

export default CitationContext
