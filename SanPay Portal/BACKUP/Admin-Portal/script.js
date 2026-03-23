/* ═══════════════════════════════════════════════════════════════
   SanPay Portal — Shared JavaScript Utilities
   Developed By Santhosh A | https://a-santhosh-hub.github.io/in/
   ═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────
//  ⚠️  CONFIGURATION — Update before deploying
// ─────────────────────────────────────────────────────────────────
const API_URL        = "https://script.google.com/macros/s/AKfycbxqWrzrVMPqHTOYl0AesAMQZSA6Y3Eg_ZhgAavRtZKoBCu8wHuqLpKO72wJxSLZCgD4/exec";
const ADMIN_PASSWORD = "SanAdmin@2024";

// ─────────────────────────────────────────────────────────────────
//  Transaction ID Generator
// ─────────────────────────────────────────────────────────────────
function generateTxnId() {
  const ts      = Date.now().toString(36).toUpperCase();
  const rand    = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN${ts}${rand}`;
}

// ─────────────────────────────────────────────────────────────────
//  Currency / Date Formatters
// ─────────────────────────────────────────────────────────────────
function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateShort(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────
//  API Helpers (CORS-safe for Apps Script)
// ─────────────────────────────────────────────────────────────────
async function apiGet(params = {}) {
  const url = new URL(API_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { redirect: 'follow' });
  return await res.json();
}

async function apiPost(data = {}) {
  const res = await fetch(API_URL, {
    method:   'POST',
    headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
    body:     JSON.stringify(data),
    redirect: 'follow'
  });
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────
//  Transaction CRUD
// ─────────────────────────────────────────────────────────────────
async function submitTransaction(data) {
  return apiPost({ action: 'add', data });
}

async function fetchTransactions(query = null) {
  if (query && query.trim()) {
    return apiGet({ action: 'search', query: query.trim() });
  }
  return apiGet({ action: 'getAll' });
}

async function fetchStats() {
  return apiGet({ action: 'stats' });
}

async function updateTxnStatus(txnId, status) {
  return apiPost({ action: 'update', id: txnId, status });
}

async function deleteTxn(txnId) {
  return apiPost({ action: 'delete', id: txnId });
}

async function resetAllData() {
  return apiPost({ action: 'reset' });
}

async function checkTxnStatus(txnId) {
  return apiGet({ action: 'checkStatus', id: txnId });
}

// ─────────────────────────────────────────────────────────────────
//  LocalStorage Cache
// ─────────────────────────────────────────────────────────────────
const CACHE_KEY = 'sanpay_last_txn';

function cacheTransaction(txnData) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(txnData));
}

function getLastTransaction() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────
//  Toast Notifications
// ─────────────────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const iconMap = {
    success: '✅',
    error:   '❌',
    info:    'ℹ️',
    warning: '⚠️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || '📢'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ─────────────────────────────────────────────────────────────────
//  PDF Receipt Generator (jsPDF)
// ─────────────────────────────────────────────────────────────────
function downloadReceipt(txn) {
  if (typeof window.jspdf === 'undefined') {
    showToast('PDF library not loaded. Please refresh.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const W = 148, H = 210;

  // ── Background ──────────────────────────────────────
  doc.setFillColor(5, 5, 15);
  doc.rect(0, 0, W, H, 'F');

  // ── Header bar ──────────────────────────────────────
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 32, 'F');

  // ── Logo / Title ─────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('SanPay Portal', W / 2, 14, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 180, 255);
  doc.text('PAYMENT RECEIPT', W / 2, 22, { align: 'center' });

  // ── Status banner ────────────────────────────────────
  const statusColor = {
    Success: [16, 185, 129],
    Failed:  [239, 68, 68],
    Pending: [245, 158, 11]
  }[txn['Status'] || txn.status] || [124, 58, 237];

  doc.setFillColor(...statusColor);
  doc.roundedRect(W / 2 - 22, 37, 44, 10, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text((txn['Status'] || txn.status || 'Pending').toUpperCase(), W / 2, 43.5, { align: 'center' });

  // ── TXN ID ───────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(163, 130, 255);
  doc.text('TRANSACTION ID', W / 2, 56, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(txn['Transaction ID'] || txn.txnId || '—', W / 2, 63, { align: 'center' });

  // ── Divider ──────────────────────────────────────────
  doc.setDrawColor(50, 50, 80);
  doc.line(16, 68, W - 16, 68);

  // ── Amount ───────────────────────────────────────────
  const amt = parseFloat(txn['Amount'] || txn.amount || 0);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(103, 232, 249);
  doc.text(formatINR(amt), W / 2, 83, { align: 'center' });

  // ── Detail Rows ──────────────────────────────────────
  const details = [
    ['Sender',   txn['Name']   || txn.name   || '—'],
    ['Phone',    txn['Phone']  || txn.phone  || '—'],
    ['Method',   txn['Payment Method'] || txn.method  || '—'],
    ['Remarks',  txn['Remarks'] || txn.remarks || '—'],
    ['Date',     formatDate(txn['Timestamp'] || txn.timestamp)]
  ];

  let y = 96;
  details.forEach(([label, value]) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(label.toUpperCase(), 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(241, 245, 249);
    const displayVal = String(value || '—').substring(0, 50);
    doc.text(displayVal, W - 18, y, { align: 'right' });

    doc.setDrawColor(30, 30, 50);
    doc.line(18, y + 3, W - 18, y + 3);
    y += 13;
  });

  // ── Footer ────────────────────────────────────────────
  doc.setFillColor(10, 10, 25);
  doc.rect(0, H - 22, W, 22, 'F');
  doc.setFontSize(7);
  doc.setTextColor(124, 58, 237);
  doc.text('Developed By Santhosh A', W / 2, H - 12, { align: 'center' });
  doc.setTextColor(100, 100, 130);
  doc.text('a-santhosh-hub.github.io/in/', W / 2, H - 6, { align: 'center' });

  doc.save(`Receipt_${txn['Transaction ID'] || txn.txnId || 'TXN'}.pdf`);
  showToast('Receipt downloaded!', 'success');
}

// ─────────────────────────────────────────────────────────────────
//  Confetti Launcher
// ─────────────────────────────────────────────────────────────────
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#ef4444','#a78bfa','#67e8f9'];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const size = Math.random() * 9 + 4;
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.4 ? '50%' : '2px'};
      animation-duration: ${Math.random() * 2 + 1.8}s;
      animation-delay: ${Math.random() * 0.6}s;
    `;
    container.appendChild(el);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4000);
}

// ─────────────────────────────────────────────────────────────────
//  Navbar Initializer (call on every page)
// ─────────────────────────────────────────────────────────────────
function initNavbar() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  }
  // Mark active link
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === currentPage) {
      a.classList.add('active');
    }
  });
}

// ─────────────────────────────────────────────────────────────────
//  Page Load Animation
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity   = '1';
  });
});

// ─────────────────────────────────────────────────────────────────
//  Status Badge Helper
// ─────────────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'Pending': 'badge-pending',
    'Success': 'badge-success',
    'Failed':  'badge-failed'
  };
  const cls = map[status] || 'badge-pending';
  return `<span class="badge ${cls}">${status || 'Pending'}</span>`;
}

// ─────────────────────────────────────────────────────────────────
//  Payment Method Icon
// ─────────────────────────────────────────────────────────────────
function methodIcon(method) {
  const map = {
    'UPI':    '<i class="fa-solid fa-mobile-screen-button"></i>',
    'Card':   '<i class="fa-solid fa-credit-card"></i>',
    'Wallet': '<i class="fa-solid fa-wallet"></i>',
    'Cash':   '<i class="fa-solid fa-money-bill-wave"></i>'
  };
  return map[method] || '<i class="fa-solid fa-circle-question"></i>';
}
