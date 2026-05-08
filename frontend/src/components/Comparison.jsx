import React from 'react'
import { FadeUp, Eyebrow, Window, I } from './Atoms'

function Comparison() {
  const [active, setActive] = React.useState("aid");
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (active === "aid") {
      const t1 = setTimeout(() => setStep(1), 500);
      const t2 = setTimeout(() => setStep(2), 1100);
      const t3 = setTimeout(() => setStep(3), 1700);
      return () => [t1, t2, t3].forEach(clearTimeout);
    } else {
      const t1 = setTimeout(() => setStep(1), 500);
      const t2 = setTimeout(() => setStep(2), 1300);
      return () => [t1, t2].forEach(clearTimeout);
    }
  }, [active]);

  React.useEffect(() => {
    setStep(0);
  }, [active]);

  return (
    <section id="vs" style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.25, pointerEvents: "none" }} />
      <div className="container" style={{ position: "relative" }}>
        <FadeUp className="row center" style={{ justifyContent: "center", marginBottom: 18 }}>
          <Eyebrow>THE DIFFERENCE</Eyebrow>
        </FadeUp>
        <FadeUp delay={80}>
          <h2 className="h-section" style={{ textAlign: "center", maxWidth: 940, margin: "0 auto" }}>
            Other chats <em>guess.</em><br />Aid <em>cites.</em>
          </h2>
        </FadeUp>
        <FadeUp delay={140}>
          <p className="lead" style={{ textAlign: "center", margin: "20px auto 0" }}>
            Watch what happens when both are asked the same research question.
          </p>
        </FadeUp>

        {/* Toggle */}
        <FadeUp delay={200} className="row center" style={{ justifyContent: "center", marginTop: 32 }}>
          <div style={{ display: "inline-flex", padding: 4, border: "1px solid var(--line)", borderRadius: 999, background: "var(--paper)" }}>
            {[
              { id: "other", label: "Other Chat" },
              { id: "aid", label: "Aid" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 500,
                  background: active === t.id ? "var(--ink)" : "transparent",
                  color: active === t.id ? "var(--paper)" : "var(--ink-3)",
                  transition: "all .25s ease",
                  fontFamily: "var(--sans)"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FadeUp>

        {/* Two windows side-by-side */}
        <div style={{ marginTop: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
          {/* Other chat */}
          <FadeUp className="window" style={{ opacity: active === "other" ? 1 : 0.55, transform: active === "other" ? "scale(1.01)" : "scale(0.99)", transition: "all .35s ease", filter: active === "other" ? "none" : "grayscale(0.3)" }}>
            <div className="window-bar">
              <span className="tl-dot tl-r" /><span className="tl-dot tl-y" /><span className="tl-dot tl-g" />
              <div className="window-title">other-chat.com</div>
              <div style={{ width: 42 }} />
            </div>
            <div style={{ padding: 22, minHeight: 380 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 14, letterSpacing: "0.1em" }}>QUERY</div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-soft)", border: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", marginBottom: 18 }}>
                What does Smith et al. (2023) say about verifiability?
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 12, letterSpacing: "0.1em" }}>RESPONSE</div>

              {active === "other" && step >= 1 && (
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
                  Smith et al. (2023) argue that verifiability is{" "}
                  <span style={{ background: "var(--warn-soft)", padding: "1px 4px", borderRadius: 3, borderBottom: "1.5px solid var(--warn)" }}>
                    enhanced by 60% with cross-referencing methods
                  </span>{" "}
                  and propose a novel framework for trust scoring.
                </p>
              )}
              {active === "other" && step >= 2 && (
                <div className="row gap-8 mono" style={{ marginTop: 16, fontSize: 11, color: "var(--warn)", padding: "8px 10px", border: "1px solid color-mix(in oklab, var(--warn) 30%, transparent)", background: "var(--warn-soft)", borderRadius: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: 7, background: "var(--warn)", color: "white", fontSize: 10 }}>!</span>
                  <span style={{ color: "oklch(0.4 0.12 30)" }}>HALLUCINATION DETECTED — claim not present in source. No paragraph reference. No page number.</span>
                </div>
              )}
              {active === "other" && step >= 2 && (
                <div className="row gap-12 mono" style={{ marginTop: 14, fontSize: 11, color: "var(--ink-4)" }}>
                  <span style={{ color: "var(--warn)" }}>✕ NO SOURCE</span>
                  <span style={{ color: "var(--warn)" }}>✕ NO CITATION</span>
                  <span style={{ color: "var(--warn)" }}>✕ FABRICATED %</span>
                </div>
              )}
            </div>
          </FadeUp>

          {/* Aid */}
          <FadeUp delay={80} className="window" style={{ opacity: active === "aid" ? 1 : 0.55, transform: active === "aid" ? "scale(1.01)" : "scale(0.99)", transition: "all .35s ease", borderColor: active === "aid" ? "color-mix(in oklab, var(--verify) 50%, var(--line))" : "var(--line)" }}>
            <div className="window-bar" style={{ background: active === "aid" ? "linear-gradient(to bottom, color-mix(in oklab, var(--verify-soft) 50%, var(--paper)), var(--paper))" : undefined }}>
              <span className="tl-dot tl-r" /><span className="tl-dot tl-y" /><span className="tl-dot tl-g" />
              <div className="window-title">aid.app · verified</div>
              <div style={{ width: 42 }} />
            </div>
            <div style={{ padding: 22, minHeight: 380, position: "relative" }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 14, letterSpacing: "0.1em" }}>QUERY</div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-soft)", border: "1px solid var(--line)", fontSize: 13.5, color: "var(--ink-2)", marginBottom: 18 }}>
                What does Smith et al. (2023) say about verifiability?
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", marginBottom: 12, letterSpacing: "0.1em" }}>RESPONSE</div>

              {active === "aid" && step >= 1 && (
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
                  Smith et al. (2023) report that source verification by independent reviewers reduced false-positive claims by{" "}
                  <strong>40%</strong>{" "}
                  <span className="src-chip" style={{ verticalAlign: "middle" }}><span className="num">[1]</span> p. 12</span>
                  {step >= 2 && <>, and that cross-referencing improves accuracy by <strong>28%</strong> <span className="src-chip" style={{ verticalAlign: "middle" }}><span className="num">[3]</span> p. 14</span></>}.
                </p>
              )}
              {active === "aid" && step >= 3 && (
                <div className="row gap-12 mono" style={{ marginTop: 16, fontSize: 11, color: "oklch(0.36 0.07 150)", padding: "10px 12px", border: "1px solid color-mix(in oklab, var(--verify) 35%, transparent)", background: "var(--verify-soft)", borderRadius: 8 }}>
                  <span style={{ color: "var(--verify)" }}><I.check /></span>
                  <span>2 SOURCES VERIFIED</span>
                  <span>·</span>
                  <span>0 HALLUCINATIONS</span>
                  <span>·</span>
                  <span>FAITHFULNESS 99.4%</span>
                </div>
              )}

              {/* Connecting dots from chip to source mark */}
              {active === "aid" && step >= 3 && (
                <svg style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: 0, pointerEvents: "none" }}>
                  <defs>
                    <pattern id="dots-pat" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.6" fill="var(--verify)" />
                    </pattern>
                  </defs>
                </svg>
              )}
            </div>
          </FadeUp>
        </div>

        {/* Comparison table */}
        <FadeUp delay={160} style={{ marginTop: 56 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderBottom: "1px solid var(--line)" }}>
              <div style={{ padding: "16px 22px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.12em" }}>CRITERIA</div>
              <div style={{ padding: "16px 22px", fontWeight: 500, color: "var(--ink-3)", borderLeft: "1px solid var(--line)" }}>Other Chat</div>
              <div style={{ padding: "16px 22px", fontWeight: 500, borderLeft: "1px solid var(--line)", background: "color-mix(in oklab, var(--verify-soft) 50%, transparent)" }}>Aid</div>
            </div>
            {[
              ["Cites every claim with line-level anchors", false, true],
              ["Detects hallucinations on-device", false, true],
              ["Multi-document synthesis (1,000+)", false, true],
              ["Works on YOUR uploaded PDFs", true, true],
              ["Citation export — APA / MLA / Chicago", false, true],
              ["Built for academic workflows", false, true],
              ["Faithfulness audit log", false, true],
            ].map(([label, a, b], i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", borderBottom: i < 6 ? "1px solid var(--line)" : "none", fontSize: 14 }}>
                <div style={{ padding: "16px 22px", color: "var(--ink-2)" }}>{label}</div>
                <div style={{ padding: "16px 22px", borderLeft: "1px solid var(--line)", color: a ? "var(--ink-2)" : "var(--ink-4)" }}>
                  {a ? <span style={{ color: "var(--verify)" }}><I.check /></span> : <span style={{ color: "var(--warn)" }}><I.x /></span>}
                </div>
                <div style={{ padding: "16px 22px", borderLeft: "1px solid var(--line)", background: "color-mix(in oklab, var(--verify-soft) 30%, transparent)" }}>
                  {b ? <span style={{ color: "var(--verify)" }}><I.check /></span> : <span style={{ color: "var(--warn)" }}><I.x /></span>}
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

export default Comparison;
