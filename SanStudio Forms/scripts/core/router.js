/**
 * SanStudio Forms — Client-side Router
 * ======================================
 * History API-based SPA router.
 * Supports named routes, params, query strings, guards, transitions.
 *
 * Usage:
 *   Router.define([
 *     { path: '/', component: 'dashboard', title: 'Dashboard' },
 *     { path: '/builder/:id', component: 'builder', title: 'Builder' },
 *   ]);
 *   Router.navigate('/builder/123');
 */

import { EventBus, Events } from './events.js';
import { AppStore }         from './store.js';

/** @type {Route[]} */
const routes = [];

/** @type {RouterGuard[]} */
const guards = [];

/** @type {string|null} */
let currentPath = null;

/**
 * @typedef {object} Route
 * @property {string} path       - URL path (supports :param and *)
 * @property {string} component  - Component/page identifier
 * @property {string} title      - Page title
 * @property {Function} [guard]  - Optional guard function
 * @property {boolean} [exact]   - Exact match required
 */

/**
 * @typedef {object} RouterGuard
 * @property {Function} fn       - (to, from) => boolean | string (redirect path)
 */

const Router = {
  /**
   * Define the route table.
   * @param {Route[]} routeConfig
   */
  define(routeConfig) {
    routes.length = 0;
    routeConfig.forEach(r => routes.push(r));
  },

  /**
   * Initialize the router (call once at app boot).
   */
  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this._handle(window.location.pathname + window.location.search);
    });

    // Intercept clicks on <a> tags
    document.addEventListener('click', e => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || anchor.target === '_blank') return;

      e.preventDefault();
      this.navigate(href);
    });

    // Handle current URL
    this._handle(window.location.pathname + window.location.search);
  },

  /**
   * Navigate to a path.
   * @param {string} path
   * @param {object} [options]
   * @param {boolean} [options.replace] - Use replaceState instead of pushState
   * @param {object} [options.state]    - History state
   */
  navigate(path, options = {}) {
    if (path === currentPath) return;

    const from = currentPath;

    // Run global guards
    for (const guard of guards) {
      const result = guard.fn(path, from);
      if (result === false) return;
      if (typeof result === 'string') {
        this.navigate(result, options);
        return;
      }
    }

    if (options.replace) {
      window.history.replaceState(options.state || {}, '', path);
    } else {
      window.history.pushState(options.state || {}, '', path);
    }

    this._handle(path);
  },

  /**
   * Replace current history entry.
   * @param {string} path
   */
  replace(path) {
    this.navigate(path, { replace: true });
  },

  /**
   * Go back in history.
   */
  back() {
    window.history.back();
  },

  /**
   * Get current route info.
   * @returns {{ route: Route|null, params: object, query: URLSearchParams }}
   */
  current() {
    const path = window.location.pathname;
    const query = new URLSearchParams(window.location.search);
    const { route, params } = this._match(path);
    return { route, params, query };
  },

  /**
   * Get a query param from the current URL.
   * @param {string} key
   * @returns {string|null}
   */
  query(key) {
    return new URLSearchParams(window.location.search).get(key);
  },

  /**
   * Add a global guard.
   * @param {Function} fn - (to, from) => boolean | string
   * @returns {Function} Remove function
   */
  addGuard(fn) {
    const guard = { fn };
    guards.push(guard);
    return () => {
      const i = guards.indexOf(guard);
      if (i > -1) guards.splice(i, 1);
    };
  },

  /* ---- Internal ---- */

  /**
   * Handle a path change.
   * @param {string} path
   */
  _handle(path) {
    // Strip query from path
    const [pathname, search] = path.split('?');
    const query = new URLSearchParams(search || '');

    const { route, params } = this._match(pathname);
    const previous = currentPath;
    currentPath = pathname;

    if (route) {
      // Update page title
      document.title = route.title
        ? `${route.title} — SanStudio Forms`
        : 'SanStudio Forms';

      // Update store
      AppStore.set('route', { path: pathname, component: route.component, params, query: Object.fromEntries(query) });

      // Emit navigation event
      EventBus.emit(Events.ROUTE_CHANGE, {
        to: { path: pathname, component: route.component, params, query },
        from: { path: previous },
      });
    } else {
      // 404 fallback
      AppStore.set('route', { path: pathname, component: 'not-found', params: {}, query: {} });
      document.title = '404 — SanStudio Forms';
    }
  },

  /**
   * Match a pathname against routes.
   * @param {string} pathname
   * @returns {{ route: Route|null, params: object }}
   */
  _match(pathname) {
    for (const route of routes) {
      const result = matchPath(route.path, pathname);
      if (result !== null) {
        return { route, params: result };
      }
    }
    return { route: null, params: {} };
  },
};

/**
 * Match a route pattern against a pathname.
 * Supports :param and * wildcards.
 * @param {string} pattern - Route pattern (e.g., '/builder/:id')
 * @param {string} pathname - Actual URL path
 * @returns {object|null} - Params object or null if no match
 */
function matchPath(pattern, pathname) {
  if (pattern === '*') return {};

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts    = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length && !pattern.endsWith('*')) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    const sp = pathParts[i];

    if (pp === '*') return params;
    if (pp.startsWith(':')) {
      params[pp.slice(1)] = decodeURIComponent(sp);
    } else if (pp !== sp) {
      return null;
    }
  }

  return params;
}

export { Router, matchPath };
