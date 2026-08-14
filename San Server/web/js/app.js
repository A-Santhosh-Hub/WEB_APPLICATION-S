/**
 * SanLAN — Main Application Module
 *
 * Handles routing, state management, API communication, and app initialization.
 */

// ============================================================
// State
// ============================================================

const SanLAN = {
    /** Current navigation state */
    state: {
        currentView: 'home',      // 'home' | 'browse'
        currentShareId: null,
        currentShareName: null,
        currentPath: '',
        shares: [],
        serverInfo: null,
    },

    /** API base URL (auto-detected) */
    apiBase: '',

    /** DOM element references */
    els: {},
};


// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    SanLAN.els = {
        content: document.getElementById('content'),
        breadcrumbs: document.getElementById('breadcrumbs'),
        headerIp: document.getElementById('header-ip'),
        headerStatus: document.getElementById('header-status-text'),
        toastContainer: document.getElementById('toast-container'),
    };

    // Load server info and shares
    init();

    // Handle browser back/forward
    window.addEventListener('hashchange', handleHashChange);
});


async function init() {
    try {
        // Fetch server info
        const info = await fetchJSON('/api/info');
        SanLAN.state.serverInfo = info;
        SanLAN.els.headerIp.textContent = info.url || info.lan_ip;

        // Navigate based on current hash
        handleHashChange();

    } catch (err) {
        SanLAN.els.headerStatus.textContent = 'Disconnected';
        showError('Failed to connect to server. Is SanLAN running?');
        renderError('Connection Failed', 'Could not reach the SanLAN server. Please check that the server is running.');
    }
}


// ============================================================
// Routing (hash-based)
// ============================================================

function handleHashChange() {
    const hash = window.location.hash.slice(1) || '';

    if (!hash || hash === '/') {
        // Home — show shares
        SanLAN.state.currentView = 'home';
        SanLAN.state.currentShareId = null;
        SanLAN.state.currentPath = '';
        loadShares();

    } else if (hash.startsWith('/browse/')) {
        // Browse — show directory
        const parts = hash.slice(8); // Remove '/browse/'
        const slashIndex = parts.indexOf('/');

        if (slashIndex === -1) {
            SanLAN.state.currentShareId = parts;
            SanLAN.state.currentPath = '';
        } else {
            SanLAN.state.currentShareId = parts.slice(0, slashIndex);
            SanLAN.state.currentPath = parts.slice(slashIndex + 1);
        }

        SanLAN.state.currentView = 'browse';
        loadDirectory();
    }
}


/**
 * Navigate to a route by setting the hash.
 */
function navigateTo(route) {
    window.location.hash = route;
}


// ============================================================
// Data Loading
// ============================================================

async function loadShares() {
    showLoading();
    hideBreadcrumbs();

    try {
        const data = await fetchJSON('/api/shares');
        SanLAN.state.shares = data.shares || [];
        Explorer.renderShares(SanLAN.state.shares);
    } catch (err) {
        showError('Failed to load shares');
        renderError('Failed to Load', 'Could not load shared folders from the server.');
    }
}


async function loadDirectory() {
    showLoading();

    const { currentShareId, currentPath } = SanLAN.state;

    const endpoint = currentPath
        ? `/api/browse/${currentShareId}/${currentPath}`
        : `/api/browse/${currentShareId}`;

    try {
        const data = await fetchJSON(endpoint);

        // Update share name from response
        if (data.share) {
            SanLAN.state.currentShareName = data.share.name;
        }

        // Render breadcrumbs
        renderBreadcrumbs();

        // Render directory listing
        Explorer.renderDirectory(data.listing, currentShareId, currentPath);

    } catch (err) {
        if (err.status === 404) {
            renderError('Not Found', 'The requested directory does not exist.');
        } else if (err.status === 403) {
            renderError('Access Denied', 'You do not have permission to access this directory.');
        } else {
            showError('Failed to load directory');
            renderError('Load Failed', 'Could not load directory contents.');
        }
    }
}


// ============================================================
// Breadcrumbs
// ============================================================

function renderBreadcrumbs() {
    const { currentShareId, currentShareName, currentPath } = SanLAN.state;
    const el = SanLAN.els.breadcrumbs;
    el.classList.remove('hidden');

    let html = `
        <div class="breadcrumbs__item">
            <span class="breadcrumbs__link" onclick="navigateTo('/')">🏠 Home</span>
        </div>
        <span class="breadcrumbs__separator">›</span>
        <div class="breadcrumbs__item">
            <span class="breadcrumbs__link" onclick="navigateTo('/browse/${currentShareId}')">
                📁 ${escapeHtml(currentShareName || currentShareId)}
            </span>
        </div>
    `;

    if (currentPath) {
        const segments = currentPath.split('/');
        let accumulated = '';

        for (let i = 0; i < segments.length; i++) {
            accumulated += (accumulated ? '/' : '') + segments[i];

            html += `<span class="breadcrumbs__separator">›</span>`;

            if (i === segments.length - 1) {
                // Last segment — not clickable
                html += `
                    <div class="breadcrumbs__item">
                        <span class="breadcrumbs__current">${escapeHtml(segments[i])}</span>
                    </div>
                `;
            } else {
                html += `
                    <div class="breadcrumbs__item">
                        <span class="breadcrumbs__link"
                              onclick="navigateTo('/browse/${currentShareId}/${accumulated}')">
                            ${escapeHtml(segments[i])}
                        </span>
                    </div>
                `;
            }
        }
    }

    el.innerHTML = html;
}


function hideBreadcrumbs() {
    SanLAN.els.breadcrumbs.classList.add('hidden');
}


// ============================================================
// API Client
// ============================================================

/**
 * Fetch JSON from the API with error handling.
 *
 * @param {string} path — API path (e.g. '/api/shares')
 * @returns {Promise<object>} Parsed JSON response
 * @throws {object} Error with status and message
 */
async function fetchJSON(path) {
    const url = SanLAN.apiBase + path;

    let response;
    try {
        response = await fetch(url);
    } catch (networkError) {
        throw { status: 0, message: 'Network error — server unreachable' };
    }

    if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
            const body = await response.json();
            detail = body.detail || detail;
        } catch {}
        throw { status: response.status, message: detail };
    }

    return response.json();
}


// ============================================================
// UI Helpers
// ============================================================

function showLoading() {
    SanLAN.els.content.innerHTML = `
        <div class="loading">
            <div class="loading__spinner"></div>
        </div>
    `;
}


function renderError(title, message) {
    SanLAN.els.content.innerHTML = `
        <div class="empty-state">
            <div class="empty-state__icon">⚠️</div>
            <h2 class="empty-state__title">${escapeHtml(title)}</h2>
            <p class="empty-state__message">${escapeHtml(message)}</p>
            <button class="btn btn--secondary mt-8" onclick="navigateTo('/')">
                ← Back to Home
            </button>
        </div>
    `;
}


// ============================================================
// Toast Notifications
// ============================================================

function showToast(message, type = 'info', duration = 4000) {
    const container = SanLAN.els.toastContainer;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
    };

    toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 200);
    }, duration);
}


function showError(message) {
    showToast(message, 'error', 5000);
}


function showSuccess(message) {
    showToast(message, 'success');
}


// ============================================================
// Utilities
// ============================================================

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


/**
 * Format a date string for display.
 */
function formatDate(isoString) {
    if (!isoString) return '—';
    try {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return isoString;
    }
}


/**
 * Trigger a file download via the browser.
 */
function downloadFile(shareId, filePath) {
    const url = `/api/download/${shareId}/${filePath}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started', 'info');
}
