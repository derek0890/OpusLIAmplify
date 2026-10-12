export interface PostNotificationPayload {
  id: string;
  caption: string;
  postUrl: string;
  feedUrl: string;
}

export interface NotificationChannel {
  name: string;
  isConfigured(): boolean;
  send(post: PostNotificationPayload): Promise<void>;
}

export function truncate(text: string, max: number): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length > max ? `${singleLine.slice(0, max - 1)}…` : singleLine;
}
