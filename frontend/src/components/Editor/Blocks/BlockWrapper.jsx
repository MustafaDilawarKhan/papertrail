// src/components/Editor/Blocks/BlockWrapper.jsx
// Universal wrapper for every block — provides drag handle, hover toolbar, and active state.

import React, { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronUp, ChevronDown, Copy, Trash2, MoreHorizontal } from 'lucide-react'

export default function BlockWrapper({ id, children, isActive, onSelect, onDuplicate, onDelete, onMoveUp, onMoveDown, isDragOverlay }) {
  const [hovered, setHovered] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg transition-all duration-150 ${isActive ? 'ring-2 ring-[#4A7CFF]/40 bg-[#4A7CFF]/[0.03]' : ''} ${isDragging ? 'z-50' : ''}`}
      onClick={(e) => { e.stopPropagation(); onSelect?.() }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover toolbar */}
      {hovered && !isDragOverlay && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-20">
          <button {...attributes} {...listeners} className="p-1 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing text-[#8E8E93] hover:text-[#F5F5F7]" title="Drag to reorder">
            <GripVertical size={14} />
          </button>
        </div>
      )}

      {hovered && !isDragOverlay && (
        <div className="absolute -right-2 top-0 translate-x-full flex flex-col gap-0.5 bg-[#2C2C2E] rounded-lg border border-white/5 p-1 z-20 shadow-xl">
          <button onClick={(e) => { e.stopPropagation(); onMoveUp?.() }} className="p-1 rounded hover:bg-white/10 text-[#8E8E93] hover:text-[#F5F5F7]" title="Move up"><ChevronUp size={13} /></button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown?.() }} className="p-1 rounded hover:bg-white/10 text-[#8E8E93] hover:text-[#F5F5F7]" title="Move down"><ChevronDown size={13} /></button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate?.() }} className="p-1 rounded hover:bg-white/10 text-[#8E8E93] hover:text-[#F5F5F7]" title="Duplicate"><Copy size={13} /></button>
          <div className="border-t border-white/5 my-0.5" />
          <button onClick={(e) => { e.stopPropagation(); onDelete?.() }} className="p-1 rounded hover:bg-red-500/20 text-[#8E8E93] hover:text-red-400" title="Delete"><Trash2 size={13} /></button>
        </div>
      )}

      <div className="relative">{children}</div>
    </div>
  )
}
