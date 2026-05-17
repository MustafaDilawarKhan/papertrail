// Dashboard, Library, Document Viewer, Workspaces pages
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Document as PdfDocument, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import DOMPurify from 'dompurify';
import { Link, Icon, Brand, Sidebar, TopNav, AppShell, CommandPalette, EmptyState, Modal, UploadModal, navigate, useRoute } from '../shared/components';
import { DocTabBar, useDocTabs } from '../shared/docTabs';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, API_BASE_URL } from '../apiConfig';

// Point pdf.js at the worker bundled with react-pdf. The `?url` suffix lets
// Vite emit a hashed asset URL we can hand to GlobalWorkerOptions without
// shipping the worker source into the main chunk.
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

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
              <Link to="/write/new" className="flex items-center gap-2 border border-border-subtle bg-white text-primary px-5 py-2.5 rounded-full font-bold text-sm hover:bg-surface-container-low transition-all">
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

  // Library document actions — wired into both list and grid views.
  const [openMenuId, setOpenMenuId] = useStateP1(null);
  const closeMenu = () => setOpenMenuId(null);

  const handleRename = async (doc) => {
    closeMenu();
    const name = window.prompt("Rename document", doc.filename);
    if (!name || !name.trim() || name.trim() === doc.filename) return;
    try {
      const updated = await apiRequest(`/documents/${doc.document_id}`, {
        method: "PATCH",
        body: JSON.stringify({ filename: name.trim() }),
      });
      setDocuments(prev => prev.map(d => d.document_id === doc.document_id ? { ...d, filename: updated.filename } : d));
    } catch (err) {
      window.alert(err.message || "Could not rename");
    }
  };

  const handleDelete = async (doc) => {
    closeMenu();
    if (!window.confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return;
    try {
      await apiRequest(`/documents/${doc.document_id}`, { method: "DELETE" });
      setDocuments(prev => prev.filter(d => d.document_id !== doc.document_id));
    } catch (err) {
      window.alert(err.message || "Could not delete");
    }
  };

  const handleDownload = async (doc) => {
    closeMenu();
    try {
      const res = await apiRequest(`/documents/${doc.document_id}/view-url`);
      if (res?.view_url) window.open(res.view_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      window.alert(err.message || "Could not download");
    }
  };

  // Close the open menu when clicking outside.
  useEffectP1(() => {
    if (!openMenuId) return;
    const onDoc = () => closeMenu();
    window.addEventListener("click", onDoc);
    return () => window.removeEventListener("click", onDoc);
  }, [openMenuId]);

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
          // The per-row Actions dropdown is position:absolute and extends
          // *below* its trigger. Any overflow rule on this wrapper would
          // clip it for rows near the bottom of the table. `overflow-x-clip`
          // still clips horizontal table overflow (so the rounded corners
          // stay tidy on narrow screens) but doesn't establish a vertical
          // scroll context — so absolutely-positioned children remain
          // visible above the page.
          <div className="bg-white rounded-xl border border-border-subtle overflow-x-clip">
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
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === r.document_id ? null : r.document_id); }}
                          className="opacity-100 text-on-surface-variant hover:text-primary p-1"
                        >
                          <Icon name="more_horiz" />
                        </button>
                        {openMenuId === r.document_id && (
                          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-1 w-44 bg-white border border-border-subtle rounded-lg shadow-lg z-50 py-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/library/doc/${r.document_id}`); }} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2"><Icon name="open_in_new" size={14} /> Open</button>
                            <button onClick={() => handleDownload(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2"><Icon name="download" size={14} /> Download</button>
                            <button onClick={() => handleRename(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2"><Icon name="edit" size={14} /> Rename</button>
                            <div className="border-t border-border-subtle my-1" />
                            <button onClick={() => handleDelete(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-error-container text-error flex items-center gap-2"><Icon name="delete" size={14} /> Delete</button>
                          </div>
                        )}
                      </div>
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
              <div key={r.document_id || i} className="relative bg-white border border-border-subtle p-5 rounded-xl hover:shadow-md transition-shadow group">
                <Link to={`/library/doc/${r.document_id}`} className="block">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-accent-source-highlight">{r.file_type}</span>
                    {r.processing_status === "ready" && <Icon name="check_circle" filled size={14} className="text-green-600" />}
                  </div>
                  <h4 className="font-card-title text-card-title mb-2 line-clamp-2 pr-8">{r.filename}</h4>
                  <p className="text-[11px] text-on-surface-variant mb-3">{formatFileSize(r.file_size)} • {r.processing_status}</p>
                  <p className="text-[10px] text-on-surface-variant">{formatRelativeTime(r.upload_date)}</p>
                </Link>
                {/* Action menu — positioned above the card link so clicks don't navigate */}
                <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpenMenuId(openMenuId === r.document_id ? null : r.document_id); }}
                    className="p-1.5 rounded-full hover:bg-surface-container-low text-on-surface-variant"
                    title="Actions"
                  >
                    <Icon name="more_vert" size={16} />
                  </button>
                  {openMenuId === r.document_id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-border-subtle rounded-lg shadow-lg z-50 py-1">
                      <button onClick={() => handleDownload(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2"><Icon name="download" size={14} /> Download</button>
                      <button onClick={() => handleRename(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-low flex items-center gap-2"><Icon name="edit" size={14} /> Rename</button>
                      <div className="border-t border-border-subtle my-1" />
                      <button onClick={() => handleDelete(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-error-container text-error flex items-center gap-2"><Icon name="delete" size={14} /> Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AppShell>
    </>
  );
}

// =================== DOCUMENT VIEWER ===================

// PDF viewer with passage-level highlighting.
//
// Renders the full PDF (one <Page> per page) inside a scrollable container.
// When `highlight` changes, finds the matching text span(s) inside the page's
// text layer, applies a yellow background, and scrolls the first match into
// view. This replaces the previous iframe-based viewer that could only
// navigate to page granularity via the `#page=N` URL fragment.
function PdfDocumentView({ docName, fileUrl, highlights, focusNonce }) {
  // First highlight in the array is the "primary" (clicked) one — drives scroll.
  // Subsequent entries are sibling sources marked but not scrolled to.
  const primaryHighlight = Array.isArray(highlights) ? highlights[0] : null;
  const allHighlights = Array.isArray(highlights) ? highlights : [];
  const [numPages, setNumPages] = useStateP1(0);
  const [loadError, setLoadError] = useStateP1("");
  const [pageWidth, setPageWidth] = useStateP1(720);
  const containerRef = useRefP1(null);

  // Track container width so the PDF resizes with the layout. (react-pdf
  // doesn't auto-scale without an explicit width.)
  useEffectP1(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && Math.abs(w - pageWidth) > 8) {
        setPageWidth(Math.min(900, Math.floor(w - 32)));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageWidth]);

  if (loadError) {
    return (
      <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle p-6 text-sm text-on-surface-variant">
        <h3 className="font-card-title text-card-title mb-3 text-on-surface">{docName}</h3>
        <p>Could not load PDF: {loadError}</p>
        {fileUrl && <p className="mt-2"><a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open in a new tab</a></p>}
      </div>
    );
  }

  return (
    // No `overflow-hidden` here — the parent <section> in renderDocumentPane
    // already provides the scroll viewport. Clipping at this level was
    // hiding every page after the first.
    <div ref={containerRef} className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle px-4 py-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3 px-2 sticky top-0 bg-white z-10">
        <h3 className="font-card-title text-card-title">{docName}</h3>
        <div className="flex items-center gap-3">
          {numPages > 0 && <span className="text-[11px] text-on-surface-variant">{numPages} {numPages === 1 ? "page" : "pages"}</span>}
          {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">Open original ↗</a>}
        </div>
      </div>

      <PdfDocument
        file={fileUrl}
        onLoadSuccess={({ numPages }) => { setNumPages(numPages); setLoadError(""); }}
        onLoadError={(err) => setLoadError(err?.message || "unknown error")}
        loading={<div className="py-12 text-center text-sm text-on-surface-variant">Loading PDF…</div>}
        error={<div className="py-12 text-center text-sm text-error">Failed to load PDF.</div>}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNumber => (
          <PdfPageWithHighlight
            key={pageNumber}
            pageNumber={pageNumber}
            width={pageWidth}
            highlights={allHighlights.filter(h => h && h.page === pageNumber)}
            isPrimaryPage={!!primaryHighlight && primaryHighlight.page === pageNumber}
            focusNonce={focusNonce}
          />
        ))}
      </PdfDocument>
    </div>
  );
}

// Render one PDF page. After the text layer is ready, scan it for the cited
// excerpt and highlight the matching spans (also scroll the first into view).
function PdfPageWithHighlight({ pageNumber, width, highlights, isPrimaryPage, focusNonce }) {
  const pageContainerRef = useRefP1(null);
  const list = Array.isArray(highlights) ? highlights : [];

  // Re-apply highlights + scroll if this is the primary page. Pulled out so
  // we can call it BOTH on initial text-layer render AND on every subsequent
  // click (via the focusNonce useEffect below).
  const reapplyHighlight = useCallback(() => {
    const root = pageContainerRef.current;
    if (!root) return;
    const layer = root.querySelector('.react-pdf__Page__textContent');
    if (!layer) return;

    // Clear any previous highlight markers on this page.
    layer.querySelectorAll('.pt-pdf-highlight').forEach(el => {
      el.classList.remove('pt-pdf-highlight');
    });

    if (list.length === 0) return;

    let anyMatched = false;
    list.forEach(h => {
      if (!h?.excerpt) return;
      if (applyExcerptHighlight(layer, h.excerpt)) anyMatched = true;
    });

    if (!isPrimaryPage) return;

    if (anyMatched) {
      const firstMark = layer.querySelector('.pt-pdf-highlight');
      if (firstMark) firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // No match in this page's text — scroll the page header into view as a
      // fallback so the user lands in the right neighbourhood.
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [list, isPrimaryPage]);

  // Fires once when react-pdf finishes rendering the text layer.
  const handleTextLayerSuccess = useCallback(() => {
    reapplyHighlight();
  }, [reapplyHighlight]);

  // Fires every time the user clicks a citation badge (even the same one twice).
  // The text layer is already rendered at this point, so we just re-apply.
  useEffectP1(() => {
    if (list.length === 0) return;
    reapplyHighlight();
  }, [focusNonce, reapplyHighlight, list]);

  return (
    <div ref={pageContainerRef} className="my-4 flex flex-col items-center" data-pdf-page={pageNumber}>
      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
        Page {pageNumber}
      </div>
      <div className="shadow-sm">
        <PdfPage
          pageNumber={pageNumber}
          width={width}
          renderTextLayer
          renderAnnotationLayer={false}
          onRenderTextLayerSuccess={handleTextLayerSuccess}
        />
      </div>
    </div>
  );
}

// Find the excerpt inside a rendered text layer and add the 'pt-pdf-highlight'
// class to every span that contributes to the match. Returns true if a match
// was found.
//
// Implementation: PDF text is split into many small <span>s by pdf.js (one per
// run of glyphs with the same font / position). We concatenate their text
// content in DOM order, find the excerpt in the concatenation, and then mark
// every span whose range overlaps the match.
function applyExcerptHighlight(textLayer, rawExcerpt) {
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, ' ').trim();
  const target = norm(rawExcerpt);
  if (target.length < 6) return false;

  const spans = Array.from(textLayer.querySelectorAll('span'));
  if (spans.length === 0) return false;

  // Build a normalised concatenation with a position map back to span index.
  let concat = "";
  const positions = []; // positions[i] = { span, start, end } in concat
  for (const span of spans) {
    const piece = norm(span.textContent);
    if (!piece) continue;
    positions.push({ span, start: concat.length, end: concat.length + piece.length });
    concat += piece + " ";
  }

  let idx = concat.indexOf(target);
  if (idx === -1) {
    // Tolerant fallback: try the first 60 chars only — model excerpts often
    // include trailing punctuation that doesn't match the PDF exactly.
    if (target.length > 60) {
      idx = concat.indexOf(target.slice(0, 60));
    }
    if (idx === -1) return false;
  }

  const matchEnd = idx + Math.min(target.length, 60);
  for (const p of positions) {
    if (p.end > idx && p.start < matchEnd) {
      p.span.classList.add('pt-pdf-highlight');
    }
  }
  return true;
}

// Renders a DOCX as rich HTML (server-side conversion via mammoth) and
// applies excerpt highlighting by walking the rendered text nodes.
//
// Highlighting strategy:
//   1. Sanitise the HTML with DOMPurify (mammoth output is already safe but
//      we belt-and-braces — never trust HTML you inject with innerHTML).
//   2. After the HTML is in the DOM, walk text nodes via TreeWalker.
//   3. Locate the excerpt using the same 4-tier matcher as the plain-text path
//      (exact → 60-char prefix → 3+-word run → 20-40 char window), operating
//      on the concatenation of all text-node content.
//   4. Split the matching text node(s), wrap the matched range in a <mark>,
//      and scroll the first <mark> into view.
function DocxHtmlView({ docName, html, fallbackUrl, highlights, focusNonce }) {
  const containerRef = useRefP1(null);

  // Sanitise once per html change.
  const safeHtml = useMemoP1(() => sanitiseDocxHtml(html || ""), [html]);

  // Re-apply highlights + scroll to the primary. Runs whenever `highlights`
  // or `focusNonce` change.
  const reapply = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    clearDomHighlights(root);
    const list = Array.isArray(highlights) ? highlights : [];
    if (list.length === 0) return;

    // Mark every cited passage. The first one is the "primary" (latest click)
    // and gets a marker class we use to scroll it into view.
    list.forEach((src, i) => {
      if (!src?.excerpt) return;
      applyHtmlHighlight(root, src.excerpt, i === 0);
    });

    const primary = root.querySelector('.pt-html-highlight.pt-html-primary')
                 || root.querySelector('.pt-html-highlight');
    if (primary) primary.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlights]);

  useEffectP1(() => {
    // Defer one tick so React has painted the new HTML before we walk it.
    const t = setTimeout(reapply, 30);
    return () => clearTimeout(t);
  }, [reapply, safeHtml, focusNonce]);

  if (!html) {
    return (
      <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle p-6 text-sm text-on-surface-variant">
        <h3 className="font-card-title text-card-title mb-3 text-on-surface">{docName}</h3>
        <p>Rendering DOCX… (first open of a legacy upload can take a moment.)</p>
        {fallbackUrl && <p className="mt-3"><a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open original ↗</a></p>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle px-10 py-8">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-5 sticky top-0 bg-white z-10">
        <h3 className="font-card-title text-card-title">{docName}</h3>
        {fallbackUrl && <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">Open original ↗</a>}
      </div>
      <article
        ref={containerRef}
        className="pt-docx-html prose prose-sm max-w-none text-on-surface"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </div>
  );
}

// Sanitise mammoth-produced HTML. Mammoth's output is already free of scripts
// and event handlers, but we run DOMPurify anyway so any future change in
// the conversion pipeline can't surprise us. Allows tables + images.
function sanitiseDocxHtml(rawHtml) {
  if (!rawHtml) return "";
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'colspan', 'rowspan', 'id'],
  });
}

// Remove any previous <mark class="pt-html-highlight"> elements, restoring the
// original text-node structure as much as possible.
function clearDomHighlights(root) {
  const marks = root.querySelectorAll('mark.pt-html-highlight');
  for (const m of marks) {
    const parent = m.parentNode;
    if (!parent) continue;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize(); // merge adjacent text nodes
  }
}

// Walk the text nodes of `root`, concatenate their content into a single
// string with a position map, locate the excerpt (with the same fuzzy
// fallbacks as the plain-text path), then wrap the matched range in <mark>.
// Returns true if a match was found and wrapped.
//
// `isPrimary` adds an extra class on the wrapped <mark> so the caller can
// distinguish the "click target" from sibling-source marks (e.g. for scroll).
function applyHtmlHighlight(root, rawExcerpt, isPrimary) {
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ");
  const target = norm(rawExcerpt).trim();
  if (target.length < 6) return false;

  // 1. Walk text nodes, building a flat string + position map.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes = []; // { node, start, end } in normalised concatenated string
  let concat = "";
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const piece = norm(node.nodeValue || "");
    if (!piece.trim()) continue;
    nodes.push({ node, start: concat.length, end: concat.length + piece.length });
    concat += piece + " ";
  }
  if (!concat) return false;

  // 2. Locate excerpt (4-tier fallback matching the plain-text matcher).
  const locate = (needle) => {
    let idx = concat.indexOf(needle);
    if (idx !== -1) return { start: idx, end: idx + needle.length };
    if (needle.length > 60) {
      idx = concat.indexOf(needle.slice(0, 60));
      if (idx !== -1) return { start: idx, end: idx + 60 };
    }
    const words = needle.split(' ').filter(w => w.length >= 3);
    for (let len = words.length; len >= 3; len--) {
      for (let i = 0; i + len <= words.length; i++) {
        const phrase = words.slice(i, i + len).join(' ');
        if (phrase.length < 15) continue;
        const at = concat.indexOf(phrase);
        if (at !== -1) return { start: at, end: at + phrase.length };
      }
    }
    for (let len = 40; len >= 20; len -= 5) {
      if (needle.length < len) continue;
      for (let i = 0; i + len <= needle.length; i++) {
        const window = needle.slice(i, i + len);
        const at = concat.indexOf(window);
        if (at !== -1) return { start: at, end: at + len };
      }
    }
    return null;
  };
  const span = locate(target);
  if (!span) return false;

  // 3. Convert (start, end) in `concat` back to per-node ranges, wrapping the
  //    overlapping portion of each node in a fresh <mark>.
  //
  // The match span can cross many text nodes, so for each node we figure out
  // the longest contiguous chunk of its ORIGINAL text that corresponds to the
  // overlap. We don't cap to 40 chars any more — that was a holdover from the
  // PDF text layer (where spans are tiny) and was throwing away most of the
  // highlight on DOCX/HTML where a single text node can contain a whole
  // sentence.
  for (const item of nodes) {
    if (item.end <= span.start || item.start >= span.end) continue;
    const localStart = Math.max(0, span.start - item.start);
    const localEnd = Math.min(item.end - item.start, span.end - item.start);
    if (localEnd <= localStart) continue;

    const original = item.node.nodeValue || "";
    const overlap = concat.slice(item.start + localStart, item.start + localEnd);

    // Try the FULL overlap text first. If the original node has extra
    // whitespace (which the normalised concatenation collapsed), shrink the
    // probe one word at a time until we get a substring match. This means
    // long matches still render as long highlights, and short matches still
    // work — no artificial 40-char ceiling.
    let probe = overlap;
    let at = -1;
    while (probe.length >= 4) {
      at = original.toLowerCase().indexOf(probe);
      if (at !== -1) break;
      const lastSpace = probe.lastIndexOf(' ');
      if (lastSpace <= 0) break;
      probe = probe.slice(0, lastSpace);
    }
    if (at === -1) continue;
    wrapRange(item.node, at, at + probe.length, isPrimary);
  }
  return !!root.querySelector('mark.pt-html-highlight');
}

// Split a text node and wrap the [start, end) substring in <mark>. When
// `isPrimary` is true, the mark gets an extra `.pt-html-primary` class so the
// caller can scroll just that one into view.
function wrapRange(textNode, start, end, isPrimary) {
  const original = textNode.nodeValue || "";
  if (start < 0 || end > original.length || end <= start) return;
  const parent = textNode.parentNode;
  if (!parent) return;
  const before = document.createTextNode(original.slice(0, start));
  const middle = original.slice(start, end);
  const after = document.createTextNode(original.slice(end));
  const mark = document.createElement('mark');
  mark.className = 'pt-html-highlight' + (isPrimary ? ' pt-html-primary' : '');
  mark.appendChild(document.createTextNode(middle));
  parent.insertBefore(before, textNode);
  parent.insertBefore(mark, textNode);
  parent.insertBefore(after, textNode);
  parent.removeChild(textNode);
}

// Renders extracted plain text of a document with a single highlighted excerpt
// (drawn from the active AI source). Splits the text on [Page N] markers
// emitted by the server-side extractor so we can show "PAGE 12 / 28" style
// headers and scroll the matching chunk into view.
function TextDocumentView({ docName, text, highlights, fallbackUrl, isDocx, focusNonce }) {
  const containerRef = useRefP1(null);
  const matchRef = useRefP1(null);
  // For this renderer, only the primary highlight is used (this is the legacy
  // path; the mammoth-rendered DocxHtmlView handles multi-source itself).
  const highlight = Array.isArray(highlights) ? highlights[0] : null;

  // Split on [Page N] markers so we render one block per "page".
  const pages = useMemoP1(() => {
    if (!text) return [];
    const out = [];
    const re = /\[Page\s+(\d+)\]/g;
    let lastIdx = 0;
    let lastPage = 1;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIdx) {
        out.push({ page: lastPage, content: text.slice(lastIdx, m.index).trim() });
      }
      lastPage = parseInt(m[1], 10) || lastPage;
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < text.length) {
      out.push({ page: lastPage, content: text.slice(lastIdx).trim() });
    }
    return out.filter(p => p.content.length > 0);
  }, [text]);

  // When highlight changes, scroll its match into view (after render).
  // If the matcher couldn't find the excerpt anywhere on the page (e.g. the
  // model paraphrased so heavily even the 3-tier fallback missed), fall back
  // to scrolling the cited page header into view so the user at least lands
  // in the right neighbourhood.
  useEffectP1(() => {
    const t = setTimeout(() => {
      if (matchRef.current) {
        matchRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (highlight?.page && containerRef.current) {
        const el = containerRef.current.querySelector(`#page-${highlight.page}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50); // give React one tick to paint the new mark before we scroll
    return () => clearTimeout(t);
    // focusNonce is included so repeated clicks on the same badge re-trigger
    // the scroll even though highlight.page / highlight.excerpt are unchanged.
  }, [highlight?.page, highlight?.excerpt, focusNonce]);

  if (!text) {
    return (
      <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle p-6 text-sm text-on-surface-variant">
        <h3 className="font-card-title text-card-title mb-3 text-on-surface">{docName}</h3>
        <p>Extracting document text…{isDocx ? " (first open of a DOCX can take a moment)" : ""}</p>
        {fallbackUrl && (
          <p className="mt-3"><a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open original file in a new tab</a></p>
        )}
      </div>
    );
  }

  const excerpt = highlight?.excerpt || "";
  const highlightPage = highlight?.page;

  return (
    <div ref={containerRef} className="w-full max-w-4xl bg-white shadow-sm rounded-xl border border-border-subtle px-8 py-6">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-5">
        <h3 className="font-card-title text-card-title">{docName}</h3>
        {fallbackUrl && (
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">Open original ↗</a>
        )}
      </div>

      {pages.map((p, i) => (
        <section key={i} id={`page-${p.page}`} className="mb-8">
          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">
            Page {p.page} {highlightPage === p.page && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />}
          </div>
          {renderPageWithHighlight(p.content, excerpt, highlightPage === p.page ? matchRef : null)}
        </section>
      ))}
    </div>
  );
}

// Highlight the (first occurrence of the) excerpt inside one page's content.
// Falls back to plain text when there is no match (model may have paraphrased
// slightly). The matchRef points at the highlighted span so we can scroll it
// into view from the parent component.
// Render a single "page" of extracted text. Handles two concerns:
//
//   1. Visual formatting — lines starting with `## ` are rendered as headings
//      (we inject those markers server-side in _extract_docx so the LLM can
//      recognise structure; they should NOT appear as literal "##" to the user).
//
//   2. Excerpt highlighting — find the cited passage and wrap it in <mark>.
//      The matcher is tolerant: whitespace-normalised, case-insensitive, and
//      falls back to the first ~60 chars of the excerpt if a full match misses
//      (the model often paraphrases or adds trailing punctuation that differs
//      from the document verbatim).
function renderPageWithHighlight(content, excerpt, matchRef) {
  // 1. Split into blocks by line, detecting heading markers.
  const blocks = parseBlocks(content);

  // 2. Locate the excerpt's match span (if any) across the WHOLE page text,
  //    then map that back to which block(s) the match falls into.
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const target = norm(excerpt);
  let matchSpan = null; // { startInJoinedText, endInJoinedText }
  if (target && target.length >= 6) {
    matchSpan = locateExcerpt(blocks, target);
  }

  // 3. Render each block, applying the highlight when its slice overlaps the match.
  return blocks.map((block, i) => {
    const Tag = block.heading ? "h4" : "p";
    const className = block.heading
      ? "text-sm font-bold text-on-surface mt-4 mb-2"
      : "whitespace-pre-wrap text-sm leading-7 text-on-surface mb-3";
    const inner = renderBlockWithHighlight(block, matchSpan, matchRef);
    return <Tag key={i} className={className}>{inner}</Tag>;
  });
}

// Split extracted text into blocks. Lines starting with `## ` become headings;
// runs of non-heading lines collapse into paragraph blocks.
function parseBlocks(content) {
  const lines = (content || "").split("\n");
  const blocks = [];
  let buf = [];
  const flushBuf = () => {
    const text = buf.join("\n").trim();
    if (text) blocks.push({ heading: false, text, sourceStart: 0 });
    buf = [];
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flushBuf();
      blocks.push({ heading: true, text: headingMatch[1].trim() });
    } else {
      buf.push(line);
    }
  }
  flushBuf();
  // Compute each block's start offset in the joined NORMALISED text. The
  // `locateExcerpt` function joins normalised pieces, so sourceStart must be
  // in normalised-character space — using `b.text.length` (original) caused
  // offsets to drift on any block containing collapsed whitespace and made
  // the per-block overlap check miss every time.
  const normForLen = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  let runningStart = 0;
  for (const b of blocks) {
    b.sourceStart = runningStart;
    runningStart += normForLen(b.text).length + 1; // +1 for the separator
  }
  return blocks;
}

// Find the excerpt across all blocks. Returns { start, end } in the joined
// normalised text (each block separated by a single space), or null if not found.
//
// Tries three increasingly tolerant strategies:
//   1. Exact normalised substring match (handles whitespace + case).
//   2. Prefix match — first 60 chars only (handles trailing punctuation
//      added by the model).
//   3. Word-sequence match — find the longest run of significant excerpt
//      words that appear in order in the document. This catches paraphrased
//      excerpts ("Kubernetes provides horizontal auto-scaling..." matching
//      "Kubernetes horizontal auto-scaling handles...") so long as a chunk
//      of 4+ consecutive words from the excerpt does appear verbatim.
function locateExcerpt(blocks, target) {
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const joined = blocks.map(b => norm(b.text)).join(" ");
  if (!joined) return null;

  // Strategy 1: exact match.
  let idx = joined.indexOf(target);
  if (idx !== -1) return { start: idx, end: idx + target.length };

  // Strategy 2: prefix match.
  if (target.length > 60) {
    idx = joined.indexOf(target.slice(0, 60));
    if (idx !== -1) return { start: idx, end: idx + 60 };
  }

  // Strategy 3: longest matching word-run.
  const words = target.split(" ").filter(w => w.length >= 3);
  if (words.length >= 3) {
    for (let len = words.length; len >= 3; len--) {
      for (let i = 0; i + len <= words.length; i++) {
        const phrase = words.slice(i, i + len).join(" ");
        // Require phrase to be at least 15 chars to avoid false positives like
        // "the application" matching any random sentence.
        if (phrase.length < 15) continue;
        const at = joined.indexOf(phrase);
        if (at !== -1) return { start: at, end: at + phrase.length };
      }
    }
  }

  // Strategy 4: char-window fallback. Try increasingly small fixed windows
  // (40 → 20 chars) sliding across the excerpt; first hit wins. Catches cases
  // where the model paraphrased a word in the middle but a long suffix matches.
  for (let len = 40; len >= 20; len -= 5) {
    if (target.length < len) continue;
    for (let i = 0; i + len <= target.length; i++) {
      const window = target.slice(i, i + len);
      const at = joined.indexOf(window);
      if (at !== -1) return { start: at, end: at + len };
    }
  }

  return null;
}

// Render one block, splicing in a <mark> around the part that intersects
// the global match span. We operate on the normalised joined-text indices,
// not on the original (un-normalised) text — so we approximate by searching
// within this block for the excerpt-substring after a global match is found.
function renderBlockWithHighlight(block, matchSpan, matchRef) {
  if (!matchSpan || block.heading) return block.text;

  // Convert global span → block-local span via the block's sourceStart.
  const blockStart = block.sourceStart;
  // Approximate block length in the normalised representation.
  const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const normalisedBlock = norm(block.text);
  const blockEnd = blockStart + normalisedBlock.length;

  // Does this block overlap the match at all?
  if (matchSpan.end <= blockStart || matchSpan.start >= blockEnd) {
    return block.text;
  }

  // Find the visible substring in the ORIGINAL block text that corresponds to
  // the match. Easiest reliable approach: take the chars of the normalised
  // overlap, then re-search the original block text for that substring,
  // case-insensitively. Good enough for most academic prose.
  const overlapStartInBlock = Math.max(0, matchSpan.start - blockStart);
  const overlapEndInBlock = Math.min(normalisedBlock.length, matchSpan.end - blockStart);
  const overlapNorm = normalisedBlock.slice(overlapStartInBlock, overlapEndInBlock);
  if (overlapNorm.length < 4) return block.text;

  // Find it (lowercase) in the original block.
  const lowerBlock = block.text.toLowerCase();
  // Try first ~60 chars to be robust against whitespace differences.
  const probe = overlapNorm.slice(0, 60);
  const idx = lowerBlock.indexOf(probe);
  if (idx === -1) return block.text;

  const before = block.text.slice(0, idx);
  const match = block.text.slice(idx, idx + probe.length);
  const after = block.text.slice(idx + probe.length);
  return (
    <>
      {before}
      <mark ref={matchRef} className="bg-yellow-200 px-0.5 rounded">{match}</mark>
      {after}
    </>
  );
}

// Render an AI answer that contains inline [N] citation markers as a sequence of
// text segments interleaved with clickable numbered badges. The badge's tooltip
// shows the source excerpt; clicking calls focusSource(source) so the parent
// component can scroll the document pane to it.
function renderAnswerWithCitations(content, sources, focusSource, activeSource) {
  if (!content) return null;
  const safeSources = Array.isArray(sources) ? sources : [];
  // Match ASCII brackets [1], CJK full-width 【1】, or parenthesised (1) —
  // free models drift between these formats despite the prompt asking for ASCII.
  // The capture is wrapped in a split-group so each marker becomes its own piece.
  const MARKER_RE = /(\[\d{1,2}\]|【\d{1,2}】|（\d{1,2}）)/g;
  const MARKER_INNER = /^(?:\[(\d{1,2})\]|【(\d{1,2})】|（(\d{1,2})）)$/;
  const parts = content.split(MARKER_RE);
  return parts.map((part, idx) => {
    const m = part.match(MARKER_INNER);
    if (!m) return <span key={idx}>{part}</span>;
    const n = parseInt(m[1] || m[2] || m[3], 10);
    const src = safeSources[n - 1];
    if (!src) {
      // Model emitted a [N] with no matching source — render as plain text rather than a broken badge.
      return <span key={idx}>{part}</span>;
    }
    const isActive = activeSource
      && activeSource.page === src.page
      && activeSource.excerpt === src.excerpt;
    return (
      <button
        key={idx}
        onClick={() => focusSource(src, safeSources)}
        title={`p.${src.page} · ${src.section || ""}\n"${src.excerpt || ""}"`}
        className={
          "inline-flex items-center justify-center align-baseline mx-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold leading-none transition-colors " +
          (isActive
            ? "bg-primary text-white"
            : "bg-green-100 text-green-700 hover:bg-green-200")
        }
      >
        {n}
      </button>
    );
  });
}


function DocViewerPage({ params }) {
  const documentId = params?.[1] || "";
  const cached = documentId ? docCache.get(documentId) : null;
  const [length, setLength] = useStateP1("Med");
  const [loadingDocument, setLoadingDocument] = useStateP1(!cached);
  const [viewerError, setViewerError] = useStateP1("");
  const [documentData, setDocumentData] = useStateP1(cached?.documentData || null);
  const [viewUrl, setViewUrl] = useStateP1(cached?.viewUrl || "");
  const [textContent, setTextContent] = useStateP1(cached?.textContent || "");
  // Conversation state. Messages have shape:
  //   { role: 'user'|'assistant', content: string, sources?: [{page,section,excerpt,relevance}],
  //     time: string, streaming?: boolean, error?: string }
  const [messages, setMessages] = useStateP1([]);
  const [draft, setDraft] = useStateP1("");
  const [contextOpen, setContextOpen] = useStateP1(false);
  const [context, setContext] = useStateP1("Current Document");
  const [sessionId, setSessionId] = useStateP1(null);
  const [streaming, setStreaming] = useStateP1(false);
  // Sources highlighted in the doc pane. Always an array: index 0 is the
  // PRIMARY (drives scroll), the rest are also marked so when the AI cites
  // [1] [2] [3] all three appear highlighted at once. Cleared on manual scroll.
  const [activeSources, setActiveSources] = useStateP1(null);
  // Convenience alias — many existing checks only need the primary source.
  const activeSource = activeSources?.[0] || null;
  // Server-extracted plain text used by TextDocumentView. Fetched lazily for
  // DOCX (which has no usable inline rendering) and DOCX-like cases.
  const [extractedTextContent, setExtractedTextContent] = useStateP1("");
  // Server-rendered DOCX HTML (mammoth) used by DocxHtmlView for rich display.
  const [extractedHtmlContent, setExtractedHtmlContent] = useStateP1("");
  // Ref to the bottom of the chat message list. Used by an effect below to
  // auto-scroll to the newest message on every state change.
  const chatBottomRef = useRefP1(null);
  // Sidebar collapsed-state for the doc viewer. The DocViewer doesn't use
  // AppShell (it has a custom layout) so we manage this here.
  const [sidebarCollapsed, setSidebarCollapsed] = useStateP1(false);
  // In-place upload modal triggered by the "+" button on the tab bar. We render
  // the modal locally so the current document stays visible behind it (vs.
  // navigating to /upload which would unmount the viewer). The UploadModal
  // already calls `openTabImperative` for each successful upload, so the new
  // file automatically appears as a tab in this same viewer.
  const [uploadModalOpen, setUploadModalOpen] = useStateP1(false);

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

  // Fetch server-extracted text + HTML for DOCX. The HTML is what we render
  // (rich formatting via mammoth); the text is kept as a fallback for older
  // uploads where mammoth conversion may not have run yet.
  useEffectP1(() => {
    let active = true;
    if (!documentId || documentData?.file_type !== "DOCX") {
      setExtractedTextContent("");
      setExtractedHtmlContent("");
      return () => { active = false; };
    }
    (async () => {
      try {
        const res = await apiRequest(`/documents/${documentId}/text`);
        if (!active) return;
        setExtractedTextContent(res?.text || "");
        setExtractedHtmlContent(res?.html || "");
      } catch (err) {
        if (active) {
          setExtractedTextContent("");
          setExtractedHtmlContent("");
        }
      }
    })();
    return () => { active = false; };
  }, [documentId, documentData?.file_type]);

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

  // Auto-scroll the chat to the bottom whenever a message lands or content
  // streams in. Also fires on `draft` so the most recent message stays visible
  // while the user is typing.
  useEffectP1(() => {
    const el = chatBottomRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, draft]);

  // If the user clicked "Resume chat" on /chats for this document, the
  // sessionStorage handoff key tells us which session to load.
  //
  // NB: React 18 strict mode double-mounts effects in dev. We must NOT clear
  // the sessionStorage key before the fetch finishes — otherwise the second
  // mount sees an empty key and bails, and the first mount's cleanup runs
  // before the fetch resolves so its setState gets discarded. The fix is to
  // (a) only remove the key after a successful state update, and (b) not
  // gate the setState behind an `active` flag (idempotent GETs are fine).
  useEffectP1(() => {
    if (!documentId) return;
    const key = `pt.resumeSession.${documentId}`;
    const sid = sessionStorage.getItem(key);
    if (!sid) return;

    (async () => {
      try {
        const detail = await apiRequest(`/chat/sessions/${sid}`);
        if (!detail?.session_id) return;
        setSessionId(detail.session_id);
        const msgs = (detail.messages || []).map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: (m.source_highlights || []).map(sh => ({
            page: sh.page_number,
            section: "",
            excerpt: sh.chunk_text,
            relevance: (sh.similarity_score || 0) >= 1 ? "primary" : "supporting",
          })),
        }));
        setMessages(msgs);
        // Clear the handoff key only AFTER we've successfully hydrated state.
        sessionStorage.removeItem(key);
      } catch (err) {
        console.warn("Could not resume chat session", sid, err);
        // Leave the key in place so a refresh can retry.
      }
    })();
  }, [documentId]);

  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setActiveSources(null);
    setDraft("");
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || streaming || !documentId) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Push the user message + a placeholder assistant message immediately.
    setMessages(m => [
      ...m,
      { role: "user", content: text, time },
      { role: "assistant", content: "", time, streaming: true, sources: [] },
    ]);
    setDraft("");
    setStreaming(true);

    try {
      // 2. Lazily create a session bound to this document.
      let sid = sessionId;
      if (!sid) {
        const session = await apiRequest("/chat/sessions", {
          method: "POST",
          body: JSON.stringify({
            context_type: "document",
            context_id: documentId,
            title: text.slice(0, 100),
          }),
        });
        sid = session?.session_id;
        setSessionId(sid);
      }
      if (!sid) throw new Error("Could not start chat session.");

      // 3. Hit the streaming endpoint. We can't use apiRequest() because it
      //    buffers the full response — we need fetch + ReadableStream here.
      const token = localStorage.getItem("aid_token");
      const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sid}/messages/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        const body = await response.text();
        let detail = body;
        try { detail = (JSON.parse(body) || {}).detail || body; } catch { /* keep raw */ }
        throw new Error(detail || `Request failed (${response.status})`);
      }

      // 4. Parse the SSE stream: lines beginning with "data: " contain JSON
      //    events of shape { type: 'delta'|'done'|'error', ... }.
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        // Keep the trailing partial in the buffer for the next chunk.
        buffer = events.pop() || "";

        for (const evt of events) {
          if (!evt.startsWith("data:")) continue;
          const raw = evt.slice(5).trim();
          if (!raw) continue;

          let payload;
          try { payload = JSON.parse(raw); } catch { continue; }

          if (payload.type === "delta" && payload.content) {
            assembled += payload.content;
            setMessages(m => {
              const next = [...m];
              const i = next.length - 1;
              if (i >= 0 && next[i].role === "assistant") {
                next[i] = { ...next[i], content: assembled };
              }
              return next;
            });
          } else if (payload.type === "done") {
            setMessages(m => {
              const next = [...m];
              const i = next.length - 1;
              if (i >= 0 && next[i].role === "assistant") {
                next[i] = {
                  ...next[i],
                  sources: payload.sources || [],
                  streaming: false,
                };
              }
              return next;
            });
            // Auto-highlight the primary source so the PDF scrolls to it.
            // Auto-focus the primary source once the AI message lands so the
            // user sees the highlighted passage without a click. All siblings
            // get marked too.
            const all = payload.sources || [];
            const primary = all.find(s => s.relevance === "primary") || all[0];
            if (primary) focusSource(primary, all);
          } else if (payload.type === "error") {
            throw new Error(payload.error || "AI provider error.");
          }
        }
      }
    } catch (err) {
      setMessages(m => {
        const next = [...m];
        const i = next.length - 1;
        if (i >= 0 && next[i].role === "assistant") {
          next[i] = {
            ...next[i],
            content: `Error: ${err.message || "Could not get an AI response."}`,
            streaming: false,
            error: true,
          };
        }
        return next;
      });
    } finally {
      setStreaming(false);
    }
  };

  // Click counter that increments every time a citation badge is clicked.
  // Doc-view components use it as a useEffect dependency so they re-scroll
  // even when the user clicks the SAME source twice (after manually scrolling
  // away). Without this, React skips the effect because activeSource is
  // referentially equal to the previous value.
  const [focusNonce, setFocusNonce] = useStateP1(0);

  // Clicking a source citation scrolls the doc pane to the cited passage and
  // highlights it AND any sibling sources in the same AI message. The clicked
  // source is placed first so it drives the scroll.
  // Always bumps focusNonce so a repeat click re-triggers the scroll even
  // though the highlight list itself didn't change.
  const focusSource = (src, siblingSources) => {
    if (!src) return;
    const others = (siblingSources || []).filter(s => s !== src);
    setActiveSources([src, ...others]);
    setFocusNonce(n => n + 1);
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
      // Render with react-pdf so we can highlight the cited passage inside
      // the text layer, not just navigate to a page. Falls back to "Open
      // original ↗" if the PDF fails to load (e.g. CORS on the signed URL).
      return (
        <PdfDocumentView
          docName={docName}
          fileUrl={viewUrl}
          highlights={activeSources}
          focusNonce={focusNonce}
        />
      );
    }

    if (documentData.file_type === "TXT") {
      return (
        <TextDocumentView
          docName={docName}
          text={textContent}
          highlights={activeSources}
          fallbackUrl={viewUrl}
          focusNonce={focusNonce}
        />
      );
    }

    if (documentData.file_type === "DOCX") {
      // Prefer the mammoth-rendered HTML view (preserves headings, bold,
      // tables, lists). Falls back to the plain-text view if extraction
      // hasn't run yet (legacy upload, mammoth missing in container, etc.).
      if (extractedHtmlContent) {
        return (
          <DocxHtmlView
            docName={docName}
            html={extractedHtmlContent}
            fallbackUrl={viewUrl}
            highlights={activeSources}
            focusNonce={focusNonce}
          />
        );
      }
      return (
        <TextDocumentView
          docName={docName}
          text={extractedTextContent}
          highlights={activeSources}
          fallbackUrl={viewUrl}
          focusNonce={focusNonce}
          isDocx
        />
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

  // Used several times below: width of the sidebar depending on collapse state.
  const sidebarWidthClass = sidebarCollapsed ? "ml-[68px]" : "ml-sidebar-width";
  const headerWidthClass  = sidebarCollapsed ? "w-[calc(100%-68px)]" : "w-[calc(100%-240px)]";

  return (
    <div className="h-screen flex flex-col bg-background-primary overflow-hidden">
      <Sidebar
        active="library"
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />
      <header className={`fixed top-0 right-0 ${headerWidthClass} h-16 bg-white border-b border-border-subtle flex justify-between items-center px-container-padding z-30 transition-all duration-300`}>
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

      <div className={`${sidebarWidthClass} pt-16 fixed top-0 right-0 left-0 z-20 transition-all duration-300`} style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <DocTabBar
            activeId={documentId}
            tabs={tabs}
            onClose={closeTab}
            onReorder={reorderTab}
            onAdd={() => setUploadModalOpen(true)}
          />
        </div>
      </div>

      <main className={`${sidebarWidthClass} h-screen flex transition-all duration-300`} style={{ paddingTop: 64 + (tabs.length ? 44 : 0) }}>
        {/* PDF pane */}
        <section
          className="flex-1 bg-surface-container-low overflow-y-auto p-8 flex flex-col items-center"
          // Clear the active source highlight when the user scrolls / pans
          // by hand. `scrollIntoView` does NOT trigger wheel/touchmove, so
          // these handlers fire only on real user input. The next badge
          // click re-sets activeSource and the highlight comes back.
          onWheel={() => { if (activeSources) setActiveSources(null); }}
          onTouchMove={() => { if (activeSources) setActiveSources(null); }}
        >
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
              <button
                onClick={startNewChat}
                disabled={streaming || (messages.length === 0 && !sessionId)}
                className="text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Start a new chat for this document"
              >
                <Icon name="edit_square" size={14} /> New chat
              </button>
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
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center">
                  <Icon name="smart_toy" filled className="text-primary" size={24} />
                </div>
                <h3 className="font-card-title text-card-title">Ask anything about this document</h3>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Answers are grounded in <b>{docName}</b>. Every reply includes a clickable source — click it to jump to the cited page.
                </p>
              </div>
            )}

            {messages.map((m, i) => m.role === "user" ? (
              <div key={i} className="flex flex-col items-end">
                <div className="px-4 py-2.5 rounded-2xl max-w-[85%] text-body-main bg-surface-container-high">
                  {m.content}
                </div>
                <span className="text-[10px] text-text-muted mt-1 px-1">{m.time}</span>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Icon name="smart_toy" filled className="text-white" size={18} />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <div className={`text-body-main leading-relaxed whitespace-pre-wrap ${m.error ? "text-error" : "text-on-surface"}`}>
                    {m.content
                      ? renderAnswerWithCitations(m.content, m.sources, focusSource, activeSource)
                      : (m.streaming ? (
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-pulse" style={{ animationDelay: "120ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-pulse" style={{ animationDelay: "240ms" }} />
                        </span>
                      ) : null)}
                    {m.streaming && m.content ? <span className="inline-block w-1.5 h-3 ml-0.5 align-middle bg-primary opacity-60 animate-pulse" /> : null}
                  </div>

                  {!m.streaming && m.content && !m.error && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => navigator.clipboard?.writeText(m.content)}
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low"
                        title="Copy answer"
                      >
                        <Icon name="content_copy" size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Sentinel scrolled into view whenever messages/draft change. */}
            <div ref={chatBottomRef} />
          </div>

          <div className="p-4 border-t border-border-subtle">
            <div className="bg-surface-container-low rounded-2xl p-2 border border-border-subtle">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={streaming}
                className="w-full bg-transparent border-none focus:ring-0 text-body-main resize-none p-2 h-16 outline-none disabled:opacity-60"
                placeholder={streaming ? "Waiting for the AI…" : `Ask anything about ${docName}…`}
              />
              <div className="flex items-center justify-end pt-1 px-1">
                <button
                  onClick={send}
                  disabled={streaming || !draft.trim()}
                  className="bg-primary text-white p-2 rounded-full hover:opacity-90 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  title={streaming ? "Streaming…" : "Send"}
                >
                  <Icon name={streaming ? "stop_circle" : "send"} size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Local upload modal triggered by the "+" tab button. Keeps the user on
          the current doc viewer; on success the UploadModal calls
          openTabImperative and navigates to the first new doc, which becomes
          the new active tab without ever leaving the viewer. */}
      <UploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
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
          <p className="text-on-surface-variant">Connect Paper Trail to your existing research tools and workflows.</p>
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

// =================== CHATS (session history) ===================
function ChatsPage() {
  const [sessions, setSessions] = useStateP1([]);
  const [docNames, setDocNames] = useStateP1({}); // doc_id -> filename
  const [loading, setLoading] = useStateP1(true);
  const [error, setError] = useStateP1("");

  useEffectP1(() => {
    let active = true;
    (async () => {
      try {
        const list = await apiRequest("/chat/sessions");
        if (!active) return;
        const sessArr = Array.isArray(list) ? list : [];
        setSessions(sessArr);

        // Resolve document names for sessions scoped to a doc. The library
        // bootstrap probably already has them — fall back to per-doc fetch.
        const docIds = [...new Set(sessArr.filter(s => s.context_type === "document" && s.context_id).map(s => s.context_id))];
        if (docIds.length > 0) {
          try {
            const allDocs = await apiRequest("/documents");
            const lookup = {};
            for (const d of (allDocs || [])) lookup[d.document_id] = d.filename;
            if (active) setDocNames(lookup);
          } catch { /* names are nice-to-have */ }
        }
      } catch (err) {
        if (active) setError(err.message || "Could not load chats");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleResume = (session) => {
    if (session.context_type === "document" && session.context_id) {
      // Hand off to DocViewerPage via sessionStorage; the doc page checks
      // this key on mount and loads the matching session's messages.
      sessionStorage.setItem(`pt.resumeSession.${session.context_id}`, session.session_id);
      navigate(`/library/doc/${session.context_id}`);
    } else {
      // Workspace / collection / global sessions — not yet wired into a viewer.
      window.alert("This chat is not scoped to a single document and cannot be resumed yet.");
    }
  };

  const handleDelete = async (session) => {
    if (!window.confirm("Delete this chat? This cannot be undone.")) return;
    try {
      await apiRequest(`/chat/sessions/${session.session_id}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.session_id !== session.session_id));
    } catch (err) {
      window.alert("Could not delete: " + (err.message || "unknown error"));
    }
  };

  return (
    <AppShell active="chats" breadcrumbs={[{ label: "Chats" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-1">Chats</h1>
          <p className="text-on-surface-variant text-sm">Resume a previous conversation or start a new one from any document.</p>
        </div>
        <Link to="/library" className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 inline-flex items-center gap-2">
          <Icon name="add" size={16} /> New chat
        </Link>
      </div>

      {loading && <p className="text-sm text-on-surface-variant">Loading chats…</p>}
      {error && <p className="text-sm text-error">Error: {error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <div className="border border-border-subtle rounded-2xl p-10 text-center bg-white">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <Icon name="forum" filled className="text-on-surface-variant" size={24} />
          </div>
          <h3 className="font-card-title text-card-title mb-1">No chats yet</h3>
          <p className="text-xs text-on-surface-variant mb-4">Open a document and ask a question to start your first chat.</p>
          <Link to="/library" className="inline-block bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">Go to library</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map(s => {
          const docName = s.context_id ? (docNames[s.context_id] || "Untitled document") : "Workspace / Collection chat";
          return (
            <div key={s.session_id} className="bg-white border border-border-subtle rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                  <Icon name={s.context_type === "document" ? "description" : s.context_type === "workspace" ? "workspaces" : "forum"} size={14} />
                  {s.context_type}
                </div>
                <button
                  onClick={() => handleDelete(s)}
                  className="text-on-surface-variant hover:text-error p-1 rounded transition-colors"
                  title="Delete chat"
                >
                  <Icon name="delete" size={14} />
                </button>
              </div>
              <h3 className="font-card-title text-card-title mb-1 line-clamp-2">{s.title || "Untitled conversation"}</h3>
              <p className="text-[11px] text-on-surface-variant mb-1 line-clamp-1">{docName}</p>
              <p className="text-[10px] text-on-surface-variant mb-3">Last active {formatRelativeTime(s.updated_at)}</p>
              <button
                onClick={() => handleResume(s)}
                className="w-full bg-surface-container-low hover:bg-surface-container text-primary text-xs font-bold py-2 rounded-lg transition-colors"
              >
                Resume chat
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

// ─── MY PAPERS ───────────────────────────────────────────────────────────────
// Lists every Paper draft the current user has created in the editor. Clicking
// a row opens `#/write/<paper_id>`; the editor loads the blocks and resumes
// autosaving on PATCH /api/papers/<id>.
function MyPapersPage() {
  const [papers, setPapers] = useStateP1([]);
  const [loading, setLoading] = useStateP1(true);
  const [error, setError] = useStateP1("");
  const [creating, setCreating] = useStateP1(false);

  useEffectP1(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiRequest("/papers");
        if (active) setPapers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleNew = async () => {
    setCreating(true);
    try {
      const created = await apiRequest("/papers", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled paper", blocks: [] }),
      });
      navigate(`/write/${created.paper_id}`);
    } catch (err) {
      window.alert(err.message || "Could not create paper");
      setCreating(false);
    }
  };

  const handleDelete = async (paper) => {
    if (!window.confirm(`Delete "${paper.title}"? This cannot be undone.`)) return;
    try {
      await apiRequest(`/papers/${paper.paper_id}`, { method: "DELETE" });
      setPapers(prev => prev.filter(p => p.paper_id !== paper.paper_id));
    } catch (err) {
      window.alert(err.message || "Could not delete");
    }
  };

  return (
    <AppShell active="papers" breadcrumbs={[{ label: "My Papers" }]}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-1">My Papers</h1>
          <p className="text-on-surface-variant text-sm">Drafts you're writing in the editor. Autosaved as you type.</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Icon name="add" size={16} />
          {creating ? "Creating…" : "New paper"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container text-sm">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : papers.length === 0 ? (
        <EmptyState
          icon="draft"
          title="No papers yet"
          text="Start writing your first paper — autosave keeps your work safe across sessions."
          action={
            <button onClick={handleNew} className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold">
              Start a paper
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map(p => (
            <div
              key={p.paper_id}
              className="bg-white border border-border-subtle rounded-xl p-5 hover:shadow-md transition-shadow group relative"
            >
              <button
                onClick={() => handleDelete(p)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-on-surface-variant hover:bg-error-container hover:text-on-error-container opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete paper"
              >
                <Icon name="delete" size={16} />
              </button>
              <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-primary mb-4">
                <Icon name="draft" filled />
              </div>
              <h3 className="font-card-title text-card-title mb-1 line-clamp-2 pr-8">{p.title || "Untitled paper"}</h3>
              <p className="text-[11px] text-on-surface-variant mb-1">{(p.format || "").replace(/_/g, " ")}</p>
              <p className="text-[10px] text-on-surface-variant mb-3">Last edited {formatRelativeTime(p.updated_at)}</p>
              <button
                onClick={() => navigate(`/write/${p.paper_id}`)}
                className="w-full bg-surface-container-low hover:bg-surface-container text-primary text-xs font-bold py-2 rounded-lg transition-colors"
              >
                Continue writing
              </button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

export { DashboardPage, LibraryPage, DocViewerPage, WorkspacesPage, WorkspaceDetailPage, IntegrationsPage, ChatsPage, MyPapersPage };

