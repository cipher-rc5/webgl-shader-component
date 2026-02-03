/**
 * AI Response Service
 * Handles AI response generation logic following Single Responsibility Principle
 */

type ResponseMatcher = {
	readonly matcher: (query: string) => boolean
	readonly response: string | ((query: string) => string)
}

const RESPONSE_MATCHERS: readonly ResponseMatcher[] = [
	{
		matcher: (query) =>
			query.includes("capabilities") ||
			query.includes("what can you do") ||
			query.includes("what are you"),
		response:
			"I'm a demonstration AI agent with example responses. In a real implementation, I would be powered by a local language model running in your browser using WebGPU. I can help with questions, research, and general conversation. This interface showcases a neumorphic design with a WebGL desert sand shader background.",
	},
	{
		matcher: (query) =>
			query.includes("shader") ||
			query.includes("background") ||
			query.includes("webgl"),
		response:
			"The animated background is a WebGL shader simulation of desert sand dunes. It's implemented as a React component using GLSL shaders and Three.js. The shader creates real-time procedural terrain with lighting effects that give it depth and movement.",
	},
	{
		matcher: (query) =>
			query.includes("quality") ||
			query.includes("not working") ||
			query.includes("broken"),
		response:
			"I'm currently running in demo mode with pre-programmed responses. To enable full AI capabilities, you'd need to load an actual language model (like Llama-3) into your browser using WebGPU. This is just a UI demonstration of what that experience could look like!",
	},
	{
		matcher: (query) => query.includes("news"),
		response:
			"I can help you find the latest news! As a local AI running in your browser, I can search and summarize recent news articles for you. What topic are you interested in?",
	},
	{
		matcher: (query) => query.includes("research"),
		response:
			"I'd be happy to help with research! I can analyze documents, find information, and help organize your findings. What are you researching today?",
	},
	{
		matcher: (query) => query.includes("augustus"),
		response:
			"Augustus was the first Roman Emperor, ruling from 27 BC until his death in AD 14. Born Gaius Octavius, he was Julius Caesar's adopted heir. His reign brought peace and prosperity to Rome, a period known as the Pax Romana.",
	},
	{
		matcher: (query) =>
			query.includes("hello") ||
			query.includes("hi ") ||
			query === "hi" ||
			query.includes("hey"),
		response:
			"Hello! I'm an AI assistant running in your browser. How can I help you today?",
	},
	{
		matcher: (query) => query.includes("help"),
		response:
			"I'm here to help! You can ask me about news, research topics, historical figures, or questions about this application. Try asking about the shader background, my capabilities, or specific topics like Augustus.",
	},
] as const

/**
 * Generates an AI response based on the user's query
 * @param userQuery - The user's input query
 * @returns AI-generated response string
 */
export function generateAIResponse(userQuery: string): string {
	const normalizedQuery = userQuery.toLowerCase()

	for (const { matcher, response } of RESPONSE_MATCHERS) {
		if (matcher(normalizedQuery)) {
			return typeof response === "function" ? response(userQuery) : response
		}
	}

	return `Thanks for your message! I'm currently in demo mode with limited responses. In a full implementation, I would provide a thoughtful response to: "${userQuery}". Try asking about my capabilities, the shader background, or topics like news, research, or Augustus!`
}
