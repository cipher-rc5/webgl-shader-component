import type { Message } from "@/types"
import type {
	ChatCompletionChunk,
	ChatCompletionMessageParam,
	MLCEngineInterface,
} from "@mlc-ai/web-llm"

type ProgressReporter = (progress: number) => void
type StreamReporter = (partialText: string) => void

const DEFAULT_WEB_LLM_MODEL =
	process.env.NEXT_PUBLIC_WEBLLM_MODEL ?? "Llama-3.2-1B-Instruct-q4f16_1-MLC"
const DEFAULT_MAX_TOKENS =
	Number.parseInt(process.env.NEXT_PUBLIC_WEBLLM_MAX_TOKENS ?? "256", 10) ||
	256

let engine: MLCEngineInterface | null = null
let enginePromise: Promise<MLCEngineInterface> | null = null

function toConversationMessages(
	conversation: readonly Message[],
): ChatCompletionMessageParam[] {
	return [
		{
			role: "system",
			content: "You are a concise, helpful assistant in a web chat application.",
		},
		...conversation.map((message) => ({
			role: message.role,
			content: message.content,
		})),
	]
}

function clampPercent(rawProgress: number): number {
	const normalized = rawProgress <= 1 ? rawProgress * 100 : rawProgress
	return Math.max(0, Math.min(100, Math.round(normalized)))
}

function requireWebGPU(): void {
	if (typeof navigator === "undefined" || !("gpu" in navigator)) {
		throw new Error("WebGPU is not available in this browser.")
	}
}

export async function loadWebLLMModel(
	reportProgress: ProgressReporter,
): Promise<void> {
	requireWebGPU()

	if (engine) {
		reportProgress(100)
		return
	}

	if (!enginePromise) {
		enginePromise = (async () => {
			const webllm = await import("@mlc-ai/web-llm")
			const created = await webllm.CreateMLCEngine(DEFAULT_WEB_LLM_MODEL, {
				initProgressCallback: (event) => {
					reportProgress(clampPercent(event.progress))
				},
			})
			return created
		})()
	}

	engine = await enginePromise
	reportProgress(100)
}

export async function streamWebLLMResponse(
	conversation: readonly Message[],
	reportPartial: StreamReporter,
): Promise<string> {
	if (!engine) {
		throw new Error("Assistant is not initialized yet. Load the model first.")
	}

	const stream = (await engine.chat.completions.create({
		messages: toConversationMessages(conversation),
		temperature: 0.7,
		max_tokens: DEFAULT_MAX_TOKENS,
		stream: true,
	})) as AsyncIterable<ChatCompletionChunk>

	let fullText = ""
	let wasAborted = false
	for await (const chunk of stream) {
		if (chunk.choices[0]?.finish_reason === "abort") {
			wasAborted = true
		}

		const delta = chunk.choices[0]?.delta.content ?? ""
		if (!delta) continue
		fullText += delta
		reportPartial(fullText)
	}

	if (wasAborted) {
		return fullText.trim()
	}

	if (!fullText.trim()) {
		throw new Error("Model returned an empty response.")
	}

	return fullText.trim()
}

export function interruptWebLLMGeneration(): void {
	engine?.interruptGenerate()
}
