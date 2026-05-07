import { useEffect } from 'react'
import { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle } from './tweaks-panel'
import Nav from './components/Nav'
import Hero from './components/Hero'
import TrustBar from './components/TrustBar'
import Features from './components/Features'
import Verification from './components/Verification'
import Comparison from './components/Comparison'
import Workflow from './components/Workflow'
import Integrations from './components/Integrations'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import CTA from './components/CTA'
import Footer from './components/Footer'

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "#3a7d57",
    "headlineStyle": "serif",
    "dark": false,
    "showHeroAnim": true
  }/*EDITMODE-END*/);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", !!tweaks.dark);
    document.documentElement.style.setProperty("--accent", tweaks.accent);
    document.body.classList.toggle("headline-sans", tweaks.headlineStyle === "sans");
  }, [tweaks]);

  return (
    <>
      <Nav tweaks={tweaks} setTweak={setTweak} />
      <main>
        <Hero tweaks={tweaks} />
        <TrustBar />
        <Features />
        <Verification tweaks={tweaks} />
        <Comparison />
        <Workflow />
        <Integrations />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Brand">
          <TweakColor
            label="Accent (links + verify dots)"
            value={tweaks.accent}
            onChange={(v) => setTweak("accent", v)}
            options={["#3a7d57", "#2a5b9e", "#cc6d3e", "#7c3aed", "#171513"]}
          />
          <TweakRadio
            label="Headline font"
            value={tweaks.headlineStyle}
            onChange={(v) => setTweak("headlineStyle", v)}
            options={[{ value: "serif", label: "Serif" }, { value: "sans", label: "Sans" }]}
          />
        </TweakSection>
        <TweakSection title="Theme">
          <TweakToggle
            label="Dark mode"
            value={tweaks.dark}
            onChange={(v) => setTweak("dark", v)}
          />
          <TweakToggle
            label="Hero animation"
            value={tweaks.showHeroAnim}
            onChange={(v) => setTweak("showHeroAnim", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

export default App
