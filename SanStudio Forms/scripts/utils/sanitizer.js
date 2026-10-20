/**
 * SanStudio Forms — HTML Sanitizer & XSS Protection
 * ====================================================
 * Sanitizes user-provided HTML before rendering.
 * Escapes output to prevent XSS.
 * Validates URLs to prevent javascript: injection.
 */

/* ================================================================
 * Allowed HTML elements and attributes
 * ================================================================ */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code', 'hr',
  'a', 'img', 'video', 'audio',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  'div', 'span', 'section', 'article', 'aside', 'header', 'footer',
  'figure', 'figcaption',
  'details', 'summary',
  'mark', 'small', 'sub', 'sup',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'id',
  'width', 'height', 'style',
  'target', 'rel', 'type',
  'controls', 'autoplay', 'muted', 'loop', 'preload',
  'colspan', 'rowspan',
  'lang', 'dir',
  'data-tooltip',
]);

const SAFE_STYLES = new Set([
  'color', 'background-color', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'line-height', 'margin', 'padding',
  'border-radius', 'width', 'height', 'max-width', 'display',
]);

const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/* ================================================================
 * Core sanitizer
 * ================================================================ */

/**
 * Sanitize an HTML string. Removes dangerous elements and attributes.
 * @param {string} html - Raw HTML input
 * @param {object} [options]
 * @param {boolean} [options.allowImages=true]
 * @param {boolean} [options.allowLinks=true]
 * @param {boolean} [options.allowStyles=false]
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html, options = {}) {
  const {
    allowImages = true,
    allowLinks  = true,
    allowStyles = false,
  } = options;

  if (!html || typeof html !== 'string') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');

  sanitizeNode(doc.body, { allowImages, allowLinks, allowStyles });

  return doc.body.innerHTML;
}

/**
 * Recursively sanitize a DOM node.
 * @param {Element} node
 * @param {object} options
 */
function sanitizeNode(node, options) {
  const children = [...node.childNodes];

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      continue;
    }

    const tagName = child.tagName.toLowerCase();

    // Remove script, style, and other dangerous tags entirely
    if (['script', 'style', 'iframe', 'frame', 'object', 'embed', 'form', 'input',
         'button', 'select', 'textarea', 'noscript', 'template'].includes(tagName)) {
      child.remove();
      continue;
    }

    // Check against allowlist
    if (!ALLOWED_TAGS.has(tagName)) {
      // Replace with its children (unwrap)
      while (child.firstChild) {
        node.insertBefore(child.firstChild, child);
      }
      child.remove();
      continue;
    }

    // Handle images
    if (tagName === 'img' && !options.allowImages) {
      child.remove();
      continue;
    }

    // Handle links
    if (tagName === 'a' && !options.allowLinks) {
      const span = document.createElement('span');
      span.textContent = child.textContent;
      node.insertBefore(span, child);
      child.remove();
      continue;
    }

    // Sanitize attributes
    sanitizeAttributes(child, tagName, options);

    // Recurse
    sanitizeNode(child, options);
  }
}

/**
 * Sanitize element attributes.
 * @param {Element} el
 * @param {string} tagName
 * @param {object} options
 */
function sanitizeAttributes(el, tagName, options) {
  const attrNames = [...el.attributes].map(a => a.name);

  for (const attr of attrNames) {
    if (!ALLOWED_ATTRS.has(attr) && !attr.startsWith('aria-') && !attr.startsWith('data-')) {
      el.removeAttribute(attr);
      continue;
    }

    const value = el.getAttribute(attr);

    // Validate URLs
    if (['href', 'src', 'action'].includes(attr)) {
      if (!isSafeUrl(value)) {
        el.removeAttribute(attr);
        continue;
      }
    }

    // Force links to open safely
    if (tagName === 'a') {
      el.setAttribute('rel', 'noopener noreferrer');
      if (!el.hasAttribute('target')) {
        el.setAttribute('target', '_blank');
      }
    }

    // Sanitize inline styles
    if (attr === 'style') {
      if (!options.allowStyles) {
        el.removeAttribute('style');
      } else {
        el.setAttribute('style', sanitizeStyle(value));
      }
    }
  }
}

/**
 * Sanitize a CSS style string — only allow safe properties.
 * @param {string} styleStr
 * @returns {string}
 */
function sanitizeStyle(styleStr) {
  const declarations = styleStr.split(';').map(s => s.trim()).filter(Boolean);
  const safe = declarations.filter(decl => {
    const [prop] = decl.split(':').map(s => s.trim());
    return SAFE_STYLES.has(prop.toLowerCase());
  });
  return safe.join('; ');
}

/**
 * Check if a URL is safe to use in href/src attributes.
 * @param {string} url
 * @returns {boolean}
 */
function isSafeUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.href);
    return SAFE_URL_PROTOCOLS.includes(u.protocol);
  } catch {
    // Relative URLs are OK
    return !url.toLowerCase().trim().startsWith('javascript:') &&
           !url.toLowerCase().trim().startsWith('data:text/html') &&
           !url.toLowerCase().trim().startsWith('vbscript:');
  }
}

/* ================================================================
 * Output escaping
 * ================================================================ */

/**
 * Escape a string for safe insertion into HTML text content.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

/**
 * Escape for use inside a JavaScript string literal in HTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeJs(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g,  "\\'")
    .replace(/"/g,  '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/</g,  '\\u003C')
    .replace(/>/g,  '\\u003E');
}

/**
 * Escape for use in a URL query parameter.
 * @param {string} str
 * @returns {string}
 */
export function escapeUrl(str) {
  return encodeURIComponent(String(str ?? ''));
}

/* ================================================================
 * Sanitize form submission data
 * ================================================================ */

/**
 * Sanitize all values in a response object before submitting.
 * @param {object} answers - { questionId: value }
 * @returns {object} Sanitized answers
 */
export function sanitizeAnswers(answers) {
  const sanitized = {};

  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === 'string') {
      // Strip HTML from plain text fields
      sanitized[key] = stripHtml(value).substring(0, 50_000); // 50k char limit
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'string' ? stripHtml(v).substring(0, 1000) : v
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAnswers(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Strip all HTML tags from a string, returning plain text.
 * @param {string} html
 * @returns {string}
 */
export function stripHtml(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Truncate a string to a maximum length with ellipsis.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max = 80) {
  const s = String(str ?? '');
  return s.length > max ? s.substring(0, max) + '…' : s;
}
