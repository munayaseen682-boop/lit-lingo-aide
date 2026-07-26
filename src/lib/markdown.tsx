import type { ReactNode } from "react";

export function renderMarkdown(md: string): ReactNode[] {
  const lines = md.split("\n");
  const out: ReactNode[] = [];
  let list: string[] = [];
  let tableRows: string[] = [];

  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code class='rounded bg-muted px-1 py-0.5 text-sm'>$1</code>");

  const flushList = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`} className="my-3 list-disc space-y-1 pl-6">
          {list.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />
          ))}
        </ul>,
      );
      list = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length < 2) {
      tableRows = [];
      return;
    }
    const parseRow = (r: string) =>
      r
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.trim());
    const header = parseRow(tableRows[0]);
    const bodyRows = tableRows
      .slice(2)
      .filter((r) => r.trim().length)
      .map(parseRow);
    out.push(
      <div key={`tbl-${out.length}`} className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {header.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold" dangerouslySetInnerHTML={{ __html: inline(h) }} />
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/50">
                {row.map((c, ci) => (
                  <td key={ci} className="px-3 py-2 align-top" dangerouslySetInnerHTML={{ __html: inline(c) }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    tableRows = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);
    if (isTableRow) {
      flushList();
      tableRows.push(line);
      continue;
    } else if (tableRows.length) {
      flushTable();
    }

    if (/^###\s+/.test(line)) {
      flushList();
      out.push(
        <h3 key={out.length} className="mt-5 font-serif text-xl font-semibold" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^###\s+/, "")) }} />,
      );
    } else if (/^##\s+/.test(line)) {
      flushList();
      out.push(
        <h2 key={out.length} className="mt-6 font-serif text-2xl font-semibold" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^##\s+/, "")) }} />,
      );
    } else if (/^#\s+/.test(line)) {
      flushList();
      out.push(
        <h1 key={out.length} className="mt-6 font-serif text-3xl font-semibold" dangerouslySetInnerHTML={{ __html: inline(line.replace(/^#\s+/, "")) }} />,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      list.push(line.replace(/^\s*\d+\.\s+/, ""));
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      out.push(<p key={out.length} className="my-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
    }
  }
  flushList();
  flushTable();
  return out;
}
