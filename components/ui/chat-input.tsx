import { cn } from "@/lib/utils"
import { ArrowRight, Mic } from "lucide-react"
import type { JSX } from "react"

interface ChatInputProps {
	readonly value: string
	readonly isDisabled: boolean
	readonly onChange: (value: string) => void
	readonly onSubmit: (e: SubmitEvent) => void
}

/**
 * Chat Input Component
 * Presentational component for chat input form
 */
export function ChatInput({
	value,
	isDisabled,
	onChange,
	onSubmit,
}: ChatInputProps): JSX.Element {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				onSubmit(e.nativeEvent as SubmitEvent)
			}}
			className={cn(
				"relative transition-all duration-500",
				isDisabled && "pointer-events-none opacity-50",
			)}
		>
			<div className="group relative">
				<div className="neomorphic-inset rounded-3xl p-1">
					<input
						type="text"
						placeholder="Ask anything..."
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="h-14 w-full rounded-3xl bg-transparent px-6 pr-24 text-base text-zinc-800 outline-none placeholder:text-zinc-400 md:h-16 md:text-lg"
					/>
				</div>
				<div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-zinc-500">
					<button
						type="button"
						className="neomorphic rounded-xl p-2 transition-all hover:text-zinc-700 active:scale-95"
					>
						<Mic size={20} />
					</button>
					{value.length > 0 && (
						<button
							type="submit"
							className="neomorphic rounded-xl p-2 text-[#F4D03F] transition-all hover:text-[#D4AF37] active:scale-95"
						>
							<ArrowRight size={20} />
						</button>
					)}
				</div>
			</div>
		</form>
	)
}
