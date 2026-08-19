import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { act, renderHook } from '@testing-library/react';
import { Effect, Stream } from 'effect';

// Drive the stream by hand so tests control exactly when chunks arrive.
// Only the most recently opened stream is addressable; each test opens its own,
// so a leftover stream from a previous test can never receive these chunks.
type StreamHandle = { single: (chunk: string) => void; end: () => void };
let active: StreamHandle | null = null;

const emit = (chunk: string): void => active?.single(chunk);
const finish = (): void => {
  active?.end();
  active = null;
};

mock.module('@/lib/services/web-llm.service', () => ({
  interruptWebLLMGeneration: () => {
    active = null;
  },
  streamWebLLMResponse: () =>
    Stream.async<string>((cb) => {
      active = { single: (chunk: string) => cb.single(chunk), end: () => cb.end() };
      return Effect.void;
    })
}));

const { useChat } = await import('@/lib/hooks/use-chat');

describe('useChat session isolation', () => {
  beforeEach(() => {
    active = null;
  });

  test('switching to a previous session restores that conversation', async () => {
    const { result } = renderHook(() => useChat());

    // --- chat A ---
    await act(async () => result.current.sendMessage('first question'));
    await act(async () => {
      emit('answer A');
      finish();
    });
    const sessionA = result.current.currentSessionId;
    expect(result.current.messages.map((m) => m.content)).toEqual(['first question', 'answer A']);

    // --- chat B ---
    await act(async () => result.current.startNewChat());
    expect(result.current.messages).toHaveLength(0);

    await act(async () => result.current.sendMessage('second question'));
    await act(async () => {
      emit('answer B');
      finish();
    });
    const sessionB = result.current.currentSessionId;
    expect(result.current.messages.map((m) => m.content)).toEqual(['second question', 'answer B']);

    expect(sessionA).not.toBe(sessionB);
    expect(result.current.chatSessions).toHaveLength(2);

    // --- the reported bug: switch back to A ---
    await act(async () => result.current.switchSession(sessionA));
    expect(result.current.currentSessionId).toBe(sessionA);
    expect(result.current.messages.map((m) => m.content)).toEqual(['first question', 'answer A']);

    // --- and forward to B again ---
    await act(async () => result.current.switchSession(sessionB));
    expect(result.current.messages.map((m) => m.content)).toEqual(['second question', 'answer B']);
  });

  test('each session keeps its own transcript', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => result.current.sendMessage('A'));
    await act(async () => {
      emit('ra');
      finish();
    });
    const a = result.current.currentSessionId;

    await act(async () => result.current.startNewChat());
    await act(async () => result.current.sendMessage('B'));
    await act(async () => {
      emit('rb');
      finish();
    });

    const stored = Object.fromEntries(result.current.chatSessions.map((s) => [s.id, s.messages.map((m) => m.content)]));
    expect(stored[a]).toEqual(['A', 'ra']);
    expect(Object.keys(stored)).toHaveLength(2);
  });

  test('continuing an existing chat appends to that session only', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => result.current.sendMessage('one'));
    await act(async () => {
      emit('r1');
      finish();
    });
    const only = result.current.currentSessionId;

    await act(async () => result.current.sendMessage('two'));
    await act(async () => {
      emit('r2');
      finish();
    });

    // still a single session, not a new one per message
    expect(result.current.chatSessions).toHaveLength(1);
    expect(result.current.messages.map((m) => m.content)).toEqual(['one', 'r1', 'two', 'r2']);
    expect(result.current.chatSessions[0]?.id).toBe(only);
  });
  test('message ids are unique and stable across session switches', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => result.current.sendMessage('question A'));
    await act(async () => {
      emit('answer A');
      finish();
    });
    const sessionA = result.current.currentSessionId;
    const idsBefore = result.current.messages.map((m) => m.id);

    expect(idsBefore).toHaveLength(2);
    expect(new Set(idsBefore).size).toBe(2);
    for (const id of idsBefore) expect(id).toBeTruthy();

    await act(async () => result.current.startNewChat());
    await act(async () => result.current.sendMessage('question B'));
    await act(async () => {
      emit('answer B');
      finish();
    });
    const idsB = result.current.messages.map((m) => m.id);

    // no id collisions across sessions
    expect(idsB.some((id) => idsBefore.includes(id))).toBe(false);

    // switching back yields the very same ids, so React keys stay stable
    await act(async () => result.current.switchSession(sessionA));
    expect(result.current.messages.map((m) => m.id)).toEqual(idsBefore);
  });

  test('streamed chunks land on the assistant message by id', async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => result.current.sendMessage('hello'));
    const assistantId = result.current.messages[1]?.id;
    expect(assistantId).toBeTruthy();

    await act(async () => emit('partial'));
    expect(result.current.messages[1]?.content).toBe('partial');
    expect(result.current.messages[1]?.id).toBe(assistantId as string);

    await act(async () => {
      emit('partial then complete');
      finish();
    });
    // same message object identity by id, content replaced in place
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]?.id).toBe(assistantId as string);
    expect(result.current.messages[1]?.content).toBe('partial then complete');
    expect(result.current.messages[0]?.role).toBe('user');
  });
});
