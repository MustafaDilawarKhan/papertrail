// src/components/Editor/Blocks/ReferencesBlock.jsx
// Auto-generated, read-only references list.
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES, IEEE_LEADING } from '../../../utils/ieeeConstants.js'
import { useCitations } from '../../../hooks/useCitations.js'
import { usePaper } from '../../../hooks/usePaper.js'

export default function ReferencesBlock({ block }) {
  const { citations, setHighlighted, clearHighlighted } = useCitations()
  const { blocks } = usePaper()

  const sorted = [...citations]
    .filter(c => c.globalIndex > 0)
    .sort((a, b) => a.globalIndex - b.globalIndex)

  const getSectionName = (blockId) => {
    const b = blocks.find(bl => bl.id === blockId)
    return b?.sectionTitle || b?.type || 'Unknown'
  }

  return (
    <div className="py-3">
      <div className="text-center mb-3" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.heading1, fontVariant: 'small-caps' }}>
        References
      </div>
      {sorted.length === 0 ? (
        <p className="text-center text-[11px] text-[#8E8E93] py-4">No citations yet. Use the citation tool to add references.</p>
      ) : (
        <div className="space-y-1">
          {sorted.map(cite => (
            <div
              key={cite.id}
              className="paper-reference-entry group/ref cursor-pointer hover:bg-[#4A7CFF]/5 rounded px-1 -mx-1 transition-colors"
              style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.reference, lineHeight: IEEE_LEADING.reference, paddingLeft: '2em', textIndent: '-2em' }}
              onMouseEnter={() => setHighlighted(cite.id)}
              onMouseLeave={() => clearHighlighted()}
            >
              <span>[{cite.globalIndex}]</span>{' '}
              {cite.authors.length > 0 && <span>{cite.authors.join(', ')}, </span>}
              <span>"{cite.title}," </span>
              {cite.journal && <span><em>{cite.journal}</em>, </span>}
              {cite.booktitle && <span>in <em>{cite.booktitle}</em>, </span>}
              {cite.volume && <span>vol. {cite.volume}, </span>}
              {cite.pages && <span>pp. {cite.pages}, </span>}
              {cite.year > 0 && <span>{cite.year}.</span>}

              {/* Used-in pills */}
              {cite.usedInBlocks && cite.usedInBlocks.length > 0 && (
                <span className="ml-2 inline-flex gap-1 opacity-0 group-hover/ref:opacity-100 transition-opacity">
                  {cite.usedInBlocks.map(bid => (
                    <span key={bid} className="text-[8px] bg-[#4A7CFF]/10 text-[#4A7CFF] px-1.5 py-0.5 rounded">{getSectionName(bid)}</span>
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
