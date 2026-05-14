// src/contexts/PaperContext.jsx
// Paper state management — blocks, template, undo/redo, view mode.

import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { nanoid } from 'nanoid'

const PaperContext = createContext(null)

function createBlock(type, extra = {}) {
  const base = { id: nanoid(8), type, order: 0, columnSpan: 'single', collapsed: false }

  switch (type) {
    case 'title':
      return { ...base, columnSpan: 'full', title: '', subtitle: '', runningTitle: '', authors: [{ id: nanoid(8), name: '', affiliation: '', affiliationIndex: 1, email: '', orcid: '', isCorresponding: false }] }
    case 'abstract':
      return { ...base, columnSpan: 'full', content: '' }
    case 'keywords':
      return { ...base, columnSpan: 'full', keywords: [] }
    case 'section':
      return { ...base, sectionTitle: extra.sectionTitle || extra.label || 'New Section', sectionKey: extra.sectionKey || 'custom', content: '', autoNumber: true, level: 1 }
    case 'table':
      return { ...base, caption: '', label: `tab:table-${nanoid(4)}`, rows: [{ cells: [{ content: 'Header 1' }, { content: 'Header 2' }, { content: 'Header 3' }] }, { cells: [{ content: '' }, { content: '' }, { content: '' }] }], columns: [{ alignment: 'l' }, { alignment: 'l' }, { alignment: 'l' }], headerStyle: 'bold', topBorder: true, bottomBorder: true, rowStripes: false }
    case 'figure':
      return { ...base, caption: '', label: `fig:figure-${nanoid(4)}`, imageUrl: '', imageFile: null, width: 100, placement: 't' }
    case 'equation':
      return { ...base, latex: '', numbered: true, label: `eq:eq-${nanoid(4)}`, displayNumber: null }
    case 'code':
      return { ...base, code: '', language: 'Python', caption: '', label: `lst:code-${nanoid(4)}` }
    case 'algorithm':
      return { ...base, title: 'Algorithm', steps: [{ lineNumber: 1, indent: 0, keyword: '', content: '' }], label: `alg:alg-${nanoid(4)}` }
    case 'references':
      return { ...base, columnSpan: 'full' }
    case 'acknowledgment':
      return { ...base, content: '' }
    case 'appendix':
      return { ...base, sectionTitle: 'Appendix', content: '' }
    case 'theorem':
      return { ...base, theoremType: 'theorem', title: '', content: '' }
    case 'divider':
      return { ...base }
    case 'list':
      return { ...base, listType: extra.listType || 'bullet', items: [''] }
    default:
      return { ...base, content: '' }
  }
}

const DEFAULT_BLOCKS = [
  createBlock('title'),
  createBlock('abstract'),
  createBlock('keywords'),
  createBlock('section', { sectionTitle: 'Introduction', sectionKey: 'introduction' }),
  createBlock('section', { sectionTitle: 'Related Work', sectionKey: 'related-work' }),
  createBlock('section', { sectionTitle: 'Methodology', sectionKey: 'methodology' }),
  createBlock('section', { sectionTitle: 'Results', sectionKey: 'results' }),
  createBlock('section', { sectionTitle: 'Conclusion', sectionKey: 'conclusion' }),
  createBlock('acknowledgment'),
  createBlock('references'),
].map((b, i) => ({ ...b, order: i }))

const initialState = {
  paperId: null,
  title: 'Untitled Paper',
  template: 'ieee-conference',
  blocks: DEFAULT_BLOCKS,
  activeBlockId: null,
  isDragging: false,
  viewMode: 'editor',
  zoom: 100,
  history: [],
  historyIndex: -1,
  lastSaved: null,
}

function pushHistory(state) {
  const snapshot = JSON.stringify(state.blocks)
  const history = state.history.slice(0, state.historyIndex + 1)
  history.push(snapshot)
  if (history.length > 50) history.shift()
  return { history, historyIndex: history.length - 1 }
}

function paperReducer(state, action) {
  switch (action.type) {
    case 'ADD_BLOCK': {
      const newBlock = createBlock(action.blockType, action.extra || {})
      const afterIdx = action.afterBlockId
        ? state.blocks.findIndex(b => b.id === action.afterBlockId)
        : state.blocks.length - 1
      const insertIdx = afterIdx + 1
      const blocks = [...state.blocks]
      blocks.splice(insertIdx, 0, newBlock)
      const reordered = blocks.map((b, i) => ({ ...b, order: i }))
      return { ...state, blocks: reordered, activeBlockId: newBlock.id, ...pushHistory({ ...state, blocks: reordered }) }
    }
    case 'REMOVE_BLOCK': {
      const blocks = state.blocks.filter(b => b.id !== action.blockId).map((b, i) => ({ ...b, order: i }))
      const hist = pushHistory({ ...state, blocks })
      return { ...state, blocks, activeBlockId: state.activeBlockId === action.blockId ? null : state.activeBlockId, ...hist }
    }
    case 'UPDATE_BLOCK': {
      const blocks = state.blocks.map(b => b.id === action.blockId ? { ...b, ...action.updates } : b)
      return { ...state, blocks }
    }
    case 'REORDER_BLOCKS': {
      const blocks = [...state.blocks]
      const [moved] = blocks.splice(action.fromIndex, 1)
      blocks.splice(action.toIndex, 0, moved)
      const reordered = blocks.map((b, i) => ({ ...b, order: i }))
      return { ...state, blocks: reordered, ...pushHistory({ ...state, blocks: reordered }) }
    }
    case 'DUPLICATE_BLOCK': {
      const idx = state.blocks.findIndex(b => b.id === action.blockId)
      if (idx === -1) return state
      const clone = { ...JSON.parse(JSON.stringify(state.blocks[idx])), id: nanoid(8) }
      const blocks = [...state.blocks]
      blocks.splice(idx + 1, 0, clone)
      const reordered = blocks.map((b, i) => ({ ...b, order: i }))
      return { ...state, blocks: reordered, activeBlockId: clone.id, ...pushHistory({ ...state, blocks: reordered }) }
    }
    case 'SET_ACTIVE':
      return { ...state, activeBlockId: action.blockId }
    case 'SET_TEMPLATE':
      return { ...state, template: action.template }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(50, Math.min(200, action.zoom)) }
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.isDragging }
    case 'SET_TITLE':
      return { ...state, title: action.title }
    case 'SET_SAVED':
      return { ...state, lastSaved: Date.now() }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state
      const idx = state.historyIndex - 1
      const blocks = JSON.parse(state.history[idx])
      return { ...state, blocks, historyIndex: idx }
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state
      const idx = state.historyIndex + 1
      const blocks = JSON.parse(state.history[idx])
      return { ...state, blocks, historyIndex: idx }
    }
    case 'LOAD_PAPER':
      return { ...state, ...action.paper }
    default:
      return state
  }
}

export function PaperProvider({ children }) {
  const [state, dispatch] = useReducer(paperReducer, initialState)
  return <PaperContext.Provider value={{ state, dispatch }}>{children}</PaperContext.Provider>
}

export function usePaperContext() {
  const ctx = useContext(PaperContext)
  if (!ctx) throw new Error('usePaperContext must be used within PaperProvider')
  return ctx
}

export default PaperContext
