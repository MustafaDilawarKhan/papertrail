// Dashboard, Library, Document Viewer, Workspaces pages
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, Icon, Brand, Sidebar, TopNav, AppShell, CommandPalette, EmptyState, Modal, navigate, useRoute } from '../shared/components';
import { DocTabBar, useDocTabs } from '../shared/docTabs';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../apiConfig';

const useStateP1 = useState;
const useEffectP1 = useEffect;
const useRefP1 = useRef;
const useMemoP1 = useMemo;

// Module-level cache for documents so switching tabs is instant.
// Keyed by documentId. Survives the lifetime of the app instance.
const docCache = new Map(); // id -> { documentData, viewUrl, textContent }
const BOOTSTRAP_MAX_AGE_SECONDS = 60;

function readBootstrapCache() {
  try {
    const raw = sessionStorage.getItem("aid_bootstrap");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getFreshBootstrapCache(maxAgeSeconds = BOOTSTRAP_MAX_AGE_SECONDS) {
  const cached = readBootstrapCache();
  if (!cached) return null;

  const fetchedAt = Number(cached.fetched_at || 0);
  if (!fetchedAt) return null;

  const ageSeconds = Math.floor(Date.now() / 1000) - fetchedAt;
  if (ageSeconds > maxAgeSeconds) return null;

  return cached;
}

function writeBootstrapCache(patch) {
  try {
    const current = readBootstrapCache() || {};
    const next = {
      ...current,
      ...patch,
      fetched_at: Math.floor(Date.now() / 1000),
    };
    sessionStorage.setItem("aid_bootstrap", JSON.stringify(next));
  } catch {
    // Ignore storage errors and keep UI functional.
  }
}

function formatFileSize(bytes) {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes >= 10 * 1024 ? 0 : 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString();
}

function getCollectionDocumentCount(collectionId, documents) {
  return documents.filter(document => document.collection_id === collectionId).length;
}

// =================== DASHBOARD ===================
function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  const [search, setSearch] = useStateP1(false);
  const [recentDocuments, setRecentDocuments] = useStateP1([]);
  const [recentCollections, setRecentCollections] = useStateP1([]);
  const [loading, setLoading] = useStateP1(true);
  const [error, setError] = useStateP1("");
  const activity = [
    { icon: "edit_note", text: <><b>You</b> annotated "Neural Networks…"</>, time: "2 hours ago" },
    { icon: "upload_file", text: <><b>You</b> uploaded "Ethics in AI…"</>, time: "5 hours ago" },
    { icon: "chat_bubble", text: <>Summarized <b>ML Research</b> collection</>, time: "Yesterday" },
    { icon: "bookmark", text: <>Cited <b>Arxiv:2301.04</b> in Thesis</>, time: "3 days ago" },
  ];

  useEffectP1(() => {
    let active = true;

    const loadDashboard = async () => {
      const bootstrap = getFreshBootstrapCache();
      const hasBootstrap = Boolean(bootstrap);

      try {
        setError("");

        if (hasBootstrap && active) {
          setRecentDocuments(Array.isArray(bootstrap.documents) ? bootstrap.documents : []);
          setRecentCollections(Array.isArray(bootstrap.collections) ? bootstrap.collections : []);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const [documentsData, collectionsData] = await Promise.all([
          apiRequest("/documents"),
          apiRequest("/collections"),
        ]);

        if (!active) return;
        const docs = Array.isArray(documentsData) ? documentsData : [];
        const cols = Array.isArray(collectionsData) ? collectionsData : [];
        setRecentDocuments(docs);
        setRecentCollections(cols);
        writeBootstrapCache({ documents: docs, collections: cols });
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const docs = recentDocuments.slice(0, 4);
  const cols = recentCollections.slice(0, 3);

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
              <Link to="/write" className="flex items-center gap-2 border border-border-subtle bg-white text-primary px-5 py-2.5 rounded-full font-bold text-sm hover:bg-surface-container-low transition-all">
                <Icon name="edit_square" size={20} /> Write paper
              </Link>
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
          {error && <div className="mt-4 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-xs text-on-error-container">{error}</div>}
          {loading && <div className="mt-4 text-xs text-on-surface-variant">Loading your documents and collections...</div>}
        </section>

        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12 lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-card-title text-card-title text-primary">Recent Documents</h3>
              <Link to="/library" className="text-xs font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.length === 0 && !loading ? (
                <div className="md:col-span-2">
                  <EmptyState icon="description" title="No documents yet" text="Upload a file to populate your recent documents list." action={<Link to="/upload" className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold">Upload doc</Link>} />
                </div>
              ) : docs.map((d, i) => (
                <Link key={d.document_id || i} to={`/library/doc/${d.document_id}`} className="bg-white border border-border-subtle p-4 rounded-xl hover:shadow-md transition-shadow group cursor-pointer block">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${d.file_type === "PDF" ? "bg-accent-source-highlight" : d.file_type === "DOCX" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high"}`}>{d.file_type}</span>
                    <Icon name="more_vert" className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-card-title text-card-title mb-1 truncate pr-4">{d.filename}</h4>
                  <p className="text-xs text-on-surface-variant">Modified {formatRelativeTime(d.updated_at || d.upload_date)} • {formatFileSize(d.file_size)}</p>
                </Link>
              ))}
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-card-title text-card-title text-primary">Recent Collections</h3>
                <Link to="/library" className="text-xs font-bold text-primary hover:underline">Manage</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {cols.length === 0 && !loading ? (
                  <div className="sm:col-span-3">
                    <EmptyState icon="folder" title="No collections yet" text="Create a collection in Library to organize your documents." action={<Link to="/library" className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold">Open Library</Link>} />
                  </div>
                ) : cols.map((c, i) => (
                  <Link key={c.collection_id || i} to={`/library?collection_id=${c.collection_id}`} className="bg-white p-5 rounded-2xl border border-border-subtle hover:border-primary transition-colors cursor-pointer group block">
                    <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon name="folder" />
                    </div>
                    <h4 className="font-bold text-sm mb-1">{c.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">{getCollectionDocumentCount(c.collection_id, recentDocuments)} Documents</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-card-title text-card-title text-primary">Your Workspaces</h3>
                <Link to="/workspaces" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>
              <Link to="/workspaces" className="block bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 hover:border-primary/40 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-primary mb-1">Create a new workspace</h4>
                    <p className="text-xs text-on-surface-variant">Set up a collaborative research environment with your team.</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="add" className="text-primary" />
                  </div>
                </div>
              </Link>
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
  const route = useRoute();
  const query = useMemoP1(() => new URLSearchParams(route.includes("?") ? route.split("?")[1] : ""), [route]);
  const selectedCollectionId = query.get("collection_id");
  const [documents, setDocuments] = useStateP1([]);
  const [collections, setCollections] = useStateP1([]);
  const [loading, setLoading] = useStateP1(true);
  const [error, setError] = useStateP1("");
  const [newCollectionName, setNewCollectionName] = useStateP1("");
  const [creatingCollection, setCreatingCollection] = useStateP1(false);

  useEffectP1(() => {
    let active = true;

    const loadLibrary = async () => {
      const bootstrap = getFreshBootstrapCache();
      const hasBootstrap = Boolean(bootstrap);

      try {
        setError("");

        if (hasBootstrap && active) {
          setDocuments(Array.isArray(bootstrap.documents) ? bootstrap.documents : []);
          setCollections(Array.isArray(bootstrap.collections) ? bootstrap.collections : []);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const [documentsData, collectionsData] = await Promise.all([
          apiRequest("/documents"),
          apiRequest("/collections"),
        ]);

        if (!active) return;
        const docs = Array.isArray(documentsData) ? documentsData : [];
        const cols = Array.isArray(collectionsData) ? collectionsData : [];
        setDocuments(docs);
        setCollections(cols);
        writeBootstrapCache({ documents: docs, collections: cols });
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadLibrary();
    return () => {
      active = false;
    };
  }, []);

  const createCollection = async (e) => {
    e.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;

    try {
      setCreatingCollection(true);
      setError("");
      const created = await apiRequest("/collections", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setCollections(prev => [created, ...prev]);
      setNewCollectionName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingCollection(false);
    }
  };

  const collectionFilteredDocuments = selectedCollectionId
    ? documents.filter(document => String(document.collection_id) === selectedCollectionId)
    : documents;
  const rows = filter === "all"
    ? collectionFilteredDocuments
    : collectionFilteredDocuments.filter(document => document.file_type === filter);
  const selectedCollection = collections.find(collection => String(collection.collection_id) === selectedCollectionId);

  return (
    <>
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <AppShell active="library" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Library" }]} onSearchOpen={() => setSearch(true)}>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-section-heading text-section-heading text-primary mb-2">Research Library</h1>
            <p className="text-on-surface-variant text-body-main">Manage your academic sources and cross-reference documents.</p>
            {selectedCollection && <p className="text-xs text-primary mt-2">Filtering collection: <span className="font-bold">{selectedCollection.name}</span></p>}
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
              {["all", "PDF", "DOCX", "TXT"].map(f => (
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

        <div className="mb-8 bg-white border border-border-subtle rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-card-title text-card-title text-primary mb-1">Collections</h3>
              <p className="text-xs text-on-surface-variant">Create and organize your live database collections.</p>
            </div>
            <form onSubmit={createCollection} className="flex items-center gap-2 flex-wrap">
              <input value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} placeholder="New collection name" className="w-64 max-w-full border border-border-subtle rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              <button type="submit" disabled={creatingCollection} className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">{creatingCollection ? "Creating..." : "Create collection"}</button>
            </form>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.length === 0 && !loading ? (
              <div className="sm:col-span-3 text-sm text-on-surface-variant">No collections yet. Create one to start organizing documents.</div>
            ) : collections.map(collection => {
              const isActive = String(collection.collection_id) === selectedCollectionId;
              return (
                <Link key={collection.collection_id} to={`/library?collection_id=${collection.collection_id}`} className={`bg-surface-container-lowest p-4 rounded-xl border transition-colors block ${isActive ? "border-primary shadow-sm" : "border-border-subtle hover:border-primary"}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-border-subtle flex items-center justify-center text-primary">
                      <Icon name="folder" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">{getCollectionDocumentCount(collection.collection_id, documents)} docs</span>
                  </div>
                  <h4 className="font-bold text-sm mb-1 truncate">{collection.name}</h4>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">{collection.description || "No description yet."}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-error/20 bg-error-container px-4 py-3 text-xs text-on-error-container">{error}</div>}
        {loading && <div className="mb-6 text-xs text-on-surface-variant">Loading your library...</div>}

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
                  <tr key={r.document_id || i} className="group hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/library/doc/${r.document_id}`)}>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-8 h-10 bg-surface-container-highest rounded border border-border-subtle flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-on-surface-variant">{r.file_type}</span>
                        </div>
                        <div>
                          <p className="font-card-title text-primary">{r.filename}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-source-highlight">{r.processing_status}</span>
                            {r.collection_id && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">Collection</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-body-main text-on-surface-variant">{String(r.user_id).slice(0, 8)}</td>
                    <td className="px-6 py-5 text-body-main text-on-surface-variant whitespace-nowrap">{formatRelativeTime(r.upload_date)}</td>
                    <td className="px-6 py-5">
                      {r.processing_status === "ready" ? <Icon name="check_circle" filled className="text-green-600" /> : <Icon name="schedule" className="text-on-surface-variant/40" />}
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
            {rows.length === 0 && <EmptyState icon="search_off" title="No documents" text="Upload a file or create a collection to start building your library." action={<Link to="/upload" className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold">Upload</Link>} />}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r, i) => (
              <Link key={r.document_id || i} to={`/library/doc/${r.document_id}`} className="bg-white border border-border-subtle p-5 rounded-xl hover:shadow-md transition-shadow block">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-accent-source-highlight">{r.file_type}</span>
                  {r.processing_status === "ready" && <Icon name="check_circle" filled size={14} className="text-green-600" />}
                </div>
                <h4 className="font-card-title text-card-title mb-2 line-clamp-2">{r.filename}</h4>
                <p className="text-[11px] text-on-surface-variant mb-3">{formatFileSize(r.file_size)} • {r.processing_status}</p>
                <p className="text-[10px] text-on-surface-variant">{formatRelativeTime(r.upload_date)}</p>
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
  const documentId = params?.[1] || "";
  const cached = documentId ? docCache.get(documentId) : null;
  const [length, setLength] = useStateP1("Med");
  const [loadingDocument, setLoadingDocument] = useStateP1(!cached);
  const [viewerError, setViewerError] = useStateP1("");
  const [documentData, setDocumentData] = useStateP1(cached?.documentData || null);
  const [viewUrl, setViewUrl] = useStateP1(cached?.viewUrl || "");
  const [textContent, setTextContent] = useStateP1(cached?.textContent || "");
  const [messages, setMessages] = useStateP1([
    { role: "user", text: "What is RAG architecture?", time: "10:42 AM" },
    {
      role: "ai",
      time: "10:42 AM",
      blocks: [
        { type: "text", text: "Retrieval-Augmented Generation (RAG) is an architectural pattern used to provide LLMs with contextually relevant, external data." },
        { type: "text", text: "It works by first retrieving relevant documents from a knowledge base and then using that information to ground the AI's final generation." },
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
      ],
    },
  ]);
  const [draft, setDraft] = useStateP1("");
  const [contextOpen, setContextOpen] = useStateP1(false);
  const [context, setContext] = useStateP1("Current Document");

  const { tabs, openTab, closeTab, reorderTab } = useDocTabs(documentId);

  useEffectP1(() => {
    let active = true;

    if (!documentId) {
      setViewerError("No document selected.");
      setLoadingDocument(false);
      return;
    }

    // Cache hit: hydrate instantly, no spinner.
    const hit = docCache.get(documentId);
    if (hit) {
      setViewerError("");
      setDocumentData(hit.documentData);
      setViewUrl(hit.viewUrl);
      setTextContent(hit.textContent || "");
      setLoadingDocument(false);
      return;
    }

    // Cache miss: fetch.
    setViewerError("");
    setLoadingDocument(true);
    setDocumentData(null);
    setViewUrl("");
    setTextContent("");

    (async () => {
      try {
        const [doc, view] = await Promise.all([
          apiRequest(`/documents/${documentId}`),
          apiRequest(`/documents/${documentId}/view-url`),
        ]);
        if (!active) return;
        const next = { documentData: doc, viewUrl: view?.view_url || "", textContent: "" };
        docCache.set(documentId, next);
        setDocumentData(next.documentData);
        setViewUrl(next.viewUrl);
      } catch (err) {
        if (active) setViewerError(err.message);
      } finally {
        if (active) setLoadingDocument(false);
      }
    })();

    return () => { active = false; };
  }, [documentId]);

  useEffectP1(() => {
    let active = true;

    const loadText = async () => {
      if (!viewUrl || documentData?.file_type !== "TXT") {
        setTextContent("");
        return;
      }
      // Cache hit?
      const hit = docCache.get(documentId);
      if (hit?.textContent) { setTextContent(hit.textContent); return; }

      try {
        const response = await fetch(viewUrl);
        const text = await response.text();
        if (active) {
          setTextContent(text);
          if (hit) docCache.set(documentId, { ...hit, textContent: text });
        }
      } catch {
        if (active) setTextContent("");
      }
    };

    loadText();
    return () => {
      active = false;
    };
  }, [viewUrl, documentData?.file_type]);

  const docName = documentData?.filename || "Document";

  // Register this document as an open tab as soon as we know its name + type.
  useEffectP1(() => {
    if (!documentId || !documentData) return;
    openTab({ id: documentId, name: documentData.filename || 'Document', type: documentData.file_type || 'DOC' });
  }, [documentId, documentData, openTab]);

  const send = () => {
    if (!draft.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(m => [...m, { role: "user", text: draft, time }]);
    setDraft("");
    setTimeout(() => {
      setMessages(m => [...m, {
        role: "ai", time, blocks: [
          { type: "text", text: "Based on your uploaded file, the model can now cite and reason over the real document content instead of demo text." },
        ],
      }]);
    }, 800);
  };

  const handleDownload = () => {
    if (!viewUrl) return;
    window.open(viewUrl, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.alert("Document link copied.");
    } catch {
      window.alert("Could not copy link.");
    }
  };

  const renderDocumentPane = () => {
    if (loadingDocument) {
      return <div className="w-full max-w-3xl bg-white shadow-sm rounded-xl min-h-[500px] flex items-center justify-center text-sm text-on-surface-variant">Loading document...</div>;
    }

    if (viewerError) {
      return <div className="w-full max-w-3xl bg-error-container border border-error/20 rounded-xl min-h-[300px] p-6 text-sm text-on-error-container">{viewerError}</div>;
    }

    if (!documentData || !viewUrl) {
      return <div className="w-full max-w-3xl bg-white shadow-sm rounded-xl min-h-[300px] p-6 text-sm text-on-surface-variant">Document URL is not available.</div>;
    }

    if (documentData.file_type === "PDF") {
      return (
        <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl overflow-hidden border border-border-subtle">
          <iframe title={docName} src={`${viewUrl}#toolbar=1&navpanes=0`} className="w-full h-[78vh]" />
        </div>
      );
    }

    if (documentData.file_type === "TXT") {
      return (
        <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle p-6">
          <h3 className="font-card-title text-card-title mb-3">{docName}</h3>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-on-surface">{textContent || "Loading text content..."}</pre>
        </div>
      );
    }

    if (documentData.file_type === "DOCX") {
      const officePreviewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewUrl)}`;
      return (
        <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl overflow-hidden border border-border-subtle">
          <iframe title={`${docName} preview`} src={officePreviewUrl} className="w-full h-[78vh]" />
        </div>
      );
    }

    return (
      <div className="w-full max-w-3xl bg-white shadow-sm rounded-xl border border-border-subtle p-6">
        <h3 className="font-card-title text-card-title mb-2">Preview not supported for {documentData.file_type}</h3>
        <p className="text-sm text-on-surface-variant mb-4">Use download to open the original file.</p>
        <button onClick={handleDownload} className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">
          <Icon name="download" size={16} /> Download file
        </button>
      </div>
    );
  };

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
          <button onClick={handleDownload} disabled={!viewUrl} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low disabled:opacity-50">
            <Icon name="download" size={16} /> Download
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low">
            <Icon name="ios_share" size={16} /> Share
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-container-low">
            <Icon name="format_quote" size={16} /> Cite
          </button>
        </div>
      </header>

      <div className="ml-sidebar-width pt-16 fixed top-0 right-0 left-0 z-20" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <DocTabBar
            activeId={documentId}
            tabs={tabs}
            onClose={closeTab}
            onReorder={reorderTab}
          />
        </div>
      </div>

      <main className="ml-sidebar-width h-screen flex" style={{ paddingTop: 64 + (tabs.length ? 44 : 0) }}>
        {/* PDF pane */}
        <section className="flex-1 bg-surface-container-low overflow-y-auto p-8 flex flex-col items-center">
          <div className="sticky top-0 mb-8 bg-white/90 backdrop-blur-md border border-border-subtle px-3 py-2 rounded-xl flex items-center gap-4 z-10 shadow-sm">
            <div className="flex items-center gap-2 border-r border-border-subtle pr-3 text-xs">
              <Icon name="description" size={16} className="text-on-surface-variant" />
              <span className="font-semibold">{documentData?.file_type || "DOC"}</span>
            </div>
            <span className="text-xs text-on-surface-variant">{documentData ? `Uploaded ${formatRelativeTime(documentData.upload_date)}` : "Preparing viewer"}</span>
          </div>

          {renderDocumentPane()}
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
                  {[docName, "Entire Collection", "Workspace"].map(c => (
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
                    {m.blocks.map((b, j) => <span key={j}>{b.text}</span>)}
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
  const [createMode, setCreateMode] = useStateP1(false);
  const [formData, setFormData] = useStateP1({ name: "", description: "", privacy: "private" });
  const [formError, setFormError] = useStateP1("");
  const [formLoading, setFormLoading] = useStateP1(false);

  useEffectP1(() => {
    let active = true;

    const loadWorkspaces = async () => {
      const bootstrap = getFreshBootstrapCache();
      const hasBootstrap = Boolean(bootstrap);

      try {
        setError("");

        if (hasBootstrap && active) {
          setCards(Array.isArray(bootstrap.workspaces) ? bootstrap.workspaces : []);
          setLoading(false);
        } else {
          setLoading(true);
        }

        const data = await apiRequest("/workspaces");
        if (!active) return;
        const workspaces = Array.isArray(data) ? data : [];
        setCards(workspaces);
        writeBootstrapCache({ workspaces });
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadWorkspaces();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Workspace name is required");
      return;
    }

    try {
      setFormError("");
      setFormLoading(true);
      const created = await apiRequest("/workspaces", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          privacy: formData.privacy,
        }),
      });
      setCards(prev => [created, ...prev]);
      setCreateMode(false);
      setFormData({ name: "", description: "", privacy: "private" });
      navigate(`/workspaces/${created.workspace_id}`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setCreateMode(false);
    setFormData({ name: "", description: "", privacy: "private" });
    setFormError("");
  };

  if (createMode) {
    return (
      <>
        <CommandPalette open={search} onClose={() => setSearch(false)} />
        <AppShell active="workspaces" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Workspaces", to: "/workspaces" }, { label: "Create New" }]} onSearchOpen={() => setSearch(true)}>
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="font-section-heading text-section-heading text-primary mb-2">Create New Workspace</h1>
              <p className="text-on-surface-variant">Set up a collaborative research environment with your team.</p>
            </div>
          </div>

          <div className="max-w-2xl bg-white border border-border-subtle rounded-2xl p-8">
            <form onSubmit={handleCreateWorkspace} className="space-y-6">
              {formError && (
                <div className="p-4 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Workspace Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-on-surface mb-2">Workspace Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., AI Ethics Research"
                  className="w-full px-4 py-3 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  disabled={formLoading}
                />
                <p className="text-[11px] text-on-surface-variant mt-1">Give your workspace a clear, descriptive name.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-on-surface mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional: Describe the purpose and scope of this workspace..."
                  rows="4"
                  className="w-full px-4 py-3 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  disabled={formLoading}
                />
                <p className="text-[11px] text-on-surface-variant mt-1">Max 500 characters. Helps team members understand the workspace purpose.</p>
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-on-surface mb-3">Privacy Level</label>
                <div className="space-y-2">
                  {[
                    { value: "private", label: "Private", desc: "Only you and invited members can access" },
                    { value: "team", label: "Team", desc: "All team members have automatic access" },
                    { value: "public", label: "Public", desc: "Anyone with link can view (read-only)" },
                  ].map(option => (
                    <label key={option.value} className="flex items-center p-3 border border-border-subtle rounded-lg cursor-pointer hover:bg-surface-container-lowest transition-colors" style={{ backgroundColor: formData.privacy === option.value ? "rgba(var(--color-primary), 0.05)" : "transparent", borderColor: formData.privacy === option.value ? "var(--color-primary)" : undefined }}>
                      <input
                        type="radio"
                        name="privacy"
                        value={option.value}
                        checked={formData.privacy === option.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value }))}
                        className="w-4 h-4"
                        disabled={formLoading}
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-bold text-on-surface">{option.label}</p>
                        <p className="text-[11px] text-on-surface-variant">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-border-subtle">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-5 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {formLoading ? "Creating..." : "Create Workspace"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={formLoading}
                  className="flex-1 px-5 py-3 border border-border-subtle rounded-lg font-bold text-sm hover:bg-surface-container-low disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </AppShell>
      </>
    );
  }

  return (
    <>
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <AppShell active="workspaces" breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Workspaces" }]} onSearchOpen={() => setSearch(true)}>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="font-section-heading text-section-heading text-primary mb-2">Your Workspaces</h1>
            <p className="text-on-surface-variant">Manage your collaborative research projects.</p>
          </div>
          <button onClick={() => setCreateMode(true)} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-bold text-sm hover:opacity-90">
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
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center text-white mb-3">
                    <Icon name="auto_stories" filled />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-surface-container-high text-on-surface-variant">{c.privacy}</span>
                </div>
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(3, c.members?.length || 0) }).map((_, j) => (
                    <div key={j} className="w-7 h-7 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[9px] font-bold">U{j+1}</div>
                  ))}
                  {(c.members?.length || 0) > 3 && <div className="w-7 h-7 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-[9px] font-bold">+{(c.members?.length || 0)-3}</div>}
                </div>
              </div>
              <h3 className="font-card-title text-card-title mb-2">{c.name}</h3>
              <p className="text-[12px] text-on-surface-variant mb-4 leading-relaxed line-clamp-2">{c.description || "No description yet."}</p>
              <div className="flex items-center gap-4 text-[11px] text-on-secondary-container font-medium">
                <span className="flex items-center gap-1"><Icon name="description" size={14} /> Files</span>
                <span className="flex items-center gap-1"><Icon name="group" size={14} /> {c.members?.length || 0} Members</span>
              </div>
            </div>
          ))}
          <button onClick={() => setCreateMode(true)} className="border-2 border-dashed border-border-subtle p-6 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary hover:bg-surface-container-low transition-all min-h-[220px]">
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

  // Invite modal state (replaces simple prompt)
  const [inviteModalOpen, setInviteModalOpen] = useStateP1(false);
  const [inviteEmail, setInviteEmail] = useStateP1("");
  const [inviteRole, setInviteRole] = useStateP1("Viewer");
  const [inviteError, setInviteError] = useStateP1("");
  const [inviteSuggestions, setInviteSuggestions] = useStateP1([]);

  const [openDocMenuId, setOpenDocMenuId] = useStateP1(null);
  const [settingsModalOpen, setSettingsModalOpen] = useStateP1(false);
  const [settingsForm, setSettingsForm] = useStateP1({ name: "", description: "", privacy: "private" });
  const [settingsLoading, setSettingsLoading] = useStateP1(false);
  const [settingsError, setSettingsError] = useStateP1("");

  const handleInviteSubmit = async (e) => {
    e?.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError("Email is required");
      return;
    }
    try {
      setInviteLoading(true);
      setInviteError("");
      await apiRequest(`/workspaces/${workspaceId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setMessage(`Invited ${inviteEmail.trim()}`);
      setInviteModalOpen(false);
      setInviteEmail("");
      await loadWorkspace();
    } catch (err) {
      setInviteError(err.message || String(err));
    } finally {
      setInviteLoading(false);
    }
  };

  // Fetch user suggestions for invite autocomplete
  useEffectP1(() => {
    let active = true;
    if (!inviteModalOpen) return;
    const controller = new AbortController();

    const loadSuggestions = async () => {
      if (!inviteEmail || inviteEmail.length < 2) {
        if (active) setInviteSuggestions([]);
        return;
      }
      try {
        const q = encodeURIComponent(inviteEmail.trim());
        const data = await apiRequest(`/users?q=${q}&limit=8`, { signal: controller.signal });
        if (!active) return;
        setInviteSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        // ignore network errors for suggestions
        setInviteSuggestions([]);
      }
    };

    const t = setTimeout(loadSuggestions, 200);
    return () => { active = false; controller.abort(); clearTimeout(t); };
  }, [inviteEmail, inviteModalOpen]);

  const handleViewDocument = async (documentId) => {
    try {
      const res = await apiRequest(`/documents/${documentId}/view-url`);
      if (res?.view_url) {
        window.open(res.view_url, "_blank");
      } else {
        setMessage("Could not open document preview.");
      }
    } catch (err) {
      setMessage(err.message || String(err));
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    try {
      await apiRequest(`/documents/${documentId}`, { method: "DELETE" });
      setMessage("Document deleted");
      await loadWorkspace();
    } catch (err) {
      setMessage(err.message || String(err));
    }
  };

  const openSettingsForWorkspace = () => {
    setSettingsForm({ name: workspace?.name || "", description: workspace?.description || "", privacy: workspace?.privacy || "private" });
    setSettingsError("");
    setSettingsModalOpen(true);
  };

  const handleSettingsSubmit = async (e) => {
    e?.preventDefault();
    try {
      setSettingsLoading(true);
      setSettingsError("");
      const body = {
        name: settingsForm.name,
        description: settingsForm.description,
        privacy: settingsForm.privacy,
      };
      const res = await apiRequest(`/workspaces/${workspaceId}`, { method: "PATCH", body: JSON.stringify(body) });
      setMessage("Workspace updated");
      setSettingsModalOpen(false);
      await loadWorkspace();
    } catch (err) {
      setSettingsError(err.message || String(err));
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm("Delete this workspace and all its data? This cannot be undone.")) return;
    try {
      await apiRequest(`/workspaces/${workspaceId}`, { method: "DELETE" });
      setMessage("Workspace deleted");
      navigate("/workspaces");
    } catch (err) {
      setMessage(err.message || String(err));
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
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-bold text-xl">{name}</h2>
                  <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-surface-container-high text-on-surface-variant">{workspace?.privacy || "private"}</span>
                </div>
                <p className="text-[12px] text-on-surface-variant mb-2">{workspace?.owner_id === user?.user_id ? "Owner workspace" : "Shared workspace"}</p>
                {workspace?.description && <p className="text-sm text-on-surface max-w-lg">{workspace.description}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setInviteModalOpen(true)} disabled={inviteLoading} className="px-4 py-2 rounded-lg border border-border-subtle text-xs font-semibold hover:bg-surface-container-low flex items-center gap-2 disabled:opacity-50">
                <Icon name="person_add" size={16} /> {inviteLoading ? "Inviting..." : "Invite"}
              </button>
              <button className="px-3 py-2 rounded-lg border border-border-subtle hover:bg-surface-container-low">
                <Icon name="settings" size={16} onClick={() => openSettingsForWorkspace()} />
              </button>
            </div>
            {/* Invite modal */}
            <Modal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite to workspace">
              <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
                {inviteError && <div className="p-3 bg-error-container text-on-error-container rounded">{inviteError}</div>}
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Email</label>
                  <div className="relative">
                    <input autoComplete="off" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full px-3 py-2 border border-border-subtle rounded" placeholder="alice@example.com" />
                    {inviteSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-border-subtle rounded shadow-lg z-50">
                        {inviteSuggestions.map((s) => (
                          <button key={s.user_id} type="button" onClick={() => { setInviteEmail(s.email); setInviteSuggestions([]); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low">{s.email} <span className="text-[11px] text-on-surface-variant"> — {s.name}</span></button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full px-3 py-2 border border-border-subtle rounded">
                    <option value="Viewer">Viewer</option>
                    <option value="Editor">Editor</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setInviteModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button type="submit" disabled={inviteLoading} className="px-4 py-2 rounded-lg bg-primary text-on-primary">{inviteLoading ? "Inviting..." : "Send Invite"}</button>
                </div>
              </form>
            </Modal>

            {/* Settings modal */}
            <Modal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="Workspace settings">
              <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
                {settingsError && <div className="p-3 bg-error-container text-on-error-container rounded">{settingsError}</div>}
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Name</label>
                  <input type="text" value={settingsForm.name} onChange={e => setSettingsForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-border-subtle rounded" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Description</label>
                  <textarea value={settingsForm.description} onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-border-subtle rounded" rows={4} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-2">Privacy</label>
                  <select value={settingsForm.privacy} onChange={e => setSettingsForm(prev => ({ ...prev, privacy: e.target.value }))} className="w-full px-3 py-2 border border-border-subtle rounded">
                    <option value="private">Private</option>
                    <option value="team">Team</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <button type="button" onClick={handleDeleteWorkspace} className="px-3 py-2 rounded-lg text-error border border-error/20">Delete workspace</button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSettingsModalOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                    <button type="submit" disabled={settingsLoading} className="px-4 py-2 rounded-lg bg-primary text-on-primary">{settingsLoading ? "Saving..." : "Save changes"}</button>
                  </div>
                </div>
              </form>
            </Modal>
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
                <div key={i} onClick={() => navigate(`/library/doc/${f.document_id}`)} className="flex items-center justify-between p-4 border border-border-subtle rounded-lg hover:bg-surface-container-low group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-[10px] font-bold">{f.file_type}</div>
                    <div>
                      <p className="text-sm font-bold">{f.filename}</p>
                      <p className="text-[11px] text-on-surface-variant">Uploaded {new Date(f.upload_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setOpenDocMenuId(openDocMenuId === f.document_id ? null : f.document_id); }} className="p-2 rounded hover:bg-surface-container-low">
                      <Icon name="more_vert" className="text-on-surface-variant" />
                    </button>
                    {openDocMenuId === f.document_id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-border-subtle rounded-lg shadow-lg z-50">
                        <button onClick={(e) => { e.stopPropagation(); setOpenDocMenuId(null); handleViewDocument(f.document_id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low">View</button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenDocMenuId(null); (async () => { const name = window.prompt('Rename file', f.filename); if (name && name.trim() && name.trim() !== f.filename) { try { await apiRequest(`/documents/${f.document_id}`, { method: 'PATCH', body: JSON.stringify({ filename: name.trim() }) }); setMessage('Renamed'); await loadWorkspace(); } catch (err) { setMessage(err.message || String(err)); } } })(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low">Rename</button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenDocMenuId(null); handleDeleteDocument(f.document_id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low text-error">Delete</button>
                        <button onClick={(e) => { e.stopPropagation(); setOpenDocMenuId(null); (async () => { try { const res = await apiRequest(`/documents/${f.document_id}/view-url`); if (res?.view_url) { window.open(res.view_url, '_blank'); } else { setMessage('Download not available'); } } catch (err) { setMessage(err.message || String(err)); } })(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low">Download</button>
                      </div>
                    )}
                  </div>
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

