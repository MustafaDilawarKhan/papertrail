// src/components/Editor/LeftSidebar/LeftSidebar.jsx
import React, { useState } from 'react'
import SectionsTab from './SectionsTab.jsx'
import ElementsTab from './ElementsTab.jsx'
import { LayoutList, Puzzle } from 'lucide-react'

export default function LeftSidebar() {
  const [tab, setTab] = useState('sections')

  return (
    <div className="w-[240px] bg-[#2C2C2E] border-r border-white/5 flex flex-col flex-shrink-0 h-full">
      {/* Tab switcher */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setTab('sections')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold transition-colors ${tab === 'sections' ? 'text-[#F5F5F7] border-b-2 border-[#4A7CFF]' : 'text-[#8E8E93] hover:text-[#F5F5F7]'}`}
        >
          <LayoutList size={13} /> Sections
        </button>
        <button
          onClick={() => setTab('elements')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-semibold transition-colors ${tab === 'elements' ? 'text-[#F5F5F7] border-b-2 border-[#4A7CFF]' : 'text-[#8E8E93] hover:text-[#F5F5F7]'}`}
        >
          <Puzzle size={13} /> Elements
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'sections' ? <SectionsTab /> : <ElementsTab />}
      </div>
    </div>
  )
}
