/**
 * SanStudio Forms — Input Validation
 * =====================================
 * Comprehensive validation rules for all question types.
 * Pure functions, no side effects.
 */

/**
 * @typedef {object} ValidationResult
 * @property {boolean} valid
 * @property {string}  [error]
 */

/* ================================================================
 * Core validators
 * ================================================================ */

export const Validators = {
  /**
   * Run a value against an array of rules.
   * Stops at first failure.
   * @param {*} value
   * @param {ValidationRule[]} rules
   * @returns {ValidationResult}
   */
  run(value, rules = []) {
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) {
        return { valid: false, error: result || 'Invalid value' };
      }
    }
    return { valid: true };
  },

  /* ---- Basic ---- */

  required(message = 'This field is required') {
    return (value) => {
      if (value === null || value === undefined) return message;
      if (typeof value === 'string' && !value.trim()) return message;
      if (Array.isArray(value) && value.length === 0) return message;
      return true;
    };
  },

  minLength(min, message) {
    return (value) => {
      if (!value) return true;
      return String(value).length >= min || (message || `Minimum ${min} characters required`);
    };
  },

  maxLength(max, message) {
    return (value) => {
      if (!value) return true;
      return String(value).length <= max || (message || `Maximum ${max} characters allowed`);
    };
  },

  /* ---- Numbers ---- */

  number(message = 'Must be a valid number') {
    return (value) => {
      if (!value && value !== 0) return true;
      return !isNaN(Number(value)) || message;
    };
  },

  min(minimum, message) {
    return (value) => {
      if (!value && value !== 0) return true;
      return Number(value) >= minimum || (message || `Minimum value is ${minimum}`);
    };
  },

  max(maximum, message) {
    return (value) => {
      if (!value && value !== 0) return true;
      return Number(value) <= maximum || (message || `Maximum value is ${maximum}`);
    };
  },

  integer(message = 'Must be a whole number') {
    return (value) => {
      if (!value && value !== 0) return true;
      return Number.isInteger(Number(value)) || message;
    };
  },

  /* ---- String formats ---- */

  email(message = 'Enter a valid email address') {
    return (value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim()) || message;
    };
  },

  phone(message = 'Enter a valid phone number') {
    return (value) => {
      if (!value) return true;
      // Accepts +1 (555) 555-5555, 555-5555, etc.
      return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(
        String(value).replace(/\s/g, '')
      ) || message;
    };
  },

  url(message = 'Enter a valid URL') {
    return (value) => {
      if (!value) return true;
      try {
        const u = new URL(String(value));
        return ['http:', 'https:'].includes(u.protocol) || message;
      } catch {
        return message;
      }
    };
  },

  date(message = 'Enter a valid date') {
    return (value) => {
      if (!value) return true;
      const d = new Date(value);
      return !isNaN(d.getTime()) || message;
    };
  },

  dateMin(minDate, message) {
    return (value) => {
      if (!value) return true;
      return new Date(value) >= new Date(minDate) ||
        (message || `Date must be on or after ${minDate}`);
    };
  },

  dateMax(maxDate, message) {
    return (value) => {
      if (!value) return true;
      return new Date(value) <= new Date(maxDate) ||
        (message || `Date must be on or before ${maxDate}`);
    };
  },

  /* ---- Pattern ---- */

  pattern(regex, message = 'Invalid format') {
    return (value) => {
      if (!value) return true;
      const r = typeof regex === 'string' ? new RegExp(regex) : regex;
      return r.test(String(value)) || message;
    };
  },

  /* ---- Arrays ---- */

  minChoices(min, message) {
    return (value) => {
      if (!Array.isArray(value)) return true;
      return value.length >= min || (message || `Select at least ${min} option${min > 1 ? 's' : ''}`);
    };
  },

  maxChoices(max, message) {
    return (value) => {
      if (!Array.isArray(value)) return true;
      return value.length <= max || (message || `Select at most ${max} option${max > 1 ? 's' : ''}`);
    };
  },

  /* ---- Files ---- */

  fileType(allowedTypes, message) {
    return (file) => {
      if (!file) return true;
      const files = Array.isArray(file) ? file : [file];
      for (const f of files) {
        if (!allowedTypes.some(t => f.type.startsWith(t) || f.name.endsWith(`.${t}`))) {
          return message || `File type not allowed. Accepted: ${allowedTypes.join(', ')}`;
        }
      }
      return true;
    };
  },

  fileSize(maxBytes, message) {
    return (file) => {
      if (!file) return true;
      const files = Array.isArray(file) ? file : [file];
      for (const f of files) {
        if (f.size > maxBytes) {
          const mb = (maxBytes / 1024 / 1024).toFixed(1);
          return message || `File too large. Maximum size is ${mb} MB`;
        }
      }
      return true;
    };
  },

  /* ---- Misc ---- */

  noScript(message = 'Script tags are not allowed') {
    return (value) => {
      if (!value) return true;
      return !/<script/i.test(String(value)) || message;
    };
  },

  confirmed(confirmValue, message = 'Values do not match') {
    return (value) => value === confirmValue || message;
  },
};

/**
 * Build a validation rule array from a question's validation config.
 * @param {object} question - Form question definition
 * @param {object} answer   - Current answer value
 * @returns {ValidationResult}
 */
export function validateQuestion(question, answer) {
  const v = question.validation || {};
  const rules = [];

  // Required
  if (question.required) {
    rules.push(Validators.required(v.requiredMessage || 'This question is required'));
  }

  // Type-specific validations
  switch (question.type) {
    case 'email':
      rules.push(Validators.email(v.emailMessage));
      break;

    case 'phone':
      rules.push(Validators.phone(v.phoneMessage));
      break;

    case 'website':
      rules.push(Validators.url(v.urlMessage));
      break;

    case 'number':
    case 'slider':
      rules.push(Validators.number());
      if (v.min !== undefined) rules.push(Validators.min(v.min));
      if (v.max !== undefined) rules.push(Validators.max(v.max));
      if (v.integer) rules.push(Validators.integer());
      break;

    case 'short-answer':
    case 'paragraph':
    case 'rich-text':
      if (v.minLength) rules.push(Validators.minLength(v.minLength));
      if (v.maxLength) rules.push(Validators.maxLength(v.maxLength));
      if (v.pattern)   rules.push(Validators.pattern(v.pattern, v.patternMessage));
      break;

    case 'date':
    case 'datetime':
      rules.push(Validators.date());
      if (v.minDate) rules.push(Validators.dateMin(v.minDate));
      if (v.maxDate) rules.push(Validators.dateMax(v.maxDate));
      break;

    case 'checkbox':
      if (v.minChoices) rules.push(Validators.minChoices(v.minChoices));
      if (v.maxChoices) rules.push(Validators.maxChoices(v.maxChoices));
      break;

    case 'file-upload':
      if (v.allowedTypes) rules.push(Validators.fileType(v.allowedTypes));
      if (v.maxSize)      rules.push(Validators.fileSize(v.maxSize));
      break;
  }

  // Custom regex validator
  if (v.regex) {
    rules.push(Validators.pattern(v.regex, v.regexMessage));
  }

  // No script injection
  rules.push(Validators.noScript());

  return Validators.run(answer, rules);
}

/**
 * Validate all answers in a form page/section.
 * @param {Question[]} questions
 * @param {object} answers - Map of questionId → answer
 * @returns {Map<string, ValidationResult>}
 */
export function validatePage(questions, answers) {
  const results = new Map();

  for (const question of questions) {
    // Skip non-answer question types
    if (['section-break', 'page-break', 'instruction', 'rich-text'].includes(question.type)) {
      continue;
    }

    const answer = answers[question.id];
    const result = validateQuestion(question, answer);
    if (!result.valid) {
      results.set(question.id, result);
    }
  }

  return results;
}

/**
 * Real-time regex tester (used in builder).
 * @param {string} pattern
 * @param {string} testValue
 * @returns {{ valid: boolean, error?: string }}
 */
export function testRegex(pattern, testValue) {
  try {
    const r = new RegExp(pattern);
    return { valid: r.test(testValue) };
  } catch (e) {
    return { valid: false, error: `Invalid regex: ${e.message}` };
  }
}
