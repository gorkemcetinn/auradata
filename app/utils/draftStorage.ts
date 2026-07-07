export const openDraftDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("AuraDataDrafts", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("store");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const saveDraftData = async (columns: string[], rows: any[][]): Promise<void> => {
  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readwrite");
    const store = tx.objectStore("store");
    store.put({ columns, rows }, "current_draft");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const loadDraftData = async (): Promise<{ columns: string[]; rows: any[][] } | null> => {
  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readonly");
    const store = tx.objectStore("store");
    const req = store.get("current_draft");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

export const clearDraftData = async (): Promise<void> => {
  const db = await openDraftDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("store", "readwrite");
    const store = tx.objectStore("store");
    store.delete("current_draft");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
