import React from 'react'
import { FadeUp, Eyebrow, I } from './Atoms'

function Features() {
  return (
    <section id="features" style={{ padding: "120px 0 60px", position: "relative" }}>
      <div className="container">
        <FadeUp className="row center" style={{ justifyContent: "center", marginBottom: 18 }}>
          <Eyebrow>FEATURES — 01/04</Eyebrow>
        </FadeUp>
        <FadeUp delay={80}>
          <h2 className="h-section" style={{ textAlign: "center", maxWidth: 880, margin: "0 auto" }}>
            A research stack designed for <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>traceable</em> answers.
          </h2>
        </FadeUp>
        <FadeUp delay={140}>
          <p className="lead" style={{ textAlign: "center", margin: "20px auto 0" }}>
            Five primitives that turn a pile of PDFs into a verifiable knowledge base — built for academic rigor, not generic chat.
          </p>
        </FadeUp>

        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "auto auto", gap: 18 }}>
          {/* Big — Multi-document */}
          <FadeUp className="card" style={{ gridRow: "span 2", padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "26px 28px 8px" }}>
              <div className="row center gap-8" style={{ marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}>
                  <I.layers />
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.12em" }}>01 — MULTI-DOC</span>
              </div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 30, lineHeight: 1.05, marginBottom: 8 }}>Ask one question, query your whole library.</h3>
              <p className="text-mute" style={{ fontSize: 14.5, maxWidth: 480 }}>
                Aid synthesizes across 1,000+ documents in seconds — comparing findings, surfacing contradictions, and citing every source on the way.
              </p>
            </div>
            <div style={{ flex: 1, padding: "8px 28px 26px", position: "relative" }}>
              <DocConstellation />
            </div>
          </FadeUp>

          {/* Source verification */}
          <FadeUp delay={80} className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="row between center" style={{ marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}>
                <I.shield />
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>02</span>
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.1, marginBottom: 6 }}>Source highlighting.</h3>
            <p className="text-mute" style={{ fontSize: 13.5 }}>Every claim links to the exact line, in the exact PDF. Click — see proof.</p>
            <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px dashed var(--line)" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 6 }}>CITATION</div>
              <div className="row center gap-8">
                <span className="src-chip"><span className="num">[3]</span> Methodology · p. 12</span>
                <span className="src-chip"><span className="num">[7]</span> p. 88</span>
              </div>
            </div>
          </FadeUp>

          {/* Semantic search */}
          <FadeUp delay={140} className="card">
            <div className="row between center" style={{ marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}>
                <I.search />
              </div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>03</span>
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.1, marginBottom: 6 }}>Semantic citation search.</h3>
            <p className="text-mute" style={{ fontSize: 13.5 }}>Find papers by meaning — not just keywords. Paper Trail understands the context behind your query.</p>
            <div style={{ marginTop: 14, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--bg-soft)", fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--ink-3)" }}>
              ▸ studies refuting prior X w/ n &gt; 1k
            </div>
          </FadeUp>
        </div>

        {/* Bottom row */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          <FadeUp className="card">
            <div className="row between center" style={{ marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}><I.highlight /></div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>04</span>
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, marginBottom: 6 }}>Annotations &amp; notes.</h3>
            <p className="text-mute" style={{ fontSize: 13.5 }}>Highlight, comment, and capture insights inline — your annotations become context for the AI.</p>
          </FadeUp>
          <FadeUp delay={80} className="card">
            <div className="row between center" style={{ marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}><I.table /></div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>05</span>
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, marginBottom: 6 }}>Extract data into tables.</h3>
            <p className="text-mute" style={{ fontSize: 13.5 }}>Pull out sample sizes, p-values, outcomes — across dozens of papers — into one comparable grid.</p>
          </FadeUp>
          <FadeUp delay={140} className="card">
            <div className="row between center" style={{ marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)" }}><I.users /></div>
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>06</span>
            </div>
            <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, marginBottom: 6 }}>Workspaces for teams.</h3>
            <p className="text-mute" style={{ fontSize: 13.5 }}>Share libraries, conversations, and citations with collaborators — with role-based permissions.</p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* Animated constellation of docs orbiting a center node */
function DocConstellation() {
  const docs = [
    { x: 18, y: 28, label: "Smith '23" },
    { x: 78, y: 22, label: "Jones '22" },
    { x: 12, y: 76, label: "Wang '24" },
    { x: 82, y: 78, label: "Patel '25" },
    { x: 50, y: 12, label: "Liu '24" },
    { x: 50, y: 92, label: "Kahn '23" },
  ];
  return (
    <div style={{ position: "relative", height: 220 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {docs.map((d, i) => (
          <line key={i} x1={50} y1={50} x2={d.x} y2={d.y} stroke="var(--line-2)" strokeWidth="0.18" strokeDasharray="0.6 0.4" />
        ))}
      </svg>
      {/* center */}
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: 14, background: "var(--ink)", color: "var(--paper)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: 28, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}>
        A
      </div>
      {docs.map((d, i) => (
        <div key={i} style={{ position: "absolute", left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%,-50%)", padding: "5px 9px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 6, fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6, animation: `float-y ${4 + (i % 3)}s ease-in-out infinite`, animationDelay: `${i * 0.3}s`, fontFamily: "var(--mono)" }}>
          <span style={{ width: 8, height: 10, background: "var(--bg-soft)", border: "1px solid var(--line-2)", borderRadius: 1 }} />
          {d.label}
        </div>
      ))}
    </div>
  );
}

export default Features;
