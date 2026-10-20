/**
 * SanStudio Forms — IndexedDB & LocalStorage Abstraction
 * ========================================================
 * Provides a unified API for persisting forms, responses,
 * and preferences with IndexedDB as primary and localStorage as fallback.
 */

/* ================================================================
 * Constants
 * ================================================================ */

const DB_NAME    = 'SanForms';
const DB_VERSION = 1;
const STORES = {
  forms:     'forms',
  responses: 'responses',
  settings:  'settings',
};

/* ================================================================
 * IndexedDB Instance
 * ================================================================ */

let _db = null;

/**
 * Open (or initialize) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
export async function initStorage() {
  if (_db) return _db;

  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORES.forms)) {
        const store = db.createObjectStore(STORES.forms, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('status',    'status',    { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.responses)) {
        const store = db.createObjectStore(STORES.responses, { keyPath: 'id' });
        store.createIndex('formId',     'formId',     { unique: false });
        store.createIndex('submittedAt','submittedAt',{ unique: false });
        store.createIndex('synced',     'synced',     { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => {
      _db = e.target.result;
      resolve(_db);
    };

    request.onerror = (e) => {
      console.warn('[Storage] IndexedDB unavailable, using localStorage fallback', e);
      resolve(null);
    };
  });
}

async function getDB() {
  if (_db) return _db;
  return await initStorage();
}

/* ================================================================
 * Generic IDB helpers
 * ================================================================ */

function idbGet(storeName, key) {
  return new Promise(async (resolve) => {
    const db = await getDB();
    if (!db) { resolve(null); return; }
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => resolve(null);
  });
}

function idbPut(storeName, value) {
  return new Promise(async (resolve) => {
    const db = await getDB();
    if (!db) { resolve(false); return; }
    const req = db.transaction(storeName, 'readwrite').objectStore(storeName).put(value);
    req.onsuccess = () => resolve(true);
    req.onerror   = () => resolve(false);
  });
}

function idbDelete(storeName, key) {
  return new Promise(async (resolve) => {
    const db = await getDB();
    if (!db) { resolve(false); return; }
    const req = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror   = () => resolve(false);
  });
}

function idbGetAll(storeName) {
  return new Promise(async (resolve) => {
    const db = await getDB();
    if (!db) { resolve([]); return; }
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => resolve([]);
  });
}

function idbGetByIndex(storeName, indexName, value) {
  return new Promise(async (resolve) => {
    const db = await getDB();
    if (!db) { resolve([]); return; }
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).index(indexName).getAll(value);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => resolve([]);
  });
}

/* ================================================================
 * Form Storage
 * ================================================================ */

const FORMS_LS_KEY = 'sanforms:forms';

export const FormStorage = {
  async save(form) {
    if (!form?.id) return;
    const ok = await idbPut(STORES.forms, form);
    if (!ok) {
      const all = this._lsGetAll();
      const idx = all.findIndex(f => f.id === form.id);
      if (idx >= 0) all[idx] = form; else all.push(form);
      this._lsSave(all);
    }
  },

  async load(id) {
    const form = await idbGet(STORES.forms, id);
    if (form) return form;
    return this._lsGetAll().find(f => f.id === id) || null;
  },

  async loadAll() {
    const forms = await idbGetAll(STORES.forms);
    if (forms.length > 0) return forms;
    return this._lsGetAll();
  },

  async delete(id) {
    await idbDelete(STORES.forms, id);
    this._lsSave(this._lsGetAll().filter(f => f.id !== id));
  },

  _lsGetAll() {
    try { return JSON.parse(localStorage.getItem(FORMS_LS_KEY) || '[]'); } catch { return []; }
  },
  _lsSave(forms) {
    try { localStorage.setItem(FORMS_LS_KEY, JSON.stringify(forms)); } catch {}
  },
};

/* ================================================================
 * Response Storage
 * ================================================================ */

const RESPONSES_LS_KEY = 'sanforms:responses';

export const ResponseStorage = {
  async save(response) {
    if (!response?.id) return;
    const ok = await idbPut(STORES.responses, response);
    if (!ok) {
      const all = this._lsGetAll();
      const idx = all.findIndex(r => r.id === response.id);
      if (idx >= 0) all[idx] = response; else all.push(response);
      this._lsSave(all);
    }
  },

  async getByFormId(formId) {
    const r = await idbGetByIndex(STORES.responses, 'formId', formId);
    if (r.length > 0) return r;
    return this._lsGetAll().filter(r => r.formId === formId);
  },

  async getUnsynced() {
    const r = await idbGetByIndex(STORES.responses, 'synced', false);
    if (r.length > 0) return r;
    return this._lsGetAll().filter(r => !r.synced);
  },

  async markSynced(id) {
    const r = await idbGet(STORES.responses, id);
    if (r) { r.synced = true; await idbPut(STORES.responses, r); }
    const all = this._lsGetAll();
    const idx = all.findIndex(r => r.id === id);
    if (idx >= 0) { all[idx].synced = true; this._lsSave(all); }
  },

  async delete(id) {
    await idbDelete(STORES.responses, id);
    this._lsSave(this._lsGetAll().filter(r => r.id !== id));
  },

  _lsGetAll() {
    try { return JSON.parse(localStorage.getItem(RESPONSES_LS_KEY) || '[]'); } catch { return []; }
  },
  _lsSave(d) {
    try { localStorage.setItem(RESPONSES_LS_KEY, JSON.stringify(d)); } catch {}
  },
};

/* ================================================================
 * Settings Storage
 * ================================================================ */

export const SettingsStorage = {
  async get(key) {
    const record = await idbGet(STORES.settings, key);
    if (record) return record.value;
    return localStorage.getItem(`sanforms:${key}`);
  },

  async set(key, value) {
    await idbPut(STORES.settings, { key, value });
    try { localStorage.setItem(`sanforms:${key}`, typeof value === 'string' ? value : JSON.stringify(value)); } catch {}
  },

  async delete(key) {
    await idbDelete(STORES.settings, key);
    localStorage.removeItem(`sanforms:${key}`);
  },
};

/* ================================================================
 * User Preferences — synchronous, localStorage only
 * ================================================================ */

export const Prefs = {
  theme:   { get: () => localStorage.getItem('sanforms:theme') || 'light',  set: v => localStorage.setItem('sanforms:theme', v) },
  sidebar: { get: () => localStorage.getItem('sanforms:sidebar-collapsed') === 'true', set: v => localStorage.setItem('sanforms:sidebar-collapsed', v) },
  apiUrl:  { get: () => localStorage.getItem('sanforms:apiUrl') || '',       set: v => localStorage.setItem('sanforms:apiUrl', v) },
  view:    { get: () => localStorage.getItem('sanforms:view') || 'grid',     set: v => localStorage.setItem('sanforms:view', v) },
  user: {
    get: () => { try { return JSON.parse(localStorage.getItem('sanforms:user') || 'null'); } catch { return null; } },
    set: v => localStorage.setItem('sanforms:user', JSON.stringify(v)),
  },
};

/* ================================================================
 * CSV Export Utility
 * ================================================================ */

export const DataExport = {
  toCSV(responses, form) {
    const questions = (form.questions || []).filter(q =>
      !['instruction','rich-text','section-break','page-break','video-embed','audio-embed','custom-html'].includes(q.type)
    );
    const headers = ['#','Submitted At','Duration (s)',...questions.map(q => q.label || q.id)];
    const rows = responses.map((r, i) => {
      const a = r.answers || {};
      return [
        i+1,
        r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '',
        r.duration || '',
        ...questions.map(q => {
          const v = a[q.id];
          if (v == null) return '';
          return Array.isArray(v) ? v.join('; ') : String(v).replace(/"/g,'""');
        }),
      ].map(c => `"${c}"`).join(',');
    });
    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  },

  download(content, filename, mimeType = 'text/csv;charset=utf-8;') {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  },
};
