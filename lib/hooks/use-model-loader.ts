import type { ModelLoadingState } from "@/types"
import { useState } from "react"

interface UseModelLoaderReturn extends ModelLoadingState {
	readonly loadModel: () => void
}

/**
 * Custom hook for managing model loading state
 * Follows Single Responsibility Principle - only handles model loading
 */
export function useModelLoader(): UseModelLoaderReturn {
	const [isLoaded, setIsLoaded] = useState<boolean>(false)
	const [progress, setProgress] = useState<number>(0)

	const loadModel = (): void => {
		let currentProgress = 0
		const interval = setInterval(() => {
			currentProgress += Math.floor(Math.random() * 15)
			if (currentProgress >= 100) {
				currentProgress = 100
				clearInterval(interval)
				setIsLoaded(true)
			}
			setProgress(currentProgress)
		}, 300)
	}

	return {
		isLoaded,
		progress,
		loadModel,
	}
}
