// src/utils/blockRegistry.js
// Maps block type strings to their React components.

import TitleBlock from '../components/Editor/Blocks/TitleBlock.jsx'
import AbstractBlock from '../components/Editor/Blocks/AbstractBlock.jsx'
import KeywordsBlock from '../components/Editor/Blocks/KeywordsBlock.jsx'
import SectionBlock from '../components/Editor/Blocks/SectionBlock.jsx'
import TableBlock from '../components/Editor/Blocks/TableBlock.jsx'
import FigureBlock from '../components/Editor/Blocks/FigureBlock.jsx'
import EquationBlock from '../components/Editor/Blocks/EquationBlock.jsx'
import CodeBlock from '../components/Editor/Blocks/CodeBlock.jsx'
import AlgorithmBlock from '../components/Editor/Blocks/AlgorithmBlock.jsx'
import ReferencesBlock from '../components/Editor/Blocks/ReferencesBlock.jsx'
import AcknowledgmentBlock from '../components/Editor/Blocks/AcknowledgmentBlock.jsx'
import TheoremBlock from '../components/Editor/Blocks/TheoremBlock.jsx'
import AppendixBlock from '../components/Editor/Blocks/AppendixBlock.jsx'

const BLOCK_REGISTRY = {
  title:          TitleBlock,
  abstract:       AbstractBlock,
  keywords:       KeywordsBlock,
  section:        SectionBlock,
  table:          TableBlock,
  figure:         FigureBlock,
  equation:       EquationBlock,
  code:           CodeBlock,
  algorithm:      AlgorithmBlock,
  references:     ReferencesBlock,
  acknowledgment: AcknowledgmentBlock,
  theorem:        TheoremBlock,
  appendix:       AppendixBlock,
}

export function getBlockComponent(type) {
  return BLOCK_REGISTRY[type] || null
}

export default BLOCK_REGISTRY
