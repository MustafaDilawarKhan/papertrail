// src/components/Editor/Blocks/EquationBlock.jsx
import React, { useState, useEffect, useRef } from 'react'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

export default function EquationBlock({ block }) {
  const { updateBlock } = usePaper()
  const [editing, setEditing] = useState(!block.latex)
  const [renderedHtml, setRenderedHtml] = useState('')
  const katexRef = useRef(null)

  // Load KaTeX dynamically
  useEffect(() => {
    import('katex').then(mod => { katexRef.current = mod.default || mod })
      .catch(() => { /* KaTeX not available */ })
  }, [])

  useEffect(() => {
    if (block.latex && katexRef.current) {
      try {
        const html = katexRef.current.renderToString(block.latex, { displayMode: true, throwOnError: false })
        setRenderedHtml(html)
      } catch {
        setRenderedHtml('<span style="color:red">Invalid LaTeX</span>')
      }
    } else if (block.latex) {
      setRenderedHtml(`<code>${block.latex}</code>`)
    }
  }, [block.latex])

  return (
    <div className="py-3">
      <div className="paper-equation relative flex items-center" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.body }}>
        <div className="flex-1 text-center">
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={block.latex || ''}
                onChange={e => updateBlock(block.id, { latex: e.target.value })}
                placeholder="Enter LaTeX equation... e.g. E = mc^2"
                className="w-full outline-none bg-[#f5f5f5] p-3 rounded text-sm font-mono resize-none border border-[#E5E5E0] focus:border-[#4A7CFF]"
                rows={2}
                onBlur={() => block.latex && setEditing(false)}
                autoFocus
              />
              {renderedHtml && (
                <div className="p-3 bg-white rounded border border-[#E5E5E0]" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
              )}
            </div>
          ) : (
            <div
              className="cursor-pointer p-3 hover:bg-[#f5f5f5] rounded transition-colors"
              onClick={() => setEditing(true)}
              dangerouslySetInnerHTML={{ __html: renderedHtml || '<span class="text-[#ccc]">Click to edit equation</span>' }}
            />
          )}
        </div>
        {block.numbered !== false && (
          <span className="paper-equation-number absolute right-0" style={{ fontSize: IEEE_SIZES.body }}>
            ({block.displayNumber || '?'})
          </span>
        )}
      </div>
    </div>
  )
}
