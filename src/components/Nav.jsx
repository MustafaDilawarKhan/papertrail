import React from 'react'
import { I } from './Atoms'

function Nav({ tweaks, setTweak }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, padding: "18px 0", background: "color-mix(in oklab, var(--bg) 78%, transparent)", backdropFilter: "blur(8px)", borderBottom: "1px solid color-mix(in oklab, var(--line) 40%, transparent)" }}>
      <div className="container row between center">
        <a href="#" className="row center gap-8" style={{ fontFamily: "var(--serif)", fontSize: 22, letterSpacing: "-0.02em" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 6, background: "var(--ink)", color: "var(--paper)",
            fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600
          }}>A</span>
          <span style={{ fontWeight: 500 }}>Aid</span>
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
            className="mono"
            style={{ background: "transparent", border: "1px solid var(--line-2)", color: "var(--ink-2)", borderRadius: 999, padding: "6px 10px", fontSize: 11 }}
          >
            {tweaks.dark ? "LIGHT" : "DARK"}
          </button>
          <a href="#/login" style={{ fontSize: 14, color: "var(--ink-2)" }}>Log in</a>
          <a href="#/register" className="btn btn-primary" style={{ height: 38 }}>
            Get Aid free <I.arrow />
          </a>
        </div>
      </div>
    </header>
  );
}

export default Nav;
