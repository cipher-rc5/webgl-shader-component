'use client';

import { SpeechNotSupportedError, SpeechRecognitionError } from '@/lib/errors';
import { Effect, Stream } from 'effect';

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

const acquireSpeechRecognition: Effect.Effect<SpeechRecognitionInstance, SpeechNotSupportedError> =
  Effect.sync(() => window.SpeechRecognition ?? window.webkitSpeechRecognition).pipe(
    Effect.flatMap((SR) =>
      SR ? Effect.succeed(new SR()) : Effect.fail(new SpeechNotSupportedError())
    )
  );

/**
 * Returns a Stream of accumulated transcript strings.
 * Each emission is the full text since recording started (base + all finals + current interim).
 * The stream ends naturally when the recognition session closes.
 * Cleanup (abort) runs automatically on fiber interruption.
 */
export const createSpeechStream = (
  baseValue: string
): Effect.Effect<Stream.Stream<string, SpeechRecognitionError>, SpeechNotSupportedError> =>
  acquireSpeechRecognition.pipe(
    Effect.map((recognition) => {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let base = baseValue;

      return Stream.async<string, SpeechRecognitionError>((emit) => {
        let aborted = false;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript ?? '';
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          emit.single(base + finalTranscript + interimTranscript);

          if (finalTranscript) base += finalTranscript;
        };

        // Errors that mean the mic is gone — no point restarting
        const FATAL_ERRORS = new Set(['audio-capture', 'not-allowed', 'service-not-allowed', 'language-not-supported']);

        recognition.onerror = (event: Event & { error?: string }) => {
          const err = event.error ?? '';
          // 'aborted' → intentional stop; 'no-speech' → silence timeout, onend will restart
          if (!err || err === 'aborted' || err === 'no-speech') return;
          if (FATAL_ERRORS.has(err)) {
            aborted = true; // prevent onend from trying to restart
            emit.fail(new SpeechRecognitionError({ cause: event }));
          }
          // non-fatal unknown errors: let onend handle the restart
        };

        recognition.onend = () => {
          if (aborted) {
            emit.end();
            return;
          }
          // Browser closed the session (silence timeout, etc.) — restart to stay open
          try {
            recognition.start();
          } catch {
            emit.end();
          }
        };

        recognition.start();

        // Runs when the fiber is interrupted, stopping the recognition session
        return Effect.sync(() => {
          aborted = true;
          recognition.abort();
        });
      });
    })
  );
