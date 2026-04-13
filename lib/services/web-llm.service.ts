import { ModelLoadError, ModelNotLoadedError, StreamError, WebGPUUnavailableError } from '@/lib/errors';
import type { Message } from '@/types';
import type { ChatCompletionChunk, ChatCompletionMessageParam, MLCEngineInterface } from '@mlc-ai/web-llm';
import { Effect, Option, Stream } from 'effect';

const DEFAULT_WEB_LLM_MODEL = process.env.NEXT_PUBLIC_WEBLLM_MODEL ?? 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const DEFAULT_MAX_TOKENS = Number.parseInt(process.env.NEXT_PUBLIC_WEBLLM_MAX_TOKENS ?? '256', 10) || 256;

let engine: MLCEngineInterface | null = null;
let enginePromise: Promise<MLCEngineInterface> | null = null;

function toConversationMessages(conversation: readonly Message[]): ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: 'You are a concise, helpful assistant in a web chat application.' },
    ...conversation.map((message) => ({ role: message.role, content: message.content }))
  ];
}

function clampPercent(rawProgress: number): number {
  const normalized = rawProgress <= 1 ? rawProgress * 100 : rawProgress;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

const checkWebGPU: Effect.Effect<void, WebGPUUnavailableError> =
  typeof navigator !== 'undefined' && 'gpu' in navigator ? Effect.void : Effect.fail(new WebGPUUnavailableError());

export const loadWebLLMModel = (
  reportProgress: (n: number) => void
): Effect.Effect<void, WebGPUUnavailableError | ModelLoadError> =>
  Effect.gen(function*() {
    yield* checkWebGPU;
    if (engine) {
      reportProgress(100);
      return;
    }
    if (!enginePromise) {
      enginePromise = (async () => {
        const webllm = await import('@mlc-ai/web-llm');
        return webllm.CreateMLCEngine(DEFAULT_WEB_LLM_MODEL, {
          initProgressCallback: (event) => reportProgress(clampPercent(event.progress))
        });
      })();
    }
    engine = yield* Effect.tryPromise({ try: () => enginePromise!, catch: (e) => new ModelLoadError({ cause: e }) });
    reportProgress(100);
  });

export const streamWebLLMResponse = (
  conversation: readonly Message[]
): Stream.Stream<string, ModelNotLoadedError | StreamError> => {
  if (!engine) return Stream.fail(new ModelNotLoadedError());

  return Stream.unwrap(
    Effect.tryPromise({
      try: () =>
        engine!.chat.completions.create({
          messages: toConversationMessages(conversation),
          temperature: 0.7,
          max_tokens: DEFAULT_MAX_TOKENS,
          stream: true
        }) as Promise<AsyncIterable<ChatCompletionChunk>>,
      catch: (e) => new StreamError({ cause: e })
    }).pipe(Effect.map((chunks) =>
      Stream.fromAsyncIterable(chunks, (e) =>
        new StreamError({ cause: e })).pipe(
          Stream.filter((chunk) => chunk.choices[0]?.finish_reason !== 'abort'),
          Stream.filterMap((chunk) => {
            const delta = chunk.choices[0]?.delta.content ?? '';
            return delta ? Option.some(delta) : Option.none();
          }),
          Stream.mapAccum('', (acc, delta) => {
            const next = acc + delta;
            return [next, next];
          })
        )
    ))
  );
};

export function interruptWebLLMGeneration(): void {
  engine?.interruptGenerate();
}
