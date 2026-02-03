import type { JSX } from "react"

/**
 * Typing Indicator Component
 * Presentational component for showing AI typing state
 */
export function TypingIndicator(): JSX.Element {
	return (
		<div className="flex w-full flex-col gap-2 items-start">
			<div className="flex items-center gap-2 px-2">
				<div className="h-6 w-6 rounded-full bg-zinc-700 text-white flex items-center justify-center text-xs font-semibold">
					AI
				</div>
				<span className="text-xs font-medium text-zinc-600">Agent</span>
			</div>
			<div className="neomorphic flex items-center gap-2 rounded-2xl p-4">
				<div
					className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
					style={{ animationDelay: "0ms" }}
				/>
				<div
					className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
					style={{ animationDelay: "150ms" }}
				/>
				<div
					className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
					style={{ animationDelay: "300ms" }}
				/>
			</div>
		</div>
	)
}
