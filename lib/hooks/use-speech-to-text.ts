'use client';

import { createSpeechStream } from '@/lib/services/speech.service';
import { Effect, Fiber, Stream } from 'effect';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechToTextOptions {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

interface UseSpeechToTextReturn {
  readonly isListening: boolean;
  readonly isSupported: boolean;
  readonly toggle: () => void;
  readonly stop: () => void;
}

export function useSpeechToText({ value, onChange }: UseSpeechToTextOptions): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const fiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null);

  // Stable refs so callbacks in Effects don't capture stale closures
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { valueRef.current = value; }, [value]);

  // Resolved after mount so SSR and client initial render agree (no hydration mismatch)
  useEffect(() => {
    setIsSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const stop = useCallback((): void => {
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      fiberRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback((): void => {
    if (fiberRef.current) {
      stop();
      return;
    }

    setIsListening(true);

    const program = createSpeechStream(valueRef.current).pipe(
      Effect.flatMap((stream) =>
        stream.pipe(
          Stream.tap((text) => Effect.sync(() => onChangeRef.current(text))),
          Stream.runDrain
        )
      ),
      Effect.catchTag('SpeechNotSupportedError', () => Effect.void),
      Effect.catchTag('SpeechRecognitionError', () => Effect.void),
      Effect.ensuring(Effect.sync(() => setIsListening(false)))
    );

    fiberRef.current = Effect.runFork(program);
  }, [stop]);

  return { isListening, isSupported, toggle, stop };
}
