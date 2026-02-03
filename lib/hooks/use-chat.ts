import { generateAIResponse } from "@/lib/services/ai-response.service"
import type { ChatSession, Message } from "@/types"
import { useState } from "react"

interface UseChatReturn {
	readonly messages: readonly Message[]
	readonly input: string
	readonly isTyping: boolean
	readonly chatSessions: readonly ChatSession[]
	readonly currentSessionId: string
	readonly setInput: (input: string) => void
	readonly sendMessage: (userInput: string) => Promise<void>
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

	const sendMessage = async (userInput: string): Promise<void> => {
		if (!userInput.trim()) return

		const userMsg: Message = { role: "user", content: userInput }

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

		// Generate AI response
		const aiResponse = generateAIResponse(userInput)

		// Simulate streaming effect with proper typing
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				setIsTyping(false)
				setMessages((prev) => [
					...prev,
					{ role: "assistant", content: aiResponse },
				])
				resolve()
			}, 600)
		})
	}

	const startNewChat = (): void => {
		setMessages([])
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
		startNewChat,
		switchSession,
	}
}
