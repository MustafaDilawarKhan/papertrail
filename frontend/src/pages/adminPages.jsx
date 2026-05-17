// Admin console pages
import React, { useState, useEffect } from 'react';
import { Link, Icon, navigate, useRoute } from '../shared/components';
import { Toggle } from './authPages';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../apiConfig';

const useStateAdmin = useState;
const useEffectAdmin = useEffect;

// Tiny helper — same shape as elsewhere in the app.
function formatRelativeTimeAdmin(value) {
  if (!value) return "";
  const d = new Date(value);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---- Admin Sidebar ----
function AdminSidebar({ active, mobileOpen, onMobileClose }) {
  const { logout } = useAuth();
  const handleSignOut = () => {
    if (!window.confirm("Sign out of the admin dashboard?")) return;
    logout();
    navigate("/login");
  };
  const items = [
    { id: "overview", label: "Overview", icon: "dashboard", to: "/admin" },
    { id: "users", label: "Users", icon: "group", to: "/admin/users" },
    { id: "models", label: "Models", icon: "smart_toy", to: "/admin/models" },
    { id: "flags", label: "Feature Flags", icon: "flag", to: "/admin/flags" },
    { id: "logs", label: "Audit Logs", icon: "receipt_long", to: "/admin/logs" },
    { id: "health", label: "System Health", icon: "monitoring", to: "/admin/health" },
  ];
  const mobileTransform = mobileOpen ? "translate-x-0" : "-translate-x-full";
  return (
    <>
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="md:hidden fixed inset-0 bg-black/40 z-30 transition-opacity"
        />
      )}
      <aside className={`fixed left-0 top-0 h-screen w-sidebar-width bg-[#1a1a1c] text-white flex flex-col p-4 gap-4 z-40 transition-transform duration-300 ${mobileTransform} md:translate-x-0`}>
        <div className="px-2 mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-hero-headline font-extrabold tracking-tight text-lg text-white">Paper Trail</span>
            <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Admin</span>
          </div>
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <nav className="flex flex-col gap-1 flex-grow">
          {items.map(it => {
            const isActive = active === it.id;
            return (
              <Link key={it.id} to={it.to} onClick={onMobileClose} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                <Icon name={it.icon} filled={isActive} />
                <span className="text-body-main">{it.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Region</p>
          <p className="text-xs font-bold flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> us-east-1 · Healthy</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/5 rounded transition-colors text-left"
        >
          <Icon name="logout" size={16} /> Sign out
        </button>
      </aside>
    </>
  );
}

function AdminShell({ active, breadcrumbs, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useStateAdmin(false);
  const route = useRoute();
  // Close drawer when the user navigates.
  useEffectAdmin(() => { setMobileNavOpen(false); }, [route]);

  return (
    <div className="min-h-screen bg-background-primary">
      <AdminSidebar
        active={active}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />
      <header className="fixed top-0 right-0 left-0 md:left-auto w-full md:w-[calc(100%-240px)] h-16 bg-background-primary border-b border-border-subtle flex justify-between items-center px-container-padding z-30">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden mr-2 p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant"
          aria-label="Open menu"
        >
          <Icon name="menu" size={22} />
        </button>
        <nav className="hidden md:flex items-center gap-2 font-breadcrumb text-breadcrumb">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon name="chevron_right" className="text-[14px] text-on-surface-variant" />}
              {b.to ? <Link to={b.to} className="text-on-surface-variant hover:text-primary">{b.label}</Link> : <span className="text-primary font-bold">{b.label}</span>}
            </React.Fragment>
          ))}
        </nav>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-error-container text-error rounded">PRODUCTION</span>
        </div>
      </header>
      <main className="ml-0 md:ml-sidebar-width pt-16 min-h-screen">
        <div className="px-container-padding py-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

// =================== ADMIN OVERVIEW ===================
// Password input with an eye-toggle that flips the input type between
// "password" and "text" so the admin can verify what they typed.
function PasswordField({ value, onChange, visible, onToggleVisible, autoComplete, required, minLength }) {
  return (
    <div className="relative mb-3">
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pr-10 px-3 py-2 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-on-surface-variant hover:bg-surface-container-low transition-colors"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} size={18} />
      </button>
    </div>
  );
}

// Small card on the admin overview that lets the signed-in admin rotate their
// own password without leaving the admin section. Hits the existing
// `/api/auth/password` endpoint.
function ChangePasswordCard() {
  const [current, setCurrent] = useStateAdmin("");
  const [next, setNext] = useStateAdmin("");
  const [confirm, setConfirm] = useStateAdmin("");
  const [showCurrent, setShowCurrent] = useStateAdmin(false);
  const [showNext, setShowNext] = useStateAdmin(false);
  const [showConfirm, setShowConfirm] = useStateAdmin(false);
  const [busy, setBusy] = useStateAdmin(false);
  const [status, setStatus] = useStateAdmin(null); // { kind: "ok"|"err", msg }

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setStatus(null);
    if (next.length < 6) { setStatus({ kind: "err", msg: "New password must be at least 6 characters." }); return; }
    if (next !== confirm) { setStatus({ kind: "err", msg: "New passwords don't match." }); return; }
    if (next === current) { setStatus({ kind: "err", msg: "New password must differ from current." }); return; }

    setBusy(true);
    try {
      await apiRequest("/auth/password", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      setStatus({ kind: "ok", msg: "Password changed. Use the new one next time you sign in." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setStatus({ kind: "err", msg: err.message || "Could not change password." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white border border-border-subtle rounded-xl p-6">
      <h3 className="font-card-title text-card-title mb-1">My account</h3>
      <p className="text-[11px] text-on-surface-variant mb-4">Change the password for your admin account.</p>

      <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Current password</label>
      <PasswordField
        value={current}
        onChange={setCurrent}
        visible={showCurrent}
        onToggleVisible={() => setShowCurrent(v => !v)}
        autoComplete="current-password"
        required
      />

      <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">New password</label>
      <PasswordField
        value={next}
        onChange={setNext}
        visible={showNext}
        onToggleVisible={() => setShowNext(v => !v)}
        autoComplete="new-password"
        required
        minLength={6}
      />

      <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Confirm new password</label>
      <PasswordField
        value={confirm}
        onChange={setConfirm}
        visible={showConfirm}
        onToggleVisible={() => setShowConfirm(v => !v)}
        autoComplete="new-password"
        required
        minLength={6}
      />

      {status && (
        <p className={`text-xs mb-3 ${status.kind === "ok" ? "text-green-700" : "text-error"}`}>
          {status.msg}
        </p>
      )}

      <button
        type="submit" disabled={busy}
        className="w-full bg-primary text-on-primary text-xs font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}

function AdminOverviewPage() {
  const [stats, setStats] = useStateAdmin(null);
  const [activity, setActivity] = useStateAdmin([]);
  const [loading, setLoading] = useStateAdmin(true);
  const [error, setError] = useStateAdmin("");

  useEffectAdmin(() => {
    let active = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([
          apiRequest("/admin/stats"),
          apiRequest("/admin/activity?limit=8"),
        ]);
        if (!active) return;
        setStats(s);
        setActivity(Array.isArray(a) ? a : []);
      } catch (err) {
        if (active) setError(err.message || "Could not load admin data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.users.total, sub: `${stats.users.verified} verified · ${stats.users.admins} admin`, icon: "group" },
    { label: "Documents", value: stats.documents.total, sub: `${stats.documents.with_extracted_text} ready for AI`, icon: "description" },
    { label: "Papers Written", value: stats.papers?.total ?? 0, sub: `${stats.papers?.authors ?? 0} authors · ${stats.papers?.new_24h ?? 0} new in 24h`, icon: "draft" },
    { label: "AI Messages (24h)", value: stats.chats.messages_24h, sub: `${stats.chats.sessions} sessions all-time`, icon: "smart_toy" },
    { label: "Workspaces", value: stats.workspaces.total, sub: `${stats.users.new_24h} new users today`, icon: "workspaces" },
  ] : [];

  return (
    <AdminShell active="overview" breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}>
      <h1 className="font-section-heading text-section-heading text-primary mb-2">System Overview</h1>
      <p className="text-on-surface-variant mb-8">Live platform metrics, served from the Supabase database.</p>

      {loading && <p className="text-sm text-on-surface-variant">Loading…</p>}
      {error && <p className="text-sm text-error mb-4">Error: {error}</p>}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {cards.map((s, i) => (
            <div key={i} className="bg-white border border-border-subtle p-5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <Icon name={s.icon} className="text-on-surface-variant" />
              </div>
              <p className="text-2xl font-bold text-primary">{s.value.toLocaleString()}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">{s.label}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5 opacity-70">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      {stats?.timeseries && (
        <div className="grid grid-cols-12 gap-6 mb-6">
          <div className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl p-6">
            <h3 className="font-card-title text-card-title mb-1">Signups · last 14 days</h3>
            <p className="text-[11px] text-on-surface-variant mb-4">New accounts per day</p>
            <BarChart series={stats.timeseries.signups} color="#16a34a" />
          </div>
          <div className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl p-6">
            <h3 className="font-card-title text-card-title mb-1">AI messages · last 14 days</h3>
            <p className="text-[11px] text-on-surface-variant mb-4">Chat usage per day</p>
            <BarChart series={stats.timeseries.messages} color="#7c3aed" />
          </div>
          <div className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl p-6">
            <h3 className="font-card-title text-card-title mb-1">Plan distribution</h3>
            <p className="text-[11px] text-on-surface-variant mb-4">Active subscriptions by tier</p>
            <PlanBar distribution={stats.plan_distribution} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4">
          <ChangePasswordCard />
        </div>
        <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-xl p-6">
          <h3 className="font-card-title text-card-title mb-1">Recent activity</h3>
          <p className="text-[11px] text-on-surface-variant mb-5">Last platform-wide events. Newest first.</p>
          {activity.length === 0 && !loading && (
            <p className="text-xs text-on-surface-variant">No activity yet.</p>
          )}
          <div className="space-y-3">
            {activity.map((ev, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] flex-shrink-0
                  ${ev.kind === "signup" ? "bg-green-50 text-green-700"
                    : ev.kind === "upload" ? "bg-blue-50 text-blue-700"
                    : "bg-purple-50 text-purple-700"}`}>
                  <Icon name={ev.kind === "signup" ? "person_add" : ev.kind === "upload" ? "upload_file" : "forum"} size={14} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm"><span className="font-bold">{ev.actor}</span> {ev.summary}</p>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{formatRelativeTimeAdmin(ev.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

// Daily bar chart for a `[{date, count}, ...]` timeseries.
// Uses real HTML/CSS layout (not a stretched SVG) so the bars stay a sensible
// thickness regardless of card width, and so we can put value labels above
// each bar. Zero-days render as a thin grey baseline so the eye still groups
// them with the rest of the series instead of looking like "missing data".
function BarChart({ series, color }) {
  const safe = Array.isArray(series) ? series : [];
  const total = safe.reduce((a, p) => a + (p.count || 0), 0);
  const max = Math.max(1, ...safe.map(p => p.count || 0));

  return (
    <div>
      <div className="relative h-36 flex items-end gap-[3px] pb-5">
        {/* baseline */}
        <div className="absolute left-0 right-0 bottom-5 h-px bg-border-subtle" />
        {safe.map((p, i) => {
          const heightPct = p.count === 0 ? 0 : Math.max(6, (p.count / max) * 100);
          const dayLabel  = p.date.slice(8);   // DD
          const monthDay  = p.date.slice(5);   // MM-DD
          const showXLabel = i === 0 || i === safe.length - 1 || i === Math.floor(safe.length / 2);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative" title={`${p.date}: ${p.count}`}>
              {/* value label above the bar (only when non-zero, so it doesn't clutter) */}
              {p.count > 0 && (
                <span className="text-[9px] font-bold text-on-surface mb-0.5 tabular-nums">{p.count}</span>
              )}
              {/* the bar */}
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: p.count === 0 ? "transparent" : color,
                  minHeight: p.count === 0 ? 1 : 4,
                  border: p.count === 0 ? "1px dashed #e5e7eb" : "none",
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                }}
              />
              {/* date axis tick (only some show to avoid label collision) */}
              <span className={`absolute -bottom-0.5 text-[9px] tabular-nums ${showXLabel ? "text-on-surface-variant" : "text-transparent"}`}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[10px] text-on-surface-variant mt-2 px-0.5">
        <span>{safe.length > 0 ? safe[0].date : ""}</span>
        <span className="font-bold tabular-nums">{total} total · peak {max}</span>
        <span>{safe.length > 0 ? safe[safe.length - 1].date : ""}</span>
      </div>
    </div>
  );
}

// Plan distribution as a single horizontal stacked bar with a legend below.
// Shows percentages alongside raw counts so the admin can read at a glance.
function PlanBar({ distribution }) {
  const dist = distribution || {};
  const total = Object.values(dist).reduce((a, b) => a + (b || 0), 0);
  const segments = [
    { key: "Free", color: "#9ca3af" },
    { key: "Plus", color: "#3b82f6" },
    { key: "Pro",  color: "#15130f" },
  ];
  const denom = total || 1;
  return (
    <div>
      <div className="w-full h-4 rounded-full overflow-hidden bg-surface-container-high flex shadow-inner">
        {segments.map(s => {
          const n = dist[s.key] || 0;
          const pct = (n / denom) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, background: s.color }}
              title={`${s.key}: ${n} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-4 space-y-2">
        {segments.map(s => {
          const n = dist[s.key] || 0;
          const pct = total > 0 ? (n / total) * 100 : 0;
          return (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                <span className="font-bold">{s.key}</span>
                <span className="text-on-surface-variant">{pct.toFixed(0)}%</span>
              </span>
              <span className="tabular-nums font-bold text-on-surface">{n}</span>
            </div>
          );
        })}
        <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>Total users</span>
          <span className="tabular-nums font-bold">{total}</span>
        </div>
      </div>
    </div>
  );
}

// =================== ADMIN USERS ===================
function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useStateAdmin([]);
  const [loading, setLoading] = useStateAdmin(true);
  const [error, setError] = useStateAdmin("");
  const [q, setQ] = useStateAdmin("");
  const [planFilter, setPlanFilter] = useStateAdmin("all"); // all | Free | Plus | Pro
  const [verifiedFilter, setVerifiedFilter] = useStateAdmin("all"); // all | verified | unverified
  // Selection for bulk operations. Stored as a Set of user_id strings so the
  // selection survives filter changes that hide/show rows.
  const [selectedIds, setSelectedIds] = useStateAdmin(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useStateAdmin(false);
  const [bulkPlanBusy, setBulkPlanBusy] = useStateAdmin(false);

  useEffectAdmin(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiRequest("/admin/users?limit=500");
        if (active) setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message || "Could not load users");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const changePlan = async (u, nextPlan) => {
    if (!nextPlan || nextPlan === u.plan) return;
    try {
      const result = await apiRequest(`/admin/users/${u.user_id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: nextPlan }),
      });
      setUsers(prev => prev.map(x => x.user_id === u.user_id ? { ...x, plan: result.plan } : x));
    } catch (err) {
      window.alert(err.message || "Could not change plan");
    }
  };

  // ---- selection + delete helpers ----
  const isSelectable = (u) => me?.user_id !== u.user_id; // can't select self
  const toggleSelect = (u) => {
    if (!isSelectable(u)) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(u.user_id)) next.delete(u.user_id);
      else next.add(u.user_id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const deleteSingle = async (u) => {
    if (!window.confirm(`Permanently delete ${u.email} and all their data?\n\nThis cascades to:\n• documents + uploaded files\n• chat sessions + messages\n• workspaces, collections, citations, annotations\n• notifications + subscription\n\nThis cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/users/${u.user_id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(u.user_id); return n; });
    } catch (err) {
      window.alert(err.message || "Could not delete user");
    }
  };

  const deleteSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Permanently delete ${ids.length} user${ids.length === 1 ? "" : "s"}?\n\nEvery selected account's documents, chats, workspaces and uploaded files will be removed. This cannot be undone.`)) return;

    setBulkDeleting(true);
    // Fire all deletes in parallel; collect failures so we can report.
    const results = await Promise.all(ids.map(async id => {
      try {
        await apiRequest(`/admin/users/${id}`, { method: "DELETE" });
        return { id, ok: true };
      } catch (err) {
        return { id, ok: false, error: err.message || String(err) };
      }
    }));
    const okIds = new Set(results.filter(r => r.ok).map(r => r.id));
    const failed = results.filter(r => !r.ok);

    setUsers(prev => prev.filter(u => !okIds.has(u.user_id)));
    setSelectedIds(prev => {
      const n = new Set(prev);
      okIds.forEach(id => n.delete(id));
      return n;
    });
    setBulkDeleting(false);

    if (failed.length > 0) {
      const userById = new Map(users.map(u => [u.user_id, u]));
      const lines = failed.map(f => `• ${userById.get(f.id)?.email || f.id}: ${f.error}`).join("\n");
      window.alert(`Deleted ${okIds.size} of ${ids.length}. The following could not be removed:\n\n${lines}`);
    }
  };

  // ---- Bulk plan change ----
  // Fires PATCH /admin/users/:id/plan in parallel for every selected user.
  // Per-user failures are collected and reported in a single alert; rows
  // that succeeded update their plan badge inline without a full refetch.
  const bulkChangePlan = async (nextPlan) => {
    const ids = [...selectedIds];
    if (ids.length === 0 || !nextPlan) return;
    if (!window.confirm(`Change ${ids.length} user${ids.length === 1 ? "" : "s"} to the ${nextPlan} plan?`)) return;
    setBulkPlanBusy(true);
    const results = await Promise.all(ids.map(async id => {
      try {
        const r = await apiRequest(`/admin/users/${id}/plan`, {
          method: "PATCH",
          body: JSON.stringify({ plan: nextPlan }),
        });
        return { id, ok: true, plan: r.plan };
      } catch (err) {
        return { id, ok: false, error: err.message || String(err) };
      }
    }));
    const okMap = new Map(results.filter(r => r.ok).map(r => [r.id, r.plan]));
    setUsers(prev => prev.map(u => okMap.has(u.user_id) ? { ...u, plan: okMap.get(u.user_id) } : u));
    setBulkPlanBusy(false);
    const failed = results.filter(r => !r.ok);
    if (failed.length > 0) {
      const userById = new Map(users.map(u => [u.user_id, u]));
      const lines = failed.map(f => `• ${userById.get(f.id)?.email || f.id}: ${f.error}`).join("\n");
      window.alert(`Updated ${okMap.size} of ${ids.length}. The following failed:\n\n${lines}`);
    }
  };

  const filtered = users.filter(u => {
    if (q) {
      const needle = q.toLowerCase();
      const hay = `${u.name || ""} ${u.email || ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (planFilter !== "all") {
      const plan = u.plan || "Free";
      if (plan !== planFilter) return false;
    }
    if (verifiedFilter === "verified" && !u.email_verified) return false;
    if (verifiedFilter === "unverified" && u.email_verified) return false;
    return true;
  });

  return (
    <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Users</h1>
          <p className="text-on-surface-variant">
            {loading ? "Loading…"
              : `${users.length} registered · ${users.filter(u => u.plan === "Pro").length} Pro · ${users.filter(u => u.plan === "Plus").length} Plus · ${users.filter(u => u.plan === "Free" || !u.plan).length} Free`}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-error mb-4">Error: {error}</p>}

      {/* Sticky bulk action bar — only visible when at least one row is selected. */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 bg-primary text-on-primary rounded-xl px-4 py-3 flex items-center justify-between shadow-lg flex-wrap gap-2">
          <div className="flex items-center gap-3 text-sm">
            <Icon name="check_circle" filled size={18} />
            <b>{selectedIds.size}</b> user{selectedIds.size === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bulk plan change — commits the moment a plan is picked, then
                resets so picking the same plan again is possible. */}
            <select
              value=""
              onChange={(e) => { const v = e.target.value; e.target.value = ""; if (v) bulkChangePlan(v); }}
              disabled={bulkPlanBusy || bulkDeleting}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 cursor-pointer hover:bg-white/20 disabled:opacity-50"
              title="Change plan for all selected users"
            >
              <option value="" className="text-on-surface">{bulkPlanBusy ? "Updating…" : "Change plan to…"}</option>
              <option value="Free" className="text-on-surface">Free</option>
              <option value="Plus" className="text-on-surface">Plus</option>
              <option value="Pro"  className="text-on-surface">Pro</option>
            </select>
            <button
              onClick={clearSelection}
              disabled={bulkDeleting || bulkPlanBusy}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={deleteSelected}
              disabled={bulkDeleting || bulkPlanBusy}
              className="text-xs px-3 py-1.5 rounded-lg bg-error text-white font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Icon name="delete" size={14} />
              {bulkDeleting ? "Deleting…" : `Delete ${selectedIds.size}`}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface-container-lowest border border-border-subtle rounded-lg px-3 py-2">
            <Icon name="search" size={18} className="text-on-surface-variant" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email..." className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
            title="Filter by plan"
          >
            <option value="all">All plans</option>
            <option value="Free">Free</option>
            <option value="Plus">Plus</option>
            <option value="Pro">Pro</option>
          </select>
          <select
            value={verifiedFilter}
            onChange={e => setVerifiedFilter(e.target.value)}
            className="text-xs font-bold px-3 py-2 border border-border-subtle rounded-lg bg-white cursor-pointer"
            title="Filter by verification"
          >
            <option value="all">All users</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-container-lowest">
              <th className="px-4 py-3 text-left w-10">
                {/* Select-all checkbox: selects every CURRENTLY-VISIBLE selectable row */}
                {(() => {
                  const selectableFiltered = filtered.filter(isSelectable);
                  const allSelected = selectableFiltered.length > 0
                    && selectableFiltered.every(u => selectedIds.has(u.user_id));
                  const someSelected = selectableFiltered.some(u => selectedIds.has(u.user_id));
                  return (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(prev => {
                            const n = new Set(prev);
                            selectableFiltered.forEach(u => n.add(u.user_id));
                            return n;
                          });
                        } else {
                          setSelectedIds(prev => {
                            const n = new Set(prev);
                            selectableFiltered.forEach(u => n.delete(u.user_id));
                            return n;
                          });
                        }
                      }}
                      className="w-4 h-4 cursor-pointer"
                      title="Select all visible (except your own account)"
                    />
                  );
                })()}
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">User</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Affiliation</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Docs</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Chats</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Verified</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Last active</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Joined</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Plan</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filtered.map((u) => (
              <tr
                key={u.user_id}
                className={`hover:bg-surface-container-low group ${selectedIds.has(u.user_id) ? "bg-secondary-container/40" : ""}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.user_id)}
                    onChange={() => toggleSelect(u)}
                    disabled={!isSelectable(u)}
                    title={isSelectable(u) ? "Select this user" : "You cannot select your own account"}
                    className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold">
                      {(u.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{u.name || "(no name)"}</p>
                      <p className="text-[11px] text-on-surface-variant">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">{u.affiliation || "—"}</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">{u.doc_count}</td>
                <td className="px-4 py-3 text-sm text-right tabular-nums">{u.chat_count}</td>
                <td className="px-4 py-3">
                  {u.email_verified
                    ? <span className="inline-flex items-center gap-1.5 text-xs text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Yes</span>
                    : <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />No</span>}
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">
                  {u.last_active ? formatRelativeTimeAdmin(u.last_active) : <span className="text-on-surface-variant/50">never</span>}
                </td>
                <td className="px-4 py-3 text-xs text-on-surface-variant">{u.created_at ? formatRelativeTimeAdmin(u.created_at) : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {u.is_admin ? (
                    // The platform admin is a fixed role — not a tier and
                    // not changeable from this list. Just label it.
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-primary text-white inline-flex items-center gap-1">
                      <Icon name="shield" size={12} /> Admin
                    </span>
                  ) : (
                    <select
                      value={u.plan || "Free"}
                      onChange={e => changePlan(u, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary
                        ${u.plan === "Pro" ? "bg-primary text-white border-primary"
                          : u.plan === "Plus" ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                          : "bg-surface-container-high text-on-surface border-border-subtle"}`}
                    >
                      <option value="Free">Free</option>
                      <option value="Plus">Plus</option>
                      <option value="Pro">Pro</option>
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {/* Per-row delete. Disabled for your own account; the backend
                      will additionally refuse the last admin. */}
                  <button
                    onClick={() => deleteSingle(u)}
                    disabled={!isSelectable(u)}
                    title={isSelectable(u) ? "Delete this user" : "You cannot delete your own account"}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-on-surface-variant">No users match the search.</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">Showing {filtered.length} of {users.length}</span>
        </div>
      </div>
    </AdminShell>
  );
}

// =================== ADMIN MODELS ===================
function AdminModelsPage() {
  return (
    <AdminShell active="models" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Models" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">AI Models</h1>
          <p className="text-on-surface-variant">Configure routing, fallback chains, and rate limits.</p>
          <p className="text-[11px] text-on-surface-variant mt-2 px-2 py-1 inline-block bg-yellow-50 border border-yellow-200 rounded">Demo view — real model chain lives in <code>backend/.env</code> (<code>OPENROUTER_MODEL</code> + <code>OPENROUTER_FALLBACK_MODELS</code>).</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-2"><Icon name="add" size={16} /> Add Model</button>
      </div>

      <div className="space-y-4">
        {[
          { name: "Paper Trail Balanced", id: "paper-trail-balanced-v3", status: "Active", traffic: 62, p95: "1.4s", err: "0.02%", default: true },
          { name: "Paper Trail Rigor", id: "paper-trail-rigor-v2", status: "Active", traffic: 24, p95: "3.8s", err: "0.01%" },
          { name: "Paper Trail Fast", id: "paper-trail-fast-v4", status: "Active", traffic: 14, p95: "0.6s", err: "0.04%" },
          { name: "Paper Trail Experimental", id: "paper-trail-exp-v5-canary", status: "Canary", traffic: 0.5, p95: "1.1s", err: "0.12%" },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-border-subtle rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center"><Icon name="smart_toy" filled className="text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{m.name}</h3>
                    {m.default && <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">DEFAULT</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${m.status === "Active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{m.status}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-mono">{m.id}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low">Configure</button>
                <button className="p-1.5 rounded-lg border border-border-subtle hover:bg-surface-container-low"><Icon name="more_horiz" size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-subtle">
              <div><p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Traffic</p><p className="text-lg font-bold tabular-nums">{m.traffic}%</p></div>
              <div><p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">p95 latency</p><p className="text-lg font-bold tabular-nums">{m.p95}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Error rate</p><p className="text-lg font-bold tabular-nums">{m.err}</p></div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

// =================== ADMIN FLAGS ===================
function AdminFlagsPage() {
  const flags = [
    { name: "hierarchical-rag-v2", desc: "New retrieval cascade with reranker", state: "On", rollout: "100%", updated: "Today, 09:14" },
    { name: "agent-mentions", desc: "@search_web, @summarize_web in chat", state: "Rollout", rollout: "35%", updated: "Yesterday" },
    { name: "annotation-suggestions", desc: "AI-suggested highlights on PDF open", state: "Off", rollout: "0%", updated: "3d ago" },
    { name: "team-billing-portal", desc: "Self-serve seat management", state: "Lab Only", rollout: "Lab plan", updated: "1w ago" },
    { name: "experimental-canary", desc: "Paper Trail Experimental v5 routing", state: "Rollout", rollout: "0.5%", updated: "12h ago" },
  ];
  return (
    <AdminShell active="flags" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Feature Flags" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Feature Flags</h1>
          <p className="text-on-surface-variant">Control feature rollouts across users, plans, and regions.</p>
          <p className="text-[11px] text-on-surface-variant mt-2 px-2 py-1 inline-block bg-yellow-50 border border-yellow-200 rounded">Demo view — there is no feature-flag system wired into the backend yet.</p>
        </div>
      </div>
      <div className="bg-white border border-border-subtle rounded-xl divide-y divide-border-subtle">
        {flags.map((f, i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-sm font-bold">{f.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${f.state === "On" ? "bg-green-50 text-green-700" : f.state === "Off" ? "bg-surface-container-high text-on-surface-variant" : "bg-yellow-50 text-yellow-700"}`}>{f.state}</span>
              </div>
              <p className="text-xs text-on-surface-variant">{f.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums">{f.rollout}</p>
              <p className="text-[10px] text-on-surface-variant">Updated {f.updated}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low">Edit</button>
              <Toggle defaultOn={f.state === "On" || f.state === "Rollout"} />
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

// =================== ADMIN LOGS ===================
function AdminLogsPage() {
  const [events, setEvents] = useStateAdmin([]);
  const [loading, setLoading] = useStateAdmin(true);
  const [error, setError] = useStateAdmin("");
  const [kindFilter, setKindFilter] = useStateAdmin("all"); // all | signup | upload | chat
  const [actorQ, setActorQ] = useStateAdmin("");

  useEffectAdmin(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiRequest("/admin/activity?limit=400");
        if (active) setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.message || "Could not load activity");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const colorFor = (kind) => kind === "signup" ? "text-green-400" : kind === "upload" ? "text-blue-300" : "text-purple-300";

  const filtered = events.filter(ev => {
    if (kindFilter !== "all" && ev.kind !== kindFilter) return false;
    if (actorQ && !(ev.actor || "").toLowerCase().includes(actorQ.toLowerCase())) return false;
    return true;
  });

  // Counts per kind for the filter chips so the admin can see distribution at a glance.
  const counts = events.reduce((acc, ev) => {
    acc[ev.kind] = (acc[ev.kind] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminShell active="logs" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Activity" }]}>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Activity</h1>
          <p className="text-on-surface-variant">Signups, document uploads, and chat sessions across the platform.</p>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {[
          { id: "all",    label: "All",     n: events.length },
          { id: "signup", label: "Signups", n: counts.signup || 0 },
          { id: "upload", label: "Uploads", n: counts.upload || 0 },
          { id: "chat",   label: "Chats",   n: counts.chat   || 0 },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setKindFilter(f.id)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-2 ${
              kindFilter === f.id
                ? "bg-primary text-white border-primary"
                : "bg-white border-border-subtle text-on-surface hover:bg-surface-container-low"
            }`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${kindFilter === f.id ? "bg-white/20" : "bg-surface-container-high text-on-surface-variant"}`}>{f.n}</span>
          </button>
        ))}
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white border border-border-subtle rounded-lg px-3 py-1.5">
          <Icon name="search" size={16} className="text-on-surface-variant" />
          <input
            value={actorQ}
            onChange={e => setActorQ(e.target.value)}
            placeholder="Filter by actor email…"
            className="flex-1 bg-transparent outline-none text-xs"
          />
        </div>
      </div>

      {error && <p className="text-sm text-error mb-4">Error: {error}</p>}
      <div className="bg-[#0d0d0e] text-white rounded-xl border border-border-subtle overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-white/50">
          <span className="w-32">TIME</span>
          <span className="w-20">KIND</span>
          <span className="w-56">ACTOR</span>
          <span className="flex-1">SUMMARY</span>
        </div>
        <div className="divide-y divide-white/5 max-h-[70vh] overflow-y-auto">
          {filtered.map((ev, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-xs font-mono hover:bg-white/5">
              <span className="w-32 text-white/40">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : "—"}</span>
              <span className={`w-20 ${colorFor(ev.kind)}`}>{ev.kind}</span>
              <span className="w-56 text-white/70 truncate">{ev.actor}</span>
              <span className="flex-1 text-white/60">{ev.summary}</span>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-white/40">
              {events.length === 0 ? "No activity yet." : "No events match the current filter."}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

// =================== ADMIN HEALTH ===================
function AdminHealthPage() {
  const [checks, setChecks] = useStateAdmin([]);
  const [loading, setLoading] = useStateAdmin(true);
  const [error, setError] = useStateAdmin("");

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/health");
      setChecks(Array.isArray(data?.checks) ? data.checks : []);
    } catch (err) {
      setError(err.message || "Health check failed");
    } finally {
      setLoading(false);
    }
  };

  useEffectAdmin(() => { refresh(); }, []);

  const statusColor = (s) => s === "ok" ? "bg-green-500" : s === "degraded" ? "bg-yellow-500" : "bg-error";
  const statusText  = (s) => s === "ok" ? "text-green-700" : s === "degraded" ? "text-yellow-700" : "text-error";

  return (
    <AdminShell active="health" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "System Health" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">System Health</h1>
          <p className="text-on-surface-variant">Live checks against the database, storage, and AI provider.</p>
        </div>
        <button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low flex items-center gap-2 disabled:opacity-50">
          <Icon name="refresh" size={16} /> {loading ? "Checking…" : "Refresh"}
        </button>
      </div>

      {error && <p className="text-sm text-error mb-4">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((c, i) => (
          <div key={i} className="bg-white border border-border-subtle rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor(c.status)}`}></span>
                <p className="font-bold">{c.name}</p>
              </div>
              <span className={`text-xs font-bold uppercase ${statusText(c.status)}`}>{c.status}</span>
            </div>
            <p className="text-sm text-on-surface-variant">{c.detail}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

export { AdminOverviewPage, AdminUsersPage, AdminModelsPage, AdminFlagsPage, AdminLogsPage, AdminHealthPage };
