// src/utils/ieeeConstants.js
// All IEEE typography values — hardcoded, never user-editable.

export const IEEE_FONTS = {
  body: '"Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace',
}

export const IEEE_SIZES = {
  title:         '32px',
  authorName:    '14.67px',
  affiliation:   '13.33px',
  email:         '12px',
  abstract:      '12px',
  keywords:      '12px',
  body:          '13.33px',
  heading1:      '13.33px',
  heading2:      '13.33px',
  figureCaption: '10.67px',
  tableCaption:  '10.67px',
  tableBody:     '12px',
  reference:     '10.67px',
  footnote:      '10.67px',
  code:          '10.67px',
  algorithm:     '12px',
}

export const IEEE_LEADING = {
  body:      '16px',
  abstract:  '14.67px',
  reference: '13.33px',
}

export const IEEE_PAGE = {
  width:        '816px',
  height:       '1056px',
  marginTop:    '72px',
  marginBottom: '96px',
  marginLeft:   '60px',
  marginRight:  '60px',
  textWidth:    '696px',
  textHeight:   '888px',
  columnWidth:  '324px',
  columnGap:    '48px',
}

export const IEEE_SPACING = {
  paragraphIndent: '3.5mm',
  sectionBefore:   '12px',
  sectionAfter:    '4px',
}

export const IEEE_CSS_VARS = {
  '--ieee-font-body':      '"Times New Roman", Times, serif',
  '--ieee-font-mono':      '"Courier New", Courier, monospace',
  '--ieee-size-body':      '13.33px',
  '--ieee-size-abstract':  '12px',
  '--ieee-size-caption':   '10.67px',
  '--ieee-size-reference': '10.67px',
  '--ieee-size-title':     '32px',
  '--ieee-leading-body':   '16px',
  '--ieee-indent-para':    '3.5mm',
}

export const LATEX_DOCUMENT_CLASS = {
  'ieee-conference':   '\\documentclass[10pt,conference]{IEEEtran}',
  'ieee-transactions': '\\documentclass[10pt,journal]{IEEEtran}',
  'ieee-single':       '\\documentclass[10pt,journal,onecolumn]{IEEEtran}',
  'ieee-letter':       '\\documentclass[9pt,technote]{IEEEtran}',
}

export const LATEX_REQUIRED_PACKAGES = [
  'amsmath,amssymb,amsfonts',
  'mathptmx',
  'graphicx',
  'cite',
  'url',
  'hyperref',
  'booktabs',
  'multirow',
  'array',
  'tabularx',
  'float',
  'caption',
  'subfig',
  'balance',
  'flushend',
  'microtype',
  'xcolor',
  'listings',
  'cleveref',
  'siunitx',
]

export const LATEX_CONDITIONAL_PACKAGES = {
  algorithm:  ['algorithm2e', 'algpseudocode', 'algorithmicx'],
  chart:      ['pgfplots'],
  diagram:    ['tikz'],
  tableNotes: ['threeparttable'],
  customList: ['enumitem'],
}
