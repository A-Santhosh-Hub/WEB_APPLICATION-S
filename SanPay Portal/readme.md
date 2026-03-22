FilePurposeapps-script.gsGoogle Sheets backend — GET/POST/UPDATE/DELETE endpoints
style.css Full design system — dark luxury fintech, glassmorphism, animations

script.jsShared utilities — API calls, TXN ID gen, INR formatter, PDF receipts, confetti

index.htmlLanding page — hero, live stats, features, 

how-it-works
transaction.html
Payment form — live validation, method selector, success modal + confettihistory.htmlTransaction history — search, filter tabs, mobile cards, desktop table 
admin.html Password-protected admin — stats, bar/doughnut charts, status update, delete



To go live (3 steps):
1. Apps Script → Create a Google Sheet → Extensions → Apps Script → paste apps-script.gs → Deploy as Web App (Execute as: Me, Anyone can access) → copy the URL
2. script.js → Replace "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE" with your URL (optionally change ADMIN_PASSWORD from SanAdmin@2024)
3. GitHub Pages → Push all files to a repo root → Settings → Pages → Deploy from main

The portal runs in demo mode (with sample data) until you connect the Apps Script URL, so you can preview everything immediately.
