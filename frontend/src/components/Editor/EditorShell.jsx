// src/components/Editor/EditorShell.jsx
// Root 4-zone layout: TopToolbar | LeftSidebar | PaperCanvas | RightSidebar | StatusBar

import React, { useState, useEffect } from 'react'
import TopToolbar from './TopToolbar.jsx'
import StatusBar from './StatusBar.jsx'
import LeftSidebar from './LeftSidebar/LeftSidebar.jsx'
import RightSidebar from './RightSidebar/RightSidebar.jsx'
import PaperCanvas from './Canvas/PaperCanvas.jsx'
import CitationSearchModal from './Citation/CitationSearchModal.jsx'
import { usePaper } from '../../hooks/usePaper.js'
import { generateLatex } from '../../utils/latexGenerator.js'
import { useCitations } from '../../hooks/useCitations.js'

export default function EditorShell() {
  const { viewMode, blocks, template } = usePaper()
  const { citations } = useCitations()
  const [citationModalOpen, setCitationModalOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        // undo handled in PaperContext
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        // redo handled in PaperContext
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const renderMainContent = () => {
    if (viewMode === 'latex') {
      const { tex } = generateLatex({ template, blocks }, citations)
      return (
        <div className="flex-1 overflow-auto bg-[#1C1C1E] p-8">
          <div className="max-w-4xl mx-auto">
            <pre className="bg-[#2C2C2E] text-[#F5F5F7] p-6 rounded-xl text-[11px] font-mono leading-relaxed border border-white/5 whitespace-pre-wrap break-words">
              {tex}
            </pre>
          </div>
        </div>
      )
    }

    if (viewMode === 'preview') {
      return <PaperCanvas />
    }

    return <PaperCanvas />
  }

  return (
    <div className="h-screen flex flex-col bg-[#1C1C1E] text-[#F5F5F7] overflow-hidden">
      {/* Top toolbar */}
      <TopToolbar onOpenCitation={() => setCitationModalOpen(true)} />

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {leftOpen && <LeftSidebar />}
        {renderMainContent()}
        {rightOpen && <RightSidebar />}
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Citation modal */}
      <CitationSearchModal
        open={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
        onInsert={() => {}}
      />
    </div>
  )
}
