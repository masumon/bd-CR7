import useOfflineQueue from '@/store/offlineQueue';

const MAX_ATTEMPTS = 5;

function resolveApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!raw) {
    return '';
  }
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

async function flushQueueOnce(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  const state = useOfflineQueue.getState();
  const item = state.dequeue();
  if (!item) {
    return;
  }

  const apiBase = resolveApiBase();
  if (!apiBase) {
    state.requeue(item);
    return;
  }

  try {
    const response = await fetch(`${apiBase}${item.endpoint}`, {
      method: item.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.payload),
    });

    if (response.ok) {
      return;
    }

    if (response.status === 409) {
      // Conflict resolution: last-write-wins by dropping older queued op.
      return;
    }

    const attempts = (item.attempts || 0) + 1;
    if (attempts < MAX_ATTEMPTS) {
      state.requeue({ ...item, attempts, lastError: `HTTP ${response.status}` });
    }
  } catch (error) {
    const attempts = (item.attempts || 0) + 1;
    if (attempts < MAX_ATTEMPTS) {
      state.requeue({ ...item, attempts, lastError: (error as Error).message });
    }
  }
}

export function setupOfflineSync(): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;

  const trigger = () => {
    void flushQueueOnce();
  };

  if (typeof window !== 'undefined') {
    timer = setInterval(trigger, 5000);
    window.addEventListener('online', trigger);
  }

  return () => {
    if (timer) {
      clearInterval(timer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', trigger);
    }
  };
}
