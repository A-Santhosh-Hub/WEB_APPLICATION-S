/**
 * SanStudio Forms — Analytics Page Logic
 * ========================================
 */

import { API }           from '../core/api.js';
import { FormStorage }   from '../core/storage.js';
import { Toast }         from '../components/toast.js';
import { escapeHtml }    from '../utils/sanitizer.js';

const state = {
  formId:    new URLSearchParams(window.location.search).get('formId') || '',
  forms:     [],
  analytics: null,
  rangeDays: 30,
  chart:     null,
};

/* ================================================================
 * Init
 * ================================================================ */
export async function init() {
  await loadForms();

  setupFormSelector();
  setupDateRangeSelector();

  if (state.formId) {
    await loadAnalytics(state.formId);
  } else if (state.forms.length > 0) {
    // If no form selected, load first form's analytics for now
    state.formId = state.forms[0].id;
    updateFormLabel(state.forms[0].title);
    await loadAnalytics(state.formId);
  } else {
    showEmptyState();
  }

  // Load Chart.js dynamically
  await loadChartJs();
  if (state.analytics) renderChart();
}

/* ================================================================
 * Load Chart.js
 * ================================================================ */
function loadChartJs() {
  return new Promise((resolve) => {
    if (window.Chart) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = resolve;
    script.onerror = () => {
      console.error('Failed to load Chart.js');
      resolve(); // fail gracefully
    };
    document.head.appendChild(script);
  });
}

/* ================================================================
 * Load Forms
 * ================================================================ */
async function loadForms() {
  state.forms = await FormStorage.loadAll();
  const result = await API.forms.list();
  if (result.ok && result.data?.length > 0) {
    state.forms = result.data.filter(f => f.status !== 'deleted');
  }
}

function setupFormSelector() {
  const dropdown = document.getElementById('analytics-form-dropdown');

  dropdown.innerHTML = state.forms.map(f => `
    <button class="dropdown-item" data-form-id="${f.id}" role="option" aria-selected="${f.id === state.formId}">
      ${escapeHtml(f.title || 'Untitled Form')}
    </button>
  `).join('');

  document.getElementById('analytics-form-btn')?.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  dropdown.querySelectorAll('[data-form-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      dropdown.hidden = true;
      state.formId = btn.dataset.formId;
      updateFormLabel(btn.textContent);
      history.replaceState(null, '', `?formId=${state.formId}`);
      await loadAnalytics(state.formId);
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#analytics-form-wrap')) dropdown.hidden = true;
  });

  if (state.formId) {
    const selected = state.forms.find(f => f.id === state.formId);
    if (selected) updateFormLabel(selected.title);
  }
}

function updateFormLabel(title) {
  document.getElementById('analytics-form-label').textContent = title || 'Select Form';
  document.getElementById('analytics-subtitle').textContent = title || 'Select a form to view insights';
}

function setupDateRangeSelector() {
  const btn = document.getElementById('date-range-btn');
  const dropdown = document.getElementById('date-range-dropdown');
  const label = document.getElementById('date-range-label');

  btn?.addEventListener('click', () => dropdown.hidden = !dropdown.hidden);
  document.addEventListener('click', e => {
    if (!e.target.closest('#date-range-wrap')) dropdown.hidden = true;
  });

  dropdown?.querySelectorAll('.date-range-option').forEach(opt => {
    opt.addEventListener('click', () => {
      dropdown.querySelectorAll('.date-range-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      label.textContent = opt.textContent;
      dropdown.hidden = true;
      
      const val = opt.dataset.range;
      state.rangeDays = val === 'all' ? Infinity : parseInt(val);
      if (state.analytics) {
        renderChart();
      }
    });
  });
}

/* ================================================================
 * Load Analytics
 * ================================================================ */
async function loadAnalytics(formId) {
  if (!formId) return;

  const result = await API.analytics.get(formId);
  if (result.ok && result.data) {
    state.analytics = result.data;
    renderDashboard();
  } else {
    Toast.error('Failed to load analytics', result.error);
    showEmptyState();
  }
}

function showEmptyState() {
  document.getElementById('a-total').textContent = '—';
  document.getElementById('a-completion').textContent = '—';
  document.getElementById('a-duration').textContent = '—';
  document.getElementById('a-last').textContent = '—';
  document.getElementById('question-analytics-grid').innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-tertiary)">No data available</div>';
}

/* ================================================================
 * Render Dashboard
 * ================================================================ */
function renderDashboard() {
  const a = state.analytics;
  if (!a) return;

  // Overview Stats
  document.getElementById('a-total').textContent = a.totalResponses || 0;
  document.getElementById('a-completion').textContent = `${a.completionRate || 0}%`;
  
  const d = a.avgDuration || 0;
  document.getElementById('a-duration').textContent = d > 60 ? `${Math.floor(d/60)}m ${d%60}s` : `${d}s`;
  
  document.getElementById('a-last').textContent = a.lastResponse 
    ? new Date(a.lastResponse).toLocaleDateString()
    : 'Never';

  // Chart
  renderChart();

  // Question Insights
  renderQuestionInsights();
}

function renderChart() {
  if (!window.Chart || !state.analytics) return;

  const daily = state.analytics.dailyData || [];
  
  // Filter by range
  const now = Date.now();
  const filtered = state.rangeDays === Infinity ? daily : daily.filter(d => {
    return (now - new Date(d.date).getTime()) <= (state.rangeDays * 24 * 60 * 60 * 1000);
  });

  const canvas = document.getElementById('submissions-chart');
  const empty  = document.getElementById('chart-empty');

  if (filtered.length === 0) {
    canvas.style.display = 'none';
    empty.style.display  = 'block';
    return;
  }

  canvas.style.display = 'block';
  empty.style.display  = 'none';

  const labels = filtered.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const data   = filtered.map(d => d.count);

  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const brandColor = cssVar('--brand-primary') || '#8b5cf6';
  const textColor  = cssVar('--text-secondary') || '#71717a';
  const gridColor  = cssVar('--border-subtle') || '#f4f4f5';

  if (state.chart) {
    state.chart.destroy();
  }

  state.chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Submissions',
        data,
        borderColor: brandColor,
        backgroundColor: brandColor + '33', // 20% opacity
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: brandColor,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--card-bg'),
          titleColor: cssVar('--text-primary'),
          bodyColor: cssVar('--text-secondary'),
          borderColor: cssVar('--card-border'),
          borderWidth: 1,
          padding: 12,
          displayColors: false,
        }
      },
      scales: {
        x: { 
          grid: { display: false, drawBorder: false },
          ticks: { color: textColor, font: { family: 'inherit' } }
        },
        y: {
          grid: { color: gridColor, drawBorder: false },
          ticks: { color: textColor, font: { family: 'inherit' }, precision: 0, beginAtZero: true }
        }
      }
    }
  });
}

function renderQuestionInsights() {
  const grid  = document.getElementById('question-analytics-grid');
  const stats = state.analytics?.questionStats || {};
  
  const questionIds = Object.keys(stats);
  if (questionIds.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: var(--space-8); color: var(--text-tertiary)">No insights available yet.</div>';
    return;
  }

  grid.innerHTML = questionIds.map(id => {
    const s = stats[id];
    let content = '';

    if (s.frequencies) {
      // Choice questions
      content = `
        <div class="insight-bars">
          ${s.frequencies.map(f => `
            <div class="insight-bar-row">
              <div class="insight-bar-label">
                <span class="insight-bar-name" title="${escapeHtml(f.label)}">${escapeHtml(f.label)}</span>
                <span class="insight-bar-val">${f.pct}% (${f.count})</span>
              </div>
              <div class="insight-bar-track">
                <div class="insight-bar-fill" style="width: ${f.pct}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (s.avg !== undefined) {
      // Numeric/Rating
      content = `
        <div class="insight-stats-grid">
          <div class="insight-stat-mini">
            <div class="val">${s.avg}</div>
            <div class="lbl">Average</div>
          </div>
          <div class="insight-stat-mini">
            <div class="val">${s.median}</div>
            <div class="lbl">Median</div>
          </div>
          <div class="insight-stat-mini">
            <div class="val">${s.min} – ${s.max}</div>
            <div class="lbl">Range</div>
          </div>
        </div>
      `;
    } else if (s.avgLength !== undefined) {
      // Text
      content = `
        <div class="insight-stats-grid">
          <div class="insight-stat-mini">
            <div class="val">${s.avgLength}</div>
            <div class="lbl">Avg. Characters</div>
          </div>
        </div>
      `;
    } else {
      content = `<div style="font-size: var(--text-sm); color: var(--text-tertiary)">Insights not available for this question type.</div>`;
    }

    return `
      <div class="card insight-card">
        <h3 class="insight-q-title">${escapeHtml(s.questionLabel || s.questionId)}</h3>
        <div class="insight-q-meta">${s.totalAnswers} answers (${s.completionRate}% completion)</div>
        <div class="insight-q-content">
          ${content}
        </div>
      </div>
    `;
  }).join('');
}

// Re-render chart on theme change
window.addEventListener('theme:changed', () => {
  if (state.analytics && window.Chart) renderChart();
});

init();
