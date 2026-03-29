import type { ModelLoadingState } from "@/types"
import { loadWebLLMModel } from "@/lib/services/web-llm.service"
import { useState } from "react"

interface UseModelLoaderReturn extends ModelLoadingState {
	readonly loadModel: () => void
	readonly error: string | null
}

/**
 * Custom hook for managing model loading state
 * Follows Single Responsibility Principle - only handles model loading
 */
export function useModelLoader(): UseModelLoaderReturn {
	const [isLoaded, setIsLoaded] = useState<boolean>(false)
	const [progress, setProgress] = useState<number>(0)
	const [error, setError] = useState<string | null>(null)

	const loadModel = (): void => {
		if (isLoaded) return

		setError(null)
		setProgress(1)

		void (async () => {
			try {
				await loadWebLLMModel(setProgress)
				setIsLoaded(true)
			} catch (err) {
				setProgress(0)
				const message =
					err instanceof Error ?
						err.message
					: 	"Failed to initialize local model."
				setError(message)
			}
		})()
	}

	return {
		isLoaded,
		progress,
		loadModel,
		error,
	}
}
