import React, { useMemo, useState } from 'react'
import { AppShell } from '../layouts/Shells'
import { collections, docs, activity, workspaces } from '../data/mockData'
import { EmptyState, Icon, Link, Toggle } from '../components/core'

export function DashboardPage() {
  return (
    <AppShell active="home" breadcrumbs={[{ label: 'Dashboard' }]}>
      <section className="page-head">
        <div>
          <h1>Good morning, Mustafa.</h1>
          <p>Continue your exploration or start a new project.</p>
        </div>
        <div className="action-row">
          <Link to="/upload" className="btn btn-dark">Upload doc</Link>
          <Link to="/library" className="btn btn-ghost">Collection</Link>
          <Link to="/workspaces" className="btn btn-ghost">Workspace</Link>
        </div>
      </section>

      <section className="grid-two">
        <div>
          <div className="section-heading-row"><h2>Recent Documents</h2><Link to="/library">View all</Link></div>
          <div className="cards-grid cards-grid-2">
            {docs.map((doc) => (
              <Link key={doc.slug} to={`/library/thesis/${doc.slug}`} className="card document-card">
                <div className="pill">{doc.type}</div>
                <h3>{doc.title}</h3>
                <p>{doc.authors}</p>
                <small>{doc.added}</small>
              </Link>
            ))}
          </div>
          <div className="spacer" />
          <div className="section-heading-row"><h2>Recent Collections</h2><Link to="/library">Manage</Link></div>
          <div className="cards-grid cards-grid-3">
            {collections.map((collection) => (
              <Link key={collection.name} to="/library" className="card collection-card">
                <div className="card-icon"><Icon name="folder" /></div>
                <h3>{collection.name}</h3>
                <p>{collection.count} documents</p>
                <small>{collection.updated}</small>
              </Link>
            ))}
          </div>
        </div>
        <aside className="card">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {activity.map((item) => <div key={item} className="activity-item">{item}</div>)}
          </div>
          <div className="assistant-card">
            <Icon name="auto_awesome" filled />
            <div>
              <strong>AI Suggestion</strong>
              <p>Based on your recent uploads, you might want to explore the Transformer Architecture cluster.</p>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  )
}

export function LibraryPage() {
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('all')
  const rows = useMemo(() => filter === 'all' ? docs : docs.filter((doc) => doc.type === filter), [filter])

  return (
    <AppShell active="library" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Library' }]}>
      <section className="page-head">
        <div>
          <h1>Research Library</h1>
          <p>Manage your academic sources and cross-reference documents.</p>
        </div>
        <div className="action-row">
          <button className={`btn ${view === 'list' ? 'btn-dark' : 'btn-ghost'}`} onClick={() => setView('list')}>List</button>
          <button className={`btn ${view === 'grid' ? 'btn-dark' : 'btn-ghost'}`} onClick={() => setView('grid')}>Grid</button>
          {['all', 'PDF', 'DOCX', 'URL'].map((type) => <button key={type} className={`btn ${filter === type ? 'btn-dark' : 'btn-ghost'}`} onClick={() => setFilter(type)}>{type === 'all' ? 'All' : type}</button>)}
          <Link to="/upload" className="btn btn-dark">Add Source</Link>
        </div>
      </section>

      {view === 'list' ? (
        <div className="card table-card">
          <table>
            <thead><tr><th>Title</th><th>Authors</th><th>Added</th><th>Full text</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} onClick={() => { window.location.hash = `#/library/thesis/${row.slug}` }}>
                  <td>{row.title}</td><td>{row.authors}</td><td>{row.added}</td><td>{row.full ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState icon="search_off" title="No documents" text="Try a different filter or add a new source." action={<Link to="/upload" className="btn btn-dark">Upload</Link>} />}
        </div>
      ) : (
        <div className="cards-grid cards-grid-3">
          {rows.map((row) => <div key={row.slug} className="card document-card"><div className="pill">{row.type}</div><h3>{row.title}</h3><p>{row.authors}</p><small>{row.added}</small></div>)}
        </div>
      )}
    </AppShell>
  )
}

export function DocViewerPage({ params }) {
  const [page, setPage] = useState(3)
  const [zoom, setZoom] = useState(110)
  const [selection, setSelection] = useState(false)
  const [length, setLength] = useState('Med')
  const [context, setContext] = useState('Research_Paper_V2.pdf')
  const [messages, setMessages] = useState([
    { role: 'user', text: 'What is RAG architecture?' },
    { role: 'ai', text: 'Retrieval-Augmented Generation combines retrieval and generation. ', chips: [3, 7] },
    { role: 'user', text: '@search_web latest RAG papers 2025' },
    { role: 'ai', text: 'Searched the web for latest RAG papers (2025).', chips: [12], agent: '@search_web' },
  ])
  const docName = params?.[1] ? params[1].replace(/-/g, ' ') : 'research-paper'

  return (
    <div className="viewer-shell">
      <AppShell active="library" breadcrumbs={[{ label: 'Library', to: '/library' }, { label: docName }]}>
        <div className="viewer-layout card">
          <section className="viewer-doc" onMouseUp={() => setSelection(true)} onMouseDown={() => setSelection(false)}>
            <div className="viewer-toolbar">
              <button onClick={() => setZoom((value) => Math.max(50, value - 10))}>−</button>
              <span>{zoom}%</span>
              <button onClick={() => setZoom((value) => Math.min(200, value + 10))}>+</button>
              <span>Page {page} / 12</span>
              <button onClick={() => setPage((value) => Math.max(1, value - 1))}>←</button>
              <button onClick={() => setPage((value) => Math.min(12, value + 1))}>→</button>
            </div>
            <div className="doc-page">
              <h2>Hierarchical Retrieval-Augmented Generation (RAG) Architecture</h2>
              <p>The emergence of large language models has transformed research workflows. <mark>Retrieval-Augmented Generation anchors outputs in a verifiable knowledge base.</mark></p>
              <p>Advanced systems use multi-stage retrieval or reranking to improve context quality.</p>
              {selection && <div className="selection-popup"><button>Summarize</button><button>Explain</button><button>Annotate</button><button>Cite</button></div>}
            </div>
          </section>
          <aside className="viewer-chat">
            <div className="chat-context">
              <button type="button">Context: {context}</button>
            </div>
            <div className="chat-thread">
              {messages.map((message, index) => (
                <div key={index} className={`chat-row ${message.role}`}>
                  <div className="chat-bubble">
                    {message.agent ? <span className="agent-tag">{message.agent}</span> : null}
                    {message.text}
                    {message.chips?.map((chip) => <button key={chip} className={`chip ${chip === page ? 'active' : ''}`} onClick={() => setPage(chip)}>pg. {chip}</button>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <textarea placeholder="Ask a question, or type @ to mention an agent..." />
              <div className="chat-input-footer">
                <div className="segment-control">
                  {['Short', 'Med', 'Detailed'].map((item) => <button key={item} className={length === item ? 'active' : ''} onClick={() => setLength(item)}>{item}</button>)}
                </div>
                <button className="btn btn-dark">Send</button>
              </div>
            </div>
          </aside>
        </div>
      </AppShell>
    </div>
  )
}

export function WorkspacesPage() {
  return (
    <AppShell active="workspaces" breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Workspaces' }]}>
      <section className="page-head">
        <div>
          <h1>Your Workspaces</h1>
          <p>Manage your collaborative research projects.</p>
        </div>
        <button className="btn btn-dark">New Workspace</button>
      </section>
      <div className="cards-grid cards-grid-3">
        {workspaces.map((workspace) => <div key={workspace.name} className="card workspace-card"><h3>{workspace.name}</h3><p>{workspace.docs} documents · {workspace.members} members</p><small>Active {workspace.active}</small></div>)}
      </div>
    </AppShell>
  )
}

export function WorkspaceDetailPage({ params }) {
  const name = (params?.[0] || 'Thesis Research').replace(/-/g, ' ')
  const [tab, setTab] = useState('files')
  return (
    <AppShell active="workspaces" breadcrumbs={[{ label: 'Workspaces', to: '/workspaces' }, { label: name }]}>
      <section className="card">
        <div className="section-heading-row"><h1>{name}</h1><button className="btn btn-dark">Invite</button></div>
        <div className="tab-row">
          {['files', 'chats', 'members'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
        </div>
        <div className="tab-body">
          {tab === 'files' && <EmptyState icon="folder" title="Workspace files" text="Files and collections for this project will appear here." />}
          {tab === 'chats' && <EmptyState icon="chat" title="Workspace chats" text="Threaded conversations with source-linked responses." />}
          {tab === 'members' && <EmptyState icon="group" title="Workspace members" text="Owner, editor, and viewer roles for collaborators." />}
        </div>
      </section>
    </AppShell>
  )
}

export function HelpPage() {
  return (
    <AppShell active="help" breadcrumbs={[{ label: 'Help' }]}>
      <section className="page-head">
        <div>
          <h1>Help & Resources</h1>
          <p>Guides, shortcuts, and support material.</p>
        </div>
      </section>
      <div className="cards-grid cards-grid-3">
        {['Getting Started', 'Citation Guide', 'Keyboard Shortcuts', 'API Reference', 'Community', 'Contact Support'].map((item) => <div key={item} className="card feature-card"><h3>{item}</h3><p>Helpful content for getting the most out of Aid.</p></div>)}
      </div>
    </AppShell>
  )
}

export function SettingsPage() {
  const [tab, setTab] = useState('preferences')
  const [dark, setDark] = useState(false)
  return (
    <AppShell active="settings" breadcrumbs={[{ label: 'Settings' }]}>
      <section className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, models, and team preferences.</p>
        </div>
      </section>
      <div className={`settings-grid ${dark ? 'theme-dark' : ''}`}>
        <aside className="settings-nav">
          {['profile', 'preferences', 'ai-model', 'security', 'subscription', 'export'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
        </aside>
        <div className="card settings-panel">
          {tab === 'preferences' && (
            <div className="stack">
              <div className="setting-row"><strong>UI Theme</strong><Toggle on={dark} setOn={setDark} labelOn="Dark" labelOff="Light" /></div>
              <div className="setting-row"><strong>Citation style</strong><select><option>APA 7th edition</option><option>MLA 9th</option><option>Chicago 17th</option></select></div>
              <div className="setting-row"><strong>AI model</strong><select><option>GPT-4o</option><option>GPT-4.5 Mini</option></select></div>
              <div className="setting-row"><strong>Response length</strong><div className="segment-control"><button>Short</button><button className="active">Medium</button><button>Detailed</button></div></div>
            </div>
          )}
          {tab === 'subscription' && <div className="stack"><h3>You are on the Free plan</h3><p>Upgrade to unlock unlimited AI words, imports, and team features.</p><Link to="/settings/subscription/upgrade" className="btn btn-dark">Upgrade plan</Link></div>}
          {tab === 'profile' && <EmptyState icon="person" title="Profile" text="Display name, email address, and profile photo settings." />}
          {tab === 'ai-model' && <EmptyState icon="smart_toy" title="AI Model" text="Choose routing, defaults, and model availability per plan." />}
          {tab === 'security' && <EmptyState icon="lock" title="Security" text="2FA, session management, and account protection settings." />}
          {tab === 'export' && <EmptyState icon="download" title="Export data" text="Download documents, annotations, and chat histories." />}
        </div>
      </div>
    </AppShell>
  )
}

export function UploadPage() {
  return (
    <AppShell active="library" breadcrumbs={[{ label: 'Library', to: '/library' }, { label: 'Upload' }]}>
      <section className="card upload-card">
        <h1>Add to your library</h1>
        <p>Aid will extract metadata, generate embeddings, and link citations automatically.</p>
        <div className="drop-zone">
          <Icon name="cloud_upload" size={28} />
          <strong>Drop files here or browse</strong>
          <small>PDF, DOCX, TXT supported</small>
          <button className="btn btn-dark">Choose Files</button>
        </div>
      </section>
    </AppShell>
  )
}

export function UpgradePage() {
  return (
    <AppShell active="settings" breadcrumbs={[{ label: 'Settings', to: '/settings' }, { label: 'Plans' }]}>
      <section className="page-head center">
        <div>
          <h1>Pick the plan that fits your work.</h1>
          <p>Cancel anytime. Academic discount available at checkout.</p>
        </div>
      </section>
      <div className="cards-grid cards-grid-3">
        {['Free', 'Pro', 'Max'].map((plan) => <div key={plan} className={`card plan-card ${plan === 'Pro' ? 'is-featured' : ''}`}><h3>{plan}</h3><p>Plan details and model access appear here.</p></div>)}
      </div>
    </AppShell>
  )
}
