import useOfflineQueue from '@/store/offlineQueue';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage } from '@/lib/errorUtils';

const MAX_ATTEMPTS = 5;
let flushInProgress = false;

export type OfflineSyncSummary = {
  processed: number;
  succeeded: number;
  requeued: number;
  discarded: number;
  remaining: number;
  lastError: string | null;
};

/**
 * Always use same-origin relative paths so that the Next.js API proxy
 * (app/api/[...path]/route.ts) forwards requests to the Python backend.
 * This avoids relying on the NEXT_PUBLIC_API_URL browser env var, which can
 * be misconfigured and cause wrong routing in production.
 */
function resolveApiBase(): string {
  return '';
}

const emitSyncSummary = (summary: OfflineSyncSummary) => {
  if (typeof window === 'undefined' || summary.processed === 0) {
    return;
  }
  window.dispatchEvent(new CustomEvent('bdcr7:sync-result', { detail: summary }));
};

export async function triggerOfflineSync(): Promise<OfflineSyncSummary> {
  if (flushInProgress) {
    return { processed: 0, succeeded: 0, requeued: 0, discarded: 0, remaining: useOfflineQueue.getState().queue.length, lastError: null };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, succeeded: 0, requeued: 0, discarded: 0, remaining: useOfflineQueue.getState().queue.length, lastError: 'offline' };
  }

  flushInProgress = true;
  const summary: OfflineSyncSummary = {
    processed: 0,
    succeeded: 0,
    requeued: 0,
    discarded: 0,
    remaining: useOfflineQueue.getState().queue.length,
    lastError: null,
  };

  try {
    const apiBase = resolveApiBase();
    const token = useAuthStore.getState().token;
    const maxBatch = 50;

    for (let i = 0; i < maxBatch; i += 1) {
      const item = useOfflineQueue.getState().dequeue();
      if (!item) {
        break;
      }
      summary.processed += 1;

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
          summary.succeeded += 1;
          continue;
        }

        const attempts = (item.attempts || 0) + 1;
        if (attempts < MAX_ATTEMPTS) {
          useOfflineQueue.getState().requeue({ ...item, attempts, lastError: `HTTP ${response.status}` });
          summary.requeued += 1;
          summary.lastError = `HTTP ${response.status}`;
        } else {
          summary.discarded += 1;
          summary.lastError = `HTTP ${response.status}`;
        }
      } catch (error) {
        const attempts = (item.attempts || 0) + 1;
        if (attempts < MAX_ATTEMPTS) {
          useOfflineQueue.getState().requeue({ ...item, attempts, lastError: getErrorMessage(error) });
          summary.requeued += 1;
          summary.lastError = getErrorMessage(error);
        } else {
          summary.discarded += 1;
          summary.lastError = getErrorMessage(error);
        }
      }
    }
  } finally {
    summary.remaining = useOfflineQueue.getState().queue.length;
    flushInProgress = false;
    emitSyncSummary(summary);
  }

  return summary;
}

export function setupOfflineSync(): () => void {
  let timer: ReturnType<typeof setInterval> | null = null;

  const trigger = () => {
    void triggerOfflineSync();
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
