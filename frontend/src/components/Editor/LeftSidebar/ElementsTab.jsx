// src/components/Editor/LeftSidebar/ElementsTab.jsx
import React from 'react'
import IEEE_ELEMENTS from '../../../data/ieeeElements.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { Plus } from 'lucide-react'

export default function ElementsTab() {
  const { addBlock, activeBlockId } = usePaper()

  const handleAdd = (element) => {
    addBlock(element.blockType, activeBlockId, {
      listType: element.listType,
      label: element.label,
    })
  }

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-semibold px-2 py-2">Elements</p>
      {IEEE_ELEMENTS.map(element => (
        <button
          key={element.id}
          onClick={() => handleAdd(element)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-white/5 transition-colors group"
        >
          <span className="material-symbols-outlined text-[16px] text-[#8E8E93] group-hover:text-[#4A7CFF]">{element.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#F5F5F7] font-medium truncate">{element.label}</p>
            <p className="text-[10px] text-[#48484A] truncate">{element.description}</p>
          </div>
          <Plus size={12} className="text-[#48484A] group-hover:text-[#4A7CFF] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  )
}
