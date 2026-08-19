export interface Message {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface ChatSession {
  readonly id: string;
  readonly title: string;
  readonly timestamp: Date;
  readonly messages: readonly Message[];
}

export interface ModelLoadingState {
  readonly isLoaded: boolean;
  readonly progress: number;
}
