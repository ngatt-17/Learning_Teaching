import { Fragment, type ReactNode } from 'react';
import type { AiCitation } from '../lib/types';

/**
 * Renders the small subset of formatting the AI returns: **bold**, `code`, line breaks and
 * inline [n] citation markers. Markers become clickable pills when a matching citation exists;
 * no HTML from the model is ever injected.
 */
export function RichText({
  text,
  citations = [],
  onCite,
}: {
  text: string;
  citations?: AiCitation[];
  onCite?: (citation: AiCitation) => void;
}) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {renderInline(line, citations, onCite)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

function renderInline(line: string, citations: AiCitation[], onCite?: (c: AiCitation) => void): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    if (match.index > last) parts.push(line.slice(last, match.index));
    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('**')) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={key} className="px-1 py-0.5 rounded bg-slate-100 text-[0.95em] font-mono">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const citation = citations[Number(token.slice(1, -1)) - 1];
      parts.push(
        citation ? (
          <button
            key={key}
            type="button"
            onClick={() => onCite?.(citation)}
            title={`${citation.title} — Trang ${citation.page}`}
            className="mx-0.5 px-1.5 py-px rounded border border-[#1E3A6E]/25 bg-[#EDF2FA] text-[#1E3A6E] text-[10px] font-bold align-middle hover:bg-[#1E3A6E] hover:text-white cursor-pointer transition-colors"
          >
            {token.slice(1, -1)}
          </button>
        ) : (
          token
        ),
      );
    }
    last = match.index + token.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

/** Clean pill list: "[1] Title — Trang 14" (see .cursorrules citation pattern). */
export function CitationList({
  citations,
  onCite,
}: {
  citations: AiCitation[];
  onCite?: (citation: AiCitation) => void;
}) {
  if (citations.length === 0) return null;
  return (
    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap gap-1">
      {citations.map((c, i) => (
        <button
          key={`${c.material_id}-${c.page}-${i}`}
          type="button"
          onClick={() => onCite?.(c)}
          title={c.snippet}
          className="text-left text-[10px] italic text-slate-500 hover:text-[#1E3A6E] hover:underline cursor-pointer"
        >
          [{i + 1}] {c.title} — Trang {c.page}
        </button>
      ))}
    </div>
  );
}
