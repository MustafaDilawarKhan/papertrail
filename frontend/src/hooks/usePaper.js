// src/hooks/usePaper.js
import { usePaperContext } from '../contexts/PaperContext.jsx'

export function usePaper() {
  const { state, dispatch } = usePaperContext()

  return {
    ...state,
    addBlock: (blockType, afterBlockId, extra) => dispatch({ type: 'ADD_BLOCK', blockType, afterBlockId, extra }),
    removeBlock: (blockId) => dispatch({ type: 'REMOVE_BLOCK', blockId }),
    updateBlock: (blockId, updates) => dispatch({ type: 'UPDATE_BLOCK', blockId, updates }),
    reorderBlocks: (fromIndex, toIndex) => dispatch({ type: 'REORDER_BLOCKS', fromIndex, toIndex }),
    duplicateBlock: (blockId) => dispatch({ type: 'DUPLICATE_BLOCK', blockId }),
    setActive: (blockId) => dispatch({ type: 'SET_ACTIVE', blockId }),
    setTemplate: (template) => dispatch({ type: 'SET_TEMPLATE', template }),
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', mode }),
    setZoom: (zoom) => dispatch({ type: 'SET_ZOOM', zoom }),
    setTitle: (title) => dispatch({ type: 'SET_TITLE', title }),
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),
    dispatch,
  }
}
