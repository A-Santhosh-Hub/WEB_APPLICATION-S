/**
 * SanStudio Forms — Form Submission Page Logic
 * ==============================================
 * Handles loading the form definition, rendering questions,
 * collecting answers, validation, pagination, and submission.
 */

import { API }              from '../core/api.js';
import { ResponseStorage }  from '../core/storage.js';
import { Toast }            from '../components/toast.js';
import { validatePage }     from '../utils/validators.js';
import { sanitizeAnswers, escapeHtml } from '../utils/sanitizer.js';

/* ================================================================
 * State
 * ================================================================ */
const state = {
  form:       null,
  answers:    {},
  errors:     {},
  page:       0,          // Current page (0-indexed)
  pages:      [],         // Array of question arrays per page
  startTime:  Date.now(),
  submitted:  false,
};

/* ================================================================
 * Init
 * ================================================================ */
export async function init() {
  const params = new URLSearchParams(window.location.search);
  const formId = params.get('id');
  const preview= params.get('preview') === '1';
  const formData=params.get('formData');

  if (preview && formData) {
    // Preview mode — load form from URL param
    try {
      state.form = JSON.parse(decodeURIComponent(formData));
      initForm();
    } catch {
      showError('Invalid form data in preview URL.');
    }
    return;
  }

  if (!formId) {
    showError('No form ID provided in the URL.');
    return;
  }

  await loadForm(formId);
}

/* ================================================================
 * Load Form
 * ================================================================ */
async function loadForm(formId) {
  showLoading();

  // Try API
  const result = await API.forms.get(formId);

  if (result.ok && result.data) {
    state.form = result.data;
  } else {
    // Load from localStorage fallback (if offline, not configured, or form not synced to API yet)
    const { FormStorage } = await import('../core/storage.js');
    state.form = await FormStorage.load(formId);
  }

  if (!state.form) {
    showError('Form not found. The link may be incorrect or the form has been removed.');
    return;
  }

  initForm();
}

/* ================================================================
 * Initialize Form
 * ================================================================ */
function initForm() {
  const form = state.form;

  // Apply theme
  if (form.settings?.theme) {
    document.documentElement.dataset.theme = form.settings.theme;
  }

  // Check if form is accepting responses
  if (form.status !== 'published' && !isPreview()) {
    showClosed(form.settings?.closedMessage || 'This form is no longer accepting responses.');
    return;
  }

  // Check expiry
  if (form.settings?.expiry && Date.now() > new Date(form.settings.expiry).getTime()) {
    showClosed('This form has expired and is no longer accepting responses.');
    return;
  }

  // Check password protection
  if (form.settings?.passwordProtect && form.settings?.password) {
    showPasswordModal(form.settings.password);
    return;
  }

  renderForm();
}

/* ================================================================
 * Render Form
 * ================================================================ */
function renderForm() {
  const form = state.form;

  hideLoading();
  document.getElementById('form-container').style.display = 'block';

  // Title & description
  document.title = `${form.title || 'Form'} — SanStudio Forms`;
  document.getElementById('form-title').textContent = form.title || 'Untitled Form';

  const descEl = document.getElementById('form-description');
  if (form.description) {
    descEl.textContent = form.description;
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }

  // Logo
  if (form.settings?.logoUrl) {
    const logoWrap = document.getElementById('form-logo-wrap');
    const logoImg  = document.getElementById('form-logo');
    logoImg.src    = form.settings.logoUrl;
    logoWrap.style.display = 'block';
  }

  // Progress bar
  if (form.settings?.showProgress) {
    document.getElementById('form-progress-bar').style.display = 'block';
  }

  // Estimated time
  if (form.settings?.showEstTime) {
    const qCount   = (form.questions || []).length;
    const estMins  = Math.max(1, Math.round(qCount * 0.3));
    document.getElementById('form-est-time').style.display = 'flex';
    document.getElementById('form-est-time-text').textContent = `~${estMins} min to complete`;
  }

  // Color strip
  const strip = document.getElementById('form-color-strip');
  if (strip) strip.style.background = getAccentColor(form);

  // Build pages (split on page-break questions)
  buildPages();

  // Check for saved draft
  checkForDraft();

  // Render first page
  renderPage(0);
  setupNavigation();

  // Draft save
  if (form.settings?.draftSave) {
    document.getElementById('form-save-draft').style.display = 'flex';
  }

  // Submit another
  document.getElementById('form-submit-another-btn')?.addEventListener('click', () => {
    state.answers  = {};
    state.errors   = {};
    state.page     = 0;
    state.submitted = false;
    document.getElementById('form-success').style.display   = 'none';
    document.getElementById('form-container').style.display = 'block';
    renderPage(0);
  });

  // Timer
  state.startTime = Date.now();
}

/* ================================================================
 * Build Pages (split questions on page-break)
 * ================================================================ */
function buildPages() {
  const questions = state.form.questions || [];
  const pages     = [];
  let current     = [];

  questions.forEach(q => {
    if (q.type === 'page-break') {
      if (current.length > 0) pages.push(current);
      current = [];
    } else {
      current.push(q);
    }
  });

  if (current.length > 0) pages.push(current);
  if (pages.length === 0)  pages.push([]);

  state.pages = pages;
}

/* ================================================================
 * Render Page
 * ================================================================ */
function renderPage(pageIdx) {
  state.page      = pageIdx;
  const area      = document.getElementById('form-questions-area');
  const questions = state.pages[pageIdx] || [];

  area.innerHTML = '';

  // Apply conditional logic
  const visible = questions.filter(q => isQuestionVisible(q));

  visible.forEach((question, index) => {
    const el = createQuestionElement(question, index);
    area.appendChild(el);
  });

  // Show validation errors if any
  Object.keys(state.errors).forEach(qId => {
    showFieldError(qId, state.errors[qId]);
  });

  updateProgress();
  updateNavigation();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
 * Question Element Factory
 * ================================================================ */
function createQuestionElement(question, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'question-wrapper animate-fade-up';
  wrapper.dataset.questionId = question.id;
  wrapper.style.animationDelay = `${index * 60}ms`;

  const isRequired = question.required;
  const hasError   = state.errors[question.id];

  wrapper.innerHTML = `
    <div class="question-block${hasError ? ' question-error' : ''}">
      <div class="question-label-row">
        <label class="question-label" for="q-${escapeHtml(question.id)}">
          ${escapeHtml(question.label || '')}
          ${isRequired ? '<span class="required-star" aria-label="Required">*</span>' : ''}
        </label>
      </div>
      ${question.subLabel ? `<p class="question-sublabel">${escapeHtml(question.subLabel)}</p>` : ''}
      <div class="question-input-area" id="input-${question.id}">
        ${renderInput(question)}
      </div>
      <p class="field-error" id="error-${question.id}" style="display:none" role="alert"></p>
    </div>
  `;

  // Bind input events
  bindInputEvents(wrapper, question);

  return wrapper;
}

/* ================================================================
 * Input Renderers
 * ================================================================ */
function renderInput(question) {
  const val = state.answers[question.id];

  switch (question.type) {
    case 'short-answer':
    case 'password':
      return `<input
        type="${question.type === 'password' ? 'password' : 'text'}"
        class="input"
        id="q-${question.id}"
        name="${question.id}"
        placeholder="${escapeHtml(question.placeholder || '')}"
        value="${escapeHtml(val || '')}"
        ${question.required ? 'required' : ''}
        autocomplete="${question.type === 'email' ? 'email' : question.type === 'password' ? 'new-password' : 'off'}"
      >`;

    case 'email':
      return `<input type="email" class="input" id="q-${question.id}" name="${question.id}"
        placeholder="${escapeHtml(question.placeholder || 'email@example.com')}"
        value="${escapeHtml(val || '')}" ${question.required ? 'required' : ''} autocomplete="email">`;

    case 'phone':
      return `<input type="tel" class="input" id="q-${question.id}" name="${question.id}"
        placeholder="${escapeHtml(question.placeholder || '+1 (555) 000-0000')}"
        value="${escapeHtml(val || '')}" ${question.required ? 'required' : ''} autocomplete="tel">`;

    case 'website':
      return `<input type="url" class="input" id="q-${question.id}" name="${question.id}"
        placeholder="${escapeHtml(question.placeholder || 'https://')}"
        value="${escapeHtml(val || '')}" ${question.required ? 'required' : ''}>`;

    case 'number':
      return `<input type="number" class="input" id="q-${question.id}" name="${question.id}"
        placeholder="${escapeHtml(question.placeholder || '0')}"
        value="${val !== undefined ? val : ''}"
        ${question.min !== undefined ? `min="${question.min}"` : ''}
        ${question.max !== undefined ? `max="${question.max}"` : ''}
        ${question.required ? 'required' : ''}>`;

    case 'paragraph':
    case 'rich-text':
      return `<textarea class="textarea" id="q-${question.id}" name="${question.id}"
        placeholder="${escapeHtml(question.placeholder || 'Your answer...')}"
        rows="${question.minRows || 4}"
        ${question.required ? 'required' : ''}>${escapeHtml(val || '')}</textarea>`;

    case 'dropdown':
      return `<select class="select" id="q-${question.id}" name="${question.id}" ${question.required ? 'required' : ''}>
        <option value="">Select an option...</option>
        ${(question.options || []).map(opt => `
          <option value="${escapeHtml(opt.value || opt.label)}" ${val === (opt.value || opt.label) ? 'selected' : ''}>
            ${escapeHtml(opt.label)}
          </option>
        `).join('')}
      </select>`;

    case 'radio':
      const radioOpts = question.randomize
        ? shuffleArray([...(question.options || [])])
        : (question.options || []);
      return radioOpts.map(opt => `
        <label class="choice-option" for="q-${question.id}-${escapeHtml(opt.id || opt.label)}">
          <input type="radio"
            id="q-${question.id}-${escapeHtml(opt.id || opt.label)}"
            name="${question.id}"
            value="${escapeHtml(opt.value || opt.label)}"
            ${val === (opt.value || opt.label) ? 'checked' : ''}
            ${question.required ? 'required' : ''}
          >
          <span>${escapeHtml(opt.label)}</span>
        </label>
      `).join('') + (question.allowOther ? renderOtherOption(question.id, 'radio', val) : '');

    case 'checkbox':
      const checkOpts = question.randomize
        ? shuffleArray([...(question.options || [])])
        : (question.options || []);
      const checkedVals = Array.isArray(val) ? val : (val ? [val] : []);
      return checkOpts.map(opt => `
        <label class="choice-option" for="q-${question.id}-${escapeHtml(opt.id || opt.label)}">
          <input type="checkbox"
            id="q-${question.id}-${escapeHtml(opt.id || opt.label)}"
            name="${question.id}"
            value="${escapeHtml(opt.value || opt.label)}"
            ${checkedVals.includes(opt.value || opt.label) ? 'checked' : ''}
          >
          <span>${escapeHtml(opt.label)}</span>
        </label>
      `).join('') + (question.allowOther ? renderOtherOption(question.id, 'checkbox', val) : '');

    case 'date':
      return `<input type="date" class="input" id="q-${question.id}" name="${question.id}"
        value="${escapeHtml(val || '')}"
        ${question.validation?.minDate ? `min="${question.validation.minDate}"` : ''}
        ${question.validation?.maxDate ? `max="${question.validation.maxDate}"` : ''}
        ${question.required ? 'required' : ''}>`;

    case 'time':
      return `<input type="time" class="input" id="q-${question.id}" name="${question.id}"
        value="${escapeHtml(val || '')}" ${question.required ? 'required' : ''}>`;

    case 'datetime':
      return `<input type="datetime-local" class="input" id="q-${question.id}" name="${question.id}"
        value="${escapeHtml(val || '')}" ${question.required ? 'required' : ''}>`;

    case 'rating':
    case 'stars':
      const max = question.maxRating || 5;
      const currentRating = Number(val) || 0;
      return `<div class="star-rating" id="q-${question.id}" role="radiogroup" aria-label="${escapeHtml(question.label)}">
        ${Array.from({length: max}, (_, i) => `
          <button type="button" class="star-btn ${currentRating >= i+1 ? 'active' : ''}" data-value="${i+1}" aria-label="${i+1} star${i+1>1?'s':''}">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="${currentRating >= i+1 ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        `).join('')}
      </div>`;

    case 'emoji-rating':
      const emojis = question.emojis || ['😞','😐','🙂','😊','🤩'];
      return `<div class="emoji-rating" id="q-${question.id}" role="radiogroup">
        ${emojis.map((em, i) => `
          <button type="button" class="emoji-btn ${val === String(i+1) ? 'active' : ''}" data-value="${i+1}" aria-label="Rating ${i+1}" title="${em}">
            <span>${em}</span>
          </button>
        `).join('')}
      </div>`;

    case 'slider':
    case 'linear-scale':
      const sliderMin = question.min !== undefined ? question.min : 0;
      const sliderMax = question.max !== undefined ? question.max : 10;
      const sliderVal = val !== undefined ? val : question.defaultValue || sliderMin;
      return `
        <div class="slider-wrap">
          <div class="slider-labels">
            <span>${escapeHtml(question.minLabel || String(sliderMin))}</span>
            <span class="slider-current-val" id="slider-val-${question.id}">${sliderVal}</span>
            <span>${escapeHtml(question.maxLabel || String(sliderMax))}</span>
          </div>
          <input type="range" class="slider" id="q-${question.id}" name="${question.id}"
            min="${sliderMin}" max="${sliderMax}" step="${question.step || 1}"
            value="${sliderVal}">
        </div>`;

    case 'nps':
      return `<div class="nps-grid" id="q-${question.id}" role="radiogroup" aria-label="NPS Score">
        <div class="nps-labels">
          <span>${escapeHtml(question.minLabel || 'Not likely')}</span>
          <span>${escapeHtml(question.maxLabel || 'Extremely likely')}</span>
        </div>
        <div class="nps-buttons">
          ${Array.from({length: 11}, (_, i) => `
            <button type="button" class="nps-btn ${val == i ? 'active' : ''}" data-value="${i}" aria-label="${i}">${i}</button>
          `).join('')}
        </div>
      </div>`;

    case 'file-upload':
    case 'image-upload':
      return `<div class="file-upload-area" id="q-${question.id}">
        <div class="file-drop-zone" id="drop-${question.id}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color: var(--text-tertiary)"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <p>Drop files here or</p>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer; margin-top: var(--space-2)">
            Choose File
            <input type="file" id="file-${question.id}"
              ${question.type === 'image-upload' ? 'accept="image/*"' : ''}
              ${(question.maxFiles || 1) > 1 ? 'multiple' : ''}
              style="display:none">
          </label>
          <div class="file-list" id="file-list-${question.id}"></div>
        </div>
      </div>`;

    case 'signature':
      return `<div class="signature-wrap">
        <canvas class="signature-canvas" id="q-${question.id}" width="560" height="150" aria-label="Signature pad"></canvas>
        <div class="signature-actions">
          <button type="button" class="btn btn-ghost btn-xs" id="clear-sig-${question.id}">Clear</button>
          <span style="font-size: var(--text-xs); color: var(--text-tertiary)">Sign with mouse or touch</span>
        </div>
      </div>`;

    case 'location':
      return `<div class="location-input">
        <button type="button" class="btn btn-secondary btn-sm" id="locate-btn-${question.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Detect my location
        </button>
        <div class="location-result" id="location-${question.id}" style="display:none; margin-top: var(--space-2); font-size: var(--text-sm); color: var(--text-secondary)"></div>
        ${question.allowManual ? `<input type="text" class="input" style="margin-top: var(--space-3)" placeholder="Or enter location manually" id="location-text-${question.id}" value="${escapeHtml(val?.address || '')}">` : ''}
      </div>`;

    case 'color-picker':
      return `<div style="display:flex; align-items:center; gap: var(--space-3)">
        <input type="color" class="input" id="q-${question.id}" style="width:60px;height:44px;cursor:pointer;padding:2px"
          value="${escapeHtml(val || question.defaultColor || '#8b5cf6')}">
        <span style="font-family: var(--font-mono); font-size: var(--text-sm)" id="color-val-${question.id}">${val || question.defaultColor || '#8b5cf6'}</span>
      </div>`;

    case 'matrix':
    case 'likert':
      const rows    = question.rows    || [];
      const columns = question.columns || [];
      const matVal  = val || {};
      return `<div class="matrix-wrap" style="overflow-x:auto">
        <table class="matrix-table" role="grid" aria-label="${escapeHtml(question.label)}">
          <thead>
            <tr>
              <th></th>
              ${columns.map(c => `<th scope="col">${escapeHtml(c.label)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <th scope="row">${escapeHtml(row.label)}</th>
                ${columns.map(col => `
                  <td>
                    <input type="radio"
                      name="${question.id}-row-${row.id}"
                      value="${escapeHtml(col.id)}"
                      ${matVal[row.id] === col.id ? 'checked' : ''}
                      aria-label="${escapeHtml(row.label)} - ${escapeHtml(col.label)}">
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;

    case 'terms':
      return `<label class="choice-option" for="q-${question.id}" style="align-items:flex-start">
        <input type="checkbox" id="q-${question.id}" name="${question.id}" ${val ? 'checked' : ''} ${question.required ? 'required' : ''}>
        <span style="font-size: var(--text-sm)">${escapeHtml(question.content || 'I agree to the terms and conditions')}</span>
      </label>`;

    case 'captcha':
      return `<div class="captcha-box">
        <label class="choice-option" for="q-${question.id}">
          <input type="checkbox" id="q-${question.id}" name="${question.id}" ${val ? 'checked' : ''}>
          <span>I'm not a robot</span>
        </label>
      </div>`;

    case 'hidden-field':
      const urlVal = new URLSearchParams(window.location.search).get(question.defaultValue?.replace('{','').replace('}',''));
      const hidVal = urlVal || question.defaultValue || '';
      // Auto-save hidden field value
      state.answers[question.id] = hidVal;
      return `<input type="hidden" id="q-${question.id}" value="${escapeHtml(hidVal)}">`;

    case 'section-break':
      return `<hr style="border-color: var(--border-subtle); margin: var(--space-2) 0">`;

    case 'instruction':
    case 'rich-text':
      return `<div class="instruction-text">${question.content ? escapeHtml(question.content) : ''}</div>`;

    case 'video-embed':
      const videoId = extractYouTubeId(question.videoUrl || '');
      if (videoId) {
        return `<div style="aspect-ratio:16/9;border-radius:var(--radius-xl);overflow:hidden">
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" allowfullscreen loading="lazy" title="Embedded video" frameborder="0"></iframe>
        </div>`;
      }
      return `<p style="font-size: var(--text-sm); color: var(--text-tertiary)">Video unavailable.</p>`;

    case 'audio-embed':
      return `<audio controls style="width:100%;border-radius:var(--radius-xl)" src="${escapeHtml(question.audioUrl || '')}">Your browser does not support audio.</audio>`;

    case 'custom-html':
      // Custom HTML is sanitized before rendering
      return `<div class="custom-html-block">${question.content || ''}</div>`;

    default:
      return `<input type="text" class="input" id="q-${question.id}" value="${escapeHtml(val || '')}">`;
  }
}

function renderOtherOption(questionId, type, val) {
  return `
    <label class="choice-option" for="q-${questionId}-other">
      <input type="${type}" id="q-${questionId}-other" name="${questionId}" value="__other__">
      <span>Other</span>
    </label>
    <input type="text" class="input other-input" id="other-text-${questionId}" placeholder="Please specify..." style="margin-top: var(--space-2); display:none">
  `;
}

/* ================================================================
 * Bind Input Events
 * ================================================================ */
function bindInputEvents(wrapper, question) {
  // Text/number/select inputs
  wrapper.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="file"]), select, textarea').forEach(input => {
    const update = () => {
      let value = input.value;
      if (input.type === 'number') value = value ? Number(value) : undefined;
      state.answers[question.id] = value;
      clearFieldError(question.id);
    };
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  });

  // Radio inputs
  wrapper.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      state.answers[question.id] = radio.value;
      clearFieldError(question.id);
      // Show/hide other text
      if (radio.value === '__other__') {
        wrapper.querySelector(`#other-text-${question.id}`)?.style.setProperty('display', 'block');
      } else {
        const otherText = wrapper.querySelector(`#other-text-${question.id}`);
        if (otherText) otherText.style.display = 'none';
      }
    });
  });

  // Checkbox inputs
  wrapper.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (question.type === 'checkbox') {
        const checked = [...wrapper.querySelectorAll('input[type="checkbox"]:checked')]
          .map(c => c.value).filter(v => v !== '__other__');
        state.answers[question.id] = checked;
      } else {
        state.answers[question.id] = cb.checked;
      }
      clearFieldError(question.id);
    });
  });

  // Star rating
  const starRating = wrapper.querySelector('.star-rating');
  if (starRating) {
    const starBtns = starRating.querySelectorAll('.star-btn');
    starBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const val = Number(btn.dataset.value);
        state.answers[question.id] = val;
        starBtns.forEach((b, i) => {
          const svg = b.querySelector('svg');
          if (i < val) {
            b.classList.add('active');
            if (svg) svg.setAttribute('fill', 'currentColor');
          } else {
            b.classList.remove('active');
            if (svg) svg.setAttribute('fill', 'none');
          }
        });
        clearFieldError(question.id);
      });
      btn.addEventListener('mouseenter', () => {
        const hoverVal = Number(btn.dataset.value);
        starBtns.forEach((b, i) => b.classList.toggle('hover', i < hoverVal));
      });
      starRating.addEventListener('mouseleave', () => {
        starBtns.forEach(b => b.classList.remove('hover'));
      });
    });
  }

  // Emoji rating
  wrapper.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.answers[question.id] = btn.dataset.value;
      clearFieldError(question.id);
    });
  });

  // Slider
  const slider = wrapper.querySelector(`#q-${question.id}[type="range"]`);
  if (slider) {
    const valDisplay = wrapper.querySelector(`#slider-val-${question.id}`);
    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      state.answers[question.id] = v;
      if (valDisplay) valDisplay.textContent = v;
      clearFieldError(question.id);
    });
    // Set initial
    if (state.answers[question.id] === undefined) {
      state.answers[question.id] = Number(slider.value);
    }
  }

  // NPS
  wrapper.querySelectorAll('.nps-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrapper.querySelectorAll('.nps-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.answers[question.id] = Number(btn.dataset.value);
      clearFieldError(question.id);
    });
  });

  // Color picker
  const colorInput = wrapper.querySelector(`#q-${question.id}[type="color"]`);
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      state.answers[question.id] = colorInput.value;
      const display = wrapper.querySelector(`#color-val-${question.id}`);
      if (display) display.textContent = colorInput.value;
    });
    state.answers[question.id] = colorInput.value;
  }

  // Location
  const locateBtn = wrapper.querySelector(`#locate-btn-${question.id}`);
  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      locateBtn.disabled = true;
      locateBtn.textContent = 'Detecting...';
      navigator.geolocation?.getCurrentPosition(
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
          state.answers[question.id] = loc;
          const display = wrapper.querySelector(`#location-${question.id}`);
          if (display) {
            display.style.display = 'block';
            display.textContent = `📍 ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (±${Math.round(loc.accuracy)}m)`;
          }
          locateBtn.disabled = false;
          locateBtn.innerHTML = '✅ Location detected';
          clearFieldError(question.id);
        },
        () => {
          locateBtn.disabled = false;
          locateBtn.textContent = 'Detect my location';
          Toast.error('Location unavailable', 'Please allow location access or enter manually.');
        }
      );
    });
  }

  // File upload
  const fileInput = wrapper.querySelector(`#file-${question.id}`);
  if (fileInput) {
    const dropZone = wrapper.querySelector(`#drop-${question.id}`);
    const fileList = wrapper.querySelector(`#file-list-${question.id}`);

    const handleFiles = (files) => {
      state.answers[question.id] = Array.from(files);
      if (fileList) {
        fileList.innerHTML = Array.from(files).map(f =>
          `<div style="font-size: var(--text-xs); color: var(--text-secondary); margin-top: var(--space-1)">📄 ${escapeHtml(f.name)} (${(f.size/1024).toFixed(1)} KB)</div>`
        ).join('');
      }
      clearFieldError(question.id);
    };

    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    if (dropZone) {
      dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
      });
    }
  }

  // Matrix inputs
  wrapper.querySelectorAll('[name^="' + question.id + '-row-"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const rowId = radio.name.replace(question.id + '-row-', '');
      if (!state.answers[question.id]) state.answers[question.id] = {};
      state.answers[question.id][rowId] = radio.value;
      clearFieldError(question.id);
    });
  });

  // Signature canvas
  const canvas = wrapper.querySelector(`#q-${question.id}.signature-canvas`);
  if (canvas) {
    initSignatureCanvas(canvas, question.id);
    wrapper.querySelector(`#clear-sig-${question.id}`)?.addEventListener('click', () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      state.answers[question.id] = null;
    });
  }
}

function initSignatureCanvas(canvas, questionId) {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  canvas.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
  canvas.addEventListener('mousemove', e => {
    if (!drawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });
  canvas.addEventListener('mouseup',   () => { drawing = false; state.answers[questionId] = canvas.toDataURL(); });
  canvas.addEventListener('mouseleave',() => { drawing = false; });

  // Touch support
  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; ctx.beginPath(); const t = e.touches[0]; const r = canvas.getBoundingClientRect(); ctx.moveTo(t.clientX - r.left, t.clientY - r.top); });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const t = e.touches[0]; const r = canvas.getBoundingClientRect(); ctx.lineTo(t.clientX - r.left, t.clientY - r.top); ctx.stroke(); });
  canvas.addEventListener('touchend', () => { drawing = false; state.answers[questionId] = canvas.toDataURL(); });

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';
}

/* ================================================================
 * Conditional Logic
 * ================================================================ */
function isQuestionVisible(question) {
  const logic = question.logic;
  if (!logic || logic.length === 0) return true;

  // Evaluate all rules — ALL must pass for "show"
  for (const rule of logic) {
    const answer  = state.answers[rule.questionId];
    const passes  = evaluateRule(rule, answer);

    if (rule.action === 'show' && !passes) return false;
    if (rule.action === 'hide' && passes)  return false;
  }

  return true;
}

function evaluateRule(rule, answer) {
  const a = String(answer || '').toLowerCase();
  const v = String(rule.value || '').toLowerCase();

  switch (rule.operator) {
    case 'equals':      return a === v;
    case 'not-equals':  return a !== v;
    case 'contains':    return a.includes(v);
    case 'not-contains':return !a.includes(v);
    case 'is-empty':    return !answer || answer === '';
    case 'not-empty':   return !!(answer && answer !== '');
    default:            return true;
  }
}

/* ================================================================
 * Navigation
 * ================================================================ */
function setupNavigation() {
  document.getElementById('form-prev-btn')?.addEventListener('click', () => {
    if (state.page > 0) renderPage(state.page - 1);
  });

  document.getElementById('form-next-btn')?.addEventListener('click', () => {
    if (validateCurrentPage()) {
      renderPage(state.page + 1);
    } else {
      scrollToFirstError();
    }
  });

  document.getElementById('form-submit-btn')?.addEventListener('click', submitForm);

  document.getElementById('save-draft-btn')?.addEventListener('click', saveDraft);
  document.getElementById('load-draft-btn')?.addEventListener('click', loadDraft);
}

function updateNavigation() {
  const prevBtn   = document.getElementById('form-prev-btn');
  const nextBtn   = document.getElementById('form-next-btn');
  const submitBtn = document.getElementById('form-submit-btn');
  const pageInd   = document.getElementById('form-page-indicator');
  const isLast    = state.page === state.pages.length - 1;
  const isMulti   = state.pages.length > 1;

  if (prevBtn)   prevBtn.style.display   = isMulti && state.page > 0 ? 'flex' : 'none';
  if (nextBtn)   nextBtn.style.display   = isMulti && !isLast ? 'flex' : 'none';
  if (submitBtn) submitBtn.style.display = isLast ? 'flex' : 'none';

  if (isMulti && pageInd) {
    pageInd.style.display = 'flex';
    document.getElementById('page-current').textContent = state.page + 1;
    document.getElementById('page-total').textContent   = state.pages.length;
  }
}

function updateProgress() {
  const fill = document.getElementById('form-progress-fill');
  if (!fill) return;
  const pct = state.pages.length <= 1
    ? Object.keys(state.answers).length > 0 ? 50 : 0
    : Math.round(state.page / state.pages.length * 100);
  fill.style.width = `${pct}%`;
}

/* ================================================================
 * Validation
 * ================================================================ */
function validateCurrentPage() {
  const questions = (state.pages[state.page] || []).filter(q => isQuestionVisible(q));
  const errors    = validatePage(questions, state.answers);
  state.errors    = {};

  let valid = true;
  errors.forEach((result, qId) => {
    state.errors[qId] = result.error;
    showFieldError(qId, result.error);
    valid = false;
  });

  return valid;
}

function showFieldError(qId, message) {
  const el = document.getElementById(`error-${qId}`);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
  const block = document.querySelector(`[data-question-id="${qId}"] .question-block`);
  block?.classList.add('question-error');
}

function clearFieldError(qId) {
  const el = document.getElementById(`error-${qId}`);
  if (el) el.style.display = 'none';
  const block = document.querySelector(`[data-question-id="${qId}"] .question-block`);
  block?.classList.remove('question-error');
  delete state.errors[qId];
}

function scrollToFirstError() {
  const firstError = document.querySelector('.question-error');
  firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ================================================================
 * Submit
 * ================================================================ */
async function submitForm() {
  // Validate current page
  if (!validateCurrentPage()) {
    scrollToFirstError();
    return;
  }

  const submitBtn = document.getElementById('form-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="animate-spin" style="display:inline-block">⟳</span> Submitting...`;

  const sanitized = sanitizeAnswers(state.answers);
  const duration  = Math.round((Date.now() - state.startTime) / 1000);

  const result = await API.responses.submit(state.form.id, sanitized, {
    duration,
    userAgent: navigator.userAgent,
    referrer:  document.referrer,
  });

  if (result.ok || result.queued) {
    // Save locally too
    await ResponseStorage.save({
      id:          `r_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
      formId:      state.form.id,
      submittedAt: Date.now(),
      duration,
      answers:     sanitized,
      synced:      result.ok,
    });

    showSuccess();

    // Redirect if configured
    if (state.form.settings?.redirectUrl) {
      setTimeout(() => {
        window.location.href = state.form.settings.redirectUrl;
      }, 2000);
    }
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      Submit
    `;
    Toast.error('Submission failed', result.error || 'Please try again.');
  }
}

/* ================================================================
 * Draft
 * ================================================================ */
function saveDraft() {
  localStorage.setItem(`sanforms:draft:${state.form.id}`, JSON.stringify({
    answers: state.answers,
    page:    state.page,
    savedAt: Date.now(),
  }));
  Toast.success('Draft saved', 'Your answers have been saved. You can continue later.');
  document.getElementById('load-draft-btn').style.display = 'inline-flex';
}

function loadDraft() {
  try {
    const raw  = localStorage.getItem(`sanforms:draft:${state.form.id}`);
    if (!raw) return;
    const draft = JSON.parse(raw);
    state.answers = draft.answers || {};
    renderPage(draft.page || 0);
    Toast.info('Draft loaded', 'Your saved answers have been restored.');
  } catch {
    Toast.error('Could not load draft', 'Draft data may be corrupted.');
  }
}

function checkForDraft() {
  const raw = localStorage.getItem(`sanforms:draft:${state.form.id}`);
  if (raw) {
    document.getElementById('load-draft-btn').style.display = 'inline-flex';
  }
}

/* ================================================================
 * Password Modal
 * ================================================================ */
function showPasswordModal(correctPassword) {
  const modal = document.getElementById('password-modal');
  modal.hidden = false;

  document.getElementById('submit-password-btn')?.addEventListener('click', () => {
    const input = document.getElementById('form-password-input').value;
    if (input === correctPassword) {
      modal.hidden = true;
      renderForm();
    } else {
      document.getElementById('password-error').style.display = 'block';
    }
  });

  document.getElementById('form-password-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('submit-password-btn').click();
  });
}

/* ================================================================
 * UI States
 * ================================================================ */
function showLoading() {
  document.getElementById('form-loading').style.display = 'flex';
  document.getElementById('form-container').style.display = 'none';
  document.getElementById('form-error-state').style.display = 'none';
}

function hideLoading() {
  document.getElementById('form-loading').style.display = 'none';
}

function showError(message) {
  hideLoading();
  document.getElementById('form-error-state').style.display = 'flex';
  document.getElementById('form-error-desc').textContent = message;
}

function showSuccess() {
  document.getElementById('form-container').style.display = 'none';
  const success = document.getElementById('form-success');
  success.style.display = 'flex';
  const desc = document.getElementById('form-success-desc');
  if (desc) desc.textContent = state.form.settings?.confirmationMsg || 'Thank you for your response!';
}

function showClosed(message) {
  hideLoading();
  document.getElementById('form-closed').style.display = 'flex';
  const desc = document.getElementById('form-closed-desc');
  if (desc) desc.textContent = message;
}

/* ================================================================
 * Utilities
 * ================================================================ */
function isPreview() {
  return new URLSearchParams(window.location.search).get('preview') === '1';
}

function getAccentColor(form) {
  const color = form.color || 'purple';
  const colors = {
    purple: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    blue:   'linear-gradient(135deg, #3b82f6, #06b6d4)',
    green:  'linear-gradient(135deg, #10b981, #34d399)',
    orange: 'linear-gradient(135deg, #f59e0b, #f97316)',
    rose:   'linear-gradient(135deg, #f43f5e, #e11d48)',
  };
  return colors[color] || form.settings?.accentColor || colors.purple;
}

function extractYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Boot
init();
