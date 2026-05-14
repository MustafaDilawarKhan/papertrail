// src/components/Editor/Blocks/TableBlock.jsx
import React from 'react'
import { IEEE_FONTS, IEEE_SIZES } from '../../../utils/ieeeConstants.js'
import { usePaper } from '../../../hooks/usePaper.js'
import { Plus, Trash2 } from 'lucide-react'

export default function TableBlock({ block }) {
  const { updateBlock } = usePaper()
  const rows = block.rows || []
  const columns = block.columns || []

  const updateCell = (ri, ci, value) => {
    const newRows = rows.map((r, i) => i === ri ? { ...r, cells: r.cells.map((c, j) => j === ci ? { ...c, content: value } : c) } : r)
    updateBlock(block.id, { rows: newRows })
  }

  const addRow = () => {
    const newRow = { cells: columns.map(() => ({ content: '' })) }
    updateBlock(block.id, { rows: [...rows, newRow] })
  }

  const addColumn = () => {
    const newCols = [...columns, { alignment: 'l' }]
    const newRows = rows.map(r => ({ ...r, cells: [...r.cells, { content: '' }] }))
    updateBlock(block.id, { columns: newCols, rows: newRows })
  }

  const removeRow = (idx) => {
    if (rows.length <= 1) return
    updateBlock(block.id, { rows: rows.filter((_, i) => i !== idx) })
  }

  const removeColumn = (idx) => {
    if (columns.length <= 1) return
    updateBlock(block.id, { columns: columns.filter((_, i) => i !== idx), rows: rows.map(r => ({ ...r, cells: r.cells.filter((_, i) => i !== idx) })) })
  }

  // Roman numeral for table number
  const tableNum = 'I' // Will be computed from context

  return (
    <div className="py-4">
      {/* Caption ABOVE table (IEEE rule) */}
      <div className="paper-table-caption text-center mb-2" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.tableCaption, fontVariant: 'small-caps', fontWeight: 'bold' }}>
        <span>TABLE {tableNum}: </span>
        <input
          value={block.caption || ''}
          onChange={e => updateBlock(block.id, { caption: e.target.value })}
          placeholder="Table caption..."
          className="outline-none bg-transparent text-center placeholder:text-[#ccc]"
          style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.tableCaption, fontVariant: 'small-caps', fontWeight: 'bold' }}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="paper-table w-full border-collapse" style={{ fontFamily: IEEE_FONTS.body, fontSize: IEEE_SIZES.tableBody }}>
          <thead>
            {rows.length > 0 && (
              <tr className="rule-top rule-mid">
                {rows[0].cells.map((cell, ci) => (
                  <th key={ci} className="px-2 py-1 font-bold text-left border-t-[1.5px] border-b-[0.5px] border-[#1a1a1a]">
                    <input value={cell.content} onChange={e => updateCell(0, ci, e.target.value)} className="outline-none bg-transparent w-full font-bold" placeholder={`Header ${ci + 1}`} />
                  </th>
                ))}
                <th className="w-6 border-t-[1.5px] border-b-[0.5px] border-[#1a1a1a]">
                  <button onClick={addColumn} className="text-[#4A7CFF] hover:text-[#6B96FF] p-0.5"><Plus size={12} /></button>
                </th>
              </tr>
            )}
          </thead>
          <tbody>
            {rows.slice(1).map((row, ri) => (
              <tr key={ri} className={ri === rows.length - 2 ? 'border-b-[1.5px] border-[#1a1a1a]' : ''}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1">
                    <input value={cell.content} onChange={e => updateCell(ri + 1, ci, e.target.value)} className="outline-none bg-transparent w-full" placeholder="—" />
                  </td>
                ))}
                <td className="w-6">
                  <button onClick={() => removeRow(ri + 1)} className="text-[#8E8E93] hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="flex items-center gap-1 text-[10px] text-[#4A7CFF] hover:text-[#6B96FF] mt-2 mx-auto">
        <Plus size={10} /> Add Row
      </button>
    </div>
  )
}
