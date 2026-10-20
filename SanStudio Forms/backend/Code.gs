/**
 * SanStudio Forms — Google Apps Script Backend
 * ==============================================
 * Deploy this as a Google Apps Script Web App.
 * Set execution to "Me" and access to "Anyone".
 * 
 * Architecture:
 *  - One master spreadsheet with a "Forms" sheet (form registry)
 *  - Each form's responses go into a separate sheet named by formId
 *  - Questions stored as JSON in the Forms registry sheet
 * 
 * API Endpoints (via ?action=...):
 *  POST /exec?action=createForm       → Creates a new form
 *  GET  /exec?action=listForms        → List all forms
 *  GET  /exec?action=getForm&id=...   → Get form by ID
 *  POST /exec?action=updateForm       → Update form
 *  POST /exec?action=deleteForm       → Move form to trash
 *  POST /exec?action=submitResponse   → Submit a form response
 *  GET  /exec?action=getResponses&formId=... → Get responses
 *  GET  /exec?action=getAnalytics&formId=... → Get analytics
 *  POST /exec?action=duplicateForm    → Duplicate a form
 *  GET  /exec?action=exportCSV&formId=... → Export CSV
 *  POST /exec?action=publishForm      → Publish/unpublish form
 */

/* ================================================================
 * Configuration
 * ================================================================ */

var CONFIG = {
  SPREADSHEET_ID:    null, // Set via PropertiesService or leave null to use active SS
  FORMS_SHEET_NAME:  'SanForms_Registry',
  RESPONSE_PREFIX:   'Responses_',
  MAX_RESPONSES:     50000,
  RATE_LIMIT_SECS:   30,    // Per IP cooldown
  VERSION:           '1.0.0',
};

/* ================================================================
 * Entry Points
 * ================================================================ */

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    var params  = (method === 'GET') ? e.parameter : JSON.parse(e.postData?.contents || '{}');
    var action  = e.parameter?.action || params.action;
    var token   = e.parameter?.token || params.token;

    // CORS headers
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (!action) {
      return respond({ ok: false, error: 'No action specified' }, 400);
    }

    // Route
    var result = route(action, params, method, e);
    return respond(result);

  } catch (err) {
    return respond({ ok: false, error: err.message, stack: err.stack }, 500);
  }
}

function route(action, params, method, e) {
  switch (action) {
    case 'ping':          return { ok: true, version: CONFIG.VERSION, time: new Date().toISOString() };
    case 'createForm':    return createForm(params);
    case 'listForms':     return listForms(params);
    case 'getForm':       return getForm(params);
    case 'updateForm':    return updateForm(params);
    case 'deleteForm':    return deleteForm(params);
    case 'duplicateForm': return duplicateForm(params);
    case 'publishForm':   return publishForm(params);
    case 'submitResponse':return submitResponse(params, e);
    case 'getResponses':  return getResponses(params);
    case 'deleteResponse':return deleteResponse(params);
    case 'getAnalytics':  return getAnalytics(params);
    case 'exportCSV':     return exportCSV(params);
    default:              return { ok: false, error: 'Unknown action: ' + action };
  }
}

function respond(data, code) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================================================================
 * Spreadsheet Helpers
 * ================================================================ */

function getSpreadsheet() {
  var id = CONFIG.SPREADSHEET_ID ||
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  return id
    ? SpreadsheetApp.openById(id)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getRegistrySheet() {
  var sheet = getOrCreateSheet(CONFIG.FORMS_SHEET_NAME);

  // Initialize headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'id', 'title', 'description', 'status', 'color', 'questionCount',
      'responseCount', 'completionRate', 'createdAt', 'updatedAt',
      'settings', 'questions', 'pinned',
    ]);
    sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#f3f0ff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getResponseSheet(formId) {
  var name  = CONFIG.RESPONSE_PREFIX + formId;
  var sheet = getOrCreateSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'id', 'formId', 'submittedAt', 'duration', 'ip',
      'userAgent', 'referrer', 'synced', 'answers',
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f3f0ff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/* ================================================================
 * Registry — Form CRUD
 * ================================================================ */

function createForm(params) {
  var form = params.form || params;
  if (!form.id)     form.id       = generateId();
  if (!form.title)  form.title    = 'Untitled Form';
  form.createdAt   = form.createdAt || Date.now();
  form.updatedAt   = Date.now();
  form.status      = form.status || 'draft';
  form.responseCount   = 0;
  form.completionRate  = 0;
  form.questionCount   = (form.questions || []).length;

  var sheet = getRegistrySheet();
  sheet.appendRow([
    form.id,
    form.title,
    form.description || '',
    form.status,
    form.color || 'purple',
    form.questionCount,
    0,  // responseCount
    0,  // completionRate
    form.createdAt,
    form.updatedAt,
    JSON.stringify(form.settings || {}),
    JSON.stringify(form.questions || []),
    form.pinned ? 'true' : 'false',
  ]);

  return { ok: true, data: form };
}

function listForms(params) {
  var sheet = getRegistrySheet();
  var rows  = sheet.getDataRange().getValues();
  if (rows.length <= 1) return { ok: true, data: [] };

  var forms = rows.slice(1)
    .filter(row => row[3] !== 'deleted') // exclude deleted
    .map(row => parseFormRow(row));

  // Sort by updatedAt desc
  forms.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  return { ok: true, data: forms };
}

function getForm(params) {
  if (!params.id) return { ok: false, error: 'id required' };

  var sheet = getRegistrySheet();
  var rows  = sheet.getDataRange().getValues();
  var row   = rows.slice(1).find(r => r[0] === params.id);

  if (!row) return { ok: false, error: 'Form not found' };

  return { ok: true, data: parseFormRow(row) };
}

function updateForm(params) {
  var id   = params.id || (params.form && params.form.id);
  var data = params.form || params;

  if (!id) return { ok: false, error: 'id required' };

  var sheet  = getRegistrySheet();
  var rows   = sheet.getDataRange().getValues();
  var rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === id);

  if (rowIdx === -1) return { ok: false, error: 'Form not found' };

  var sheetRow = rowIdx + 1;  // 1-indexed, +1 for header
  var existing = parseFormRow(rows[rowIdx]);
  var updated  = Object.assign({}, existing, data, { id, updatedAt: Date.now() });

  if (data.questions) updated.questionCount = data.questions.length;

  sheet.getRange(sheetRow, 1, 1, 13).setValues([[
    updated.id,
    updated.title || '',
    updated.description || '',
    updated.status || 'draft',
    updated.color || 'purple',
    updated.questionCount || 0,
    updated.responseCount || 0,
    updated.completionRate || 0,
    updated.createdAt || Date.now(),
    updated.updatedAt,
    JSON.stringify(updated.settings || {}),
    JSON.stringify(updated.questions || []),
    updated.pinned ? 'true' : 'false',
  ]]);

  return { ok: true, data: updated };
}

function deleteForm(params) {
  if (!params.id) return { ok: false, error: 'id required' };

  // Soft delete — mark as deleted
  var updateResult = updateForm({ id: params.id, status: 'deleted' });
  if (!updateResult.ok) return updateResult;

  return { ok: true, message: 'Form moved to trash' };
}

function duplicateForm(params) {
  var result = getForm(params);
  if (!result.ok) return result;

  var original = result.data;
  var copy     = JSON.parse(JSON.stringify(original));
  copy.id          = generateId();
  copy.title       = (original.title || 'Untitled') + ' (copy)';
  copy.status      = 'draft';
  copy.responseCount   = 0;
  copy.completionRate  = 0;
  copy.createdAt   = Date.now();
  copy.updatedAt   = Date.now();
  copy.pinned      = false;

  return createForm({ form: copy });
}

function publishForm(params) {
  if (!params.id) return { ok: false, error: 'id required' };
  var current  = getForm(params);
  if (!current.ok) return current;
  var newStatus = current.data.status === 'published' ? 'draft' : 'published';
  return updateForm({ id: params.id, status: newStatus });
}

function parseFormRow(row) {
  var settings  = {};
  var questions = [];

  try { settings  = JSON.parse(row[10] || '{}'); } catch {}
  try { questions = JSON.parse(row[11] || '[]'); } catch {}

  return {
    id:             row[0],
    title:          row[1],
    description:    row[2],
    status:         row[3],
    color:          row[4],
    questionCount:  Number(row[5]) || 0,
    responseCount:  Number(row[6]) || 0,
    completionRate: Number(row[7]) || 0,
    createdAt:      Number(row[8]) || 0,
    updatedAt:      Number(row[9]) || 0,
    settings,
    questions,
    pinned:         row[12] === 'true',
  };
}

/* ================================================================
 * Responses
 * ================================================================ */

function submitResponse(params, e) {
  var formId = params.formId;
  if (!formId) return { ok: false, error: 'formId required' };

  // Check form exists and is published
  var formResult = getForm({ id: formId });
  if (!formResult.ok) return formResult;

  var form = formResult.data;
  if (form.status !== 'published') {
    return { ok: false, error: 'This form is not currently accepting responses.' };
  }

  // Check response limit
  if (form.settings?.responseLimit) {
    if (form.responseCount >= parseInt(form.settings.responseLimit)) {
      return { ok: false, error: 'This form has reached its response limit.' };
    }
  }

  // Check expiry
  if (form.settings?.expiry && Date.now() > new Date(form.settings.expiry).getTime()) {
    return { ok: false, error: 'This form has expired.' };
  }

  // Build response object
  var response = {
    id:          generateId(),
    formId,
    submittedAt: Date.now(),
    duration:    params.duration || 0,
    ip:          params.ip || getClientIp(e),
    userAgent:   params.userAgent || '',
    referrer:    params.referrer || '',
    synced:      true,
    answers:     params.answers || {},
  };

  // Append to response sheet
  var sheet = getResponseSheet(formId);
  sheet.appendRow([
    response.id,
    response.formId,
    response.submittedAt,
    response.duration,
    response.ip,
    response.userAgent,
    response.referrer,
    'true',
    JSON.stringify(response.answers),
  ]);

  // Update form stats
  updateFormStats(formId);

  // Send notification email if configured
  if (form.settings?.emailNotify && form.settings?.notifyEmail) {
    sendNotificationEmail(form, response);
  }

  return { ok: true, data: { id: response.id, submittedAt: response.submittedAt } };
}

function getResponses(params) {
  var formId = params.formId;
  if (!formId) return { ok: false, error: 'formId required' };

  var sheet = getResponseSheet(formId);
  if (sheet.getLastRow() <= 1) return { ok: true, data: [] };

  var rows      = sheet.getDataRange().getValues();
  var responses = rows.slice(1).map(row => {
    var answers = {};
    try { answers = JSON.parse(row[8] || '{}'); } catch {}
    return {
      id:          row[0],
      formId:      row[1],
      submittedAt: Number(row[2]) || 0,
      duration:    Number(row[3]) || 0,
      ip:          row[4],
      userAgent:   row[5],
      referrer:    row[6],
      synced:      row[7] === 'true',
      answers,
    };
  });

  // Pagination
  var page    = parseInt(params.page || 1);
  var perPage = parseInt(params.perPage || 100);
  var start   = (page - 1) * perPage;
  var end     = start + perPage;

  return {
    ok: true,
    data: responses.slice(start, end),
    total: responses.length,
    page,
    perPage,
    hasMore: end < responses.length,
  };
}

function deleteResponse(params) {
  var formId = params.formId;
  var id     = params.id;
  if (!formId || !id) return { ok: false, error: 'formId and id required' };

  var sheet = getResponseSheet(formId);
  var rows  = sheet.getDataRange().getValues();
  var rowIdx = rows.findIndex((r, i) => i > 0 && r[0] === id);

  if (rowIdx === -1) return { ok: false, error: 'Response not found' };

  sheet.deleteRow(rowIdx + 1);
  updateFormStats(formId);

  return { ok: true };
}

function updateFormStats(formId) {
  try {
    var sheet = getResponseSheet(formId);
    var count = Math.max(0, sheet.getLastRow() - 1);

    updateForm({ id: formId, responseCount: count });
  } catch (e) {
    // Non-critical
  }
}

/* ================================================================
 * Analytics
 * ================================================================ */

function getAnalytics(params) {
  var formId = params.formId;
  if (!formId) return { ok: false, error: 'formId required' };

  var formResult = getForm({ id: formId });
  if (!formResult.ok) return formResult;
  var form = formResult.data;

  var responseResult = getResponses({ formId, perPage: 10000 });
  var responses = responseResult.ok ? responseResult.data : [];

  if (responses.length === 0) {
    return { ok: true, data: { formId, totalResponses: 0, dailyData: [], questionStats: {} } };
  }

  // Daily submissions trend (last 30 days)
  var now         = Date.now();
  var thirtyDays  = 30 * 24 * 60 * 60 * 1000;
  var dailyMap    = {};

  responses.forEach(r => {
    if (r.submittedAt > now - thirtyDays) {
      var day = new Date(r.submittedAt).toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }
  });

  var dailyData = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Question-level stats
  var questionStats = {};
  var questions = form.questions || [];

  questions.forEach(q => {
    var answers = responses
      .map(r => r.answers[q.id])
      .filter(a => a !== undefined && a !== null && a !== '');

    var stat = {
      questionId:    q.id,
      questionLabel: q.label,
      type:          q.type,
      totalAnswers:  answers.length,
      completionRate: responses.length > 0 ? Math.round(answers.length / responses.length * 100) : 0,
    };

    // Choice-based questions — frequency analysis
    if (['radio', 'checkbox', 'dropdown'].includes(q.type)) {
      var freq = {};
      answers.forEach(a => {
        var values = Array.isArray(a) ? a : [a];
        values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      });
      stat.frequencies = Object.entries(freq)
        .map(([label, count]) => ({ label, count, pct: Math.round(count / answers.length * 100) }))
        .sort((a, b) => b.count - a.count);
    }

    // Numeric questions — stats
    if (['number', 'rating', 'stars', 'slider', 'linear-scale', 'nps'].includes(q.type)) {
      var nums = answers.map(a => Number(a)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        var sum = nums.reduce((a, b) => a + b, 0);
        var sorted = nums.slice().sort((a, b) => a - b);
        stat.avg    = Math.round(sum / nums.length * 10) / 10;
        stat.min    = sorted[0];
        stat.max    = sorted[sorted.length - 1];
        stat.median = sorted[Math.floor(sorted.length / 2)];
      }
    }

    // Text questions — word count
    if (['short-answer', 'paragraph', 'email'].includes(q.type)) {
      var texts = answers.filter(a => typeof a === 'string');
      var avgLen = texts.length > 0
        ? Math.round(texts.reduce((sum, t) => sum + t.length, 0) / texts.length)
        : 0;
      stat.avgLength = avgLen;
    }

    questionStats[q.id] = stat;
  });

  // Overall stats
  var avgDuration = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + (r.duration || 0), 0) / responses.length)
    : 0;

  // Completion rate (responders who answered all required questions)
  var requiredQs = questions.filter(q => q.required);
  var completedCount = responses.filter(r =>
    requiredQs.every(q => {
      var a = r.answers[q.id];
      return a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0);
    })
  ).length;

  var completionRate = responses.length > 0
    ? Math.round(completedCount / responses.length * 100)
    : 0;

  return {
    ok: true,
    data: {
      formId,
      formTitle:       form.title,
      totalResponses:  responses.length,
      completionRate,
      avgDuration,
      dailyData,
      questionStats,
      lastResponse: responses.reduce((max, r) => Math.max(max, r.submittedAt || 0), 0),
    },
  };
}

/* ================================================================
 * Export CSV
 * ================================================================ */

function exportCSV(params) {
  var formId = params.formId;
  if (!formId) return { ok: false, error: 'formId required' };

  var formResult = getForm({ id: formId });
  if (!formResult.ok) return formResult;
  var form = formResult.data;

  var responseResult = getResponses({ formId, perPage: 100000 });
  var responses = responseResult.ok ? responseResult.data : [];

  var questions = (form.questions || []).filter(q =>
    !['instruction','rich-text','section-break','page-break','video-embed','audio-embed','custom-html'].includes(q.type)
  );

  // Build CSV
  var headers = ['#', 'Submitted At', 'Duration (s)', ...questions.map(q => q.label || q.id)];
  var rows = responses.map((r, i) => {
    var a = r.answers || {};
    return [
      i+1,
      new Date(r.submittedAt).toLocaleString(),
      r.duration || '',
      ...questions.map(q => {
        var v = a[q.id];
        if (v == null) return '';
        return Array.isArray(v) ? v.join('; ') : String(v);
      }),
    ].map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',');
  });

  var csv = [headers.map(h => '"' + h + '"').join(','), ...rows].join('\n');
  return { ok: true, data: { csv, filename: form.title + '_responses.csv' } };
}

/* ================================================================
 * Email Notifications
 * ================================================================ */

function sendNotificationEmail(form, response) {
  try {
    var to      = form.settings.notifyEmail;
    var subject = '[SanStudio Forms] New response: ' + (form.title || 'Form');

    var body = 'You received a new response to "' + form.title + '".\n\n';
    body += 'Submitted: ' + new Date(response.submittedAt).toLocaleString() + '\n';
    body += 'Duration: ' + Math.round((response.duration || 0) / 60) + ' minutes\n\n';

    var questions = form.questions || [];
    var answers   = response.answers || {};

    questions.forEach(q => {
      var a = answers[q.id];
      if (a !== undefined && a !== null) {
        body += (q.label || q.id) + ':\n';
        body += '  ' + (Array.isArray(a) ? a.join(', ') : a) + '\n\n';
      }
    });

    body += '\n---\nView all responses: ' + ScriptApp.getService().getUrl() + '?action=getResponses&formId=' + form.id;

    MailApp.sendEmail({ to, subject, body });
  } catch (e) {
    Logger.log('Email error: ' + e.message);
  }
}

/* ================================================================
 * Utilities
 * ================================================================ */

function generateId() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 20);
}

function getClientIp(e) {
  try {
    return e?.parameter?.ip || '';
  } catch {
    return '';
  }
}

/* ================================================================
 * Setup function — run once to initialize
 * ================================================================ */

function setup() {
  var ss = getSpreadsheet();
  Logger.log('Spreadsheet: ' + ss.getName());

  getRegistrySheet();
  Logger.log('Registry sheet initialized: ' + CONFIG.FORMS_SHEET_NAME);

  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  Logger.log('Spreadsheet ID saved: ' + ss.getId());

  Logger.log('Setup complete! Deploy this script as a Web App to use the API.');
}

/**
 * Test the API from the Apps Script IDE
 */
function testPing() {
  var result = doGet({ parameter: { action: 'ping' } });
  Logger.log(result.getContent());
}
