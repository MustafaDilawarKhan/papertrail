import React from 'react'
import { useHashRoute } from './lib/useHashRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage, RegisterPage, VerifyPage } from './pages/AuthPages'
import {
  DashboardPage,
  DocViewerPage,
  HelpPage,
  LibraryPage,
  SettingsPage,
  UploadPage,
  UpgradePage,
  WorkspacesPage,
  WorkspaceDetailPage,
} from './pages/AppPages'
import {
  AdminFlagsPage,
  AdminHealthPage,
  AdminLogsPage,
  AdminModelsPage,
  AdminOverviewPage,
  AdminUsersPage,
} from './pages/AdminPages'

const routeTable = [
  { test: /^\/$|^\/landing$/, render: () => <LandingPage /> },
  { test: /^\/login$/, render: () => <LoginPage /> },
  { test: /^\/register$/, render: () => <RegisterPage /> },
  { test: /^\/verify-email$/, render: () => <VerifyPage /> },
  { test: /^\/dashboard$/, render: () => <DashboardPage /> },
  { test: /^\/library$/, render: () => <LibraryPage /> },
  { test: /^\/library\/[^/]+\/[^/]+$/, render: (match) => <DocViewerPage params={match.slice(1)} /> },
  { test: /^\/upload$/, render: () => <UploadPage /> },
  { test: /^\/workspaces$/, render: () => <WorkspacesPage /> },
  { test: /^\/workspaces\/[^/]+$/, render: (match) => <WorkspaceDetailPage params={match.slice(1)} /> },
  { test: /^\/settings$/, render: () => <SettingsPage /> },
  { test: /^\/settings\/subscription\/upgrade$/, render: () => <UpgradePage /> },
  { test: /^\/help$/, render: () => <HelpPage /> },
  { test: /^\/admin$/, render: () => <AdminOverviewPage /> },
  { test: /^\/admin\/users$/, render: () => <AdminUsersPage /> },
  { test: /^\/admin\/models$/, render: () => <AdminModelsPage /> },
  { test: /^\/admin\/flags$/, render: () => <AdminFlagsPage /> },
  { test: /^\/admin\/logs$/, render: () => <AdminLogsPage /> },
  { test: /^\/admin\/health$/, render: () => <AdminHealthPage /> },
]

function NotFound({ route }) {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>No route matches {route}</p>
      <a href="#/landing" className="btn btn-dark">Go home</a>
    </div>
  )
}

export default function App() {
  const route = useHashRoute()

  for (const entry of routeTable) {
    const match = route.match(entry.test)
    if (match) return entry.render(match)
  }

  return <NotFound route={route} />
}
