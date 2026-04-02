import { create } from "zustand";

const DB_NAME = "bdcr7-offline-db";
const STORE_NAME = "queue";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putItem(item) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllItems() {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteItem(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export const useOfflineQueueStore = create((set, get) => ({
  queue: [],
  loading: false,
  addToOfflineQueue: async (payload) => {
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      attempts: 0,
      ...payload,
    };
    await putItem(item);
    set((state) => ({ queue: [...state.queue, item] }));
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "BDCR7_SYNC_TRIGGER" });
    }
    return item;
  },
  loadQueue: async () => {
    set({ loading: true });
    const list = await getAllItems();
    set({ queue: list, loading: false });
  },
  syncQueue: async () => {
    const list = await getAllItems();
    for (const item of list) {
      try {
        await fetch(item.endpoint, {
          method: item.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload || {}),
        });
        await deleteItem(item.id);
      } catch {
        await putItem({ ...item, attempts: (item.attempts || 0) + 1 });
      }
    }
    const next = await getAllItems();
    set({ queue: next });
  },
}));
