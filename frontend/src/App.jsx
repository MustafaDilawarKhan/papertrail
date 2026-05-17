import { useEffect, useState } from 'react'
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle } from './tweaks-panel'
import Nav from './components/Nav'
import Hero from './components/Hero'
import TrustBar from './components/TrustBar'
import Features from './components/Features'
import Verification from './components/Verification'
import Comparison from './components/Comparison'
import Workflow from './components/Workflow'
import Integrations from './components/Integrations'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'
import { useRoute, Icon, AppShell, Link, navigate } from './shared/components'
import * as AppPages from './pages/appPages'
import EditorPage from './pages/EditorPage'
import * as AuthPages from './pages/authPages'
import * as AdminPages from './pages/adminPages'
import { useAuth } from './contexts/AuthContext'

function HelpPage() {
  return (
    <AppShell active="help" breadcrumbs={[{ label: "Help" }]}>
      <h1 className="font-section-heading text-section-heading text-primary mb-2">Help &amp; Resources</h1>
      <p className="text-on-surface-variant mb-8">Guides, shortcuts, and direct support.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "school", title: "Getting Started", desc: "5-min tour of the research workspace." },
          { icon: "menu_book", title: "Citation Guide", desc: "How sources, chips, and BibTeX work." },
          { icon: "keyboard", title: "Keyboard Shortcuts", desc: "Move faster across library and chat." },
          { icon: "api", title: "API Reference", desc: "For Lab plan integrations." },
          { icon: "forum", title: "Community", desc: "Ask researchers like you." },
          { icon: "support", title: "Contact Support", desc: "Reply within 1 business day." },
        ].map((c, i) => (
          <button key={i} className="bg-white border border-border-subtle p-5 rounded-xl text-left hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-primary mb-4"><Icon name={c.icon} filled /></div>
            <h4 className="font-bold mb-1">{c.title}</h4>
            <p className="text-xs text-on-surface-variant">{c.desc}</p>
          </button>
        ))}
      </div>
      <div className="bg-primary text-on-primary rounded-2xl p-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold opacity-60 mb-2">Live Office Hours</p>
          <p className="text-xl font-bold mb-1">Thursdays · 11am PT</p>
          <p className="text-sm opacity-80">Drop in with our team to talk research workflows.</p>
        </div>
        <button className="bg-white text-primary px-5 py-2.5 rounded-full text-xs font-bold">Add to Calendar</button>
      </div>
    </AppShell>
  );
}

// Authorisation wrapper for /admin/* routes. Shows a friendly 403 if the
// current user is not flagged as admin in the database. Backend admin
// endpoints enforce this independently — this is purely a UX guard.
function AdminGate({ route }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading…</p></div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Please <Link to="/login" className="text-primary underline">sign in</Link>.</p></div>;
  }
  if (!user.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <Icon name="lock" size={48} className="text-on-surface-variant" />
        <h1 className="text-xl font-bold">Admin only</h1>
        <p className="text-sm text-on-surface-variant max-w-md">
          Your account does not have admin privileges. Ask the project owner to run
          <code className="bg-surface-container-low px-1 mx-1 rounded">python make_admin.py {user.email}</code>
          inside the backend container.
        </p>
        <Link to="/dashboard" className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold">Back to dashboard</Link>
      </div>
    );
  }
  // Admin path → dispatch to the matching page.
  if (route === '/admin' || route === '/admin/') return <AdminPages.AdminOverviewPage />;
  if (route.startsWith('/admin/users')) return <AdminPages.AdminUsersPage />;
  if (route.startsWith('/admin/models')) return <AdminPages.AdminModelsPage />;
  if (route.startsWith('/admin/flags')) return <AdminPages.AdminFlagsPage />;
  if (route.startsWith('/admin/logs')) return <AdminPages.AdminLogsPage />;
  if (route.startsWith('/admin/health')) return <AdminPages.AdminHealthPage />;
  return <AdminPages.AdminOverviewPage />;
}

// Public routes that don't require an authenticated user. Anything not in
// this set forces a redirect to /login.
const PUBLIC_ROUTE_PREFIXES = ['/login', '/register', '/verify'];

// Drops the visitor on /login when they hit a gated route without a session.
// Stashes the URL they tried in sessionStorage so we can return them there
// after they sign in.
function RedirectToLogin({ intendedRoute }) {
  useEffect(() => {
    try {
      if (intendedRoute && intendedRoute !== '/login') {
        sessionStorage.setItem('pt.intendedRoute', intendedRoute);
      }
    } catch { /* sessionStorage might be disabled in private mode */ }
    navigate('/login');
  }, [intendedRoute]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
      <Icon name="lock" size={32} className="text-on-surface-variant" />
      <p className="text-sm text-on-surface-variant">Redirecting to sign-in…</p>
    </div>
  );
}

function AppRouter() {
  const route = useRoute();
  const { user, loading } = useAuth();
  if (!route || route === '/') return null;

  // Resolve public-route check up-front. These render WITHOUT requiring auth.
  const isPublic = PUBLIC_ROUTE_PREFIXES.some(p => route.startsWith(p));

  if (isPublic) {
    if (route.startsWith('/login'))    return <AuthPages.LoginPage />;
    if (route.startsWith('/register')) return <AuthPages.RegisterPage />;
    if (route.startsWith('/verify'))   return <AuthPages.VerifyPage />;
  }

  // From here down, the user must be authenticated.
  // While the bootstrap is still resolving, show a neutral splash instead of
  // briefly flashing the page underneath (which can leak content).
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-on-surface-variant">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return <RedirectToLogin intendedRoute={route} />;
  }

  // Admin-first landing — if a platform admin lands on /dashboard or the
  // post-login redirect, send them straight to the admin overview.
  if (route.startsWith('/dashboard') && user.is_admin) {
    return <AdminGate route="/admin" />;
  }

  // Authenticated app routes
  if (route.startsWith('/dashboard')) return <AppPages.DashboardPage />;
  if (route.match(/^\/library\/(.+?)\/(.+)/)) {
    const parts = route.replace('/library/', '').split('/');
    return <AppPages.DocViewerPage params={parts} />;
  }
  if (route.startsWith('/library')) return <AppPages.LibraryPage />;
  if (route.startsWith('/chats')) return <AppPages.ChatsPage />;
  if (route.match(/^\/workspaces\/(.+)/)) {
    const name = route.replace('/workspaces/', '');
    return <AppPages.WorkspaceDetailPage params={[name]} />;
  }
  if (route.startsWith('/workspaces')) return <AppPages.WorkspacesPage />;
  if (route.startsWith('/integrations')) return <AppPages.IntegrationsPage />;
  if (route.startsWith('/upload')) return <AppPages.LibraryPage />;
  if (route.startsWith('/write')) return <EditorPage />;
  if (route.startsWith('/settings')) return <AuthPages.SettingsPage />;
  if (route.startsWith('/upgrade')) return <AuthPages.UpgradePage />;
  if (route.startsWith('/help')) return <HelpPage />;

  // Admin routes — additionally gated on user.is_admin inside AdminGate.
  if (route.startsWith('/admin')) {
    return <AdminGate route={route} />;
  }

  return <div className="min-h-screen flex items-center justify-center"><p>Unknown route: {route}</p></div>;
}

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "#3a7d57",
    "headlineStyle": "serif",
    "dark": false,
    "showHeroAnim": true,
    "highContrast": false,
    "reducedMotion": false
  }/*EDITMODE-END*/);

  const { user } = useAuth();
  const route = useRoute(); // Get current route

  // Sync tweaks with user profile theme
  useEffect(() => {
    if (user?.ui_theme) {
      setTweak("dark", user.ui_theme === "dark");
    }
  }, [user?.ui_theme]);

  // Accessibility: Apply theme and system preferences
  useEffect(() => {
    document.body.classList.toggle("theme-dark", !!tweaks.dark);
    document.documentElement.style.setProperty("--accent", tweaks.accent);
    document.body.classList.toggle("headline-sans", tweaks.headlineStyle === "sans");
    document.body.classList.toggle("high-contrast", !!tweaks.highContrast);
    document.body.classList.toggle("reduce-motion", !!tweaks.reducedMotion);
    
    // Keyboard focus management: visible focus ring on interactive elements
    const style = document.createElement('style');
    style.textContent = `
      *:focus-visible {
        outline: 2px solid var(--accent, #3a7d57);
        outline-offset: 2px;
      }
      body.reduce-motion * {
        animation: none !important;
        transition: none !important;
      }
      body.high-contrast a, body.high-contrast button {
        text-decoration: underline;
      }
    `;
    if (!document.head.querySelector('style[data-accessibility]')) {
      style.setAttribute('data-accessibility', 'true');
      document.head.appendChild(style);
    }
  }, [tweaks]);

  const landingSections = ['features', 'verify', 'vs', 'integrations', 'pricing'];

  // Handle section scrolling on landing page
  useEffect(() => {
    if (landingSections.includes(route)) {
      const el = document.getElementById(route);
      if (el) {
        // Use a small timeout to ensure the DOM is ready if navigating from another page
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [route]);

  const isLandingPage = (route || '/') === '/' || landingSections.includes(route);

  return (
    <>
      {isLandingPage && <Nav tweaks={tweaks} setTweak={setTweak} />}
      <main>
        {/* Landing page stays at root (no hash). App pages render on hash routes. */}
        { isLandingPage ? (
          <>
            <Hero tweaks={tweaks} />
            <TrustBar />
            <Features />
            <Verification tweaks={tweaks} />
            <Comparison />
            <Workflow />
            <Integrations />
            <Testimonials />
            <FAQ />
            <CTA />
          </>
        ) : (
          <AppRouter />
        ) }
      </main>
      {isLandingPage && <Footer />}

      {isLandingPage && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Brand">
            <TweakColor
              label="Accent (links + verify dots)"
              value={tweaks.accent}
              onChange={(v) => setTweak("accent", v)}
              options={["#3a7d57", "#2a5b9e", "#cc6d3e", "#7c3aed", "#171513"]}
            />
            <TweakRadio
              label="Headline font"
              value={tweaks.headlineStyle}
              onChange={(v) => setTweak("headlineStyle", v)}
              options={[{ value: "serif", label: "Serif" }, { value: "sans", label: "Sans" }]}
            />
          </TweakSection>
          <TweakSection title="Theme">
            <TweakToggle
              label="Dark mode"
              value={tweaks.dark}
              onChange={(v) => setTweak("dark", v)}
            />
            <TweakToggle
              label="Hero animation"
              value={tweaks.showHeroAnim}
              onChange={(v) => setTweak("showHeroAnim", v)}
            />
          </TweakSection>
          <TweakSection title="Accessibility">
            <TweakToggle
              label="High contrast"
              value={tweaks.highContrast}
              onChange={(v) => setTweak("highContrast", v)}
            />
            <TweakToggle
              label="Reduce motion"
              value={tweaks.reducedMotion}
              onChange={(v) => setTweak("reducedMotion", v)}
            />
          </TweakSection>
        </TweaksPanel>
      )}
    </>
  );
}

export default App
