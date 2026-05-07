import React, { useState, useEffect } from 'react'
import { FadeUp, PlusMark, Window, I, Eyebrow } from './Atoms'

function Hero({ tweaks }) {
  const [step, setStep] = useState(0);
  // Hero motion: claim appears -> arrow draws -> source highlights
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 1900);
    const t3 = setTimeout(() => setStep(3), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <section style={{ position: "relative", paddingTop: 56, paddingBottom: 80, overflow: "hidden" }}>
      {/* Decorative dot grid backdrop */}
      <div className="dot-grid dot-grid-fade" style={{ position: "absolute", inset: 0, opacity: 0.6, pointerEvents: "none" }} />
      {/* Plus marks */}
      <PlusMark top={80} left={64} />
      <PlusMark top={80} right={64} />
      <PlusMark bottom={40} left={120} />
      <PlusMark bottom={40} right={120} />

      <div className="container" style={{ position: "relative" }}>
        <FadeUp className="row center" style={{ justifyContent: "center", marginBottom: 22 }}>
          <div className="row center gap-8" style={{ padding: "5px 5px 5px 14px", border: "1px solid var(--line-2)", borderRadius: 999, background: "color-mix(in oklab, var(--paper) 70%, transparent)", fontSize: 12.5, color: "var(--ink-3)" }}>
            <span className="mono" style={{ color: "var(--ink-4)", fontSize: 11 }}>NEW</span>
            <span style={{ width: 1, height: 14, background: "var(--line-2)" }} />
            <span>Source-traceable answers across your entire library</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "var(--ink)", color: "var(--paper)", borderRadius: 999, fontSize: 11 }}>
              Read more <I.arrow />
            </span>
          </div>
        </FadeUp>

        <FadeUp delay={80}>
          <h1 className="display" style={{ textAlign: "center", maxWidth: 1000, margin: "0 auto" }}>
            Trust your AI's insights.<br />
            <em>Verify</em> every claim.
          </h1>
        </FadeUp>

        <FadeUp delay={160}>
          <p className="lead" style={{ textAlign: "center", margin: "22px auto 0", color: "var(--ink-3)" }}>
            Aid is the research assistant that links every answer back to the exact passage in your sources.
            Upload your library, ask anything — and trust what comes back, because you can <em style={{ color: "var(--ink-2)" }}>see where it came from.</em>
          </p>
        </FadeUp>

        <FadeUp delay={220} className="row center gap-12" style={{ justifyContent: "center", marginTop: 28 }}>
          <a href="#" className="btn btn-primary">Start your research <I.arrow /></a>
          <a href="#" className="btn btn-ghost"><I.play /> Watch demo · 1 min</a>
        </FadeUp>

        <div className="row center gap-12 mono" style={{ justifyContent: "center", marginTop: 18, fontSize: 11, color: "var(--ink-4)" }}>
          <span><I.check /> No credit card</span>
          <span style={{ width: 3, height: 3, borderRadius: 2, background: "var(--line-2)" }} />
          <span>Free 50 queries / mo</span>
          <span style={{ width: 3, height: 3, borderRadius: 2, background: "var(--line-2)" }} />
          <span>SOC2-ready</span>
        </div>

        {/* Product window */}
        <FadeUp delay={320} style={{ marginTop: 64, position: "relative" }}>
          <ProductWindow step={step} accent={tweaks.accent} />
        </FadeUp>
      </div>
    </section>
  );
}

function ProductWindow({ step, accent }) {
  return (
    <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto" }}>
      {/* floating bubbles */}
      <div style={{ position: "absolute", top: -16, left: -10, zIndex: 4, animation: "float-y 5s ease-in-out infinite" }}>
        <div className="bubble">What does the study say about verifiability?</div>
      </div>
      <div style={{ position: "absolute", bottom: -24, right: -10, zIndex: 4, animation: "float-y 6s ease-in-out infinite reverse" }}>
        <div className="src-chip"><span className="num">[3]</span> Methodology · p. 12</div>
      </div>

      <Window title="aid.app/library/cognitive-bias-review">
        <div className="row" style={{ minHeight: 460 }}>
          {/* Sidebar */}
          <aside style={{ width: 200, borderRight: "1px solid var(--line)", padding: "16px 14px", background: "color-mix(in oklab, var(--paper) 80%, var(--bg))" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Library</div>
            <div className="col gap-8">
              <div style={{ padding: "6px 8px", borderRadius: 6, background: "color-mix(in oklab, var(--ink) 8%, transparent)", fontSize: 12.5, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
                <I.layers /> Cognitive bias
              </div>
              <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 8 }}>
                <I.doc /> Smith et al. 2023.pdf
              </div>
              <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 8 }}>
                <I.doc /> Jones &amp; Lee 2022.pdf
              </div>
              <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 8 }}>
                <I.doc /> Wang et al. 2024.pdf
              </div>
              <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 8 }}>
                <I.doc /> Patel meta-analysis.pdf
              </div>
            </div>
            <div className="mono" style={{ marginTop: 18, fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Workspaces</div>
            <div className="col gap-8" style={{ marginTop: 8 }}>
              <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ink-3)" }}>Lab — Spring '26</div>
              <div style={{ padding: "6px 8px", fontSize: 12.5, color: "var(--ink-3)" }}>Thesis</div>
            </div>
          </aside>

          {/* Document pane */}
          <div style={{ flex: 1, padding: "18px 22px", borderRight: "1px solid var(--line)", position: "relative" }}>
            <div className="row between center" style={{ marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>SMITH ET AL. (2023) · PAGE 12 / 28</div>
              <div className="row gap-8 mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                <span className="kbd">⌘</span><span className="kbd">K</span>
              </div>
            </div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink-2)", lineHeight: 1.45, marginBottom: 12 }}>
              3.2 Methodology
            </div>
            <div className="col gap-8" style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.7 }}>
              <p>The researchers employed a randomized controlled trial with 500 participants over 6 months. Data was collected via daily self-reporting metrics and verified against clinical outcomes.</p>
              <p>
                {step >= 3 ? (
                  <>
                    Participants were stratified by age and assigned to{" "}
                    <span className="src-mark" style={{ background: step >= 3 ? undefined : "transparent", borderColor: step >= 3 ? undefined : "transparent" }}>
                      one of three intervention arms; cross-referencing improved accuracy by 28%
                    </span>{" "}
                    relative to baseline self-report. Sensitivity analysis confirmed robustness against the chosen prior.
                  </>
                ) : (
                  <>Participants were stratified by age and assigned to one of three intervention arms; cross-referencing improved accuracy by 28% relative to baseline self-report. Sensitivity analysis confirmed robustness against the chosen prior.</>
                )}
              </p>
              <p>The methodology section concludes with limitations: small geographic spread and a homogeneous demographic profile. Future replication is recommended.</p>
            </div>

            {/* Document handle dots */}
            <div style={{ position: "absolute", left: 6, top: 80, bottom: 40, width: 2, borderRadius: 2, background: "color-mix(in oklab, var(--accent) 40%, transparent)", opacity: step >= 3 ? 1 : 0, transition: "opacity .4s ease" }} />
          </div>

          {/* Chat pane */}
          <div style={{ width: 320, padding: "18px 18px", display: "flex", flexDirection: "column" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Conversation</div>

            <div style={{ alignSelf: "flex-end", background: "var(--ink)", color: "#f5efde", padding: "8px 12px", borderRadius: "12px 12px 4px 12px", fontSize: 12.5, maxWidth: 240 }}>
              What does the study say about verifiability?
            </div>

            {step >= 1 && (
              <div className="col gap-8" style={{ marginTop: 14, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55, opacity: step >= 1 ? 1 : 0, transition: "opacity .4s ease" }}>
                <p>
                  The study indicates that source verification by independent reviewers <span className="src-chip" style={{ verticalAlign: "middle" }}><span className="num">1</span></span> reduced false-positive claims by <strong>40%</strong>.
                </p>
                {step >= 2 && (
                  <p>
                    The authors note that <span className="src-mark">cross-referencing improves accuracy by 28%</span> <span className="src-chip" style={{ verticalAlign: "middle" }}><span className="num">3</span></span> when applied across multiple sources.
                  </p>
                )}
              </div>
            )}

            <div style={{ flex: 1 }} />

            {/* SVG link from chip [3] in chat to highlight in doc */}
            {step >= 3 && (
              <svg style={{ position: "absolute", left: -340, top: 220, width: 360, height: 60, overflow: "visible", pointerEvents: "none" }}>
                <path d="M0 30 C 80 0, 180 60, 340 30" stroke={accent || "var(--accent)"} strokeWidth="1.4" fill="none" strokeDasharray="320" strokeDashoffset={step >= 3 ? 0 : 320} style={{ transition: "stroke-dashoffset 1s ease" }} />
                <circle cx="340" cy="30" r="3.5" fill={accent || "var(--accent)"} />
              </svg>
            )}

            <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 999, border: "1px solid var(--line-2)", background: "var(--bg-soft)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-4)" }}>
              <I.sparkle />
              <span>Ask another question…</span>
              <span className="kbd" style={{ marginLeft: "auto" }}>⏎</span>
            </div>
          </div>
        </div>
      </Window>

      {/* Tag below window */}
      <div className="row center gap-12 mono" style={{ justifyContent: "center", marginTop: 18, fontSize: 11, color: "var(--ink-4)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--verify)", boxShadow: "0 0 0 3px color-mix(in oklab, var(--verify) 25%, transparent)" }} /> 3 SOURCES VERIFIED</span>
        <span>·</span>
        <span>0.4S RESPONSE</span>
        <span>·</span>
        <span>0 HALLUCINATIONS</span>
      </div>
    </div>
  );
}

export default Hero;
