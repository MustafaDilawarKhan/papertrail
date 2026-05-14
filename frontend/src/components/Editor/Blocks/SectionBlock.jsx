// src/components/Editor/Blocks/SectionBlock.jsx
// Reusable for all body sections with TipTap rich text editing.
import React, { useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import TipTapLink from '@tiptap/extension-link'
import { IEEE_FONTS, IEEE_SIZES, IEEE_LEADING, IEEE_SPACING } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'

// Auto-generate section number from blocks array
function getSectionNumber(blocks, blockId) {
  let counter = 0
  for (const b of blocks) {
    if (b.type === 'section' && b.autoNumber !== false) {
      counter++
      if (b.id === blockId) return counter
    }
  }
  return 0
}

function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
  let result = ''
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i] }
  }
  return result
}

export default function SectionBlock({ block }) {
  const { updateBlock, blocks } = usePaper()
  const sectionNum = block.autoNumber !== false ? getSectionNumber(blocks, block.id) : null
  const prefix = sectionNum ? `${toRoman(sectionNum)}. ` : ''

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Underline,
      Superscript,
      Subscript,
      TextAlign.configure({ types: ['paragraph'] }),
      CharacterCount,
      TipTapLink.configure({ openOnClick: false }),
    ],
    content: block.content || '',
    onUpdate: ({ editor }) => {
      updateBlock(block.id, { content: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        class: 'paper-body outline-none min-h-[40px]',
        style: `font-family: ${IEEE_FONTS.body}; font-size: ${IEEE_SIZES.body}; line-height: ${IEEE_LEADING.body}; text-align: justify;`,
      },
    },
  }, [block.id])

  return (
    <div className="py-1">
      {/* Section heading */}
      <div className="flex items-center gap-1 mb-1">
        {sectionNum && (
          <span className="paper-heading-1 select-none" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.heading1, fontVariant: 'small-caps', textAlign: 'center', width: '100%', display: 'block' }}>
            {prefix}
          </span>
        )}
      </div>
      <input
        value={block.sectionTitle || ''}
        onChange={e => updateBlock(block.id, { sectionTitle: e.target.value })}
        className="w-full outline-none bg-transparent mb-2 text-center placeholder:text-[#ccc]"
        style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.heading1, fontVariant: 'small-caps' }}
        placeholder="Section Title"
      />

      {/* Body text editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
