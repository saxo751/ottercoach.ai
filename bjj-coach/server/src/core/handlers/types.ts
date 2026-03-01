export interface SystemMessage {
  text: string;
  link?: string;
}

export interface HandlerResult {
  text: string;
  systemMessages?: SystemMessage[];
}
