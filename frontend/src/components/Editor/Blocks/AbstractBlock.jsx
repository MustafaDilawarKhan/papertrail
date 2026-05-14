// src/components/Editor/Blocks/AbstractBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES, IEEE_LEADING } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

export default function AbstractBlock({ block }) {
  const { updateBlock } = usePaper()
  const content = block.content || ''
  const wordCount = content.split(/\s+/).filter(Boolean).length

  return (
    <div className="py-3">
      <div style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.abstract, lineHeight: IEEE_LEADING.abstract }}>
        <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Abstract—</span>
        <textarea
          value={content}
          onChange={e => updateBlock(block.id, { content: e.target.value })}
          placeholder="Enter your abstract here (max 200 words)..."
          className="w-full outline-none bg-transparent resize-none placeholder:text-[#ccc]"
          style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.abstract, lineHeight: IEEE_LEADING.abstract, fontWeight: 'bold', minHeight: 80 }}
          rows={4}
        />
      </div>
      <div className={`text-right text-[10px] mt-1 ${wordCount > 200 ? 'text-red-500 font-bold' : 'text-[#8E8E93]'}`}>
        {wordCount}/200 words
      </div>
    </div>
  )
}
