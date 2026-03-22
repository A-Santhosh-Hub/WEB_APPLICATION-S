// ═══════════════════════════════════════════════════════════════
//  SanPay Portal — Google Apps Script Backend API
//  Developed By Santhosh A | https://a-santhosh-hub.github.io/in/
// ═══════════════════════════════════════════════════════════════

const SHEET_NAME = "Transactions";

// ── Column Index Map (0-based internally, 1-based for getRange) ──
const COL = {
  TXN_ID: 0,       // A
  NAME: 1,         // B
  PHONE: 2,        // C
  AMOUNT: 3,       // D
  METHOD: 4,       // E
  REMARKS: 5,      // F
  STATUS: 6,       // G  ← updateStatus targets column 7 (1-based)
  TIMESTAMP: 7     // H
};

// ── Helper: Get or create the Transactions sheet ─────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "Transaction ID","Name","Phone","Amount",
      "Payment Method","Remarks","Status","Timestamp"
    ];
    sheet.appendRow(headers);
    // Style header row
    const hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setBackground("#1e1b4b");
    hRange.setFontColor("#a5b4fc");
    hRange.setFontWeight("bold");
    hRange.setFontSize(11);
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 160);
  }
  return sheet;
}

// ── Helper: JSON response ─────────────────────────────────────────
function respond(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Helper: Convert row array → object using header row ──────────
function rowToObj(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = (row[i] !== undefined && row[i] !== null) ? row[i] : "";
  });
  return obj;
}

// ════════════════════════════════════════════════════════════════
//  GET Handler  (?action=getAll | search | stats)
// ════════════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const action = (e.parameter.action || "getAll").trim();
    if (action === "getAll")   return getAllTransactions();
    if (action === "search")   return searchTransactions(e.parameter.query || "");
    if (action === "stats")    return getStats();
    return respond({ success: false, error: "Unknown GET action: " + action });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════
//  POST Handler  ({action: "add"|"update"|"delete", ...data})
// ════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = (body.action || "").trim();
    if (action === "add")    return addTransaction(body.data);
    if (action === "update") return updateStatus(body.id, body.status);
    if (action === "delete") return deleteTransaction(body.id);
    if (action === "reset")  return resetAllData();
    return respond({ success: false, error: "Unknown POST action: " + action });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════
//  CRUD Operations
// ════════════════════════════════════════════════════════════════

/** Fetch all rows, newest first */
function getAllTransactions() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return respond({ success: true, data: [] });
  const headers = data[0];
  const rows = data.slice(1)
    .filter(r => r[COL.TXN_ID] !== "")
    .map(r => rowToObj(headers, r))
    .reverse();
  return respond({ success: true, data: rows });
}

/** Search across all columns */
function searchTransactions(query) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return respond({ success: true, data: [] });
  const headers = data[0];
  const q = query.toLowerCase().trim();
  const rows = data.slice(1)
    .filter(r => r[COL.TXN_ID] !== "")
    .filter(r => r.some(cell => String(cell).toLowerCase().includes(q)))
    .map(r => rowToObj(headers, r))
    .reverse();
  return respond({ success: true, data: rows });
}

/** Append a new transaction row */
function addTransaction(data) {
  const sheet = getSheet();
  sheet.appendRow([
    data.txnId     || "",
    data.name      || "",
    data.phone     || "",
    parseFloat(data.amount) || 0,
    data.method    || "",
    data.remarks   || "",
    data.status    || "Pending",
    data.timestamp || new Date().toISOString()
  ]);
  // Auto-resize columns for readability
  // sheet.autoResizeColumns(1, 8);  // Uncomment if desired
  return respond({ success: true, txnId: data.txnId });
}

/** Update the Status column for a given TXN ID */
function updateStatus(txnId, status) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.TXN_ID]) === String(txnId)) {
      sheet.getRange(i + 1, COL.STATUS + 1).setValue(status); // 1-based
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: "TXN not found: " + txnId });
}

/** Delete a row by TXN ID */
function deleteTransaction(txnId) {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.TXN_ID]) === String(txnId)) {
      sheet.deleteRow(i + 1); // 1-based
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: "TXN not found: " + txnId });
}

/** Delete ALL transactions (Factory Reset) */
function resetAllData() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  return respond({ success: true });
}

/** Aggregate statistics for dashboard */
function getStats() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return respond({ success: true, data: {
      total: 0, pending: 0, success: 0, failed: 0, totalAmount: 0
    }});
  }
  const rows = data.slice(1).filter(r => r[COL.TXN_ID] !== "");
  const stats = {
    total:       rows.length,
    pending:     rows.filter(r => r[COL.STATUS] === "Pending").length,
    success:     rows.filter(r => r[COL.STATUS] === "Success").length,
    failed:      rows.filter(r => r[COL.STATUS] === "Failed").length,
    totalAmount: rows
      .filter(r => r[COL.STATUS] === "Success")
      .reduce((s, r) => s + (parseFloat(r[COL.AMOUNT]) || 0), 0)
  };
  return respond({ success: true, data: stats });
}
