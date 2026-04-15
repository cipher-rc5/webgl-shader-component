'use client';
import { ChatMessage } from '@/components/chat/chat-message';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { DesertSandShader } from '@/components/desert-sand-shader';
import { ChatInput } from '@/components/ui/chat-input';
import { ExampleButtons } from '@/components/ui/example-buttons';
import { ModelLoaderCard } from '@/components/ui/model-loader-card';
import { useChat } from '@/lib/hooks/use-chat';
import { useModelLoader } from '@/lib/hooks/use-model-loader';
import { cn } from '@/lib/utils';
import { MessageSquare, Pencil, Plus } from 'lucide-react';
import { type KeyboardEvent, type SyntheticEvent, useEffect, useRef, useState } from 'react';

export default function Page(): React.JSX.Element {
  const { isLoaded, progress, loadModel, error } = useModelLoader();
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
    renameSession
  } = useChat();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e: SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
  };

  const handleExampleClick = (example: string): void => {
    setInput(example);
  };

  const lastMessage = messages.at(-1);
  const showTypingIndicator = isTyping && (lastMessage?.role !== 'assistant' || lastMessage.content.length === 0);

  return (
    <div className='flex h-screen w-full overflow-hidden bg-[#e8e8e8] font-sans text-zinc-900 selection:bg-[#F4D03F]/30'>
      {/* Sidebar with Past Searches */}
      <aside className='z-20 flex w-64 flex-col gap-4 bg-[#e8e8e8] px-4 pt-4 pb-8 md:pb-10'>
        {/* Logo */}
        <div className='neomorphic neomorphic-dark mb-2 flex items-center justify-center rounded-2xl p-4'>
          <img
            src='/cipher_logo_dark.svg'
            alt='Cipher'
            className='h-8 w-auto brightness-0 invert'
            style={{ filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className='neomorphic neomorphic-hover flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold text-zinc-800 transition-all active:scale-95'>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Past Searches */}
        <div className='flex-1 overflow-hidden'>
          <h3 className='mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-700'>Recent Chats</h3>
          <div className='custom-scrollbar space-y-2 overflow-y-auto pr-1 pb-4' style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {chatSessions.map((session) => {
              const isEditing = editingSessionId === session.id;

              const commitRename = (): void => {
                renameSession(session.id, editingTitle);
                setEditingSessionId(null);
              };

              const startEditing = (e: React.MouseEvent): void => {
                e.stopPropagation();
                setEditingTitle(session.title);
                setEditingSessionId(session.id);
              };

              const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditingSessionId(null);
              };

              return (
                <div
                  key={session.id}
                  className={cn(
                    'group w-full rounded-xl border p-3 text-left text-sm transition-all',
                    currentSessionId === session.id ?
                      'neomorphic-inset border-zinc-300/90 text-zinc-950' :
                      'neomorphic neomorphic-hover border-zinc-200/80 text-zinc-800'
                  )}>
                  {isEditing ?
                    (
                      <input
                        autoFocus
                        type='text'
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={handleKeyDown}
                        className='w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500' />
                    ) :
                    (
                      <button
                        type='button'
                        onClick={() => switchSession(session.id)}
                        className='flex w-full items-start gap-2'>
                        <MessageSquare size={14} className='mt-0.5 shrink-0' />
                        <span className='line-clamp-2 flex-1 text-left'>{session.title}</span>
                        <Pencil
                          size={12}
                          onClick={startEditing}
                          className='mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100!' />
                      </button>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className='relative flex flex-1 flex-col bg-[#e8e8e8]'>
        {/* Shader Background */}
        <div className='pointer-events-none absolute left-0 top-0 z-0 h-full w-full overflow-hidden opacity-30'>
          <DesertSandShader speed={0.2} sandDetail={1.2} mistIntensity={1.5} />
          {/* Fade overlay to blend shader into background */}
          <div className='absolute bottom-0 left-0 h-1/2 w-full bg-linear-to-t from-[#e8e8e8] via-[#e8e8e8]/80 to-transparent' />
        </div>

        {/* Content Area */}
        <div
          className='relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col px-6'
          style={{ paddingTop: '4vh', paddingBottom: '4vh' }}>
          {messages.length > 0 ?
            (
              <div className='flex flex-1 flex-col overflow-hidden' style={{ minHeight: 0 }}>
                {/* Response Container */}
                <div className='mb-6 flex-1 overflow-hidden rounded-3xl'>
                  <div className='neomorphic-inset custom-scrollbar h-full overflow-y-auto rounded-3xl p-6'>
                    <div className='space-y-6'>
                      {messages.map((msg, idx) => (
                        <ChatMessage
                          key={idx}
                          message={msg}
                          isStreaming={isTyping && idx === messages.length - 1 && msg.role === 'assistant'} />
                      ))}
                      {showTypingIndicator && <TypingIndicator />}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>
              </div>
            ) :
            (
              <div
                className='flex flex-1 flex-col items-center'
                style={{ justifyContent: 'flex-start', paddingTop: '4vh' }}>
                {/* Empty State - The Orb */}
                <div className='relative mb-6 flex animate-[float_6s_ease-in-out_infinite] flex-col items-center justify-center'>
                  <div className='relative flex h-48 w-48 items-center justify-center md:h-64 md:w-64'>
                    <div className='neomorphic absolute inset-0 animate-[spin-slow_20s_linear_infinite] rounded-full' />
                    <div className='absolute h-36 w-36 skew-x-12 rotate-45 rounded-full border-4 border-zinc-300/50 blur-[1px] md:h-48 md:w-48 md:border-[6px]' />
                    <div className='absolute h-40 w-40 -rotate-12 skew-y-6 rounded-full border-2 border-zinc-400/40 md:h-56 md:w-56' />

                    <div className='neomorphic neomorphic-dark relative flex h-24 w-24 items-center justify-center rounded-2xl p-4 md:h-32 md:w-32 md:p-6'>
                      <img
                        src='/cipher_logo_dark.svg'
                        alt='Cipher'
                        className='h-auto w-full brightness-0 invert'
                        style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Input Section */}
          <div className='relative w-full'>
            {!isLoaded && <ModelLoaderCard progress={progress} onLoadModel={loadModel} error={error} />}

            <ExampleButtons isDisabled={!isLoaded || isTyping} onExampleClick={handleExampleClick} />

            <ChatInput
              value={input}
              isDisabled={!isLoaded}
              isGenerating={isTyping}
              onChange={setInput}
              onSubmit={handleSend}
              onStop={stopGenerating} />
          </div>
        </div>
      </main>
    </div>
  );
}
