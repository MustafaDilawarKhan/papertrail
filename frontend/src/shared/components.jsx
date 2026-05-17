// Shared shell components: Sidebar, TopNav, AvatarMenu, CommandPalette, etc.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../apiConfig';

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
export function Brand({ small, collapsed, to = "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2 group">
      <span className={`font-hero-headline font-extrabold text-primary tracking-tight ${small || collapsed ? "text-lg" : "text-xl"}`}>Paper Trail</span>
      {!small && !collapsed && <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Research Assistant</span>}
    </Link>
  );
}

// ---- Profile Dropdown ----
export function ProfileDropdown({ side = "bottom", align = "right", collapsed = false }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const items = [
    { icon: "person", label: "Profile", to: "/settings" },
    { icon: "settings", label: "Settings", to: "/settings" },
    { icon: "credit_card", label: "Upgrade", to: "/upgrade" },
    { icon: "help", label: "Help & Support", to: "/help" },
    { divider: true },
    { icon: "logout", label: "Log out", to: "/", onClick: logout },
  ];

  const positionClass = side === "top" 
    ? "bottom-full mb-2 left-0" 
    : "top-12 right-0";

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.name);
  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} className={`flex items-center gap-3 w-full text-left group ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[11px] font-bold text-on-surface flex-shrink-0 group-hover:ring-2 group-hover:ring-primary/30 transition-all uppercase">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="overflow-hidden flex-1">
              <p className="text-[12px] font-bold truncate">{displayName}</p>
              <p className="text-[10px] text-on-surface-variant truncate">Free Plan</p>
            </div>
            <Icon name="more_vert" size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        )}
      </button>

      {open && (
        <div className={`absolute ${positionClass} w-56 bg-white rounded-xl border border-border-subtle shadow-xl overflow-hidden animate-dropdown z-50`}>
          <div className="p-4 border-b border-border-subtle">
            <p className="text-sm font-bold text-primary">{displayName}</p>
            <p className="text-[11px] text-on-surface-variant">{displayEmail}</p>
            <span className="inline-block mt-1.5 text-[9px] font-bold bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded">Free Plan</span>
          </div>
          <div className="py-1">
            {items.map((item, i) =>
              item.divider ? (
                <div key={i} className="my-1 border-t border-border-subtle" />
              ) : (
                <Link key={i} to={item.to} onClick={() => { setOpen(false); if(item.onClick) item.onClick(); }} className={`flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-surface-container-low ${item.label === "Log out" ? "text-error" : "text-on-surface"}`}>
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Collapsible Sidebar (user app) ----
// "Upgrade to Pro" promo at the bottom of the sidebar. Hides itself when the
// user dismisses it via the × button; dismissal is remembered for the rest of
// the browser tab session only (sessionStorage), so it reappears in fresh
// tabs but doesn't nag during one demo. Pro users never see it.
function UpgradePromoCard({ collapsed }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem("pt.dismissUpgrade.v1") === "1"; }
    catch { return false; }
  });
  if (collapsed || dismissed) return null;
  // Pro users (or admins) don't need the upsell.
  if (user?.is_admin) return null;
  // The user's plan isn't on the bootstrap response yet, but we can hide for
  // explicit "Pro" plan names in the future without a code change.

  const dismiss = () => {
    try { sessionStorage.setItem("pt.dismissUpgrade.v1", "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="mt-auto relative p-4 bg-surface-container-low rounded-xl border border-border-subtle mb-4">
      <button
        onClick={dismiss}
        aria-label="Dismiss upgrade prompt"
        className="absolute top-2 right-2 w-6 h-6 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-primary flex items-center justify-center transition-colors"
        title="Hide for this session"
      >
        <Icon name="close" size={14} />
      </button>
      <p className="text-xs font-bold text-primary mb-1">Upgrade to Pro</p>
      <p className="text-[11px] text-on-surface-variant mb-3 leading-snug">Unlimited citations &amp; collaboration.</p>
      <Link to="/upgrade" className="block w-full bg-primary text-on-primary text-[11px] py-2 rounded-lg font-bold text-center hover:opacity-90 transition-opacity">Upgrade</Link>
    </div>
  );
}

export function Sidebar({ active, collapsed, onToggle }) {
  const { user } = useAuth();
  const displayName = user?.name || "User";

  const items = [
    { id: "home", label: "Home", icon: "home", to: "/dashboard" },
    { id: "library", label: "Library", icon: "library_books", to: "/library" },
    { id: "chats", label: "Chats", icon: "forum", to: "/chats" },
    { id: "workspaces", label: "Workspaces", icon: "workspaces", to: "/workspaces" },
    { id: "integrations", label: "Integrations", icon: "extension", to: "/integrations" },
    { id: "settings", label: "Settings", icon: "settings", to: "/settings" },
    { id: "help", label: "Help", icon: "help", to: "/help" },
    // Admin link is added below only if the current user has the is_admin flag.
  ];
  if (user?.is_admin) {
    items.push({ id: "admin", label: "Admin", icon: "admin_panel_settings", to: "/admin" });
  }
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-background-sidebar border-r border-border-subtle flex flex-col p-4 gap-4 z-40 transition-all duration-300 ease-in-out ${collapsed ? "w-[68px]" : "w-sidebar-width"}`}>
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-2"} mb-2`}>
        {!collapsed && <Brand />}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors active:scale-90" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Icon name={collapsed ? "menu" : "menu_open"} size={20} />
        </button>
      </div>
      <nav className="flex flex-col gap-1 flex-grow">
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <Link
              key={it.id}
              to={it.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 group ${isActive ? "bg-sidebar-active text-primary font-bold" : "text-on-surface-variant hover:bg-surface-container-low hover:translate-x-0.5"} ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? it.label : undefined}
            >
              <Icon name={it.icon} filled={isActive} />
              {!collapsed && <span className="text-body-main">{it.label}</span>}
            </Link>
          );
        })}
      </nav>
      <UpgradePromoCard collapsed={collapsed} />

      <div className={`${collapsed ? "px-1" : "px-2"}`}>
        {collapsed ? (
          <div className="relative group">
            <ProfileDropdown side="top" collapsed={true} />
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-on-surface text-surface px-2.5 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-x-[-10px] group-hover:translate-x-0 shadow-lg z-50">
              {displayName}
            </div>
          </div>
        ) : (
          <ProfileDropdown side="top" />
        )}
      </div>
    </aside>
  );
}

// ---- Top Nav (user app) ----
// ---- TopNav with notifications ----
export function TopNav({ breadcrumbs = [], onSearchOpen, collapsed }) {
  return (
    <header className={`fixed top-0 right-0 h-16 bg-background-primary/80 backdrop-blur-md border-b border-border-subtle flex justify-between items-center px-container-padding z-30 transition-all duration-300 ${collapsed ? "w-[calc(100%-68px)]" : "w-[calc(100%-240px)]"}`}>
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
        <button onClick={onSearchOpen} className="w-full flex items-center gap-3 bg-surface-container-lowest border border-border-subtle rounded-full py-2 px-4 text-sm text-on-surface-variant hover:border-primary/40 hover:shadow-sm transition-all">
          <Icon name="search" className="text-[18px]" />
          <span className="flex-1 text-left">Search documents, collections...</span>
          <span className="text-[10px] font-bold bg-surface-container px-1.5 py-0.5 rounded">⌘K</span>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <NotificationDropdown />
        <Link to="/write" className="hidden md:flex items-center gap-1.5 border border-border-subtle bg-white text-primary px-3 py-1.5 rounded-full text-xs font-bold hover:bg-surface-container-low transition-all active:scale-95">
          <Icon name="edit_square" className="text-[16px]" /> Write
        </Link>
        <Link to="/upload" className="hidden md:flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-full text-xs font-bold hover:opacity-90 hover:shadow-md transition-all active:scale-95">
          <Icon name="add" className="text-[16px]" /> Upload
        </Link>
      </div>
    </header>
  );
}

// ---- Notification Dropdown ----
function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;

    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/notifications?unread_only=false");
        const notifs = Array.isArray(data) ? data : [];
        setNotifications(notifs);
        const unread = notifs.filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [open]);

  const handleMarkRead = async (notificationId, currentReadState) => {
    try {
      await apiRequest(`/notifications/${notificationId}`, {
        method: "PATCH",
        body: JSON.stringify({ read: !currentReadState }),
      });
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? {...n, read: !currentReadState} : n)
      );
      const newUnread = notifications.filter(n => !n.read).length - (!currentReadState ? 1 : -1);
      setUnreadCount(Math.max(0, newUnread));
    } catch (err) {
      console.error("Error marking notification:", err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await apiRequest(`/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleAcceptInvite = async (notif) => {
    try {
      // Extract role from the data field if present
      let role = "Viewer";
      if (notif.data) {
        try {
          const parsed = typeof notif.data === "string" ? JSON.parse(notif.data) : notif.data;
          role = parsed.role || "Viewer";
        } catch (e) {
          // If parsing fails, default to Viewer
        }
      }
      // Call accept endpoint (we need to implement this on the backend)
      await apiRequest(`/notifications/${notif.notification_id}/accept`, {
        method: "POST",
        body: JSON.stringify({ workspace_id: notif.related_id }),
      });
      setNotifications(prev => prev.filter(n => n.notification_id !== notif.notification_id));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error("Error accepting invite:", err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(o => !o)} 
        className="p-2 hover:bg-surface-container-low rounded-full relative transition-colors active:scale-90"
      >
        <Icon name="notifications" className="text-[20px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl border border-border-subtle shadow-xl overflow-hidden animate-dropdown z-50">
          <div className="p-4 border-b border-border-subtle flex items-center justify-between">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">{unreadCount} new</span>}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-xs text-on-surface-variant text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-xs text-on-surface-variant text-center">
                <Icon name="notifications_off" className="text-[32px] opacity-50 mx-auto mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {notifications.map(notif => (
                  <div 
                    key={notif.notification_id}
                    className={`p-4 hover:bg-surface-container-lowest transition-colors cursor-pointer ${!notif.read ? "bg-surface-container-lowest" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex-1">
                        <p className={`text-xs ${notif.read ? "text-on-surface-variant" : "font-bold text-primary"}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant mt-1">{notif.message}</p>
                        <p className="text-[10px] text-on-surface-variant/50 mt-1.5">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                        {notif.type === "workspace_invite" && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvite(notif);
                              }}
                              className="px-2 py-1 text-xs bg-primary text-on-primary rounded font-bold hover:opacity-90"
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(notif.notification_id);
                              }}
                              className="px-2 py-1 text-xs border border-border-subtle rounded hover:bg-surface-container-low"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notif.notification_id, notif.read);
                          }}
                          className="p-1 hover:bg-surface-container rounded transition-colors"
                          title={notif.read ? "Mark unread" : "Mark read"}
                        >
                          <Icon name={notif.read ? "mail_outline" : "mail"} size={14} className="text-on-surface-variant" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.notification_id);
                          }}
                          className="p-1 hover:bg-surface-container rounded transition-colors"
                          title="Delete"
                        >
                          <Icon name="close" size={14} className="text-on-surface-variant" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



// ---- Page shell for user app ----
export function AppShell({ active, breadcrumbs, children, onSearchOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const route = useRoute();

  useEffect(() => {
    if (route === "/upload") setUploadOpen(true);
    else setUploadOpen(false);
  }, [route]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar active={active} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <TopNav breadcrumbs={breadcrumbs} onSearchOpen={() => setSearchOpen(true)} collapsed={collapsed} />
      <main className={`pt-16 min-h-screen transition-all duration-300 ${collapsed ? "ml-[68px]" : "ml-sidebar-width"}`}>
        <div className="px-container-padding py-8 max-w-7xl">{children}</div>
      </main>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <UploadModal open={uploadOpen} onClose={() => navigate("/library")} />
    </div>
  );
}

// ---- Reusable Modal ----
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-bold text-lg text-primary">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[85vh]">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- Upload Modal Component ----
import { openTabImperative } from './docTabs';

function inferFileType(filename = '') {
  const ext = filename.split('.').pop()?.toUpperCase() || 'DOC';
  return ext;
}

export function UploadModal({ open, onClose }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [tab, setTab] = useState("file");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { filename: 'pending'|'uploading'|'done'|'error' }
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    let active = true;

    const loadCollections = async () => {
      try {
        const data = await apiRequest("/collections");
        if (!active) return;
        const items = Array.isArray(data) ? data : [];
        setCollections(items);
        if (!selectedCollectionId && items.length > 0) {
          setSelectedCollectionId(String(items[0].collection_id));
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    };

    loadCollections();
    return () => {
      active = false;
    };
  }, [open, selectedCollectionId]);

  const submitUpload = async () => {
    if (!selectedFiles.length) {
      setError("Choose at least one file first.");
      return;
    }

    setUploading(true);
    setError("");

    const uploadPath = selectedCollectionId
      ? `/documents/upload?collection_id=${selectedCollectionId}`
      : "/documents/upload";

    // Initialize progress
    const initialProgress = {};
    selectedFiles.forEach(f => { initialProgress[f.name] = 'pending'; });
    setUploadProgress(initialProgress);

    // Upload in parallel; collect results in original order.
    const results = await Promise.all(selectedFiles.map(async (file) => {
      setUploadProgress(p => ({ ...p, [file.name]: 'uploading' }));
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiRequest(uploadPath, { method: "POST", body: formData });
        setUploadProgress(p => ({ ...p, [file.name]: 'done' }));
        return { ok: true, file, res };
      } catch (err) {
        setUploadProgress(p => ({ ...p, [file.name]: 'error' }));
        return { ok: false, file, error: err.message };
      }
    }));

    const successes = results.filter(r => r.ok);
    const failures = results.filter(r => !r.ok);

    // Open every successful upload as a tab.
    successes.forEach(({ file, res }) => {
      const id = res?.document_id || res?.id || res?.documentId;
      if (id) {
        openTabImperative({
          id,
          name: res?.filename || file.name,
          type: res?.file_type || inferFileType(file.name),
        });
      }
    });

    setUploading(false);

    if (failures.length === results.length) {
      setError(`All uploads failed: ${failures[0].error}`);
      return;
    }
    if (failures.length) {
      setError(`${failures.length} of ${results.length} uploads failed. Successful files were opened.`);
    }

    setSelectedFiles([]);
    setUploadProgress({});
    onClose();

    // Navigate to the first successfully uploaded doc, or library.
    const firstId = successes[0]?.res?.document_id || successes[0]?.res?.id || successes[0]?.res?.documentId;
    if (firstId) navigate(`/library/doc/${firstId}`);
    else navigate("/library");
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) setSelectedFiles(prev => [...prev, ...files]);
    setError("");
    if (event.target) event.target.value = ''; // allow re-selecting same file
  };

  const removeSelected = (name) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== name));
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Add to your library">
      <div className="p-4">
        <p className="text-on-surface-variant text-[11px] mb-4">Extract metadata and citations automatically.</p>
        {error && <div className="mb-4 rounded-lg border border-error/20 bg-error-container px-3 py-2 text-[11px] text-on-error-container">{error}</div>}
        
        <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
          <div className="flex border-b border-border-subtle bg-surface-container-lowest">
            {[{id:"file",label:"File",icon:"upload_file"},{id:"url",label:"URL",icon:"link"},{id:"doi",label:"DOI",icon:"format_quote"}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 px-4 py-2 text-xs flex items-center justify-center gap-2 transition-colors border-b-2 ${tab === t.id ? "border-primary text-primary font-bold bg-white" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
                <Icon name={t.icon} size={16} /> {t.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === "file" && (
              <div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(false);
                    const dropped = Array.from(e.dataTransfer.files || []);
                    if (dropped.length) { setSelectedFiles(prev => [...prev, ...dropped]); setError(""); }
                  }}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? "border-primary bg-secondary-container/30" : "border-border-subtle bg-surface-container-lowest"}`}>
                  <div className="w-10 h-10 rounded-full bg-secondary-container mx-auto flex items-center justify-center mb-3">
                    <Icon name="cloud_upload" filled className="text-primary" size={20} />
                  </div>
                  <p className="font-bold text-xs mb-1">Drop files here or browse</p>
                  <p className="text-[9px] text-on-surface-variant mb-3">Select multiple files — each opens in its own tab. PDF, DOCX, TXT up to 50MB each.</p>
                  <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white px-4 py-1.5 rounded-full text-[10px] font-bold">Choose Files</button>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 max-h-44 overflow-y-auto border border-border-subtle rounded-lg divide-y divide-border-subtle">
                    {selectedFiles.map(f => {
                      const status = uploadProgress[f.name];
                      return (
                        <div key={f.name} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                          <Icon name={status === 'done' ? 'check_circle' : status === 'error' ? 'error' : 'description'} size={14} className={status === 'done' ? 'text-success' : status === 'error' ? 'text-error' : 'text-on-surface-variant'} />
                          <span className="flex-1 truncate font-semibold">{f.name}</span>
                          <span className="text-[10px] text-on-surface-variant">{(f.size / 1024).toFixed(0)} KB</span>
                          {status === 'uploading' && <span className="text-[10px] text-primary font-bold">Uploading…</span>}
                          {status === 'done' && <span className="text-[10px] text-success font-bold">Done</span>}
                          {status === 'error' && <span className="text-[10px] text-error font-bold">Failed</span>}
                          {!status && (
                            <button onClick={() => removeSelected(f.name)} className="text-on-surface-variant hover:text-error">
                              <Icon name="close" size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {tab === "url" && (
              <div className="py-2 text-xs text-on-surface-variant">
                <label className="text-[10px] font-bold mb-1.5 block">Web URL</label>
                <input placeholder="https://arxiv.org/abs/2301.04267" className="w-full border border-border-subtle px-3 py-2 rounded-lg outline-none focus:border-primary mb-3 text-xs" />
                <button className="bg-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-bold" type="button">Fetch & Add</button>
                <p className="mt-2">URL import is available in the backend later; file upload is now connected.</p>
              </div>
            )}
            {tab === "doi" && (
              <div className="py-2 text-xs text-on-surface-variant">
                <label className="text-[10px] font-bold mb-1.5 block">DOI</label>
                <input placeholder="10.48550/arXiv.2301.04267" className="w-full border border-border-subtle px-3 py-2 rounded-lg outline-none focus:border-primary mb-3 font-mono text-xs" />
                <button className="bg-primary text-white px-4 py-1.5 rounded-lg text-[10px] font-bold" type="button">Resolve & Add</button>
                <p className="mt-2">DOI import remains a future enhancement; file upload is fully connected now.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-surface-container-lowest border-t border-border-subtle flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[11px]">
          <Icon name="folder" size={14} className="text-on-surface-variant" />
          <span className="text-on-surface-variant">Add to:</span>
          <select value={selectedCollectionId} onChange={e => setSelectedCollectionId(e.target.value)} className="px-2 py-1 border border-border-subtle rounded bg-white">
            <option value="">Inbox (default)</option>
            {collections.map(collection => (
              <option key={collection.collection_id} value={collection.collection_id}>{collection.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border-subtle text-[11px] font-bold hover:bg-surface-container-low">Cancel</button>
          <button onClick={submitUpload} disabled={uploading || !selectedFiles.length} className="px-4 py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:opacity-90 disabled:opacity-50">
            {uploading ? `Uploading ${selectedFiles.length}…` : selectedFiles.length > 1 ? `Upload ${selectedFiles.length} files` : selectedFiles.length === 1 ? 'Upload' : 'Done'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---- Comprehensive Search Data ----
const SEARCH_DATA = {
  documents: [
    { name: "Trustworthiness of AI in HRI", sub: "PDF • Oct 12 • L. Roberts", icon: "description", to: "/library/thesis/trust-ai-hri", category: "document" },
    { name: "Measuring Trust in HRC", sub: "PDF • Oct 10 • S. Jenkins", icon: "description", to: "/library/thesis/measuring-trust", category: "document" },
    { name: "Ethics of Large Language Models", sub: "DOC • Sep 28 • Dr. A. Turing", icon: "description", to: "/library/thesis/ethics-llm", category: "document" },
    { name: "Cognitive Load Theory in Digital Env.", sub: "PDF • Sep 24 • Sweller, Paas", icon: "description", to: "/library/thesis/cognitive-load", category: "document" },
    { name: "Hierarchical RAG Architecture", sub: "PDF • Sep 14 • Y. Tanaka", icon: "description", to: "/library/thesis/rag-arch", category: "document" },
    { name: "Neural Networks in LLMs.pdf", sub: "PDF • 4.2 MB", icon: "description", to: "/library", category: "document" },
    { name: "Thesis Proposal — Draft 3.docx", sub: "DOCX • 124 KB", icon: "article", to: "/library", category: "document" },
  ],
  collections: [
    { name: "ML Research", sub: "12 Documents • 4 Citations", icon: "folder", to: "/library", category: "collection" },
    { name: "Thesis Sources", sub: "28 Documents • 12 Citations", icon: "folder", to: "/library", category: "collection" },
    { name: "Dataset Refs", sub: "8 Documents • 1 Citation", icon: "folder", to: "/library", category: "collection" },
  ],
  workspaces: [
    { name: "Thesis — Spring '26", sub: "3 members • 42 docs", icon: "workspaces", to: "/workspaces/thesis", category: "workspace" },
    { name: "HCI Lab Group", sub: "8 members • 128 docs", icon: "workspaces", to: "/workspaces/hci-lab", category: "workspace" },
  ],
  pages: [
    { name: "Dashboard", sub: "Home", icon: "home", to: "/dashboard", category: "page" },
    { name: "Library", sub: "All documents", icon: "library_books", to: "/library", category: "page" },
    { name: "Settings", sub: "Account & preferences", icon: "settings", to: "/settings", category: "page" },
    { name: "Integrations", sub: "Connected apps", icon: "extension", to: "/integrations", category: "page" },
    { name: "Admin Panel", sub: "System management", icon: "admin_panel_settings", to: "/admin", category: "page" },
    { name: "Upload Documents", sub: "Add to library", icon: "upload_file", to: "/upload", category: "page" },
    { name: "Upgrade Plan", sub: "Pro & Lab plans", icon: "star", to: "/upgrade", category: "page" },
  ],
};

// ---- Enhanced Command Palette ----
export function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(""); setSelectedIdx(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [open]);

  const allItems = [...SEARCH_DATA.documents, ...SEARCH_DATA.collections, ...SEARCH_DATA.workspaces, ...SEARCH_DATA.pages];
  const filtered = q.trim()
    ? allItems.filter(x => x.name.toLowerCase().includes(q.toLowerCase()) || (x.sub && x.sub.toLowerCase().includes(q.toLowerCase())))
    : [];

  const grouped = {};
  filtered.forEach(item => {
    const cat = item.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const flatResults = q.trim() ? filtered : [];
  const catLabels = { document: "Documents", collection: "Collections", workspace: "Workspaces", page: "Pages" };

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatResults.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && flatResults[selectedIdx]) { navigate(flatResults[selectedIdx].to); onClose(); }
  }, [flatResults, selectedIdx, onClose]);

  if (!open) return null;

  const showRecents = !q.trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-border-subtle overflow-hidden animate-dropdown" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border-subtle flex items-center gap-3">
          <Icon name="search" className="text-on-surface-variant" />
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setSelectedIdx(0); }} onKeyDown={handleKeyDown} placeholder="Search documents, workspaces, pages..." className="w-full border-none focus:ring-0 text-body-main outline-none bg-transparent" />
          <span className="text-[10px] font-bold bg-surface-container px-2 py-1 rounded cursor-pointer hover:bg-surface-container-high" onClick={onClose}>ESC</span>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {showRecents ? (
            <>
              <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Recent Documents</div>
              {SEARCH_DATA.documents.slice(0, 3).map((r, i) => (
                <Link key={i} to={r.to} onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low group transition-colors">
                  <Icon name={r.icon} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                  <div className="flex-1"><p className="text-xs font-bold text-primary">{r.name}</p><p className="text-[10px] text-on-surface-variant">{r.sub}</p></div>
                  <span className="text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">↵</span>
                </Link>
              ))}
              <div className="px-3 py-2 mt-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Quick Actions</div>
              {SEARCH_DATA.pages.slice(0, 4).map((a, i) => (
                <Link key={i} to={a.to} onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low group transition-colors">
                  <Icon name={a.icon} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                  <span className="text-xs font-bold text-primary">{a.name}</span>
                  <span className="text-[10px] text-on-surface-variant ml-auto">{a.sub}</span>
                </Link>
              ))}
            </>
          ) : flatResults.length === 0 ? (
            <div className="py-12 text-center">
              <Icon name="search_off" className="text-on-surface-variant mb-2 block mx-auto" size={32} />
              <p className="text-xs text-on-surface-variant">No results for "{q}"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-3 py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{catLabels[cat] || cat}</div>
                {items.map((r, i) => {
                  const globalIdx = flatResults.indexOf(r);
                  return (
                    <Link key={i} to={r.to} onClick={onClose} className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${globalIdx === selectedIdx ? "bg-surface-container-low" : "hover:bg-surface-container-low"}`}>
                      <Icon name={r.icon} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                      <div className="flex-1"><p className="text-xs font-bold text-primary">{r.name}</p><p className="text-[10px] text-on-surface-variant">{r.sub}</p></div>
                      <span className="text-[10px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">↵</span>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="p-3 bg-surface-container-lowest border-t border-border-subtle flex justify-between text-[10px] text-on-surface-variant">
          <div className="flex gap-3">
            <span><kbd className="font-bold border px-1 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="font-bold border px-1 rounded">↵</kbd> select</span>
          </div>
          <span>{flatResults.length > 0 ? `${flatResults.length} results` : "Paper Trail Search v2.4"}</span>
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
export function Toggle({ defaultOn = false, onChange }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => { setOn(o => { const next = !o; if (onChange) onChange(next); return next; }); }} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-primary" : "bg-surface-container-high"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`}></span>
    </button>
  );
}
