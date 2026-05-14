// src/components/Editor/TopToolbar.jsx
import React, { useState, useEffect } from 'react'
import { usePaper } from '../../hooks/usePaper.js'
import { useCitations } from '../../hooks/useCitations.js'
import { downloadTexFile } from '../../services/latexExportService.js'
import IEEE_TEMPLATES from '../../data/ieeeTemplates.js'
import { Undo2, Redo2, Eye, Code2, PenLine, Share2, Download, BookOpen, ChevronDown, Check } from 'lucide-react'

export default function TopToolbar({ onOpenCitation }) {
  const paper = usePaper()
  const { citations } = useCitations()
  const [templateOpen, setTemplateOpen] = useState(false)
  const [savedText, setSavedText] = useState('')

  // Auto-save indicator
  useEffect(() => {
    const timer = setInterval(() => {
      paper.dispatch({ type: 'SET_SAVED' })
      setSavedText('Saved')
      setTimeout(() => setSavedText(''), 2000)
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const currentTemplate = IEEE_TEMPLATES.find(t => t.id === paper.template) || IEEE_TEMPLATES[0]

  const handleExport = () => {
    downloadTexFile({ template: paper.template, blocks: paper.blocks }, citations, paper.title?.replace(/\s+/g, '_') || 'paper')
  }

  return (
    <div className="h-12 bg-[#2C2C2E] border-b border-white/5 flex items-center px-4 gap-2 flex-shrink-0">
      {/* Logo + Title */}
      <a href="#/dashboard" className="flex items-center gap-2 mr-2 flex-shrink-0">
        <span className="w-6 h-6 rounded bg-[#4A7CFF] flex items-center justify-center text-white text-[10px] font-bold">P</span>
      </a>
      <input
        value={paper.title || ''}
        onChange={e => paper.setTitle(e.target.value)}
        className="bg-transparent text-[#F5F5F7] text-sm font-medium outline-none w-48 truncate hover:bg-white/5 px-2 py-1 rounded transition-colors"
        placeholder="Untitled Paper"
      />

      {/* Template selector */}
      <div className="relative ml-2">
        <button onClick={() => setTemplateOpen(!templateOpen)} className="flex items-center gap-1.5 bg-[#1C1C1E] text-[#8E8E93] px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-white/5 hover:border-white/10 transition-colors">
          <BookOpen size={12} /> {currentTemplate.label} <ChevronDown size={10} />
        </button>
        {templateOpen && (
          <div className="absolute top-full mt-1 left-0 bg-[#2C2C2E] border border-white/5 rounded-lg shadow-xl z-50 w-56 py-1">
            {IEEE_TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { paper.setTemplate(t.id); setTemplateOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-white/5 transition-colors">
                {paper.template === t.id && <Check size={12} className="text-[#4A7CFF]" />}
                <div className={paper.template === t.id ? '' : 'ml-5'}>
                  <p className="text-[#F5F5F7] font-medium">{t.label}</p>
                  <p className="text-[#48484A] text-[9px]">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/5 mx-1" />

      {/* Undo/Redo */}
      <button onClick={paper.undo} className="p-1.5 rounded hover:bg-white/5 text-[#8E8E93] hover:text-[#F5F5F7] transition-colors" title="Undo (Ctrl+Z)"><Undo2 size={15} /></button>
      <button onClick={paper.redo} className="p-1.5 rounded hover:bg-white/5 text-[#8E8E93] hover:text-[#F5F5F7] transition-colors" title="Redo (Ctrl+Shift+Z)"><Redo2 size={15} /></button>

      <div className="w-px h-5 bg-white/5 mx-1" />

      {/* View mode toggle */}
      <div className="flex bg-[#1C1C1E] rounded-lg p-0.5 border border-white/5">
        {[
          { id: 'editor', icon: PenLine, label: 'Editor' },
          { id: 'preview', icon: Eye, label: 'Preview' },
          { id: 'latex', icon: Code2, label: 'LaTeX' },
        ].map(v => (
          <button key={v.id} onClick={() => paper.setViewMode(v.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold transition-colors ${paper.viewMode === v.id ? 'bg-[#4A7CFF] text-white' : 'text-[#8E8E93] hover:text-[#F5F5F7]'}`}>
            <v.icon size={11} />{v.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save indicator */}
      {savedText && (
        <span className="text-[10px] text-[#32D74B] flex items-center gap-1"><Check size={10} />{savedText}</span>
      )}

      {/* Actions */}
      <button className="p-1.5 rounded hover:bg-white/5 text-[#8E8E93] hover:text-[#F5F5F7] transition-colors" title="Share"><Share2 size={15} /></button>
      <button onClick={handleExport} className="flex items-center gap-1.5 bg-[#1C1C1E] text-[#F5F5F7] px-3 py-1.5 rounded-lg text-[10px] font-semibold border border-white/5 hover:bg-white/5 transition-colors" title="Export .tex + .bib">
        <Download size={12} /> Export
      </button>
      <button className="flex items-center gap-1.5 bg-[#4A7CFF] text-white px-4 py-1.5 rounded-lg text-[10px] font-semibold hover:bg-[#6B96FF] transition-colors">
        Publish
      </button>
    </div>
  )
}
