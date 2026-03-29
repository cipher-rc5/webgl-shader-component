import { cn } from "@/lib/utils"
import { ArrowRight, Mic, Square } from "lucide-react"
import type { FormEvent, JSX } from "react"

interface ChatInputProps {
	readonly value: string
	readonly isDisabled: boolean
	readonly isGenerating: boolean
	readonly onChange: (value: string) => void
	readonly onSubmit: (e: FormEvent<HTMLFormElement>) => void
	readonly onStop: () => void
}

/**
 * Chat Input Component
 * Presentational component for chat input form
 */
export function ChatInput({
	value,
	isDisabled,
	isGenerating,
	onChange,
	onSubmit,
	onStop,
}: ChatInputProps): JSX.Element {
	return (
		<form onSubmit={onSubmit} className="relative transition-all duration-500">
			<div className="group relative">
				<div className="neomorphic-inset rounded-3xl p-1">
					<input
						type="text"
						placeholder="Ask anything..."
						value={value}
						onChange={(e) => onChange(e.target.value)}
						disabled={isDisabled || isGenerating}
						className="h-14 w-full rounded-3xl bg-transparent px-6 pr-24 text-base text-zinc-800 outline-none placeholder:text-zinc-400 md:h-16 md:text-lg"
					/>
				</div>
				<div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-zinc-500">
					<button
						type="button"
						disabled={isDisabled || isGenerating}
						className={cn(
							"neomorphic rounded-xl p-2 transition-all hover:text-zinc-700 active:scale-95",
							(isDisabled || isGenerating) &&
								"pointer-events-none opacity-50",
						)}
					>
						<Mic size={20} />
					</button>
					{isGenerating ?
						<button
							type="button"
							onClick={onStop}
							className="neomorphic rounded-xl p-2 text-red-600 transition-all hover:text-red-700 active:scale-95"
						>
							<Square size={18} />
						</button>
					: 	value.length > 0 && (
							<button
								type="submit"
								disabled={isDisabled}
								className={cn(
									"neomorphic rounded-xl p-2 text-[#F4D03F] transition-all hover:text-[#D4AF37] active:scale-95",
									isDisabled && "pointer-events-none opacity-50",
								)}
							>
								<ArrowRight size={20} />
							</button>
						)
					}
				</div>
			</div>
		</form>
	)
}
