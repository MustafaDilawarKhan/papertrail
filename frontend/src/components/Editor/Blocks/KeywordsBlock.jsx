// src/components/Editor/Blocks/KeywordsBlock.jsx
import React, { useState } from 'react'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { X } from 'lucide-react'

export default function KeywordsBlock({ block }) {
  const { updateBlock } = usePaper()
  const [input, setInput] = useState('')
  const keywords = block.keywords || []

  const addKeyword = () => {
    const val = input.trim()
    if (val && !keywords.includes(val)) {
      updateBlock(block.id, { keywords: [...keywords, val] })
      setInput('')
    }
  }

  const removeKeyword = (idx) => {
    updateBlock(block.id, { keywords: keywords.filter((_, i) => i !== idx) })
  }

  return (
    <div className="py-2" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.keywords }}>
      <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Index Terms—</span>
      <span className="inline-flex flex-wrap items-center gap-1 ml-1">
        {keywords.map((kw, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-[#4A7CFF]/10 text-[#4A7CFF] px-2 py-0.5 rounded text-[11px]">
            {kw}
            <button onClick={() => removeKeyword(i)} className="hover:text-red-400"><X size={10} /></button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword() } }}
          placeholder="Add keyword..."
          className="outline-none bg-transparent w-24 text-[11px] placeholder:text-[#ccc]"
        />
      </span>
    </div>
  )
}
