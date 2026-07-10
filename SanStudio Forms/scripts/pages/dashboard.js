/**
 * SanStudio Forms — Dashboard JavaScript
 * =========================================
 * Handles: form listing, CRUD, search, sorting,
 * command palette, theme switching, modals.
 */

import { API }                from '../core/api.js';
import { AppStore }           from '../core/store.js';
import { EventBus, Events }   from '../core/events.js';
import { Toast }              from '../components/toast.js';
import { FormStorage }        from '../core/storage.js';
import { escapeHtml, truncate } from '../utils/sanitizer.js';

/* ================================================================
 * State
 * ================================================================ */
let allForms     = [];
let activeFilter = 'all';
let activeSort   = 'updatedAt';
let viewMode     = 'grid';
let contextFormId = null;

/* ================================================================
 * Init
 * ================================================================ */
export async function init() {
  setupSidebar();
  setupThemeToggle();
  setupDropdowns();
  setupModals();
  setupCommandPalette();
  setupContextMenu();
  setupFilterTabs();
  setupImport();

  await loadForms();
  checkApiSetup();
}

/* ================================================================
 * Load Forms
 * ================================================================ */
async function loadForms() {
  showSkeletons();

  // Try API first (if configured)
  const apiUrl = localStorage.getItem('sanforms:apiUrl');
  let forms = [];

  if (apiUrl) {
    const result = await API.forms.list();
    if (result.ok && result.data) {
      forms = result.data;
      // Sync to local storage
      for (const f of forms) {
        await FormStorage.save(f);
      }
    } else {
      // Fall back to local storage
      forms = await FormStorage.loadAll();
    }
  } else {
    // Load from local cache
    forms = await FormStorage.loadAll();
  }

  allForms = forms.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  AppStore.set('forms', allForms);

  renderForms(getFilteredForms());
  updateStats();
}

/* ================================================================
 * Render
 * ================================================================ */
function renderForms(forms) {
  const grid = document.getElementById('forms-grid');
  const empty = document.getElementById('empty-state');

  grid.innerHTML = '';

  if (forms.length === 0) {
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';

  forms.forEach((form, i) => {
    const card = createFormCard(form);
    card.style.animationDelay = `${i * 50}ms`;
    grid.appendChild(card);
  });
}

/**
 * Create a form card DOM element.
 * @param {object} form
 * @returns {HTMLElement}
 */
function createFormCard(form) {
  const div = document.createElement('div');
  div.className = `form-card${form.pinned ? ' is-pinned' : ''} animate-fade-up`;
  div.dataset.formId = form.id;

  const bannerClass = getBannerClass(form.color || 'purple');
  const date = formatRelativeTime(form.updatedAt);
  const status = form.status || 'draft';

  div.innerHTML = `
    <div class="form-card-banner ${bannerClass}">
      <div class="form-card-banner-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
          <path d="M9 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9l-7-7z"/>
          <path d="M9 2v7h7"/>
          <path d="M7 13h10M7 17h6"/>
        </svg>
      </div>
    </div>
    <div class="form-card-body">
      <div class="form-card-title">${escapeHtml(form.title || 'Untitled Form')}</div>
      <div class="form-card-meta">
        <span class="form-card-meta-item">
          <span class="status-dot status-dot-${status === 'published' ? 'active' : status === 'draft' ? 'draft' : 'closed'}"></span>
          ${status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        <span class="form-card-meta-item">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          ${date}
        </span>
        <span class="form-card-meta-item">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 2h7M12 2v4M5 7h14l-1.5 13H6.5L5 7z"/></svg>
          ${form.questionCount || 0} Q's
        </span>
      </div>
    </div>
    <div class="form-card-footer">
      <div class="form-card-stats">
        <div class="form-card-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          <span class="form-card-stat-value">${form.responseCount || 0}</span>
          <span>responses</span>
        </div>
        ${form.completionRate !== undefined ? `
        <div class="form-card-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span class="form-card-stat-value">${form.completionRate}%</span>
          <span>completion</span>
        </div>` : ''}
      </div>
      <div class="form-card-actions">
        <button class="form-card-action-btn" data-tooltip="Edit" data-action="edit" aria-label="Edit form">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="form-card-action-btn" data-tooltip="Responses" data-action="responses" aria-label="View responses">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </button>
        <button class="form-card-action-btn" data-tooltip="Share" data-action="share" aria-label="Share form">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        <button class="form-card-action-btn" data-tooltip="More options" data-action="menu" aria-label="More options">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
      </div>
    </div>
  `;

  // Click handlers
  div.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action) {
      e.stopPropagation();
      handleCardAction(action, form);
    } else {
      // Open form in builder
      window.location.href = `builder.html?id=${form.id}`;
    }
  });

  div.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, form.id);
  });

  return div;
}

function handleCardAction(action, form) {
  switch (action) {
    case 'edit':
      window.location.href = `builder.html?id=${form.id}`;
      break;
    case 'responses':
      window.location.href = `responses.html?formId=${form.id}`;
      break;
    case 'share':
      openShareModal(form);
      break;
    case 'menu':
      // find the button that was clicked and position context menu near it
      showContextMenuForForm(form.id);
      break;
  }
}

/* ================================================================
 * Stats
 * ================================================================ */
function updateStats() {
  const total       = allForms.length;
  const active      = allForms.filter(f => f.status === 'published').length;
  const responses   = allForms.reduce((sum, f) => sum + (f.responseCount || 0), 0);
  const completion  = allForms.length > 0
    ? Math.round(allForms.reduce((sum, f) => sum + (f.completionRate || 0), 0) / allForms.length)
    : 0;

  animateCounter('stat-total',      total);
  animateCounter('stat-active',     active);
  animateCounter('stat-responses',  responses);
  document.getElementById('stat-completion').textContent = total ? `${completion}%` : '—';
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 800;
  const start    = Date.now();
  const from     = 0;

  if (target === 0) { el.textContent = '0'; return; }

  function step() {
    const elapsed  = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (target - from) * ease).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ================================================================
 * Filter & Sort
 * ================================================================ */
function setupFilterTabs() {
  document.getElementById('filter-tabs').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;

    document.querySelectorAll('#filter-tabs .tab-item').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    activeFilter = btn.dataset.filter;
    renderForms(getFilteredForms());
  });
}

function getFilteredForms() {
  let forms = [...allForms];

  // Filter
  if (activeFilter !== 'all') {
    if (activeFilter === 'pinned')     forms = forms.filter(f => f.pinned);
    else if (activeFilter === 'published') forms = forms.filter(f => f.status === 'published');
    else if (activeFilter === 'draft') forms = forms.filter(f => f.status === 'draft' || !f.status);
  }

  // Sort
  forms.sort((a, b) => {
    switch (activeSort) {
      case 'title':     return (a.title || '').localeCompare(b.title || '');
      case 'createdAt': return (b.createdAt || 0) - (a.createdAt || 0);
      case 'responses': return (b.responseCount || 0) - (a.responseCount || 0);
      default:          return (b.updatedAt || 0) - (a.updatedAt || 0);
    }
  });

  return forms;
}

/* ================================================================
 * Sidebar Toggle
 * ================================================================ */
function setupSidebar() {
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    EventBus.emit(Events.SIDEBAR_TOGGLE);
  });
}

/* ================================================================
 * Theme Toggle
 * ================================================================ */
function setupThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const lightIcon = btn?.querySelector('.theme-icon-light');
  const darkIcon  = btn?.querySelector('.theme-icon-dark');

  function updateIcons(theme) {
    const isDark = theme === 'dark' || theme === 'glassmorphism' || theme === 'cyberpunk' || theme === 'aurora' || theme === 'luxury';
    lightIcon.style.display = isDark ? 'none' : 'block';
    darkIcon.style.display  = isDark ? 'block' : 'none';
  }

  const currentTheme = document.documentElement.dataset.theme || 'light';
  updateIcons(currentTheme);

  btn?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'light';
    const next    = current === 'light' ? 'dark' : 'light';
    EventBus.emit(Events.THEME_CHANGED, { theme: next });
    updateIcons(next);
  });
}

/* ================================================================
 * Dropdowns
 * ================================================================ */
function setupDropdowns() {
  // Sort dropdown
  const sortBtn      = document.getElementById('sort-btn');
  const sortDropdown = document.getElementById('sort-dropdown');

  sortBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = sortDropdown.hidden;
    closeAllDropdowns();
    sortDropdown.hidden = !hidden;
    sortBtn.setAttribute('aria-expanded', String(!hidden));
  });

  sortDropdown?.querySelectorAll('.sort-option').forEach(option => {
    option.addEventListener('click', () => {
      sortDropdown.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      activeSort = option.dataset.sort;
      renderForms(getFilteredForms());
      sortDropdown.hidden = true;
    });
  });

  sortDropdown?.querySelectorAll('.view-option').forEach(option => {
    option.addEventListener('click', () => {
      viewMode = option.dataset.view;
      const grid = document.getElementById('forms-grid');
      grid.className = `forms-grid view-${viewMode}`;
      sortDropdown.hidden = true;
    });
  });

  // User dropdown
  const userBtn      = document.getElementById('user-avatar-btn');
  const userDropdown = document.getElementById('user-dropdown');

  userBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const hidden = userDropdown.hidden;
    closeAllDropdowns();
    userDropdown.hidden = !hidden;
    userBtn.setAttribute('aria-expanded', String(!hidden));
  });

  // Close on outside click
  document.addEventListener('click', closeAllDropdowns);
}

function closeAllDropdowns() {
  document.getElementById('sort-dropdown').hidden = true;
  document.getElementById('user-dropdown').hidden = true;
}

/* ================================================================
 * Modals
 * ================================================================ */
function setupModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Close on button click
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });

  // Delete confirm
  document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
    const id = document.getElementById('delete-modal').dataset.targetId;
    if (!id) return;

    const result = await API.forms.delete(id);
    if (result.ok || result.queued) {
      allForms = allForms.filter(f => f.id !== id);
      renderForms(getFilteredForms());
      updateStats();
      Toast.success('Moved to trash', 'Form has been moved to trash.');
    } else {
      Toast.error('Failed to delete', result.error);
    }
    closeModal('delete-modal');
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.hidden = false;
    el.querySelector('[data-modal-close], .modal-close')?.focus();
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

function openShareModal(form) {
  const modal = document.getElementById('share-modal');
  const content = document.getElementById('share-modal-content');

  const publicUrl = `${window.location.origin}/form.html?id=${form.id}`;

  content.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title" id="share-modal-title">Share "${escapeHtml(truncate(form.title || 'Untitled', 30))}"</h2>
      <button class="modal-close" data-modal-close="share-modal" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="modal-body" style="display:flex; flex-direction:column; gap: var(--space-5);">
      <!-- Form URL -->
      <div class="form-group" style="margin:0">
        <label>Public Form URL</label>
        <div class="input-group">
          <input class="input" value="${escapeHtml(publicUrl)}" readonly id="share-url-input">
          <button class="btn btn-secondary btn-sm" style="position:absolute;right:var(--space-2);top:50%;transform:translateY(-50%)" id="copy-url-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            Copy
          </button>
        </div>
      </div>

      <!-- Status -->
      <div style="display:flex; align-items:center; justify-content:space-between; padding: var(--space-3) var(--space-4); background: var(--bg-surface-2); border-radius: var(--radius-xl);">
        <div>
          <div style="font-size: var(--text-sm); font-weight: var(--weight-medium);">Form Status</div>
          <div style="font-size: var(--text-xs); color: var(--text-tertiary);">Control who can submit responses</div>
        </div>
        <div style="display:flex; gap: var(--space-2);">
          <button class="btn btn-sm ${form.status === 'published' ? 'btn-primary' : 'btn-secondary'}" id="publish-btn">
            ${form.status === 'published' ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

      <!-- Social share -->
      <div>
        <div class="label" style="margin-bottom: var(--space-3)">Share via</div>
        <div style="display:flex; gap: var(--space-2);">
          <a href="https://wa.me/?text=${encodeURIComponent('Fill out my form: ' + publicUrl)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
            WhatsApp
          </a>
          <a href="https://t.me/share/url?url=${encodeURIComponent(publicUrl)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
            Telegram
          </a>
          <a href="mailto:?subject=${encodeURIComponent('Form: ' + (form.title || 'Untitled'))}&body=${encodeURIComponent('Please fill out this form: ' + publicUrl)}" class="btn btn-secondary btn-sm">
            Email
          </a>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-modal-close="share-modal">Close</button>
    </div>
  `;

  // Re-bind close buttons
  content.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });

  // Copy URL
  content.querySelector('#copy-url-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      Toast.success('Copied!', 'Form URL copied to clipboard.');
    } catch {
      document.getElementById('share-url-input').select();
      document.execCommand('copy');
      Toast.success('Copied!');
    }
  });

  openModal('share-modal');
}

/* ================================================================
 * Context Menu
 * ================================================================ */
function setupContextMenu() {
  const menu = document.getElementById('context-menu');

  document.addEventListener('click', () => menu.hidden = true);

  document.getElementById('ctx-open')?.addEventListener('click', () => {
    if (contextFormId) window.open(`form.html?id=${contextFormId}`, '_blank');
    menu.hidden = true;
  });
  document.getElementById('ctx-edit')?.addEventListener('click', () => {
    if (contextFormId) window.location.href = `builder.html?id=${contextFormId}`;
    menu.hidden = true;
  });
  document.getElementById('ctx-responses')?.addEventListener('click', () => {
    if (contextFormId) window.location.href = `responses.html?formId=${contextFormId}`;
    menu.hidden = true;
  });
  document.getElementById('ctx-share')?.addEventListener('click', () => {
    if (contextFormId) {
      const form = allForms.find(f => f.id === contextFormId);
      if (form) openShareModal(form);
    }
    menu.hidden = true;
  });
  document.getElementById('ctx-pin')?.addEventListener('click', async () => {
    if (contextFormId) await togglePin(contextFormId);
    menu.hidden = true;
  });
  document.getElementById('ctx-duplicate')?.addEventListener('click', async () => {
    if (contextFormId) await duplicateForm(contextFormId);
    menu.hidden = true;
  });
  document.getElementById('ctx-export')?.addEventListener('click', () => {
    if (contextFormId) exportForm(contextFormId);
    menu.hidden = true;
  });
  document.getElementById('ctx-delete')?.addEventListener('click', () => {
    if (contextFormId) {
      document.getElementById('delete-modal').dataset.targetId = contextFormId;
      openModal('delete-modal');
    }
    menu.hidden = true;
  });
}

function showContextMenu(x, y, formId) {
  contextFormId = formId;
  const menu    = document.getElementById('context-menu');
  menu.hidden   = false;

  // Position menu
  const { innerWidth, innerHeight } = window;
  const menuRect = menu.getBoundingClientRect();
  let left = x, top = y;
  if (x + 200 > innerWidth)  left = x - 200;
  if (y + 300 > innerHeight) top  = y - menuRect.height;

  menu.style.left = `${left}px`;
  menu.style.top  = `${top}px`;

  // Update pin label
  const form = allForms.find(f => f.id === formId);
  const pinBtn = document.getElementById('ctx-pin');
  if (pinBtn) pinBtn.textContent = form?.pinned ? 'Unpin' : 'Pin';
}

function showContextMenuForForm(formId) {
  const card = document.querySelector(`[data-form-id="${formId}"]`);
  if (!card) return;
  const rect = card.getBoundingClientRect();
  showContextMenu(rect.right - 200, rect.top + 60, formId);
}

/* ================================================================
 * Actions
 * ================================================================ */
async function togglePin(formId) {
  const form = allForms.find(f => f.id === formId);
  if (!form) return;

  form.pinned = !form.pinned;
  form.updatedAt = Date.now();
  await FormStorage.save(form);
  await API.forms.update(formId, { pinned: form.pinned });
  renderForms(getFilteredForms());
  Toast.info(form.pinned ? 'Pinned' : 'Unpinned');
}

async function duplicateForm(formId) {
  const dismiss = Toast.loading('Duplicating form...');
  const result  = await API.forms.duplicate(formId);
  dismiss();

  if (result.ok && result.data) {
    allForms.unshift(result.data);
    await FormStorage.save(result.data);
    renderForms(getFilteredForms());
    updateStats();
    Toast.success('Duplicated!', 'Form has been duplicated.');
  } else {
    // Local duplicate fallback
    const original = allForms.find(f => f.id === formId);
    if (original) {
      const copy = {
        ...JSON.parse(JSON.stringify(original)),
        id: generateId(),
        title: `${original.title || 'Untitled'} (copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'draft',
        responseCount: 0,
      };
      allForms.unshift(copy);
      await FormStorage.save(copy);
      renderForms(getFilteredForms());
      updateStats();
      Toast.success('Duplicated!', 'Form duplicated locally.');
    }
  }
}

function exportForm(formId) {
  const form = allForms.find(f => f.id === formId);
  if (!form) return;

  const json = JSON.stringify(form, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${(form.title || 'form').replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
  Toast.success('Exported!', 'Form exported as JSON.');
}

/* ================================================================
 * Command Palette
 * ================================================================ */
function setupCommandPalette() {
  const overlay  = document.getElementById('command-overlay');
  const input    = document.getElementById('command-input');
  const list     = document.getElementById('command-list');

  const COMMANDS = [
    { label: 'New Form',           icon: '+',   shortcut: 'N',  fn: () => window.location.href = 'builder.html' },
    { label: 'Dashboard',          icon: '⊞',   shortcut: 'D',  fn: () => window.location.href = 'index.html' },
    { label: 'View Responses',     icon: '◎',   shortcut: 'R',  fn: () => window.location.href = 'responses.html' },
    { label: 'Analytics',          icon: '↗',   shortcut: 'A',  fn: () => window.location.href = 'analytics.html' },
    { label: 'Settings',           icon: '⚙',   shortcut: 'S',  fn: () => window.location.href = 'settings.html' },
    { label: 'Toggle Dark Mode',   icon: '◑',   shortcut: '',   fn: () => document.getElementById('theme-toggle')?.click() },
    { label: 'Import Form',        icon: '↑',   shortcut: '',   fn: () => openModal('import-modal') },
    { label: 'Keyboard Shortcuts', icon: '⌨',   shortcut: '?',  fn: () => {} },
    { label: 'Visit SanStudio',    icon: '↗',   shortcut: '',   fn: () => window.open('https://sanstudio-hub.github.io/in/', '_blank') },
  ];

  let focusedIndex = -1;

  function open() {
    overlay.hidden = false;
    input.value   = '';
    renderCommands('');
    input.focus();
  }

  function close() {
    overlay.hidden = true;
    focusedIndex   = -1;
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  function renderCommands(query) {
    const q = query.toLowerCase().trim();
    
    // Filter commands
    const filteredCommands = q
      ? COMMANDS.filter(c => c.label.toLowerCase().includes(q))
      : COMMANDS;

    // Filter forms (only if a query is typed, or show a few recents)
    const filteredForms = q
      ? allForms.filter(f => (f.title || 'Untitled Form').toLowerCase().includes(q))
      : allForms.slice(0, 3);

    if (filteredCommands.length === 0 && filteredForms.length === 0) {
      list.innerHTML = '<div class="command-group-label" style="padding: var(--space-4); text-align: center; color: var(--text-tertiary);">No results found</div>';
      return;
    }

    let html = '';

    if (filteredCommands.length > 0) {
      html += `<div class="command-group-label">Commands</div>`;
      html += filteredCommands.map((cmd, i) => `
        <div class="command-item" role="option" data-type="command" data-index="${i}">
          <div class="command-item-icon">${escapeHtml(cmd.icon)}</div>
          <span class="command-item-label">${escapeHtml(cmd.label)}</span>
          ${cmd.shortcut ? `<span class="command-item-shortcut">${escapeHtml(cmd.shortcut)}</span>` : ''}
        </div>
      `).join('');
    }

    if (filteredForms.length > 0) {
      html += `<div class="command-group-label">${q ? 'Forms' : 'Recent Forms'}</div>`;
      html += filteredForms.map((form, i) => `
        <div class="command-item" role="option" data-type="form" data-id="${escapeHtml(form.id)}" data-index="${i + filteredCommands.length}">
          <div class="command-item-icon" style="background: var(--brand-gradient-soft);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9l-7-7z"/><path d="M9 2v7h7"/></svg>
          </div>
          <span class="command-item-label">${escapeHtml(form.title || 'Untitled Form')}</span>
          <span class="command-item-shortcut" style="text-transform: capitalize;">${escapeHtml(form.status || 'draft')}</span>
        </div>
      `).join('');
    }

    list.innerHTML = html;

    list.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.type === 'command') {
          filteredCommands[parseInt(item.dataset.index)].fn();
        } else if (item.dataset.type === 'form') {
          window.location.href = \`builder.html?id=\${item.dataset.id}\`;
        }
        close();
      });
      item.addEventListener('mouseenter', () => {
        list.querySelectorAll('.command-item').forEach(i => i.classList.remove('focused'));
        item.classList.add('focused');
        focusedIndex = parseInt(item.dataset.index);
      });
    });
  }

  input.addEventListener('input', () => renderCommands(input.value));

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    const items = list.querySelectorAll('.command-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusedIndex = Math.max(focusedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0) items[focusedIndex]?.click();
      return;
    }
    items.forEach((item, i) => item.classList.toggle('focused', i === focusedIndex));
    items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.getElementById('command-trigger')?.addEventListener('click', open);

  EventBus.on(Events.COMMAND_OPEN, open);
  EventBus.on(Events.COMMAND_CLOSE, close);
}

/* ================================================================
 * Import
 * ================================================================ */
function setupImport() {
  document.getElementById('import-btn')?.addEventListener('click', () => openModal('import-modal'));

  const dropZone = document.getElementById('import-drop-zone');
  const fileInput = document.getElementById('import-file-input');

  dropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

  dropZone?.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file) processImportFile(file);
  });

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) processImportFile(file);
  });
}

async function processImportFile(file) {
  if (!file.name.endsWith('.json')) {
    Toast.error('Invalid file', 'Please upload a JSON file.');
    return;
  }

  try {
    const text = await file.text();
    const form = JSON.parse(text);

    if (!form.id || !form.title) {
      Toast.error('Invalid format', 'This file does not appear to be a valid SanStudio Forms export.');
      return;
    }

    form.id        = generateId();
    form.createdAt = Date.now();
    form.updatedAt = Date.now();
    form.status    = 'draft';

    await FormStorage.save(form);

    // Try to push to API
    const result = await API.forms.create(form);
    if (result.ok && result.data) {
      form.id = result.data.id || form.id;
    }

    allForms.unshift(form);
    renderForms(getFilteredForms());
    updateStats();
    closeModal('import-modal');
    Toast.success('Imported!', `"${form.title}" has been imported.`);
  } catch (e) {
    Toast.error('Import failed', 'Could not parse the file. Make sure it is valid JSON.');
  }
}

/* ================================================================
 * API Setup Check
 * ================================================================ */
function checkApiSetup() {
  const apiUrl = localStorage.getItem('sanforms:apiUrl');
  const banner = document.getElementById('setup-banner');
  const dismissed = sessionStorage.getItem('sanforms:banner-dismissed');

  if (!apiUrl && !dismissed && banner) {
    banner.style.display = 'flex';
  }

  document.getElementById('dismiss-banner')?.addEventListener('click', () => {
    if (banner) banner.style.display = 'none';
    sessionStorage.setItem('sanforms:banner-dismissed', '1');
  });
}

/* ================================================================
 * Skeleton loading
 * ================================================================ */
function showSkeletons() {
  const grid = document.getElementById('forms-grid');
  grid.innerHTML = Array(6).fill('').map((_, i) =>
    `<div class="form-card skeleton-card animate-shimmer" aria-hidden="true" style="animation-delay:${i*80}ms;height:200px"></div>`
  ).join('');
  document.getElementById('empty-state').style.display = 'none';
}

/* ================================================================
 * Utilities
 * ================================================================ */

const BANNER_COLORS = [
  'form-banner-purple', 'form-banner-blue', 'form-banner-green',
  'form-banner-orange', 'form-banner-rose', 'form-banner-pink',
  'form-banner-teal',   'form-banner-indigo', 'form-banner-amber',
];

function getBannerClass(color) {
  const colorMap = {
    purple: 'form-banner-purple', blue: 'form-banner-blue',
    green: 'form-banner-green',   orange: 'form-banner-orange',
    rose: 'form-banner-rose',     pink: 'form-banner-pink',
    teal: 'form-banner-teal',     indigo: 'form-banner-indigo',
    amber: 'form-banner-amber',
  };
  return colorMap[color] || 'form-banner-purple';
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never';
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);

  if (seconds < 60)  return 'Just now';
  if (minutes < 60)  return `${minutes}m ago`;
  if (hours < 24)    return `${hours}h ago`;
  if (days < 7)      return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function generateId() {
  return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
