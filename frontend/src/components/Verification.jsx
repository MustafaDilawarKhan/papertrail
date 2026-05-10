import React, { useEffect, useState } from 'react'
import { FadeUp, Eyebrow, I, Window } from './Atoms'

function Verification({ tweaks }) {
  const [activeChip, setActiveChip] = useState(0);
  const passages = [
    "source verification by independent reviewers reduced false-positive claims by 40%",
    "data integrity is maintained when raw inputs are stored alongside derived metrics",
    "cross-referencing improves accuracy by 28% across heterogeneous document types"
  ];

  useEffect(() => {
    const id = setInterval(() => setActiveChip(c => (c + 1) % 3), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="verify" style={{ padding: "100px 0", background: "var(--bg-soft)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", position: "relative" }}>
      <div className="line-grid" style={{ position: "absolute", inset: 0, opacity: 0.5, pointerEvents: "none" }} />
      <div className="container" style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 56, alignItems: "center" }}>
          <FadeUp>
            <Eyebrow>SOURCE HIGHLIGHTING</Eyebrow>
            <h2 className="h-section" style={{ marginTop: 14 }}>
              From <em>claim</em> to <em>proof</em>, in one click.
            </h2>
            <p className="lead" style={{ marginTop: 16 }}>
              Every sentence Paper Trail generates carries a citation chip. Click it — and the document on the left scrolls,
              highlights the exact line, and shows you the raw evidence.
            </p>
            <div className="col gap-16" style={{ marginTop: 28 }}>
              {[
                ["Source Grounding", "Paper Trail only answers using your uploaded document library."],
                ["Confidence scoring", "Paper Trail flags claims with weak source coverage in amber."],
                ["Multi-doc synthesis", "Combine insights from 50+ papers into a single verified response."]
              ].map(([t, s], i) => (
                <div key={i} className="row gap-12" style={{ alignItems: "flex-start" }}>
                  <span style={{ marginTop: 4, color: "var(--verify)" }}><I.check /></span>
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>{t}</div>
                    <div className="text-mute" style={{ fontSize: 13.5 }}>{s}</div>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={120}>
            <div style={{ position: "relative" }}>
              <Window title="Smith et al. (2023) — Methodology">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 360 }}>
                  {/* Doc */}
                  <div style={{ padding: 18, borderRight: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.7 }}>
                    <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 10 }}>P. 12 / 28</div>
                    <p>The researchers employed a randomized controlled trial with 500 participants over 6 months.</p>
                    <p>
                      We found that{" "}
                      <span className="src-mark" style={{ background: activeChip === 0 ? undefined : "transparent", borderColor: activeChip === 0 ? undefined : "transparent", transition: "all .4s ease" }}>{passages[0]}</span>
                      .
                    </p>
                    <p>
                      Further,{" "}
                      <span className="src-mark" style={{ background: activeChip === 1 ? undefined : "transparent", borderColor: activeChip === 1 ? undefined : "transparent", transition: "all .4s ease" }}>{passages[1]}</span>
                      .
                    </p>
                    <p>
                      Notably,{" "}
                      <span className="src-mark" style={{ background: activeChip === 2 ? undefined : "transparent", borderColor: activeChip === 2 ? undefined : "transparent", transition: "all .4s ease" }}>{passages[2]}</span>
                      .
                    </p>
                  </div>
                  {/* Answer */}
                  <div style={{ padding: 18, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, position: "relative" }}>
                    <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 10 }}>AID · ANSWER</div>
                    <p>The trial demonstrated three robust effects:</p>
                    <div className="col gap-8" style={{ marginTop: 8 }}>
                      {passages.map((p, i) => (
                        <div key={i} onClick={() => setActiveChip(i)} className="row gap-8" style={{ alignItems: "flex-start", padding: "8px 10px", borderRadius: 8, border: "1px solid " + (activeChip === i ? "color-mix(in oklab, var(--verify) 50%, transparent)" : "var(--line)"), background: activeChip === i ? "var(--verify-soft)" : "transparent", transition: "all .35s ease", cursor: "pointer" }}>
                          <span className="src-chip" style={{ flexShrink: 0 }}><span className="num">[{i + 1}]</span></span>
                          <span style={{ fontSize: 12 }}>{p}.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Window>
              {/* tag */}
              <div className="mono" style={{ position: "absolute", bottom: -28, right: 0, fontSize: 10.5, color: "var(--ink-4)", letterSpacing: "0.12em" }}>
                LIVE · CYCLES EVERY 2.4S
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

export default Verification;
