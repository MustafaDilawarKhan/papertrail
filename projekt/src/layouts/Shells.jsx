import React, { useMemo, useState } from 'react'
import { Brand, Icon, Link } from '../components/core'
import { CommandPalette, Sidebar, TopBar } from '../components/navigation'

export function AppShell({ active, breadcrumbs = [], children }) {
  const [searchOpen, setSearchOpen] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar active={active} />
      <TopBar breadcrumbs={breadcrumbs} onSearchOpen={() => setSearchOpen(true)} />
      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        recents={[
          { label: 'Trustworthiness of AI in HRI', icon: 'description', to: '/library/thesis/trust-ai-hri' },
          { label: 'Measuring Trust in HRC', icon: 'description', to: '/library/thesis/measuring-trust' },
          { label: 'Thesis Sources', icon: 'folder', to: '/library' },
        ]}
        actions={[
          { label: 'Upload new document', icon: 'upload_file', to: '/upload' },
          { label: 'New workspace', icon: 'add_circle', to: '/workspaces' },
          { label: 'Export data', icon: 'download', to: '/settings/export' },
        ]}
      />
      <main className="app-main">{children}</main>
    </div>
  )
}

export function AuthShell({ children, aside = true }) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Brand />
        <div className="auth-card">{children}</div>
      </div>
      {aside && (
        <aside className="auth-aside">
          <p className="eyebrow">For Researchers</p>
          <h1>Anchor every claim to a verifiable source.</h1>
          <p>Aid is a deliberate research workspace. We help you reason through answers with citations on every line.</p>
        </aside>
      )}
    </div>
  )
}

export function AdminShell({ active, breadcrumbs = [], children }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand admin />
        <nav>
          {[
            ['overview', 'Dashboard', '/admin', 'dashboard'],
            ['users', 'All Users', '/admin/users', 'group'],
            ['models', 'Model Management', '/admin/models', 'smart_toy'],
            ['flags', 'Feature Flags', '/admin/flags', 'flag'],
            ['logs', 'Audit Logs', '/admin/logs', 'receipt_long'],
            ['health', 'System Health', '/admin/health', 'monitoring'],
          ].map(([id, label, to, icon]) => (
            <Link key={id} to={to} className={`admin-item ${active === id ? 'is-active' : ''}`}>
              <Icon name={icon} filled={active === id} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-footer">
          <span>owner@aid.com</span>
          <Link to="/dashboard">Log out</Link>
        </div>
      </aside>
      <header className="admin-topbar">
        <nav className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              {index > 0 && <Icon name="chevron_right" />}
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </React.Fragment>
          ))}
        </nav>
        <div className="admin-topbar-meta">
          <span className="status-pill">PRODUCTION</span>
          <div className="avatar">MD</div>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  )
}
