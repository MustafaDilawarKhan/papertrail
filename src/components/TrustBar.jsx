import React from 'react'
import { Eyebrow, I } from './Atoms'

function TrustBar() {
  const labels = ["MIT MEDIA LAB", "STANFORD HAI", "OXFORD INTERNET INST.", "CAMBRIDGE", "ETH ZÜRICH", "MAX PLANCK", "UTOKYO", "BERKELEY DSI", "NATURE METHODS", "ICLR"];
  return (
    <section style={{ padding: "32px 0 8px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="container">
        <div className="row center gap-24" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.14em" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--verify)", marginRight: 8, verticalAlign: "middle" }} />
            TRUSTED BY 12,400+ RESEARCHERS · 240 LABS · 80 UNIVERSITIES
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>2026</div>
        </div>
        <div style={{ overflow: "hidden", maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)", padding: "8px 0 16px" }}>
          <div className="marquee">
            {[...labels, ...labels].map((l, i) => (
              <span key={i} className="mono" style={{ fontSize: 13, color: "var(--ink-3)", letterSpacing: "0.08em", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 16 }}>
                <span style={{ width: 4, height: 4, background: "var(--ink-4)", borderRadius: 2 }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustBar;
