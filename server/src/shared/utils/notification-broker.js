const subscribers = new Map();

function write(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function subscribeUserNotifications(userId, res) {
  const key = String(userId);
  const set = subscribers.get(key) || new Set();
  set.add(res);
  subscribers.set(key, set);
  write(res, 'connected', { ok: true });
}

export function unsubscribeUserNotifications(userId, res) {
  const key = String(userId);
  const set = subscribers.get(key);
  if (!set) return;
  set.delete(res);
  if (!set.size) subscribers.delete(key);
}

export function publishUserNotification(userId, event, payload) {
  const key = String(userId);
  const set = subscribers.get(key);
  if (!set?.size) return;
  for (const res of set) write(res, event, payload);
}

export function heartbeatUserNotifications(userId) {
  const key = String(userId);
  const set = subscribers.get(key);
  if (!set?.size) return;
  for (const res of set) {
    res.write(': keepalive\n\n');
  }
}
