// src/components/Editor/RightSidebar/AIPanel.jsx
import React, { useState } from 'react'
import { Sparkles, Wand2, FileText, LayoutList, Loader2 } from 'lucide-react'

export default function AIPanel() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async (type) => {
    setLoading(true)
    // Simulate AI response
    setTimeout(() => {
      setResult(`AI-generated ${type} content would appear here. Connect to your AI backend for live responses.`)
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} className="text-[#4A7CFF]" />
        <p className="text-[12px] text-[#F5F5F7] font-semibold">AI Assistant</p>
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold">Quick Actions</p>
        {[
          { icon: Wand2, label: 'Improve Selected Text', action: 'improve' },
          { icon: FileText, label: 'Generate Abstract', action: 'abstract' },
          { icon: LayoutList, label: 'Suggest Outline', action: 'outline' },
        ].map(item => (
          <button
            key={item.action}
            onClick={() => handleGenerate(item.action)}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#1C1C1E] rounded-lg text-left text-[11px] text-[#F5F5F7] hover:bg-white/5 border border-white/5 transition-colors disabled:opacity-50"
          >
            <item.icon size={13} className="text-[#4A7CFF]" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div>
        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold mb-2">Custom Prompt</p>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. Rephrase this paragraph for clarity..."
          className="w-full bg-[#1C1C1E] text-[#F5F5F7] px-3 py-2 rounded-lg text-xs outline-none border border-white/5 focus:border-[#4A7CFF] resize-none placeholder:text-[#48484A]"
          rows={3}
        />
        <button
          onClick={() => handleGenerate('custom')}
          disabled={loading || !prompt.trim()}
          className="w-full mt-2 bg-[#4A7CFF] text-white py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          Generate
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-[#1C1C1E] rounded-lg p-3 border border-[#4A7CFF]/20">
          <p className="text-[10px] text-[#4A7CFF] font-semibold mb-1">AI Response</p>
          <p className="text-[11px] text-[#F5F5F7] leading-relaxed">{result}</p>
          <button className="mt-2 text-[10px] text-[#4A7CFF] hover:text-[#6B96FF]">Insert into document →</button>
        </div>
      )}
    </div>
  )
}
