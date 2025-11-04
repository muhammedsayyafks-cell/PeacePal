
import { Timestamp } from 'firebase/firestore';

export type Sender = 'user' | 'bot';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  createdAt: Timestamp;
}

export type AppState = 'chat' | 'phq9' | 'gad7' | 'cssrs';

export interface ScreenerQuestion {
  id: string;
  text: string;
}

export interface ScreenerOption {
  text: string;
  value: number;
}

export interface CssrsNode {
  text: string;
  isSuicidalIdeation?: boolean;
  isBehavior?: boolean;
  isEnd?: boolean;
  isEscalation?: boolean;
  next?: string;
  nextYes?: string;
  nextNo?: string;
}

export interface CssrsFlow {
  [key: string]: CssrsNode;
}

export interface ChatPart {
  text: string;
}

export interface ChatHistoryPart {
  role: 'user' | 'model';
  parts: ChatPart[];
}
