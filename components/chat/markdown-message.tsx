'use client';

import { sanitize } from 'isomorphic-dompurify';
import { Streamdown } from 'streamdown';

interface MarkdownMessageProps {
  readonly content: string;
  readonly isStreaming: boolean;
}

export function MarkdownMessage({ content, isStreaming }: MarkdownMessageProps) {
  return (
    <Streamdown mode={isStreaming ? 'streaming' : 'static'} isAnimating={isStreaming}>{sanitize(content)}</Streamdown>
  );
}
