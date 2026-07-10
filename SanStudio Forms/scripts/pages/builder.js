/**
 * SanStudio Forms — Form Builder Logic
 * =======================================
 * Complete drag-and-drop form builder with:
 *  - 30+ question types
 *  - Undo/redo (50 history steps)
 *  - Autosave every 3 seconds
 *  - Question settings panel
 *  - Conditional logic
 *  - Theme picker
 *  - Preview
 *  - Publish/unpublish
 */

import { API }                from '../core/api.js';
import { AppStore }           from '../core/store.js';
import { EventBus, Events }   from '../core/events.js';
import { Toast }              from '../components/toast.js';
import { FormStorage }        from '../core/storage.js';
import { escapeHtml }         from '../utils/sanitizer.js';
import { validateQuestion }   from '../utils/validators.js';
import { QUESTION_TYPES }     from '../questions/registry.js';

/* ================================================================
 * Builder State
 * ================================================================ */
const state = {
  form: null,           // Current form object
  selectedId: null,     // Selected question ID
  historyStack: [],     // Undo/redo history
  historyIndex: -1,     // Current position in history
  dirty: false,         // Has unsaved changes
  autosaveTimer: null,  // Autosave interval
  device: 'desktop',    // Preview device
};

/* ================================================================
 * Init
 * ================================================================ */
export async function init() {
  // Load or create form
  const formId = new URLSearchParams(window.location.search).get('id');
  const isNew  = new URLSearchParams(window.location.search).get('new') === 'true';

  if (formId && !isNew) {
    await loadForm(formId);
  } else {
    createNewForm();
  }

  // Render question type picker
  renderQuestionTypePicker();

  // Setup all event listeners
  setupTopbar();
  setupCanvas();
  setupSettingsTabs();
  setupModals();
  setupKeyboardShortcuts();
  setupDeviceSwitcher();
  setupThemePicker();
  setupFormSettings();

  // Start autosave
  startAutosave();

  // Render initial form
  renderForm();
}

/* ================================================================
 * Form Management
 * ================================================================ */
function createNewForm() {
  state.form = {
    id:           generateId(),
    title:        'Untitled Form',
    description:  '',
    questions:    [],
    settings:     {
      theme:          'light',
      accentColor:    '#8b5cf6',
      language:       'en',
      showProgress:   true,
      showEstTime:    false,
      confirmationMsg:'Thank you for your response!',
      redirectUrl:    '',
      responseLimit:  null,
      expiry:         null,
      dedup:          false,
      draftSave:      true,
      emailNotify:    false,
      notifyEmail:    '',
      passwordProtect:false,
      password:       '',
      logoUrl:        '',
      customCss:      '',
    },
    color:        'purple',
    status:       'draft',
    createdAt:    Date.now(),
    updatedAt:    Date.now(),
  };

  pushHistory();
}

async function loadForm(formId) {
  // Try local first
  let form = await FormStorage.load(formId);

  if (!form) {
    // Try API
    const result = await API.forms.get(formId);
    if (result.ok) form = result.data;
  }

  if (form) {
    state.form = form;
  } else {
    Toast.warning('Form not found', 'Creating a new form instead.');
    createNewForm();
  }

  pushHistory();
}

/* ================================================================
 * Question Type Picker
 * ================================================================ */
const QUESTION_GROUPS = [
  {
    label: 'Basic',
    types: ['short-answer', 'paragraph', 'number', 'email', 'phone', 'website', 'password'],
  },
  {
    label: 'Choice',
    types: ['dropdown', 'checkbox', 'radio', 'image-choice'],
  },
  {
    label: 'Date & Time',
    types: ['date', 'time', 'datetime'],
  },
  {
    label: 'Rating & Scale',
    types: ['rating', 'stars', 'emoji-rating', 'slider', 'linear-scale', 'nps'],
  },
  {
    label: 'Matrix',
    types: ['matrix', 'likert'],
  },
  {
    label: 'Media & Files',
    types: ['file-upload', 'image-upload', 'video-embed', 'audio-embed'],
  },
  {
    label: 'Advanced',
    types: ['signature', 'location', 'color-picker', 'code-block', 'hidden-field'],
  },
  {
    label: 'Layout',
    types: ['section-break', 'page-break', 'instruction', 'rich-text', 'terms', 'captcha', 'custom-html'],
  },
];

function renderQuestionTypePicker() {
  const list = document.getElementById('question-type-list');
  list.innerHTML = '';

  QUESTION_GROUPS.forEach(group => {
    const label = document.createElement('div');
    label.className = 'question-type-group-label';
    label.textContent = group.label;
    list.appendChild(label);

    group.types.forEach(typeId => {
      const def = QUESTION_TYPES[typeId];
      if (!def) return;

      const item = document.createElement('button');
      item.className = 'question-type-item';
      item.draggable = true;
      item.dataset.type = typeId;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Add ${def.label} question`);

      item.innerHTML = `
        <div class="question-type-icon" style="background: ${def.color}15; color: ${def.color}">
          ${def.icon}
        </div>
        <span class="question-type-name">${escapeHtml(def.label)}</span>
      `;

      item.addEventListener('click', () => addQuestion(typeId));
      item.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', typeId);
        e.dataTransfer.effectAllowed = 'copy';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));

      list.appendChild(item);
    });
  });
}

// Filter question types
document.addEventListener('input', e => {
  if (e.target.id !== 'question-type-search') return;
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.question-type-item').forEach(item => {
    const name = item.querySelector('.question-type-name')?.textContent.toLowerCase() || '';
    item.style.display = name.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.question-type-group-label').forEach(label => {
    const nextSibling = label.nextElementSibling;
    let hasVisible = false;
    let el = label.nextElementSibling;
    while (el && !el.classList.contains('question-type-group-label')) {
      if (el.style.display !== 'none') hasVisible = true;
      el = el.nextElementSibling;
    }
    label.style.display = hasVisible ? '' : 'none';
  });
});

/* ================================================================
 * Add / Remove Questions
 * ================================================================ */
function addQuestion(type, afterId = null) {
  const def = QUESTION_TYPES[type];
  if (!def) return;

  const question = {
    id:           generateId(),
    type,
    label:        def.defaultLabel || 'Question',
    subLabel:     '',
    required:     false,
    options:      def.defaultOptions ? JSON.parse(JSON.stringify(def.defaultOptions)) : undefined,
    validation:   {},
    logic:        [],
    ...def.defaults,
  };

  const questions = state.form.questions;

  if (afterId) {
    const idx = questions.findIndex(q => q.id === afterId);
    questions.splice(idx + 1, 0, question);
  } else {
    questions.push(question);
  }

  state.form.updatedAt = Date.now();
  pushHistory();
  markDirty();
  renderForm();
  selectQuestion(question.id);
  Toast.info(`${def.label} added`);
}

function removeQuestion(id) {
  state.form.questions = state.form.questions.filter(q => q.id !== id);
  if (state.selectedId === id) {
    state.selectedId = null;
    showRightPanelEmpty();
  }
  pushHistory();
  markDirty();
  renderForm();
}

function duplicateQuestion(id) {
  const q     = state.form.questions.find(q => q.id === id);
  if (!q) return;
  const copy  = { ...JSON.parse(JSON.stringify(q)), id: generateId() };
  const idx   = state.form.questions.findIndex(q => q.id === id);
  state.form.questions.splice(idx + 1, 0, copy);
  pushHistory();
  markDirty();
  renderForm();
  selectQuestion(copy.id);
}

function moveQuestion(fromId, toId, position = 'before') {
  const questions = state.form.questions;
  const fromIdx   = questions.findIndex(q => q.id === fromId);
  const toIdx     = questions.findIndex(q => q.id === toId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

  const [removed] = questions.splice(fromIdx, 1);
  const newIdx    = position === 'before' ? toIdx : toIdx + 1;
  questions.splice(Math.max(0, newIdx > fromIdx ? newIdx - 1 : newIdx), 0, removed);

  pushHistory();
  markDirty();
  renderForm();
}

/* ================================================================
 * Render Form
 * ================================================================ */
function renderForm() {
  const form = state.form;
  if (!form) return;

  // Update title inputs
  const titleInput = document.getElementById('form-title-input');
  const descInput  = document.getElementById('form-desc-input');
  if (titleInput && titleInput.value !== form.title) titleInput.value = form.title;
  if (descInput  && descInput.value !== form.description)  descInput.value = form.description;

  // Update canvas header
  const titleDisplay = document.getElementById('form-header-title');
  const descDisplay  = document.getElementById('form-header-desc');
  if (titleDisplay) titleDisplay.textContent = form.title || '';
  if (descDisplay)  descDisplay.textContent  = form.description || '';

  // Render questions
  renderQuestions();

  // Update publish button
  const publishLabel = document.getElementById('publish-label');
  if (publishLabel) {
    publishLabel.textContent = form.status === 'published' ? 'Unpublish' : 'Publish';
  }

  // Show/hide placeholder
  const placeholder = document.getElementById('add-question-placeholder');
  const addMore     = document.getElementById('add-more-wrap');
  if (form.questions.length === 0) {
    placeholder?.style.removeProperty('display');
    if (addMore) addMore.style.display = 'none';
  } else {
    if (placeholder) placeholder.style.display = 'none';
    if (addMore) addMore.style.display = 'flex';
  }
}

function renderQuestions() {
  const list = document.getElementById('questions-list');
  if (!list) return;

  // Preserve selected question scroll position
  const prevSelected = state.selectedId;

  list.innerHTML = '';

  state.form.questions.forEach((question, index) => {
    const card = createQuestionCard(question, index + 1);
    list.appendChild(card);
  });

  // Re-setup drag & drop
  setupDragDrop();

  // Restore selection
  if (prevSelected && state.form.questions.find(q => q.id === prevSelected)) {
    selectQuestion(prevSelected, false);
  }
}

/* ================================================================
 * Question Card Creation
 * ================================================================ */
function createQuestionCard(question, number) {
  const def  = QUESTION_TYPES[question.type];
  const card = document.createElement('div');
  card.className = `question-card${question.id === state.selectedId ? ' selected' : ''}`;
  card.dataset.questionId = question.id;
  card.draggable = true;
  card.setAttribute('role', 'listitem');

  card.innerHTML = `
    <!-- Drag handle -->
    <div class="question-drag-handle" aria-hidden="true" title="Drag to reorder">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="8" cy="5" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="8" cy="19" r="1.5"/>
        <circle cx="16" cy="5" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="16" cy="19" r="1.5"/>
      </svg>
    </div>

    <!-- Card Body -->
    <div class="question-card-body">
      <div class="question-label-wrap">
        <span class="question-number" aria-label="Question number">${number}</span>
        <textarea
          class="question-label-input"
          rows="1"
          placeholder="Question..."
          aria-label="Question text"
          data-question-id="${question.id}"
          data-field="label"
        >${escapeHtml(question.label || '')}</textarea>
        ${question.required ? '<span class="question-required-star" aria-label="Required">*</span>' : ''}
      </div>

      ${question.subLabel !== undefined ? `
      <input
        type="text"
        class="question-sublabel-input"
        placeholder="Description (optional)"
        value="${escapeHtml(question.subLabel || '')}"
        data-question-id="${question.id}"
        data-field="subLabel"
        aria-label="Question description"
      >` : ''}

      <!-- Answer Preview -->
      <div class="question-answer-preview">
        ${renderAnswerPreview(question)}
      </div>
    </div>

    <!-- Card Footer -->
    <div class="question-card-footer">
      <div class="question-required-toggle">
        <label class="toggle-wrapper" style="gap: var(--space-2);">
          <input type="checkbox" class="toggle-input" ${question.required ? 'checked' : ''}
            data-question-id="${question.id}" data-field="required" aria-label="Required">
          <div class="toggle-track"><div class="toggle-thumb"></div></div>
          <span style="font-size: var(--text-xs); color: var(--text-secondary);">Required</span>
        </label>
      </div>

      <div class="question-footer-actions">
        <button class="question-footer-btn" data-action="duplicate" data-question-id="${question.id}" aria-label="Duplicate question" data-tooltip="Duplicate">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="question-footer-btn" data-action="move-up" data-question-id="${question.id}" aria-label="Move up" data-tooltip="Move up" ${number === 1 ? 'disabled' : ''}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
        <button class="question-footer-btn" data-action="move-down" data-question-id="${question.id}" aria-label="Move down" data-tooltip="Move down" ${number === state.form.questions.length ? 'disabled' : ''}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button class="question-footer-btn danger" data-action="delete" data-question-id="${question.id}" aria-label="Delete question" data-tooltip="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>
  `;

  // Click to select
  card.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]')) return;
    selectQuestion(question.id);
  });

  // Label input auto-resize + update
  const labelInput = card.querySelector('.question-label-input');
  if (labelInput) {
    autoResize(labelInput);
    labelInput.addEventListener('input', () => {
      autoResize(labelInput);
      updateQuestionField(question.id, 'label', labelInput.value);
    });
  }

  // Sub-label input update
  const subLabelInput = card.querySelector('.question-sublabel-input');
  if (subLabelInput) {
    subLabelInput.addEventListener('input', () => {
      updateQuestionField(question.id, 'subLabel', subLabelInput.value);
    });
  }

  // Required toggle
  const requiredToggle = card.querySelector('[data-field="required"]');
  if (requiredToggle) {
    requiredToggle.addEventListener('change', () => {
      updateQuestionField(question.id, 'required', requiredToggle.checked);
      const star = card.querySelector('.question-required-star');
      if (star) star.style.display = requiredToggle.checked ? '' : 'none';
    });
  }

  // Footer action buttons
  card.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const qId    = btn.dataset.questionId;

      switch (action) {
        case 'duplicate': duplicateQuestion(qId); break;
        case 'delete':    removeQuestion(qId); break;
        case 'move-up':   {
          const idx = state.form.questions.findIndex(q => q.id === qId);
          if (idx > 0) {
            [state.form.questions[idx-1], state.form.questions[idx]] =
              [state.form.questions[idx], state.form.questions[idx-1]];
            pushHistory(); markDirty(); renderForm();
          }
          break;
        }
        case 'move-down': {
          const idx = state.form.questions.findIndex(q => q.id === qId);
          if (idx < state.form.questions.length - 1) {
            [state.form.questions[idx+1], state.form.questions[idx]] =
              [state.form.questions[idx], state.form.questions[idx+1]];
            pushHistory(); markDirty(); renderForm();
          }
          break;
        }
      }
    });
  });

  // Drag & drop
  card.addEventListener('dragstart', e => {
    e.dataTransfer.setData('application/question-id', question.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.style.opacity = '0.5', 0);
  });

  card.addEventListener('dragend', () => {
    card.style.opacity = '';
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  });

  return card;
}

/* ================================================================
 * Answer Preview Renderer
 * ================================================================ */
function renderAnswerPreview(question) {
  const def = QUESTION_TYPES[question.type];
  if (def?.renderPreview) {
    return def.renderPreview(question);
  }

  switch (question.type) {
    case 'short-answer':
    case 'email':
    case 'phone':
    case 'website':
    case 'password':
    case 'number':
      return `<div class="preview-input" style="color: var(--text-tertiary)">${
        question.type === 'email' ? 'email@example.com' :
        question.type === 'phone' ? '+1 (555) 000-0000' :
        question.type === 'website' ? 'https://example.com' :
        question.type === 'password' ? '••••••••' :
        question.type === 'number' ? '0' :
        'Short answer text'
      }</div>`;

    case 'paragraph':
    case 'rich-text':
      return `<div class="preview-textarea">Long answer text...</div>`;

    case 'date':
      return `<input type="date" class="preview-input" disabled style="color: var(--text-tertiary)">`;

    case 'time':
      return `<input type="time" class="preview-input" disabled style="color: var(--text-tertiary)">`;

    case 'datetime':
      return `<input type="datetime-local" class="preview-input" disabled style="color: var(--text-tertiary)">`;

    case 'dropdown':
      return `<select class="preview-input" disabled style="color: var(--text-tertiary)">
        <option>Select an option...</option>
        ${(question.options || []).slice(0,3).map(o => `<option>${escapeHtml(o.label)}</option>`).join('')}
      </select>`;

    case 'radio':
    case 'checkbox':
      return (question.options || [{ label: 'Option 1' }, { label: 'Option 2' }]).slice(0, 4).map(opt => `
        <div class="preview-choice">
          <div class="preview-choice-indicator ${question.type === 'radio' ? 'radio' : 'checkbox'}"></div>
          <span class="preview-choice-label">${escapeHtml(opt.label || '')}</span>
        </div>
      `).join('');

    case 'rating':
    case 'stars':
      return `<div class="preview-stars">${'⭐'.repeat(question.maxRating || 5)}</div>`;

    case 'emoji-rating':
      return `<div class="preview-stars" style="gap: var(--space-3)">😞 😐 🙂 😊 🤩</div>`;

    case 'slider':
    case 'linear-scale':
      return `
        <div style="display:flex; flex-direction:column; gap: var(--space-2)">
          <input type="range" class="preview-slider" min="${question.min || 0}" max="${question.max || 10}" value="${question.defaultValue || 5}" disabled>
          <div style="display:flex; justify-content:space-between; font-size: var(--text-xs); color: var(--text-tertiary)">
            <span>${question.minLabel || question.min || 0}</span>
            <span>${question.maxLabel || question.max || 10}</span>
          </div>
        </div>`;

    case 'nps':
      return `<div class="preview-nps">${Array.from({length: 11}, (_, i) => `
        <div class="preview-nps-btn">${i}</div>
      `).join('')}</div>`;

    case 'matrix':
    case 'likert':
      return `<div style="font-size: var(--text-xs); color: var(--text-tertiary); font-style: italic; padding: var(--space-2) 0">
        Matrix: ${(question.rows || []).length} rows × ${(question.columns || []).length} columns
      </div>`;

    case 'file-upload':
    case 'image-upload':
      return `<div class="preview-file-upload">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto var(--space-2)"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <div>Click to upload or drag & drop</div>
        <div style="font-size: var(--text-xs); color: var(--text-tertiary); margin-top: var(--space-1)">${
          question.allowedTypes ? question.allowedTypes.join(', ') : 'Any file type'
        }</div>
      </div>`;

    case 'signature':
      return `<div class="preview-signature">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: var(--space-1)"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Sign here
      </div>`;

    case 'location':
      return `<div class="preview-input" style="color: var(--text-tertiary); display:flex; align-items:center; gap: var(--space-2)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        Click to detect location
      </div>`;

    case 'color-picker':
      return `<div style="display:flex; gap: var(--space-2); align-items:center">
        <div style="width:36px; height:36px; border-radius: var(--radius-lg); background: #8b5cf6; border: 2px solid var(--border-default);"></div>
        <input class="input input-sm" value="#8b5cf6" disabled style="max-width:120px; font-family: var(--font-mono)">
      </div>`;

    case 'section-break':
      return `<hr style="border-color: var(--border-default); margin: var(--space-2) 0">`;

    case 'page-break':
      return `<div style="text-align:center; padding: var(--space-2) 0; font-size: var(--text-xs); color: var(--text-tertiary); border-top: 2px dashed var(--border-default)">
        ── Page Break ──
      </div>`;

    case 'instruction':
    case 'code-block':
    case 'custom-html':
      return `<div style="font-size: var(--text-sm); color: var(--text-secondary); padding: var(--space-2) 0; font-style: italic">
        ${question.content ? escapeHtml(question.content.substring(0, 100)) + '...' : `(Empty ${question.type.replace('-', ' ')})`}
      </div>`;

    case 'terms':
      return `<div style="display:flex; gap: var(--space-2); align-items:flex-start; padding: var(--space-2) 0">
        <div class="preview-choice-indicator checkbox" style="margin-top: 2px"></div>
        <span style="font-size: var(--text-xs); color: var(--text-secondary)">I agree to the Terms & Conditions</span>
      </div>`;

    case 'captcha':
      return `<div style="padding: var(--space-3); border: 1.5px solid var(--border-default); border-radius: var(--radius-lg); display:flex; align-items:center; gap: var(--space-3); font-size: var(--text-sm); color: var(--text-secondary)">
        <div style="width:24px;height:24px;border-radius:50%;border:2px solid var(--color-success);display:flex;align-items:center;justify-content:center;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        I'm not a robot
      </div>`;

    case 'hidden-field':
      return `<div style="font-size: var(--text-xs); color: var(--text-tertiary); padding: var(--space-1) 0; font-style:italic">Hidden field — not shown to respondents</div>`;

    case 'video-embed':
      return `<div style="aspect-ratio:16/9; background:var(--bg-surface-2); border-radius: var(--radius-lg); display:flex; align-items:center; justify-content:center; color: var(--text-tertiary)">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
      </div>`;

    default:
      return `<div class="preview-input" style="color: var(--text-tertiary)">${question.type}</div>`;
  }
}

/* ================================================================
 * Question Selection → Right Panel
 * ================================================================ */
function selectQuestion(id, scrollIntoView = true) {
  state.selectedId = id;

  // Update card selection state
  document.querySelectorAll('.question-card').forEach(card => {
    const isSelected = card.dataset.questionId === id;
    card.classList.toggle('selected', isSelected);
  });

  // Show settings panel
  const question = state.form.questions.find(q => q.id === id);
  if (question) {
    showRightPanelSettings(question);
    if (scrollIntoView) {
      document.querySelector(`[data-question-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function showRightPanelEmpty() {
  document.getElementById('right-panel-empty').style.display = 'flex';
  document.getElementById('right-panel-settings').style.display = 'none';
}

function showRightPanelSettings(question) {
  document.getElementById('right-panel-empty').style.display = 'none';
  document.getElementById('right-panel-settings').style.display = 'block';

  renderGeneralSettings(question);
  renderValidationSettings(question);
  renderLogicSettings(question);
}

/* ================================================================
 * Settings Panel
 * ================================================================ */
function renderGeneralSettings(question) {
  const def  = QUESTION_TYPES[question.type];
  const tab  = document.getElementById('tab-general');
  if (!tab) return;

  let html = `
    <!-- Question type display -->
    <div style="display:flex; align-items:center; gap: var(--space-2); padding: var(--space-3); background: var(--bg-surface-2); border-radius: var(--radius-xl); margin-bottom: var(--space-4)">
      <div style="width:28px; height:28px; border-radius: var(--radius-lg); background: ${def?.color || '#8b5cf6'}15; color: ${def?.color || '#8b5cf6'}; display:flex; align-items:center; justify-content:center;">${def?.icon || ''}</div>
      <div>
        <div style="font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--text-primary)">${def?.label || question.type}</div>
        <div style="font-size: 10px; color: var(--text-tertiary)">Question type</div>
      </div>
    </div>
  `;

  // Type-specific settings
  if (['radio', 'checkbox', 'dropdown', 'image-choice'].includes(question.type)) {
    html += renderChoiceSettings(question);
  }

  if (['rating', 'stars'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label for="setting-max-rating">Maximum Rating</label>
        <input type="number" class="input input-sm" id="setting-max-rating" value="${question.maxRating || 5}" min="1" max="10" data-field="maxRating">
      </div>
    `;
  }

  if (['slider', 'linear-scale', 'nps'].includes(question.type)) {
    html += `
      <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4)">
        <div class="form-group" style="margin:0">
          <label>Min</label>
          <input type="number" class="input input-sm" value="${question.min !== undefined ? question.min : 0}" data-field="min">
        </div>
        <div class="form-group" style="margin:0">
          <label>Max</label>
          <input type="number" class="input input-sm" value="${question.max !== undefined ? question.max : 10}" data-field="max">
        </div>
      </div>
      <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4)">
        <div class="form-group" style="margin:0">
          <label>Min Label</label>
          <input type="text" class="input input-sm" placeholder="Not at all" value="${escapeHtml(question.minLabel || '')}" data-field="minLabel">
        </div>
        <div class="form-group" style="margin:0">
          <label>Max Label</label>
          <input type="text" class="input input-sm" placeholder="Extremely" value="${escapeHtml(question.maxLabel || '')}" data-field="maxLabel">
        </div>
      </div>
    `;
  }

  if (['matrix', 'likert'].includes(question.type)) {
    html += renderMatrixSettings(question);
  }

  if (['instruction', 'rich-text', 'code-block', 'custom-html', 'terms'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Content</label>
        <textarea class="textarea" rows="6" data-field="content" style="${question.type === 'code-block' ? 'font-family: var(--font-mono); font-size: var(--text-xs)' : ''}">${escapeHtml(question.content || '')}</textarea>
      </div>
    `;
  }

  if (question.type === 'video-embed') {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Video URL</label>
        <input type="url" class="input input-sm" placeholder="https://youtube.com/watch?v=..." value="${escapeHtml(question.videoUrl || '')}" data-field="videoUrl">
        <span class="field-hint">YouTube or Vimeo URL</span>
      </div>
    `;
  }

  if (question.type === 'file-upload' || question.type === 'image-upload') {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Max File Size (MB)</label>
        <input type="number" class="input input-sm" value="${question.maxSizeMb || 10}" min="1" max="100" data-field="maxSizeMb">
      </div>
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Max Files</label>
        <input type="number" class="input input-sm" value="${question.maxFiles || 1}" min="1" max="20" data-field="maxFiles">
      </div>
    `;
  }

  if (question.type === 'hidden-field') {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Default Value</label>
        <input type="text" class="input input-sm" placeholder="Value passed via URL param" value="${escapeHtml(question.defaultValue || '')}" data-field="defaultValue">
        <span class="field-hint">Use {param_name} to capture URL parameters</span>
      </div>
    `;
  }

  // Default value / placeholder
  if (['short-answer', 'paragraph', 'email', 'phone', 'website', 'number'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Placeholder</label>
        <input type="text" class="input input-sm" value="${escapeHtml(question.placeholder || '')}" data-field="placeholder">
      </div>
    `;
  }

  tab.innerHTML = html;

  // Bind all settings inputs
  tab.querySelectorAll('[data-field]').forEach(input => {
    const event = input.tagName === 'TEXTAREA' || input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(event, () => {
      const field = input.dataset.field;
      const value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
      updateQuestionField(question.id, field, value);
    });
  });

  // Re-bind choice editors
  if (['radio', 'checkbox', 'dropdown', 'image-choice'].includes(question.type)) {
    bindChoiceEditorEvents(question);
  }

  if (['matrix', 'likert'].includes(question.type)) {
    bindMatrixEditorEvents(question);
  }
}

function renderChoiceSettings(question) {
  const options = question.options || [];
  return `
    <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
      <label>Options</label>
      <div id="options-list">
        ${options.map((opt, i) => `
          <div class="option-item" data-option-index="${i}">
            <input type="text" class="input input-sm" value="${escapeHtml(opt.label || '')}" placeholder="Option ${i+1}" data-option-index="${i}">
            <button class="option-remove-btn" data-remove-option="${i}" aria-label="Remove option">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
      <button class="add-option-btn" id="add-option-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Add Option
      </button>
    </div>
    <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
      <label class="toggle-wrapper">
        <input type="checkbox" class="toggle-input" id="setting-allow-other" ${question.allowOther ? 'checked' : ''}>
        <div class="toggle-track"><div class="toggle-thumb"></div></div>
        <span class="toggle-label">Allow "Other" option</span>
      </label>
    </div>
    ${question.type === 'checkbox' ? `
    <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
      <label class="toggle-wrapper">
        <input type="checkbox" class="toggle-input" id="setting-allow-multiple" ${question.allowMultiple !== false ? 'checked' : ''}>
        <div class="toggle-track"><div class="toggle-thumb"></div></div>
        <span class="toggle-label">Allow multiple selections</span>
      </label>
    </div>` : ''}
    <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
      <label class="toggle-wrapper">
        <input type="checkbox" class="toggle-input" id="setting-randomize" ${question.randomize ? 'checked' : ''}>
        <div class="toggle-track"><div class="toggle-thumb"></div></div>
        <span class="toggle-label">Randomize option order</span>
      </label>
    </div>
  `;
}

function bindChoiceEditorEvents(question) {
  const addBtn = document.getElementById('add-option-btn');
  addBtn?.addEventListener('click', () => {
    if (!question.options) question.options = [];
    question.options.push({ id: generateId(), label: `Option ${question.options.length + 1}`, value: generateId() });
    markDirty();
    showRightPanelSettings(question);
    renderAnswerPreviewForQuestion(question.id);
  });

  document.querySelectorAll('[data-remove-option]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeOption);
      question.options.splice(idx, 1);
      markDirty();
      showRightPanelSettings(question);
      renderAnswerPreviewForQuestion(question.id);
    });
  });

  document.querySelectorAll('[data-option-index]').forEach(input => {
    if (input.tagName !== 'INPUT') return;
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.optionIndex);
      if (question.options[idx]) {
        question.options[idx].label = input.value;
        markDirty();
        renderAnswerPreviewForQuestion(question.id);
      }
    });
  });

  document.getElementById('setting-allow-other')?.addEventListener('change', e => {
    question.allowOther = e.target.checked;
    markDirty();
  });

  document.getElementById('setting-randomize')?.addEventListener('change', e => {
    question.randomize = e.target.checked;
    markDirty();
  });
}

function renderMatrixSettings(question) {
  const rows    = question.rows || [];
  const columns = question.columns || [];
  return `
    <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
      <label>Rows</label>
      <div id="matrix-rows">
        ${rows.map((row, i) => `
          <div class="option-item">
            <input type="text" class="input input-sm" value="${escapeHtml(row.label)}" data-matrix-row="${i}">
            <button class="option-remove-btn" data-remove-row="${i}" aria-label="Remove row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
      <button class="add-option-btn" id="add-matrix-row">+ Add Row</button>
    </div>
    <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
      <label>Columns</label>
      <div id="matrix-columns">
        ${columns.map((col, i) => `
          <div class="option-item">
            <input type="text" class="input input-sm" value="${escapeHtml(col.label)}" data-matrix-col="${i}">
            <button class="option-remove-btn" data-remove-col="${i}" aria-label="Remove column">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
      <button class="add-option-btn" id="add-matrix-col">+ Add Column</button>
    </div>
  `;
}

function bindMatrixEditorEvents(question) {
  document.getElementById('add-matrix-row')?.addEventListener('click', () => {
    if (!question.rows) question.rows = [];
    question.rows.push({ id: generateId(), label: `Row ${question.rows.length + 1}` });
    markDirty(); showRightPanelSettings(question);
  });

  document.getElementById('add-matrix-col')?.addEventListener('click', () => {
    if (!question.columns) question.columns = [];
    question.columns.push({ id: generateId(), label: `Column ${question.columns.length + 1}` });
    markDirty(); showRightPanelSettings(question);
  });
}

function renderValidationSettings(question) {
  const tab = document.getElementById('tab-validation');
  if (!tab) return;

  const v = question.validation || {};
  let html = '';

  if (['short-answer', 'paragraph', 'rich-text'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Min Length</label>
        <input type="number" class="input input-sm" value="${v.minLength || ''}" placeholder="No minimum" min="0" data-validation="minLength">
      </div>
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Max Length</label>
        <input type="number" class="input input-sm" value="${v.maxLength || ''}" placeholder="No limit" min="1" data-validation="maxLength">
      </div>
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Regex Pattern</label>
        <input type="text" class="input input-sm" value="${escapeHtml(v.regex || '')}" placeholder="e.g. ^[A-Z].*" data-validation="regex" style="font-family: var(--font-mono); font-size: var(--text-xs)">
        <span class="field-hint">Custom validation pattern</span>
      </div>
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Error Message</label>
        <input type="text" class="input input-sm" value="${escapeHtml(v.regexMessage || '')}" placeholder="Please enter a valid value" data-validation="regexMessage">
      </div>
    `;
  }

  if (['number', 'slider', 'linear-scale'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label class="toggle-wrapper">
          <input type="checkbox" class="toggle-input" ${v.integer ? 'checked' : ''} data-validation="integer">
          <div class="toggle-track"><div class="toggle-thumb"></div></div>
          <span class="toggle-label">Whole numbers only</span>
        </label>
      </div>
    `;
  }

  if (question.type === 'checkbox') {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Min Selections</label>
        <input type="number" class="input input-sm" value="${v.minChoices || ''}" placeholder="No minimum" min="0" data-validation="minChoices">
      </div>
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Max Selections</label>
        <input type="number" class="input input-sm" value="${v.maxChoices || ''}" placeholder="No limit" min="1" data-validation="maxChoices">
      </div>
    `;
  }

  if (['date', 'datetime'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Min Date</label>
        <input type="date" class="input input-sm" value="${v.minDate || ''}" data-validation="minDate">
      </div>
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Max Date</label>
        <input type="date" class="input input-sm" value="${v.maxDate || ''}" data-validation="maxDate">
      </div>
    `;
  }

  if (['file-upload', 'image-upload'].includes(question.type)) {
    html += `
      <div class="form-group" style="margin:0; margin-bottom: var(--space-4)">
        <label>Allowed Types</label>
        <input type="text" class="input input-sm" placeholder="image/*, .pdf, .docx" value="${escapeHtml((v.allowedTypes || []).join(', '))}" data-validation="allowedTypesStr">
        <span class="field-hint">Comma-separated MIME types or extensions</span>
      </div>
    `;
  }

  if (!html) {
    html = '<p style="font-size: var(--text-xs); color: var(--text-tertiary); text-align:center; padding: var(--space-6) 0">No validation options for this question type.</p>';
  }

  tab.innerHTML = html;

  tab.querySelectorAll('[data-validation]').forEach(input => {
    const field = input.dataset.validation;
    input.addEventListener('input', () => {
      if (!question.validation) question.validation = {};
      if (input.type === 'checkbox') {
        question.validation[field] = input.checked;
      } else if (field === 'allowedTypesStr') {
        question.validation.allowedTypes = input.value.split(',').map(s => s.trim()).filter(Boolean);
      } else if (input.type === 'number') {
        question.validation[field] = input.value ? Number(input.value) : undefined;
      } else {
        question.validation[field] = input.value || undefined;
      }
      markDirty();
    });
  });
}

function renderLogicSettings(question) {
  const tab = document.getElementById('tab-logic');
  if (!tab) return;

  const allQuestions = state.form.questions;
  const qIndex       = allQuestions.indexOf(question);

  tab.innerHTML = `
    <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: var(--space-4); line-height: var(--leading-relaxed)">
      Show or hide this question based on previous answers.
    </div>

    ${(question.logic || []).map((rule, i) => `
      <div class="card" style="padding: var(--space-3); margin-bottom: var(--space-3);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-2)">
          <span style="font-size: var(--text-xs); font-weight: var(--weight-semibold)">Rule ${i+1}</span>
          <button class="question-footer-btn danger" data-remove-rule="${i}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap: var(--space-2)">
          <select class="select" style="font-size: var(--text-xs)" data-rule="${i}" data-rule-field="questionId">
            ${allQuestions.slice(0, qIndex).map(q => `
              <option value="${q.id}" ${rule.questionId === q.id ? 'selected' : ''}>${escapeHtml(q.label || 'Untitled').substring(0,20)}</option>
            `).join('')}
          </select>
          <select class="select" style="font-size: var(--text-xs)" data-rule="${i}" data-rule-field="operator">
            <option value="equals" ${rule.operator === 'equals' ? 'selected' : ''}>equals</option>
            <option value="not-equals" ${rule.operator === 'not-equals' ? 'selected' : ''}>not equals</option>
            <option value="contains" ${rule.operator === 'contains' ? 'selected' : ''}>contains</option>
            <option value="not-contains" ${rule.operator === 'not-contains' ? 'selected' : ''}>not contains</option>
            <option value="is-empty" ${rule.operator === 'is-empty' ? 'selected' : ''}>is empty</option>
            <option value="not-empty" ${rule.operator === 'not-empty' ? 'selected' : ''}>not empty</option>
          </select>
          <input type="text" class="input" style="font-size: var(--text-xs)" value="${escapeHtml(rule.value || '')}" placeholder="Value" data-rule="${i}" data-rule-field="value">
        </div>
        <div style="margin-top: var(--space-2)">
          <select class="select" style="font-size: var(--text-xs)" data-rule="${i}" data-rule-field="action">
            <option value="show" ${rule.action === 'show' ? 'selected' : ''}>Show this question</option>
            <option value="hide" ${rule.action === 'hide' ? 'selected' : ''}>Hide this question</option>
            <option value="jump" ${rule.action === 'jump' ? 'selected' : ''}>Jump to question</option>
          </select>
        </div>
      </div>
    `).join('')}

    ${qIndex === 0 ? '<p style="font-size: var(--text-xs); color: var(--text-tertiary); text-align:center; padding: var(--space-4) 0">Logic rules are available for questions after the first one.</p>' : ''}

    ${qIndex > 0 ? `<button class="btn btn-secondary btn-sm w-full" id="add-logic-rule">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      Add Condition
    </button>` : ''}
  `;

  // Bind add rule
  document.getElementById('add-logic-rule')?.addEventListener('click', () => {
    if (!question.logic) question.logic = [];
    const prevQ = allQuestions[qIndex - 1];
    question.logic.push({ questionId: prevQ?.id || '', operator: 'equals', value: '', action: 'show' });
    markDirty();
    renderLogicSettings(question);
  });

  // Bind remove rules
  tab.querySelectorAll('[data-remove-rule]').forEach(btn => {
    btn.addEventListener('click', () => {
      question.logic.splice(parseInt(btn.dataset.removeRule), 1);
      markDirty();
      renderLogicSettings(question);
    });
  });

  // Bind rule field changes
  tab.querySelectorAll('[data-rule]').forEach(input => {
    input.addEventListener('change', () => {
      const idx   = parseInt(input.dataset.rule);
      const field = input.dataset.ruleField;
      if (!question.logic[idx]) return;
      question.logic[idx][field] = input.value;
      markDirty();
    });
  });
}

/* ================================================================
 * Settings Tab Switcher
 * ================================================================ */
function setupSettingsTabs() {
  document.getElementById('settings-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;

    document.querySelectorAll('#settings-tabs .tab-item').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    const tabId = btn.dataset.tab;
    ['tab-general', 'tab-validation', 'tab-logic'].forEach(id => {
      document.getElementById(id).style.display = id === `tab-${tabId}` ? 'block' : 'none';
    });
  });
}

/* ================================================================
 * Question Field Update
 * ================================================================ */
function updateQuestionField(id, field, value) {
  const question = state.form.questions.find(q => q.id === id);
  if (!question) return;

  question[field] = value;
  question.updatedAt = Date.now();
  state.form.updatedAt = Date.now();

  markDirty();

  // Re-render preview if options changed
  if (['label', 'options', 'maxRating', 'min', 'max'].includes(field)) {
    renderAnswerPreviewForQuestion(id);
  }

  // Update required star in card
  if (field === 'required') {
    const star = document.querySelector(`[data-question-id="${id}"] .question-required-star`);
    if (star) star.style.display = value ? '' : 'none';
  }
}

function renderAnswerPreviewForQuestion(id) {
  const question = state.form.questions.find(q => q.id === id);
  if (!question) return;
  const card = document.querySelector(`.question-card[data-question-id="${id}"] .question-answer-preview`);
  if (card) card.innerHTML = renderAnswerPreview(question);
}

/* ================================================================
 * Drag & Drop (Canvas reorder)
 * ================================================================ */
function setupDragDrop() {
  const canvas = document.getElementById('questions-list');
  if (!canvas) return;

  // Drop from question type picker
  canvas.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    showDropIndicator(e, canvas);
  });

  canvas.addEventListener('dragleave', e => {
    if (!canvas.contains(e.relatedTarget)) {
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    }
  });

  canvas.addEventListener('drop', e => {
    e.preventDefault();
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

    const questionType = e.dataTransfer.getData('text/plain');
    const questionId   = e.dataTransfer.getData('application/question-id');

    if (questionType && !questionId) {
      // New question from picker
      addQuestion(questionType);
    } else if (questionId) {
      // Reorder existing question
      const targetCard = e.target.closest('.question-card');
      if (targetCard && targetCard.dataset.questionId !== questionId) {
        moveQuestion(questionId, targetCard.dataset.questionId, getDropPosition(e, targetCard));
      }
    }
  });

  // Also make the placeholder a drop target
  const placeholder = document.getElementById('add-question-placeholder');
  if (placeholder) {
    placeholder.addEventListener('dragover', e => {
      e.preventDefault();
      placeholder.style.borderColor = 'var(--brand-primary)';
    });
    placeholder.addEventListener('dragleave', () => {
      placeholder.style.borderColor = '';
    });
    placeholder.addEventListener('drop', e => {
      e.preventDefault();
      placeholder.style.borderColor = '';
      const type = e.dataTransfer.getData('text/plain');
      if (type) addQuestion(type);
    });
  }
}

function showDropIndicator(e, canvas) {
  document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

  const cards = canvas.querySelectorAll('.question-card');
  let insertBefore = null;

  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (e.clientY < rect.top + rect.height / 2) {
      insertBefore = card;
      break;
    }
  }

  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';

  if (insertBefore) {
    canvas.insertBefore(indicator, insertBefore);
  } else {
    canvas.appendChild(indicator);
  }
}

function getDropPosition(e, targetCard) {
  const rect = targetCard.getBoundingClientRect();
  return e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
}

/* ================================================================
 * Topbar Setup
 * ================================================================ */
function setupTopbar() {
  // Form title sync (topbar → canvas)
  const titleInput = document.getElementById('form-title-input');
  const descInput  = document.getElementById('form-desc-input');
  const titleDisplay = document.getElementById('form-header-title');
  const descDisplay  = document.getElementById('form-header-desc');

  titleInput?.addEventListener('input', () => {
    state.form.title = titleInput.value;
    if (titleDisplay) titleDisplay.textContent = titleInput.value;
    markDirty();
  });

  descInput?.addEventListener('input', () => {
    state.form.description = descInput.value;
    if (descDisplay) descDisplay.textContent = descInput.value;
    markDirty();
  });

  // Canvas header → topbar sync
  titleDisplay?.addEventListener('input', () => {
    const text = titleDisplay.textContent;
    state.form.title = text;
    if (titleInput) titleInput.value = text;
    markDirty();
  });

  descDisplay?.addEventListener('input', () => {
    const text = descDisplay.textContent;
    state.form.description = text;
    if (descInput) descInput.value = text;
    markDirty();
  });

  // Undo/Redo
  document.getElementById('undo-btn')?.addEventListener('click', undo);
  document.getElementById('redo-btn')?.addEventListener('click', redo);

  // Preview
  document.getElementById('preview-btn')?.addEventListener('click', openPreview);

  // Quick add first question
  document.getElementById('quick-add-btn')?.addEventListener('click', () => addQuestion('short-answer'));
  document.getElementById('add-more-btn')?.addEventListener('click', () => addQuestion('short-answer'));

  // Publish
  document.getElementById('publish-btn')?.addEventListener('click', togglePublish);

  // Share button
  document.getElementById('builder-share-btn')?.addEventListener('click', () => {
    const url = `${window.location.origin}/form.html?id=${state.form.id}`;
    navigator.clipboard.writeText(url).then(() => {
      Toast.success('Link copied!', 'Share this URL with respondents.');
    });
  });
}

/* ================================================================
 * Device Switcher
 * ================================================================ */
function setupDeviceSwitcher() {
  document.querySelectorAll('.preview-device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preview-device-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.device = btn.dataset.device;
      const canvas = document.getElementById('builder-canvas');
      if (canvas) canvas.dataset.device = state.device;
    });
  });
}

/* ================================================================
 * Preview
 * ================================================================ */
function openPreview() {
  const modal  = document.getElementById('preview-modal');
  const iframe = document.getElementById('preview-iframe');
  modal.hidden = false;

  // Pass form as URL fragment (for same-origin preview)
  const formJson = encodeURIComponent(JSON.stringify(state.form));
  iframe.src = `form.html?preview=1&formData=${formJson}`;
}

document.getElementById('close-preview-btn')?.addEventListener('click', () => {
  document.getElementById('preview-modal').hidden = true;
  document.getElementById('preview-iframe').src = '';
});

document.getElementById('preview-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('preview-modal')) {
    document.getElementById('preview-modal').hidden = true;
    document.getElementById('preview-iframe').src = '';
  }
});

// Preview device switcher in modal
document.getElementById('preview-device-tabs')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-device]');
  if (!btn) return;
  document.querySelectorAll('#preview-device-tabs .tab-item').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const frame = document.getElementById('preview-device-frame');
  if (frame) frame.dataset.device = btn.dataset.device;
});

/* ================================================================
 * Publish
 * ================================================================ */
async function togglePublish() {
  const wasPublished = state.form.status === 'published';
  state.form.status = wasPublished ? 'draft' : 'published';
  state.form.updatedAt = Date.now();

  document.getElementById('publish-label').textContent = state.form.status === 'published' ? 'Unpublish' : 'Publish';

  // Save
  await saveForm();

  Toast.success(
    state.form.status === 'published' ? 'Form Published!' : 'Form Unpublished',
    state.form.status === 'published' ? `Your form is now live at: form.html?id=${state.form.id}` : ''
  );
}

/* ================================================================
 * Theme Picker
 * ================================================================ */
function setupThemePicker() {
  const THEMES = [
    { id: 'light',          label: 'Light',         bg: 'linear-gradient(135deg, #ffffff, #f4f4f5)' },
    { id: 'dark',           label: 'Dark',           bg: 'linear-gradient(135deg, #18181b, #27272a)' },
    { id: 'glassmorphism',  label: 'Glass',          bg: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2)), #0d0d1a' },
    { id: 'neumorphism',    label: 'Neumorphic',     bg: 'linear-gradient(135deg, #e0e5ec, #d1d9e6)' },
    { id: 'cyberpunk',      label: 'Cyberpunk',      bg: 'linear-gradient(135deg, #050510, #00f5ff33)' },
    { id: 'aurora',         label: 'Aurora',         bg: 'linear-gradient(135deg, #030a14, #00e5b033)' },
    { id: 'luxury',         label: 'Luxury',         bg: 'linear-gradient(135deg, #0a0800, #d4af3733)' },
  ];

  function renderThemeGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = THEMES.map(t => `
      <div class="theme-option ${state.form?.settings?.theme === t.id ? 'selected' : ''}" data-theme-id="${t.id}">
        <div class="theme-option-preview" style="background: ${t.bg}"></div>
        <div class="theme-option-label">${t.label}</div>
        <div class="theme-option-check">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.theme-option').forEach(el => {
      el.addEventListener('click', () => {
        const themeId = el.dataset.themeId;
        if (state.form?.settings) state.form.settings.theme = themeId;
        container.querySelectorAll('.theme-option').forEach(t => t.classList.remove('selected'));
        el.classList.add('selected');
        markDirty();
        // Apply to form header preview
        const colorBar = document.getElementById('form-color-bar');
        if (colorBar) {
          colorBar.style.background = themeId === 'dark' ? '#27272a' :
            themeId === 'glassmorphism' ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' :
            'var(--brand-gradient)';
        }
      });
    });
  }

  document.getElementById('theme-picker-btn')?.addEventListener('click', () => {
    renderThemeGrid('theme-picker-grid');
    openModal('theme-picker-modal');
  });

  // Close theme picker modal
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });

  // Theme picker also in form settings design tab
  renderThemeGrid('settings-theme-grid');
}

/* ================================================================
 * Form Settings Modal
 * ================================================================ */
function setupFormSettings() {
  document.getElementById('form-settings-btn')?.addEventListener('click', () => {
    syncFormSettingsToUI();
    openModal('form-settings-modal');
  });

  // Settings tabs
  document.getElementById('form-settings-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    document.querySelectorAll('#form-settings-tabs .tab-item').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.settings-section').forEach(s => {
      s.style.display = s.id === tabId ? 'flex' : 'none';
    });
  });

  // Password protect toggle
  document.getElementById('setting-password-protect')?.addEventListener('change', e => {
    document.getElementById('password-field-wrap').style.display = e.target.checked ? 'block' : 'none';
  });

  // Generate embed code
  const embedCode = document.getElementById('setting-embed-code');
  if (embedCode) {
    const formUrl = `${window.location.origin}/form.html?id=${state.form?.id}`;
    embedCode.value = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0"></iframe>`;
  }

  document.getElementById('copy-embed-btn')?.addEventListener('click', async () => {
    const code = document.getElementById('setting-embed-code').value;
    await navigator.clipboard.writeText(code);
    Toast.success('Copied!', 'Embed code copied to clipboard.');
  });

  // Save settings
  document.getElementById('save-form-settings-btn')?.addEventListener('click', () => {
    syncUIToFormSettings();
    closeModal('form-settings-modal');
    markDirty();
    saveForm();
    Toast.success('Settings saved!');
  });
}

function syncFormSettingsToUI() {
  const s = state.form?.settings || {};
  document.getElementById('setting-title').value = state.form?.title || '';
  document.getElementById('setting-desc').value  = state.form?.description || '';
  if (s.language) document.getElementById('setting-lang').value = s.language;
  document.getElementById('setting-progress').checked   = s.showProgress || false;
  document.getElementById('setting-est-time').checked   = s.showEstTime || false;
  document.getElementById('setting-response-limit').value = s.responseLimit || '';
  document.getElementById('setting-expiry').value       = s.expiry || '';
  document.getElementById('setting-dedup').checked      = s.dedup || false;
  document.getElementById('setting-draft-save').checked = s.draftSave !== false;
  document.getElementById('setting-confirmation-msg').value = s.confirmationMsg || '';
  document.getElementById('setting-redirect-url').value = s.redirectUrl || '';
  document.getElementById('setting-email-notify').checked  = s.emailNotify || false;
  document.getElementById('setting-notify-email').value    = s.notifyEmail || '';
  document.getElementById('setting-accent-color').value   = s.accentColor || '#8b5cf6';
  document.getElementById('setting-logo-url').value        = s.logoUrl || '';
  document.getElementById('setting-custom-css').value      = s.customCss || '';
  document.getElementById('setting-password-protect').checked = s.passwordProtect || false;
  document.getElementById('setting-password').value        = s.password || '';
  document.getElementById('password-field-wrap').style.display = s.passwordProtect ? 'block' : 'none';
}

function syncUIToFormSettings() {
  state.form.title       = document.getElementById('setting-title').value;
  state.form.description = document.getElementById('setting-desc').value;
  const s = state.form.settings = state.form.settings || {};
  s.language        = document.getElementById('setting-lang').value;
  s.showProgress    = document.getElementById('setting-progress').checked;
  s.showEstTime     = document.getElementById('setting-est-time').checked;
  s.responseLimit   = document.getElementById('setting-response-limit').value || null;
  s.expiry          = document.getElementById('setting-expiry').value || null;
  s.dedup           = document.getElementById('setting-dedup').checked;
  s.draftSave       = document.getElementById('setting-draft-save').checked;
  s.confirmationMsg = document.getElementById('setting-confirmation-msg').value;
  s.redirectUrl     = document.getElementById('setting-redirect-url').value;
  s.emailNotify     = document.getElementById('setting-email-notify').checked;
  s.notifyEmail     = document.getElementById('setting-notify-email').value;
  s.accentColor     = document.getElementById('setting-accent-color').value;
  s.logoUrl         = document.getElementById('setting-logo-url').value;
  s.customCss       = document.getElementById('setting-custom-css').value;
  s.passwordProtect = document.getElementById('setting-password-protect').checked;
  s.password        = document.getElementById('setting-password').value;

  // Sync form header display
  renderForm();
}

/* ================================================================
 * Modals
 * ================================================================ */
function setupModals() {
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = true;
}

/* ================================================================
 * Canvas drag from left panel
 * ================================================================ */
function setupCanvas() {
  const canvas = document.getElementById('builder-canvas-wrap');
  if (!canvas) return;

  canvas.addEventListener('dragover', e => e.preventDefault());
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (type && QUESTION_TYPES[type]) {
      addQuestion(type);
    }
  });
}

/* ================================================================
 * Keyboard Shortcuts
 * ================================================================ */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const tag = e.target.tagName;
    const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target.isContentEditable;

    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault(); undo(); return;
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault(); redo(); return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault(); saveForm(); return;
    }
    if (isEditing) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedId) removeQuestion(state.selectedId);
    }
    if (e.key === 'Escape') {
      state.selectedId = null;
      document.querySelectorAll('.question-card').forEach(c => c.classList.remove('selected'));
      showRightPanelEmpty();
    }
  });
}

/* ================================================================
 * Undo / Redo
 * ================================================================ */
function pushHistory() {
  // Truncate future history
  state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);

  const snapshot = JSON.stringify(state.form);
  state.historyStack.push(snapshot);

  // Max 50 steps
  if (state.historyStack.length > 50) state.historyStack.shift();

  state.historyIndex = state.historyStack.length - 1;
  updateHistoryButtons();
}

function undo() {
  if (state.historyIndex <= 0) return;
  state.historyIndex--;
  state.form = JSON.parse(state.historyStack[state.historyIndex]);
  renderForm();
  markDirty();
  updateHistoryButtons();
}

function redo() {
  if (state.historyIndex >= state.historyStack.length - 1) return;
  state.historyIndex++;
  state.form = JSON.parse(state.historyStack[state.historyIndex]);
  renderForm();
  markDirty();
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn) undoBtn.disabled = state.historyIndex <= 0;
  if (redoBtn) redoBtn.disabled = state.historyIndex >= state.historyStack.length - 1;
}

/* ================================================================
 * Autosave
 * ================================================================ */
function markDirty() {
  state.dirty = true;
  const status = document.getElementById('save-status');
  if (status) {
    status.className = 'builder-save-status';
    status.querySelector('.save-text').textContent = 'Unsaved changes';
  }
}

function startAutosave() {
  state.autosaveTimer = setInterval(async () => {
    if (state.dirty) await saveForm(true);
  }, 3000);
}

async function saveForm(silent = false) {
  if (!state.form) return;

  const status = document.getElementById('save-status');
  if (status) {
    status.className = 'builder-save-status saving';
    status.querySelector('.save-text').textContent = 'Saving...';
  }

  state.form.updatedAt = Date.now();
  state.form.questionCount = state.form.questions.length;

  // Save locally
  await FormStorage.save(state.form);

  // Sync to API (fire and forget)
  API.forms.update(state.form.id, state.form).catch(() => {});

  state.dirty = false;

  if (status) {
    status.className = 'builder-save-status saved';
    status.querySelector('.save-text').textContent = 'Saved';
  }

  if (!silent) {
    EventBus.emit(Events.BUILDER_AUTOSAVED);
    Toast.success('Saved', '', { duration: 1500 });
  }
}

/* ================================================================
 * Helpers
 * ================================================================ */
function generateId() {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`;
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
