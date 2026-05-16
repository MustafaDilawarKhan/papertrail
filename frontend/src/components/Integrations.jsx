import React from 'react'
import { FadeUp, Eyebrow, PlusMark, I } from './Atoms'

function Integrations() {
  const orbitRef = React.useRef(null);
  const integrations = [
    { name: "Zotero",   x: 12,  y: 22, icon: "Z", color: "#cc2936" },
    { name: "Mendeley", x: 88,  y: 18, icon: "M", color: "#9d2235" },
    { name: "Notion",   x: 8,   y: 60, icon: "N", color: "#191919" },
    { name: "Obsidian", x: 92,  y: 64, icon: "O", color: "#7c3aed" },
    { name: "Slack",    x: 22,  y: 92, icon: "S", color: "#4a154b" },
    { name: "GitHub",   x: 78,  y: 92, icon: "G", color: "#171513" },
    { name: "Google Scholar", x: 42, y: 6, icon: "g", color: "#4285f4" },
    { name: "arXiv",    x: 60,  y: 6, icon: "X", color: "#b31b1b" },
  ];

  return (
    <section id="integrations" style={{ padding: "120px 0", background: "var(--bg-soft)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", position: "relative", overflow: "hidden" }}>
      <PlusMark top={36} left={64} />
      <PlusMark top={36} right={64} />
      <PlusMark bottom={36} left={64} />
      <PlusMark bottom={36} right={64} />
      <div className="line-grid" style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }} />
      <div className="container" style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 56, alignItems: "center" }}>
          <FadeUp>
            <Eyebrow>INTEGRATIONS</Eyebrow>
            <h2 className="h-section" style={{ marginTop: 14 }}>
              Plug into the tools you <em>already use</em>.
            </h2>
            <p className="lead" style={{ marginTop: 16 }}>
              Paper Trail sits at the center of your knowledge stack. Import from reference managers, sync to note tools, and export
              clean citations — without leaving your flow.
            </p>
            <div className="col gap-12" style={{ marginTop: 24 }}>
              {[
                ["Reference managers", "Zotero, Mendeley, EndNote — full library sync."],
                ["Note tools", "Obsidian, Notion — bidirectional links to source passages."],
                ["Academic databases", "arXiv, Google Scholar, PubMed — search inside Paper Trail."],
                ["Cite anywhere", "BibTeX, RIS, APA, MLA, Chicago — one click."],
              ].map(([t, s], i) => (
                <div key={i} className="row gap-12" style={{ alignItems: "flex-start" }}>
                  <span style={{ marginTop: 4, color: "var(--accent)" }}><I.link /></span>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t}</div>
                    <div className="text-mute" style={{ fontSize: 13.5 }}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="row gap-12" style={{ marginTop: 28 }}>
              <a href="#" className="btn btn-primary">See all integrations <I.arrow /></a>
              <a href="#" className="btn btn-ghost">Read API docs</a>
            </div>
          </FadeUp>

          <FadeUp delay={120}>
            <div ref={orbitRef} style={{ position: "relative", aspectRatio: "1 / 1", maxWidth: 540, marginLeft: "auto" }}>
              {/* Concentric rings */}
              <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <circle cx="50" cy="50" r="22" fill="none" stroke="var(--line-2)" strokeWidth="0.16" strokeDasharray="0.6 0.6" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="var(--line-2)" strokeWidth="0.16" strokeDasharray="0.6 0.6" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="var(--line-2)" strokeWidth="0.16" strokeDasharray="0.6 0.6" />
                {/* Lines from center to each integration */}
                {integrations.map((it, i) => (
                  <g key={i}>
                    <line
                      x1="50" y1="50" x2={it.x} y2={it.y}
                      stroke="var(--ink-4)" strokeOpacity="0.35"
                      strokeWidth="0.18"
                      strokeDasharray="0.5 0.4"
                    />
                    {/* Animated dot moving along line */}
                    <circle r="0.55" fill="var(--accent)">
                      <animateMotion
                        dur={`${2.5 + (i % 4) * 0.7}s`}
                        repeatCount="indefinite"
                        path={`M50,50 L${it.x},${it.y}`}
                        keyPoints="0;1"
                        keyTimes="0;1"
                        begin={`${i * 0.3}s`}
                      />
                      <animate attributeName="opacity" values="0;1;1;0" dur={`${2.5 + (i % 4) * 0.7}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
                    </circle>
                  </g>
                ))}
              </svg>

              {/* Center: Paper Trail */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", padding: "14px 22px", borderRadius: 14, background: "var(--ink)", color: "var(--paper)", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 12px 30px rgba(0,0,0,0.22)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.08)", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>P</span>
                <span style={{ fontFamily: "var(--serif)", fontSize: 22 }}>Paper Trail</span>
              </div>

              {/* Integration nodes */}
              {integrations.map((it, i) => (
                <div key={i} style={{
                  position: "absolute", left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%,-50%)",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "7px 12px",
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 12.5, color: "var(--ink-2)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  animation: `float-y ${4 + (i % 3) * 0.6}s ease-in-out infinite`,
                  animationDelay: `${(i * 0.2)}s`,
                  whiteSpace: "nowrap"
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, background: it.color, color: "white",
                    display: "grid", placeItems: "center",
                    fontFamily: "var(--mono)", fontWeight: 600, fontSize: 10
                  }}>{it.icon}</span>
                  {it.name}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

export default Integrations;
