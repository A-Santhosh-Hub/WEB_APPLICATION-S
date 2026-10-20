/**
 * SanStudio Forms — Question Type Registry
 * ==========================================
 * Central registry of all supported question types.
 * Each entry defines the type's label, icon, color,
 * and default configuration.
 */

/**
 * @typedef {object} QuestionTypeDef
 * @property {string}   label          - Display label
 * @property {string}   icon           - SVG icon string
 * @property {string}   color          - Brand color for this type
 * @property {string}   [defaultLabel] - Default question text
 * @property {object[]} [defaultOptions]
 * @property {object}   [defaults]     - Extra default fields
 * @property {Function} [renderPreview]  - Custom preview renderer
 */

/** @type {Record<string, QuestionTypeDef>} */
export const QUESTION_TYPES = {

  /* ---- Basic ---- */
  'short-answer': {
    label: 'Short Answer',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="14" y2="15"/></svg>`,
    color: '#3b82f6',
    defaultLabel: 'Your answer',
    defaults: { placeholder: '' },
  },
  'paragraph': {
    label: 'Paragraph',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="16" y2="14"/><line x1="4" y1="18" x2="18" y2="18"/></svg>`,
    color: '#6366f1',
    defaultLabel: 'Your response',
    defaults: { placeholder: '', minRows: 3 },
  },
  'number': {
    label: 'Number',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 2v20M5 6h14M3 12h18M5 18h14"/></svg>`,
    color: '#10b981',
    defaultLabel: 'Enter a number',
    defaults: { min: undefined, max: undefined },
  },
  'email': {
    label: 'Email',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    color: '#f59e0b',
    defaultLabel: 'Email address',
    defaults: { placeholder: 'name@example.com' },
  },
  'phone': {
    label: 'Phone',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/></svg>`,
    color: '#14b8a6',
    defaultLabel: 'Phone number',
    defaults: { placeholder: '+1 (555) 000-0000' },
  },
  'website': {
    label: 'Website URL',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>`,
    color: '#8b5cf6',
    defaultLabel: 'Website URL',
    defaults: { placeholder: 'https://' },
  },
  'password': {
    label: 'Password',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    color: '#ec4899',
    defaultLabel: 'Password',
    defaults: {},
  },

  /* ---- Choice ---- */
  'dropdown': {
    label: 'Dropdown',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>`,
    color: '#f97316',
    defaultLabel: 'Choose an option',
    defaultOptions: [
      { id: 'o1', label: 'Option 1', value: 'option_1' },
      { id: 'o2', label: 'Option 2', value: 'option_2' },
      { id: 'o3', label: 'Option 3', value: 'option_3' },
    ],
    defaults: { allowOther: false, randomize: false },
  },
  'checkbox': {
    label: 'Checkboxes',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
    color: '#8b5cf6',
    defaultLabel: 'Select all that apply',
    defaultOptions: [
      { id: 'o1', label: 'Option 1', value: 'option_1' },
      { id: 'o2', label: 'Option 2', value: 'option_2' },
      { id: 'o3', label: 'Option 3', value: 'option_3' },
    ],
    defaults: { allowOther: false, allowMultiple: true, randomize: false },
  },
  'radio': {
    label: 'Multiple Choice',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`,
    color: '#06b6d4',
    defaultLabel: 'Select one option',
    defaultOptions: [
      { id: 'o1', label: 'Option A', value: 'option_a' },
      { id: 'o2', label: 'Option B', value: 'option_b' },
      { id: 'o3', label: 'Option C', value: 'option_c' },
    ],
    defaults: { allowOther: false, randomize: false },
  },
  'image-choice': {
    label: 'Image Choice',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    color: '#f43f5e',
    defaultLabel: 'Select an image',
    defaultOptions: [
      { id: 'o1', label: 'Choice 1', imageUrl: '' },
      { id: 'o2', label: 'Choice 2', imageUrl: '' },
    ],
    defaults: {},
  },

  /* ---- Date & Time ---- */
  'date': {
    label: 'Date',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    color: '#a855f7',
    defaultLabel: 'Select a date',
    defaults: {},
  },
  'time': {
    label: 'Time',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    color: '#0ea5e9',
    defaultLabel: 'Select a time',
    defaults: {},
  },
  'datetime': {
    label: 'Date & Time',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="16 2 16 6"/><polyline points="8 2 8 6"/><polyline points="12 14 12 17 14 17"/></svg>`,
    color: '#7c3aed',
    defaultLabel: 'Select date and time',
    defaults: {},
  },

  /* ---- Rating & Scale ---- */
  'rating': {
    label: 'Rating',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>`,
    color: '#eab308',
    defaultLabel: 'Rate this',
    defaults: { maxRating: 5, minLabel: '', maxLabel: '' },
  },
  'stars': {
    label: 'Star Rating',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    color: '#f59e0b',
    defaultLabel: 'How would you rate us?',
    defaults: { maxRating: 5 },
  },
  'emoji-rating': {
    label: 'Emoji Rating',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    color: '#f97316',
    defaultLabel: 'How are you feeling?',
    defaults: { emojis: ['😞','😐','🙂','😊','🤩'] },
  },
  'slider': {
    label: 'Slider',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="12" x2="20" y2="12"/><circle cx="12" cy="12" r="3"/></svg>`,
    color: '#14b8a6',
    defaultLabel: 'Select a value',
    defaults: { min: 0, max: 100, step: 1, defaultValue: 50 },
  },
  'linear-scale': {
    label: 'Linear Scale',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="6" cy="12" r="1.5"/><circle cx="10" cy="12" r="1.5"/><circle cx="14" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>`,
    color: '#a855f7',
    defaultLabel: 'Rate on a scale',
    defaults: { min: 1, max: 5, minLabel: 'Not likely', maxLabel: 'Very likely' },
  },
  'nps': {
    label: 'NPS Score',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
    color: '#0ea5e9',
    defaultLabel: 'How likely are you to recommend us?',
    defaults: { min: 0, max: 10, minLabel: 'Not at all', maxLabel: 'Extremely likely' },
  },

  /* ---- Matrix ---- */
  'matrix': {
    label: 'Matrix',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`,
    color: '#6366f1',
    defaultLabel: 'Rate the following',
    defaults: {
      rows:    [{ id: 'r1', label: 'Row 1' }, { id: 'r2', label: 'Row 2' }],
      columns: [{ id: 'c1', label: 'Column 1' }, { id: 'c2', label: 'Column 2' }, { id: 'c3', label: 'Column 3' }],
      multiSelect: false,
    },
  },
  'likert': {
    label: 'Likert Scale',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    color: '#f43f5e',
    defaultLabel: 'Rate each item',
    defaults: {
      rows:    [{ id: 'r1', label: 'Statement 1' }, { id: 'r2', label: 'Statement 2' }],
      columns: [
        { id: 'c1', label: 'Strongly Disagree' },
        { id: 'c2', label: 'Disagree' },
        { id: 'c3', label: 'Neutral' },
        { id: 'c4', label: 'Agree' },
        { id: 'c5', label: 'Strongly Agree' },
      ],
    },
  },

  /* ---- Media & Files ---- */
  'file-upload': {
    label: 'File Upload',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
    color: '#f97316',
    defaultLabel: 'Upload a file',
    defaults: { maxFiles: 1, maxSizeMb: 10, allowedTypes: [] },
  },
  'image-upload': {
    label: 'Image Upload',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    color: '#3b82f6',
    defaultLabel: 'Upload an image',
    defaults: { maxFiles: 1, maxSizeMb: 5, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] },
  },
  'video-embed': {
    label: 'Video Embed',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    color: '#ef4444',
    defaultLabel: 'Watch this video',
    defaults: { videoUrl: '' },
  },
  'audio-embed': {
    label: 'Audio Embed',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>`,
    color: '#a855f7',
    defaultLabel: 'Listen to this',
    defaults: { audioUrl: '' },
  },

  /* ---- Advanced ---- */
  'signature': {
    label: 'Signature',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    color: '#6366f1',
    defaultLabel: 'Please sign here',
    defaults: {},
  },
  'location': {
    label: 'Location',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    color: '#10b981',
    defaultLabel: 'Your location',
    defaults: { allowManual: true },
  },
  'color-picker': {
    label: 'Color Picker',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
    color: '#f43f5e',
    defaultLabel: 'Pick a color',
    defaults: { defaultColor: '#8b5cf6' },
  },
  'code-block': {
    label: 'Code Block',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    color: '#334155',
    defaultLabel: 'Code Snippet',
    defaults: { content: '', language: 'javascript' },
  },
  'hidden-field': {
    label: 'Hidden Field',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    color: '#64748b',
    defaultLabel: 'Hidden Field',
    defaults: { defaultValue: '' },
  },

  /* ---- Layout ---- */
  'section-break': {
    label: 'Section Break',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    color: '#94a3b8',
    defaultLabel: 'Section Title',
    defaults: {},
  },
  'page-break': {
    label: 'Page Break',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
    color: '#6366f1',
    defaultLabel: 'Next Page',
    defaults: {},
  },
  'instruction': {
    label: 'Instruction Text',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    color: '#0ea5e9',
    defaultLabel: 'Instructions',
    defaults: { content: 'Enter your instructions here...' },
  },
  'rich-text': {
    label: 'Rich Text Block',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 6.1H3M21 12.1H3M15.1 18H3"/></svg>`,
    color: '#8b5cf6',
    defaultLabel: '',
    defaults: { content: '' },
  },
  'terms': {
    label: 'Terms & Conditions',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    color: '#475569',
    defaultLabel: 'Terms & Conditions',
    defaults: { content: 'I agree to the terms and conditions.', required: true },
  },
  'captcha': {
    label: 'CAPTCHA',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><line x1="12" y1="15" x2="12" y2="17"/></svg>`,
    color: '#22c55e',
    defaultLabel: 'Verification',
    defaults: {},
  },
  'custom-html': {
    label: 'Custom HTML',
    icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    color: '#ef4444',
    defaultLabel: 'HTML Block',
    defaults: { content: '<p>Custom HTML content</p>' },
  },
};

/**
 * Get all question types as an array, sorted by label.
 * @returns {Array}
 */
export function getAllQuestionTypes() {
  return Object.entries(QUESTION_TYPES).map(([id, def]) => ({ id, ...def }));
}

/**
 * Get question type definition.
 * @param {string} typeId
 * @returns {QuestionTypeDef|null}
 */
export function getQuestionType(typeId) {
  return QUESTION_TYPES[typeId] || null;
}

/**
 * Check if a type supports conditional logic.
 * @param {string} typeId
 * @returns {boolean}
 */
export function supportsLogic(typeId) {
  const noLogic = ['instruction', 'rich-text', 'section-break', 'page-break', 'captcha', 'custom-html', 'hidden-field'];
  return !noLogic.includes(typeId);
}

/**
 * Check if a type collects a response.
 * @param {string} typeId
 * @returns {boolean}
 */
export function isAnswerable(typeId) {
  const layout = ['instruction', 'rich-text', 'section-break', 'page-break', 'video-embed', 'audio-embed', 'custom-html'];
  return !layout.includes(typeId);
}
