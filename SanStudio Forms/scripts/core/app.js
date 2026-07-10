/**
 * SanStudio Forms — App Bootstrap
 * =================================
 * Entry point. Initializes all core systems, registers service worker,
 * sets up theme, loads user preferences, and mounts the UI.
 */

import { EventBus, Events }   from './events.js';
import { AppStore }            from './store.js';
import { initStorage, Prefs }  from './storage.js';
import { Router }              from './router.js';
import { API }                 from './api.js';

/* ================================================================
 * App initialization
 * ================================================================ */
const App = {
  /**
   * Boot the application.
   * Called once, on DOMContentLoaded.
   */
  async init() {
    try {
      // 1. Apply saved theme immediately (prevents flash)
      this._applyTheme(Prefs.theme.get());

      // 2. Initialize storage (IndexedDB)
      await initStorage();

      // 3. Load user preferences
      this._loadPreferences();

      // 4. Setup cursor glow effect
      this._initCursorGlow();

      // 5. Register service worker
      this._registerSW();

      // 6. Setup global event listeners
      this._setupGlobalListeners();

      // 7. Mark app as ready
      AppStore.set('app.ready', true);
      EventBus.emit(Events.APP_READY);

      // 8. Initialize the current page module
      await this._initPage();

      console.info('[App] Ready ✓');

    } catch (err) {
      console.error('[App] Boot error:', err);
      EventBus.emit(Events.APP_ERROR, { error: err.message });
    }
  },

  /**
   * Determine which page we're on and initialize it.
   */
  async _initPage() {
    const page = document.body.dataset.page;
    if (!page) return;

    const pageModules = {
      dashboard:  () => import('../pages/dashboard.js'),
      builder:    () => import('../pages/builder.js'),
      form:       () => import('../pages/form.js'),
      responses:  () => import('../pages/responses.js'),
      analytics:  () => import('../pages/analytics.js'),
      settings:   () => import('../pages/settings.js'),
    };

    if (pageModules[page]) {
      const mod = await pageModules[page]();
      if (mod.init) await mod.init();
    }
  },

  /**
   * Apply a theme by setting data-theme on <html>.
   * @param {string} theme
   */
  _applyTheme(theme) {
    const validThemes = ['light', 'dark', 'glassmorphism', 'neumorphism', 'cyberpunk', 'aurora', 'luxury'];
    const t = validThemes.includes(theme) ? theme : 'light';
    document.documentElement.dataset.theme = t;
    AppStore.set('app.theme', t);
    Prefs.theme.set(t);
    EventBus.emit(Events.THEME_CHANGED, { theme: t });
  },

  /**
   * Load all user preferences from storage.
   */
  _loadPreferences() {
    const theme   = Prefs.theme.get();
    const sidebar = Prefs.sidebar.get();
    const apiUrl  = Prefs.apiUrl.get();
    const user    = Prefs.user.get();

    this._applyTheme(theme);

    if (sidebar) {
      AppStore.set('app.sidebarCollapsed', true);
      document.querySelector('.app-shell')?.classList.add('sidebar-collapsed');
      document.querySelector('.sidebar')?.classList.add('sidebar-collapsed');
    }

    if (apiUrl) {
      API.configure(apiUrl);
    }

    if (user && user.displayName) {
      AppStore.set('user', user);
    }
  },

  /**
   * Initialize cursor glow effect.
   */
  _initCursorGlow() {
    const glowEl = document.querySelector('.cursor-glow');
    if (!glowEl) return;

    let ticking = false;
    document.addEventListener('mousemove', e => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        glowEl.style.left = `${e.clientX}px`;
        glowEl.style.top  = `${e.clientY}px`;
        ticking = false;
      });
    }, { passive: true });
  },

  /**
   * Register the PWA service worker.
   */
  _registerSW() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.info('[SW] Registered:', reg.scope);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              EventBus.emit(Events.TOAST_SHOW, {
                title: 'Update available',
                message: 'A new version of SanStudio Forms is ready.',
                type: 'info',
                duration: 0,
                action: {
                  label: 'Refresh',
                  fn: () => window.location.reload(),
                },
              });
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Registration failed:', err));

    // Handle offline/online transitions
    window.addEventListener('online', () => {
      EventBus.emit(Events.TOAST_SHOW, {
        title: 'Back online',
        message: 'Your connection has been restored.',
        type: 'success',
        duration: 3000,
      });
      // Trigger background sync
      navigator.serviceWorker.ready.then(reg => {
        reg.sync?.register('sync-responses').catch(() => {});
      });
    });

    window.addEventListener('offline', () => {
      EventBus.emit(Events.TOAST_SHOW, {
        title: 'You\'re offline',
        message: 'Changes will be saved locally and synced when reconnected.',
        type: 'warning',
        duration: 5000,
      });
    });
  },

  /**
   * Setup global event listeners.
   */
  _setupGlobalListeners() {
    // Theme change listener
    EventBus.on(Events.THEME_CHANGED, ({ theme }) => {
      document.documentElement.dataset.theme = theme;
      Prefs.theme.set(theme);
    });

    // Sidebar toggle
    EventBus.on(Events.SIDEBAR_TOGGLE, () => {
      const collapsed = AppStore.get('app.sidebarCollapsed');
      const newState  = !collapsed;
      AppStore.set('app.sidebarCollapsed', newState);
      Prefs.sidebar.set(newState);

      document.querySelector('.app-shell')?.classList.toggle('sidebar-collapsed', newState);
      document.querySelector('.sidebar')?.classList.toggle('sidebar-collapsed', newState);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', this._handleKeyboard.bind(this));

    // Button ripple effects
    document.addEventListener('click', this._createRipple.bind(this), { passive: true });

    // Context menu prevention on non-input elements (optional, preserves default)
    // document.addEventListener('contextmenu', e => { ... });

    // Prevent form default submission (all forms go through JS)
    document.addEventListener('submit', e => {
      if (!e.target.dataset.allowDefault) {
        e.preventDefault();
      }
    });
  },

  /**
   * Global keyboard shortcut handler.
   * @param {KeyboardEvent} e
   */
  _handleKeyboard(e) {
    const tag = e.target.tagName;
    const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable;

    // ⌘K / Ctrl+K — Command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      EventBus.emit(Events.COMMAND_OPEN);
      return;
    }

    // ⌘/ — Search
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      EventBus.emit(Events.SEARCH_OPEN);
      return;
    }

    if (isEditing) return;

    // Escape
    if (e.key === 'Escape') {
      EventBus.emit(Events.MODAL_CLOSE);
      EventBus.emit(Events.COMMAND_CLOSE);
      EventBus.emit(Events.SEARCH_CLOSE);
      return;
    }

    // ? — Keyboard shortcuts help
    if (e.key === '?') {
      EventBus.emit(Events.MODAL_OPEN, { id: 'keyboard-shortcuts' });
    }
  },

  /**
   * Create a material ripple on button click.
   * @param {MouseEvent} e
   */
  _createRipple(e) {
    const btn = e.target.closest('.btn');
    if (!btn || btn.classList.contains('btn-ghost')) return;

    const rect   = btn.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height) * 2;
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-wave';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;

    btn.classList.add('ripple-container');
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  },
};

/* ================================================================
 * Boot on DOM ready
 * ================================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

export { App };
