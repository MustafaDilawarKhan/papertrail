import React, { useEffect, useMemo, useState } from 'react'
import { Brand, Icon, Link } from './core'

export function Sidebar({ active = 'home' }) {
  const items = useMemo(() => ([
    { id: 'home', label: 'Home', icon: 'home', to: '/dashboard' },
    { id: 'library', label: 'Library', icon: 'library_books', to: '/library' },
    { id: 'workspaces', label: 'Workspaces', icon: 'workspaces', to: '/workspaces' },
    { id: 'settings', label: 'Settings', icon: 'settings', to: '/settings' },
    { id: 'help', label: 'Help', icon: 'help', to: '/help' },
  ]), [])

  return (
    <aside className="sidebar">
      <Brand />
      <nav className="sidebar-nav">
        {items.map((item) => (
          <Link key={item.id} to={item.to} className={`sidebar-item ${active === item.id ? 'is-active' : ''}`}>
            <Icon name={item.icon} filled={active === item.id} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="upgrade-card">
        <div>
          <strong>Upgrade to Pro</strong>
          <p>Unlimited citations and collaboration.</p>
        </div>
        <Link to="/settings/subscription/upgrade" className="btn btn-dark btn-full">Upgrade</Link>
      </div>
      <div className="sidebar-user">
        <div className="avatar">MD</div>
        <div>
          <strong>Mustafa Dilawar</strong>
          <span>Free plan</span>
        </div>
      </div>
    </aside>
  )
}

export function TopBar({ breadcrumbs = [], onSearchOpen }) {
  return (
    <header className="topbar">
      <nav className="breadcrumbs">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.label}>
            {index > 0 && <Icon name="chevron_right" />}
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
          </React.Fragment>
        ))}
      </nav>
      <button className="search-trigger" type="button" onClick={onSearchOpen}>
        <Icon name="search" />
        <span>Search documents, collections...</span>
        <kbd>⌘K</kbd>
      </button>
      <div className="topbar-actions">
        <button className="icon-button" type="button"><Icon name="notifications" /></button>
        <Link to="/upload" className="btn btn-dark btn-compact">Upload</Link>
      </div>
    </header>
  )
}

export function CommandPalette({ open, onClose, actions = [], recents = [] }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const match = (items) => items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or jump to..." autoFocus />
          <kbd>esc</kbd>
        </div>
        <div className="palette-section">
          <h4>Recents</h4>
          {match(recents).map((item) => <Link key={item.label} to={item.to} className="palette-item" onClick={onClose}><Icon name={item.icon} /> <span>{item.label}</span></Link>)}
        </div>
        <div className="palette-section">
          <h4>Actions</h4>
          {match(actions).map((item) => <Link key={item.label} to={item.to} className="palette-item" onClick={onClose}><Icon name={item.icon} /> <span>{item.label}</span></Link>)}
        </div>
      </div>
    </div>
  )
}
