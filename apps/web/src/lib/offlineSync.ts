import useOfflineQueue from '@/store/offlineQueue';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/errorUtils';

const MAX_ATTEMPTS = 5;
let flushInProgress = false;

/**
 * Always use same-origin relative paths so that the Next.js API proxy
 * (app/api/[...path]/route.ts) forwards requests to the Python backend.
 * This avoids relying on the NEXT_PUBLIC_API_URL browser env var, which can
 * be misconfigured and cause wrong routing in production.
 */
function resolveApiBase(): string {
  return '';
}

async function flushQueueOnce(): Promise<void> {
  if (flushInProgress) {
    return;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  flushInProgress = true;

  try {
    const apiBase = resolveApiBase();
    const token = useAuthStore.getState().token;
    const maxBatch = 50;

    for (let i = 0; i < maxBatch; i += 1) {
      const item = useOfflineQueue.getState().dequeue();
      if (!item) {
        break;
      }

      try {
        const response = await fetch(`${apiBase}${item.endpoint}`, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(item.payload),
        });

        if (response.ok || response.status === 409) {
          continue;
        }

        const attempts = (item.attempts || 0) + 1;
        if (attempts < MAX_ATTEMPTS) {
          useOfflineQueue.getState().requeue({ ...item, attempts, lastError: `HTTP ${response.status}` });
        }
      } catch (error) {
        const attempts = (item.attempts || 0) + 1;
        if (attempts < MAX_ATTEMPTS) {
          useOfflineQueue.getState().requeue({ ...item, attempts, lastError: getErrorMessage(error) });
        }
      }
    }
  } finally {
    flushInProgress = false;
  }
}

export function setupOfflineSync(): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;

  const trigger = () => {
    void flushQueueOnce();
  };

  if (typeof window !== 'undefined') {
    // Poll every 30 s to avoid excessive background traffic; online event gives instant replay.
    timer = setInterval(trigger, 30000);
    window.addEventListener('online', trigger);
    window.addEventListener('bdcr7:sync', trigger as EventListener);
  }

  return () => {
    if (timer) {
      clearInterval(timer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', trigger);
      window.removeEventListener('bdcr7:sync', trigger as EventListener);
    }
  };
}
