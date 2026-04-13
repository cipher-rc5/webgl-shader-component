export interface Message {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface ChatSession {
  readonly id: string;
  readonly title: string;
  readonly timestamp: Date;
}

export interface ModelLoadingState {
  readonly isLoaded: boolean;
  readonly progress: number;
}
