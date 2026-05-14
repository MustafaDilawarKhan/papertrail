// src/data/ieeeTemplates.js
// Template definitions for the template selector dropdown.

const IEEE_TEMPLATES = [
  {
    id: 'ieee-conference',
    label: 'IEEE Conference',
    description: 'Two-column format for conference proceedings',
    columns: 2,
    pageNumbers: false,
    documentClass: '\\documentclass[10pt,conference]{IEEEtran}',
  },
  {
    id: 'ieee-transactions',
    label: 'IEEE Transactions',
    description: 'Two-column journal format with page numbers',
    columns: 2,
    pageNumbers: true,
    documentClass: '\\documentclass[10pt,journal]{IEEEtran}',
  },
  {
    id: 'ieee-single',
    label: 'IEEE Single Column',
    description: 'Single-column journal format',
    columns: 1,
    pageNumbers: true,
    documentClass: '\\documentclass[10pt,journal,onecolumn]{IEEEtran}',
  },
  {
    id: 'ieee-letter',
    label: 'IEEE Letter',
    description: 'Short technical note format (9pt)',
    columns: 2,
    pageNumbers: true,
    documentClass: '\\documentclass[9pt,technote]{IEEEtran}',
  },
]

export default IEEE_TEMPLATES
