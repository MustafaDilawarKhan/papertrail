// src/components/Editor/Blocks/TheoremBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES, IEEE_LEADING } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

const TYPES = ['theorem', 'lemma', 'proof', 'corollary', 'definition', 'proposition']

export default function TheoremBlock({ block }) {
  const { updateBlock } = usePaper()
  const type = block.theoremType || 'theorem'

  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        <select
          value={type}
          onChange={e => updateBlock(block.id, { theoremType: e.target.value })}
          className="text-[10px] bg-transparent outline-none font-bold capitalize"
          style={{ fontFamily: IEEE_FONTS.body }}
        >
          {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        {type !== 'proof' && (
          <input
            value={block.title || ''}
            onChange={e => updateBlock(block.id, { title: e.target.value })}
            placeholder="Title (optional)"
            className="outline-none bg-transparent text-[12px] italic placeholder:text-[#ccc]"
            style={{ fontFamily: IEEE_FONTS.body }}
          />
        )}
      </div>
      <div className="pl-4 border-l-2 border-[#4A7CFF]/30">
        <textarea
          value={block.content || ''}
          onChange={e => updateBlock(block.id, { content: e.target.value })}
          placeholder={`Enter ${type} content...`}
          className="w-full outline-none bg-transparent resize-none placeholder:text-[#ccc]"
          style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.body, lineHeight: IEEE_LEADING.body, fontStyle: type === 'proof' ? 'normal' : 'italic' }}
          rows={3}
        />
      </div>
    </div>
  )
}
