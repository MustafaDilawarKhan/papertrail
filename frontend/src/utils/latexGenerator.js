// src/utils/latexGenerator.js
// Converts paper block JSON → compilable .tex string.

import { LATEX_DOCUMENT_CLASS, LATEX_REQUIRED_PACKAGES, LATEX_CONDITIONAL_PACKAGES } from './ieeeConstants.js'

function escape(str) {
  if (!str) return ''
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

function htmlToLatex(html) {
  if (!html) return ''
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
    .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
    .replace(/<u>(.*?)<\/u>/g, '\\underline{$1}')
    .replace(/<sup>(.*?)<\/sup>/g, '\\textsuperscript{$1}')
    .replace(/<sub>(.*?)<\/sub>/g, '\\textsubscript{$1}')
    .replace(/<span[^>]*data-cite-id="[^"]*"[^>]*>\[(\d+)\]<\/span>/g, '\\cite{ref$1}')
    .replace(/<br\s*\/?>/g, '\\\\\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function titleToLatex(block) {
  let out = `\\title{${escape(block.title || 'Untitled Paper')}}`
  if (block.subtitle) out += `\n\\subtitle{${escape(block.subtitle)}}`
  return out
}

function authorsToLatex(block) {
  if (!block.authors || block.authors.length === 0) return '\\author{}'
  return `\\author{\n${
    block.authors.map((a, i) =>
      `  \\IEEEauthorblockN{${escape(a.name)}}\n  \\IEEEauthorblockA{${escape(a.affiliation)}\\\\${a.email || ''}}`
    ).join('\n\\and\n')
  }\n}`
}

function abstractToLatex(block) {
  return `\\begin{abstract}\n${escape(block.content || '')}\n\\end{abstract}`
}

function keywordsToLatex(block) {
  const kw = (block.keywords || []).join(', ')
  return `\\begin{IEEEkeywords}\n${escape(kw)}\n\\end{IEEEkeywords}`
}

function sectionToLatex(block, sectionNumber) {
  const cmd = block.autoNumber !== false ? '\\section' : '\\section*'
  return `${cmd}{${escape(block.sectionTitle || '')}}\n${htmlToLatex(block.content || '')}`
}

function tableToLatex(block) {
  const cols = (block.columns || []).map(() => 'l').join('')
  const rows = block.rows || []
  const headerRow = rows[0]
    ? rows[0].cells.map(c => `\\textbf{${escape(c.content || '')}}`).join(' & ') + ' \\\\'
    : ''
  const bodyRows = rows.slice(1)
    .map(r => r.cells.map(c => escape(c.content || '')).join(' & ') + ' \\\\')
    .join('\n')

  return `
\\begin{table}[t]
\\centering
\\caption{${escape(block.caption || '')}}
\\label{${block.label || 'tab:unnamed'}}
\\begin{tabular}{${cols}}
\\toprule
${headerRow}
\\midrule
${bodyRows}
\\bottomrule
\\end{tabular}
\\end{table}`
}

function figureToLatex(block) {
  return `
\\begin{figure}[${block.placement || 't'}]
  \\centering
  \\includegraphics[width=${(block.width || 100) / 100}\\columnwidth]{${block.label || 'fig:unnamed'}}
  \\caption{${escape(block.caption || '')}}
  \\label{${block.label || 'fig:unnamed'}}
\\end{figure}`
}

function equationToLatex(block) {
  if (block.numbered !== false) {
    return `\\begin{equation}\n  ${block.latex || ''}\n  \\label{${block.label || 'eq:unnamed'}}\n\\end{equation}`
  }
  return `\\begin{equation*}\n  ${block.latex || ''}\n\\end{equation*}`
}

function codeToLatex(block) {
  return `
\\begin{lstlisting}[language=${block.language || 'Python'},caption={${escape(block.caption || '')}},label={${block.label || 'lst:unnamed'}}]
${block.code || ''}
\\end{lstlisting}`
}

function algorithmToLatex(block) {
  const steps = (block.steps || [])
    .map(s => `${'  '.repeat(s.indent || 0)}${s.keyword ? `\\textbf{${s.keyword}} ` : ''}${escape(s.content || '')}`)
    .join('\n')
  return `
\\begin{algorithm}[t]
\\caption{${escape(block.title || '')}}
\\label{${block.label || 'alg:unnamed'}}
\\begin{algorithmic}[1]
${steps}
\\end{algorithmic}
\\end{algorithm}`
}

function acknowledgmentToLatex(block) {
  return `\\section*{Acknowledgment}\n${htmlToLatex(block.content || '')}`
}

function referencesToLatex(citations) {
  return `\\bibliographystyle{IEEEtran}\n\\bibliography{references}`
}

function generateBibFile(citations) {
  return citations
    .filter(c => c.bibtex)
    .map(c => c.bibtex)
    .join('\n\n')
}

/**
 * Generate a complete, compilable .tex file from paper state.
 */
export function generateLatex(state, citations) {
  const { template, blocks } = state
  const docClass = LATEX_DOCUMENT_CLASS[template] || LATEX_DOCUMENT_CLASS['ieee-conference']

  // Determine conditional packages
  const blockTypes = new Set(blocks.map(b => b.type))
  const conditionalPkgs = []
  if (blockTypes.has('algorithm')) conditionalPkgs.push(...LATEX_CONDITIONAL_PACKAGES.algorithm)
  if (blockTypes.has('chart')) conditionalPkgs.push(...LATEX_CONDITIONAL_PACKAGES.chart)
  if (blockTypes.has('diagram')) conditionalPkgs.push(...LATEX_CONDITIONAL_PACKAGES.diagram)

  const allPkgs = [...LATEX_REQUIRED_PACKAGES, ...conditionalPkgs]
  const usePackages = allPkgs.map(p => `\\usepackage{${p}}`).join('\n')

  const bodyParts = []
  let sectionCounter = 0

  for (const block of blocks) {
    switch (block.type) {
      case 'title':
        bodyParts.push(titleToLatex(block))
        bodyParts.push(authorsToLatex(block))
        break
      case 'abstract':
        bodyParts.push(abstractToLatex(block))
        break
      case 'keywords':
        bodyParts.push(keywordsToLatex(block))
        break
      case 'section':
        sectionCounter++
        bodyParts.push(sectionToLatex(block, sectionCounter))
        break
      case 'table':
        bodyParts.push(tableToLatex(block))
        break
      case 'figure':
        bodyParts.push(figureToLatex(block))
        break
      case 'equation':
        bodyParts.push(equationToLatex(block))
        break
      case 'code':
        bodyParts.push(codeToLatex(block))
        break
      case 'algorithm':
        bodyParts.push(algorithmToLatex(block))
        break
      case 'acknowledgment':
        bodyParts.push(acknowledgmentToLatex(block))
        break
      case 'references':
        bodyParts.push(referencesToLatex(citations || []))
        break
      default:
        break
    }
  }

  const tex = `${docClass}

${usePackages}

${bodyParts.slice(0, 2).join('\n')}

\\begin{document}

\\maketitle

${bodyParts.slice(2).join('\n\n')}

\\end{document}`

  return { tex, bib: generateBibFile(citations || []) }
}

export default generateLatex
