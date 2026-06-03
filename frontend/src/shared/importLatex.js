// LaTeX → editor blocks importer.
//
// Tolerant subset parser. Reads the LaTeX shape we ourselves emit from
// `generateLaTeX()` (IEEEtran style: \title / \author with
// \IEEEauthorblockN+A / abstract / IEEEkeywords / sections / tabular /
// figure / equation / lstlisting / bibliography) plus enough common
// variants — single-block \IEEEauthorblockN with comma-separated names,
// itemize/enumerate/description lists inside section bodies, \textbf /
// \textit / \texttt / \textsc / \emph inline commands, \label / \cite /
// \ref references, \subsection / \subsubsection headers — that a paper
// authored in Overleaf with an IEEEtran template round-trips without
// surprises.
//
// Design rules:
//   - Never throw. Unknown commands become plain text, not errors.
//   - Always return *some* blocks even on malformed input — at minimum
//     an empty frontmatter so the editor has a valid scaffold.
//   - Collect warnings for things we silently skipped so the UI can
//     surface a "X commands ignored" tooltip if it wants to.

const ID = () => 'b-' + Math.random().toString(36).slice(2, 10);

// ─── Low-level helpers ────────────────────────────────────────────────────

/**
 * Find the matching closing `}` for the opening `{` at index `openAt`.
 * Handles nested braces and escaped `\{` / `\}`.
 */
function matchBrace(src, openAt) {
  if (src[openAt] !== '{') return -1;
  let depth = 1;
  for (let i = openAt + 1; i < src.length; i++) {
    const c = src[i];
    if (c === '\\') { i++; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Read the {…} argument that follows a command at `start` (where `start`
 * points at the `{`). Returns `[innerText, indexAfterClosingBrace]` or
 * `[null, start]` if no balanced argument is found.
 */
function readArg(src, start) {
  let i = start;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] !== '{') return [null, start];
  const close = matchBrace(src, i);
  if (close === -1) return [null, start];
  return [src.slice(i + 1, close), close + 1];
}

/**
 * Unwrap every `\cmd{...}` to its inner content. Handles nested braces
 * via `matchBrace`. Used for `\textbf`, `\textit`, etc.
 */
function unwrapCommand(text, cmd) {
  const re = new RegExp(`\\\\${cmd}\\s*\\{`, 'g');
  let result = '';
  let cursor = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index < cursor) continue; // can happen after re.lastIndex stomp
    const argStart = m.index + m[0].length - 1;
    const argEnd = matchBrace(text, argStart);
    if (argEnd === -1) continue;
    result += text.slice(cursor, m.index) + text.slice(argStart + 1, argEnd);
    cursor = argEnd + 1;
    re.lastIndex = cursor;
  }
  result += text.slice(cursor);
  return result;
}

/**
 * Remove `\cmd{...}` and its argument entirely (the opposite of
 * `unwrapCommand`). Used for `\label`, `\caption` inside floats, etc.
 */
function stripCommand(text, cmd) {
  const re = new RegExp(`\\\\${cmd}\\s*\\{`, 'g');
  let result = '';
  let cursor = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index < cursor) continue;
    const argStart = m.index + m[0].length - 1;
    const argEnd = matchBrace(text, argStart);
    if (argEnd === -1) continue;
    result += text.slice(cursor, m.index);
    cursor = argEnd + 1;
    re.lastIndex = cursor;
  }
  result += text.slice(cursor);
  return result;
}

/**
 * Strip line-comments (`% …` to end of line) but preserve `\%`.
 */
function stripComments(src) {
  return src
    .split('\n')
    .map(line => {
      let out = '';
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '\\') { out += line[i] + (line[i + 1] || ''); i++; continue; }
        if (line[i] === '%') break;
        out += line[i];
      }
      return out;
    })
    .join('\n');
}

/**
 * Convert `\begin{enumerate|itemize|description}…\end{…}` to a plain-text
 * list with `1.` / `•` / **label:** prefixes. Runs *before* `delatex` so
 * the `\item` token can still be matched verbatim.
 */
function convertLists(text) {
  // Use \n\n between items so each becomes its own paragraph after the
  // line-wrap collapse in delatex(). Single \n would get merged back
  // into one big paragraph.
  text = text.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, body) => {
    let i = 0;
    return '\n\n' + body
      .split(/\\item\b/)
      .filter(part => part.trim())
      .map(part => `${++i}. ${part.trim()}`)
      .join('\n\n') + '\n\n';
  });
  text = text.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, body) => {
    return '\n\n' + body
      .split(/\\item\b/)
      .filter(part => part.trim())
      .map(part => `• ${part.trim()}`)
      .join('\n\n') + '\n\n';
  });
  text = text.replace(/\\begin\{description\}([\s\S]*?)\\end\{description\}/g, (_, body) => {
    return '\n\n' + body
      .replace(/\\item\s*\[([^\]]*)\]\s*/g, '\n\n**$1** ')
      .trim() + '\n\n';
  });
  return text;
}

/**
 * Master text-cleaner. Converts a slice of LaTeX into plain readable text
 * suitable for the editor's content fields.
 *
 * @param {string} text   LaTeX source slice.
 * @param {object} opts
 * @param {boolean} opts.singleLine  Collapse `\\` line-breaks to spaces.
 */
function delatex(text, opts = {}) {
  if (!text) return '';
  const { singleLine = false } = opts;

  let s = text;

  // 1) Convert lists before generic cleanup so `\item` survives.
  s = convertLists(s);

  // 2a) Replace cross-references with a [?] placeholder so sentences
  //     like "Figure~\ref{fig:arch}" don't collapse to "Figure".
  s = s.replace(/\\(?:ref|eqref|pageref)\s*\{[^{}]*\}/g, '[?]');

  // 2b) Strip commands that carry an argument we don't want to display.
  for (const cmd of [
    'label', 'cite', 'index',
    'IEEEauthorrefmark', 'IEEEauthorblocknumber',
    'textsuperscript', 'textsubscript',
    'footnote', 'thanks', 'href',
  ]) {
    s = stripCommand(s, cmd);
  }

  // 2c) A handful of math commands worth substituting to Unicode so
  //     "$\square$" at end-of-proof and "\ldots" in body text don't
  //     leak as raw LaTeX.
  s = s
    .replace(/\\square\b/g, '□')
    .replace(/\\ldots\b/g, '…')
    .replace(/\\cdots\b/g, '⋯')
    .replace(/\\to\b/g, '→')
    .replace(/\\rightarrow\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\Rightarrow\b/g, '⇒')
    .replace(/\\le\b/g, '≤')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\ne\b/g, '≠')
    .replace(/\\times\b/g, '×')
    .replace(/\\pm\b/g, '±')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\epsilon\b/g, 'ε')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\tau\b/g, 'τ')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\in\b/g, '∈')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\subseteq\b/g, '⊆')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')
    .replace(/\\emptyset\b/g, '∅')
    .replace(/\\bigcup\b/g, '⋃')
    .replace(/\\bigcap\b/g, '⋂')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\infty\b/g, '∞');

  // 3) Unwrap commands that wrap inline text we want to keep.
  for (const cmd of [
    'textbf', 'textit', 'emph', 'texttt', 'textsc', 'textrm', 'textsf',
    'mathrm', 'mathbf', 'mathit',
    'underline',
  ]) {
    s = unwrapCommand(s, cmd);
  }

  // 4) Convert \subsection{X} / \subsubsection{X} to inline bold so they
  //    don't disappear from section bodies.
  s = s.replace(/\\subsubsection\*?\s*\{([^{}]*)\}/g, '\n\n**$1**\n\n');
  s = s.replace(/\\subsection\*?\s*\{([^{}]*)\}/g, '\n\n**$1**\n\n');

  // 5) LaTeX spacing commands — replace with a regular space.
  s = s.replace(/\\(?:;|,|:|!|quad|qquad|enspace|hspace\s*\{[^{}]*\}|vspace\s*\{[^{}]*\})/g, ' ');

  // 6) Common character escapes.
  s = s
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/~/g, ' ')
    .replace(/``/g, '"')
    .replace(/''/g, '"')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/\\@\./g, '.')
    .replace(/\\par\b/g, '\n\n');

  // 7) `\\` line break — to newline normally, to space for inline fields.
  s = s.replace(/\\\\(?:\s*\[[^\]]*\])?/g, singleLine ? ' ' : '\n');

  // 8) Whitespace tidy-up. Critical: LaTeX source line-wraps (single
  //    `\n` between lines of the same paragraph) are NOT paragraph
  //    breaks — they're just soft-wraps in the .tex file. Collapse them
  //    to spaces. Only `\n\n` (a true blank line) survives as a
  //    paragraph break.
  s = s
    .replace(/\\\s/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')        // strip surrounding spaces on newlines
    .replace(/\n{2,}/g, '\x00P\x00') // mark real paragraph breaks
    .replace(/\n/g, ' ')              // ← line-wraps become spaces
    .replace(/\x00P\x00/g, '\n\n')   // restore paragraph breaks
    .replace(/[ \t]+/g, ' ')          // collapse any new doubled spaces
    .trim();

  if (singleLine) s = s.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

  return s;
}

// ─── Environment + section finders ────────────────────────────────────────

function findEnvironments(src, name) {
  const beginRe = new RegExp(`\\\\begin\\{${name}\\}`, 'g');
  const endStr = `\\end{${name}}`;
  const out = [];
  let m;
  while ((m = beginRe.exec(src)) !== null) {
    const startTag = m.index;
    const afterBegin = beginRe.lastIndex;
    let depth = 1;
    let cursor = afterBegin;
    while (cursor < src.length) {
      const nextBegin = src.indexOf(`\\begin{${name}}`, cursor);
      const nextEnd   = src.indexOf(endStr, cursor);
      if (nextEnd === -1) break;
      if (nextBegin !== -1 && nextBegin < nextEnd) {
        depth++;
        cursor = nextBegin + `\\begin{${name}}`.length;
        continue;
      }
      depth--;
      if (depth === 0) {
        out.push({
          start: startTag,
          end: nextEnd + endStr.length,
          inner: src.slice(afterBegin, nextEnd),
        });
        beginRe.lastIndex = nextEnd + endStr.length;
        break;
      }
      cursor = nextEnd + endStr.length;
    }
  }
  return out;
}

/**
 * Remove every occurrence of `\begin{name}…\end{name}` from `src`.
 * Used to strip floats from section bodies after they've been extracted
 * as their own blocks.
 */
function stripEnvironments(src, name) {
  const envs = findEnvironments(src, name);
  if (!envs.length) return src;
  let out = '';
  let cursor = 0;
  for (const env of envs) {
    out += src.slice(cursor, env.start);
    cursor = env.end;
  }
  out += src.slice(cursor);
  return out;
}

// ─── Per-block parsers ────────────────────────────────────────────────────

function parseFrontmatter(src, warnings) {
  const block = {
    id: ID(),
    type: 'frontmatter',
    title: '',
    authors: [],
    affiliations: [],
    emails: '',
  };

  // Title
  const tMatch = src.match(/\\title\s*\{/);
  if (tMatch) {
    const [arg] = readArg(src, tMatch.index + tMatch[0].length - 1);
    if (arg !== null) block.title = delatex(arg, { singleLine: true });
  }

  // Author block — read the \author{...} argument, then mine N+A.
  const aMatch = src.match(/\\author\s*\{/);
  if (aMatch) {
    const [arg] = readArg(src, aMatch.index + aMatch[0].length - 1);
    if (arg !== null) {
      const nMatches = [...arg.matchAll(/\\IEEEauthorblockN\s*\{/g)];
      const aMatches = [...arg.matchAll(/\\IEEEauthorblockA\s*\{/g)];

      // Pull the N (names) and A (affiliations) argument strings.
      const namesArgs = nMatches.map(m => {
        const [a] = readArg(arg, m.index + m[0].length - 1);
        return a || '';
      });
      const affArgs = aMatches.map(m => {
        const [a] = readArg(arg, m.index + m[0].length - 1);
        return a || '';
      });

      // Case A: paired N+A blocks (one per author) — original IEEEtran style.
      if (namesArgs.length > 1 && namesArgs.length === affArgs.length) {
        namesArgs.forEach((nameRaw, i) => {
          const name = delatex(nameRaw, { singleLine: true });
          const affiliation = delatex(affArgs[i], { singleLine: true });
          block.authors.push({ name, sup: String(i + 1), affiliation });
          if (affiliation && !block.affiliations.includes(affiliation)) {
            block.affiliations.push(affiliation);
          }
        });
      }
      // Case B: one big N block with comma-separated names + one shared A.
      else if (namesArgs.length >= 1) {
        // Split on `\and` first; fall back to `,\;` then plain comma.
        const splitNames = (raw) => {
          if (/\\and\b/.test(raw)) return raw.split(/\\and\b/);
          if (/,\s*\\;/.test(raw))  return raw.split(/,\s*\\;/);
          if (/,\s*\\,/.test(raw))  return raw.split(/,\s*\\,/);
          return raw.split(/,(?![^{}]*\})/); // bare comma not inside braces
        };
        const flat = namesArgs.flatMap(splitNames);
        flat.forEach((piece, i) => {
          const name = delatex(piece, { singleLine: true });
          // NB: NO per-author `.affiliation` here. We intentionally let
          // the renderer fall through to `block.affiliations[]` (one
          // shared list) instead of duplicating the same line per author.
          if (name) block.authors.push({ name, sup: String(i + 1) });
        });

        // Split the shared A-block on `\\` line breaks so each visible
        // line in the rendered paper is one entry. Lines that look like
        // emails (`{a,b,c}@d` shorthand or contain `@`) are diverted to
        // `block.emails` so the renderer's Email row picks them up.
        const rawA = affArgs[0] || '';
        const rawLines = rawA
          .split(/\\\\(?:\s*\[[^\]]*\])?/)
          .map(l => delatex(l, { singleLine: true }))
          .filter(Boolean);

        const emails = [];
        for (const line of rawLines) {
          // Detect `{a, b, c}@domain` shorthand and expand.
          const shorthand = line.match(/\{([^}]+)\}\s*@\s*([\w.-]+)/);
          if (shorthand) {
            const locals = shorthand[1].split(/\s*,\s*/);
            const domain = shorthand[2];
            for (const local of locals) emails.push(`${local}@${domain}`);
            continue;
          }
          // Plain `something@something` — push as-is.
          if (/@/.test(line) && /[\w.+-]+@[\w-]+\.[\w.-]+/.test(line)) {
            emails.push(line);
            continue;
          }
          // Otherwise it's a normal affiliation line.
          if (!block.affiliations.includes(line)) block.affiliations.push(line);
        }
        if (emails.length) {
          block.emails = emails.join(', ');
        }
      }
      // Case C: bare \author{Name1 \and Name2}
      else {
        const splits = arg.split(/\\and\b/);
        splits.forEach((piece, i) => {
          const name = delatex(piece, { singleLine: true });
          if (name) block.authors.push({ name, sup: String(i + 1) });
        });
      }
    }
  }

  // Best-effort email mining — only fires if Case B above didn't already
  // populate `block.emails` from a structured A-block.
  if (!block.emails) {
    const emails = [...src.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)].map(m => m[0]);
    block.emails = [...new Set(emails)].join(', ');
  }

  if (!block.title && !block.authors.length) {
    warnings.push('No \\title or \\author found — frontmatter left blank.');
  }
  return block;
}

function parseAbstract(src) {
  const envs = findEnvironments(src, 'abstract');
  if (envs.length === 0) return null;
  const content = delatex(envs[0].inner);
  const kw = findEnvironments(src, 'IEEEkeywords');
  const keywords = kw.length ? delatex(kw[0].inner, { singleLine: true }) : '';
  return { id: ID(), type: 'abstract', content, keywords };
}

function parseSections(src, bibliographyStart, warnings) {
  // Stop parsing sections at the bibliography (or appendix); appendix
  // tables / sections shouldn't leak into the body section list.
  const effectiveSrc = bibliographyStart >= 0
    ? src.slice(0, bibliographyStart)
    : src;

  const sectionRe = /\\section\*?\s*\{/g;
  const positions = [];
  let m;
  while ((m = sectionRe.exec(effectiveSrc)) !== null) {
    const titleStart = m.index + m[0].length - 1;
    const [title, afterTitle] = readArg(effectiveSrc, titleStart);
    if (title === null) continue;
    positions.push({
      start: m.index,
      bodyStart: afterTitle,
      title: delatex(title, { singleLine: true }),
    });
  }

  const blocks = [];
  for (let i = 0; i < positions.length; i++) {
    const here = positions[i];
    const next = positions[i + 1];
    const bodyEnd = next ? next.start : effectiveSrc.length;
    let body = effectiveSrc.slice(here.bodyStart, bodyEnd);
    // Strip floats — they become their own blocks.
    for (const env of ['table', 'table*', 'figure', 'figure*', 'equation', 'equation*',
                       'algorithm', 'algorithm*', 'lstlisting', 'verbatim']) {
      body = stripEnvironments(body, env);
    }
    const cleaned = delatex(body);
    blocks.push({
      id: ID(),
      type: 'section',
      title: here.title,
      sectionKey: here.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24),
      content: cleaned,
    });
  }

  if (blocks.length === 0) {
    warnings.push('No \\section commands found — paper body left empty.');
  }
  return blocks;
}

function parseTables(src) {
  // Skip table* same as table.
  const envs = [...findEnvironments(src, 'table'), ...findEnvironments(src, 'table*')];
  return envs.map(env => {
    const captionMatch = env.inner.match(/\\caption\s*\{/);
    const [caption] = captionMatch
      ? readArg(env.inner, captionMatch.index + captionMatch[0].length - 1)
      : [null];

    const labelMatch = env.inner.match(/\\label\s*\{/);
    const [label] = labelMatch
      ? readArg(env.inner, labelMatch.index + labelMatch[0].length - 1)
      : [null];

    // tabular env body. NB: its `inner` starts with the column-spec
    // argument `{lrrr}` because findEnvironments() doesn't know to
    // consume args. We strip a leading balanced `{…}` ourselves.
    const tabular = findEnvironments(env.inner, 'tabular')[0];
    let rows = [['Header 1', 'Header 2'], ['Cell', 'Cell']];
    if (tabular) {
      let tabBody = tabular.inner;
      // Skip the column-spec argument that immediately follows
      // \begin{tabular}.
      const lead = tabBody.match(/^\s*\{/);
      if (lead) {
        const argEnd = matchBrace(tabBody, lead.index + lead[0].length - 1);
        if (argEnd !== -1) tabBody = tabBody.slice(argEnd + 1);
      }
      tabBody = tabBody
        .replace(/\\(top|mid|bottom)rule/g, '')
        .replace(/\\hline/g, '')
        .replace(/\\renewcommand\s*\{[^{}]*\}\s*\{[^{}]*\}/g, '')
        .trim();
      const parsed = tabBody
        .split(/\\\\(?:\s*\[[^\]]*\])?/)
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => line.split('&').map(c => delatex(c.trim(), { singleLine: true })))
        .filter(row => row.some(cell => cell));
      if (parsed.length) rows = parsed;
    }

    return {
      id: ID(),
      type: 'table',
      caption: delatex(caption || '', { singleLine: true }),
      label: (label || '').trim(),
      rows,
    };
  });
}

function parseFigures(src) {
  const envs = [...findEnvironments(src, 'figure'), ...findEnvironments(src, 'figure*')];
  return envs.map(env => {
    const captionMatch = env.inner.match(/\\caption\s*\{/);
    const [caption] = captionMatch
      ? readArg(env.inner, captionMatch.index + captionMatch[0].length - 1)
      : [null];
    const gfxMatch = env.inner.match(/\\includegraphics(?:\[[^\]]*\])?\s*\{/);
    const [url] = gfxMatch
      ? readArg(env.inner, gfxMatch.index + gfxMatch[0].length - 1)
      : [null];
    return {
      id: ID(),
      type: 'figure',
      caption: delatex(caption || 'Figure caption', { singleLine: true }),
      url: (url || '').trim(),
    };
  });
}

function parseEquations(src) {
  const envs = [...findEnvironments(src, 'equation'), ...findEnvironments(src, 'equation*')];
  return envs.map((env, i) => ({
    id: ID(),
    type: 'equation',
    // Equations keep their LaTeX source — that's the whole point of the
    // block. Strip only `\label{…}` so the eq number isn't repeated.
    content: stripCommand(env.inner, 'label').trim(),
    label: `(${i + 1})`,
  }));
}

function parseCodeBlocks(src) {
  // `lstlisting` envs commonly carry `[caption=…,label=…]` options that
  // we ignore — only the body matters for the editor's code block.
  const envs = findEnvironments(src, 'lstlisting');
  return envs.map(env => {
    let body = env.inner;
    // Strip an optional `[…]` parameter at the very start.
    body = body.replace(/^\s*\[[^\]]*\]/, '').trim();
    return {
      id: ID(),
      type: 'code',
      content: body,
      title: 'Code',
    };
  });
}

function parseReferences(src) {
  const bibitemRe = /\\bibitem\s*(?:\[[^\]]*\])?\s*\{([^}]+)\}([\s\S]*?)(?=\\bibitem|\\end\{thebibliography\}|$)/g;
  const entries = [];
  let m;
  while ((m = bibitemRe.exec(src)) !== null) {
    const text = delatex(m[2], { singleLine: true }).trim();
    if (text) entries.push(`[${entries.length + 1}] ${text}`);
  }
  if (entries.length === 0) return null;
  return { id: ID(), type: 'references', title: 'References', entries };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Parse a LaTeX source string into the editor's block representation.
 *
 * @param {string} source  Full .tex file contents.
 * @returns {{ blocks: object[], warnings: string[] }}
 */
export function parseLatex(source) {
  const warnings = [];
  if (typeof source !== 'string' || !source.trim()) {
    return {
      blocks: [{ id: ID(), type: 'frontmatter', title: '', authors: [], affiliations: [], emails: '' }],
      warnings: ['Empty input.'],
    };
  }

  const clean = stripComments(source);

  const bodyStart = (() => {
    const m = clean.match(/\\begin\{document\}/);
    return m ? m.index + m[0].length : 0;
  })();
  const bodyEnd = (() => {
    const m = clean.match(/\\end\{document\}/);
    return m ? m.index : clean.length;
  })();
  const body = clean.slice(bodyStart, bodyEnd);

  // Where does the bibliography start? Sections after this point are
  // ignored (typically appendices, ack, etc. that don't belong to the
  // section flow).
  const bibStartMatch = body.match(/\\begin\{thebibliography\}|\\bibliography\s*\{/);
  const bibliographyStart = bibStartMatch ? bibStartMatch.index : -1;

  // Frontmatter pieces can live in the preamble (older templates), so we
  // search the full document for them.
  const front      = parseFrontmatter(clean, warnings);
  const abstract   = parseAbstract(body);
  const sections   = parseSections(body, bibliographyStart, warnings);
  const tables     = parseTables(body);
  const figures    = parseFigures(body);
  const equations  = parseEquations(body);
  const codeBlocks = parseCodeBlocks(body);
  const references = parseReferences(body);

  const blocks = [front];
  if (abstract) blocks.push(abstract);
  blocks.push(...sections);
  blocks.push(...tables);
  blocks.push(...figures);
  blocks.push(...equations);
  blocks.push(...codeBlocks);
  if (references) blocks.push(references);

  return { blocks, warnings };
}
