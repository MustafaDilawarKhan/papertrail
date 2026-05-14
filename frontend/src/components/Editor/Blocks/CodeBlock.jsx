// src/components/Editor/Blocks/CodeBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

const LANGUAGES = ['Python', 'C', 'C++', 'Java', 'JavaScript', 'MATLAB', 'R', 'SQL', 'Bash', 'LaTeX']

export default function CodeBlock({ block }) {
  const { updateBlock } = usePaper()

  return (
    <div className="py-3">
      <div className="flex items-center gap-2 mb-1">
        <select
          value={block.language || 'Python'}
          onChange={e => updateBlock(block.id, { language: e.target.value })}
          className="text-[10px] bg-[#2C2C2E] text-[#F5F5F7] rounded px-2 py-1 outline-none border border-white/10"
        >
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input
          value={block.caption || ''}
          onChange={e => updateBlock(block.id, { caption: e.target.value })}
          placeholder="Caption (optional)"
          className="flex-1 text-[10px] outline-none bg-transparent text-[#8E8E93] placeholder:text-[#48484A]"
        />
      </div>
      <textarea
        value={block.code || ''}
        onChange={e => updateBlock(block.id, { code: e.target.value })}
        placeholder="// Paste or type code here..."
        className="w-full outline-none p-3 rounded-lg resize-none border border-[#E5E5E0] bg-[#FAFAF8]"
        style={{ fontFamily: IEEE_FONTS.mono, fontSize: IEEE_SIZES.code, lineHeight: '1.5', tabSize: 2 }}
        rows={6}
        spellCheck={false}
      />
    </div>
  )
}
