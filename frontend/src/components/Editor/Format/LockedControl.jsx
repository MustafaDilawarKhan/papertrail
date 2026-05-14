// src/components/Editor/Format/LockedControl.jsx
// Grayed-out locked field with lock icon and tooltip.

import React, { useState } from 'react'
import { Lock } from 'lucide-react'

export default function LockedControl({ label, value, tooltip }) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div
      className="relative inline-flex items-center gap-1.5 select-none cursor-not-allowed"
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <Lock size={12} className="text-amber-400 flex-shrink-0" />
      <span className="text-xs text-[#8E8E93] truncate">{value || label}</span>
      {showTip && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-[#2C2C2E] text-[#F5F5F7] text-[11px] rounded-lg shadow-xl whitespace-nowrap z-50 border border-white/5">
          {tooltip}
          <div className="absolute top-full left-4 w-2 h-2 bg-[#2C2C2E] rotate-45 -mt-1 border-r border-b border-white/5" />
        </div>
      )}
    </div>
  )
}
