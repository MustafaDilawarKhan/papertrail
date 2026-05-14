import React, { useState, useEffect, useRef } from 'react';
import { Link, Icon, Brand, navigate, useRoute } from '../shared/components';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../apiConfig';

// --- INITIAL DATA ---
const INITIAL_BLOCKS = [
  { id: 'b1', type: 'frontmatter', title: 'A Novel Deep Learning Based Approach for Image Classification using Optimized CNN', authors: 'Saeed Ahmad, Ali Khan, Muhammad Usman', affiliations: 'Department of Computer Science, ABC University, City, Country', emails: 'saeed.ahmad@abc.edu, ali.khan@abc.edu, usman@abc.edu' },
  { id: 'b2', type: 'abstract', content: 'This paper proposes a novel deep learning based approach for image classification using optimized convolutional neural networks. The proposed method improves accuracy while reducing computational complexity. Extensive experiments on benchmark datasets demonstrate the effectiveness of the proposed approach.', keywords: 'Deep Learning, Convolutional Neural Networks, Image Classification, Optimization.' },
  { id: 'b3', type: 'section', title: 'I. INTRODUCTION', content: 'Image classification is a fundamental task in computer vision with applications in various domains such as medical imaging, autonomous vehicles, and surveillance systems. Deep learning models, particularly Convolutional Neural Networks (CNNs), have achieved state-of-the-art performance in this task.' },
  { id: 'b4', type: 'section', title: 'II. RELATED WORK', content: 'Several deep learning models have been proposed for image classification. Krizhevsky et al. [1] introduced AlexNet, which significantly improved performance on ImageNet. Later, ResNet [2] and DenseNet [3] addressed the degradation problem and improved feature reuse.' },
  { id: 'b5', type: 'figure', caption: 'Fig. 1. System architecture of the proposed model.', url: '', alt: 'System Architecture Diagram' },
  { id: 'b6', type: 'table', caption: 'TABLE I\nCOMPARISON OF DIFFERENT METHODS', data: [
    ['Method', 'Accuracy (%)', 'Precision (%)', 'Recall (%)'],
    ['Method A', '91.2', '90.1', '92.3'],
    ['Method B', '93.7', '92.5', '94.1'],
    ['Proposed', '96.4', '95.8', '96.9']
  ]},
  { id: 'b7', type: 'section', title: 'III. METHODOLOGY', content: 'The proposed method consists of the following steps: (1) Data preprocessing and augmentation, (2) Feature extraction using optimized CNN, (3) Classification using fully connected layers.' },
  { id: 'b8', type: 'equation', content: 'y = \\sum_{i=1}^{n} w_i x_i + b', label: '(1)' },
];

const SECTION_TEMPLATES = [
  { type: 'section', title: 'I. Introduction', icon: 'segment' },
  { type: 'section', title: 'II. Related Work', icon: 'history' },
  { type: 'section', title: 'III. Methodology', icon: 'settings' },
  { type: 'section', title: 'IV. Experimental Setup', icon: 'biotech' },
  { type: 'section', title: 'V. Results', icon: 'analytics' },
  { type: 'section', title: 'VI. Discussion', icon: 'forum' },
  { type: 'section', title: 'VII. Conclusion', icon: 'done_all' },
  { type: 'section', title: 'References', icon: 'bookmark' },
  { type: 'section', title: 'Appendix', icon: 'add_to_photos' },
];

const ELEMENT_TEMPLATES = [
  { type: 'text', title: 'Text Block', icon: 'notes' },
  { type: 'figure', title: 'Figure', icon: 'image' },
  { type: 'table', title: 'Table', icon: 'grid_on' },
  { type: 'equation', title: 'Equation', icon: 'functions' },
  { type: 'code', title: 'Code Block', icon: 'code' },
  { type: 'citation', title: 'Citation', icon: 'format_quote' },
  { type: 'algorithm', title: 'Algorithm', icon: 'reorder' },
];

// --- MAIN COMPONENT ---
export default function EditorPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [activeBlockId, setActiveBlockId] = useState(null);
  const [viewMode, setViewMode] = useState('editor'); // 'editor', 'preview', 'latex'
  const [layoutMode, setLayoutMode] = useState('ieee-2-column');
  const [saving, setSaving] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('properties');
  const [leftPanelTab, setLeftPanelTab] = useState('sections');

  // --- AUTO-PAGINATION ---
  const PAGE_HEIGHT = 1100; // px total page height
  const PAGE_PADDING = 72; // px top+bottom padding
  const PAGE_FOOTER = 40;  // px reserved for page footer
  const USABLE_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2 - PAGE_FOOTER;
  const contentRef = useRef(null);
  const [pageBreaks, setPageBreaks] = useState([]); // indices where new pages start

  useEffect(() => {
    if (!contentRef.current) return;
    const blockEls = contentRef.current.querySelectorAll('[data-block-id]');
    if (!blockEls.length) return;

    let accHeight = 0;
    const breaks = [];
    blockEls.forEach((el, idx) => {
      const h = el.getBoundingClientRect().height;
      if (accHeight + h > USABLE_HEIGHT && idx > 0) {
        breaks.push(idx);
        accHeight = h;
      } else {
        accHeight += h;
      }
    });
    // Only update if breaks changed
    if (JSON.stringify(breaks) !== JSON.stringify(pageBreaks)) {
      setPageBreaks(breaks);
    }
  });

  // Split blocks into pages
  const getPages = () => {
    if (pageBreaks.length === 0) return [blocks];
    const pages = [];
    let start = 0;
    for (const bp of pageBreaks) {
      pages.push(blocks.slice(start, bp));
      start = bp;
    }
    pages.push(blocks.slice(start));
    return pages;
  };

  // Undo/Redo (Simple)
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const pushToHistory = (newBlocks) => {
    setHistory(prev => [...prev, blocks]);
    setRedoStack([]);
    setBlocks(newBlocks);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(prevRedo => [...prevRedo, blocks]);
    setHistory(prevHistory => prevHistory.slice(0, -1));
    setBlocks(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prevHistory => [...prevHistory, blocks]);
    setRedoStack(prevRedo => prevRedo.slice(0, -1));
    setBlocks(next);
  };

  const updateBlock = (id, updates) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    pushToHistory(newBlocks);
  };

  const addBlock = (template) => {
    const newBlock = {
      id: 'b' + Math.random().toString(36).substr(2, 9),
      type: template.type,
      title: template.title || '',
      content: '',
      ...(template.type === 'table' ? { data: [['Header 1', 'Header 2'], ['Value 1', 'Value 2']] } : {}),
      ...(template.type === 'figure' ? { url: '', caption: 'Fig. X. New figure.' } : {}),
      ...(template.type === 'equation' ? { content: 'e = mc^2', label: '(n)' } : {}),
    };
    pushToHistory([...blocks, newBlock]);
    setActiveBlockId(newBlock.id);
  };

  const deleteBlock = (id) => {
    pushToHistory(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const moveBlock = (id, direction) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    pushToHistory(newBlocks);
  };

  return (
    <div className="h-screen flex flex-col bg-surface-container-lowest text-on-surface overflow-hidden">
      {/* 1. TOP NAVIGATION */}
      <nav className="h-14 border-b border-border-subtle bg-white flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <Brand small />
          <div className="h-6 w-px bg-border-subtle" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-primary">Paper Editor</span>
            <select 
              value={layoutMode} 
              onChange={e => setLayoutMode(e.target.value)}
              className="bg-surface-container-low text-[11px] font-bold px-2 py-1 rounded border border-border-subtle outline-none focus:border-primary"
            >
              <option value="ieee-2-column">IEEE Two Column</option>
              <option value="ieee-1-column">IEEE Single Column</option>
              <option value="ieee-conf">IEEE Conference</option>
              <option value="ieee-trans">IEEE Transactions</option>
            </select>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-border-subtle">
            <button onClick={handleUndo} disabled={history.length === 0} className="p-1.5 hover:bg-white rounded disabled:opacity-30"><Icon name="undo" size={16} /></button>
            <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-1.5 hover:bg-white rounded disabled:opacity-30"><Icon name="redo" size={16} /></button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-border-subtle">
            <button onClick={() => setViewMode('editor')} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'editor' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}>Editor</button>
            <button onClick={() => setViewMode('preview')} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'preview' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}>Preview</button>
            <button onClick={() => setViewMode('latex')} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'latex' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}>LaTeX Source</button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
              <Icon name="cloud_done" size={14} className="text-green-600" /> Saved 3s ago
            </span>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors">
              <Icon name="ios_share" size={16} /> Share
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-subtle rounded-lg text-xs font-semibold hover:bg-surface-container-low transition-colors">
               Export <Icon name="expand_more" size={16} />
            </button>
            <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 shadow-sm active:scale-95 transition-all">
              <Icon name="publish" size={16} /> Publish
            </button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* 2. LEFT SIDEBAR - PAPER COMPONENT LIBRARY */}
        <aside className="w-[280px] border-r border-border-subtle bg-white flex flex-col flex-shrink-0 z-40">
          <div className="p-4 border-b border-border-subtle">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Paper Components</h3>
            <div className="flex bg-surface-container-low p-1 rounded-lg border border-border-subtle">
              <button 
                onClick={() => setLeftPanelTab('sections')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${leftPanelTab === 'sections' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
              >
                Sections
              </button>
              <button 
                onClick={() => setLeftPanelTab('elements')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${leftPanelTab === 'elements' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
              >
                Elements
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {leftPanelTab === 'sections' ? (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">IEEE Sections</h4>
                <div className="grid grid-cols-1 gap-2">
                  {SECTION_TEMPLATES.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => addBlock(s)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border-subtle bg-surface-container-lowest hover:border-primary hover:shadow-sm transition-all group text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon name={s.icon} size={18} />
                      </div>
                      <span className="text-xs font-medium">{s.title.replace(/^[IVX]+\.\s/, '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-3">Content Elements</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ELEMENT_TEMPLATES.map((e, i) => (
                    <button 
                      key={i} 
                      onClick={() => addBlock(e)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-border-subtle bg-surface-container-lowest hover:border-primary hover:shadow-sm transition-all group gap-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Icon name={e.icon} size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-center">{e.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border-subtle">
              <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Import from Overleaf</h4>
                 <p className="text-[10px] text-on-surface-variant mb-3">Upload .tex or .bib files to start from existing work.</p>
                 <button className="w-full py-2 bg-white border border-border-subtle rounded-lg text-xs font-bold hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-2">
                    <Icon name="upload_file" size={16} /> Upload
                 </button>
              </div>
            </div>
          </div>
        </aside>

        {/* 3. CENTER - LIVE IEEE PAPER CANVAS */}
        <main className="flex-1 bg-surface-container-low overflow-y-auto p-12 flex flex-col items-center custom-scrollbar scroll-smooth">
          {/* Formatting Toolbar (Sticky) */}
          <div className="sticky top-0 mb-8 w-full max-w-[850px] bg-white/90 backdrop-blur-md border border-border-subtle p-2 rounded-2xl flex items-center justify-between z-30 shadow-lg shadow-black/5">
            <div className="flex items-center gap-1 border-r border-border-subtle pr-2 mr-2">
              <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant"><Icon name="format_size" size={18} /></button>
              <select className="bg-transparent text-xs font-bold px-2 py-1 outline-none">
                <option>Normal Text</option>
                <option>Heading 1</option>
                <option>Heading 2</option>
                <option>Blockquote</option>
              </select>
            </div>
            <div className="flex items-center gap-1 border-r border-border-subtle pr-2 mr-2">
              <button className="p-2 hover:bg-surface-container rounded-lg font-bold text-primary">B</button>
              <button className="p-2 hover:bg-surface-container rounded-lg italic">I</button>
              <button className="p-2 hover:bg-surface-container rounded-lg underline">U</button>
            </div>
            <div className="flex items-center gap-1 border-r border-border-subtle pr-2 mr-2">
              <button className="p-2 hover:bg-surface-container rounded-lg"><Icon name="format_list_bulleted" size={18} /></button>
              <button className="p-2 hover:bg-surface-container rounded-lg"><Icon name="format_list_numbered" size={18} /></button>
              <button className="p-2 hover:bg-surface-container rounded-lg"><Icon name="format_align_left" size={18} /></button>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-surface-container rounded-lg"><Icon name="link" size={18} /></button>
              <button className="p-2 hover:bg-surface-container rounded-lg"><Icon name="code" size={18} /></button>
              <button className="px-3 py-1.5 bg-surface-container-high hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                <Icon name="functions" size={16} /> Equation
              </button>
              <button className="px-3 py-1.5 bg-surface-container-high hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                <Icon name="format_quote" size={16} /> Citation
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2 pl-2 border-l border-border-subtle">
              <button className="p-2 hover:bg-surface-container rounded-lg"><Icon name="more_vert" size={18} /></button>
            </div>
          </div>

          {/* HIDDEN MEASUREMENT CONTAINER — used to compute page breaks */}
          <div ref={contentRef} className="absolute opacity-0 pointer-events-none" style={{ width: 850 - 144, left: -9999 }} aria-hidden="true">
            {blocks.map((block) => (
              <div key={block.id} data-block-id={block.id} className="mb-6 p-4">
                {block.type === 'frontmatter' && <div className="py-8 space-y-4"><h1 className="text-2xl font-bold">{block.title}</h1><div>{block.authors}</div><div>{block.affiliations}</div></div>}
                {block.type === 'abstract' && <div className="p-6"><p className="text-sm leading-relaxed">{block.content}</p><p className="mt-4 text-xs">{block.keywords}</p></div>}
                {block.type === 'section' && <div className="space-y-3"><h2 className="text-sm font-bold">{block.title}</h2><p className="text-[13px] leading-[1.6]">{block.content}</p></div>}
                {block.type === 'figure' && <div className="py-4"><div className="w-full aspect-video"></div><p className="text-xs mt-2">{block.caption}</p></div>}
                {block.type === 'table' && <div className="py-4"><p className="text-[10px] mb-2">{block.caption}</p><table className="w-full text-[11px]"><tbody>{(block.data||[]).map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} className="p-2">{c}</td>)}</tr>)}</tbody></table></div>}
                {block.type === 'equation' && <div className="py-6 text-lg">{block.content}</div>}
              </div>
            ))}
          </div>

          {/* MULTI-PAGE PAPER CANVAS */}
          {getPages().map((pageBlocks, pageIndex) => (
            <div key={pageIndex} className="relative mb-12">
              {/* Page separator label */}
              {pageIndex > 0 && (
                <div className="flex items-center gap-4 mb-4 px-8">
                  <div className="flex-1 border-t border-dashed border-border-subtle" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40">Page {pageIndex + 1}</span>
                  <div className="flex-1 border-t border-dashed border-border-subtle" />
                </div>
              )}

              <div 
                className={`w-full max-w-[850px] bg-white shadow-2xl rounded-sm border border-border-subtle relative p-[72px] flex flex-col font-serif ${layoutMode === 'ieee-2-column' ? 'columns-2 gap-12 overflow-visible' : ''}`}
                style={{ 
                  minHeight: PAGE_HEIGHT,
                  boxShadow: '0 0 50px rgba(0,0,0,0.05), 0 0 1px rgba(0,0,0,0.1)',
                  columnFill: 'auto'
                }}
              >
                {/* Column Guide */}
                {layoutMode === 'ieee-2-column' && (
                   <div className="absolute inset-0 pointer-events-none opacity-5 flex justify-center">
                      <div className="w-px h-full bg-primary" />
                   </div>
                )}

                {/* BLOCK RENDERER */}
                {pageBlocks.map((block) => (
                  <div 
                    key={block.id}
                    data-block-id={block.id}
                    onClick={() => setActiveBlockId(block.id)}
                    className={`relative group mb-6 p-4 rounded-xl transition-all border-2 border-transparent ${activeBlockId === block.id ? 'border-primary/20 bg-primary/[0.02]' : 'hover:border-surface-container-high'}`}
                    style={{ 
                       breakInside: block.type === 'frontmatter' ? 'avoid' : 'auto',
                       columnSpan: block.type === 'frontmatter' || block.type === 'abstract' ? 'all' : 'none'
                    }}
                  >
                    {/* Block Actions */}
                    <div className={`absolute -right-12 top-0 flex flex-col gap-1 transition-opacity duration-200 ${activeBlockId === block.id || 'group-hover:opacity-100 opacity-0'}`}>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} className="p-1.5 bg-white border border-border-subtle rounded-lg shadow-sm hover:text-primary"><Icon name="arrow_upward" size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} className="p-1.5 bg-white border border-border-subtle rounded-lg shadow-sm hover:text-primary"><Icon name="arrow_downward" size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="p-1.5 bg-white border border-border-subtle rounded-lg shadow-sm hover:text-error"><Icon name="delete" size={14} /></button>
                    </div>
                    <div className={`absolute -left-12 top-0 flex flex-col gap-1 transition-opacity duration-200 ${activeBlockId === block.id || 'group-hover:opacity-100 opacity-0'}`}>
                       <div className="p-1.5 bg-white border border-border-subtle rounded-lg shadow-sm cursor-grab active:cursor-grabbing"><Icon name="drag_indicator" size={14} /></div>
                    </div>

                    {/* BLOCK CONTENT */}
                    {block.type === 'frontmatter' && (
                      <div className="text-center space-y-4 py-8">
                        <h1 className="text-2xl font-bold tracking-tight text-primary uppercase leading-tight px-12">{block.title}</h1>
                        <div className="text-sm font-medium italic opacity-80">{block.authors}</div>
                        <div className="text-xs opacity-60 leading-relaxed max-w-md mx-auto">{block.affiliations}</div>
                        <div className="text-xs font-mono opacity-50">Email: {block.emails}</div>
                      </div>
                    )}
                    {block.type === 'abstract' && (
                      <div className="bg-surface-container-low/30 p-6 rounded-xl border border-dashed border-border-subtle mt-4">
                        <p className="text-sm italic leading-relaxed text-on-surface">
                          <strong className="not-italic uppercase tracking-widest text-[10px] mr-2">Abstract—</strong>
                          {block.content}
                        </p>
                        <p className="mt-4 text-xs italic">
                          <strong className="not-italic uppercase tracking-widest text-[10px] mr-2 text-primary">Index Terms—</strong>
                          {block.keywords}
                        </p>
                      </div>
                    )}
                    {block.type === 'section' && (
                      <div className="space-y-3">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-primary/10 pb-1 flex items-center justify-between">
                           {block.title}
                           <Icon name="edit" size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                        </h2>
                        <p className="text-[13px] leading-[1.6] text-on-surface-variant text-justify">
                          {block.content || <span className="opacity-30 italic">Drag content here or start typing...</span>}
                        </p>
                      </div>
                    )}
                    {block.type === 'figure' && (
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-full aspect-video bg-surface-container-low rounded-xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center gap-2 group/upload cursor-pointer hover:bg-primary/5 transition-all">
                           {block.url ? (
                              <img src={block.url} alt={block.alt} className="w-full h-full object-contain p-4" />
                           ) : (
                              <>
                                <Icon name="add_photo_alternate" size={32} className="text-on-surface-variant opacity-20 group-hover/upload:opacity-100 transition-opacity" />
                                <span className="text-xs font-bold text-on-surface-variant/40 group-hover/upload:text-primary">Click to upload or drag image</span>
                              </>
                           )}
                        </div>
                        <p className="text-xs italic text-center text-on-surface-variant max-w-sm">{block.caption}</p>
                      </div>
                    )}
                    {block.type === 'table' && (
                      <div className="space-y-4 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-center text-on-surface-variant">{block.caption}</p>
                        <div className="border border-border-subtle rounded-lg overflow-hidden bg-white">
                           <table className="w-full text-[11px] border-collapse">
                              <thead>
                                 <tr className="border-b border-border-subtle bg-surface-container-lowest">
                                    {block.data[0].map((h, i) => (
                                       <th key={i} className="p-2 font-bold border-r border-border-subtle text-center">{h}</th>
                                    ))}
                                 </tr>
                              </thead>
                              <tbody>
                                 {block.data.slice(1).map((row, i) => (
                                    <tr key={i} className="border-b border-border-subtle">
                                       {row.map((cell, j) => (
                                          <td key={j} className="p-2 border-r border-border-subtle text-center">{cell}</td>
                                       ))}
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                      </div>
                    )}
                    {block.type === 'equation' && (
                      <div className="flex items-center justify-between py-6 group/eq">
                         <div className="flex-1 flex justify-center text-lg font-serif italic py-4 bg-surface-container-low/20 rounded-xl border border-transparent group-hover/eq:border-primary/20 transition-all">
                            {block.content}
                         </div>
                         <span className="text-xs font-bold text-on-surface-variant ml-4">{block.label}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Page Footer */}
                <div className="absolute bottom-10 left-0 w-full text-center text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                   Page {pageIndex + 1} — IEEE Transactions on Artificial Intelligence
                </div>
              </div>
            </div>
          ))}

          {/* Bottom Status Bar */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md border border-border-subtle px-6 py-2 rounded-full flex items-center gap-8 z-40 shadow-xl shadow-black/5">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="text-primary">Word Count:</span> {blocks.reduce((sum, b) => sum + ((b.content || '') + ' ' + (b.title || '')).split(/\s+/).filter(Boolean).length, 0).toLocaleString()}
             </div>
             <div className="w-px h-3 bg-border-subtle" />
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="text-primary">Page:</span> {getPages().length}
             </div>
             <div className="w-px h-3 bg-border-subtle" />
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="text-primary">References:</span> 23
             </div>
             <div className="w-px h-3 bg-border-subtle" />
             <div className="flex items-center gap-4">
                <button className="p-1 hover:text-primary transition-colors"><Icon name="zoom_out" size={16} /></button>
                <span className="text-[10px] font-bold">100%</span>
                <button className="p-1 hover:text-primary transition-colors"><Icon name="zoom_in" size={16} /></button>
                <button className="p-1 hover:text-primary transition-colors ml-2"><Icon name="fullscreen" size={16} /></button>
             </div>
          </div>
        </main>

        {/* 4. RIGHT SIDEBAR - PROPERTIES & AI */}
        <aside className="w-[340px] border-l border-border-subtle bg-white flex flex-col flex-shrink-0 z-40">
           <div className="p-2 border-b border-border-subtle flex">
              {['properties', 'ai', 'latex'].map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setRightPanelTab(tab)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${rightPanelTab === tab ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                 >
                   {tab === 'ai' ? 'AI Assistant' : tab === 'latex' ? 'LaTeX Source' : 'Properties'}
                 </button>
              ))}
           </div>

           <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'properties' && (
                 <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {activeBlockId ? (
                       <>
                          <div>
                             <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                <Icon name="settings" size={14} /> Block Settings
                             </h4>
                             {/* Context-aware settings based on block type */}
                             {blocks.find(b => b.id === activeBlockId)?.type === 'table' && (
                                <div className="space-y-4">
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Table Caption</label>
                                      <textarea 
                                        value={blocks.find(b => b.id === activeBlockId).caption}
                                        onChange={(e) => updateBlock(activeBlockId, { caption: e.target.value })}
                                        className="w-full bg-surface-container-low border border-border-subtle rounded-lg p-2 text-xs outline-none focus:border-primary h-20 resize-none"
                                      />
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Columns</label>
                                         <input type="number" className="w-full bg-surface-container-low border border-border-subtle rounded-lg p-2 text-xs outline-none focus:border-primary" defaultValue={4} />
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Header Style</label>
                                         <select className="w-full bg-surface-container-low border border-border-subtle rounded-lg p-2 text-xs outline-none focus:border-primary">
                                            <option>Bold</option>
                                            <option>Italic</option>
                                            <option>Caps</option>
                                         </select>
                                      </div>
                                   </div>
                                   <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-border-subtle">
                                      <span className="text-xs font-bold">Striped Rows</span>
                                      <div className="w-8 h-4 bg-primary rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" /></div>
                                   </div>
                                </div>
                             )}

                             {blocks.find(b => b.id === activeBlockId)?.type === 'section' && (
                                <div className="space-y-4">
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Section Title</label>
                                      <input 
                                        value={blocks.find(b => b.id === activeBlockId).title}
                                        onChange={(e) => updateBlock(activeBlockId, { title: e.target.value })}
                                        className="w-full bg-surface-container-low border border-border-subtle rounded-lg p-2 text-xs outline-none focus:border-primary"
                                      />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Content</label>
                                      <textarea 
                                        value={blocks.find(b => b.id === activeBlockId).content}
                                        onChange={(e) => updateBlock(activeBlockId, { content: e.target.value })}
                                        className="w-full bg-surface-container-low border border-border-subtle rounded-lg p-3 text-[13px] leading-relaxed outline-none focus:border-primary h-60 resize-none font-serif"
                                      />
                                   </div>
                                </div>
                             )}
                          </div>
                       </>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-30">
                          <Icon name="ads_click" size={48} />
                          <div>
                             <p className="text-sm font-bold">Select a block</p>
                             <p className="text-[11px]">Click on any section of your paper to edit its properties.</p>
                          </div>
                       </div>
                    )}
                 </div>
              )}

              {rightPanelTab === 'ai' && (
                 <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                       <Icon name="auto_awesome" size={14} /> AI Writing Assistant
                    </h4>
                    
                    <div className="bg-surface-container-low p-4 rounded-2xl border border-border-subtle space-y-3">
                       <p className="text-xs text-on-surface-variant leading-relaxed">How can I help with your <span className="text-primary font-bold">"{blocks.find(b => b.id === activeBlockId)?.title || 'Research'}"</span> section?</p>
                       <div className="flex flex-wrap gap-2">
                          {['Improve Tone', 'Summarize', 'Add Citations', 'Formalize'].map(act => (
                             <button key={act} className="px-3 py-1.5 bg-white border border-border-subtle rounded-lg text-[10px] font-bold hover:text-primary hover:border-primary transition-all">{act}</button>
                          ))}
                       </div>
                    </div>

                    <div className="relative">
                       <textarea 
                        placeholder="Type instructions (e.g. 'Rewrite this abstract for a computer vision conference')"
                        className="w-full bg-white border border-border-subtle rounded-2xl p-4 text-xs h-32 outline-none focus:border-primary shadow-sm resize-none"
                       />
                       <button className="absolute bottom-3 right-3 bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                          <Icon name="send" size={16} />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Recent Insights</h5>
                       <div className="p-3 bg-white border border-border-subtle rounded-xl text-[11px] space-y-2">
                          <div className="flex items-center gap-2 text-primary">
                             <Icon name="lightbulb" size={14} />
                             <span className="font-bold">Citation Suggestion</span>
                          </div>
                          <p className="leading-relaxed opacity-70">Based on your introduction, you should cite <strong>Vaswani et al. (2017)</strong> regarding the Transformer architecture.</p>
                          <button className="text-[10px] font-bold text-primary hover:underline italic">Cite automatically →</button>
                       </div>
                    </div>
                 </div>
              )}

              {rightPanelTab === 'latex' && (
                 <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex-1 bg-surface-container-lowest p-6 font-mono text-[11px] text-on-surface-variant overflow-y-auto leading-relaxed whitespace-pre">
{`\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}

\\begin{document}

\\title{${blocks[0].title}}

\\author{
\\IEEEauthorblockN{${blocks[0].authors.split(',').map(a => a.trim()).join(' \\\\ ')}}
\\IEEEauthorblockA{${blocks[0].affiliations}}
}

\\maketitle

\\begin{abstract}
${blocks[1].content}
\\end{abstract}

\\begin{IEEEkeywords}
${blocks[1].keywords}
\\end{IEEEkeywords}

${blocks.slice(2).map(b => {
  if (b.type === 'section') return `\\section{${b.title.replace(/^[IVX]+\.\s/, '')}}\n${b.content}`;
  if (b.type === 'equation') return `\\begin{equation}\n${b.content}\n\\label{eq}\n\\end{IEEEequation}`;
  return '';
}).join('\n\n')}

\\end{document}`}
                    </div>
                    <div className="p-4 border-t border-border-subtle bg-white flex items-center justify-between">
                       <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                          <Icon name="content_copy" size={14} /> Copy LaTeX
                       </button>
                       <button className="px-4 py-1.5 bg-surface-container-high rounded-lg text-[10px] font-bold">
                          Sync Source
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </aside>
      </div>
      
      {/* GLOBAL CSS FOR EDITOR */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
        
        @page { size: A4; margin: 0; }
        
        .kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 1px 4px;
          font-family: var(--mono);
          font-size: 9px;
          color: #495057;
          box-shadow: 0 1px 0 rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
