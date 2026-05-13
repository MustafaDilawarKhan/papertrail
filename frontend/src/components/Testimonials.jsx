import React from 'react'
import { FadeUp, Eyebrow, I } from './Atoms'

function Testimonials() {
  const items = [
    { q: "Paper Trail has completely transformed my literature review process. The ability to verify the AI's claims instantly gives me the confidence I need for my PhD thesis.", n: "Sarah J.", r: "PhD Candidate · Biology · MIT" },
    { q: "Unlike other AI tools that hallucinate references, Paper Trail links directly to my uploaded PDFs. It's a game-changer for systematic reviews.", n: "Dr. Mark T.", r: "Clinical Researcher · Mayo Clinic" },
    { q: "The multi-document analysis saves me hours of cross-referencing. I can ask a single question and get an answer synthesized from 20 papers.", n: "Emily R.", r: "Data Analyst · Stanford HAI" },
    { q: "I trusted Paper Trail with my dissertation literature review. It found seven papers I'd missed and traced every claim to a paragraph.", n: "Aleksei P.", r: "DPhil candidate · Oxford" }
  ];
  return (
    <section style={{ padding: "120px 0", background: "var(--bg-soft)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="container">
        <FadeUp className="row between" style={{ alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 }}>
          <div>
            <Eyebrow>RESEARCHERS ON PAPER TRAIL</Eyebrow>
            <h2 className="h-section" style={{ marginTop: 14, maxWidth: 720 }}>
              Real labs.<br />Real <em>citations.</em>
            </h2>
          </div>
          <div className="row gap-32" style={{ flexWrap: "wrap" }}>
            <Stat n="12,400+" l="Active researchers" />
            <Stat n="1.4M" l="Papers analyzed" />
            <Stat n="99.4%" l="Faithfulness score" />
          </div>
        </FadeUp>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          {items.map((t, i) => (
            <FadeUp key={i} delay={i * 60} className="card" style={{ padding: 28 }}>
              <div className="row" style={{ marginBottom: 18, gap: 4 }}>
                {[0,1,2,3,4].map(k => <span key={k} style={{ color: "var(--ink-2)" }}>★</span>)}
              </div>
              <p style={{ fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.3, color: "var(--ink)", marginBottom: 18 }}>
                "{t.q}"
              </p>
              <div className="row center gap-12">
                <div style={{ width: 36, height: 36, borderRadius: 18, background: "var(--bg-soft)", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink-3)" }}>
                  {t.n.split(" ").map(s => s[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.n}</div>
                  <div className="text-mute" style={{ fontSize: 12 }}>{t.r}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
function Stat({ n, l }) {
  return (
    <div className="col" style={{ minWidth: 110 }}>
      <span style={{ fontFamily: "var(--serif)", fontSize: 38, lineHeight: 1, letterSpacing: "-0.02em" }}>{n}</span>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 6, letterSpacing: "0.08em" }}>{l.toUpperCase()}</span>
    </div>
  );
}

export default Testimonials;
