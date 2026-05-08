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
import { useRoute, Icon, AppShell, Link } from './shared/components'
import * as AppPages from './pages/appPages'
import * as AuthPages from './pages/authPages'
import * as AdminPages from './pages/adminPages'

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

function AppRouter() {
  const route = useRoute();
  if (!route || route === '/') return null;

  // Auth routes
  if (route.startsWith('/login')) return <AuthPages.LoginPage />;
  if (route.startsWith('/register')) return <AuthPages.RegisterPage />;
  if (route.startsWith('/verify')) return <AuthPages.VerifyPage />;

  // App routes
  if (route.startsWith('/dashboard')) return <AppPages.DashboardPage />;
  if (route.match(/^\/library\/(.+?)\/(.+)/)) {
    const parts = route.replace('/library/', '').split('/');
    return <AppPages.DocViewerPage params={parts} />;
  }
  if (route.startsWith('/library')) return <AppPages.LibraryPage />;
  if (route.match(/^\/workspaces\/(.+)/)) {
    const name = route.replace('/workspaces/', '');
    return <AppPages.WorkspaceDetailPage params={[name]} />;
  }
  if (route.startsWith('/workspaces')) return <AppPages.WorkspacesPage />;
  if (route.startsWith('/upload')) return <AuthPages.UploadPage />;
  if (route.startsWith('/settings')) return <AuthPages.SettingsPage />;
  if (route.startsWith('/upgrade')) return <AuthPages.UpgradePage />;
  if (route.startsWith('/help')) return <HelpPage />;

  // Admin routes
  if (route === '/admin' || route === '/admin/') return <AdminPages.AdminOverviewPage />;
  if (route.startsWith('/admin/users')) return <AdminPages.AdminUsersPage />;
  if (route.startsWith('/admin/models')) return <AdminPages.AdminModelsPage />;
  if (route.startsWith('/admin/flags')) return <AdminPages.AdminFlagsPage />;
  if (route.startsWith('/admin/logs')) return <AdminPages.AdminLogsPage />;
  if (route.startsWith('/admin/health')) return <AdminPages.AdminHealthPage />;

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

  const route = useRoute(); // Get current route

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

  const isLandingPage = (route || '/') === '/';

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
