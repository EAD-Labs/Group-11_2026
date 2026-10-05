/**
 * Offline Storage Service for Kanini Padhai
 * Built on IndexedDB for robust, high-capacity, transactional caching of
 * trail paths, course materials, and offline student progress mutations.
 */

const DB_NAME = 'kanini_padhai_offline_v1';
const DB_VERSION = 1;

const STORES = {
  TRAIL_PATHS: 'trail_paths',
  OFFLINE_PROGRESS: 'offline_progress_outbox',
  DOWNLOAD_MANIFEST: 'download_manifest'
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this browser/platform.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Trail paths store: stores class curriculum trees & topics
      if (!db.objectStoreNames.contains(STORES.TRAIL_PATHS)) {
        db.createObjectStore(STORES.TRAIL_PATHS, { keyPath: 'classId' });
      }

      // 2. Offline progress outbox: queues student completions when offline
      if (!db.objectStoreNames.contains(STORES.OFFLINE_PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.OFFLINE_PROGRESS, {
          keyPath: 'id',
          autoIncrement: true
        });
        progressStore.createIndex('by_student', 'studentId', { unique: false });
        progressStore.createIndex('by_status', 'status', { unique: false });
      }

      // 3. Download manifest: tracks what classes/terms are cached & timestamps
      if (!db.objectStoreNames.contains(STORES.DOWNLOAD_MANIFEST)) {
        db.createObjectStore(STORES.DOWNLOAD_MANIFEST, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Trail Paths & Course Material Methods
// ---------------------------------------------------------------------------

/**
 * Saves a full class trail path into IndexedDB.
 * @param {string} classId - e.g. "1", "2", "3", "4", "5"
 * @param {object} classData - terms, topics, items
 */
export async function saveClassTrail(classId, classData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TRAIL_PATHS, STORES.DOWNLOAD_MANIFEST], 'readwrite');
    const trailStore = tx.objectStore(STORES.TRAIL_PATHS);
    const manifestStore = tx.objectStore(STORES.DOWNLOAD_MANIFEST);

    const record = {
      classId: String(classId),
      data: classData,
      downloadedAt: new Date().toISOString(),
      itemCount: countItemsInClass(classData)
    };

    trailStore.put(record);

    // Update manifest entry
    manifestStore.put({
      key: `class_${classId}`,
      classId: String(classId),
      downloadedAt: record.downloadedAt,
      itemCount: record.itemCount,
      status: 'CACHED'
    });

    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieves a cached class trail path from IndexedDB.
 * @param {string} classId
 */
export async function getClassTrail(classId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRAIL_PATHS, 'readonly');
    const store = tx.objectStore(STORES.TRAIL_PATHS);
    const req = store.get(String(classId));

    req.onsuccess = () => resolve(req.result ? req.result.data : null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Removes a class from offline storage.
 * @param {string} classId
 */
export async function removeClassTrail(classId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.TRAIL_PATHS, STORES.DOWNLOAD_MANIFEST], 'readwrite');
    tx.objectStore(STORES.TRAIL_PATHS).delete(String(classId));
    tx.objectStore(STORES.DOWNLOAD_MANIFEST).delete(`class_${classId}`);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Returns a list of all currently cached classes in IndexedDB.
 */
export async function getDownloadedClassesManifest() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DOWNLOAD_MANIFEST, 'readonly');
    const store = tx.objectStore(STORES.DOWNLOAD_MANIFEST);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Offline Student Progress Outbox Methods
// ---------------------------------------------------------------------------

/**
 * Queues a student progress action (complete or uncomplete) when offline.
 */
export async function queueOfflineProgress(progressMutation) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_PROGRESS, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_PROGRESS);

    const record = {
      ...progressMutation,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    const req = store.add(record);
    req.onsuccess = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Gets all pending offline progress mutations.
 */
export async function getPendingProgress() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_PROGRESS, 'readonly');
    const store = tx.objectStore(STORES.OFFLINE_PROGRESS);
    const req = store.getAll();

    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Removes synced mutations from outbox once acknowledged by server.
 * @param {Array<number>} ids
 */
export async function removeSyncedProgress(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_PROGRESS, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_PROGRESS);

    ids.forEach(id => store.delete(id));

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// Storage Quota & Persistence Utilities
// ---------------------------------------------------------------------------

/**
 * Requests persistent storage to prevent silent eviction under low disk pressure.
 */
export async function requestPersistentStorage() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch (e) {
      console.warn('Storage persistence request failed:', e);
      return false;
    }
  }
  return false;
}

/**
 * Returns estimated storage quota and usage.
 */
export async function getStorageEstimate() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const isPersisted = navigator.storage.persisted
        ? await navigator.storage.persisted()
        : false;

      const usageBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;
      const usageMB = (usageBytes / (1024 * 1024)).toFixed(1);
      const quotaMB = (quotaBytes / (1024 * 1024)).toFixed(0);
      const percentUsed = quotaBytes > 0 ? ((usageBytes / quotaBytes) * 100).toFixed(1) : 0;

      return {
        usageBytes,
        quotaBytes,
        usageMB: Number(usageMB),
        quotaMB: Number(quotaMB),
        percentUsed: Number(percentUsed),
        isPersisted
      };
    } catch (e) {
      console.warn('Could not estimate storage:', e);
    }
  }

  return {
    usageBytes: 0,
    quotaBytes: 0,
    usageMB: 0,
    quotaMB: 0,
    percentUsed: 0,
    isPersisted: false
  };
}

// Helper to count items in a class object
function countItemsInClass(classData) {
  if (!classData || typeof classData !== 'object') return 0;
  let count = 0;
  Object.values(classData).forEach(topics => {
    if (Array.isArray(topics)) {
      topics.forEach(t => {
        if (Array.isArray(t.items)) {
          count += t.items.length;
        }
      });
    }
  });
  return count;
}
