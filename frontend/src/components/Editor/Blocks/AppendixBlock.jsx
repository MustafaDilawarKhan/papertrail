// src/components/Editor/Blocks/AppendixBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES, IEEE_LEADING } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

export default function AppendixBlock({ block }) {
  const { updateBlock } = usePaper()

  return (
    <div className="py-3">
      <input
        value={block.sectionTitle || 'Appendix'}
        onChange={e => updateBlock(block.id, { sectionTitle: e.target.value })}
        className="w-full text-center outline-none bg-transparent mb-2 placeholder:text-[#ccc]"
        style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.heading1, fontVariant: 'small-caps' }}
      />
      <textarea
        value={block.content || ''}
        onChange={e => updateBlock(block.id, { content: e.target.value })}
        placeholder="Appendix content..."
        className="w-full outline-none bg-transparent resize-none placeholder:text-[#ccc]"
        style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.body, lineHeight: IEEE_LEADING.body, textAlign: 'justify', minHeight: 80 }}
        rows={4}
      />
    </div>
  )
}
