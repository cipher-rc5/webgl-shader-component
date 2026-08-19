import { Effect, Fiber, Stream } from 'effect';
import { useRef, useState } from 'react';
import { interruptWebLLMGeneration, streamWebLLMResponse } from '@/lib/services/web-llm.service';
import type { ChatSession, Message } from '@/types';

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

  // The session a stream is writing into. Guards against a late chunk from a
  // previous conversation landing in whichever chat the user switched to.
  const streamingSessionIdRef = useRef<string>('');

  /** Mirror the live transcript into its owning session so switching away preserves it. */
  const persistMessages = (sessionId: string, next: readonly Message[]): void => {
    if (!sessionId) return;
    setChatSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, messages: next } : s)));
  };

  const updateLastAssistantMessage = (sessionId: string, content: string): void => {
    if (streamingSessionIdRef.current !== sessionId) return;

    setMessages((prev) => {
      const next =
        prev.length === 0
          ? ([{ role: 'assistant', content }] as const satisfies readonly Message[])
          : (() => {
              const draft = [...prev];
              const last = draft.length - 1;
              if (draft[last]?.role === 'assistant') draft[last] = { role: 'assistant', content };
              return draft;
            })();

      persistMessages(sessionId, next);
      return next;
    });
  };

  const interruptActiveStream = (): void => {
    interruptWebLLMGeneration();
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      fiberRef.current = null;
    }
    streamingSessionIdRef.current = '';
  };

  const sendMessage = (userInput: string): void => {
    if (!userInput.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: userInput };
    const conversation = [...messages, userMsg];
    const nextMessages: readonly Message[] = [...conversation, { role: 'assistant', content: '' }];

    // Reuse the active session, or open one on the first message of a new chat.
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: sessionId,
        title: userInput.slice(0, 30) + (userInput.length > 30 ? '...' : ''),
        timestamp: new Date(),
        messages: nextMessages
      };
      setChatSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    } else {
      persistMessages(sessionId, nextMessages);
    }

    streamingSessionIdRef.current = sessionId;
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    const program = streamWebLLMResponse(conversation).pipe(
      Stream.tap((text: string) => Effect.sync(() => updateLastAssistantMessage(sessionId, text))),
      Stream.runDrain,
      Effect.catchTag('ModelNotLoadedError', () =>
        Effect.sync(() =>
          updateLastAssistantMessage(sessionId, 'Assistant is not initialized yet. Load the model first.')
        )
      ),
      Effect.catchTag('StreamError', () =>
        Effect.sync(() => updateLastAssistantMessage(sessionId, "I couldn't generate a response right now."))
      ),
      Effect.ensuring(
        Effect.sync(() => {
          if (streamingSessionIdRef.current === sessionId) {
            streamingSessionIdRef.current = '';
            setIsTyping(false);
          }
        })
      )
    );

    fiberRef.current = Effect.runFork(program);
  };

  const stopGenerating = (): void => {
    if (!isTyping) return;
    interruptActiveStream();
    setIsTyping(false);
  };

  const startNewChat = (): void => {
    if (isTyping) interruptActiveStream();
    setMessages([]);
    setIsTyping(false);
    setCurrentSessionId('');
  };

  const switchSession = (sessionId: string): void => {
    if (sessionId === currentSessionId) return;

    // Abandon any in-flight generation; its chunks belong to the outgoing chat.
    if (isTyping) interruptActiveStream();

    const target = chatSessions.find((s) => s.id === sessionId);
    if (!target) return;

    setIsTyping(false);
    setInput('');
    setCurrentSessionId(sessionId);
    setMessages(target.messages);
  };

  const renameSession = (sessionId: string, title: string): void => {
    setChatSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, title: title.trim() || s.title } : s)));
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
