# SanShop — Offline Retail Billing & Shop Management System

**SanShop** is a self-contained, 100% offline-first Point of Sale (POS) and shop management web application packed into a single `index.html` file. It is designed for small and medium-sized retail businesses—including grocery/provision stores, edible oil shops, hardware/electrical stores, and RO filter/spare-parts shops.

---

## ✨ Key Features

- **Single-File & 100% Offline**: Runs directly in any modern browser without Node.js, external CDNs, internet access, or backend servers.
- **Fast POS & Fractional Units**:
  - Supports whole and decimal quantities (`0.25 kg`, `1.5 L`, `2.75 m`, `Piece`, `Box`, or custom units).
  - Quick-quantity chips, barcode/SKU search, item-level & bill-level discounts, and held/parked draft bills.
- **3 Bill Formats with Direct PDF & PNG Downloads**:
  - Switch between **Thermal 80mm**, **Thermal 58mm**, and **A4 Full Invoice** layouts.
  - Download bills directly as **PDF** or **PNG**, print them, or share via **WhatsApp** immediately after checkout or anytime from the **Sales & Returns** history tab.
- **Flexible Payment & Credit (Udhaar) Management**:
  - Supports **Cash**, **UPI**, **Card**, **Bank Transfer**, **Credit (Pay Later)**, and **Split Payments**.
  - Settle customer credit balances later without double-counting sales revenue.
- **Inventory, Returns & Expense Tracking**:
  - Real-time stock deduction on sale, low-stock alerts, manual restock/adjustments, stock valuation at purchase cost, and auditable sales returns/voids.
- **Automated Owner Reports & WhatsApp Sharing**:
  - Reconciled **Daily, Weekly, and Monthly** reports with period-over-period comparisons, cash drawer reconciliation, UTF-8 CSV exports (Excel-compatible with Tamil support), and 1-click WhatsApp report summaries.
- **Bilingual UI & Themes**:
  - Instant runtime switching between **English** and **தமிழ் (Tamil)**, plus Light and Dark themes.

---

## 🚀 How to Run

1. Download or copy `index.html` to your computer, tablet, or phone.
2. Open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, or Safari).
3. Complete the **First-Run Setup Wizard** to configure your shop name, logo, currency, invoice prefix, and optional sample data.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **`F2`** | Jump to POS & focus Product / Barcode search |
| **`F9`** | Open Checkout / Payment modal (when cart has items) |
| **`Esc`** | Close any open modal dialog |

---

## 💾 Data Storage & Backup Important Note

- All records are saved locally inside your browser's **IndexedDB** (`SanShopRetailDB`).
- Because browser storage is tied to your specific device and browser, moving `index.html` to another computer does **not** automatically move your data.
- Go to **Backup & Restore** regularly to download a **Full JSON Backup** file to safeguard your records or transfer them to another device.
