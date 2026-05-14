// src/data/ieeeElements.js
// All element block types available in the left sidebar Elements tab.

const IEEE_ELEMENTS = [
  { id: 'text',       label: 'Text Block',          icon: 'notes',          blockType: 'section',    description: 'Body text paragraph' },
  { id: 'figure',     label: 'Figure',              icon: 'image',          blockType: 'figure',     description: 'Image with caption below' },
  { id: 'table',      label: 'Table',               icon: 'table_chart',    blockType: 'table',      description: 'Data table with caption above' },
  { id: 'equation',   label: 'Equation',            icon: 'functions',      blockType: 'equation',   description: 'LaTeX math equation' },
  { id: 'code',       label: 'Code Block',          icon: 'code',           blockType: 'code',       description: 'Source code listing' },
  { id: 'citation',   label: 'Citation',            icon: 'format_quote',   blockType: 'citation',   description: 'Insert inline citation [N]' },
  { id: 'bullet',     label: 'Bullet List',         icon: 'format_list_bulleted', blockType: 'list', listType: 'bullet', description: 'Unordered list' },
  { id: 'numbered',   label: 'Numbered List',       icon: 'format_list_numbered', blockType: 'list', listType: 'numbered', description: 'Ordered list' },
  { id: 'algorithm',  label: 'Algorithm',           icon: 'account_tree',   blockType: 'algorithm',  description: 'Algorithm pseudocode block' },
  { id: 'theorem',    label: 'Theorem / Lemma',     icon: 'lightbulb',      blockType: 'theorem',    description: 'Theorem, lemma, or proof' },
  { id: 'divider',    label: 'Divider',             icon: 'horizontal_rule',blockType: 'divider',    description: 'Visual separator' },
]

export default IEEE_ELEMENTS
