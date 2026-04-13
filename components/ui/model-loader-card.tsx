import { Cpu } from 'lucide-react';
import type { JSX } from 'react';

interface ModelLoaderCardProps {
  readonly progress: number;
  readonly onLoadModel: () => void;
  readonly error: string | null;
}

/**
 * Model Loader Card Component
 * Presentational component for model loading UI
 */
export function ModelLoaderCard({ progress, onLoadModel, error }: ModelLoaderCardProps): JSX.Element {
  const isLoading = progress > 0 && progress < 100;

  return (
    <div className='absolute inset-x-0 bottom-full mb-6 flex justify-center'>
      <div className='clay-card w-full max-w-md p-6 text-center'>
        <h3 className='mb-2 text-lg font-semibold text-zinc-800'>Enable Assistant</h3>
        <p className='mb-4 text-sm text-zinc-600'>Load a local WebLLM model in your browser using WebGPU.</p>

        {error && <p className='mb-4 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-700'>{error}</p>}

        {isLoading ?
          (
            <div className='w-full space-y-2'>
              <div className='neomorphic-inset h-3 w-full overflow-hidden rounded-full'>
                <div
                  className='h-full rounded-full bg-linear-to-r from-[#F4D03F] to-[#D4AF37] transition-all duration-300'
                  style={{ width: `${progress}%` }} />
              </div>
              <p className='font-mono text-xs text-zinc-500'>Loading shards... {progress}%</p>
            </div>
          ) :
          (
            <div className='flex justify-center'>
              <button
                type='button'
                onClick={onLoadModel}
                className='neomorphic neomorphic-hover flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium text-zinc-800 transition-all active:scale-95'>
                <Cpu size={18} />
                <span>Load Local Model</span>
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
