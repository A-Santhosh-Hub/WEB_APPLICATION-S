// Exact column headers matching your frontend JS
const HEADERS = ['id', 'studentId', 'studentClass', 'studentName', 'phone', 'location', 'type', 'status', 'notes', 'timestamp', 'staffName'];

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Return empty array if only headers exist
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheetHeaders = data[0];
  const result = [];

  // Convert sheet rows into JSON objects
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < sheetHeaders.length; j++) {
      obj[sheetHeaders[j]] = row[j] || "";
    }
    result.push(obj);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Setup headers if sheet is entirely blank
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Invalid JSON"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = params.action;
  const dataRange = sheet.getDataRange().getValues();
  const currentHeaders = dataRange[0] || HEADERS;

  // HANDLE: Add New Record
  if (action === 'add') {
    const rowData = currentHeaders.map(h => params.data[h] !== undefined ? params.data[h] : "");
    sheet.appendRow(rowData);
  } 
  
  // HANDLE: Update Existing Record
  else if (action === 'update') {
    const idColIndex = currentHeaders.indexOf('id');
    let rowIndex = -1;
    
    // Find the row with the matching ID
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][idColIndex] === params.id) {
        rowIndex = i + 1; // +1 because Sheet rows start at 1
        break;
      }
    }

    if (rowIndex > -1) {
      const rowData = currentHeaders.map(h => params.data[h] !== undefined ? params.data[h] : "");
      sheet.getRange(rowIndex, 1, 1, currentHeaders.length).setValues([rowData]);
    }
  } 
  
  // HANDLE: Delete Record
  else if (action === 'delete') {
    const idColIndex = currentHeaders.indexOf('id');
    let rowIndex = -1;
    
    for (let i = 1; i < dataRange.length; i++) {
      if (dataRange[i][idColIndex] === params.id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > -1) {
      sheet.deleteRow(rowIndex);
    }
  }

  // Return success
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
