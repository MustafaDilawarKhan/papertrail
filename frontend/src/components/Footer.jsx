import React from 'react'
import BrandLogo from './BrandLogo'

function Footer() {
  return (
    <footer style={{ padding: "60px 0 0", borderTop: "1px solid var(--line)" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", gap: 32, paddingBottom: 56 }}>
          <div>
            <div className="row center gap-8" style={{ marginBottom: 14 }}>
              <BrandLogo size={44} />
              <span style={{ fontFamily: "var(--serif)", fontSize: 22 }}>Paper Trail</span>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink-3)", maxWidth: 280, marginBottom: 22 }}>
              The verifiable AI research assistant. Built for researchers who can't afford to be wrong.
            </p>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--verify)", marginRight: 8, verticalAlign: "middle" }} />
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>
          {[
            ["Product", ["Features", "Verify", "Integrations", "Pricing", "Changelog"]],
            ["Resources", ["Documentation", "API", "Research blog", "Citation guide", "Templates"]],
            ["Company", ["About", "Careers", "Press kit", "Contact", "Brand"]],
            ["Legal", ["Privacy", "Terms", "Security", "DPA", "Cookies"]],
          ].map(([h, links]) => {
            const sectionMap = {
              "Features": "#features",
              "Verify": "#verify",
              "Integrations": "#integrations",
              "Pricing": "#pricing"
            };
            return (
              <div key={h}>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.14em", marginBottom: 16, textTransform: "uppercase" }}>{h}</div>
                <div className="col gap-8">
                  {links.map(l => (
                    <a key={l} href={sectionMap[l] || "#"} style={{ fontSize: 14, color: "var(--ink-2)" }}>{l}</a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="row between center" style={{ padding: "20px 0", borderTop: "1px solid var(--line)", flexWrap: "wrap", gap: 12 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            © 2026 PAPER TRAIL · MADE WITH CARE FOR RESEARCHERS.
          </div>
          <div className="row gap-16 mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
            <a href="#">TWITTER</a>
            <a href="#">GITHUB</a>
            <a href="#">LINKEDIN</a>
            <a href="#">DISCORD</a>
          </div>
        </div>

        {/* Big AID wordmark */}
        <div style={{ position: "relative", textAlign: "center", padding: "40px 0 20px", overflow: "hidden" }}>
          <div style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(120px, 22vw, 320px)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            color: "color-mix(in oklab, var(--ink-2) 18%, transparent)",
            backgroundImage: "linear-gradient(to bottom, var(--ink) 0%, color-mix(in oklab, var(--ink) 30%, transparent) 70%, transparent 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            userSelect: "none"
          }}>
            Paper Trail
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
