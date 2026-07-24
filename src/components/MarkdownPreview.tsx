'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="text-[14px] leading-[1.6]" style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mb-4 mt-2" style={{ color: 'var(--text)', fontFamily: 'Geist, sans-serif' }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-6 mb-3" style={{ color: 'var(--text)', fontFamily: 'Geist, sans-serif' }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text)', fontFamily: 'Geist, sans-serif' }}>{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>,
          a: ({ href, children }) => <a href={href} className="hover:underline underline-offset-2" style={{ color: 'var(--primary-container)' }}>{children}</a>,
          code: ({ className, children, ...props }) => {
            const inline = !className;
            if (inline) return <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--surface-elevated)', color: 'var(--primary)' }} {...props}>{children}</code>;
            return <pre className="p-4 rounded-lg overflow-x-auto text-sm" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }}><code className={className} {...props}>{children}</code></pre>;
          },
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4"><table className="min-w-full border-collapse" style={{ border: '1px solid var(--glass-border)' }}>{children}</table></div>
          ),
          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider" style={{ background: 'var(--surface-elevated)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-sm" style={{ borderBottom: '1px solid var(--glass-border)' }}>{children}</td>,
          hr: () => <hr className="my-6" style={{ borderColor: 'var(--glass-border)' }} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
