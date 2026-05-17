// DOCX export for the editor. Builds a Word document from the editor's
// `blocks` array using `docx` (pure-JS OOXML writer) + `file-saver`.
//
// Block types handled: frontmatter, abstract, section, table, figure,
// equation, references, algorithm, code. Unknown types fall back to a
// plain paragraph rendered from their `.content`.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  SectionType,
} from 'docx';
import { saveAs } from 'file-saver';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function getSectionNumber(blocks, blockId) {
  const sections = blocks.filter(b => b.type === 'section');
  const idx = sections.findIndex(b => b.id === blockId);
  return idx >= 0 ? ROMAN[idx] : '';
}

function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { after: opts.afterPx ?? 120 },
    children: [
      new TextRun({
        text: text ?? '',
        bold: !!opts.bold,
        italics: !!opts.italic,
        size: opts.size || 22, // half-points; 22 = 11pt
        font: 'Times New Roman',
      }),
    ],
  });
}

function splitParagraphs(content) {
  if (!content) return [''];
  return String(content).split(/\n+/);
}

function blockToParagraphs(block, blocks) {
  switch (block.type) {
    case 'frontmatter': {
      const out = [];
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: block.title || '', bold: true, size: 44, font: 'Times New Roman' })],
      }));
      if (Array.isArray(block.authors) && block.authors.length) {
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: block.authors.map((a, i) => new TextRun({
            text: (i > 0 ? ', ' : '') + (a.name || '') + (a.sup ? a.sup : ''),
            size: 26,
            font: 'Times New Roman',
          })),
        }));
      }
      (block.affiliations || []).forEach(aff => {
        out.push(p(aff, { align: AlignmentType.CENTER, italic: true, size: 20, afterPx: 60 }));
      });
      if (block.emails) {
        out.push(p(block.emails, { align: AlignmentType.CENTER, size: 20, afterPx: 240 }));
      }
      return out;
    }

    case 'abstract': {
      const out = [];
      out.push(new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Abstract—', bold: true, italics: true, size: 22, font: 'Times New Roman' }),
          new TextRun({ text: block.content || '', size: 22, font: 'Times New Roman' }),
        ],
      }));
      if (block.keywords) {
        out.push(new Paragraph({
          spacing: { after: 240 },
          children: [
            new TextRun({ text: 'Index Terms—', bold: true, italics: true, size: 22, font: 'Times New Roman' }),
            new TextRun({ text: block.keywords, size: 22, font: 'Times New Roman' }),
          ],
        }));
      }
      return out;
    }

    case 'section': {
      const out = [];
      const num = getSectionNumber(blocks, block.id);
      const heading = `${num ? num + '. ' : ''}${(block.title || '').toUpperCase()}`;
      out.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: heading, bold: true, size: 22, font: 'Times New Roman' })],
      }));
      splitParagraphs(block.content).forEach(para => {
        out.push(p(para));
      });
      return out;
    }

    case 'table': {
      const out = [];
      out.push(p(`TABLE: ${block.caption || ''}`, { align: AlignmentType.CENTER, bold: true, afterPx: 60 }));
      const rows = Array.isArray(block.rows) ? block.rows : [];
      if (rows.length > 0) {
        out.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map((row, ri) => new TableRow({
            children: (row || []).map(cell => new TableCell({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(cell ?? ''), bold: ri === 0, size: 20, font: 'Times New Roman' })],
              })],
              borders: {
                top:    { style: BorderStyle.SINGLE, size: 4, color: '888888' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
                left:   { style: BorderStyle.SINGLE, size: 4, color: '888888' },
                right:  { style: BorderStyle.SINGLE, size: 4, color: '888888' },
              },
            })),
          })),
        }));
      }
      out.push(p('', { afterPx: 120 }));
      return out;
    }

    case 'figure': {
      return [
        p(`[Figure: ${block.caption || ''}${block.url ? ` — ${block.url}` : ''}]`, { align: AlignmentType.CENTER, italic: true }),
      ];
    }

    case 'equation': {
      return [
        p(`${block.content || ''}    ${block.label || ''}`, { align: AlignmentType.CENTER }),
      ];
    }

    case 'algorithm': {
      const out = [];
      out.push(p(`Algorithm: ${block.title || ''}`, { bold: true, afterPx: 60 }));
      splitParagraphs(block.content).forEach(line => out.push(p(line, { size: 20 })));
      return out;
    }

    case 'code': {
      const out = [];
      splitParagraphs(block.content).forEach(line => {
        out.push(new Paragraph({
          spacing: { after: 0 },
          children: [new TextRun({ text: line, size: 20, font: 'Courier New' })],
        }));
      });
      return out;
    }

    case 'references': {
      const out = [];
      out.push(p((block.title || 'References').toUpperCase(), {
        align: AlignmentType.CENTER, bold: true, afterPx: 120,
      }));
      (block.entries || []).forEach(entry => out.push(p(entry, { size: 20 })));
      return out;
    }

    default:
      return [p(block.content || block.title || '')];
  }
}

export async function exportPaperToDocx(blocks, { filename = 'paper.docx', layoutMode = 'one-column' } = {}) {
  // IEEE-style two-column layout: title/authors span the full page width,
  // then the body (abstract onward) flows in two columns. We model this with
  // two Word sections — Word starts a new section continuously, not on a new
  // page, when `type: CONTINUOUS` is set.
  const isTwoCol = layoutMode === 'two-column' || layoutMode === 'conference';

  const frontmatterBlocks = blocks.filter(b => b.type === 'frontmatter');
  const bodyBlocks = blocks.filter(b => b.type !== 'frontmatter');

  const frontChildren = [];
  frontmatterBlocks.forEach(b => frontChildren.push(...blockToParagraphs(b, blocks)));
  const bodyChildren = [];
  bodyBlocks.forEach(b => bodyChildren.push(...blockToParagraphs(b, blocks)));

  const docSections = isTwoCol
    ? [
        // 1) Single-column header strip for title + authors + affiliations.
        {
          properties: {
            type: SectionType.CONTINUOUS,
            column: { count: 1 },
          },
          children: frontChildren.length ? frontChildren : [new Paragraph({ children: [] })],
        },
        // 2) Two-column body — abstract, sections, tables, refs.
        {
          properties: {
            type: SectionType.CONTINUOUS,
            column: {
              count: 2,
              space: 432, // ~0.3 inch gutter, in twentieths-of-a-point (twips)
              equalWidth: true,
            },
          },
          children: bodyChildren.length ? bodyChildren : [new Paragraph({ children: [] })],
        },
      ]
    : [
        {
          properties: { column: { count: 1 } },
          children: [...frontChildren, ...bodyChildren],
        },
      ];

  const doc = new Document({
    creator: 'Paper Trail',
    title: blocks.find(b => b.type === 'frontmatter')?.title || 'Untitled paper',
    styles: {
      default: {
        document: { run: { font: 'Times New Roman', size: 22 } },
      },
    },
    sections: docSections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
