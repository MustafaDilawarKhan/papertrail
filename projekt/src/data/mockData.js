export const landingFeatures = [
  { icon: 'search', title: 'Source-verified answers', text: 'Every response links back to the exact source passage in your documents.' },
  { icon: 'chat', title: 'Chat with your library', text: 'Ask questions across one file or an entire collection with grounded AI responses.' },
  { icon: 'bookmark', title: 'Smart annotations', text: 'Highlight text, generate citations, and add notes in one workflow.' },
  { icon: 'folder', title: 'Organized research', text: 'Keep papers, notes, URLs, and citations in structured collections.' },
  { icon: 'quote', title: 'Citation management', text: 'Generate APA, MLA, or Chicago citations from any verified passage.' },
  { icon: 'groups', title: 'Collaborative workspaces', text: 'Share the same library, chats, and annotations with teammates.' },
]

export const plans = [
  { name: 'Free', price: '$0', billing: 'forever', features: ['500 AI words/day', '3 uploads/day', 'Basic citation styles', '1 collaborator per folder'], featured: false },
  { name: 'Pro', price: '$20', billing: '/ seat / month', features: ['Unlimited AI words', 'Unlimited uploads', '300MB or 10,000 pages/import', 'Priority support'], featured: true },
  { name: 'Max', price: '$167', billing: '/ seat / month', features: ['Deep Search agent', 'Complete Form agent', 'Early access to new features', 'Advanced model access'], featured: false },
]

export const docs = [
  { type: 'PDF', title: 'Trustworthiness of AI in HRI', authors: 'L. Roberts, J. Miller', added: 'Jan 10, 2026', full: true, slug: 'trust-ai-hri' },
  { type: 'PDF', title: 'Measuring Trust in Human-Robot Collaboration', authors: 'Sarah G. Jenkins', added: 'Jan 12, 2026', full: true, slug: 'measuring-trust' },
  { type: 'DOCX', title: 'The Role of Trust in Human-Robot Interaction', authors: 'M. Cohen', added: 'Jan 15, 2026', full: true, slug: 'trust-in-hri' },
  { type: 'URL', title: 'arxiv.org/abs/2301.04267 — Multi-Agent RAG', authors: '—', added: 'Feb 1, 2026', full: false, slug: 'arxiv-2301' },
]

export const collections = [
  { name: 'ML Research', count: 12, updated: 'Updated 3h ago' },
  { name: 'Thesis Sources', count: 28, updated: 'Updated 5h ago' },
  { name: 'HCI Papers', count: 8, updated: 'Updated 1d ago' },
]

export const activity = [
  'Chat session on ResearchPaper.pdf — 2h ago',
  'Annotation added to LitReview.pdf — 5h ago',
  'New document uploaded: Notes.docx — 1d ago',
  'Collection shared with team — 2d ago',
]

export const workspaces = [
  { name: 'Thesis Research', members: 4, docs: 18, active: '2h ago' },
  { name: 'HCI Lab', members: 6, docs: 31, active: '4h ago' },
  { name: 'Clinical Studies', members: 3, docs: 11, active: 'Today' },
]

export const users = [
  { name: 'Ahmed Raza', email: 'ahmed@ex.com', plan: 'Pro', status: 'Active', joined: 'Jan 15, 2026', docs: 42 },
  { name: 'Sara Khan', email: 'sara@ex.com', plan: 'Free', status: 'Active', joined: 'Feb 2, 2026', docs: 8 },
  { name: 'Bot Account', email: 'bot@spam.com', plan: 'Free', status: 'Flagged', joined: 'Mar 1, 2026', docs: 203 },
]

export const models = [
  { name: 'GPT-4.5 Mini', provider: 'OpenAI', plans: 'Free, Plus', status: 'Active', defaultFor: 'Free' },
  { name: 'GPT-4o', provider: 'OpenAI', plans: 'Plus, Pro', status: 'Active', defaultFor: 'Plus' },
  { name: 'Claude Opus 4.7', provider: 'Anthropic', plans: 'Max', status: 'Active', defaultFor: 'Max' },
]

export const flags = [
  { name: 'source_highlighting', desc: 'Clickable source highlights in chat', state: 'ON' },
  { name: 'web_url_import', desc: 'Save web pages as documents', state: 'ON' },
  { name: 'agent_mentions', desc: '@ agent commands in chat', state: 'BETA' },
]

export const logs = [
  { time: '2026-05-01 09:22', actor: 'owner@aid.com', action: 'Plan changed', target: 'ahmed@ex.com', details: 'Free → Pro' },
  { time: '2026-05-01 10:05', actor: 'owner@aid.com', action: 'Model disabled', target: 'GPT-3.5-turbo', details: 'Deprecated model removed' },
  { time: '2026-05-01 11:30', actor: 'system', action: 'Flag raised', target: 'bot@spam.com', details: 'Upload volume anomaly' },
]

export const services = [
  { name: 'API Server', status: 'Operational', uptime: '99.98%', latency: '42ms' },
  { name: 'Inference Service', status: 'Operational', uptime: '99.95%', latency: '1.4s' },
  { name: 'Embedding Pipeline', status: 'Degraded', uptime: '98.71%', latency: '4.2s' },
]
