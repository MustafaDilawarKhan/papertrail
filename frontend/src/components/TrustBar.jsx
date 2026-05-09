import React from 'react'
import { Eyebrow, I } from './Atoms'

// Import logos from assets
import utokyo from '../assets/UTokyo.png'
import stanford from '../assets/stanford-hai.png'
import oxford from '../assets/OXFORD.png'
import mit from '../assets/MIT.jfif'
import cambridge from '../assets/Cambridge.png'
import eth from '../assets/eth-zurich.png'
import berkeley from '../assets/Berkeley.jfif'
import nature from '../assets/nature-methods.png'
import lums from '../assets/LUMS.png'
import nust from '../assets/NUST.png'
import bahria from '../assets/bahria.png'

function TrustBar() {
  const logos = [
    { name: "UTokyo", src: utokyo },
    { name: "Stanford HAI", src: stanford },
    { name: "Oxford", src: oxford },
    { name: "MIT", src: mit },
    { name: "Cambridge", src: cambridge },
    { name: "ETH Zürich", src: eth },
    { name: "Berkeley", src: berkeley },
    { name: "Nature Methods", src: nature },
    { name: "LUMS", src: lums },
    { name: "NUST", src: nust },
    { name: "Bahria University", src: bahria },
  ];

  return (
    <section style={{ padding: "32px 0 8px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
      <div className="container">
        <div className="row center gap-24" style={{ justifyContent: "space-between", marginBottom: 16 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.14em" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 3, background: "var(--verify)", marginRight: 8, verticalAlign: "middle" }} />
            TRUSTED BY RESEARCHERS FROM LEADING LABS AND UNIVERSITIES
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>2026</div>
        </div>
        <div style={{ overflow: "hidden", maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)", padding: "8px 0 16px" }}>
          <div className="marquee">
            {[...logos, ...logos].map((logo, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 32, margin: "0 24px" }}>
                <img 
                  src={logo.src} 
                  alt={logo.name} 
                  style={{ 
                    height: "24px", 
                    width: "auto", 
                    filter: "grayscale(1) brightness(0.6) contrast(1.2)", 
                    opacity: 0.7,
                    transition: "all 0.3s ease"
                  }} 
                  onMouseEnter={e => {
                    e.currentTarget.style.filter = "grayscale(0) brightness(1)";
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter = "grayscale(1) brightness(0.6) contrast(1.2)";
                    e.currentTarget.style.opacity = "0.7";
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustBar;
