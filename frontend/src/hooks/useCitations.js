// src/hooks/useCitations.js
import { useCitationContext } from '../contexts/CitationContext.jsx'

export function useCitations() {
  const { state, dispatch } = useCitationContext()

  return {
    ...state,
    addCitation: (data) => dispatch({ type: 'ADD_CITATION', data }),
    removeCitation: (citationId) => dispatch({ type: 'REMOVE_CITATION', citationId }),
    updateCitation: (citationId, updates) => dispatch({ type: 'UPDATE_CITATION', citationId, updates }),
    reindexCitations: (blocks) => dispatch({ type: 'REINDEX_CITATIONS', blocks }),
    updateUsage: (blocks) => dispatch({ type: 'UPDATE_USAGE', blocks }),
    setHighlighted: (citationId) => dispatch({ type: 'SET_HIGHLIGHTED', citationId }),
    clearHighlighted: () => dispatch({ type: 'CLEAR_HIGHLIGHTED' }),
    dispatch,
  }
}
