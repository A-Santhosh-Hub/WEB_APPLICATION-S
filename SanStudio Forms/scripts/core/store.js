/**
 * SanStudio Forms — Global Application Store
 * ============================================
 * Reactive, proxy-based state container.
 * Emits change events automatically via EventBus.
 */

import { EventBus } from './events.js';

/* ================================================================
 * Initial State
 * ================================================================ */

const INITIAL_STATE = {
  app: {
    ready:           false,
    theme:           'light',
    sidebarCollapsed:false,
    online:          navigator.onLine,
  },
  user:    null,
  route:   { path: '/', component: 'dashboard', params: {}, query: {} },
  forms:   [],
  activeForm: null,
  responses: [],
};

/* ================================================================
 * Deep clone utility
 * ================================================================ */

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}

/* ================================================================
 * Store
 * ================================================================ */

class Store {
  constructor(initial) {
    this._state = deepClone(initial);
    this._listeners = new Map();
  }

  /**
   * Get a value by dot-path key.
   * @param {string} key - e.g. 'app.theme' or 'forms'
   */
  get(key) {
    if (!key) return deepClone(this._state);
    return key.split('.').reduce((obj, k) => obj?.[k], this._state);
  }

  /**
   * Set a value by dot-path key.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    const parts = key.split('.');
    let obj     = this._state;

    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof obj[parts[i]] !== 'object' || obj[parts[i]] === null) {
        obj[parts[i]] = {};
      }
      obj = obj[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    const old     = obj[lastKey];
    obj[lastKey]  = value;

    // Emit change
    const event = `store:${key}`;
    EventBus.emit(event, { key, value, old });
    EventBus.emit('store:change', { key, value, old });
  }

  /**
   * Subscribe to a specific key change.
   * @param {string} key
   * @param {Function} fn - (value, oldValue) => void
   * @returns {Function} Unsubscribe
   */
  watch(key, fn) {
    return EventBus.on(`store:${key}`, ({ value, old }) => fn(value, old));
  }

  /**
   * Merge an object into a path.
   * @param {string} key
   * @param {object} updates
   */
  merge(key, updates) {
    const current = this.get(key) || {};
    this.set(key, { ...current, ...updates });
  }

  /**
   * Reset the store to initial state.
   */
  reset() {
    this._state = deepClone(INITIAL_STATE);
    EventBus.emit('store:reset');
  }

  /**
   * Get the full state (for debugging).
   */
  getState() {
    return deepClone(this._state);
  }
}

export const AppStore = new Store(INITIAL_STATE);

// Sync online status
window.addEventListener('online',  () => AppStore.set('app.online', true));
window.addEventListener('offline', () => AppStore.set('app.online', false));
