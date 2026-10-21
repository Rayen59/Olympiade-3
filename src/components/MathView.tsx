import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathView: React.FC<MathViewProps> = ({ content, className = '', inline = false }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // If pure math block without delimiters
    if (inline) {
      try {
        return katex.renderToString(content, { displayMode: false, throwOnError: false });
      } catch {
        return content;
      }
    }

    // Split text by display math $$...$$ and inline math $...$
    // Regex matches $$...$$ or $...$
    const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
    const parts = content.split(mathRegex);

    return parts
      .map((part) => {
        if (!part) return '';
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const rawMath = part.slice(2, -2).trim();
          try {
            return `<div class="katex-display my-2 overflow-x-auto">${katex.renderToString(rawMath, {
              displayMode: true,
              throwOnError: false
            })}</div>`;
          } catch {
            return `<pre class="text-red-500">${part}</pre>`;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const rawMath = part.slice(1, -1).trim();
          try {
            return katex.renderToString(rawMath, {
              displayMode: false,
              throwOnError: false
            });
          } catch {
            return `<span class="text-red-500">${part}</span>`;
          }
        } else {
          // Regular text: escape HTML and replace newlines with line breaks
          return escapeHtml(part).replace(/\n/g, '<br/>');
        }
      })
      .join('');
  }, [content, inline]);

  return (
    <div
      className={`leading-relaxed break-words font-sans text-slate-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
