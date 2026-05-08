import React from 'react'
import { FadeUp, Eyebrow, I } from './Atoms'

function Workflow() {
  const steps = [
    { n: "01", title: "Upload", body: "Drop PDFs, DOCX, or paste a URL. Aid OCRs scanned pages, extracts metadata, and indexes everything in seconds." },
    { n: "02", title: "Ask",    body: "Use natural language. @-mention specific docs, or ask across your whole library. Aid streams answers in under 5s." },
    { n: "03", title: "Verify", body: "Click any citation chip. Aid scrolls to the source, highlights the exact line, and shows a confidence score." },
    { n: "04", title: "Cite",   body: "Export answers with references in APA, MLA, Chicago — or send straight to Zotero, Notion, Obsidian." }
  ];
  return (
    <section style={{ padding: "120px 0", position: "relative" }}>
      <div className="container">
        <FadeUp className="row center" style={{ justifyContent: "center", marginBottom: 18 }}>
          <Eyebrow>HOW IT WORKS</Eyebrow>
        </FadeUp>
        <FadeUp delay={80}>
          <h2 className="h-section" style={{ textAlign: "center", maxWidth: 880, margin: "0 auto" }}>
            Four steps from <em>library</em> to <em>citation.</em>
          </h2>
        </FadeUp>

        <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative" }}>
          {/* connecting line */}
          <div style={{ position: "absolute", left: "10%", right: "10%", top: 38, height: 1, background: "var(--line)", zIndex: 0 }} />
          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={i * 80} className="card" style={{ background: "var(--paper)", borderRight: i < steps.length - 1 ? "1px solid var(--line)" : "1px solid var(--line)", borderRadius: 0, ...(i === 0 ? { borderTopLeftRadius: 14, borderBottomLeftRadius: 14 } : {}), ...(i === steps.length - 1 ? { borderTopRightRadius: 14, borderBottomRightRadius: 14 } : {}), padding: "32px 26px 30px", position: "relative", zIndex: 1 }}>
              <div className="row center gap-12" style={{ marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.12em" }}>{s.n}</span>
                <span style={{ display: "grid", width: 28, height: 28, borderRadius: 14, background: "var(--ink)", color: "var(--paper)", placeItems: "center", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 26, lineHeight: 1.05, marginBottom: 8 }}>{s.title}.</h3>
              <p className="text-mute" style={{ fontSize: 13.5 }}>{s.body}</p>
              <WorkflowVisual i={i} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowVisual({ i }) {
  if (i === 0) {
    return (
      <div style={{ marginTop: 22, padding: "14px 12px", border: "1.5px dashed var(--line-2)", borderRadius: 10, textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-4)", marginBottom: 6 }}>DROP FILES</div>
        <div className="row center gap-8" style={{ justifyContent: "center" }}>
          {[0,1,2].map(k => (
            <div key={k} style={{ width: 26, height: 32, background: "var(--bg-soft)", border: "1px solid var(--line)", borderRadius: 3, display: "grid", placeItems: "center", color: "var(--ink-4)", fontFamily: "var(--mono)", fontSize: 9 }}>PDF</div>
          ))}
          <div style={{ color: "var(--ink-4)" }}>+</div>
        </div>
      </div>
    );
  }
  if (i === 1) {
    return (
      <div style={{ marginTop: 22, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 999, background: "var(--bg-soft)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)" }}>
        <span style={{ color: "var(--accent)" }}><I.sparkle /></span>
        <span>What's the consensus on...</span>
        <span className="kbd" style={{ marginLeft: "auto" }}>⏎</span>
      </div>
    );
  }
  if (i === 2) {
    return (
      <div style={{ marginTop: 22, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg-soft)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
        Sources verified <span className="src-chip"><span className="num">[1]</span></span> <span className="src-chip"><span className="num">[3]</span></span>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 22, padding: 12, border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg-soft)", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>
      Smith, J. (2023). <em style={{ color: "var(--ink-2)" }}>Verifiability</em>...
    </div>
  );
}

export default Workflow;
