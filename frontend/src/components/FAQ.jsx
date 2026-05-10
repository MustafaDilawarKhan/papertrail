import React, { useState } from 'react'
import { FadeUp, Eyebrow, I } from './Atoms'

function FAQ() {
  const items = [
    { q: "How does Paper Trail prevent hallucinations?", a: "Paper Trail is explicitly designed for source verification. Every answer it provides is generated strictly from documents you upload, and it includes a clickable link to the exact sentence used to formulate the answer. We also run a faithfulness audit on every response — flagging any claim that isn't fully supported." },
    { q: "What file types can I upload?", a: "Currently, Paper Trail supports PDF, DOCX, and TXT files, plus web pages via URL. Scanned PDFs are OCR'd automatically. Images and audio are on the roadmap." },
    { q: "Is my research data secure?", a: "Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We use strict multi-tenant isolation — your documents and chats are completely private to your account or shared workspaces. SOC2 Type II is in progress." },
    { q: "Can I collaborate with my team?", a: "Yes. Team plans offer Workspaces where you can share collections of documents and chats with colleagues or fellow researchers. Roles include Owner, Editor, Viewer." },
    { q: "Which AI models does Paper Trail use?", a: "Paper Trail runs on the latest frontier models (GPT-4-class and Claude-class). Pro plans let you choose your preferred underlying model per query." },
    { q: "How is Paper Trail different from ChatGPT or Elicit?", a: "Other tools either lack citations entirely or cite from a closed corpus. Paper Trail only answers from YOUR uploaded library — and pins every claim to a specific line in a specific PDF you can click to inspect." },
  ];
  const [open, setOpen] = useState(0);

  return (
    <section style={{ padding: "120px 0", position: "relative" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 56, alignItems: "flex-start" }}>
          <FadeUp>
            <Eyebrow>QUESTIONS</Eyebrow>
            <h2 className="h-section" style={{ marginTop: 14 }}>
              The fine print, <em>fully sourced</em>.
            </h2>
            <p className="lead" style={{ marginTop: 16 }}>
              Still curious? Read the docs or ping our research team — most replies happen within an hour.
            </p>
            <div className="row gap-12" style={{ marginTop: 24 }}>
              <a href="#" className="btn btn-primary">Read the docs <I.arrow /></a>
              <a href="#" className="btn btn-ghost">Talk to us</a>
            </div>
          </FadeUp>

          <FadeUp delay={120}>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {items.map((it, i) => (
                <div key={i} style={{ borderBottom: i < items.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <button
                    onClick={() => setOpen(open === i ? -1 : i)}
                    style={{ width: "100%", textAlign: "left", padding: "20px 24px", background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>{it.q}</span>
                    <span className="mono" style={{ color: "var(--ink-4)", fontSize: 16, transition: "transform .25s ease", transform: open === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  <div style={{
                    maxHeight: open === i ? 200 : 0,
                    overflow: "hidden",
                    transition: "max-height .35s ease",
                  }}>
                    <p style={{ padding: "0 24px 22px", margin: 0, color: "var(--ink-3)", fontSize: 14, lineHeight: 1.6, maxWidth: 680 }}>
                      {it.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
