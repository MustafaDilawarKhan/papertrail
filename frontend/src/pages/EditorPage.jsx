import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Icon, ProfileDropdown, navigate, Sidebar } from '../shared/components';

// ─── IEEE CONSTANTS ────────────────────────────────────────────────────────────
const IEEE = {
  fonts: {
    body: '"Times New Roman", Times, serif',
    mono: '"Courier New", Courier, monospace',
  },
  sizes: {
    title: '22px', authorName: '13px', affiliation: '11px',
    email: '10px', abstract: '11px', body: '12px',
    heading1: '12px', caption: '9px', reference: '9px',
  },
  leading: { body: '15px', abstract: '14px', reference: '12px' },
};

// ─── INITIAL PAPER BLOCKS ──────────────────────────────────────────────────────
const INITIAL_BLOCKS = [
  {
    id: 'b-title', type: 'frontmatter',
    title: 'A Novel Deep Learning Based Approach for Image Classification using Optimized CNN',
    authors: [
      { name: 'Saeed Ahmad', sup: '1' },
      { name: 'Ali Khan', sup: '2' },
      { name: 'Muhammad Usman', sup: '3' },
    ],
    affiliations: [
      '¹Department of Computer Science, ABC University, City, Country',
      '²Department of Computer Science, ABC University, City, Country',
      '³Department of Computer Science, ABC University, City, Country',
    ],
    emails: 'saeed.ahmad@abc.edu, ali.khan@abc.edu, usman@abc.edu',
  },
  {
    id: 'b-abstract', type: 'abstract',
    content: 'This paper proposes a novel deep learning based approach for image classification using optimized convolutional neural networks. The proposed method improves accuracy while reducing computational complexity. Extensive experiments on benchmark datasets demonstrate the effectiveness of the proposed approach.',
    keywords: 'Deep Learning, Convolutional Neural Networks, Image Classification, Optimization.',
  },
  {
    id: 'b-intro', type: 'section', sectionKey: 'introduction',
    title: 'Introduction',
    content: 'Image classification is a fundamental task in computer vision with applications in various domains such as medical imaging, autonomous vehicles, and surveillance systems. Deep learning models, particularly Convolutional Neural Networks (CNNs), have achieved state-of-the-art performance in this task.\n\nHowever, existing models often suffer from high computational cost and lack of generalization. To address these challenges, this paper proposes an optimized CNN architecture.',
  },
  {
    id: 'b-related', type: 'section', sectionKey: 'related_work',
    title: 'Related Work',
    content: 'Several deep learning models have been proposed for image classification. Krizhevsky et al. [1] introduced AlexNet, which significantly improved performance on ImageNet. Later, ResNet [2] and DenseNet [3] addressed the degradation problem and improved feature reuse.\n\nDespite these improvements, there is still room for optimization in terms of accuracy and efficiency.',
  },
  {
    id: 'b-table1', type: 'table',
    caption: 'Comparison of Different Methods',
    label: 'tab:comparison_methods',
    rows: [
      ['Method', 'Accuracy (%)', 'Precision (%)', 'Recall (%)'],
      ['Method A', '91.2', '90.1', '92.3'],
      ['Method B', '93.7', '92.5', '94.1'],
      ['Proposed', '96.4', '95.8', '96.9'],
    ],
  },
  {
    id: 'b-method', type: 'section', sectionKey: 'methodology',
    title: 'Methodology',
    content: 'The proposed method consists of the following steps:\n1) Data preprocessing and augmentation\n2) Feature extraction using optimized CNN\n3) Classification using fully connected layers',
  },
  {
    id: 'b-results', type: 'section', sectionKey: 'results',
    title: 'Results',
    content: 'The proposed model was evaluated on benchmark datasets including CIFAR-10, CIFAR-100, and ImageNet. The results show that our model outperforms existing methods in terms of accuracy and computational efficiency.',
  },
  {
    id: 'b-conclusion', type: 'section', sectionKey: 'conclusion',
    title: 'Conclusion',
    content: 'This paper presented an optimized CNN approach for image classification. The experimental results demonstrate significant improvements over existing baselines.',
  },
  {
    id: 'b-refs', type: 'references',
    title: 'References',
    entries: [
      '[1] A. Krizhevsky, I. Sutskever, and G. E. Hinton, "ImageNet classification with deep convolutional neural networks," in Proc. NIPS, 2012, pp. 1097–1105.',
      '[2] K. He, X. Zhang, S. Ren, and J. Sun, "Deep residual learning for image recognition," in Proc. CVPR, 2016, pp. 770–778.',
      '[3] G. Huang, Z. Liu, L. Van Der Maaten, and K. Q. Weinberger, "Densely connected convolutional networks," in Proc. CVPR, 2017, pp. 4700–4708.',
    ],
  },
];

// Section auto-numbering
const SECTION_KEYS_ORDER = ['introduction', 'related_work', 'methodology', 'system_design', 'results', 'discussion', 'conclusion', 'acknowledgment'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function getSectionNumber(blocks, blockId) {
  const baseId = blockId?.replace(/-p\d+$/, '');
  const sections = blocks.filter(b => b.type === 'section');
  const idx = sections.findIndex(b => b.id === baseId);
  return idx >= 0 ? ROMAN[idx] : '';
}

// ─── COMPONENT PALETTE DATA ──────────────────────────────────────────────────
const SECTIONS_LIST = [
  { type: 'section', sectionKey: 'title_authors', title: 'Title & Authors', icon: 'title' },
  { type: 'abstract', title: 'Abstract', icon: 'subject' },
  { type: 'keywords', title: 'Index Terms', icon: 'label' },
  { type: 'section', sectionKey: 'introduction', title: 'I. Introduction', icon: 'article' },
  { type: 'section', sectionKey: 'related_work', title: 'II. Related Work', icon: 'library_books' },
  { type: 'section', sectionKey: 'methodology', title: 'III. Methodology', icon: 'science' },
  { type: 'section', sectionKey: 'system_design', title: 'IV. System Design', icon: 'architecture' },
  { type: 'section', sectionKey: 'results', title: 'V. Results', icon: 'analytics' },
  { type: 'section', sectionKey: 'discussion', title: 'VI. Discussion', icon: 'chat' },
  { type: 'section', sectionKey: 'conclusion', title: 'VII. Conclusion', icon: 'flag' },
  { type: 'section', sectionKey: 'acknowledgment', title: 'Acknowledgment', icon: 'handshake' },
  { type: 'references', title: 'References', icon: 'format_quote' },
  { type: 'section', sectionKey: 'appendix', title: 'Appendix', icon: 'attach_file' },
];

const ELEMENTS_CATEGORIES = {
  'TEXT & CONTENT': [
    { type: 'text', title: 'Text Block', icon: 'notes' },
    { type: 'equation', title: 'Equation', icon: 'functions' },
    { type: 'citation', title: 'Citation', icon: 'format_quote' },
    { type: 'bullet_list', title: 'Bullet List', icon: 'format_list_bulleted' },
    { type: 'numbered_list', title: 'Numbered List', icon: 'format_list_numbered' },
    { type: 'code', title: 'Code Block', icon: 'code' },
    { type: 'quote', title: 'Quote', icon: 'format_quote' },
    { type: 'callout', title: 'Callout', icon: 'info' },
  ],
  'FIGURES & TABLES': [
    { type: 'figure', title: 'Figure', icon: 'image' },
    { type: 'table', title: 'Table', icon: 'grid_on' },
    { type: 'chart', title: 'Chart', icon: 'bar_chart' },
    { type: 'flowchart', title: 'Flowchart', icon: 'account_tree' },
  ],
  'OTHER': [
    { type: 'algorithm', title: 'Algorithm', icon: 'reorder' },
    { type: 'theorem', title: 'Theorem', icon: 'verified' },
    { type: 'lemma', title: 'Lemma', icon: 'rule' },
    { type: 'proof', title: 'Proof', icon: 'gavel' },
    { type: 'footnote', title: 'Footnote', icon: 'sticky_note_2' },
    { type: 'divider', title: 'Divider', icon: 'horizontal_rule' },
  ],
};

// ─── LATEX GENERATOR ─────────────────────────────────────────────────────────
function escLatex(s = '') {
  return String(s)
    .replace(/\\/g, '\\textbackslash ')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde ')
    .replace(/\^/g, '\\textasciicircum ');
}
function htmlToLatex(html = '') {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  s = s.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '');
  s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '\\textbf{$1}');
  s = s.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '\\textbf{$1}');
  s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '\\textit{$1}');
  s = s.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '\\textit{$1}');
  s = s.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '\\underline{$1}');
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) => `\n\\begin{itemize}\n${inner}\n\\end{itemize}\n`);
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) => `\n\\begin{enumerate}\n${inner}\n\\end{enumerate}\n`);
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\\item $1\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return escLatex(s);
}
function plainToLatex(s = '') { return escLatex(s).replace(/\n\n+/g, '\n\n'); }

function generateLaTeX(blocks, layoutMode = 'two-column') {
  const docClass = layoutMode === 'two-column' ? 'IEEEtran' : 'article';
  const out = [];
  out.push(`\\documentclass[conference]{${docClass}}`);
  out.push('\\usepackage{cite}');
  out.push('\\usepackage{amsmath,amssymb}');
  out.push('\\usepackage{graphicx}');
  out.push('\\usepackage{booktabs}');
  out.push('');
  out.push('\\begin{document}');
  out.push('');

  let figIdx = 0, tabIdx = 0, eqIdx = 0;

  for (const b of blocks) {
    if (b.type === 'frontmatter') {
      out.push(`\\title{${escLatex(b.title || '')}}`);
      const authorBlock = (b.authors || [])
        .map(a => `\\IEEEauthorblockN{${escLatex(a.name || '')}}\n\\IEEEauthorblockA{${escLatex(a.affiliation || (b.affiliations || [])[0] || '')}\\\\\n${escLatex(a.email || '')}}`)
        .join('\n\\and\n');
      out.push(`\\author{\n${authorBlock}\n}`);
      out.push('\\maketitle');
      out.push('');
    } else if (b.type === 'abstract') {
      out.push('\\begin{abstract}');
      out.push(plainToLatex(b.content || ''));
      out.push('\\end{abstract}');
      if (b.keywords) {
        out.push('\\begin{IEEEkeywords}');
        out.push(plainToLatex(b.keywords));
        out.push('\\end{IEEEkeywords}');
      }
      out.push('');
    } else if (b.type === 'section') {
      out.push(`\\section{${escLatex(b.title || '')}}`);
      const body = b.contentHtml ? htmlToLatex(b.contentHtml) : plainToLatex(b.content || '');
      out.push(body);
      out.push('');
    } else if (b.type === 'table') {
      tabIdx++;
      out.push('\\begin{table}[t]');
      out.push(`\\caption{${escLatex(b.caption || '')}}`);
      if (b.label) out.push(`\\label{${b.label}}`);
      out.push('\\centering');
      const cols = (b.rows?.[0]?.length) || 1;
      out.push(`\\begin{tabular}{${'c'.repeat(cols)}}`);
      out.push('\\toprule');
      (b.rows || []).forEach((row, i) => {
        out.push(row.map(escLatex).join(' & ') + ' \\\\');
        if (i === 0) out.push('\\midrule');
      });
      out.push('\\bottomrule');
      out.push('\\end{tabular}');
      out.push('\\end{table}');
      out.push('');
    } else if (b.type === 'figure') {
      figIdx++;
      out.push('\\begin{figure}[t]');
      out.push('\\centering');
      out.push(`\\includegraphics[width=\\columnwidth]{${b.url ? 'figure' + figIdx : 'placeholder'}}`);
      out.push(`\\caption{${escLatex(b.caption || '')}}`);
      out.push('\\end{figure}');
      out.push('');
    } else if (b.type === 'equation') {
      eqIdx++;
      out.push('\\begin{equation}');
      out.push(b.content || '');
      out.push('\\end{equation}');
      out.push('');
    } else if (b.type === 'references') {
      out.push('\\begin{thebibliography}{99}');
      (b.entries || []).forEach((e, i) => {
        out.push(`\\bibitem{ref${i + 1}} ${escLatex(e.replace(/^\[\d+\]\s*/, ''))}`);
      });
      out.push('\\end{thebibliography}');
      out.push('');
    }
  }

  out.push('\\end{document}');
  return out.join('\n');
}

function getBlockIcon(type) {
  const map = {
    frontmatter: 'title', abstract: 'subject', section: 'segment',
    table: 'grid_on', figure: 'image', equation: 'functions',
    references: 'format_quote', algorithm: 'reorder', code: 'code',
  };
  return map[type] || 'article';
}

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────
export default function EditorPage() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [activeBlockId, setActiveBlockId] = useState('b-abstract');
  const [viewMode, setViewMode] = useState('editor');
  const [layoutMode, setLayoutMode] = useState('two-column');
  const [leftTab, setLeftTab] = useState('elements');
  const [rightTab, setRightTab] = useState('edit');
  const [zoom, setZoom] = useState(100);
  const [savedAgo, setSavedAgo] = useState('Saved 3s ago');
  const [showBlockToolbar, setShowBlockToolbar] = useState(null);
  const [navCollapsed, setNavCollapsed] = useState(true);

  // Auto-save simulation
  useEffect(() => {
    const t = setTimeout(() => setSavedAgo('Saved just now'), 3000);
    return () => clearTimeout(t);
  }, [blocks]);

  const baseActiveId = activeBlockId?.replace(/-p\d+$/, '');
  const activeBlock = blocks.find(b => b.id === baseActiveId);

  const updateBlock = (id, updates) => {
    const baseId = id?.replace(/-p\d+$/, '');
    setBlocks(prev => prev.map(b => b.id === baseId ? { ...b, ...updates } : b));
  };

  const addBlock = useCallback((template) => {
    const id = 'b-' + Math.random().toString(36).substr(2, 9);
    const newBlock = {
      id,
      type: template.type,
      sectionKey: template.sectionKey || '',
      title: template.title || 'New Section',
      content: '',
      ...(template.type === 'table' ? {
        caption: 'Comparison of Methods',
        label: 'tab:new',
        rows: [['Header 1', 'Header 2', 'Header 3'], ['Cell', 'Cell', 'Cell']],
      } : {}),
      ...(template.type === 'figure' ? { caption: 'Fig. N. Caption.', url: '' } : {}),
      ...(template.type === 'equation' ? { content: 'E = mc^2', label: '(1)' } : {}),
      ...(template.type === 'references' ? { title: 'References', entries: [] } : {}),
    };
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(id);
  }, []);

  const deleteBlock = useCallback((id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  }, [activeBlockId]);

  const moveBlock = useCallback((id, dir) => {
    setBlocks(prev => {
      const arr = [...prev];
      const i = arr.findIndex(b => b.id === id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }, []);

  const reorderBlocks = useCallback((fromIdx, toIdx) => {
    setBlocks(prev => {
      if (fromIdx === toIdx) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, moved);
      return arr;
    });
  }, []);

  const latexSource = useMemo(() => generateLaTeX(blocks, layoutMode), [blocks, layoutMode]);

  return (
    <div style={{
      height: '100vh', display: 'flex', overflow: 'hidden',
      background: '#f0f0f0', fontFamily: 'system-ui, -apple-system, sans-serif',
      paddingLeft: navCollapsed ? 68 : 240,
      transition: 'padding-left 0.3s ease',
    }}>

      {/* ── 1. SHARED APP SIDEBAR (same as dashboard) ───────────────────────── */}
      <Sidebar active="library" collapsed={navCollapsed} onToggle={() => setNavCollapsed(c => !c)} />

      {/* ── 2. COMPONENTS SIDEBAR (editor mode only) ───────────────────────── */}
      {viewMode === 'editor' && (
        <ComponentsSidebar
          leftTab={leftTab}
          setLeftTab={setLeftTab}
          addBlock={addBlock}
        />
      )}

      {/* ── 3. CENTER WORKSPACE ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Header Bar */}
        <TopBar
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          viewMode={viewMode}
          setViewMode={setViewMode}
          savedAgo={savedAgo}
          latexSource={latexSource}
          blocks={blocks}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {viewMode === 'editor' && (
            <>
              <BlockEditorPanel
                blocks={blocks}
                activeBlock={activeBlock}
                activeBlockId={activeBlockId}
                setActiveBlockId={setActiveBlockId}
                updateBlock={updateBlock}
                moveBlock={moveBlock}
                deleteBlock={deleteBlock}
                addBlock={addBlock}
                reorderBlocks={reorderBlocks}
              />
              <PaperCanvas
                blocks={blocks}
                activeBlockId={activeBlockId}
                setActiveBlockId={setActiveBlockId}
                layoutMode={layoutMode}
                setLayoutMode={setLayoutMode}
                zoom={zoom}
                setZoom={setZoom}
                deleteBlock={deleteBlock}
                moveBlock={moveBlock}
                updateBlock={updateBlock}
              />
              <RightRail rightTab={rightTab} setRightTab={setRightTab} />
            </>
          )}

          {viewMode === 'preview' && (
            <PaperCanvas
              blocks={blocks}
              activeBlockId={null}
              setActiveBlockId={() => {}}
              layoutMode={layoutMode}
              setLayoutMode={setLayoutMode}
              zoom={zoom}
              setZoom={setZoom}
              deleteBlock={() => {}}
              moveBlock={() => {}}
              updateBlock={() => {}}
              previewOnly
            />
          )}

          {viewMode === 'latex' && (
            <LatexSourceView source={latexSource} />
          )}
        </div>
      </div>
    </div>
  );
}

function LatexSourceView({ source }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard?.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const onDownload = () => {
    const blob = new Blob([source], { type: 'text/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'paper.tex'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main style={{ flex: 1, background: '#1e1e1e', overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#252526', borderBottom: '1px solid #333',
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#ccc', letterSpacing: '0.05em' }}>paper.tex</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onCopy} style={latexBtnStyle}>
            <Icon name={copied ? 'check' : 'content_copy'} size={13} style={{ color: copied ? '#22c55e' : '#ccc' }} />
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button onClick={onDownload} style={latexBtnStyle}>
            <Icon name="download" size={13} style={{ color: '#ccc' }} />
            Download
          </button>
        </div>
      </div>
      <pre style={{
        flex: 1, margin: 0, padding: 24, color: '#d4d4d4',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre',
      }}>{source}</pre>
    </main>
  );
}

const latexBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '4px 10px', background: '#3a3a3a', border: '1px solid #555',
  borderRadius: 6, fontSize: 10, fontWeight: 600, color: '#ccc',
  cursor: 'pointer',
};

// ─── COMPONENTS SIDEBAR ──────────────────────────────────────────────────────
function ComponentsSidebar({ leftTab, setLeftTab, addBlock }) {
  return (
    <aside style={{
      width: 220, background: '#fff', borderRight: '1px solid #e8e8e8',
      display: 'flex', flexDirection: 'column', zIndex: 10, position: 'relative',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 12px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#aaa', textTransform: 'uppercase', marginBottom: 12 }}>
          Components
        </div>
        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: '#f4f4f4', borderRadius: 8,
          padding: 3, border: '1px solid #eee', marginBottom: 0,
        }}>
          {['Sections', 'Elements'].map(tab => (
            <button key={tab}
              onClick={() => setLeftTab(tab.toLowerCase())}
              style={{
                flex: 1, padding: '5px 0', fontSize: 10, fontWeight: 700,
                border: 'none', cursor: 'pointer', borderRadius: 6,
                background: leftTab === tab.toLowerCase() ? '#fff' : 'transparent',
                color: leftTab === tab.toLowerCase() ? '#1a1a1a' : '#888',
                boxShadow: leftTab === tab.toLowerCase() ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px' }}>
        {leftTab === 'sections' ? (
          <SectionsList addBlock={addBlock} />
        ) : (
          <ElementsList addBlock={addBlock} />
        )}
      </div>

    </aside>
  );
}

function SectionsList({ addBlock }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 4 }}>
      {SECTIONS_LIST.map((s, i) => (
        <SidebarItem key={i} item={s} addBlock={addBlock} />
      ))}
    </div>
  );
}

function ElementsList({ addBlock }) {
  return (
    <div style={{ paddingTop: 4 }}>
      {Object.entries(ELEMENTS_CATEGORIES).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#bbb', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 4 }}>{cat}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {items.map((e, i) => <SidebarItem key={i} item={e} addBlock={addBlock} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SidebarItem({ item, addBlock }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => addBlock(item)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        border: 'none', cursor: 'pointer', borderRadius: 7, textAlign: 'left', width: '100%',
        background: hov ? '#f5f5f5' : 'transparent', transition: 'background 0.12s',
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 6,
        background: hov ? 'rgba(74,124,255,0.08)' : '#f4f4f4',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name={item.icon} size={14} style={{ color: hov ? '#4A7CFF' : '#888' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: hov ? '#1a1a1a' : '#555' }}>{item.title}</span>
    </button>
  );
}

// ─── TOP HEADER BAR ──────────────────────────────────────────────────────────
function TopBar({ layoutMode, setLayoutMode, viewMode, setViewMode, savedAgo, latexSource, blocks }) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  useEffect(() => {
    const onDoc = e => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const exportLatex = () => {
    const blob = new Blob([latexSource], { type: 'text/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'paper.tex'; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(blocks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'paper.json'; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };
  const exportPdf = () => { window.print(); setExportOpen(false); };
  return (
    <header style={{
      height: 48, background: '#fff', borderBottom: '1px solid #eee',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', flexShrink: 0, zIndex: 50, position: 'relative',
    }}>
      {/* Left: Back + Logo + template + undo/redo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => navigate('/dashboard')}
          title="Back to Dashboard"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', background: '#fafafa',
            border: '1px solid #e8e8e8', borderRadius: 7,
            fontSize: 10, fontWeight: 700, color: '#555', cursor: 'pointer',
          }}>
          <Icon name="arrow_back" size={14} style={{ color: '#555' }} />
          Back
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>PaperTrail</span>
          <span style={{ fontSize: 7, fontWeight: 700, color: '#aaa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Research Assistant</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#eee' }} />
        <select
          value={layoutMode}
          onChange={e => setLayoutMode(e.target.value)}
          style={{
            fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6,
            border: '1px solid #e8e8e8', background: '#fafafa', cursor: 'pointer',
            color: '#333', outline: 'none',
          }}>
          <option value="two-column">IEEE Two Column</option>
          <option value="one-column">IEEE Single Column</option>
          <option value="conference">IEEE Conference</option>
        </select>
        <div style={{ display: 'flex', gap: 2 }}>
          <TopBarIconBtn icon="undo" />
          <TopBarIconBtn icon="redo" />
        </div>
      </div>

      {/* Center: Editor / Preview / LaTeX Source */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', background: '#f4f4f4', padding: 3, borderRadius: 9,
        border: '1px solid #eee',
      }}>
        {['editor', 'preview', 'latex'].map(mode => (
          <button key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '5px 16px', fontSize: 10, fontWeight: 700,
              border: 'none', cursor: 'pointer', borderRadius: 7,
              background: viewMode === mode ? '#fff' : 'transparent',
              color: viewMode === mode ? '#4A7CFF' : '#888',
              boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s', textTransform: 'capitalize',
            }}>
            {mode === 'latex' ? 'LaTeX Source' : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Right: saved + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 10, color: '#22c55e', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#f0fdf4', padding: '4px 8px', borderRadius: 6,
        }}>
          <Icon name="check_circle" size={12} style={{ color: '#22c55e' }} />
          {savedAgo}
        </span>
        <TopBarTextBtn icon="share" label="Share" onClick={() => {
          const url = window.location.href;
          navigator.clipboard?.writeText(url);
          alert('Link copied to clipboard');
        }} />
        <div ref={exportRef} style={{ position: 'relative' }}>
          <TopBarTextBtn icon="download" label="Export" bordered onClick={() => setExportOpen(o => !o)} />
          {exportOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 160, zIndex: 100,
              overflow: 'hidden',
            }}>
              {[
                { icon: 'description', label: 'LaTeX (.tex)', onClick: exportLatex },
                { icon: 'picture_as_pdf', label: 'PDF (Print)', onClick: exportPdf },
                { icon: 'data_object', label: 'JSON', onClick: exportJson },
              ].map(it => (
                <button key={it.label} onClick={it.onClick} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', background: '#fff', border: 'none',
                  fontSize: 11, color: '#333', cursor: 'pointer', textAlign: 'left',
                }} onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                   onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <Icon name={it.icon} size={14} style={{ color: '#666' }} />
                  {it.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', background: '#111', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 700,
          cursor: 'pointer',
        }}>
          <Icon name="publish" size={14} style={{ color: '#fff' }} />
          Publish
        </button>
      </div>
    </header>
  );
}

function TopBarIconBtn({ icon }) {
  const [hov, setHov] = useState(false);
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: 5, border: 'none', cursor: 'pointer', borderRadius: 6, background: hov ? '#f4f4f4' : 'transparent', transition: 'background 0.12s' }}>
      <Icon name={icon} size={17} style={{ color: '#555' }} />
    </button>
  );
}

function TopBarTextBtn({ icon, label, bordered, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', background: 'transparent',
        border: bordered ? '1px solid #e8e8e8' : 'none',
        borderRadius: 7, fontSize: 10, fontWeight: 700,
        cursor: 'pointer', color: hov ? '#4A7CFF' : '#555',
        transition: 'color 0.12s',
      }}>
      <Icon name={icon} size={15} style={{ color: hov ? '#4A7CFF' : '#777' }} />
      {label}
    </button>
  );
}

// ─── BLOCK EDITOR PANEL ──────────────────────────────────────────────────────
function BlockEditorPanel({ blocks, activeBlock, activeBlockId, setActiveBlockId, updateBlock, moveBlock, deleteBlock, addBlock, reorderBlocks }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  return (
    <section style={{
      width: 308, background: '#fff', borderRight: '1px solid #eee',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top half: active block editor (scrollable) */}
      <div style={{
        flex: '1 1 60%', minHeight: 0, overflowY: 'auto',
        padding: '14px 14px 12px', borderBottom: '1px solid #f0f0f0', background: '#fdfdfd',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#bbb', textTransform: 'uppercase', marginBottom: 12 }}>
          Block Editor
        </div>

        {activeBlock ? (
          <div>
            {/* Block title row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>
                Editing: <span style={{ color: '#4A7CFF', fontWeight: 700 }}>
                  {activeBlock.title || activeBlock.type}
                </span>
              </div>
              <button style={{
                fontSize: 9, fontWeight: 700, padding: '3px 8px',
                background: '#f4f4f4', border: '1px solid #e8e8e8', borderRadius: 6,
                cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: 3,
              }}>
                Change Block
                <Icon name="expand_more" size={13} style={{ color: '#888' }} />
              </button>
            </div>

            {/* Rich text toolbar — fully wired via document.execCommand */}
            <RichTextToolbar />

            {/* Context-aware editing fields */}
            <BlockEditFields block={activeBlock} updateBlock={updateBlock} />
          </div>
        ) : (
          <div style={{
            padding: '24px 0', textAlign: 'center', color: '#ccc',
            fontSize: 11, fontStyle: 'italic', background: '#fafafa',
            borderRadius: 10, border: '1px dashed #eee',
          }}>
            Select a block on the paper to edit
          </div>
        )}
      </div>

      {/* Bottom half: structure outline (scrollable) */}
      <div style={{ flex: '1 1 40%', minHeight: 0, overflowY: 'auto', padding: '12px 10px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#bbb', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4 }}>
          Structure
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {blocks.map((b, idx) => (
            <StructureItem
              key={b.id}
              block={b}
              blocks={blocks}
              idx={idx}
              isActive={b.id === activeBlockId}
              dragIdx={dragIdx}
              overIdx={overIdx}
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); if (overIdx !== idx) setOverIdx(idx); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null && dragIdx !== idx) reorderBlocks(dragIdx, idx);
                setDragIdx(null); setOverIdx(null);
              }}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              onClick={() => setActiveBlockId(b.id)}
              onMoveUp={() => moveBlock(b.id, 'up')}
              onMoveDown={() => moveBlock(b.id, 'down')}
              onDelete={() => deleteBlock(b.id)}
            />
          ))}
        </div>
        <button
          onClick={() => addBlock({ type: 'section', sectionKey: 'new', title: 'New Section' })}
          style={{
            width: '100%', marginTop: 10, padding: '8px 0',
            border: '1px dashed #ddd', borderRadius: 8, background: 'transparent',
            fontSize: 10, fontWeight: 700, color: '#aaa', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4A7CFF'; e.currentTarget.style.color = '#4A7CFF'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#aaa'; }}
        >
          <Icon name="add" size={13} style={{ color: 'inherit' }} />
          Add New Block
        </button>
      </div>
    </section>
  );
}

function RTBtn({ icon, onMouseDown, title, active }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown && onMouseDown(e); }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', cursor: 'pointer', borderRadius: 5,
        background: active ? '#dbeafe' : hov ? '#fff' : 'transparent', transition: 'background 0.12s',
      }}>
      <Icon name={icon} size={13} style={{ color: active ? '#4A7CFF' : '#555' }} />
    </button>
  );
}

function RichTextToolbar() {
  const exec = (cmd, val = null) => document.execCommand(cmd, false, val);
  const onBlock = (e) => {
    const v = e.target.value;
    if (v === 'p') exec('formatBlock', 'p');
    else if (v === 'h1') exec('formatBlock', 'h1');
    else if (v === 'h2') exec('formatBlock', 'h2');
    else if (v === 'h3') exec('formatBlock', 'h3');
  };
  const link = () => {
    const url = prompt('URL:');
    if (url) exec('createLink', url);
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
      background: '#f6f6f6', borderRadius: 8, padding: 4,
      border: '1px solid #eee', marginBottom: 10,
    }}>
      <select onChange={onBlock} onMouseDown={e => e.preventDefault()} style={{ fontSize: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#555', outline: 'none', padding: '2px 4px' }}>
        <option value="p">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 2px' }} />
      <RTBtn icon="format_bold"        title="Bold (Ctrl+B)"      onMouseDown={() => exec('bold')} />
      <RTBtn icon="format_italic"      title="Italic (Ctrl+I)"    onMouseDown={() => exec('italic')} />
      <RTBtn icon="format_underlined"  title="Underline (Ctrl+U)" onMouseDown={() => exec('underline')} />
      <RTBtn icon="strikethrough_s"    title="Strikethrough"      onMouseDown={() => exec('strikeThrough')} />
      <RTBtn icon="superscript"        title="Superscript"        onMouseDown={() => exec('superscript')} />
      <RTBtn icon="subscript"          title="Subscript"          onMouseDown={() => exec('subscript')} />
      <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 2px' }} />
      <RTBtn icon="format_align_left"    title="Align left"    onMouseDown={() => exec('justifyLeft')} />
      <RTBtn icon="format_align_center"  title="Align center"  onMouseDown={() => exec('justifyCenter')} />
      <RTBtn icon="format_align_right"   title="Align right"   onMouseDown={() => exec('justifyRight')} />
      <RTBtn icon="format_align_justify" title="Justify"       onMouseDown={() => exec('justifyFull')} />
      <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 2px' }} />
      <RTBtn icon="format_list_bulleted"  title="Bullet list"   onMouseDown={() => exec('insertUnorderedList')} />
      <RTBtn icon="format_list_numbered"  title="Numbered list" onMouseDown={() => exec('insertOrderedList')} />
      <RTBtn icon="format_indent_increase" title="Indent"   onMouseDown={() => exec('indent')} />
      <RTBtn icon="format_indent_decrease" title="Outdent"  onMouseDown={() => exec('outdent')} />
      <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 2px' }} />
      <RTBtn icon="link"           title="Insert link"       onMouseDown={link} />
      <RTBtn icon="format_quote"   title="Blockquote"        onMouseDown={() => exec('formatBlock', 'blockquote')} />
      <RTBtn icon="format_clear"   title="Clear formatting"  onMouseDown={() => exec('removeFormat')} />
      <div style={{ width: 1, height: 16, background: '#ddd', margin: '0 2px' }} />
      <RTBtn icon="undo" title="Undo (Ctrl+Z)" onMouseDown={() => exec('undo')} />
      <RTBtn icon="redo" title="Redo (Ctrl+Y)" onMouseDown={() => exec('redo')} />
    </div>
  );
}

// Stable contentEditable wrapper that doesn't fight cursor position on each keystroke
function RichTextArea({ html, onChange, placeholder, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || '')) {
      ref.current.innerHTML = html || '';
    }
  }, [html]);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      style={{
        minHeight: 140, padding: '8px 10px', border: '1px solid #e8e8e8',
        borderRadius: 7, fontSize: 11, outline: 'none', background: '#fff',
        color: '#333', lineHeight: 1.6,
        ...style,
      }}
    />
  );
}

function BlockEditFields({ block, updateBlock }) {
  if (block.type === 'frontmatter') {
    return <FrontmatterEditor block={block} updateBlock={updateBlock} />;
  }

  if (block.type === 'abstract') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <EditField label="Abstract Text">
          <textarea
            value={block.content}
            onChange={e => updateBlock(block.id, { content: e.target.value })}
            rows={6}
            style={{ ...textareaStyle, height: 100 }}
          />
        </EditField>
        <EditField label="Keywords">
          <input
            value={block.keywords}
            onChange={e => updateBlock(block.id, { keywords: e.target.value })}
            style={inputStyle}
          />
        </EditField>
      </div>
    );
  }

  if (block.type === 'table') {
    const rows = block.rows || [['']];
    const cols = rows[0]?.length || 1;
    const addRow = () => updateBlock(block.id, { rows: [...rows, Array(cols).fill('')] });
    const removeRow = () => rows.length > 1 && updateBlock(block.id, { rows: rows.slice(0, -1) });
    const addCol = () => updateBlock(block.id, { rows: rows.map(r => [...r, '']) });
    const removeCol = () => cols > 1 && updateBlock(block.id, { rows: rows.map(r => r.slice(0, -1)) });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <EditField label="Caption">
          <input value={block.caption} onChange={e => updateBlock(block.id, { caption: e.target.value })} style={inputStyle} />
        </EditField>
        <EditField label="Label (optional)">
          <input value={block.label} onChange={e => updateBlock(block.id, { label: e.target.value })} style={inputStyle} />
        </EditField>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>
            Structure ({rows.length} rows × {cols} cols)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <button onClick={addRow} style={tableEditBtn}>+ Row</button>
            <button onClick={removeRow} style={tableEditBtn}>− Row</button>
            <button onClick={addCol} style={tableEditBtn}>+ Column</button>
            <button onClick={removeCol} style={tableEditBtn}>− Column</button>
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic' }}>Click any cell on the paper to edit inline.</div>
      </div>
    );
  }

  if (block.type === 'figure') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <EditField label="Caption">
          <input value={block.caption || ''} onChange={e => updateBlock(block.id, { caption: e.target.value })} style={inputStyle} />
        </EditField>
        <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic' }}>
          Click the figure on the paper to upload an image (or drag/paste one in).
        </div>
      </div>
    );
  }

  if (block.type === 'equation') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <EditField label="LaTeX Source">
          <textarea
            value={block.content || ''}
            onChange={e => updateBlock(block.id, { content: e.target.value })}
            rows={3}
            placeholder="E = mc^2"
            style={{ ...textareaStyle, fontFamily: '"JetBrains Mono", monospace' }}
          />
        </EditField>
        <div style={{ fontSize: 9, color: '#aaa', fontStyle: 'italic' }}>
          Renders with KaTeX in the preview. Use standard LaTeX math syntax.
        </div>
      </div>
    );
  }

  if (block.type === 'references') {
    return (
      <div style={{ fontSize: 10, color: '#aaa', fontStyle: 'italic', padding: '8px 0' }}>
        References are auto-generated from your citations. Add citations using the Citation button in the toolbar.
      </div>
    );
  }

  // Default: section, text, etc.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {block.type === 'section' && (
        <EditField label="Section Title">
          <input value={block.title} onChange={e => updateBlock(block.id, { title: e.target.value })} style={inputStyle} />
        </EditField>
      )}
      <EditField label="Content">
        <RichTextArea
          html={block.contentHtml || (block.content ? block.content.split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('') : '')}
          onChange={(html) => updateBlock(block.id, { contentHtml: html, content: html.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim() })}
          placeholder="Start writing..."
        />
      </EditField>
    </div>
  );
}

function FrontmatterEditor({ block, updateBlock }) {
  const authors = block.authors || [];
  const updateAuthor = (i, patch) => {
    const next = authors.map((a, idx) => idx === i ? { ...a, ...patch } : a);
    updateBlock(block.id, { authors: next });
  };
  const addAuthor = () => {
    const next = [...authors, { name: 'New Author', sup: String(authors.length + 1), affiliation: '', email: '' }];
    updateBlock(block.id, { authors: next });
  };
  const removeAuthor = (i) => {
    const next = authors.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, sup: String(idx + 1) }));
    updateBlock(block.id, { authors: next });
  };
  const moveAuthor = (i, dir) => {
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= authors.length) return;
    const next = [...authors];
    [next[i], next[j]] = [next[j], next[i]];
    updateBlock(block.id, { authors: next.map((a, idx) => ({ ...a, sup: String(idx + 1) })) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <EditField label="Paper Title">
        <textarea
          value={block.title}
          onChange={e => updateBlock(block.id, { title: e.target.value })}
          rows={3}
          style={textareaStyle}
        />
      </EditField>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>
            Authors ({authors.length})
          </div>
          <button onClick={addAuthor} style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 9, fontWeight: 700, padding: '3px 8px',
            background: '#4A7CFF', color: '#fff', border: 'none', borderRadius: 6,
            cursor: 'pointer',
          }}>
            <Icon name="add" size={11} style={{ color: '#fff' }} /> Add Author
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {authors.map((a, i) => (
            <div key={i} style={{
              border: '1px solid #e8e8e8', borderRadius: 8, padding: 8, background: '#fafafa',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#4A7CFF' }}>#{i + 1}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <StructureBtn icon="arrow_upward"   onClick={() => moveAuthor(i, 'up')} />
                  <StructureBtn icon="arrow_downward" onClick={() => moveAuthor(i, 'down')} />
                  <StructureBtn icon="delete" danger  onClick={() => removeAuthor(i)} />
                </div>
              </div>
              <input placeholder="Full Name" value={a.name || ''}
                onChange={e => updateAuthor(i, { name: e.target.value })}
                style={{ ...inputStyle, marginBottom: 4 }} />
              <input placeholder="Affiliation (Department, University)" value={a.affiliation || ''}
                onChange={e => updateAuthor(i, { affiliation: e.target.value })}
                style={{ ...inputStyle, marginBottom: 4 }} />
              <input placeholder="Email" value={a.email || ''}
                onChange={e => updateAuthor(i, { email: e.target.value })}
                style={inputStyle} />
            </div>
          ))}
        </div>
      </div>

      <EditField label="Affiliations (legacy lines, optional)">
        <textarea
          value={block.affiliations?.join('\n') || ''}
          onChange={e => updateBlock(block.id, { affiliations: e.target.value.split('\n') })}
          rows={3}
          style={textareaStyle}
        />
      </EditField>
    </div>
  );
}

function EditField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '6px 8px', border: '1px solid #e8e8e8',
  borderRadius: 7, fontSize: 11, outline: 'none', background: '#fafafa',
  color: '#333', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const textareaStyle = {
  ...inputStyle,
  resize: 'none', lineHeight: 1.5,
  fontFamily: 'system-ui, sans-serif',
};
const tableEditBtn = {
  padding: '5px 8px', fontSize: 10, fontWeight: 700,
  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 6,
  cursor: 'pointer', color: '#333',
};

function StructureItem({ block, blocks, idx, isActive, dragIdx, overIdx, onDragStart, onDragOver, onDrop, onDragEnd, onClick, onMoveUp, onMoveDown, onDelete }) {
  const [hov, setHov] = useState(false);
  const num = block.type === 'section' ? getSectionNumber(blocks, block.id) : '';
  const label = block.type === 'section'
    ? `${num}. ${block.title}`
    : block.title || block.type.charAt(0).toUpperCase() + block.type.slice(1);
  const isDragging = dragIdx === idx;
  const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 8px', borderRadius: 8, cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        background: isActive ? 'rgba(74,124,255,0.06)' : hov ? '#f8f8f8' : 'transparent',
        border: isActive ? '1px solid rgba(74,124,255,0.15)' : '1px solid transparent',
        borderTop: isOver ? '2px solid #4A7CFF' : (isActive ? '1px solid rgba(74,124,255,0.15)' : '1px solid transparent'),
        transition: 'all 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
        <Icon name={getBlockIcon(block.type)} size={14} style={{ color: isActive ? '#4A7CFF' : '#bbb', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? '#4A7CFF' : '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
          {label}
        </span>
      </div>
      {hov && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <StructureBtn icon="arrow_upward" onClick={e => { e.stopPropagation(); onMoveUp(); }} />
          <StructureBtn icon="arrow_downward" onClick={e => { e.stopPropagation(); onMoveDown(); }} />
          <StructureBtn icon="delete" onClick={e => { e.stopPropagation(); onDelete(); }} danger />
        </div>
      )}
    </div>
  );
}

function StructureBtn({ icon, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 20, height: 20, border: 'none', cursor: 'pointer', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? (danger ? '#fee2e2' : '#f0f0f0') : 'transparent',
      }}>
      <Icon name={icon} size={12} style={{ color: hov && danger ? '#ef4444' : '#999' }} />
    </button>
  );
}

// ─── PAPER CANVAS ─────────────────────────────────────────────────────────────
function PaperCanvas({ blocks, activeBlockId, setActiveBlockId, layoutMode, setLayoutMode, zoom, setZoom, deleteBlock, moveBlock, updateBlock, previewOnly }) {
  const isTwoCol = layoutMode === 'two-column';

  return (
    <main style={{
      flex: 1,
      background: '#eaeaea',
      overflowY: 'auto',
      overflowX: 'auto',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 0 80px'
    }}>

      {/* Floating layout + zoom controls */}
      <div style={{
        position: 'fixed', top: 60, right: 72,
        background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10,
        padding: 4, display: 'flex', alignItems: 'center', gap: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 30,
      }}>
        {['Two Column', 'Single Column'].map((label, i) => {
          const val = i === 0 ? 'two-column' : 'one-column';
          const active = layoutMode === val;
          return (
            <button key={label} onClick={() => setLayoutMode(val)}
              style={{
                padding: '5px 10px', fontSize: 10, fontWeight: 700, border: 'none',
                borderRadius: 7, cursor: 'pointer',
                background: active ? '#111' : 'transparent',
                color: active ? '#fff' : '#666',
                transition: 'all 0.15s',
              }}>{label}</button>
          );
        })}
        <div style={{ width: 1, height: 18, background: '#eee', margin: '0 2px' }} />
        <button onClick={() => setZoom(z => Math.max(50, z - 10))} style={{ ...zoomBtnStyle }}>
          <Icon name="remove" size={15} style={{ color: '#555' }} />
        </button>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#555', minWidth: 36, textAlign: 'center' }}>{zoom}%</span>
        <button onClick={() => setZoom(z => Math.min(150, z + 10))} style={{ ...zoomBtnStyle }}>
          <Icon name="add" size={15} style={{ color: '#555' }} />
        </button>
      </div>

      <PaginationManager
        blocks={blocks}
        activeBlockId={activeBlockId}
        setActiveBlockId={setActiveBlockId}
        deleteBlock={deleteBlock}
        moveBlock={moveBlock}
        updateBlock={updateBlock}
        zoom={zoom}
        isTwoCol={isTwoCol}
        previewOnly={previewOnly}
      />
    </main>
  );
}

function PaginationManager({ blocks, activeBlockId, setActiveBlockId, deleteBlock, moveBlock, updateBlock, zoom, isTwoCol, previewOnly }) {
  const TOTAL_CONTENT_HEIGHT = 912;
  const HEADER_ESTIMATE = 220;

  const result = [];
  let currentPage = { num: 1, blocks: [], currentWeight: 0 };

  const getWeight = (b) => {
    if (b.type === 'frontmatter') return 0;
    if (b.type === 'abstract') {
      const lines = (b.content?.length || 0) / 45;
      return (lines * 13.5) + 40; // Tighter line height
    }
    if (b.type === 'section') {
      const lines = (b.content?.length || 0) / 54;
      return (lines * 13.5) + 40; // Tighter line height
    }
    if (b.type === 'table') return 220;
    if (b.type === 'figure') return 260;
    if (b.type === 'equation') return 80;
    if (b.type === 'references') return 220;
    return 100;
  };

  const isSplittable = (type) => ['section', 'abstract', 'text'].includes(type);

  const blockQueue = [...blocks];
  while (blockQueue.length > 0) {
    const block = blockQueue.shift();
    if (block.type === 'frontmatter') {
      currentPage.blocks.push(block);
      continue;
    }

    const weight = getWeight(block);
    const singleColHeight = currentPage.num === 1 ? (TOTAL_CONTENT_HEIGHT - HEADER_ESTIMATE) : TOTAL_CONTENT_HEIGHT;
    const limit = isTwoCol ? (singleColHeight * 2) : singleColHeight;

    if (currentPage.currentWeight + weight <= limit) {
      currentPage.blocks.push(block);
      currentPage.currentWeight += weight;
    } else if (isSplittable(block.type) && weight > 100) {
      const splitRatio = (limit - currentPage.currentWeight) / weight;
      const splitIdx = Math.floor(block.content.length * Math.min(0.98, splitRatio));
      const safeSplit = block.content.lastIndexOf(' ', splitIdx);

      if (safeSplit > 20) {
        const part1 = { ...block, id: `${block.id}-p${currentPage.num}`, content: block.content.substring(0, safeSplit), fragmentPart: currentPage.num };
        const part2 = { ...block, content: block.content.substring(safeSplit).trim() };

        currentPage.blocks.push(part1);
        result.push(currentPage);
        currentPage = { num: currentPage.num + 1, blocks: [], currentWeight: 0 };
        blockQueue.unshift(part2);
      } else {
        result.push(currentPage);
        currentPage = { num: currentPage.num + 1, blocks: [], currentWeight: 0 };
        blockQueue.unshift(block);
      }
    } else {
      result.push(currentPage);
      currentPage = { num: currentPage.num + 1, blocks: [], currentWeight: 0 };
      blockQueue.unshift(block);
    }
  }

  result.push(currentPage);
  const pages = result;

  return (
    <div style={{
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top center',
      padding: '40px 0 200px',
      display: 'flex',
      flexDirection: 'column',
      gap: '40px',
      alignItems: 'center',
      transition: 'transform 0.2s ease',
    }}>
      {pages.map((page) => (
        <PaperPage
          key={`${page.num}-${page.blocks.length}`}
          pageNum={page.num}
          blocks={page.blocks}
          allBlocks={blocks}
          activeBlockId={activeBlockId}
          setActiveBlockId={setActiveBlockId}
          deleteBlock={deleteBlock}
          moveBlock={moveBlock}
          updateBlock={updateBlock}
          isTwoCol={isTwoCol}
          previewOnly={previewOnly}
        />
      ))}
    </div>
  );
}

function PaperPage({ pageNum, blocks, allBlocks, activeBlockId, setActiveBlockId, deleteBlock, moveBlock, updateBlock, isTwoCol, previewOnly }) {
  const frontmatter = blocks.filter(b => b.type === 'frontmatter');
  const body = blocks.filter(b => b.type !== 'frontmatter');

  // IEEE dimensions: 1056px height - 144px vertical padding = 912px total content space
  const TOTAL_CONTENT_HEIGHT = 912;
  const HEADER_ESTIMATE = 220; // Matches PaginationManager
  const BODY_HEIGHT = pageNum === 1 ? (TOTAL_CONTENT_HEIGHT - HEADER_ESTIMATE) : TOTAL_CONTENT_HEIGHT;

  return (
    <div className="paper-page" style={{
      width: 816,
      height: 1056,
      background: '#fff',
      boxShadow: '0 35px 60px -15px rgba(0,0,0,0.08)',
      border: '1px solid #e8e8e8',
      borderRadius: 2,
      padding: '72px 60px',
      boxSizing: 'border-box',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Content Engine */}
      <div style={{ height: '100%', width: '100%' }}>
        {/* Header (Spans all columns on Page 1) */}
        {pageNum === 1 && (
          <div style={{ width: '100%', height: HEADER_ESTIMATE, overflow: 'hidden' }}>
            {frontmatter.map(b => (
              <CanvasFrontmatter
                key={b.id}
                block={b}
                isActive={b.id === activeBlockId}
                onClick={() => setActiveBlockId(b.id)}
                onDelete={() => deleteBlock(b.id)}
                onMoveUp={() => moveBlock(b.id, 'up')}
                onMoveDown={() => moveBlock(b.id, 'down')}
              />
            ))}
          </div>
        )}

        {/* Body Flow (Strict Two Columns) */}
        <div style={{
          columnCount: isTwoCol ? 2 : 1,
          columnGap: '32px',
          columnFill: 'auto',
          height: BODY_HEIGHT,
          width: '100%',
          marginTop: 0,
          overflow: 'hidden', // PREVENT 3RD COLUMN SLIVER
        }}>
          {body.map(b => (
            <div key={b.id} style={{
              breakInside: ['table', 'figure', 'equation', 'algorithm'].includes(b.type) ? 'avoid-column' : 'auto',
              display: 'block',
              columnSpan: b.type === 'abstract' ? 'all' : 'none',
            }}>
              <CanvasBlock
                block={b}
                blocks={allBlocks}
                isActive={b.id === activeBlockId}
                onClick={() => setActiveBlockId(b.id)}
                onDelete={() => deleteBlock(b.id)}
                onMoveUp={() => moveBlock(b.id, 'up')}
                onMoveDown={() => moveBlock(b.id, 'down')}
                updateBlock={updateBlock}
                previewOnly={previewOnly}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Page Numbering */}
      <div style={{
        position: 'absolute',
        bottom: '36px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 10,
        fontFamily: IEEE.fonts.body,
        color: '#999'
      }}>
        {pageNum}
      </div>
    </div>
  );
}

const zoomBtnStyle = {
  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: 'none', cursor: 'pointer', borderRadius: 6, background: 'transparent',
  transition: 'background 0.12s',
};

// Legacy layout components removed

// ─── CANVAS BLOCK WRAPPER ─────────────────────────────────────────────────────
function CanvasBlockShell({ isActive, onClick, onMoveUp, onMoveDown, onDelete, children, fullWidth, previewOnly }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={previewOnly ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', cursor: previewOnly ? 'default' : 'pointer', marginBottom: 6,
        borderRadius: 4, padding: '3px 4px', width: '100%', boxSizing: 'border-box',
        overflow: 'visible',
        border: `2px solid ${previewOnly ? 'transparent' : isActive ? 'rgba(74,124,255,0.3)' : hov ? 'rgba(74,124,255,0.1)' : 'transparent'}`,
        background: !previewOnly && isActive ? 'rgba(74,124,255,0.02)' : 'transparent',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Hover toolbar — floats to the left */}
      {!previewOnly && (isActive || hov) && (
        <div style={{
          position: 'absolute', left: -52, top: 2,
          display: 'flex', flexDirection: 'column', gap: 3,
          zIndex: 20,
        }}>
          <FloatBtn icon="edit" primary />
          <FloatBtn icon="arrow_upward" onClick={e => { e.stopPropagation(); onMoveUp(); }} />
          <FloatBtn icon="content_copy" onClick={e => e.stopPropagation()} />
          <FloatBtn icon="delete" onClick={e => { e.stopPropagation(); onDelete(); }} danger />
        </div>
      )}
      {children}
    </div>
  );
}

function FloatBtn({ icon, onClick, primary, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26, border: '1px solid #e8e8e8',
        borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', background: hov ? (danger ? '#fee2e2' : primary ? '#eff6ff' : '#f8f8f8') : '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)', transition: 'all 0.12s',
      }}>
      <Icon name={icon} size={13} style={{ color: danger ? (hov ? '#ef4444' : '#aaa') : primary ? '#4A7CFF' : '#777' }} />
    </button>
  );
}

// ─── FRONTMATTER BLOCK ────────────────────────────────────────────────────────
function CanvasFrontmatter({ block, isActive, onClick, onDelete, onMoveUp, onMoveDown }) {
  const authors = block.authors || [];
  // Aggregate affiliations: prefer per-author when present; fallback to block.affiliations
  const perAuthorAffil = authors.some(a => a.affiliation);
  const emailsFromAuthors = authors.filter(a => a.email).map(a => a.email).join(', ');
  return (
    <CanvasBlockShell isActive={isActive} onClick={onClick} onDelete={onDelete} onMoveUp={onMoveUp} onMoveDown={onMoveDown} fullWidth>
      <div style={{ textAlign: 'center', padding: '24px 40px 16px', fontFamily: IEEE.fonts.body }}>
        <h1 style={{
          fontSize: IEEE.sizes.title, fontWeight: 700, lineHeight: 1.25,
          marginBottom: 14, fontFamily: IEEE.fonts.body, textTransform: 'none',
          color: '#111',
        }}>{block.title}</h1>
        <div style={{ fontSize: 13, marginBottom: 8, fontFamily: IEEE.fonts.body, lineHeight: 1.5 }}>
          {authors.map((a, i) => (
            <span key={i}>
              {a.name}<sup style={{ fontSize: 8 }}>{a.sup}</sup>
              {i < authors.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 10, fontStyle: 'italic', color: '#555', lineHeight: 1.6, marginBottom: 4 }}>
          {perAuthorAffil
            ? authors.map((a, i) => a.affiliation ? <div key={i}><sup style={{ fontSize: 7 }}>{a.sup}</sup>{a.affiliation}</div> : null)
            : block.affiliations?.map((a, i) => <div key={i}>{a}</div>)}
        </div>
        <div style={{ fontFamily: IEEE.fonts.mono, fontSize: 9, color: '#555' }}>
          Email: {emailsFromAuthors || block.emails}
        </div>
      </div>
    </CanvasBlockShell>
  );
}

// ─── ABSTRACT BLOCK ────────────────────────────────────────────────────────
function CanvasAbstract({ block, isActive, onClick, onDelete, onMoveUp, onMoveDown }) {
  return (
    <CanvasBlockShell isActive={isActive} onClick={onClick} onDelete={onDelete} onMoveUp={onMoveUp} onMoveDown={onMoveDown}>
      <div style={{ padding: '2px 0 10px', fontFamily: IEEE.fonts.body }}>
        <p style={{ fontSize: 11, lineHeight: 1.5, textAlign: 'justify', margin: 0, fontWeight: 700 }}>
          <span style={{ fontStyle: 'italic', fontWeight: 700 }}>Abstract—</span>
          {block.content}
        </p>
        <p style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4, margin: '4px 0 0', fontWeight: 700 }}>
          <span style={{ fontStyle: 'italic', fontWeight: 700 }}>Index Terms—</span>
          {block.keywords}
        </p>
      </div>
    </CanvasBlockShell>
  );
}

// ─── GENERIC CANVAS BLOCK ────────────────────────────────────────────────────
function CanvasBlock({ block, blocks, isActive, onClick, onDelete, onMoveUp, onMoveDown, updateBlock, previewOnly }) {
  return (
    <CanvasBlockShell isActive={isActive} onClick={onClick} onDelete={onDelete} onMoveUp={onMoveUp} onMoveDown={onMoveDown} previewOnly={previewOnly}>
      {block.type === 'abstract' && <CanvasAbstract block={block} isActive={isActive} onClick={onClick} onDelete={onDelete} onMoveUp={onMoveUp} onMoveDown={onMoveDown} previewOnly={previewOnly} />}
      {block.type === 'section' && <CanvasSection block={block} blocks={blocks} />}
      {block.type === 'table' && <CanvasTable block={block} blocks={blocks} updateBlock={updateBlock} previewOnly={previewOnly} />}
      {block.type === 'figure' && <CanvasFigure block={block} blocks={blocks} updateBlock={updateBlock} previewOnly={previewOnly} />}
      {block.type === 'equation' && <CanvasEquation block={block} blocks={blocks} updateBlock={updateBlock} previewOnly={previewOnly} />}
      {block.type === 'references' && <CanvasReferences block={block} />}
      {block.type === 'algorithm' && <CanvasAlgorithm block={block} />}
      {block.type === 'code' && <CanvasCode block={block} />}
      {!['section', 'table', 'figure', 'equation', 'references', 'algorithm', 'code', 'abstract'].includes(block.type) && (
        <div style={{ fontSize: 11, color: '#aaa', padding: '8px 0', fontStyle: 'italic', fontFamily: IEEE.fonts.body }}>
          [{block.type}] {block.content || block.title || ''}
        </div>
      )}
    </CanvasBlockShell>
  );
}

function CanvasSection({ block, blocks }) {
  const num = getSectionNumber(blocks, block.id);
  const isCont = block.fragmentPart > 1;
  const heading = `${num}. ${block.title?.toUpperCase()}`;

  return (
    <div style={{ fontFamily: IEEE.fonts.body }}>
      {!isCont && (
        <div style={{
          fontSize: IEEE.sizes.heading1, fontVariant: 'small-caps',
          fontWeight: 400, textAlign: 'center',
          marginBottom: 5, marginTop: 8, letterSpacing: '0.03em',
          color: '#111',
        }}>
          {heading}
        </div>
      )}
      {block.contentHtml ? (
        <div
          className="ieee-section-body"
          style={{
            fontSize: IEEE.sizes.body, lineHeight: IEEE.leading.body,
            textAlign: 'justify', color: '#111', hyphens: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: block.contentHtml }}
        />
      ) : (
        block.content?.split('\n').filter(Boolean).map((para, i) => (
          <p key={i} style={{
            fontSize: IEEE.sizes.body, lineHeight: IEEE.leading.body,
            textAlign: 'justify', margin: 0,
            textIndent: (i === 0 && !isCont) ? 0 : '3.5mm',
            hyphens: 'auto', color: '#111',
          }}>{para}</p>
        ))
      )}
    </div>
  );
}

function CanvasTable({ block, blocks, updateBlock, previewOnly }) {
  const tablesBefore = blocks.filter(b => b.type === 'table');
  const idx = tablesBefore.findIndex(b => b.id === block.id);
  const numLabel = `TABLE ${ROMAN[idx] || 'I'}`;
  const rows = block.rows || [];
  const editable = !previewOnly && updateBlock;
  const setCell = (ri, ci, val) => {
    if (!editable) return;
    const next = rows.map((r, i) => i === ri ? r.map((c, j) => j === ci ? val : c) : r);
    updateBlock(block.id, { rows: next });
  };
  return (
    <div style={{ fontFamily: IEEE.fonts.body, margin: '8px 0' }}>
      <div style={{
        fontSize: IEEE.sizes.caption, fontVariant: 'small-caps',
        fontWeight: 700, textAlign: 'center', marginBottom: 4, color: '#111',
      }}>
        {numLabel}<br />
        <span style={{ fontVariant: 'small-caps' }}>{block.caption}</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderTop: '1.5px solid #111', borderBottom: '0.5px solid #111' }}>
            {(rows[0] || []).map((h, i) => (
              <th key={i}
                contentEditable={!!editable}
                suppressContentEditableWarning
                onBlur={(e) => setCell(0, i, e.currentTarget.textContent)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  padding: '3px 6px', fontWeight: 700, textAlign: 'center',
                  fontFamily: IEEE.fonts.body, fontSize: 11,
                  outline: 'none', cursor: editable ? 'text' : 'default',
                }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri === rows.length - 2 ? '1.5px solid #111' : 'none' }}>
              {row.map((cell, ci) => (
                <td key={ci}
                  contentEditable={!!editable}
                  suppressContentEditableWarning
                  onBlur={(e) => setCell(ri + 1, ci, e.currentTarget.textContent)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    padding: '3px 6px', textAlign: 'center',
                    fontFamily: IEEE.fonts.body, fontSize: 11,
                    fontWeight: cell === 'Proposed' || (parseFloat(cell) > 95) ? 700 : 400,
                    outline: 'none', cursor: editable ? 'text' : 'default',
                  }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CanvasFigure({ block, blocks, updateBlock, previewOnly }) {
  const figsBefore = blocks.filter(b => b.type === 'figure');
  const idx = figsBefore.findIndex(b => b.id === block.id) + 1;
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const editable = !previewOnly && updateBlock;

  const handleFile = (file) => {
    if (!file || !file.type?.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => updateBlock(block.id, { url: e.target.result });
    reader.readAsDataURL(file);
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    if (!editable) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  const onPaste = (e) => {
    if (!editable) return;
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) handleFile(item.getAsFile());
  };

  return (
    <div style={{ fontFamily: IEEE.fonts.body, margin: '8px 0', textAlign: 'center' }}>
      <div
        onClick={(e) => { if (editable) { e.stopPropagation(); fileInputRef.current?.click(); } }}
        onDragOver={editable ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
        onDragLeave={editable ? () => setDragOver(false) : undefined}
        onDrop={editable ? onDrop : undefined}
        onPaste={editable ? onPaste : undefined}
        tabIndex={editable ? 0 : -1}
        style={{
          width: '100%', minHeight: 100, background: dragOver ? '#eff6ff' : '#f8f8f8',
          border: `${dragOver ? 2 : 1}px ${block.url ? 'solid' : 'dashed'} ${dragOver ? '#4A7CFF' : '#ddd'}`,
          borderRadius: 4, display: 'flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: 4,
          cursor: editable ? 'pointer' : 'default', position: 'relative', overflow: 'hidden',
        }}>
        {block.url ? (
          <img src={block.url} alt={block.caption || `Figure ${idx}`} style={{ maxWidth: '100%', maxHeight: 320, display: 'block' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#aaa' }}>
            <Icon name="add_photo_alternate" size={28} style={{ color: '#bbb' }} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{editable ? 'Click, drop, or paste an image' : 'No image'}</span>
          </div>
        )}
        {editable && block.url && (
          <button onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { url: '' }); }} style={{
            position: 'absolute', top: 4, right: 4, padding: 4,
            background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: 4,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} title="Remove image">
            <Icon name="close" size={12} style={{ color: '#fff' }} />
          </button>
        )}
        {editable && (
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])} />
        )}
      </div>
      <div style={{ fontSize: IEEE.sizes.caption, textAlign: 'center', color: '#111' }}>
        <strong>Fig. {idx}.</strong> {block.caption}
      </div>
    </div>
  );
}

function CanvasEquation({ block, blocks }) {
  const eqsBefore = blocks.filter(b => b.type === 'equation');
  const idx = eqsBefore.findIndex(b => b.id === block.id) + 1;
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const tryRender = () => {
      if (window.katex && ref.current) {
        try {
          window.katex.render(block.content || '', ref.current, {
            throwOnError: false, displayMode: true,
          });
        } catch (e) {
          ref.current.textContent = block.content || '';
        }
      } else if (ref.current) {
        // KaTeX hasn't loaded yet — show raw, then retry
        ref.current.textContent = block.content || '';
        setTimeout(tryRender, 250);
      }
    };
    tryRender();
  }, [block.content]);
  return (
    <div style={{ fontFamily: IEEE.fonts.body, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '12px 0', minHeight: 30 }}>
      <div ref={ref} style={{ fontSize: IEEE.sizes.body, fontStyle: 'italic', flex: 1, textAlign: 'center' }} />
      <div style={{ position: 'absolute', right: 0, fontSize: IEEE.sizes.body }}>({idx})</div>
    </div>
  );
}

function CanvasReferences({ block }) {
  return (
    <div style={{ fontFamily: IEEE.fonts.body }}>
      <div style={{
        fontSize: IEEE.sizes.heading1, fontVariant: 'small-caps',
        textAlign: 'center', marginBottom: 6, marginTop: 8, color: '#111',
      }}>References</div>
      {block.entries?.map((entry, i) => (
        <div key={i} style={{
          fontSize: IEEE.sizes.reference, lineHeight: IEEE.leading.reference,
          paddingLeft: '2em', textIndent: '-2em', marginBottom: 3, color: '#111',
        }}>{entry}</div>
      ))}
    </div>
  );
}

function CanvasAlgorithm({ block }) {
  return (
    <div style={{ fontFamily: IEEE.fonts.body, border: '1px solid #ddd', borderRadius: 3, padding: '8px 10px', margin: '6px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Algorithm: {block.title}</div>
      <div style={{ fontSize: 10, fontFamily: IEEE.fonts.mono, lineHeight: 1.6 }}>
        {block.content || '1: Input: ...\n2: Output: ...\n3: for each step do\n4:   process()\n5: end for'}
      </div>
    </div>
  );
}

function CanvasCode({ block }) {
  return (
    <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 4, padding: '8px 10px', margin: '6px 0', overflowX: 'auto' }}>
      <div style={{ fontFamily: IEEE.fonts.mono, fontSize: 10, lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {block.content || '// Code block'}
      </div>
    </div>
  );
}

// ─── RIGHT UTILITY RAIL ───────────────────────────────────────────────────────
function RightRail({ rightTab, setRightTab }) {
  const items = [
    { id: 'edit', icon: 'edit', label: 'Edit' },
    { id: 'comment', icon: 'forum', label: 'Comment' },
    { id: 'cite', icon: 'format_quote', label: 'Cite', badge: 99 },
    { id: 'ai', icon: 'auto_awesome', label: 'AI Assist' },
    { id: 'outline', icon: 'toc', label: 'Outline' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];
  return (
    <aside style={{
      width: 52, background: '#fff', borderLeft: '1px solid #eee',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 0', gap: 6, zIndex: 40,
    }}>
      {items.map(item => (
        <RightRailBtn key={item.id} item={item} isActive={rightTab === item.id} onClick={() => setRightTab(item.id)} />
      ))}
    </aside>
  );
}

function RightRailBtn({ item, isActive, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button
        title={item.label}
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 36, height: 36, border: 'none', cursor: 'pointer',
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isActive ? 'rgba(74,124,255,0.08)' : hov ? '#f8f8f8' : 'transparent',
          transition: 'all 0.12s',
          flexDirection: 'column', gap: 1,
        }}
      >
        <Icon name={item.icon} size={18} style={{ color: isActive ? '#4A7CFF' : hov ? '#555' : '#bbb' }} />
        <span style={{ fontSize: 7, color: isActive ? '#4A7CFF' : '#bbb', fontWeight: 700, letterSpacing: '0.02em' }}>
          {item.label}
        </span>
      </button>
      {item.badge && (
        <div style={{
          position: 'absolute', top: 2, right: 2,
          width: 14, height: 14, background: '#4A7CFF', borderRadius: '50%',
          fontSize: 7, color: '#fff', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{item.badge > 9 ? '9+' : item.badge}</div>
      )}
    </div>
  );
}