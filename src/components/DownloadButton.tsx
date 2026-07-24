'use client';

export default function DownloadButton({ content, domain }: { content: string; domain: string }) {
  return (
    <button
      onClick={() => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `DESIGN-${domain.replace(/[^a-z0-9]/gi, '-')}.md`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
      className="shine-btn flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] leading-[1.6] font-mono font-medium"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Download
    </button>
  );
}
