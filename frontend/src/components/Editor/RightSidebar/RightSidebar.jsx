// src/components/Editor/RightSidebar/RightSidebar.jsx
import React, { useState } from 'react'
import PropertiesPanel from './PropertiesPanel.jsx'
import AIPanel from './AIPanel.jsx'
import LaTeXPanel from './LaTeXPanel.jsx'
import { Settings2, Sparkles, Code2 } from 'lucide-react'

export default function RightSidebar() {
  const [tab, setTab] = useState('properties')

  return (
    <div className="w-[280px] bg-[#2C2C2E] border-l border-white/5 flex flex-col flex-shrink-0 h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-white/5">
        {[
          { id: 'properties', icon: Settings2, label: 'Properties' },
          { id: 'ai', icon: Sparkles, label: 'AI' },
          { id: 'latex', icon: Code2, label: 'LaTeX' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-3 text-[10px] font-semibold transition-colors ${tab === t.id ? 'text-[#F5F5F7] border-b-2 border-[#4A7CFF]' : 'text-[#8E8E93] hover:text-[#F5F5F7]'}`}
          >
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'properties' && <PropertiesPanel />}
        {tab === 'ai' && <AIPanel />}
        {tab === 'latex' && <LaTeXPanel />}
      </div>
    </div>
  )
}
