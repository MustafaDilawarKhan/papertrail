import React from 'react'
import { FadeUp, PlusMark, I } from './Atoms'

function CTA() {
  return (
    <section id="pricing" style={{ padding: "100px 0 60px", background: "var(--bg-soft)" }}>
      <div className="container">
        <FadeUp>
          <div style={{
            position: "relative",
            background: "var(--ink)",
            color: "var(--paper)",
            borderRadius: 24,
            overflow: "hidden",
            padding: "72px 56px"
          }}>
            {/* dot pattern */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
              backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1.4px)",
              backgroundSize: "16px 16px",
              maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, #000 30%, transparent 100%)"
            }} />

            {/* Plus marks */}
            <PlusMark top={28} left={28} />
            <PlusMark top={28} right={28} />
            <PlusMark bottom={28} left={28} />
            <PlusMark bottom={28} right={28} />

            <div style={{ position: "relative", textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
              <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 18 }}>
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--verify)", marginRight: 8, verticalAlign: "middle", boxShadow: "0 0 0 3px color-mix(in oklab, var(--verify) 25%, transparent)" }} />
                LIMITED ACCESS — RESEARCHERS &amp; STUDENTS
              </div>
              <h2 className="h-section" style={{ color: "var(--paper)", fontSize: "clamp(38px, 5vw, 64px)" }}>
                Stop second-guessing your AI.<br />
                <em>Start citing it.</em>
              </h2>
              <p style={{ marginTop: 22, fontSize: 17, color: "rgba(255,255,255,0.9)", maxWidth: 560, margin: "22px auto 0" }}>
                Free for 50 queries / month. Pro plans unlock unlimited queries, 1,000-doc libraries, and team workspaces.
              </p>
              <div className="row center gap-12" style={{ justifyContent: "center", marginTop: 30 }}>
                <a href="#/register" className="btn" style={{ background: "var(--paper)", color: "var(--ink)", height: 46, padding: "0 22px", fontSize: 15 }}>
                  Get Paper Trail free <I.arrow />
                </a>
                <a href="#/login" className="btn" style={{ background: "transparent", color: "var(--paper)", height: 46, padding: "0 22px", fontSize: 15, border: "1px solid rgba(255,255,255,0.25)" }}>
                  Book a demo
                </a>
              </div>
              <div className="row center gap-12 mono" style={{ justifyContent: "center", marginTop: 22, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                <span>NO CREDIT CARD</span>
                <span>·</span>
                <span>5-MIN SETUP</span>
                <span>·</span>
                <span>CANCEL ANYTIME</span>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

export default CTA;
