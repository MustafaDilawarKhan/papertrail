// Shared shell components: Sidebar, TopNav, AvatarMenu, etc.
import React, { useState, useEffect, useRef } from 'react';

// ---- Router (hash-based) ----
export function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#/, "") || "/");
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#/, "") || "/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

export function navigate(path) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

export function Link({ to, children, className, onClick, ...rest }) {
  return (
    <a href={`#${to}`} className={className} onClick={(e) => {
      if (onClick) onClick(e);
    }} {...rest}>{children}</a>
  );
}

// ---- Icon shorthand ----
export function Icon({ name, className = "", filled = false, size }) {
  const style = filled ? { fontVariationSettings: "'FILL' 1" } : undefined;
  const sizeStyle = size ? { fontSize: size + "px", ...style } : style;
  return <span className={`material-symbols-outlined ${className}`} style={sizeStyle}>{name}</span>;
}

// ---- Brand / Logo ----
export function Brand({ small }) {
  return (
    <Link to="/dashboard" className="flex items-center gap-2 group">
      <span className={`font-hero-headline font-extrabold text-primary tracking-tight ${small ? "text-lg" : "text-xl"}`}>Aid</span>
      {!small && <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">AI Research</span>}
    </Link>
  );
}

// ---- Sidebar (user app) ----
export function Sidebar({ active }) {
  const items = [
    { id: "home", label: "Home", icon: "home", to: "/dashboard" },
    { id: "library", label: "Library", icon: "library_books", to: "/library" },
    { id: "workspaces", label: "Workspaces", icon: "workspaces", to: "/workspaces" },
    { id: "settings", label: "Settings", icon: "settings", to: "/settings" },
    { id: "help", label: "Help", icon: "help", to: "/help" },
  ];
  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-background-sidebar border-r border-border-subtle flex flex-col p-4 gap-4 z-40">
      <div className="px-2 mb-2">
        <Brand />
      </div>
      <nav className="flex flex-col gap-1 flex-grow">
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <Link
              key={it.id}
              to={it.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive ? "bg-sidebar-active text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low"}`}
            >
              <Icon name={it.icon} filled={isActive} />
              <span className="text-body-main">{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4 bg-surface-container-low rounded-xl border border-border-subtle">
        <p className="text-xs font-bold text-primary mb-1">Upgrade to Pro</p>
        <p className="text-[11px] text-on-surface-variant mb-3 leading-snug">Unlimited citations &amp; collaboration.</p>
        <Link to="/upgrade" className="block w-full bg-primary text-on-primary text-[11px] py-2 rounded-lg font-bold text-center">Upgrade</Link>
      </div>
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[11px] font-bold text-on-surface">MD</div>
        <div className="overflow-hidden">
          <p className="text-[12px] font-bold truncate">Mustafa Dilawar</p>
          <p className="text-[10px] text-on-surface-variant truncate">Free Plan</p>
        </div>
      </div>
    </aside>
  );
}

// ---- Top Nav (user app) ----
export function TopNav({ breadcrumbs = [], onSearchOpen }) {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-background-primary/80 backdrop-blur-md border-b border-border-subtle flex justify-between items-center px-container-padding z-30">
      <nav className="flex items-center gap-2 font-breadcrumb text-breadcrumb">
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevron_right" className="text-[14px] text-on-surface-variant" />}
            {b.to ? (
              <Link to={b.to} className="text-on-surface-variant hover:text-primary transition-colors">{b.label}</Link>
            ) : (
              <span className="text-primary font-bold">{b.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="flex-1 max-w-md mx-8">
        <button onClick={onSearchOpen} className="w-full flex items-center gap-3 bg-surface-container-lowest border border-border-subtle rounded-full py-2 px-4 text-sm text-on-surface-variant hover:border-primary/40 transition-colors">
          <Icon name="search" className="text-[18px]" />
          <span className="flex-1 text-left">Search documents, collections...</span>
          <span className="text-[10px] font-bold bg-surface-container px-1.5 py-0.5 rounded">⌘K</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-surface-container-low rounded-full relative">
          <Icon name="notifications" className="text-[20px]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full"></span>
        </button>
        <Link to="/upload" className="hidden md:flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-full text-xs font-bold hover:opacity-90">
          <Icon name="add" className="text-[16px]" /> Upload
        </Link>
      </div>
    </header>
  );
}

// ---- Page shell for user app ----
export function AppShell({ active, breadcrumbs, children, onSearchOpen }) {
  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar active={active} />
      <TopNav breadcrumbs={breadcrumbs} onSearchOpen={onSearchOpen} />
      <main className="ml-sidebar-width pt-16 min-h-screen">
        <div className="px-container-padding py-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

// ---- Command Palette ----
export function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    const onKey = (e) => {
      if (e.key === "Escape" && open) onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const recents = [
    { name: "Trustworthiness of AI in HRI", sub: "PDF • Oct 12", icon: "description", to: "/library/thesis/trust-ai-hri" },
    { name: "Measuring Trust in HRC", sub: "PDF • Oct 10", icon: "description", to: "/library/thesis/measuring-trust" },
    { name: "Thesis Sources", sub: "Collection", icon: "folder", to: "/library" },
  ];
  const actions = [
    { name: "Upload new document", icon: "upload_file", to: "/upload" },
    { name: "New workspace", icon: "add_circle", to: "/workspaces" },
    { name: "Export bibliography (BibTeX)", icon: "download", to: "/settings" },
  ];
  const filtered = (list) => list.filter(x => x.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-border-subtle overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border-subtle flex items-center gap-3">
          <Icon name="search" className="text-on-surface-variant" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search library or jump to..." className="w-full border-none focus:ring-0 text-body-main outline-none bg-transparent" />
          <span className="text-[10px] font-bold bg-surface-container px-2 py-1 rounded">ESC</span>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Recents</div>
          {filtered(recents).map((r, i) => (
            <Link key={i} to={r.to} onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low group">
              <Icon name={r.icon} className="text-on-surface-variant group-hover:text-primary" />
              <div className="flex-1">
                <p className="text-xs font-bold text-primary">{r.name}</p>
                <p className="text-[10px] text-on-surface-variant">{r.sub}</p>
              </div>
              <span className="text-[10px] text-on-surface-variant">↵</span>
            </Link>
          ))}
          <div className="px-3 py-2 mt-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Actions</div>
          {filtered(actions).map((a, i) => (
            <Link key={i} to={a.to} onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low group">
              <Icon name={a.icon} className="text-on-surface-variant group-hover:text-primary" />
              <span className="text-xs font-bold text-primary">{a.name}</span>
            </Link>
          ))}
        </div>
        <div className="p-3 bg-surface-container-lowest border-t border-border-subtle flex justify-between text-[10px] text-on-surface-variant">
          <div className="flex gap-3">
            <span><kbd className="font-bold border px-1 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="font-bold border px-1 rounded">↵</kbd> select</span>
          </div>
          <span>Aid Search v2.4</span>
        </div>
      </div>
    </div>
  );
}

// ---- Empty State ----
export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center mb-4">
        <Icon name={icon} className="text-on-surface-variant" />
      </div>
      <h4 className="font-card-title text-card-title mb-1">{title}</h4>
      <p className="text-body-main text-on-surface-variant max-w-sm mb-4">{text}</p>
      {action}
    </div>
  );
}

// ---- Toggle ----
export function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(o => !o)} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-surface-container-high"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`}></span>
    </button>
  );
}
