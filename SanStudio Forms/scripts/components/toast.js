/**
 * SanStudio Forms — Toast Notifications
 * =======================================
 * Elegant toast system with types, auto-dismiss, actions.
 *
 * Usage:
 *   Toast.show({ title: 'Saved!', type: 'success' })
 *   Toast.error('Something went wrong')
 *   Toast.success('Form published')
 *   Toast.info('Autosaved 3s ago')
 */

import { EventBus, Events } from '../core/events.js';

const ICONS = {
  success: `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
  </svg>`,
  error: `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
  </svg>`,
  warning: `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
  </svg>`,
  info: `<svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
  </svg>`,
};

const CLOSE_ICON = `<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
</svg>`;

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * @typedef {object} ToastOptions
 * @property {string} [title]      - Toast title
 * @property {string} [message]    - Toast message (optional)
 * @property {'success'|'error'|'warning'|'info'} [type='info']
 * @property {number} [duration=4000] - Auto-dismiss in ms (0 = persistent)
 * @property {{ label: string, fn: Function }} [action] - Action button
 * @property {Function} [onDismiss] - Callback when dismissed
 */

export const Toast = {
  /**
   * Show a toast notification.
   * @param {ToastOptions} options
   * @returns {Function} Dismiss function
   */
  show({
    title    = '',
    message  = '',
    type     = 'info',
    duration = 4000,
    action   = null,
    onDismiss = null,
  } = {}) {
    const c = getContainer();

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'alert');

    el.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <div class="toast-content">
        ${title   ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
        ${action  ? `<button class="toast-action btn btn-sm btn-ghost" style="margin-top:6px;padding:0;height:auto;font-size:var(--text-xs);color:var(--brand-primary)">${escapeHtml(action.label)}</button>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss notification">${CLOSE_ICON}</button>
    `;

    // Action handler
    if (action) {
      el.querySelector('.toast-action').addEventListener('click', () => {
        action.fn();
        dismiss();
      });
    }

    // Close handler
    el.querySelector('.toast-close').addEventListener('click', dismiss);

    c.appendChild(el);

    // Auto-dismiss
    let timeoutId;
    if (duration > 0) {
      timeoutId = setTimeout(dismiss, duration);
    }

    function dismiss() {
      clearTimeout(timeoutId);
      el.classList.add('toast-exit');
      el.addEventListener('animationend', () => {
        el.remove();
        onDismiss?.();
      }, { once: true });
    }

    return dismiss;
  },

  success(title, message, options = {}) {
    return this.show({ title, message, type: 'success', ...options });
  },

  error(title, message, options = {}) {
    return this.show({ title, message, type: 'error', duration: 6000, ...options });
  },

  warning(title, message, options = {}) {
    return this.show({ title, message, type: 'warning', ...options });
  },

  info(title, message, options = {}) {
    return this.show({ title, message, type: 'info', ...options });
  },

  /**
   * Show a loading toast (persistent until dismissed).
   * @param {string} title
   * @returns {Function} Dismiss function
   */
  loading(title) {
    return this.show({
      title,
      type: 'info',
      duration: 0,
      message: '',
    });
  },
};

/** Escape HTML to prevent XSS in toast content */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Subscribe to global toast events
EventBus.on(Events.TOAST_SHOW, (opts) => Toast.show(opts));
