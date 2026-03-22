import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  pushToken: string,
  payload: PushPayload
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`[push] Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data,
  };

  try {
    const [ticket] = await expo.sendPushNotificationsAsync([message]);
    if ((ticket as any).status === 'error') {
      console.error(`[push] Error sending to ${pushToken}:`, (ticket as any).message);
    }
  } catch (err) {
    console.error(`[push] Failed to send push:`, err);
  }
}

export async function sendPushToMultiple(
  tokens: string[],
  payload: PushPayload
): Promise<string[]> {
  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return [];

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: 'default' as const,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  }));

  const staleTokens: string[] = [];

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i] as any;
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        staleTokens.push(validTokens[i]);
      }
    }
  } catch (err) {
    console.error(`[push] Failed to send batch push:`, err);
  }

  return staleTokens;
}
