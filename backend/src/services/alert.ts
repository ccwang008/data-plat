import fetch from 'node-fetch';

export type AlertChannel = {
  type: 'webhook' | 'email';
  url?: string;
  email?: string;
};

export const sendAlert = async (channels: AlertChannel[] | null | undefined, title: string, content: string) => {
  if (!channels || channels.length === 0) return;
  const tasks: Promise<any>[] = [];
  for (const ch of channels) {
    if (ch.type === 'webhook' && ch.url) {
      tasks.push(
        fetch(ch.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        }).catch((e) => {
          console.error('webhook alert failed', e?.message || e);
        }),
      );
    }
    // 邮件占位：未来接入 SMTP
    if (ch.type === 'email') {
      console.warn('email alert not implemented, target:', ch.email);
    }
  }
  await Promise.all(tasks);
};

