import React from 'react'
import { I } from './Atoms'
import BrandLogo from './BrandLogo'

function Nav({ tweaks, setTweak }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, padding: "18px 0", background: "color-mix(in oklab, var(--bg) 78%, transparent)", backdropFilter: "blur(8px)", borderBottom: "1px solid color-mix(in oklab, var(--line) 40%, transparent)" }}>
      <div className="container row between center">
        <a href="#" className="row center gap-8" style={{ fontFamily: "var(--serif)", fontSize: 22, letterSpacing: "-0.02em" }}>
          <BrandLogo size={44} />
          <span style={{ fontWeight: 500 }}>Paper Trail</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-4)", border: "1px solid var(--line-2)", padding: "1px 5px", borderRadius: 4, marginLeft: 4 }}>BETA</span>
        </a>

        <nav className="pill-nav" style={{ display: "none" }}>
          <a href="#features">Features</a>
          <a href="#verify">Verify</a>
          <a href="#vs">vs ChatGPT</a>
          <a href="#integrations">Integrations</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <nav className="pill-nav hide-md">
          <a href="#features">Features</a>
          <a href="#verify">Verify</a>
          <a href="#vs">vs ChatGPT</a>
          <a href="#integrations">Integrations</a>
          <a href="#pricing">Pricing</a>
        </nav>

        <div className="row center gap-12">
          <button
            onClick={() => {
              const next = !tweaks.dark;
              document.body.classList.toggle("theme-dark", next);
              setTweak("dark", next);
            }}
            aria-label={tweaks.dark ? "Switch to light mode" : "Switch to dark mode"}
            title={tweaks.dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              background: "transparent",
              border: "1px solid var(--line-2)",
              color: "var(--ink-2)",
              borderRadius: 999,
              width: 36, height: 36,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-soft)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            {tweaks.dark ? (
              // SUN icon — shown in dark mode, click to switch to light
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              // MOON icon — shown in light mode, click to switch to dark
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <a
            href="#/login"
            className="btn"
            style={{
              height: 38,
              fontSize: 14,
              background: "transparent",
              border: "1px solid var(--line-2)",
              color: "var(--ink-2)",
              padding: "0 16px",
              borderRadius: 999,
            }}
          >
            Log in
          </a>
          <a href="#/register" className="btn btn-primary" style={{ height: 38 }}>
            Get Paper Trail free <I.arrow />
          </a>
        </div>
      </div>
    </header>
  );
}

export default Nav;
