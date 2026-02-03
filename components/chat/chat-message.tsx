import { cn } from "@/lib/utils"
import type { Message } from "@/types"
import type { JSX } from "react"

interface ChatMessageProps {
	readonly message: Message
}

/**
 * Chat Message Component
 * Presentational component following Single Responsibility Principle
 */
export function ChatMessage({ message }: ChatMessageProps): JSX.Element {
	const isUser = message.role === "user"

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-2",
				isUser ? "items-end" : "items-start",
			)}
		>
			{/* Speaker Label */}
			<div className="flex items-center gap-2 px-2">
				<div
					className={cn(
						"h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold",
						isUser ?
							"bg-[#F4D03F] text-zinc-900" :
							"bg-zinc-700 text-white",
					)}
				>
					{isUser ? "U" : "AI"}
				</div>
				<span className="text-xs font-medium text-zinc-600">
					{isUser ? "You" : "Agent"}
				</span>
			</div>

			{/* Message Content */}
			<div
				className={cn(
					"max-w-[85%] rounded-2xl p-4 text-[15px] leading-relaxed md:max-w-[75%] md:p-5",
					isUser ?
						"clay-card text-zinc-800 font-medium" :
						"neomorphic text-zinc-700",
				)}
			>
				{message.content}
			</div>
		</div>
	)
}
