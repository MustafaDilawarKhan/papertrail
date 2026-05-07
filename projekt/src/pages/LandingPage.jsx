import React from 'react'
import { landingFeatures, plans } from '../data/mockData'
import { Icon, Link } from '../components/core'

export function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="brand-inline"><span>Aid</span></div>
        <nav>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#help">Help</a>
        </nav>
        <div className="landing-actions">
          <Link to="/login" className="btn btn-ghost">Sign in</Link>
          <Link to="/register" className="btn btn-dark">Get started free</Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-badge">✦ Verifiable AI Research — Now Available</div>
          <h1>Research with AI you can actually trust.</h1>
          <p>Aid lets you upload documents, ask questions, and get AI answers linked directly back to the exact source passage.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-dark btn-large">Get started free</Link>
            <Link to="/dashboard" className="btn btn-ghost btn-large">See how it works →</Link>
          </div>
          <div className="hero-proof">Trusted by 12,000+ researchers, PhD students, and analysts</div>
          <div className="hero-mockup">
            <div className="mockup-window">
              <div className="mockup-bar"><span/><span/><span/><strong>aid.app / library / research-paper.pdf</strong></div>
              <div className="mockup-body">
                <div className="mockup-doc">
                  <h3>Research Paper</h3>
                  <p><mark>Highlighted source passage</mark> explains how the answer is grounded in the text.</p>
                </div>
                <div className="mockup-chat">
                  <div className="chat-bubble user">What is RAG architecture?</div>
                  <div className="chat-bubble ai">RAG combines retrieval with generation and cites relevant passages. <span className="chip">pg. 3</span> <span className="chip">pg. 7</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <h2>Everything your research workflow needs.</h2>
          <div className="cards-grid">
            {landingFeatures.map((feature) => (
              <article key={feature.title} className="card feature-card">
                <div className="card-icon"><Icon name={feature.icon} /></div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="section section-muted">
          <h2>Start free. Scale when you're ready.</h2>
          <p>No credit card required to get started.</p>
          <div className="plans-grid">
            {plans.map((plan) => (
              <article key={plan.name} className={`card plan-card ${plan.featured ? 'is-featured' : ''}`}>
                <h3>{plan.name}</h3>
                <div className="plan-price">{plan.price}<span>{plan.billing}</span></div>
                <ul>{plan.features.map((item) => <li key={item}>{item}</li>)}</ul>
                <Link to="/register" className={`btn ${plan.featured ? 'btn-dark' : 'btn-ghost'} btn-full`}>Choose {plan.name}</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
