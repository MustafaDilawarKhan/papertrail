// src/pages/EditorPage.jsx
// Entry point for the PaperTrail IEEE research paper editor.

import React from 'react'
import EditorShell from '../components/Editor/EditorShell.jsx'
import { PaperProvider } from '../contexts/PaperContext.jsx'
import { CitationProvider } from '../contexts/CitationContext.jsx'

export default function EditorPage() {
  return (
    <PaperProvider>
      <CitationProvider>
        <EditorShell />
      </CitationProvider>
    </PaperProvider>
  )
}
