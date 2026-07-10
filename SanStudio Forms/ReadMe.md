# SanStudio Forms




├── index.html                  ← Landing / Dashboard
├── builder.html                ← Visual Form Builder
├── form.html                   ← Public Form (respondents view)
├── responses.html              ← Response Dashboard
├── analytics.html              ← Analytics Dashboard
├── settings.html               ← App Settings
├── manifest.json               ← PWA Manifest
├── sw.js                       ← Service Worker (Offline/PWA)
│
├── styles/
│   ├── tokens.css              ← Design tokens (colors, spacing, type)
│   ├── reset.css               ← Modern CSS reset
│   ├── base.css                ← Base typography, elements
│   ├── animations.css          ← All keyframes, transitions
│   ├── components.css          ← Shared UI components
│   ├── layout.css              ← Grid, flexbox layouts
│   ├── themes/
│   │   ├── light.css
│   │   ├── dark.css
│   │   ├── glassmorphism.css
│   │   ├── neumorphism.css
│   │   ├── cyberpunk.css
│   │   ├── aurora.css
│   │   └── luxury.css
│   ├── pages/
│   │   ├── dashboard.css
│   │   ├── builder.css
│   │   ├── form.css
│   │   ├── responses.css
│   │   └── analytics.css
│
├── scripts/
│   ├── core/
│   │   ├── app.js              ← App bootstrap, router, global state
│   │   ├── router.js           ← Client-side router
│   │   ├── store.js            ← Reactive state management
│   │   ├── events.js           ← EventBus (pub/sub)
│   │   ├── api.js              ← Apps Script API client
│   │   └── storage.js          ← IndexedDB + LocalStorage abstraction
│   │
│   ├── pages/
│   │   ├── dashboard.js
│   │   ├── builder.js
│   │   ├── form.js
│   │   ├── responses.js
│   │   ├── analytics.js
│   │   └── settings.js
│   │
│   ├── components/
│   │   ├── toast.js
│   │   ├── modal.js
│   │   ├── sidebar.js
│   │   ├── topbar.js
│   │   ├── command-palette.js
│   │   ├── drag-drop.js
│   │   ├── chart.js
│   │   ├── theme-picker.js
│   │   ├── question-editor.js
│   │   ├── preview-panel.js
│   │   ├── share-panel.js
│   │   ├── export-panel.js
│   │   └── search.js
│   │
│   ├── questions/
│   │   ├── registry.js         ← Question type registry
│   │   ├── short-answer.js
│   │   ├── paragraph.js
│   │   ├── number.js
│   │   ├── email.js
│   │   ├── phone.js
│   │   ├── date.js
│   │   ├── time.js
│   │   ├── dropdown.js
│   │   ├── checkbox.js
│   │   ├── radio.js
│   │   ├── rating.js
│   │   ├── slider.js
│   │   ├── matrix.js
│   │   ├── nps.js
│   │   ├── file-upload.js
│   │   ├── signature.js
│   │   ├── color-picker.js
│   │   ├── location.js
│   │   ├── section-break.js
│   │   ├── page-break.js
│   │   ├── instruction.js
│   │   ├── rich-text.js
│   │   ├── video-embed.js
│   │   ├── code-block.js
│   │   ├── terms.js
│   │   ├── captcha.js
│   │   └── hidden-field.js
│   │
│   ├── utils/
│   │   ├── validators.js       ← Input validation & regex
│   │   ├── sanitizer.js        ← HTML sanitization, XSS protection
│   │   ├── formatter.js        ← Date, number, currency formatters
│   │   ├── exporter.js         ← CSV, JSON, PDF, Excel export
│   │   ├── importer.js         ← JSON, CSV import
│   │   ├── analytics-engine.js ← Analytics calculations
│   │   ├── conditional-logic.js← Skip logic, branching
│   │   ├── qr-generator.js     ← QR code generation
│   │   ├── keyboard.js         ← Keyboard shortcuts
│   │   ├── accessibility.js    ← Focus management, ARIA
│   │   └── performance.js      ← Debounce, throttle, lazy loading
│
├── api/
│   └── Code.gs                 ← Google Apps Script backend
│
├── icons/                      ← SVG icon library
├── assets/
│   ├── fonts/
│   └── illustrations/
└── templates/                  ← Pre-built form templates
