'use client';

import { useSpeechToText } from '@/lib/hooks/use-speech-to-text';
import { cn } from '@/lib/utils';
import { ArrowRight, Mic, MicOff, Square } from 'lucide-react';
import type { JSX, SyntheticEvent } from 'react';
import { useEffect } from 'react';

interface ChatInputProps {
  readonly value: string;
  readonly isDisabled: boolean;
  readonly isGenerating: boolean;
  readonly onChange: (value: string) => void;
  readonly onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  readonly onStop: () => void;
}

/**
 * Chat Input Component
 * Presentational component for chat input form
 */
export function ChatInput(
  { value, isDisabled, isGenerating, onChange, onSubmit, onStop }: ChatInputProps,
): JSX.Element {
  const { isListening, isSupported, toggle, stop } = useSpeechToText({ value, onChange });

  // Stop listening when generation starts or input is disabled
  useEffect(() => {
    if (isGenerating || isDisabled) stop();
  }, [isGenerating, isDisabled, stop]);

  return (
    <form onSubmit={onSubmit} className='relative transition-all duration-500'>
      <div className='group relative'>
        <div className={cn('neomorphic-inset rounded-3xl p-1', isListening && 'ring-2 ring-red-400/50')}>
          <input
            type='text'
            placeholder={isListening ? 'Listening...' : 'Ask anything...'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isDisabled || isGenerating}
            className='h-14 w-full rounded-3xl bg-transparent px-6 pr-24 text-base text-zinc-800 outline-none placeholder:text-zinc-400 md:h-16 md:text-lg' />
        </div>

        <div className='absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-zinc-500'>
          {/* Mic button — only shown when not generating */}
          {!isGenerating && isSupported && (
            <button
              type='button'
              onClick={toggle}
              disabled={isDisabled}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
              className={cn(
                'relative rounded-xl p-2 transition-all active:scale-95',
                isDisabled && 'pointer-events-none opacity-50',
                isListening
                  ? 'text-red-500 hover:text-red-600'
                  : 'neomorphic hover:text-zinc-700'
              )}>
              {/* Ripple ring while recording */}
              {isListening && (
                <span className='absolute inset-0 animate-ping rounded-xl bg-red-400/30' />
              )}
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {isGenerating ?
            (
              <button
                type='button'
                onClick={onStop}
                className='neomorphic rounded-xl p-2 text-red-600 transition-all hover:text-red-700 active:scale-95'>
                <Square size={18} />
              </button>
            ) :
            value.length > 0 && (
              <button
                type='submit'
                disabled={isDisabled}
                className={cn(
                  'neomorphic rounded-xl p-2 text-[#F4D03F] transition-all hover:text-[#D4AF37] active:scale-95',
                  isDisabled && 'pointer-events-none opacity-50'
                )}>
                <ArrowRight size={20} />
              </button>
            )}
        </div>
      </div>
    </form>
  );
}
