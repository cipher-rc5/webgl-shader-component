import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import type { JSX } from "react"

interface ExampleButtonsProps {
	readonly isDisabled: boolean
	readonly onExampleClick: (example: string) => void
}

const EXAMPLES = [
	"What's the latest news?",
	"Help me with research",
	"Tell me about Augustus",
] as const

/**
 * Example Buttons Component
 * Presentational component for search examples
 */
export function ExampleButtons({
	isDisabled,
	onExampleClick,
}: ExampleButtonsProps): JSX.Element {
	return (
		<div
			className={cn(
				"mb-4 flex flex-wrap justify-center gap-3 transition-all duration-500",
				isDisabled && "pointer-events-none opacity-50",
			)}
		>
			{EXAMPLES.map((example) => (
				<button
					key={example}
					type="button"
					onClick={() => onExampleClick(example)}
					className="neomorphic neomorphic-hover flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all active:scale-95"
				>
					<Search size={14} />
					{example.replace("What's the latest news?", "Latest News")
						.replace("Help me with research", "Research")
						.replace("Tell me about Augustus", "Augustus")}
				</button>
			))}
		</div>
	)
}
