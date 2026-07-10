/**
 * SanStudio Forms — Responses Page Logic
 * ========================================
 */

import { API }           from '../core/api.js';
import { FormStorage, ResponseStorage, DataExport } from '../core/storage.js';
import { Toast }         from '../components/toast.js';
import { escapeHtml }    from '../utils/sanitizer.js';

const state = {
  formId:    new URLSearchParams(window.location.search).get('formId') || '',
  forms:     [],
  form:      null,
  responses: [],
  filtered:  [],
  selected:  new Set(),
  page:      1,
  perPage:   25,
  viewingId: null,
};

/* ================================================================
 * Init
 * ================================================================ */
export async function init() {
  await loadForms();

  if (state.formId) {
    await loadResponses(state.formId);
  }

  setupFormSelector();
  setupFilters();
  setupBulkActions();
  setupModals();
  setupExport();
}

/* ================================================================
 * Load Forms
 * ================================================================ */
async function loadForms() {
  // Try local first
  state.forms = await FormStorage.loadAll();

  // Try API
  const result = await API.forms.list();
  if (result.ok && result.data?.length > 0) {
    state.forms = result.data.filter(f => f.status !== 'deleted');
  }
}

/* ================================================================
 * Form Selector
 * ================================================================ */
function setupFormSelector() {
  const dropdown = document.getElementById('form-select-dropdown');
  const label    = document.getElementById('form-select-label');

  // Populate
  dropdown.innerHTML = state.forms.map(f => `
    <button class="dropdown-item" data-form-id="${f.id}" role="option" aria-selected="${f.id === state.formId}">
      <span>${escapeHtml(f.title || 'Untitled Form')}</span>
      <span style="font-size: var(--text-xs); color: var(--text-tertiary)">${f.responseCount || 0} responses</span>
    </button>
  `).join('');

  document.getElementById('form-select-btn')?.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  dropdown.querySelectorAll('[data-form-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      dropdown.hidden = true;
      state.formId = btn.dataset.formId;
      label.textContent = btn.querySelector('span').textContent;
      history.replaceState(null, '', `?formId=${state.formId}`);
      await loadResponses(state.formId);
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('#form-select-wrap')) dropdown.hidden = true;
  });

  // Pre-select
  if (state.formId) {
    const selected = state.forms.find(f => f.id === state.formId);
    if (selected) label.textContent = selected.title || 'Untitled Form';
  }
}

/* ================================================================
 * Load Responses
 * ================================================================ */
async function loadResponses(formId) {
  if (!formId) return;

  showSkeletons();

  // Load form definition
  state.form = state.forms.find(f => f.id === formId) || null;

  // Try API
  const result = await API.responses.list(formId, 1, 10000);
  if (result.ok && result.data) {
    state.responses = result.data;
  } else {
    // Fallback to local
    state.responses = await ResponseStorage.getByFormId(formId);
  }

  state.responses.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  state.filtered = [...state.responses];
  state.page     = 1;

  updateStats();
  buildTableHeaders();
  renderTable();

  // Update breadcrumb
  const breadcrumb = document.getElementById('form-breadcrumb');
  if (breadcrumb && state.form) breadcrumb.textContent = (state.form.title || 'Form') + ' — Responses';

  document.getElementById('responses-page-title').textContent = state.form?.title || 'Responses';
  document.getElementById('responses-subtitle').textContent = `${state.responses.length} total response${state.responses.length !== 1 ? 's' : ''}`;
}

/* ================================================================
 * Stats
 * ================================================================ */
function updateStats() {
  const today = new Date().toDateString();
  const todayCount = state.responses.filter(r => new Date(r.submittedAt).toDateString() === today).length;

  const avgDuration = state.responses.length > 0
    ? Math.round(state.responses.reduce((sum, r) => sum + (r.duration || 0), 0) / state.responses.length)
    : 0;

  const requiredQs = (state.form?.questions || []).filter(q => q.required);
  const completed  = state.responses.filter(r =>
    requiredQs.every(q => {
      const a = r.answers?.[q.id];
      return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
    })
  ).length;

  const completion = state.responses.length > 0 ? Math.round(completed / state.responses.length * 100) : 0;

  document.getElementById('stat-r-total').textContent    = state.responses.length;
  document.getElementById('stat-r-today').textContent    = todayCount;
  document.getElementById('stat-r-completion').textContent = `${completion}%`;
  document.getElementById('stat-r-duration').textContent = avgDuration > 60
    ? `${Math.floor(avgDuration/60)}m ${avgDuration%60}s`
    : `${avgDuration}s`;
}

/* ================================================================
 * Table
 * ================================================================ */
function buildTableHeaders() {
  const thead    = document.getElementById('responses-thead');
  const questions = (state.form?.questions || []).filter(q =>
    !['instruction','rich-text','section-break','page-break','video-embed','audio-embed','custom-html','hidden-field'].includes(q.type)
  ).slice(0, 6); // Show max 6 question columns

  thead.innerHTML = `
    <tr>
      <th style="width:40px"><input type="checkbox" id="select-all" aria-label="Select all"></th>
      <th>#</th>
      <th>Submitted</th>
      <th>Duration</th>
      ${questions.map(q => `<th title="${escapeHtml(q.label || '')}">${escapeHtml((q.label || '').substring(0, 20))}${(q.label || '').length > 20 ? '…' : ''}</th>`).join('')}
      <th>Actions</th>
    </tr>
  `;

  document.getElementById('select-all')?.addEventListener('change', e => {
    const checked = e.target.checked;
    const start   = (state.page - 1) * state.perPage;
    const pageItems = state.filtered.slice(start, start + state.perPage);

    pageItems.forEach(r => { checked ? state.selected.add(r.id) : state.selected.delete(r.id); });
    renderTable();
    updateBulkUI();
  });
}

function renderTable() {
  const tbody = document.getElementById('responses-tbody');
  const empty = document.getElementById('responses-empty');
  const footer= document.getElementById('table-footer');

  const questions = (state.form?.questions || []).filter(q =>
    !['instruction','rich-text','section-break','page-break','video-embed','audio-embed','custom-html','hidden-field'].includes(q.type)
  ).slice(0, 6);

  if (state.filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    footer.style.display = 'none';
    return;
  }

  empty.style.display = 'none';

  const start     = (state.page - 1) * state.perPage;
  const pageItems = state.filtered.slice(start, start + state.perPage);

  tbody.innerHTML = pageItems.map((r, i) => {
    const date     = r.submittedAt ? new Date(r.submittedAt) : null;
    const duration = r.duration ? (r.duration > 60 ? `${Math.floor(r.duration/60)}m ${r.duration%60}s` : `${r.duration}s`) : '—';
    const isChecked= state.selected.has(r.id);

    return `
      <tr data-id="${r.id}" class="response-row ${isChecked ? 'selected-row' : ''}" style="cursor:pointer">
        <td onclick="event.stopPropagation()">
          <input type="checkbox" class="row-checkbox" data-id="${r.id}" ${isChecked ? 'checked' : ''} aria-label="Select response">
        </td>
        <td style="font-weight: var(--weight-semibold); color: var(--text-secondary)">${start + i + 1}</td>
        <td>
          <div style="font-size: var(--text-sm)">${date ? date.toLocaleDateString() : '—'}</div>
          <div style="font-size: 10px; color: var(--text-tertiary)">${date ? date.toLocaleTimeString() : ''}</div>
        </td>
        <td style="font-size: var(--text-sm); color: var(--text-secondary)">${duration}</td>
        ${questions.map(q => {
          const val = r.answers?.[q.id];
          const str = val === null || val === undefined ? '—'
            : Array.isArray(val) ? val.join(', ')
            : typeof val === 'object' ? JSON.stringify(val)
            : String(val);
          return `<td title="${escapeHtml(str)}" style="max-width: 180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size: var(--text-sm)">${escapeHtml(str.substring(0, 50))}${str.length > 50 ? '…' : ''}</td>`;
        }).join('')}
        <td onclick="event.stopPropagation()">
          <button class="btn btn-icon btn-ghost btn-xs view-response-btn" data-id="${r.id}" aria-label="View response">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn btn-icon btn-ghost btn-xs delete-response-btn" data-id="${r.id}" aria-label="Delete response" style="color: var(--color-error)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Row click → detail
  tbody.querySelectorAll('.response-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('.row-checkbox') || e.target.closest('button')) return;
      openResponseDetail(row.dataset.id);
    });
  });

  // Checkbox
  tbody.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.checked ? state.selected.add(cb.dataset.id) : state.selected.delete(cb.dataset.id);
      updateBulkUI();
    });
  });

  // View & delete buttons
  tbody.querySelectorAll('.view-response-btn').forEach(btn => {
    btn.addEventListener('click', () => openResponseDetail(btn.dataset.id));
  });

  tbody.querySelectorAll('.delete-response-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteResponse(btn.dataset.id));
  });

  // Pagination footer
  footer.style.display = 'flex';
  document.getElementById('table-count').textContent = `${start + 1}–${Math.min(start + state.perPage, state.filtered.length)} of ${state.filtered.length}`;
  document.getElementById('table-page').textContent  = `Page ${state.page} of ${Math.ceil(state.filtered.length / state.perPage)}`;
  document.getElementById('prev-page-btn').disabled  = state.page <= 1;
  document.getElementById('next-page-btn').disabled  = state.page >= Math.ceil(state.filtered.length / state.perPage);
}

function showSkeletons() {
  document.getElementById('responses-tbody').innerHTML = Array.from({length: 5}).map(() => `
    <tr><td colspan="10"><div class="animate-shimmer" style="height:38px; border-radius: var(--radius-md)"></div></td></tr>
  `).join('');
  document.getElementById('responses-empty').style.display = 'none';
}

/* ================================================================
 * Filters
 * ================================================================ */
function setupFilters() {
  const searchInput = document.getElementById('response-search');
  const fromInput   = document.getElementById('filter-from');
  const toInput     = document.getElementById('filter-to');
  const clearBtn    = document.getElementById('clear-filters-btn');

  const applyFilters = () => {
    const q    = searchInput.value.toLowerCase();
    const from = fromInput.value ? new Date(fromInput.value).getTime() : 0;
    const to   = toInput.value ? new Date(toInput.value + 'T23:59:59').getTime() : Infinity;

    state.filtered = state.responses.filter(r => {
      // Date filter
      const ts = r.submittedAt || 0;
      if (ts < from || ts > to) return false;

      // Search filter
      if (q) {
        const answers = Object.values(r.answers || {}).join(' ').toLowerCase();
        return answers.includes(q);
      }

      return true;
    });

    state.page = 1;
    renderTable();
  };

  searchInput?.addEventListener('input', applyFilters);
  fromInput?.addEventListener('change', applyFilters);
  toInput?.addEventListener('change', applyFilters);

  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    fromInput.value   = '';
    toInput.value     = '';
    state.filtered    = [...state.responses];
    state.page        = 1;
    renderTable();
  });

  // Pagination
  document.getElementById('prev-page-btn')?.addEventListener('click', () => { state.page--; renderTable(); });
  document.getElementById('next-page-btn')?.addEventListener('click', () => { state.page++; renderTable(); });
}

/* ================================================================
 * Bulk Actions
 * ================================================================ */
function setupBulkActions() {
  document.getElementById('bulk-cancel-btn')?.addEventListener('click', () => {
    state.selected.clear();
    renderTable();
    updateBulkUI();
  });

  document.getElementById('bulk-delete-btn')?.addEventListener('click', async () => {
    if (!confirm(`Delete ${state.selected.size} responses? This cannot be undone.`)) return;
    for (const id of state.selected) {
      await API.responses.delete(state.formId, id).catch(() => {});
      await ResponseStorage.delete(id);
      state.responses  = state.responses.filter(r => r.id !== id);
      state.filtered   = state.filtered.filter(r => r.id !== id);
    }
    state.selected.clear();
    renderTable();
    updateBulkUI();
    updateStats();
    Toast.success('Deleted', `${state.selected.size || 'Selected'} responses removed.`);
  });

  document.getElementById('bulk-export-btn')?.addEventListener('click', () => {
    const selected   = state.responses.filter(r => state.selected.has(r.id));
    const csv        = DataExport.toCSV(selected, state.form || { questions: [] });
    const filename   = `${state.form?.title || 'form'}_selected_responses.csv`;
    DataExport.download(csv, filename);
    Toast.success('Exported', `${selected.length} responses exported.`);
  });
}

function updateBulkUI() {
  const bulkBar = document.getElementById('bulk-actions');
  const count   = state.selected.size;
  bulkBar.style.display = count > 0 ? 'flex' : 'none';
  document.getElementById('bulk-count').textContent = `${count} selected`;
}

/* ================================================================
 * Response Detail Modal
 * ================================================================ */
function openResponseDetail(id) {
  state.viewingId = id;
  const response = state.responses.find(r => r.id === id);
  if (!response) return;

  const content = document.getElementById('response-detail-content');
  const questions = state.form?.questions || [];
  const date = new Date(response.submittedAt);

  content.innerHTML = `
    <div style="padding: var(--space-2) 0; margin-bottom: var(--space-5); display:flex; gap: var(--space-6)">
      <div>
        <div style="font-size: 10px; text-transform:uppercase; letter-spacing:var(--tracking-wider); color: var(--text-tertiary); margin-bottom: 2px">Submitted</div>
        <div style="font-size: var(--text-sm); color: var(--text-secondary)">${date.toLocaleString()}</div>
      </div>
      <div>
        <div style="font-size: 10px; text-transform:uppercase; letter-spacing:var(--tracking-wider); color: var(--text-tertiary); margin-bottom: 2px">Duration</div>
        <div style="font-size: var(--text-sm); color: var(--text-secondary)">${response.duration ? `${response.duration}s` : '—'}</div>
      </div>
    </div>
    ${questions.filter(q =>
      !['instruction','rich-text','section-break','page-break','video-embed','audio-embed','custom-html'].includes(q.type)
    ).map(q => {
      const val = response.answers?.[q.id];
      if (val === undefined || val === null || val === '') return '';
      const display = Array.isArray(val) ? val.join(', ')
        : typeof val === 'object' ? JSON.stringify(val)
        : String(val);
      return `
        <div style="margin-bottom: var(--space-5); padding-bottom: var(--space-5); border-bottom: 1px solid var(--border-subtle)">
          <div style="font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: var(--tracking-wider); margin-bottom: var(--space-2)">${escapeHtml(q.label || q.id)}</div>
          <div style="font-size: var(--text-sm); color: var(--text-primary); line-height: var(--leading-relaxed); word-break: break-word">${escapeHtml(display)}</div>
        </div>
      `;
    }).join('')}
  `;

  document.getElementById('response-modal').hidden = false;

  document.getElementById('delete-response-btn').onclick = async () => {
    await deleteResponse(id);
    document.getElementById('response-modal').hidden = true;
  };
}

async function deleteResponse(id) {
  if (!confirm('Delete this response?')) return;
  await API.responses.delete(state.formId, id).catch(() => {});
  await ResponseStorage.delete(id);
  state.responses = state.responses.filter(r => r.id !== id);
  state.filtered  = state.filtered.filter(r => r.id !== id);
  state.selected.delete(id);
  renderTable();
  updateStats();
  updateBulkUI();
  Toast.success('Response deleted');
}

function setupModals() {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.modalClose).hidden = true;
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.hidden = true;
    });
  });
}

function setupExport() {
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    if (!state.form) { Toast.warning('No form selected'); return; }
    const csv      = DataExport.toCSV(state.filtered, state.form);
    const filename = `${state.form.title || 'form'}_responses.csv`;
    DataExport.download(csv, filename);
    Toast.success('Export complete', `${state.filtered.length} responses exported.`);
  });
}

init();
