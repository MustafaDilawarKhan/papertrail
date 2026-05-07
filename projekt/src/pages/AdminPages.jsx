import React from 'react'
import { AdminShell } from '../layouts/Shells'
import { flags, logs, models, services, users } from '../data/mockData'

export function AdminOverviewPage() {
  return (
    <AdminShell active="overview" breadcrumbs={[{ label: 'Admin' }, { label: 'Overview' }]}>
      <section className="page-head">
        <div>
          <h1>System Overview</h1>
          <p>Real-time platform health and usage metrics.</p>
        </div>
      </section>
      <div className="cards-grid cards-grid-4">
        {[
          ['Total Users', '12,482'],
          ['Active Paid Subscriptions', '3,241'],
          ['MRR', '$48,230'],
          ['Documents Processed', '284,910'],
        ].map(([label, value]) => <div key={label} className="card"><h3>{value}</h3><p>{label}</p></div>)}
      </div>
    </AdminShell>
  )
}

export function AdminUsersPage() {
  return (
    <AdminShell active="users" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Users' }]}>
      <section className="page-head">
        <div><h1>Users</h1><p>{users.length} sample records for the mock admin experience.</p></div>
      </section>
      <div className="card table-card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Docs</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.email}><td>{user.name}</td><td>{user.email}</td><td>{user.plan}</td><td>{user.status}</td><td>{user.docs}</td></tr>)}</tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export function AdminModelsPage() {
  return (
    <AdminShell active="models" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Models' }]}>
      <section className="page-head"><div><h1>AI Models</h1><p>Configure routing, defaults, and plan access.</p></div></section>
      <div className="cards-grid cards-grid-3">{models.map((model) => <div key={model.name} className="card"><h3>{model.name}</h3><p>{model.provider} · {model.plans}</p><small>{model.status} · Default for {model.defaultFor}</small></div>)}</div>
    </AdminShell>
  )
}

export function AdminFlagsPage() {
  return (
    <AdminShell active="flags" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Feature Flags' }]}>
      <section className="page-head"><div><h1>Feature Flags</h1><p>Control feature rollouts across users and plans.</p></div></section>
      <div className="stack">{flags.map((flag) => <div key={flag.name} className="card"><h3>{flag.name}</h3><p>{flag.desc}</p><small>{flag.state}</small></div>)}</div>
    </AdminShell>
  )
}

export function AdminLogsPage() {
  return (
    <AdminShell active="logs" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Audit Logs' }]}>
      <section className="page-head"><div><h1>Audit Logs</h1><p>Immutable record of admin actions and system events.</p></div></section>
      <div className="card table-card dark-table">
        <table>
          <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
          <tbody>{logs.map((log) => <tr key={`${log.time}-${log.action}`}><td>{log.time}</td><td>{log.actor}</td><td>{log.action}</td><td>{log.target}</td><td>{log.details}</td></tr>)}</tbody>
        </table>
      </div>
    </AdminShell>
  )
}

export function AdminHealthPage() {
  return (
    <AdminShell active="health" breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'System Health' }]}>
      <section className="page-head"><div><h1>System Health</h1><p>Service status across the platform.</p></div></section>
      <div className="cards-grid cards-grid-3">{services.map((service) => <div key={service.name} className="card"><h3>{service.name}</h3><p>{service.status}</p><small>{service.uptime} · {service.latency}</small></div>)}</div>
    </AdminShell>
  )
}
