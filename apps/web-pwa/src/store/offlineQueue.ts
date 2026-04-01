// Zustand offline store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OfflineQueueItemSchema } from '@/lib/validators';

export type QueueMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  method: QueueMethod;
  createdAt: number;
  attempts?: number;
  lastError?: string;
}

interface OfflineQueueState {
  queue: OfflineQueueItem[];
  addToQueue: (item: OfflineQueueItem) => void;
  addToQueueValidated: (item: OfflineQueueItem) => boolean;
  dequeue: () => OfflineQueueItem | null;
  peek: () => OfflineQueueItem | null;
  requeue: (item: OfflineQueueItem) => void;
  clearQueue: () => void;
}

const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      addToQueue: (item) =>
        set((state) => {
          const next = [...state.queue, item];
          return { queue: next.slice(-500) };
        }),
      addToQueueValidated: (item) => {
        try {
          OfflineQueueItemSchema.parse(item);
          set((state) => {
            const next = [...state.queue, item];
            return { queue: next.slice(-500) };
          });
          return true;
        } catch (error) {
          console.error('Queue item validation failed:', error);
          return false;
        }
      },
      dequeue: () => {
        let first: OfflineQueueItem | null = null;
        set((state) => {
          if (state.queue.length === 0) {
            first = null;
            return state;
          }
          first = state.queue[0];
          return { queue: state.queue.slice(1) };
        });
        return first;
      },
      peek: () => {
        const state = get();
        return state.queue.length ? state.queue[0] : null;
      },
      requeue: (item) =>
        set((state) => {
          const next = [...state.queue, item];
          return { queue: next.slice(-500) };
        }),
      clearQueue: () => set({ queue: [] }),
    }),
    { name: 'offline-queue' }
  )
);

export default useOfflineQueue;