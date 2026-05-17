import React from 'react'

// The file naming is inverse to the use-case on purpose:
//   skeleton_document_animation_dark.svg  → dark glyphs, shown in LIGHT mode
//   skeleton_document_animation_light.svg → light glyphs, shown in DARK mode
import lightModeLogo from '../assets/skeleton_document_animation_dark.svg'
import darkModeLogo from '../assets/skeleton_document_animation_light.svg'

// Renders the Paper Trail mark with a theme-aware SVG.
// We render BOTH variants and let CSS hide the wrong one based on
// `body.theme-dark`. That keeps the API stateless — no React context
// or prop drilling needed for the footer / any future placement.
function BrandLogo({ size = 32, alt = 'Paper Trail', style }) {
  const common = { height: size, width: 'auto', display: 'block', ...style }
  return (
    <>
      <img src={lightModeLogo} alt={alt} className="brand-logo brand-logo--light" style={common} />
      <img src={darkModeLogo}  alt={alt} className="brand-logo brand-logo--dark"  style={common} />
    </>
  )
}

export default BrandLogo
