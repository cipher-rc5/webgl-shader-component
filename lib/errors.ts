import { Data } from 'effect';

export class WebGPUUnavailableError extends Data.TaggedError('WebGPUUnavailableError')<{}> {}
export class ModelNotLoadedError extends Data.TaggedError('ModelNotLoadedError')<{}> {}
export class ModelLoadError extends Data.TaggedError('ModelLoadError')<{ readonly cause: unknown }> {}
export class StreamError extends Data.TaggedError('StreamError')<{ readonly cause: unknown }> {}
export class SpeechNotSupportedError extends Data.TaggedError('SpeechNotSupportedError')<{}> {}
export class SpeechRecognitionError extends Data.TaggedError('SpeechRecognitionError')<{ readonly cause: unknown }> {}
