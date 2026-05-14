// src/components/Editor/Blocks/AcknowledgmentBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES, IEEE_LEADING } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

export default function AcknowledgmentBlock({ block }) {
  const { updateBlock } = usePaper()

  return (
    <div className="py-3">
      <div className="text-center mb-2" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.heading1, fontVariant: 'small-caps' }}>
        Acknowledgment
      </div>
      <textarea
        value={block.content || ''}
        onChange={e => updateBlock(block.id, { content: e.target.value })}
        placeholder="The authors would like to thank..."
        className="w-full outline-none bg-transparent resize-none placeholder:text-[#ccc]"
        style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.body, lineHeight: IEEE_LEADING.body, textAlign: 'justify', minHeight: 60 }}
        rows={3}
      />
    </div>
  )
}
