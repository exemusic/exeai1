export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
  attachment?: {
    type: "audio" | "image" | "file";
    name: string;
    url: string;
    size: number;
    mime?: string;
    textContent?: string;
  } | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  systemInstructionId: string;
  temperature: number;
  model: string;
  createdAt: number;
  webSearchEnabled?: boolean;
}

export interface SystemPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  instruction: string;
  badge?: string;
}

export interface ModelOption {
  id: string;
  name: string;
  badge: string;
  description: string;
}
