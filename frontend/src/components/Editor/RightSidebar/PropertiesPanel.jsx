// src/components/Editor/RightSidebar/PropertiesPanel.jsx
import React from 'react'
import { usePaper } from '../../../hooks/usePaper.js'
import LockedControl from '../Format/LockedControl.jsx'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'

const BLOCK_TYPE_LABELS = {
  title: 'Title & Authors', abstract: 'Abstract', keywords: 'Index Terms', section: 'Section',
  table: 'Table', figure: 'Figure', equation: 'Equation', code: 'Code Block',
  algorithm: 'Algorithm', references: 'References', acknowledgment: 'Acknowledgment',
  theorem: 'Theorem', appendix: 'Appendix',
}

export default function PropertiesPanel() {
  const { blocks, activeBlockId, updateBlock } = usePaper()
  const block = blocks.find(b => b.id === activeBlockId)

  if (!block) {
    return (
      <div className="text-center py-8">
        <p className="text-[#48484A] text-xs">Select a block to see its properties</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Block type header */}
      <div>
        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-2">Block Type</p>
        <p className="text-[#F5F5F7] text-sm font-semibold">{BLOCK_TYPE_LABELS[block.type] || block.type}</p>
      </div>

      {/* Locked IEEE Format Controls */}
      <div>
        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-3">IEEE Format (Locked)</p>
        <div className="space-y-2 bg-[#1C1C1E] rounded-lg p-3 border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8E8E93]">Font</span>
            <LockedControl value="Times New Roman" tooltip="Font is locked to Times New Roman (IEEE standard)" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8E8E93]">Size</span>
            <LockedControl value={IEEE_SIZES[block.type === 'section' ? 'body' : block.type] || IEEE_SIZES.body} tooltip="Font size is locked per IEEE specifications" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8E8E93]">Align</span>
            <LockedControl value="Justified" tooltip="Text alignment is locked to full-justified (IEEE standard)" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-[#8E8E93]">Page</span>
            <LockedControl value="US Letter" tooltip="Page size is locked to US Letter 8.5×11in (IEEE standard)" />
          </div>
        </div>
      </div>

      {/* Block-specific editable properties */}
      {block.type === 'section' && (
        <div>
          <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-2">Section</p>
          <label className="block mb-2">
            <span className="text-[11px] text-[#8E8E93]">Heading Level</span>
            <select
              value={block.level || 1}
              onChange={e => updateBlock(block.id, { level: parseInt(e.target.value) })}
              className="w-full mt-1 bg-[#1C1C1E] text-[#F5F5F7] px-3 py-2 rounded-lg text-xs outline-none border border-white/5"
            >
              <option value={1}>Level 1 — I. SECTION</option>
              <option value={2}>Level 2 — A. Subsection</option>
              <option value={3}>Level 3 — 1) Run-in</option>
            </select>
          </label>
        </div>
      )}

      {block.type === 'figure' && (
        <div>
          <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-2">Figure</p>
          <label className="block mb-2">
            <span className="text-[11px] text-[#8E8E93]">Width (%)</span>
            <input type="range" min={25} max={100} value={block.width || 100} onChange={e => updateBlock(block.id, { width: parseInt(e.target.value) })}
              className="w-full mt-1" />
            <span className="text-[10px] text-[#48484A]">{block.width || 100}%</span>
          </label>
          <label className="block mb-2">
            <span className="text-[11px] text-[#8E8E93]">Placement</span>
            <select value={block.placement || 't'} onChange={e => updateBlock(block.id, { placement: e.target.value })}
              className="w-full mt-1 bg-[#1C1C1E] text-[#F5F5F7] px-3 py-2 rounded-lg text-xs outline-none border border-white/5">
              <option value="t">Top of column [t]</option>
              <option value="b">Bottom of column [b]</option>
              <option value="H">Here exactly [H]</option>
            </select>
          </label>
        </div>
      )}

      {block.type === 'equation' && (
        <div>
          <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-2">Equation</p>
          <label className="flex items-center gap-2 text-[11px] text-[#F5F5F7]">
            <input type="checkbox" checked={block.numbered !== false} onChange={e => updateBlock(block.id, { numbered: e.target.checked })}
              className="rounded border-white/10" />
            Numbered equation
          </label>
        </div>
      )}

      {/* Column span */}
      <div>
        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-2">Layout</p>
        <select value={block.columnSpan || 'single'} onChange={e => updateBlock(block.id, { columnSpan: e.target.value })}
          className="w-full bg-[#1C1C1E] text-[#F5F5F7] px-3 py-2 rounded-lg text-xs outline-none border border-white/5">
          <option value="single">Single Column</option>
          <option value="full">Full Width</option>
        </select>
      </div>
    </div>
  )
}
