const DB_NAME = "bdcr7-offline-db";
const STORE_NAME = "queue";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
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

async function getAllQueueItems() {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueueItem(id) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function syncOfflineQueue() {
  const queue = await getAllQueueItems();
  for (const item of queue) {
    try {
      const response = await fetch(item.endpoint, {
        method: item.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload || {}),
      });
      if (response.ok) {
        await deleteQueueItem(item.id);
      }
    } catch {
      // Leave item in queue for next retry.
    }
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "bdcr7-sync-queue") {
    event.waitUntil(syncOfflineQueue());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "BDCR7_SYNC_TRIGGER") {
    if (self.registration.sync) {
      self.registration.sync.register("bdcr7-sync-queue");
    } else {
      event.waitUntil(syncOfflineQueue());
    }
  }
});

self.addEventListener("online", () => {
  void syncOfflineQueue();
});

self.addEventListener("fetch", () => {
  // API request handling is performed by the app queue and sync pipeline.
});
