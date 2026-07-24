'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import MarkdownPreview from './MarkdownPreview';
import CopyButton from './CopyButton';
import DownloadButton from './DownloadButton';

interface Props { markdown: string; domain: string; model: string; cached: boolean }

export default function ResultPanel({ markdown, domain, cached }: Props) {
  const [tab, setTab] = useState('preview');
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)', fontFamily: 'Geist, sans-serif' }}>
            DESIGN.md for <span className="gradient-text font-bold">{domain}</span>
          </h2>
          {cached && (
            <Badge className="text-xs" style={{ background: 'color-mix(in srgb, var(--secondary) 15%, transparent)', color: 'var(--secondary)', border: '1px solid color-mix(in srgb, var(--secondary) 25%, transparent)' }}>
              Cached
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CopyButton content={markdown} />
          <DownloadButton content={markdown} domain={domain} />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-lg p-1" style={{ background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)' }}>
          <TabsTrigger value="preview" className="text-sm rounded" style={{ color: 'var(--text-muted)' }}>Preview</TabsTrigger>
          <TabsTrigger value="raw" className="text-sm rounded" style={{ color: 'var(--text-muted)' }}>Raw</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-4">
          <div className="glass-card rounded-xl p-6 min-h-[400px] max-h-[75vh] overflow-y-auto">
            <MarkdownPreview content={markdown} />
          </div>
        </TabsContent>
        <TabsContent value="raw" className="mt-4">
          <div className="glass-card rounded-xl min-h-[400px] max-h-[75vh] overflow-y-auto p-6">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words" style={{ color: 'var(--text-muted)' }}>{markdown}</pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
