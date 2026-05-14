// src/components/Editor/Canvas/PaperCanvas.jsx
// US Letter page engine with drag-and-drop block rendering.

import React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { usePaper } from '../../../hooks/usePaper.js'
import { useCitations } from '../../../hooks/useCitations.js'
import { IEEE_PAGE, IEEE_CSS_VARS } from '../../../utils/ieeeConstants.js'
import { getBlockComponent } from '../../../utils/blockRegistry.js'
import BlockWrapper from '../Blocks/BlockWrapper.jsx'

export default function PaperCanvas() {
  const { blocks, activeBlockId, setActive, reorderBlocks, removeBlock, duplicateBlock, zoom, template } = usePaper()
  const { reindexCitations } = useCitations()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIdx = blocks.findIndex(b => b.id === active.id)
      const newIdx = blocks.findIndex(b => b.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1) {
        reorderBlocks(oldIdx, newIdx)
        // Re-index citations after reorder
        setTimeout(() => reindexCitations(blocks), 0)
      }
    }
  }

  const isTwoColumn = template !== 'ieee-single'

  return (
    <div className="flex-1 overflow-auto bg-[#1C1C1E] flex justify-center py-8 px-4">
      <div
        className="bg-[#FAFAF8] shadow-2xl relative flex-shrink-0"
        style={{
          width: IEEE_PAGE.width,
          minHeight: IEEE_PAGE.height,
          padding: `${IEEE_PAGE.marginTop} ${IEEE_PAGE.marginRight} ${IEEE_PAGE.marginBottom} ${IEEE_PAGE.marginLeft}`,
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          ...IEEE_CSS_VARS,
        }}
        onClick={() => setActive(null)}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, idx) => {
              const BlockComponent = getBlockComponent(block.type)
              if (!BlockComponent) return null

              return (
                <BlockWrapper
                  key={block.id}
                  id={block.id}
                  isActive={activeBlockId === block.id}
                  onSelect={() => setActive(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onDelete={() => removeBlock(block.id)}
                  onMoveUp={() => idx > 0 && reorderBlocks(idx, idx - 1)}
                  onMoveDown={() => idx < blocks.length - 1 && reorderBlocks(idx, idx + 1)}
                >
                  <BlockComponent block={block} />
                </BlockWrapper>
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
