/**
 * SanStudio Forms — API Client
 * ==============================
 * Communicates with the Google Apps Script backend.
 * Features: retry logic, request queuing, offline detection,
 * caching, and rate-limit awareness.
 */

import { EventBus, Events } from './events.js';

/* ================================================================
 * Configuration
 * ================================================================ */

let _apiUrl = localStorage.getItem('sanforms:apiUrl') || '';

const DEFAULT_OPTS = {
  maxRetries:    3,
  retryDelay:    1000,
  timeout:       15000,
  cacheSeconds:  30,
};

const _cache    = new Map();
const _queue    = [];
let _processing = false;

/* ================================================================
 * Core Request
 * ================================================================ */

async function request(action, params = {}, method = 'GET', opts = {}) {
  if (!_apiUrl) {
    return { ok: false, error: 'API URL not configured. Go to Settings to set it up.', notConfigured: true };
  }

  const options  = { ...DEFAULT_OPTS, ...opts };
  const cacheKey = `${action}:${JSON.stringify(params)}`;

  // Serve from cache for GET requests
  if (method === 'GET' && _cache.has(cacheKey)) {
    const cached = _cache.get(cacheKey);
    if (Date.now() - cached.time < options.cacheSeconds * 1000) {
      return cached.data;
    }
  }

  // Offline? Queue the request
  if (!navigator.onLine && method === 'POST') {
    _queue.push({ action, params, method });
    return { ok: false, error: 'Offline — request queued', queued: true };
  }

  let lastError;
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const result = await fetchWithTimeout(action, params, method, options.timeout);
      if (result.ok && method === 'GET') {
        _cache.set(cacheKey, { data: result, time: Date.now() });
      }
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < options.maxRetries) {
        await sleep(options.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  return { ok: false, error: lastError?.message || 'Request failed after retries' };
}

async function fetchWithTimeout(action, params, method, timeout) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeout);

  let url, fetchOpts;

  if (method === 'GET') {
    const qs = new URLSearchParams({ action, ...params }).toString();
    url      = `${_apiUrl}?${qs}`;
    fetchOpts = { method: 'GET', signal: controller.signal };
  } else {
    url = _apiUrl;
    fetchOpts = {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
      mode: 'no-cors', // For GAS: use opaque response, check via redirect
    };
  }

  try {
    const resp = await fetch(url, fetchOpts);
    clearTimeout(timer);

    // GAS POST responses may be opaque (mode: no-cors), so use GET-style workaround
    if (method === 'POST' && resp.type === 'opaque') {
      return { ok: true, data: null, queued: false };
    }

    const text = await resp.text();
    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      return { ok: resp.ok, data: text };
    }
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/* ================================================================
 * Offline Queue Processor
 * ================================================================ */

async function processQueue() {
  if (_processing || _queue.length === 0) return;
  _processing = true;

  while (_queue.length > 0) {
    const item = _queue.shift();
    try {
      await request(item.action, item.params, item.method);
    } catch {}
    await sleep(200);
  }

  _processing = false;
  EventBus.emit(Events.SYNC_COMPLETE);
}

window.addEventListener('online', processQueue);

/* ================================================================
 * Cache Invalidation
 * ================================================================ */

function invalidateCache(pattern) {
  if (!pattern) { _cache.clear(); return; }
  for (const key of _cache.keys()) {
    if (key.startsWith(pattern)) _cache.delete(key);
  }
}

/* ================================================================
 * Public API
 * ================================================================ */

export const API = {
  /**
   * Configure the API URL.
   * @param {string} url - Google Apps Script deployment URL
   */
  configure(url) {
    _apiUrl = url;
    localStorage.setItem('sanforms:apiUrl', url);
    _cache.clear();
  },

  /** Check if API is configured */
  get configured() { return !!_apiUrl; },

  /**
   * Ping the backend to verify connectivity.
   */
  async ping() {
    return request('ping', {});
  },

  /* ---- Forms ---- */
  forms: {
    async list()              { return request('listForms', {}); },
    async get(id)             { return request('getForm', { id }); },
    async create(form)        { invalidateCache('listForms'); return request('createForm', { form }, 'POST'); },
    async update(id, data)    { invalidateCache('listForms'); invalidateCache(`getForm:{"id":"${id}"}`); return request('updateForm', { id, form: data }, 'POST'); },
    async delete(id)          { invalidateCache('listForms'); return request('deleteForm', { id }, 'POST'); },
    async duplicate(id)       { invalidateCache('listForms'); return request('duplicateForm', { id }, 'POST'); },
    async publish(id)         { invalidateCache('listForms'); return request('publishForm', { id }, 'POST'); },
  },

  /* ---- Responses ---- */
  responses: {
    async submit(formId, answers, meta = {}) {
      return request('submitResponse', { formId, answers, ...meta }, 'POST', { maxRetries: 5 });
    },
    async list(formId, page = 1, perPage = 100) {
      return request('getResponses', { formId, page, perPage });
    },
    async delete(formId, id) {
      invalidateCache(`getResponses:{"formId":"${formId}`);
      return request('deleteResponse', { formId, id }, 'POST');
    },
  },

  /* ---- Analytics ---- */
  analytics: {
    async get(formId) {
      return request('getAnalytics', { formId }, 'GET', { cacheSeconds: 60 });
    },
  },

  /* ---- Export ---- */
  export: {
    async csv(formId) {
      return request('exportCSV', { formId });
    },
  },
};

/* ================================================================
 * Utility
 * ================================================================ */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
