import {
	interruptWebLLMGeneration,
	streamWebLLMResponse,
} from "@/lib/services/web-llm.service"
import type { ChatSession, Message } from "@/types"
import { useRef, useState } from "react"

interface UseChatReturn {
	readonly messages: readonly Message[]
	readonly input: string
	readonly isTyping: boolean
	readonly chatSessions: readonly ChatSession[]
	readonly currentSessionId: string
	readonly setInput: (input: string) => void
	readonly sendMessage: (userInput: string) => Promise<void>
	readonly stopGenerating: () => void
	readonly startNewChat: () => void
	readonly switchSession: (sessionId: string) => void
}

/**
 * Custom hook for managing chat state and logic
 * Follows Single Responsibility Principle - only handles chat operations
 */
export function useChat(): UseChatReturn {
	const [messages, setMessages] = useState<readonly Message[]>([])
	const [input, setInput] = useState<string>("")
	const [isTyping, setIsTyping] = useState<boolean>(false)
	const [chatSessions, setChatSessions] = useState<readonly ChatSession[]>([])
	const [currentSessionId, setCurrentSessionId] = useState<string>("")
	const stoppedByUserRef = useRef<boolean>(false)

	const sendMessage = async (userInput: string): Promise<void> => {
		if (!userInput.trim() || isTyping) return

		const userMsg: Message = { role: "user", content: userInput }
		const conversation = [...messages, userMsg]

		// Create new chat session if first message
		if (messages.length === 0) {
			const newSession: ChatSession = {
				id: Date.now().toString(),
				title:
					userInput.slice(0, 30) + (userInput.length > 30 ? "..." : ""),
				timestamp: new Date(),
			}
			setChatSessions((prev) => [newSession, ...prev])
			setCurrentSessionId(newSession.id)
		}

		setMessages((prev) => [...prev, userMsg])
		setInput("")
		setIsTyping(true)
		stoppedByUserRef.current = false

		try {
			setMessages((prev) => [...prev, { role: "assistant", content: "" }])

			const finalText = await streamWebLLMResponse(conversation, (partialText) => {
				setMessages((prev) => {
					if (prev.length === 0) return prev

					const next = [...prev]
					const lastIndex = next.length - 1
					if (next[lastIndex]?.role === "assistant") {
						next[lastIndex] = { role: "assistant", content: partialText }
					}
					return next
				})
			})

			if (stoppedByUserRef.current && finalText.length === 0) {
				setMessages((prev) => {
					if (prev.length === 0) {
						return [{ role: "assistant", content: "Generation stopped." }]
					}

					const next = [...prev]
					const lastIndex = next.length - 1
					if (next[lastIndex]?.role === "assistant") {
						next[lastIndex] = {
							role: "assistant",
							content: "Generation stopped.",
						}
					}
					return next
				})
			}
		} catch (err) {
			const message =
				err instanceof Error ?
					err.message
				: 	"I couldn't generate a response right now."

			setMessages((prev) => {
				if (prev.length === 0) {
					return [{ role: "assistant", content: message }]
				}

				const next = [...prev]
				const lastIndex = next.length - 1
				if (next[lastIndex]?.role === "assistant") {
					next[lastIndex] = { role: "assistant", content: message }
					return next
				}

				return [...next, { role: "assistant", content: message }]
			})
		} finally {
			setIsTyping(false)
		}
	}

	const stopGenerating = (): void => {
		if (!isTyping) return
		stoppedByUserRef.current = true
		interruptWebLLMGeneration()
		setIsTyping(false)
	}

	const startNewChat = (): void => {
		if (isTyping) {
			interruptWebLLMGeneration()
			stoppedByUserRef.current = true
		}
		setMessages([])
		setIsTyping(false)
		setCurrentSessionId("")
	}

	const switchSession = (sessionId: string): void => {
		setCurrentSessionId(sessionId)
		// In a real app, load this session's messages
	}

	return {
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
	}
}
