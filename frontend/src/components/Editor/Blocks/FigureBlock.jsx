// src/components/Editor/Blocks/FigureBlock.jsx
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { ImagePlus } from 'lucide-react'

export default function FigureBlock({ block }) {
  const { updateBlock } = usePaper()

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const url = URL.createObjectURL(file)
      updateBlock(block.id, { imageUrl: url, imageFile: file.name })
    }
  }, [block.id, updateBlock])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.eps'] }, maxFiles: 1 })

  return (
    <div className="py-4">
      {/* Image area */}
      {block.imageUrl ? (
        <div className="text-center">
          <img src={block.imageUrl} alt={block.caption || 'Figure'} className="max-w-full mx-auto rounded" style={{ maxHeight: 400 }} />
        </div>
      ) : (
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#4A7CFF] bg-[#4A7CFF]/5' : 'border-[#E5E5E0] hover:border-[#4A7CFF]/50'}`}>
          <input {...getInputProps()} />
          <ImagePlus size={32} className="mx-auto mb-3 text-[#8E8E93]" />
          <p className="text-[12px] text-[#8E8E93]">{isDragActive ? 'Drop image here' : 'Click or drag an image to upload'}</p>
          <p className="text-[10px] text-[#48484A] mt-1">PNG, JPG, SVG, or EPS</p>
        </div>
      )}

      {/* Caption BELOW figure (IEEE rule) */}
      <div className="paper-figure-caption text-center mt-2" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.figureCaption }}>
        <span style={{ fontWeight: 'bold' }}>Fig. 1. </span>
        <input
          value={block.caption || ''}
          onChange={e => updateBlock(block.id, { caption: e.target.value })}
          placeholder="Figure caption..."
          className="outline-none bg-transparent text-center placeholder:text-[#ccc]"
          style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.figureCaption }}
        />
      </div>
    </div>
  )
}
