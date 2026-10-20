/**
 * SanStudio Forms — EventBus
 * ============================
 * Lightweight pub/sub event system for cross-module communication.
 */

/** @type {Map<string, Set<Function>>} */
const _listeners = new Map();

export const EventBus = {
  /**
   * Subscribe to an event.
   * @param {string} event
   * @param {Function} fn
   * @returns {Function} Unsubscribe function
   */
  on(event, fn) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event).add(fn);
    return () => this.off(event, fn);
  },

  /**
   * Subscribe to an event once.
   * @param {string} event
   * @param {Function} fn
   */
  once(event, fn) {
    const wrapper = (data) => { fn(data); this.off(event, wrapper); };
    return this.on(event, wrapper);
  },

  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} fn
   */
  off(event, fn) {
    _listeners.get(event)?.delete(fn);
  },

  /**
   * Emit an event.
   * @param {string} event
   * @param {*} data
   */
  emit(event, data) {
    _listeners.get(event)?.forEach(fn => {
      try { fn(data); } catch (e) { console.error(`[EventBus] Error in handler for ${event}:`, e); }
    });
  },

  /**
   * Remove all listeners for an event.
   * @param {string} event
   */
  clear(event) {
    if (event) _listeners.delete(event);
    else _listeners.clear();
  },
};

/** All system event names */
export const Events = {
  /* App lifecycle */
  APP_READY:         'app:ready',
  APP_ERROR:         'app:error',

  /* Auth */
  AUTH_LOGIN:        'auth:login',
  AUTH_LOGOUT:       'auth:logout',
  AUTH_CHANGED:      'auth:changed',

  /* Theme */
  THEME_CHANGED:     'theme:changed',

  /* Routing */
  ROUTE_CHANGE:      'route:change',

  /* Sidebar */
  SIDEBAR_TOGGLE:    'sidebar:toggle',
  SIDEBAR_COLLAPSED: 'sidebar:collapsed',

  /* Modals */
  MODAL_OPEN:        'modal:open',
  MODAL_CLOSE:       'modal:close',

  /* Command palette */
  COMMAND_OPEN:      'command:open',
  COMMAND_CLOSE:     'command:close',

  /* Search */
  SEARCH_OPEN:       'search:open',
  SEARCH_CLOSE:      'search:close',

  /* Toast */
  TOAST_SHOW:        'toast:show',

  /* Forms */
  FORM_CREATED:      'form:created',
  FORM_UPDATED:      'form:updated',
  FORM_DELETED:      'form:deleted',
  FORM_PUBLISHED:    'form:published',

  /* Builder */
  BUILDER_AUTOSAVED: 'builder:autosaved',
  BUILDER_QUESTION_ADDED: 'builder:question-added',
  BUILDER_QUESTION_DELETED: 'builder:question-deleted',

  /* Responses */
  RESPONSE_SUBMITTED: 'response:submitted',
  RESPONSE_DELETED:   'response:deleted',

  /* Sync */
  SYNC_COMPLETE:     'sync:complete',
  SYNC_ERROR:        'sync:error',
};
