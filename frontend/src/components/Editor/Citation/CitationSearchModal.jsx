// src/components/Editor/Citation/CitationSearchModal.jsx
import React, { useState, useEffect } from 'react'
import { useCitations } from '../../../hooks/useCitations.js'
import { searchByTitle, searchByDOI, parseBibTeXInput } from '../../../services/citationService.js'
import { parseBibTeX } from '../../../utils/bibtexParser.js'
import { X, Search, Hash, FileText, Loader2 } from 'lucide-react'

export default function CitationSearchModal({ open, onClose, onInsert }) {
  const [tab, setTab] = useState('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [doiInput, setDoiInput] = useState('')
  const [bibtexInput, setBibtexInput] = useState('')
  const { addCitation } = useCitations()

  useEffect(() => {
    if (!open) { setResults([]); setQuery(''); setDoiInput(''); setBibtexInput('') }
  }, [open])

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await searchByTitle(query)
      setResults(res)
    } catch { setResults([]) }
    setLoading(false)
  }

  const handleDOI = async () => {
    if (!doiInput.trim()) return
    setLoading(true)
    try {
      const res = await searchByDOI(doiInput.trim())
      setResults(res)
    } catch { setResults([]) }
    setLoading(false)
  }

  const handleBibTeX = () => {
    const parsed = parseBibTeX(bibtexInput)
    if (parsed) {
      addCitation(parsed)
      onInsert?.(parsed)
      onClose()
    }
  }

  const selectResult = (result) => {
    addCitation(result)
    onInsert?.(result)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#2C2C2E] rounded-2xl w-[560px] max-h-[70vh] flex flex-col shadow-2xl border border-white/5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-[#F5F5F7] text-sm font-semibold">Add Citation</h3>
          <button onClick={onClose} className="text-[#8E8E93] hover:text-[#F5F5F7]"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1">
          {[
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'doi', icon: Hash, label: 'DOI' },
            { id: 'bibtex', icon: FileText, label: 'BibTeX' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t.id ? 'bg-[#4A7CFF] text-white' : 'text-[#8E8E93] hover:text-[#F5F5F7] hover:bg-white/5'}`}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'search' && (
            <div>
              <div className="flex gap-2 mb-4">
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by title or author..." className="flex-1 bg-[#1C1C1E] text-[#F5F5F7] px-3 py-2 rounded-lg text-sm outline-none border border-white/5 focus:border-[#4A7CFF] placeholder:text-[#48484A]" />
                <button onClick={handleSearch} disabled={loading} className="bg-[#4A7CFF] text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                </button>
              </div>
              <ResultsList results={results} onSelect={selectResult} />
            </div>
          )}
          {tab === 'doi' && (
            <div>
              <div className="flex gap-2 mb-4">
                <input value={doiInput} onChange={e => setDoiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleDOI()}
                  placeholder="e.g. 10.1109/TPAMI.2023.1234567" className="flex-1 bg-[#1C1C1E] text-[#F5F5F7] px-3 py-2 rounded-lg text-sm outline-none border border-white/5 focus:border-[#4A7CFF] placeholder:text-[#48484A]" />
                <button onClick={handleDOI} disabled={loading} className="bg-[#4A7CFF] text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
                </button>
              </div>
              <ResultsList results={results} onSelect={selectResult} />
            </div>
          )}
          {tab === 'bibtex' && (
            <div>
              <textarea value={bibtexInput} onChange={e => setBibtexInput(e.target.value)}
                placeholder={'@article{key,\n  title={...},\n  author={...},\n  year={2024},\n  journal={...}\n}'}
                className="w-full bg-[#1C1C1E] text-[#F5F5F7] p-3 rounded-lg text-xs font-mono outline-none border border-white/5 focus:border-[#4A7CFF] resize-none placeholder:text-[#48484A]" rows={8} />
              <button onClick={handleBibTeX} className="mt-3 bg-[#4A7CFF] text-white px-4 py-2 rounded-lg text-xs font-semibold w-full">Parse & Insert</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultsList({ results, onSelect }) {
  if (results.length === 0) return <p className="text-[#48484A] text-xs text-center py-6">No results. Try a different query.</p>
  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <button key={i} onClick={() => onSelect(r)} className="w-full text-left bg-[#1C1C1E] hover:bg-white/5 p-3 rounded-lg border border-white/5 transition-colors">
          <p className="text-[#F5F5F7] text-xs font-medium line-clamp-2">{r.title}</p>
          <p className="text-[#8E8E93] text-[10px] mt-1">{r.authors?.slice(0, 3).join(', ')}{r.authors?.length > 3 ? ' et al.' : ''} · {r.year || 'n.d.'}</p>
          <p className="text-[#48484A] text-[10px] mt-0.5">{r.journal || r.booktitle || r.source}</p>
        </button>
      ))}
    </div>
  )
}
