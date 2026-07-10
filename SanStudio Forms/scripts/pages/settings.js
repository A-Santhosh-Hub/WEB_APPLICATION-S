/**
 * SanStudio Forms — Settings Page Logic
 * =======================================
 */

import { API }           from '../core/api.js';
import { FormStorage, ResponseStorage, SettingsStorage, Prefs, initStorage, DataExport } from '../core/storage.js';
import { AppStore }      from '../core/store.js';
import { Toast }         from '../components/toast.js';

/* ================================================================
 * Init
 * ================================================================ */
export async function init() {
  setupNavigation();
  setupConnectionSettings();
  setupAppearanceSettings();
  setupAccountSettings();
  setupDataSettings();

  // Load current values
  await loadData();
}

/* ================================================================
 * Navigation
 * ================================================================ */
function setupNavigation() {
  const nav = document.querySelector('.settings-nav');
  nav?.addEventListener('click', e => {
    const btn = e.target.closest('.settings-nav-item');
    if (!btn) return;
    
    // Active state
    nav.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Switch panel
    const section = btn.dataset.section;
    document.querySelectorAll('.settings-panel').forEach(p => {
      p.style.display = p.id === `section-${section}` ? 'block' : 'none';
    });
  });
}

/* ================================================================
 * Load Data
 * ================================================================ */
async function loadData() {
  // Connection
  const apiUrl = Prefs.apiUrl.get();
  if (apiUrl) {
    document.getElementById('api-url').value = apiUrl;
    testConnection(apiUrl);
  }

  // Account
  const user = Prefs.user.get() || {};
  document.getElementById('display-name').value = user.name || '';
  document.getElementById('display-email').value = user.email || '';

  // Data Stats
  updateDataStats();
}

/* ================================================================
 * Connection Settings
 * ================================================================ */
function setupConnectionSettings() {
  const saveBtn = document.getElementById('save-api-url');
  const input   = document.getElementById('api-url');

  saveBtn?.addEventListener('click', async () => {
    const url = input.value.trim();
    if (!url) {
      Prefs.apiUrl.set('');
      API.configure('');
      document.getElementById('connection-status').textContent = 'Disconnected';
      document.getElementById('connection-status').style.color = 'var(--text-tertiary)';
      Toast.info('API disconnected');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Testing...';
    
    API.configure(url);
    await testConnection(url);
    
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save & Test Connection';
  });
}

async function testConnection(url) {
  const statusEl = document.getElementById('connection-status');
  statusEl.textContent = 'Connecting...';
  statusEl.style.color = 'var(--text-secondary)';

  try {
    const result = await API.ping();
    if (result.ok) {
      statusEl.textContent = `Connected (v${result.version || '1.0'})`;
      statusEl.style.color = 'var(--color-success)';
      Toast.success('Connected to Google Apps Script');
    } else {
      statusEl.textContent = 'Connection failed';
      statusEl.style.color = 'var(--color-error)';
      Toast.error('Connection failed', result.error);
    }
  } catch (err) {
    statusEl.textContent = 'Network error';
    statusEl.style.color = 'var(--color-error)';
    Toast.error('Network error', err.message);
  }
}

/* ================================================================
 * Appearance Settings
 * ================================================================ */
function setupAppearanceSettings() {
  const container = document.getElementById('app-theme-selector');
  if (!container) return;

  const THEMES = [
    { id: 'light',          label: 'Light',         bg: 'linear-gradient(135deg, #ffffff, #f4f4f5)' },
    { id: 'dark',           label: 'Dark',           bg: 'linear-gradient(135deg, #18181b, #27272a)' },
    { id: 'glassmorphism',  label: 'Glass',          bg: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2)), #0d0d1a' },
    { id: 'neumorphism',    label: 'Neumorphic',     bg: 'linear-gradient(135deg, #e0e5ec, #d1d9e6)' },
    { id: 'cyberpunk',      label: 'Cyberpunk',      bg: 'linear-gradient(135deg, #050510, #00f5ff33)' },
    { id: 'aurora',         label: 'Aurora',         bg: 'linear-gradient(135deg, #030a14, #00e5b033)' },
    { id: 'luxury',         label: 'Luxury',         bg: 'linear-gradient(135deg, #0a0800, #d4af3733)' },
  ];

  const current = AppStore.get('app.theme') || 'light';

  container.innerHTML = THEMES.map(t => `
    <div class="theme-option ${current === t.id ? 'selected' : ''}" data-theme-id="${t.id}">
      <div class="theme-option-preview" style="background: ${t.bg}"></div>
      <div class="theme-option-label">${t.label}</div>
      <div class="theme-option-check">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.theme-option').forEach(el => {
    el.addEventListener('click', () => {
      container.querySelectorAll('.theme-option').forEach(t => t.classList.remove('selected'));
      el.classList.add('selected');
      const themeId = el.dataset.themeId;
      
      // Update global
      AppStore.set('app.theme', themeId);
      Prefs.theme.set(themeId);
      document.documentElement.dataset.theme = themeId;
      Toast.success('Theme updated');
    });
  });
}

/* ================================================================
 * Account Settings
 * ================================================================ */
function setupAccountSettings() {
  document.getElementById('save-account')?.addEventListener('click', () => {
    const name = document.getElementById('display-name').value;
    const email= document.getElementById('display-email').value;

    Prefs.user.set({ name, email });
    AppStore.set('user', { name, email });
    Toast.success('Account updated');
  });
}

/* ================================================================
 * Data Settings
 * ================================================================ */
function setupDataSettings() {
  document.getElementById('export-all-data')?.addEventListener('click', async () => {
    const forms = await FormStorage.loadAll();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      forms,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanforms_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    Toast.success('Data exported');
  });

  document.getElementById('clear-local-cache')?.addEventListener('click', async () => {
    if (!confirm('Clear all local cached forms and responses? This will not delete data from Google Sheets if synced.')) return;
    
    // Quick clear of IDB
    const db = await initStorage();
    const tx = db.transaction(['forms', 'responses'], 'readwrite');
    tx.objectStore('forms').clear();
    tx.objectStore('responses').clear();

    localStorage.removeItem('sanforms:forms');
    localStorage.removeItem('sanforms:responses');

    updateDataStats();
    Toast.success('Local cache cleared');
  });

  document.getElementById('clear-all-data')?.addEventListener('click', async () => {
    if (!confirm('DANGER: Delete ALL data including API configuration and user preferences? This is irreversible.')) return;
    if (!confirm('Are you absolutely sure?')) return;

    // Delete IDB
    indexedDB.deleteDatabase('SanForms');
    
    // Clear LocalStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sanforms:')) localStorage.removeItem(key);
    });

    Toast.success('All data wiped. Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  });
}

async function updateDataStats() {
  const forms = await FormStorage.loadAll();
  
  // Responses from IDB
  let resCount = 0;
  try {
    const db = await initStorage();
    const tx = db.transaction('responses', 'readonly');
    const req = tx.objectStore('responses').count();
    resCount = await new Promise(r => {
      req.onsuccess = () => r(req.result);
      req.onerror = () => r(0);
    });
  } catch {}

  // Local storage responses length as fallback
  if (resCount === 0) {
    try {
      resCount = JSON.parse(localStorage.getItem('sanforms:responses') || '[]').length;
    } catch {}
  }

  document.getElementById('local-forms-count').textContent = forms.length;
  document.getElementById('local-responses-count').textContent = resCount;
}

init();
