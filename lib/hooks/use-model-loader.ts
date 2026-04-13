import { loadWebLLMModel } from '@/lib/services/web-llm.service';
import type { ModelLoadingState } from '@/types';
import { Effect } from 'effect';
import { useState } from 'react';

interface UseModelLoaderReturn extends ModelLoadingState {
  readonly loadModel: () => void;
  readonly error: string | null;
}

export function useModelLoader(): UseModelLoaderReturn {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const loadModel = (): void => {
    if (isLoaded) return;
    setError(null);
    setProgress(1);

    Effect.runFork(
      loadWebLLMModel(setProgress).pipe(
        Effect.andThen(Effect.sync(() => setIsLoaded(true))),
        Effect.catchTag('WebGPUUnavailableError', () =>
          Effect.sync(() => {
            setProgress(0);
            setError('WebGPU is not available in this browser.');
          })),
        Effect.catchTag('ModelLoadError', () =>
          Effect.sync(() => {
            setProgress(0);
            setError('Failed to initialize local model.');
          }))
      )
    );
  };

  return { isLoaded, progress, loadModel, error };
}
