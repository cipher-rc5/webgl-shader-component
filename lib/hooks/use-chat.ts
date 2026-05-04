import { interruptWebLLMGeneration, streamWebLLMResponse } from '@/lib/services/web-llm.service';
import type { ChatSession, Message } from '@/types';
import { Effect, Fiber, Stream } from 'effect';
import { useRef, useState } from 'react';

interface UseChatReturn {
  readonly messages: readonly Message[];
  readonly input: string;
  readonly isTyping: boolean;
  readonly chatSessions: readonly ChatSession[];
  readonly currentSessionId: string;
  readonly setInput: (input: string) => void;
  readonly sendMessage: (userInput: string) => void;
  readonly stopGenerating: () => void;
  readonly startNewChat: () => void;
  readonly switchSession: (sessionId: string) => void;
  readonly renameSession: (sessionId: string, title: string) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<readonly Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatSessions, setChatSessions] = useState<readonly ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const fiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null);

  const updateLastAssistantMessage = (content: string): void => {
    setMessages((prev) => {
      if (prev.length === 0) return [{ role: 'assistant', content }];
      const next = [...prev];
      const last = next.length - 1;
      if (next[last]?.role === 'assistant') next[last] = { role: 'assistant', content };
      return next;
    });
  };

  const sendMessage = (userInput: string): void => {
    if (!userInput.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: userInput };
    const conversation = [...messages, userMsg];

    if (messages.length === 0) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: userInput.slice(0, 30) + (userInput.length > 30 ? '...' : ''),
        timestamp: new Date()
      };
      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    }

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setIsTyping(true);

    const program = streamWebLLMResponse(conversation).pipe(
      Stream.tap((text: string) => Effect.sync(() => updateLastAssistantMessage(text))),
      Stream.runDrain,
      Effect.catchTag('ModelNotLoadedError', () =>
        Effect.sync(() => updateLastAssistantMessage('Assistant is not initialized yet. Load the model first.'))),
      Effect.catchTag('StreamError', () =>
        Effect.sync(() =>
          updateLastAssistantMessage("I couldn't generate a response right now.")
        )),
      Effect.ensuring(Effect.sync(() => setIsTyping(false)))
    );

    fiberRef.current = Effect.runFork(program);
  };

  const stopGenerating = (): void => {
    if (!isTyping) return;
    interruptWebLLMGeneration();
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      fiberRef.current = null;
    }
    setIsTyping(false);
  };

  const startNewChat = (): void => {
    if (isTyping) {
      interruptWebLLMGeneration();
      if (fiberRef.current) {
        Effect.runFork(Fiber.interrupt(fiberRef.current));
        fiberRef.current = null;
      }
    }
    setMessages([]);
    setIsTyping(false);
    setCurrentSessionId('');
  };

  const switchSession = (sessionId: string): void => {
    setCurrentSessionId(sessionId);
  };

  const renameSession = (sessionId: string, title: string): void => {
    setChatSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, title: title.trim() || s.title } : s));
  };

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
    renameSession
  };
}
