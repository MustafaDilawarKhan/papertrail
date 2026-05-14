// src/data/ieeeSections.js
// All IEEE section types available in the left sidebar Sections tab.

const IEEE_SECTIONS = [
  { id: 'title-authors', label: 'Title & Authors',  icon: 'badge',         blockType: 'title',          description: 'Paper title and author block' },
  { id: 'abstract',      label: 'Abstract',          icon: 'subject',       blockType: 'abstract',       description: 'Paper abstract (max 200 words)' },
  { id: 'keywords',      label: 'Index Terms',       icon: 'label',         blockType: 'keywords',       description: 'IEEE index terms / keywords' },
  { id: 'introduction',  label: 'Introduction',      icon: 'play_arrow',    blockType: 'section',        sectionKey: 'introduction',  description: 'Introduction section' },
  { id: 'related-work',  label: 'Related Work',      icon: 'menu_book',     blockType: 'section',        sectionKey: 'related-work',  description: 'Literature review' },
  { id: 'methodology',   label: 'Methodology',       icon: 'science',       blockType: 'section',        sectionKey: 'methodology',   description: 'Research methodology' },
  { id: 'system-design', label: 'System Design',     icon: 'architecture',  blockType: 'section',        sectionKey: 'system-design', description: 'System architecture and design' },
  { id: 'results',       label: 'Results',            icon: 'bar_chart',     blockType: 'section',        sectionKey: 'results',       description: 'Experimental results' },
  { id: 'discussion',    label: 'Discussion',         icon: 'forum',         blockType: 'section',        sectionKey: 'discussion',    description: 'Discussion of findings' },
  { id: 'conclusion',    label: 'Conclusion',         icon: 'check_circle',  blockType: 'section',        sectionKey: 'conclusion',    description: 'Conclusions and future work' },
  { id: 'acknowledgment',label: 'Acknowledgment',     icon: 'handshake',     blockType: 'acknowledgment', description: 'Acknowledgment (unnumbered)' },
  { id: 'references',    label: 'References',         icon: 'format_quote',  blockType: 'references',     description: 'Auto-generated references (unnumbered)' },
  { id: 'appendix',      label: 'Appendix',           icon: 'attach_file',   blockType: 'appendix',       description: 'Supplementary materials' },
]

export default IEEE_SECTIONS
