// src/components/Editor/Blocks/TitleBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'

export default function TitleBlock({ block }) {
  const { updateBlock } = usePaper()
  const update = (updates) => updateBlock(block.id, updates)

  const addAuthor = () => {
    const authors = [...(block.authors || [])]
    authors.push({ id: nanoid(8), name: '', affiliation: '', affiliationIndex: authors.length + 1, email: '', orcid: '', isCorresponding: false })
    update({ authors })
  }

  const updateAuthor = (idx, field, value) => {
    const authors = [...(block.authors || [])]
    authors[idx] = { ...authors[idx], [field]: value }
    update({ authors })
  }

  const removeAuthor = (idx) => {
    const authors = (block.authors || []).filter((_, i) => i !== idx)
    update({ authors })
  }

  return (
    <div className="py-6">
      {/* Title */}
      <input
        value={block.title || ''}
        onChange={e => update({ title: e.target.value })}
        placeholder="Paper Title"
        className="w-full text-center outline-none bg-transparent placeholder:text-[#ccc]"
        style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.title, fontWeight: 'bold', color: '#1A1A1A', lineHeight: 1.2 }}
      />

      {/* Subtitle */}
      <input
        value={block.subtitle || ''}
        onChange={e => update({ subtitle: e.target.value })}
        placeholder="Subtitle (optional)"
        className="w-full text-center outline-none bg-transparent mt-2 placeholder:text-[#ddd]"
        style={{ fontFamily: IEEE_FONTS.body, fontSize: '18px', color: '#1A1A1A' }}
      />

      {/* Authors */}
      <div className="mt-6 space-y-4">
        {(block.authors || []).map((author, i) => (
          <div key={author.id || i} className="text-center relative group/author">
            <input
              value={author.name}
              onChange={e => updateAuthor(i, 'name', e.target.value)}
              placeholder="Author Name"
              className="text-center outline-none bg-transparent w-full placeholder:text-[#ccc]"
              style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.authorName }}
            />
            <input
              value={author.affiliation}
              onChange={e => updateAuthor(i, 'affiliation', e.target.value)}
              placeholder="Affiliation"
              className="text-center outline-none bg-transparent w-full placeholder:text-[#ccc]"
              style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.affiliation, fontStyle: 'italic' }}
            />
            <input
              value={author.email}
              onChange={e => updateAuthor(i, 'email', e.target.value)}
              placeholder="email@example.com"
              className="text-center outline-none bg-transparent w-full placeholder:text-[#ccc]"
              style={{ fontFamily: IEEE_FONTS.mono, fontSize: IEEE_SIZES.email }}
            />
            {(block.authors || []).length > 1 && (
              <button onClick={() => removeAuthor(i)} className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/author:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-opacity">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addAuthor} className="mx-auto flex items-center gap-1 text-[11px] text-[#4A7CFF] hover:text-[#6B96FF] transition-colors">
          <Plus size={12} /> Add Author
        </button>
      </div>
    </div>
  )
}
