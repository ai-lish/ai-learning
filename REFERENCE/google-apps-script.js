/**
 * 少康老師功課管理系統 - Google Apps Script
 * 
 * 使用方法：
 * 1. 打開 Google Sheets
 * 2. Extensions → Apps Script
 * 3. 刪除所有 code，貼上呢個
 * 4. Save (Ctrl+S)
 * 5. Deploy → New deployment
 * 6. Select type → Web App
 * 7. Execute as: Me, Who has access: Anyone
 * 8. Deploy
 * 9. 複製 Web App URL
 */

const SPREADSHEET_ID = '1VljZfrVqyzYSkJaxcF_U7NMvjjGroigZdQlhYcy6HjE';
const SHEET_NAME = '工作表1';

/**
 * 處理 GET 請求 - 獲取所有功課
 */
function doGet(e) {
  const action = e.parameter.action || 'read';
  
  if (action === 'read') {
    return getHomework(e);
  } else if (action === 'readDate') {
    return getHomeworkByDate(e);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({error: 'Unknown action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 處理 POST 請求 - 新增/更新功課
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'add') {
      return addHomework(data);
    } else if (data.action === 'update') {
      return updateHomework(data);
    } else if (data.action === 'delete') {
      return deleteHomework(data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({error: 'Unknown action'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 獲取所有功課
 */
function getHomework(e) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({data: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  const values = range.getValues();
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const result = values.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService
    .createTextOutput(JSON.stringify({data: result}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 根據日期獲取功課
 */
function getHomeworkByDate(e) {
  const date = e.parameter.date;
  if (!date) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'date parameter required'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    return ContentService
      .createTextOutput(JSON.stringify({data: []}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const results = values.filter(row => {
    const rowDate = formatDate(row[0]);
    return rowDate === date;
  });
  
  const formatted = results.map(row => ({
    Date: formatDate(row[0]),
    Subject: row[1],
    Detail: row[2],
    Deadline: row[3]
  }));
  
  return ContentService
    .createTextOutput(JSON.stringify({data: formatted}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 新增功課
 * 格式: { action: 'add', date: '2026-03-22', subject: 'Math', detail: 'Page 10', deadline: '25/03' }
 */
function addHomework(data) {
  const { date, subject, detail, deadline } = data;
  
  if (!date || !subject || !detail) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'date, subject, detail are required'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  sheet.appendRow([
    new Date(date),
    subject,
    detail,
    deadline || ''
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'Homework added'}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 更新指定日期的功課
 * 格式: { action: 'update', date: '2026-03-22', subject: 'Math', detail: 'New content', deadline: '25/03' }
 */
function updateHomework(data) {
  const { date, subject, detail, deadline } = data;
  
  if (!date) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'date is required'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const lastRow = sheet.getLastRow();
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  
  for (let i = 0; i < values.length; i++) {
    const rowDate = formatDate(values[i][0]);
    if (rowDate === date) {
      const rowNum = i + 2;
      
      if (subject) sheet.getRange(rowNum, 2).setValue(subject);
      if (detail) sheet.getRange(rowNum, 3).setValue(detail);
      if (deadline !== undefined) sheet.getRange(rowNum, 4).setValue(deadline);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Homework updated', row: rowNum}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // 如果找不到，則新增
  return addHomework(data);
}

/**
 * 刪除功課
 * 格式: { action: 'delete', date: '2026-03-22', subject: 'Math' }
 */
function deleteHomework(data) {
  const { date, subject } = data;
  
  if (!date) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'date is required'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  const lastRow = sheet.getLastRow();
  
  for (let i = lastRow; i >= 2; i--) {
    const rowDate = formatDate(sheet.getRange(i, 1).getValue());
    const rowSubject = sheet.getRange(i, 2).getValue();
    
    if (rowDate === date && (subject === undefined || rowSubject === subject)) {
      sheet.deleteRow(i);
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'Homework deleted'}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
function formatDate(date) {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 測試函數 - 在 Apps Script editor 內運行呢個黎測試
 */
function testAddHomework() {
  const result = addHomework({
    date: '2026-03-23',
    subject: 'Math',
    detail: 'Page 10-12',
    deadline: '25/03'
  });
  Logger.log(result.getContent());
}
