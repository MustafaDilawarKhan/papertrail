// src/components/Editor/LeftSidebar/SectionsTab.jsx
import React from 'react'
import IEEE_SECTIONS from '../../../data/ieeeSections.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { Plus } from 'lucide-react'

export default function SectionsTab() {
  const { addBlock, blocks } = usePaper()

  const handleAdd = (section) => {
    const lastBlock = blocks[blocks.length - 1]
    addBlock(section.blockType, lastBlock?.id, {
      sectionTitle: section.label,
      sectionKey: section.sectionKey,
      label: section.label,
    })
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold px-2 py-2">IEEE Sections</p>
      {IEEE_SECTIONS.map(section => (
        <button
          key={section.id}
          onClick={() => handleAdd(section)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors group"
        >
          <span className="material-symbols-outlined text-[16px] text-[#8E8E93] group-hover:text-[#4A7CFF]">{section.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#F5F5F7] font-medium truncate">{section.label}</p>
            <p className="text-[10px] text-[#48484A] truncate">{section.description}</p>
          </div>
          <Plus size={12} className="text-[#48484A] group-hover:text-[#4A7CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  )
}
