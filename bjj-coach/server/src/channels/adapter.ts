import type { Platform } from '../utils/constants.js';

export interface Button {
  label: string;
  data: string;
}

export type MessageCallback = (userId: string, text: string, platform: Platform) => void;
export type ButtonCallback = (userId: string, data: string, platform: Platform) => void;

export interface ChannelAdapter {
  sendMessage(userId: string, text: string): Promise<void>;
  sendButtons(userId: string, text: string, buttons: Button[]): Promise<void>;
  onMessage(callback: MessageCallback): void;
  onButtonPress(callback: ButtonCallback): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
