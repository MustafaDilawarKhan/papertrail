// src/components/Editor/Blocks/AlgorithmBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { Plus, Trash2 } from 'lucide-react'

const KEYWORDS = ['', 'Input:', 'Output:', 'for', 'while', 'if', 'else', 'return', 'repeat', 'until', 'do', 'end']

export default function AlgorithmBlock({ block }) {
  const { updateBlock } = usePaper()
  const steps = block.steps || []

  const updateStep = (idx, field, value) => {
    const newSteps = steps.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    updateBlock(block.id, { steps: newSteps })
  }

  const addStep = () => {
    updateBlock(block.id, { steps: [...steps, { lineNumber: steps.length + 1, indent: 0, keyword: '', content: '' }] })
  }

  const removeStep = (idx) => {
    updateBlock(block.id, { steps: steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, lineNumber: i + 1 })) })
  }

  return (
    <div className="py-3">
      <div className="text-center mb-2" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.algorithm, fontWeight: 'bold' }}>
        <span>Algorithm 1: </span>
        <input
          value={block.title || ''}
          onChange={e => updateBlock(block.id, { title: e.target.value })}
          placeholder="Algorithm title..."
          className="outline-none bg-transparent font-bold placeholder:text-[#ccc]"
        />
      </div>
      <div className="border border-[#1a1a1a] rounded p-3" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.algorithm }}>
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1 group/step py-0.5" style={{ paddingLeft: (step.indent || 0) * 16 }}>
            <span className="text-[#8E8E93] text-[10px] w-5 text-right flex-shrink-0">{step.lineNumber}</span>
            <select
              value={step.keyword || ''}
              onChange={e => updateStep(i, 'keyword', e.target.value)}
              className="text-[11px] outline-none bg-transparent font-bold w-16 flex-shrink-0"
            >
              {KEYWORDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <input
              value={step.content || ''}
              onChange={e => updateStep(i, 'content', e.target.value)}
              className="flex-1 outline-none bg-transparent text-[12px]"
              placeholder="..."
            />
            <div className="flex items-center gap-0.5 opacity-0 group-hover/step:opacity-100">
              <button onClick={() => updateStep(i, 'indent', Math.min((step.indent || 0) + 1, 4))} className="text-[9px] text-[#8E8E93] hover:text-[#4A7CFF] px-1">→</button>
              <button onClick={() => updateStep(i, 'indent', Math.max((step.indent || 0) - 1, 0))} className="text-[9px] text-[#8E8E93] hover:text-[#4A7CFF] px-1">←</button>
              <button onClick={() => removeStep(i)} className="text-[#8E8E93] hover:text-red-400"><Trash2 size={10} /></button>
            </div>
          </div>
        ))}
        <button onClick={addStep} className="flex items-center gap-1 text-[10px] text-[#4A7CFF] hover:text-[#6B96FF] mt-2">
          <Plus size={10} /> Add Step
        </button>
      </div>
    </div>
  )
}
