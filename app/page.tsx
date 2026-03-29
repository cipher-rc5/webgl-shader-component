"use client"
import { ChatMessage } from "@/components/chat/chat-message"
import { TypingIndicator } from "@/components/chat/typing-indicator"
import { DesertSandShader } from "@/components/desert-sand-shader"
import { ChatInput } from "@/components/ui/chat-input"
import { ExampleButtons } from "@/components/ui/example-buttons"
import { ModelLoaderCard } from "@/components/ui/model-loader-card"
import { useChat } from "@/lib/hooks/use-chat"
import { useModelLoader } from "@/lib/hooks/use-model-loader"
import { cn } from "@/lib/utils"
import { MessageSquare, Plus } from "lucide-react"
import { useEffect, useRef, type FormEvent } from "react"

export default function Page(): React.JSX.Element {
	const { isLoaded, progress, loadModel, error } = useModelLoader()
	const {
		messages,
		input,
		isTyping,
		chatSessions,
		currentSessionId,
		setInput,
		sendMessage,
		stopGenerating,
		startNewChat,
		switchSession,
	} = useChat()

	const messagesEndRef = useRef<HTMLDivElement | null>(null)

	// Auto-scroll to bottom of chat
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages, isTyping])

	const handleSend = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault()
		if (!input.trim()) return
		await sendMessage(input)
	}

	const handleExampleClick = (example: string): void => {
		setInput(example)
	}

	const lastMessage = messages.at(-1)
	const showTypingIndicator =
		isTyping &&
		(lastMessage?.role !== "assistant" || lastMessage.content.length === 0)

	return (
		<div className="flex h-screen w-full overflow-hidden bg-[#e8e8e8] font-sans text-zinc-900 selection:bg-[#F4D03F]/30">

			{/* Sidebar with Past Searches */}
			<aside
				className="z-20 flex w-64 flex-col gap-4 bg-[#e8e8e8] p-4"
			>
				{/* Logo */}
				<div className="neomorphic mb-2 flex items-center justify-center rounded-2xl bg-[#121212] p-4">
					<img
						src="/cipher_logo_dark.svg"
						alt="Cipher"
						className="h-8 w-auto brightness-0 invert"
						style={{ filter: "brightness(0) invert(1)" }}
					/>
				</div>

				{/* New Chat Button */}
				<button
					onClick={startNewChat}
					className="neomorphic neomorphic-hover flex items-center gap-3 rounded-2xl p-4 text-sm font-medium text-zinc-700 transition-all active:scale-95"
				>
					<Plus size={18} />
					<span>New Chat</span>
				</button>

				{/* Past Searches */}
				<div className="flex-1 overflow-hidden">
					<h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
						Recent Chats
					</h3>
					<div
						className="custom-scrollbar space-y-2 overflow-y-auto pr-1"
						style={{ maxHeight: "calc(100vh - 200px)" }}
					>
						{chatSessions.map((session) => (
							<button
								key={session.id}
								onClick={() => switchSession(session.id)}
								className={cn(
									"w-full rounded-xl p-3 text-left text-sm transition-all",
									currentSessionId === session.id ?
										"neomorphic-inset text-zinc-900" :
										"neomorphic neomorphic-hover text-zinc-700",
								)}
							>
								<div className="flex items-start gap-2">
									<MessageSquare size={14} className="mt-0.5 shrink-0" />
									<span className="line-clamp-2">{session.title}</span>
								</div>
							</button>
						))}
					</div>
				</div>
			</aside>

			{/* Main Content */}
			<main className="relative flex flex-1 flex-col bg-[#e8e8e8]">
				{/* Shader Background */}
				<div className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-hidden opacity-30">
					<DesertSandShader speed={0.2} sandDetail={1.2} mistIntensity={1.5} />
					{/* Fade overlay to blend shader into background */}
					<div className="absolute bottom-0 left-0 h-1/2 w-full bg-linear-to-t from-[#e8e8e8] via-[#e8e8e8]/80 to-transparent" />
				</div>

				{/* Content Area */}
				<div
					className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col px-6"
					style={{ paddingTop: "4vh", paddingBottom: "4vh" }}
				>
					{messages.length > 0 ?
						(
							<div
								className="flex flex-1 flex-col overflow-hidden"
								style={{ minHeight: 0 }}
							>
								{/* Response Container */}
								<div className="mb-6 flex-1 overflow-hidden rounded-3xl">
									<div className="neomorphic-inset custom-scrollbar h-full overflow-y-auto rounded-3xl p-6">
									<div className="space-y-6">
										{messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)}
										{showTypingIndicator && <TypingIndicator />}
										<div ref={messagesEndRef} />
									</div>
									</div>
								</div>
							</div>
						) :
						(
							<div
								className="flex flex-1 flex-col items-center"
								style={{ justifyContent: "flex-start", paddingTop: "4vh" }}
							>
								{/* Empty State - The Orb */}
								<div className="relative mb-6 flex animate-[float_6s_ease-in-out_infinite] flex-col items-center justify-center">
									<div className="relative flex h-48 w-48 items-center justify-center md:h-64 md:w-64">
										<div className="neomorphic absolute inset-0 animate-[spin-slow_20s_linear_infinite] rounded-full" />
										<div className="absolute h-36 w-36 skew-x-12 rotate-45 rounded-full border-4 border-zinc-300/50 blur-[1px] md:h-48 md:w-48 md:border-[6px]" />
										<div className="absolute h-40 w-40 -rotate-12 skew-y-6 rounded-full border-2 border-zinc-400/40 md:h-56 md:w-56" />

										<div className="neomorphic relative flex h-24 w-24 items-center justify-center rounded-2xl bg-[#121212] p-4 md:h-32 md:w-32 md:p-6">
									<img
										src="/cipher_logo_dark.svg"
										alt="Cipher"
												className="h-auto w-full brightness-0 invert"
												style={{ filter: "brightness(0) invert(1)" }}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

					{/* Input Section */}
					<div className="relative w-full">
						{!isLoaded && (
							<ModelLoaderCard
								progress={progress}
								onLoadModel={loadModel}
								error={error}
							/>
						)}

						<ExampleButtons
							isDisabled={!isLoaded || isTyping}
							onExampleClick={handleExampleClick}
						/>

						<ChatInput
							value={input}
							isDisabled={!isLoaded}
							isGenerating={isTyping}
							onChange={setInput}
							onSubmit={handleSend}
							onStop={stopGenerating}
						/>
					</div>
				</div>
			</main>
		</div>
	)
}
