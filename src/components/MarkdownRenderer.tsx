import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-zinc-800 dark:text-zinc-100 font-sans leading-relaxed text-[15px]">
      {parts.map((part, index) => {

        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const language = match ? match[1] : "code";
          const code = match ? match[2] : part.slice(3, -3);
          const isCopied = copiedText === code;

          return (
            <div
              key={index}
              className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-sm shadow-lg shadow-black/40"
            >

              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/60 px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 select-none">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{language || "plaintext"}</span>
                </div>
                <button
                  onClick={() => handleCopy(code)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all duration-200"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto overflow-x-auto p-4 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-850">
                <pre className="text-zinc-700 dark:text-zinc-300 leading-normal select-text">
                  <code>{code.trim()}</code>
                </pre>
              </div>
            </div>
          );
        }

        const lines = part.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let listBuffer: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;

        const flushListBuffer = (key: string | number) => {
          if (!listBuffer) return;
          if (listBuffer.type === "ul") {
            renderedElements.push(
              <ul key={`ul-${key}`} className="list-disc pl-6 my-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
                {listBuffer.items}
              </ul>
            );
          } else {
            renderedElements.push(
              <ol key={`ol-${key}`} className="list-decimal pl-6 my-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
                {listBuffer.items}
              </ol>
            );
          }
          listBuffer = null;
        };

        const renderInlineStyles = (text: string): React.ReactNode[] => {

          const inlineParts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
          return inlineParts.map((inlinePart, subIdx) => {
            if (inlinePart.startsWith("**") && inlinePart.endsWith("**")) {
              return (
                <strong key={subIdx} className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {inlinePart.slice(2, -2)}
                </strong>
              );
            }
            if (inlinePart.startsWith("*") && inlinePart.endsWith("*")) {
              return (
                <em key={subIdx} className="italic text-zinc-650 dark:text-zinc-300">
                  {inlinePart.slice(1, -1)}
                </em>
              );
            }
            if (inlinePart.startsWith("`") && inlinePart.endsWith("`")) {
              return (
                <code
                  key={subIdx}
                  className="rounded bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-sm text-amber-600 dark:text-amber-400/90"
                >
                  {inlinePart.slice(1, -1)}
                </code>
              );
            }
            return inlinePart;
          });
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            flushListBuffer(lineIdx);
            renderedElements.push(<hr key={lineIdx} className="my-5 border-zinc-850 border-t" />);
            return;
          }

          if (trimmed.startsWith("### ")) {
            flushListBuffer(lineIdx);
            renderedElements.push(
              <h4 key={lineIdx} className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight mt-5 mb-2">
                {renderInlineStyles(trimmed.slice(4))}
              </h4>
            );
            return;
          }
          if (trimmed.startsWith("## ")) {
            flushListBuffer(lineIdx);
            renderedElements.push(
              <h3 key={lineIdx} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight mt-6 mb-2">
                {renderInlineStyles(trimmed.slice(3))}
              </h3>
            );
            return;
          }
          if (trimmed.startsWith("# ")) {
            flushListBuffer(lineIdx);
            renderedElements.push(
              <h2 key={lineIdx} className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-7 mb-3">
                {renderInlineStyles(trimmed.slice(2))}
              </h2>
            );
            return;
          }

          if (trimmed.startsWith("> ")) {
            flushListBuffer(lineIdx);
            renderedElements.push(
              <blockquote
                key={lineIdx}
                className="my-3 border-l-4 border-zinc-450 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900/30 px-4 py-2 italic text-zinc-650 dark:text-zinc-400 rounded-r-md"
              >
                {renderInlineStyles(trimmed.slice(2))}
              </blockquote>
            );
            return;
          }

          const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
          if (ulMatch) {
            const listContent = ulMatch[3];
            const liItem = <li key={`li-${lineIdx}`}>{renderInlineStyles(listContent)}</li>;

            if (listBuffer && listBuffer.type === "ul") {
              listBuffer.items.push(liItem);
            } else {
              flushListBuffer(lineIdx);
              listBuffer = { type: "ul", items: [liItem] };
            }
            return;
          }

          const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
          if (olMatch) {
            const listContent = olMatch[3];
            const liItem = <li key={`li-${lineIdx}`}>{renderInlineStyles(listContent)}</li>;

            if (listBuffer && listBuffer.type === "ol") {
              listBuffer.items.push(liItem);
            } else {
              flushListBuffer(lineIdx);
              listBuffer = { type: "ol", items: [liItem] };
            }
            return;
          }

          if (trimmed === "") {
            flushListBuffer(lineIdx);
            return;
          }

          flushListBuffer(lineIdx);
          renderedElements.push(
            <p key={lineIdx} className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3 last:mb-0">
              {renderInlineStyles(line)}
            </p>
          );
        });

        flushListBuffer(`end-${index}`);

        return <div key={index}>{renderedElements}</div>;
      })}
    </div>
  );
}
