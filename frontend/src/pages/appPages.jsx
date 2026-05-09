// Dashboard, Library, Document Viewer, Workspaces pages
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, Icon, Brand, Sidebar, TopNav, AppShell, CommandPalette, EmptyState, navigate } from '../shared/components';
import { useAuth } from '../contexts/AuthContext';

const useStateP1 = useState;
const useEffectP1 = useEffect;
const useRefP1 = useRef;
const useMemoP1 = useMemo;

const API_BASE = "http://127.0.0.1:8000/api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("aid_token");
  const headers = { ...(options.headers || {}) };
  const isFormData = options.body instanceof FormData;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!isFormData && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const rawText = await response.text();
  const data = rawText ? (() => {
    try { return JSON.parse(rawText); } catch { return rawText; }
  })() : null;

  if (!response.ok) {
    const detail = data && typeof data === "object" && data.detail ? data.detail : data;
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return data;
}

// =================== DASHBOARD ===================
function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  const [search, setSearch] = useStateP1(false);
  const docs = [
    { type: "PDF", name: "Neural Networks in LLMs.pdf", time: "2 hours ago", size: "4.2 MB", to: "/library/ml/neural-networks" },
    { type: "DOCX", name: "Thesis Proposal — Draft 3.docx", time: "5 hours ago", size: "124 KB", to: "/library/thesis/proposal" },
    { type: "URL", name: "arxiv.org/abs/2301.04...", time: "Yesterday", size: "Web Clip", to: "/library/ml/arxiv-2301" },
    { type: "PDF", name: "Ethics in AI — Meta Review.pdf", time: "3 days ago", size: "1.8 MB", to: "/library/ethics/meta-review" },
  ];
  const cols = [
    { name: "ML Research", count: 12, cites: 4, icon: "folder" },
    { name: "Thesis Sources", count: 28, cites: 12, icon: "school" },
    { name: "Dataset Refs", count: 8, cites: 1, icon: "science" },
  ];
  const activity = [
    { icon: "edit_note", text: <><b>You</b> annotated "Neural Networks…"</>, time: "2 hours ago" },
    { icon: "upload_file", text: <><b>You</b> uploaded "Ethics in AI…"</>, time: "5 hours ago" },
    { icon: "chat_bubble", text: <>Summarized <b>ML Research</b> collection</>, time: "Yesterday" },
    { icon: "bookmark", text: <>Cited <b>Arxiv:2301.04</b> in Thesis</>, time: "3 days ago" },
  ];

  return (
    <>
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <AppShell active="home" breadcrumbs={[{ label: "Dashboard" }]} onSearchOpen={() => setSearch(true)}>
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h2 className="font-section-heading text-section-heading text-primary mb-2">Good morning, {firstName}.</h2>
              <p className="text-on-surface-variant font-body-main">Continue your exploration or start a new project.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/upload" className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:opacity-90">
                <Icon name="add" size={20} /> Upload doc
              </Link>
              <Link to="/library" className="flex items-center gap-2 border border-border-subtle bg-white text-primary px-5 py-2.5 rounded-full font-bold text-sm hover:bg-surface-container-low">
                <Icon name="folder_open" size={20} /> Collection
              </Link>
              <Link to="/workspaces" className="flex items-center gap-2 border border-border-subtle bg-white text-primary px-5 py-2.5 rounded-full font-bold text-sm hover:bg-surface-container-low">
                <Icon name="grid_view" size={20} /> Workspace
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12 lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-card-title text-card-title text-primary">Recent Documents</h3>
              <Link to="/library" className="text-xs font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.map((d, i) => (
                <Link key={i} to={d.to} className="bg-white border border-border-subtle p-4 rounded-xl hover:shadow-md transition-shadow group cursor-pointer block">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${d.type === "PDF" ? "bg-accent-source-highlight" : d.type === "DOCX" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high"}`}>{d.type}</span>
                    <Icon name="more_vert" className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-card-title text-card-title mb-1 truncate pr-4">{d.name}</h4>
                  <p className="text-xs text-on-surface-variant">Modified {d.time} • {d.size}</p>
                </Link>
              ))}
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-card-title text-card-title text-primary">Recent Collections</h3>
                <Link to="/library" className="text-xs font-bold text-primary hover:underline">Manage</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {cols.map((c, i) => (
                  <Link key={i} to="/library" className="bg-white p-5 rounded-2xl border border-border-subtle hover:border-primary transition-colors cursor-pointer group block">
                    <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon name={c.icon} />
                    </div>
                    <h4 className="font-bold text-sm mb-1">{c.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">{c.count} Documents • {c.cites} Citations</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-2xl border border-border-subtle p-6 h-full">
              <h3 className="font-card-title text-card-title text-primary mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {activity.map((a, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                      <Icon name={a.icon} className="text-[18px] text-primary" />
                    </div>
                    <div>
                      <p className="text-sm">{a.text}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-4 rounded-xl bg-surface-container border border-border-subtle">
                <div className="flex items-center gap-3 mb-2">
                  <Icon name="auto_awesome" filled className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Suggestion</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">Based on your recent uploads, you might want to explore the <span className="text-primary font-bold">Transformer Architecture</span> cluster.</p>
                <button className="mt-3 text-xs font-bold text-primary hover:underline">Explore Cluster →</button>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    </>
  );
}

// =================== LIBRARY ===================
function LibraryPage() {
  const [view, setView] = useStateP1("list");
  const [search, setSearch] = useStateP1(false);
  const [filter, setFilter] = useStateP1("all");
  const allRows = [
    { type: "PDF", title: "Trustworthiness of AI in Human-Robot Interaction", authors: "L. Roberts, J. Miller", added: "Oct 12, 2023", full: true, tags: ["High Trust", "ArXiv:2024"], slug: "trust-ai-hri" },
    { type: "PDF", title: "Measuring Trust: Dynamic Scaling in Autonomous Systems", authors: "Sarah G. Jenkins", added: "Oct 10, 2023", full: true, tags: ["Methodology"], slug: "measuring-trust" },
    { type: "DOC", title: "Ethics of Large Language Models in Scientific Publication", authors: "Dr. Alan Turing Inst.", added: "Sep 28, 2023", full: false, tags: ["Pre-print"], slug: "ethics-llm" },
    { type: "PDF", title: "Cognitive Load Theory in Digital Environments", authors: "Sweller, J., Paas, F.", added: "Sep 24, 2023", full: true, tags: ["Review", "Nature"], slug: "cognitive-load" },
    { type: "PDF", title: "Hierarchical RAG Architecture for Long-Context Reasoning", authors: "Y. Tanaka et al.", added: "Sep 14, 2023", full: true, tags: ["Methodology", "ArXiv:2024"], slug: "hierarchical-rag" },
    { type: "URL", title: "arxiv.org/abs/2301.04267 — Multi-Agent RAG", authors: "—", added: "Sep 02, 2023", full: false, tags: ["Web Clip"], slug: "arxiv-2301" },
  ];
  const rows = filter === "all" ? allRows : allRows.filter(r => r.type === filter);

  return (
    <>
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <AppShell active="library" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Library" }]} onSearchOpen={() => setSearch(true)}>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-section-heading text-section-heading text-primary mb-2">Research Library</h1>
            <p className="text-on-surface-variant text-body-main">Manage your academic sources and cross-reference documents.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-surface-container p-1 rounded-lg">
              <button onClick={() => setView("list")} className={`p-1.5 rounded-md transition-all ${view === "list" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}>
                <Icon name="format_list_bulleted" size={18} />
              </button>
              <button onClick={() => setView("grid")} className={`p-1.5 rounded-md transition-all ${view === "grid" ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}>
                <Icon name="grid_view" size={18} />
              </button>
            </div>
            <div className="flex items-center bg-surface-container p-1 rounded-lg text-xs">
              {["all", "PDF", "DOC", "URL"].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md font-bold transition-all ${filter === f ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}>{f === "all" ? "All" : f}</button>
              ))}
            </div>
            <button className="flex items-center gap-2 border border-border-subtle px-3 py-2 rounded-lg text-xs font-semibold hover:bg-surface-container-low">
              <Icon name="sort" size={16} /> Sort
            </button>
            <Link to="/upload" className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90">
              <Icon name="add" size={18} /> Add Source
            </Link>
          </div>
        </div>

        {view === "list" ? (
          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-container-lowest">
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Authors</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Added</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Full Text</th>
                  <th className="px-6 py-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((r, i) => (
                  <tr key={i} className="group hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/library/thesis/${r.slug}`)}>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-10 bg-surface-container-highest rounded border border-border-subtle flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-on-surface-variant">{r.type}</span>
                        </div>
                        <div>
                          <p className="font-card-title text-primary">{r.title}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {r.tags.map((t, j) => (
                              <span key={j} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${j === 0 ? "bg-accent-source-highlight" : "bg-secondary-container text-on-secondary-container"}`}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-body-main text-on-surface-variant">{r.authors}</td>
                    <td className="px-6 py-5 text-body-main text-on-surface-variant whitespace-nowrap">{r.added}</td>
                    <td className="px-6 py-5">
                      {r.full ? <Icon name="check_circle" filled className="text-green-600" /> : <Icon name="cancel" className="text-on-surface-variant/40" />}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary p-1">
                        <Icon name="more_horiz" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState icon="search_off" title="No documents" text="Try a different filter or add a new source." action={<Link to="/upload" className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold">Upload</Link>} />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r, i) => (
              <Link key={i} to={`/library/thesis/${r.slug}`} className="bg-white border border-border-subtle p-5 rounded-xl hover:shadow-md transition-shadow block">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-accent-source-highlight">{r.type}</span>
                  {r.full && <Icon name="check_circle" filled size={14} className="text-green-600" />}
                </div>
                <h4 className="font-card-title text-card-title mb-2 line-clamp-2">{r.title}</h4>
                <p className="text-[11px] text-on-surface-variant mb-3">{r.authors}</p>
                <p className="text-[10px] text-on-surface-variant">{r.added}</p>
              </Link>
            ))}
          </div>
        )}
      </AppShell>
    </>
  );
}

// =================== DOCUMENT VIEWER ===================
function DocViewerPage({ params }) {
  const [page, setPage] = useStateP1(3);
  const [zoom, setZoom] = useStateP1(110);
  const [selection, setSelection] = useStateP1(false);
  const [length, setLength] = useStateP1("Med");
  const [activeChip, setActiveChip] = useStateP1(null);
  const [messages, setMessages] = useStateP1([
    { role: "user", text: "What is RAG architecture?", time: "10:42 AM" },
    {
      role: "ai",
      time: "10:42 AM",
      blocks: [
        { type: "text", text: "Retrieval-Augmented Generation (RAG) is an architectural pattern used to provide LLMs with contextually relevant, external data." },
        { type: "text", text: "It works by first retrieving relevant documents from a knowledge base " },
        { type: "chip", page: 3 },
        { type: "text", text: " and then using that information to ground the AI's final generation " },
        { type: "chip", page: 7 },
        { type: "text", text: "." },
        { type: "text", text: "This significantly reduces hallucinations and ensures answers are verifiable through citations." },
      ],
    },
    {
      role: "user",
      text: "@search_web latest RAG papers 2025",
      time: "10:44 AM",
      mention: true,
    },
    {
      role: "ai",
      time: "10:44 AM",
      agent: "@search_web",
      blocks: [
        { type: "text", text: "Searched the web for latest RAG papers (2025). Top results include hierarchical retrieval (Tanaka et al.) and self-correcting RAG agents (Liu et al.)." },
        { type: "chip", page: 12 },
      ],
    },
  ]);
  const [draft, setDraft] = useStateP1("");
  const [contextOpen, setContextOpen] = useStateP1(false);
  const [context, setContext] = useStateP1("Research_Paper_V2.pdf");

  const docName = "Research_Paper_V2.pdf";

  const send = () => {
    if (!draft.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(m => [...m, { role: "user", text: draft, time }]);
    setDraft("");
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai", time, blocks: [
          { type: "text", text: "Based on the document, " },
          { type: "chip", page: 5 },
          { type: "text", text: " describes the multi-stage retrieval that ensures higher quality context. " },
          { type: "chip", page: 9 },
          { type: "text", text: " details the reranking step." },
        ],
      }]);
    }, 800);
  };

  const onChip = (p) => { setPage(p); setActiveChip(p); };

  return (
    <div className="h-screen flex flex-col bg-background-primary overflow-hidden">
      <Sidebar active="library" />
      <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-white border-b border-border-subtle flex justify-between items-center px-container-padding z-30">
        <nav className="flex items-center gap-2 font-breadcrumb text-breadcrumb">
          <Link to="/library" className="text-on-surface-variant hover:text-primary">Library</Link>
          <Icon name="chevron_right" className="text-[14px] text-on-surface-variant" />
          <span className="text-primary font-bold">{docName}</span>
        </nav>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low">
            <Icon name="download" size={16} /> Download
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low">
            <Icon name="ios_share" size={16} /> Share
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low">
            <Icon name="format_quote" size={16} /> Cite
          </button>
        </div>
      </header>

      <main className="ml-sidebar-width pt-16 h-screen flex">
        {/* PDF pane */}
        <section className="flex-1 bg-surface-container-low overflow-y-auto p-8 flex flex-col items-center">
          <div className="sticky top-0 mb-8 bg-white/90 backdrop-blur-md border border-border-subtle px-3 py-2 rounded-xl flex items-center gap-4 z-10 shadow-sm">
            <div className="flex items-center gap-1 border-r border-border-subtle pr-3">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-surface-container-low rounded"><Icon name="zoom_out" size={18} /></button>
              <span className="text-xs font-semibold w-12 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 hover:bg-surface-container-low rounded"><Icon name="zoom_in" size={18} /></button>
            </div>
            <div className="flex items-center gap-1 border-r border-border-subtle pr-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 hover:bg-surface-container-low rounded"><Icon name="chevron_left" size={18} /></button>
              <span className="text-xs font-semibold whitespace-nowrap">Page {page} / 12</span>
              <button onClick={() => setPage(p => Math.min(12, p + 1))} className="p-1 hover:bg-surface-container-low rounded"><Icon name="chevron_right" size={18} /></button>
            </div>
            <button className="p-1 hover:bg-surface-container-low rounded" title="Find"><Icon name="search" size={18} /></button>
            <button className="p-1 hover:bg-surface-container-low rounded" title="Print"><Icon name="print" size={18} /></button>
          </div>

          <div className="w-full max-w-3xl bg-white shadow-sm min-h-[1100px] p-16 relative" onMouseUp={() => setSelection(true)} onMouseDown={() => setSelection(false)}>
            <h1 className="font-section-heading text-xl mb-4">Hierarchical Retrieval-Augmented Generation (RAG) Architecture</h1>
            <p className="text-on-surface-variant text-sm mb-3">Y. Tanaka, M. Schultz · Page {page}</p>
            <p className="text-body-main text-on-surface mb-6 leading-relaxed">
              The emergence of large language models (LLMs) has revolutionized the way we interact with unstructured data. However, LLMs suffer from "hallucinations" — confidently stating false information. <span className={`px-1 transition-colors ${activeChip === 3 ? "bg-accent-source-highlight" : "bg-accent-source-highlight/60"}`}>Retrieval-Augmented Generation (RAG) addresses this by anchoring the model's outputs in a verifiable external knowledge base.</span>
            </p>
            <p className="text-body-main text-on-surface mb-6 leading-relaxed">
              Standard RAG workflows involve document ingestion, chunking, and vector embedding. During inference, a user's query is converted into a vector, and the system performs a similarity search against the knowledge base to retrieve relevant context.
            </p>
            <div className="w-full h-64 bg-surface-container-low rounded-lg flex items-center justify-center mb-6 border border-dashed border-border-subtle">
              <div className="text-center text-on-surface-variant">
                <Icon name="image" className="text-3xl" />
                <p className="text-xs mt-2 font-mono">[ Figure 2: RAG architecture diagram ]</p>
              </div>
            </div>
            <p className="text-body-main text-on-surface leading-relaxed mb-6">
              In advanced systems, multi-stage retrieval or reranking is employed to ensure the highest quality context is provided. <span className={`px-1 transition-colors ${activeChip === 7 ? "bg-accent-source-highlight" : ""}`}>This reduces noise and improves the overall accuracy of the generated response.</span>
            </p>
            <p className="text-body-main text-on-surface leading-relaxed">
              <span className={`px-1 transition-colors ${activeChip === 12 ? "bg-accent-source-highlight" : ""}`}>Our hierarchical retriever introduces a coarse-to-fine selection cascade, demonstrably outperforming single-stage retrieval on long-context tasks.</span>
            </p>

            {selection && (
              <div className="absolute top-[260px] left-1/2 -translate-x-1/2 bg-primary text-on-primary flex items-center rounded-lg shadow-xl py-1 px-1 z-20">
                <button className="px-3 py-1.5 text-[12px] font-semibold hover:bg-white/10 flex items-center gap-1.5 border-r border-white/10"><Icon name="summarize" size={16} /> Summarize</button>
                <button className="px-3 py-1.5 text-[12px] font-semibold hover:bg-white/10 flex items-center gap-1.5 border-r border-white/10"><Icon name="psychology_alt" size={16} /> Explain</button>
                <button className="px-3 py-1.5 text-[12px] font-semibold hover:bg-white/10 flex items-center gap-1.5 border-r border-white/10"><Icon name="edit_note" size={16} /> Annotate</button>
                <button className="px-3 py-1.5 text-[12px] font-semibold hover:bg-white/10 flex items-center gap-1.5"><Icon name="format_quote" size={16} /> Cite</button>
              </div>
            )}
          </div>
        </section>

        {/* Chat pane */}
        <section className="w-[440px] bg-white border-l border-border-subtle flex flex-col flex-shrink-0">
          <div className="px-5 py-3 border-b border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="smart_toy" filled className="text-primary" />
                <h2 className="font-card-title text-card-title">Research Assistant</h2>
              </div>
              <button className="text-on-surface-variant hover:text-primary"><Icon name="more_horiz" /></button>
            </div>
            <div className="relative">
              <button onClick={() => setContextOpen(o => !o)} className="text-[11px] flex items-center gap-1.5 px-2 py-1 bg-surface-container-low rounded-md hover:bg-surface-container">
                <Icon name="dataset" size={14} /> Context: <b>{context}</b> <Icon name="expand_more" size={14} />
              </button>
              {contextOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-border-subtle rounded-lg shadow-lg p-1 z-20 w-64">
                  {["Research_Paper_V2.pdf", "Entire Collection (12 docs)", "Workspace: Thesis Research"].map(c => (
                    <button key={c} onClick={() => { setContext(c); setContextOpen(false); }} className={`w-full text-left text-xs px-3 py-2 rounded hover:bg-surface-container-low ${context === c ? "bg-surface-container-low font-bold" : ""}`}>{c}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
            {messages.map((m, i) => m.role === "user" ? (
              <div key={i} className="flex flex-col items-end">
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-body-main ${m.mention ? "bg-primary text-white" : "bg-surface-container-high"}`}>
                  {m.mention ? (
                    <><span className="bg-white/20 rounded px-1 py-0.5 text-[11px] font-bold mr-1">@search_web</span>{m.text.replace("@search_web ", "")}</>
                  ) : m.text}
                </div>
                <span className="text-[10px] text-text-muted mt-1 px-1">{m.time}</span>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="smart_toy" filled className="text-white" size={18} />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {m.agent && <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1"><Icon name="travel_explore" size={12}/> {m.agent}</span>}
                  <div className="text-body-main leading-relaxed text-on-surface">
                    {m.blocks.map((b, j) => b.type === "text" ? <span key={j}>{b.text}</span> : (
                      <button key={j} onClick={() => onChip(b.page)} className={`inline-flex items-center bg-accent-source-highlight text-source-chip px-1.5 py-0.5 rounded ml-1 hover:brightness-95 transition-all font-source-chip text-[11px] font-bold ${activeChip === b.page ? "ring-2 ring-primary" : ""}`}>
                        pg. {b.page} <Icon name="link" size={11} className="ml-0.5" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low"><Icon name="content_copy" size={14} /></button>
                    <button className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low"><Icon name="thumb_up" size={14} /></button>
                    <button className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low"><Icon name="refresh" size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border-subtle">
            <div className="bg-surface-container-low rounded-2xl p-2 border border-border-subtle">
              <textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} className="w-full bg-transparent border-none focus:ring-0 text-body-main resize-none p-2 h-16 outline-none" placeholder="Ask a question, or type @ to mention an agent..." />
              <div className="flex items-center justify-between pt-1 px-1">
                <div className="flex bg-surface-container-highest p-1 rounded-full">
                  {["Short", "Med", "Detailed"].map(l => (
                    <button key={l} onClick={() => setLength(l)} className={`px-3 py-1 text-[10px] font-bold rounded-full transition-colors ${length === l ? "bg-primary text-white" : "text-on-surface-variant hover:text-primary"}`}>{l}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-on-surface-variant hover:text-primary rounded-full"><Icon name="attach_file" size={18} /></button>
                  <button onClick={send} className="bg-primary text-white p-2 rounded-full hover:opacity-90 flex items-center justify-center">
                    <Icon name="send" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// =================== WORKSPACES ===================
function WorkspacesPage() {
  const [search, setSearch] = useStateP1(false);
  const [cards, setCards] = useStateP1([]);
  const [loading, setLoading] = useStateP1(true);
  const [error, setError] = useStateP1("");

  useEffectP1(() => {
    const loadWorkspaces = async () => {
      try {
        setError("");
        setLoading(true);
        const data = await apiRequest("/workspaces");
        setCards(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  const handleCreateWorkspace = async () => {
    const name = window.prompt("Workspace name");
    if (!name) return;

    try {
      const created = await apiRequest("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setCards(prev => [created, ...prev]);
      navigate(`/workspaces/${created.workspace_id}`);
    } catch (err) {
      window.alert(err.message);
    }
  };

  return (
    <>
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <AppShell active="workspaces" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Workspaces" }]} onSearchOpen={() => setSearch(true)}>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="font-section-heading text-section-heading text-primary mb-2">Your Workspaces</h1>
            <p className="text-on-surface-variant">Manage your collaborative research projects.</p>
          </div>
          <button onClick={handleCreateWorkspace} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-bold text-sm hover:opacity-90">
            <Icon name="add" size={20} /> New Workspace
          </button>
        </div>

        {error && <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-xs">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {loading ? (
            <div className="col-span-full text-sm text-on-surface-variant">Loading workspaces...</div>
          ) : cards.length === 0 ? (
            <div className="col-span-full text-sm text-on-surface-variant">No workspaces yet. Create one to start collaborating.</div>
          ) : cards.map((c, i) => (
            <div key={c.workspace_id || i} className="group relative bg-white border border-border-subtle p-6 rounded-xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/workspaces/${c.workspace_id}`)}>
              <div className="flex justify-between items-start mb-8">
                <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-white">
                  <Icon name="auto_stories" filled />
                </div>
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(3, c.members?.length || 0) }).map((_, j) => (
                    <div key={j} className="w-7 h-7 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[9px] font-bold">U{j+1}</div>
                  ))}
                  {(c.members?.length || 0) > 3 && <div className="w-7 h-7 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[9px] font-bold">+{(c.members?.length || 0)-3}</div>}
                </div>
              </div>
              <h3 className="font-card-title text-card-title mb-1">{c.name}</h3>
              <p className="text-[12px] text-on-surface-variant mb-5 leading-relaxed line-clamp-2">Collaborative workspace shared through the backend.</p>
              <div className="flex items-center gap-4 text-[11px] text-on-secondary-container font-medium">
                <span className="flex items-center gap-1"><Icon name="description" size={14} /> Files</span>
                <span className="flex items-center gap-1"><Icon name="group" size={14} /> {c.members?.length || 0} Members</span>
              </div>
            </div>
          ))}
          <button onClick={handleCreateWorkspace} className="border-2 border-dashed border-border-subtle p-6 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary hover:bg-surface-container-low transition-all min-h-[220px]">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-3 text-on-surface-variant">
              <Icon name="add_circle" size={28} />
            </div>
            <p className="font-bold text-sm">Add New</p>
            <p className="text-[11px] text-on-surface-variant max-w-[160px] mt-1">Create a collaborative environment for your team.</p>
          </button>
        </div>
      </AppShell>
    </>
  );
}

// =================== WORKSPACE DETAIL ===================
function WorkspaceDetailPage({ params }) {
  const { user } = useAuth();
  const workspaceId = params?.[0];
  const [tab, setTab] = useStateP1("files");
  const [workspace, setWorkspace] = useStateP1(null);
  const [documents, setDocuments] = useStateP1([]);
  const [message, setMessage] = useStateP1("");
  const [loading, setLoading] = useStateP1(true);
  const [inviteLoading, setInviteLoading] = useStateP1(false);
  const [uploadLoading, setUploadLoading] = useStateP1(false);
  const [uploadFile, setUploadFile] = useStateP1(null);

  const loadWorkspace = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const [workspaceData, documentData] = await Promise.all([
        apiRequest(`/workspaces/${workspaceId}`),
        apiRequest(`/documents?workspace_id=${workspaceId}`),
      ]);
      setWorkspace(workspaceData);
      setDocuments(Array.isArray(documentData) ? documentData : []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffectP1(() => {
    loadWorkspace();
  }, [workspaceId]);

  const handleInvite = async () => {
    const email = window.prompt("Invite by email");
    if (!email) return;

    try {
      setInviteLoading(true);
      setMessage("");
      await apiRequest(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role: "Viewer" }),
      });
      setMessage(`Invited ${email}`);
      await loadWorkspace();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setMessage("Choose a file first.");
      return;
    }

    try {
      setUploadLoading(true);
      setMessage("");
      const formData = new FormData();
      formData.append("file", uploadFile);
      await apiRequest(`/documents/upload?workspace_id=${workspaceId}`, {
        method: "POST",
        body: formData,
      });
      setMessage(`Uploaded ${uploadFile.name}`);
      setUploadFile(null);
      await loadWorkspace();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const name = workspace?.name || "Workspace";

  return (
    <AppShell active="workspaces" breadcrumbs={[{ label: "Workspaces", to: "/workspaces" }, { label: name }]}>
      <div className="bg-white border border-border-subtle rounded-2xl overflow-hidden">
        <div className="border-b border-border-subtle bg-surface-container-lowest px-8 pt-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-white">
                <Icon name="auto_stories" filled />
              </div>
              <div>
                <h2 className="font-bold text-xl">{name}</h2>
                <p className="text-[12px] text-on-surface-variant">{workspace?.owner_id === user?.user_id ? "Owner workspace" : "Shared workspace"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleInvite} disabled={inviteLoading} className="px-4 py-2 rounded-lg border border-border-subtle text-xs font-semibold hover:bg-surface-container-low flex items-center gap-2 disabled:opacity-50">
                <Icon name="person_add" size={16} /> {inviteLoading ? "Inviting..." : "Invite"}
              </button>
              <button className="px-3 py-2 rounded-lg border border-border-subtle hover:bg-surface-container-low">
                <Icon name="settings" size={16} />
              </button>
            </div>
          </div>
          <div className="flex gap-6">
            {[{id:"files", label:"Files", icon:"folder"},{id:"chats",label:"Chats",icon:"chat_bubble",badge:12},{id:"members",label:"Members",icon:"group"}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`pb-3 px-1 text-sm flex items-center gap-2 transition-colors border-b-2 ${tab === t.id ? "border-primary text-primary font-bold" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
                <Icon name={t.icon} size={16} /> {t.label}
                {t.badge && <span className="bg-surface-container-high text-[10px] px-1.5 py-0.5 rounded-full">{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {message && <div className="mb-4 p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant">{message}</div>}
          {loading && <div className="mb-4 text-sm text-on-surface-variant">Loading workspace...</div>}
          {tab === "files" && (
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row gap-3 md:items-end mb-6 p-4 border border-border-subtle rounded-xl bg-surface-container-lowest">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase block mb-1">Upload file to workspace</label>
                  <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full text-xs" />
                </div>
                <button onClick={handleUpload} disabled={uploadLoading} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-50">
                  {uploadLoading ? "Uploading..." : "Upload"}
                </button>
              </div>

              {documents.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border-subtle rounded-lg hover:bg-surface-container-low group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-[10px] font-bold">{f.file_type}</div>
                    <div>
                      <p className="text-sm font-bold">{f.filename}</p>
                      <p className="text-[11px] text-on-surface-variant">Uploaded {new Date(f.upload_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <Icon name="more_vert" className="text-on-surface-variant opacity-0 group-hover:opacity-100" />
                </div>
              ))}
              {documents.length === 0 && <div className="text-sm text-on-surface-variant">No files uploaded yet.</div>}
            </div>
          )}
          {tab === "chats" && (
            <div className="space-y-4">
              {[
                { title: "Analysis of RAG methods", participants: 3, msg: "I've highlighted some interesting patterns in the decentralized governance section.", time: "2h ago" },
                { title: "Methodology calibration sync", participants: 4, msg: "Let's lock in the inter-rater reliability protocol before next week.", time: "Yesterday" },
                { title: "Interview coding pass #2", participants: 2, msg: "Done with the second pass — uploaded the codebook.", time: "3d ago" },
              ].map((c, i) => (
                <div key={i} className="p-4 border border-border-subtle rounded-lg hover:bg-surface-container-low cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm">{c.title}</h4>
                    <span className="text-[10px] text-on-surface-variant">{c.time}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-1">{c.msg}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-on-surface-variant">
                    <Icon name="group" size={12} /> {c.participants} participants
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "members" && (
            <div className="space-y-3">
              {(workspace?.members || []).map((m, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border-subtle rounded-lg hover:bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold">{String(m.user_id).slice(0, 2).toUpperCase()}</div>
                    <div>
                      <p className="text-sm font-bold">{m.role}</p>
                      <p className="text-[11px] text-on-surface-variant">{m.user_id}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 border border-border-subtle rounded-md bg-white">{m.role}</span>
                </div>
              ))}
              {!(workspace?.members || []).length && <div className="text-sm text-on-surface-variant">No members found.</div>}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function IntegrationsPage() {
  const integrations = [
    { id: "zotero", name: "Zotero", desc: "Sync your research library and sync collections.", icon: "menu_book", status: "connected" },
    { id: "mendeley", name: "Mendeley", desc: "Import papers and citations from your Mendeley account.", icon: "school", status: "disconnected" },
    { id: "googlescholar", name: "Google Scholar", desc: "Automate citation tracking and PDF capture.", icon: "search", status: "disconnected" },
    { id: "notion", name: "Notion", desc: "Export summaries and citations directly to your workspace.", icon: "description", status: "disconnected" },
    { id: "drive", name: "Google Drive", desc: "Watch folders for new papers and sync PDFs.", icon: "cloud", status: "disconnected" },
    { id: "overleaf", name: "Overleaf", desc: "Directly push BibTeX and citations to your projects.", icon: "article", status: "connected" },
  ];

  return (
    <AppShell active="integrations" breadcrumbs={[{ label: "Integrations" }]}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Integrations</h1>
          <p className="text-on-surface-variant">Connect Aid to your existing research tools and workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map(int => (
            <div key={int.id} className="bg-white border border-border-subtle rounded-2xl p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon name={int.icon} size={24} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${int.status === "connected" ? "bg-green-100 text-green-700" : "bg-surface-container text-on-surface-variant"}`}>
                  {int.status}
                </span>
              </div>
              <h3 className="font-bold mb-1">{int.name}</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">{int.desc}</p>
              <button className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${int.status === "connected" ? "border border-border-subtle hover:bg-surface-container-low" : "bg-primary text-on-primary hover:opacity-90"}`}>
                {int.status === "connected" ? "Configure" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export { DashboardPage, LibraryPage, DocViewerPage, WorkspacesPage, WorkspaceDetailPage, IntegrationsPage };
