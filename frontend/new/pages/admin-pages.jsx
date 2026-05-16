// Admin console pages
const { useState: useStateAdmin } = React;

// ---- Admin Sidebar ----
function AdminSidebar({ active }) {
  const items = [
    { id: "overview", label: "Overview", icon: "dashboard", to: "/admin" },
    { id: "users", label: "Users", icon: "group", to: "/admin/users" },
    { id: "models", label: "Models", icon: "smart_toy", to: "/admin/models" },
    { id: "flags", label: "Feature Flags", icon: "flag", to: "/admin/flags" },
    { id: "logs", label: "Audit Logs", icon: "receipt_long", to: "/admin/logs" },
    { id: "health", label: "System Health", icon: "monitoring", to: "/admin/health" },
  ];
  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-[#1a1a1c] text-white flex flex-col p-4 gap-4 z-40">
      <div className="px-2 mb-2 flex items-center gap-2">
        <span className="font-hero-headline font-extrabold tracking-tight text-lg text-white">Paper Trail</span>
        <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Admin</span>
      </div>
      <nav className="flex flex-col gap-1 flex-grow">
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <Link key={it.id} to={it.to} className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${isActive ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
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
      <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white">
        <Icon name="logout" size={16} /> Exit admin
      </Link>
    </aside>
  );
}

function AdminShell({ active, breadcrumbs, children }) {
  return (
    <div className="min-h-screen bg-background-primary">
      <AdminSidebar active={active} />
      <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-background-primary border-b border-border-subtle flex justify-between items-center px-container-padding z-30">
        <nav className="flex items-center gap-2 font-breadcrumb text-breadcrumb">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon name="chevron_right" className="text-[14px] text-on-surface-variant" />}
              {b.to ? <Link to={b.to} className="text-on-surface-variant hover:text-primary">{b.label}</Link> : <span className="text-primary font-bold">{b.label}</span>}
            </React.Fragment>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-error-container text-error rounded">PRODUCTION</span>
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">MD</div>
        </div>
      </header>
      <main className="ml-sidebar-width pt-16 min-h-screen">
        <div className="px-container-padding py-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

// =================== ADMIN OVERVIEW ===================
function AdminOverviewPage() {
  const stats = [
    { label: "Active Users (DAU)", value: "12,847", delta: "+8.2%", up: true, icon: "trending_up" },
    { label: "Documents Indexed", value: "2.4M", delta: "+124K", up: true, icon: "description" },
    { label: "AI Queries (24h)", value: "184,302", delta: "-2.1%", up: false, icon: "smart_toy" },
    { label: "Avg Response Time", value: "1.4s", delta: "+0.2s", up: false, icon: "schedule" },
  ];

  // Sparkline-ish chart data
  const sample = [12, 18, 15, 22, 28, 24, 30, 35, 32, 38, 42, 40, 45, 50, 48];
  const max = Math.max(...sample);

  return (
    <AdminShell active="overview" breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}>
      <h1 className="font-section-heading text-section-heading text-primary mb-2">System Overview</h1>
      <p className="text-on-surface-variant mb-8">Real-time platform health and usage metrics.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-border-subtle p-5 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <Icon name={s.icon} className="text-on-surface-variant" />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.up ? "bg-green-50 text-green-700" : "bg-error-container text-error"}`}>{s.delta}</span>
            </div>
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-[11px] text-on-surface-variant mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white border border-border-subtle rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-card-title text-card-title">AI Query Volume</h3>
              <p className="text-[11px] text-on-surface-variant">Last 14 days</p>
            </div>
            <div className="flex bg-surface-container p-1 rounded-md text-xs">
              {["24h", "7d", "14d", "30d"].map(r => (
                <button key={r} className={`px-2.5 py-1 rounded ${r === "14d" ? "bg-white shadow-sm font-bold text-primary" : "text-on-surface-variant"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="h-48 flex items-end gap-2">
            {sample.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors" style={{ height: `${(v / max) * 100}%` }}></div>
                <span className="text-[9px] text-on-surface-variant">D{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl p-6">
          <h3 className="font-card-title text-card-title mb-1">Recent Incidents</h3>
          <p className="text-[11px] text-on-surface-variant mb-5">All systems operational.</p>
          <div className="space-y-4">
            {[
              { color: "bg-green-500", title: "Embedding pipeline restored", time: "2h ago", desc: "us-west-2 backlog cleared." },
              { color: "bg-yellow-500", title: "Elevated API latency", time: "Yesterday", desc: "p95 spiked to 2.4s for 14 min." },
              { color: "bg-green-500", title: "Scheduled maintenance complete", time: "3d ago", desc: "Vector DB reindex finished." },
            ].map((it, i) => (
              <div key={i} className="flex gap-3">
                <span className={`w-2 h-2 rounded-full ${it.color} mt-1.5 flex-shrink-0`}></span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold">{it.title}</p>
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{it.time}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">{it.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 bg-white border border-border-subtle rounded-xl p-6">
          <h3 className="font-card-title text-card-title mb-1">Top Workspaces (by query volume)</h3>
          <table className="w-full mt-4">
            <thead>
              <tr className="border-b border-border-subtle text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="text-left py-2">Workspace</th>
                <th className="text-left py-2">Org</th>
                <th className="text-right py-2">Queries (24h)</th>
                <th className="text-right py-2">Docs</th>
                <th className="text-right py-2">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {[
                ["Genomics Lab", "Stanford", "8,402", "1,247", "23"],
                ["Climate Modeling", "MIT", "6,128", "892", "18"],
                ["HCI Research", "CMU", "4,901", "624", "12"],
                ["Trust & Safety", "OpenAI", "3,872", "418", "8"],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-surface-container-low">
                  {row.map((c, j) => <td key={j} className={`py-3 text-sm ${j >= 2 ? "text-right tabular-nums" : ""} ${j === 0 ? "font-bold" : "text-on-surface-variant"}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

// =================== ADMIN USERS ===================
function AdminUsersPage() {
  const users = [
    { name: "Anna Petrova", email: "anna@stanford.edu", plan: "Lab", role: "Admin", status: "Active", last: "2m ago" },
    { name: "John Carter", email: "john@mit.edu", plan: "Pro", role: "User", status: "Active", last: "1h ago" },
    { name: "Mira Cohen", email: "mira@cmu.edu", plan: "Pro", role: "User", status: "Active", last: "4h ago" },
    { name: "Liam O'Connor", email: "liam@gmail.com", plan: "Free", role: "User", status: "Suspended", last: "2d ago" },
    { name: "Yuki Tanaka", email: "y.tanaka@u-tokyo.ac.jp", plan: "Lab", role: "User", status: "Active", last: "12m ago" },
    { name: "Sara Khan", email: "sara@oxford.edu", plan: "Pro", role: "User", status: "Active", last: "30m ago" },
    { name: "Daniel Reyes", email: "d.reyes@example.com", plan: "Free", role: "User", status: "Pending", last: "—" },
  ];
  const [q, setQ] = useStateAdmin("");
  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminShell active="users" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Users" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Users</h1>
          <p className="text-on-surface-variant">12,847 total · 248 new this week</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low flex items-center gap-2">
            <Icon name="download" size={16} /> Export CSV
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-2">
            <Icon name="person_add" size={16} /> Invite User
          </button>
        </div>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest border border-border-subtle rounded-lg px-3 py-2">
            <Icon name="search" size={18} className="text-on-surface-variant" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or email..." className="flex-1 bg-transparent outline-none text-sm" />
          </div>
          <select className="px-3 py-2 border border-border-subtle rounded-lg text-xs bg-white"><option>All plans</option><option>Free</option><option>Pro</option><option>Lab</option></select>
          <select className="px-3 py-2 border border-border-subtle rounded-lg text-xs bg-white"><option>All statuses</option><option>Active</option><option>Suspended</option><option>Pending</option></select>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-surface-container-lowest">
              <th className="px-4 py-3 text-left"><input type="checkbox" /></th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">User</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Plan</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Role</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Last seen</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {filtered.map((u, i) => (
              <tr key={i} className="hover:bg-surface-container-low group">
                <td className="px-4 py-3"><input type="checkbox" /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold">{u.name.split(" ").map(n=>n[0]).join("")}</div>
                    <div>
                      <p className="text-sm font-bold">{u.name}</p>
                      <p className="text-[11px] text-on-surface-variant">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.plan === "Lab" ? "bg-primary text-white" : u.plan === "Pro" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high"}`}>{u.plan}</span></td>
                <td className="px-4 py-3 text-sm">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs ${u.status === "Active" ? "text-green-700" : u.status === "Suspended" ? "text-error" : "text-on-surface-variant"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-green-500" : u.status === "Suspended" ? "bg-error" : "bg-yellow-500"}`}></span>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-on-surface-variant">{u.last}</td>
                <td className="px-4 py-3 text-right"><button className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary"><Icon name="more_horiz" size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">Showing 1–{filtered.length} of 12,847</span>
          <div className="flex gap-1">
            <button className="px-2 py-1 border border-border-subtle rounded hover:bg-surface-container-low" disabled><Icon name="chevron_left" size={14} /></button>
            <button className="px-2 py-1 border border-border-subtle rounded hover:bg-surface-container-low"><Icon name="chevron_right" size={14} /></button>
          </div>
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
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-2"><Icon name="add" size={16} /> New Flag</button>
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
  const logs = [
    { time: "10:42:18", actor: "anna@stanford.edu", action: "feature_flag.update", target: "agent-mentions", meta: "rollout: 25% → 35%", level: "info" },
    { time: "10:38:02", actor: "system", action: "model.canary_promote", target: "paper-trail-exp-v5", meta: "0.1% → 0.5%", level: "info" },
    { time: "10:31:55", actor: "mustafa@example.com", action: "user.suspend", target: "liam@gmail.com", meta: "reason: ToS violation", level: "warn" },
    { time: "10:24:11", actor: "system", action: "billing.invoice_failed", target: "lab_org_412", meta: "stripe_err: card_declined", level: "error" },
    { time: "10:18:47", actor: "anna@stanford.edu", action: "user.role_grant", target: "john@mit.edu", meta: "role: workspace_admin", level: "info" },
    { time: "10:12:09", actor: "system", action: "embedding.batch_complete", target: "doc_batch_8821", meta: "1,247 docs · 4.2 GB", level: "info" },
    { time: "10:04:22", actor: "system", action: "rate_limit.tripped", target: "anon_ip_47.92.x.x", meta: "204 req/min on /api/chat", level: "warn" },
  ];
  return (
    <AdminShell active="logs" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Audit Logs" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">Audit Logs</h1>
          <p className="text-on-surface-variant">Immutable record of admin actions and system events.</p>
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-border-subtle rounded-lg text-xs bg-white"><option>Last 1 hour</option><option>Last 24 hours</option><option>Last 7 days</option></select>
          <button className="px-4 py-2 rounded-lg border border-border-subtle text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"><Icon name="download" size={16} /> Export</button>
        </div>
      </div>
      <div className="bg-[#0d0d0e] text-white rounded-xl border border-border-subtle overflow-hidden">
        <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-white/50">
          <span className="w-20">TIME</span>
          <span className="w-48">ACTOR</span>
          <span className="w-44">ACTION</span>
          <span className="flex-1">DETAILS</span>
        </div>
        <div className="divide-y divide-white/5">
          {logs.map((l, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3 text-xs font-mono hover:bg-white/5">
              <span className="w-20 text-white/40">{l.time}</span>
              <span className="w-48 text-white/70 truncate">{l.actor}</span>
              <span className={`w-44 truncate ${l.level === "error" ? "text-red-400" : l.level === "warn" ? "text-yellow-400" : "text-blue-300"}`}>{l.action}</span>
              <span className="flex-1 text-white/60"><span className="text-white">{l.target}</span> · {l.meta}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

// =================== ADMIN HEALTH ===================
function AdminHealthPage() {
  const services = [
    { name: "API Gateway", status: "Operational", uptime: "99.98%", latency: "42ms" },
    { name: "Inference Service", status: "Operational", uptime: "99.95%", latency: "1.4s" },
    { name: "Vector Database", status: "Operational", uptime: "99.99%", latency: "18ms" },
    { name: "Embedding Pipeline", status: "Degraded", uptime: "98.71%", latency: "4.2s" },
    { name: "Document Storage (S3)", status: "Operational", uptime: "100.00%", latency: "55ms" },
    { name: "Auth Service", status: "Operational", uptime: "99.97%", latency: "78ms" },
  ];
  const colorFor = (s) => s === "Operational" ? "bg-green-500" : s === "Degraded" ? "bg-yellow-500" : "bg-error";
  const textFor = (s) => s === "Operational" ? "text-green-700" : s === "Degraded" ? "text-yellow-700" : "text-error";

  return (
    <AdminShell active="health" breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "System Health" }]}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-section-heading text-section-heading text-primary mb-2">System Health</h1>
          <p className="text-on-surface-variant">All services across us-east-1, eu-west-1, and ap-northeast-1.</p>
        </div>
        <span className="flex items-center gap-2 text-sm font-bold text-yellow-700"><span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span> 1 service degraded</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {services.map((s, i) => (
          <div key={i} className="bg-white border border-border-subtle rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${colorFor(s.status)}`}></span>
                <p className="font-bold">{s.name}</p>
              </div>
              <span className={`text-xs font-bold ${textFor(s.status)}`}>{s.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Uptime (30d)</p><p className="text-lg font-bold tabular-nums">{s.uptime}</p></div>
              <div><p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">p95 latency</p><p className="text-lg font-bold tabular-nums">{s.latency}</p></div>
            </div>
            {/* mini bars */}
            <div className="mt-4 flex gap-px h-6">
              {Array.from({ length: 30 }).map((_, j) => {
                const isBad = s.status === "Degraded" && (j === 22 || j === 23);
                return <div key={j} className={`flex-1 rounded-sm ${isBad ? "bg-yellow-500" : "bg-green-500/80"}`}></div>;
              })}
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">30-day uptime</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border-subtle rounded-xl p-6">
        <h3 className="font-card-title text-card-title mb-4">Active Alerts</h3>
        <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="warning" filled className="text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Embedding pipeline backlog</p>
              <p className="text-xs text-yellow-800 mt-0.5">Queue depth: 14,228 jobs · Estimated drain time: 22 min</p>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 rounded-lg bg-yellow-600 text-white text-xs font-bold">Scale workers</button>
                <button className="px-3 py-1.5 rounded-lg border border-yellow-600 text-yellow-800 text-xs font-bold">Acknowledge</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { AdminOverviewPage, AdminUsersPage, AdminModelsPage, AdminFlagsPage, AdminLogsPage, AdminHealthPage });
