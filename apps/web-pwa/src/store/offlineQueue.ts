// Zustand offline store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OfflineQueueItemSchema, type OfflineQueueItem as OfflineQueueItemType } from '@/lib/validators';

export type QueueMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OfflineQueueItem {
  id: string;
  endpoint: string;
  payload: Record<string, unknown>;
  method: QueueMethod;
  createdAt: number;
}

interface OfflineQueueState {
  queue: OfflineQueueItem[];
  addToQueue: (item: OfflineQueueItem) => void;
  addToQueueValidated: (item: OfflineQueueItem) => boolean;
  dequeue: () => OfflineQueueItem | null;
  clearQueue: () => void;
}

const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
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
          console.error("Queue item validation failed:", error);
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
      clearQueue: () => set({ queue: [] }),
    }),
    { name: 'offline-queue' }
  )
);

export default useOfflineQueue;