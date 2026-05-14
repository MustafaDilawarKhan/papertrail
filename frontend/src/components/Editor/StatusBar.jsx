// src/components/Editor/StatusBar.jsx
import React, { useMemo, useState } from 'react'
import { usePaper } from '../../hooks/usePaper.js'
import { useCitations } from '../../hooks/useCitations.js'
import { useFormatGuard } from '../../hooks/useFormatGuard.js'
import { AlertTriangle, ChevronDown, ChevronUp, Minus, Plus, Maximize2, Columns2 } from 'lucide-react'

export default function StatusBar() {
  const { blocks, zoom, setZoom, template } = usePaper()
  const { citations } = useCitations()
  const warnings = useFormatGuard(blocks, citations)
  const [warningsOpen, setWarningsOpen] = useState(false)

  const wordCount = useMemo(() => {
    let count = 0
    for (const b of blocks) {
      const text = (b.content || b.title || '')
        .replace(/<[^>]+>/g, '')
      count += text.split(/\s+/).filter(Boolean).length
    }
    return count
  }, [blocks])

  const figCount = blocks.filter(b => b.type === 'figure').length
  const tableCount = blocks.filter(b => b.type === 'table').length
  const eqCount = blocks.filter(b => b.type === 'equation').length
  const templateLabel = template === 'ieee-single' ? 'Single Column' : 'Two Column'

  return (
    <>
      <div className="h-7 bg-[#2C2C2E] border-t border-white/5 flex items-center px-4 text-[10px] text-[#8E8E93] gap-4 flex-shrink-0 select-none">
        <span>Words: <strong className="text-[#F5F5F7]">{wordCount.toLocaleString()}</strong></span>
        <span className="w-px h-3 bg-white/5" />
        <span>Refs: <strong className="text-[#F5F5F7]">{citations.length}</strong></span>
        <span className="w-px h-3 bg-white/5" />
        <span>Fig: {figCount} · Tab: {tableCount} · Eq: {eqCount}</span>

        {warnings.length > 0 && (
          <>
            <span className="w-px h-3 bg-white/5" />
            <button onClick={() => setWarningsOpen(!warningsOpen)} className="flex items-center gap-1 text-[#FF9F0A] hover:text-[#FFB340] transition-colors">
              <AlertTriangle size={11} /> {warnings.length} warning{warnings.length > 1 ? 's' : ''}
              {warningsOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
            </button>
          </>
        )}

        <div className="flex-1" />

        <span className="flex items-center gap-1"><Columns2 size={11} /> {templateLabel}</span>
        <span className="w-px h-3 bg-white/5" />

        {/* Zoom controls */}
        <button onClick={() => setZoom(zoom - 10)} className="hover:text-[#F5F5F7]"><Minus size={11} /></button>
        <span className="text-[#F5F5F7] w-8 text-center">{zoom}%</span>
        <button onClick={() => setZoom(zoom + 10)} className="hover:text-[#F5F5F7]"><Plus size={11} /></button>
        <button onClick={() => setZoom(100)} className="hover:text-[#F5F5F7] ml-1" title="Reset zoom"><Maximize2 size={11} /></button>
      </div>

      {/* Warnings panel */}
      {warningsOpen && warnings.length > 0 && (
        <div className="bg-[#1C1C1E] border-t border-white/5 px-4 py-2 space-y-1 max-h-32 overflow-y-auto">
          {warnings.map(w => (
            <div key={w.id} className="flex items-center gap-2 text-[10px]">
              <AlertTriangle size={10} className={w.severity === 'error' ? 'text-[#FF453A]' : w.severity === 'warning' ? 'text-[#FF9F0A]' : 'text-[#4A7CFF]'} />
              <span className="text-[#F5F5F7]">{w.message}</span>
              {w.blockId && <button className="text-[#4A7CFF] hover:underline ml-auto">Jump to</button>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
