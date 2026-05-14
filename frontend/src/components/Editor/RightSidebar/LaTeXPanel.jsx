// src/components/Editor/RightSidebar/LaTeXPanel.jsx
import React, { useMemo } from 'react'
import { usePaper } from '../../../hooks/usePaper.js'
import { useCitations } from '../../../hooks/useCitations.js'
import { generateLatex } from '../../../utils/latexGenerator.js'
import { Copy, Check } from 'lucide-react'

export default function LaTeXPanel() {
  const paper = usePaper()
  const { citations } = useCitations()
  const [copied, setCopied] = React.useState(false)

  const { tex } = useMemo(
    () => generateLatex({ template: paper.template, blocks: paper.blocks }, citations),
    [paper.template, paper.blocks, citations]
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tex)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold">LaTeX Source</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-[#4A7CFF] hover:text-[#6B96FF] transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#1C1C1E] text-[#F5F5F7] p-3 rounded-lg text-[10px] font-mono leading-relaxed overflow-auto max-h-[calc(100vh-200px)] border border-white/5 whitespace-pre-wrap break-words">
        {tex}
      </pre>
    </div>
  )
}
