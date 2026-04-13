// Google Apps Script for Student Login API
// Sheet expected: 名稱 = '學生資料', columns: Class, Number, Name, ID, Password, LastLogin

const SHEET_NAME = '學生資料';
const TOKEN_PROPERTY = 'student_tokens'; // store tokens in PropertiesService as JSON map

function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || '';
    if (action === 'login') return loginStudent(body);
    if (action === 'changePassword') return changePassword(body);
    return ContentService.createTextOutput(JSON.stringify({success:false, error:'unknown action'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error: err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    if (action === 'verify') return verifyToken(e.parameter.token);
    return ContentService.createTextOutput(JSON.stringify({success:false, error:'unknown action'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error: err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found. Please create it with correct headers.');
  return sheet;
}

function findStudentRow(sheet, className, number) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var classCol = headers.indexOf('Class');
  var numCol = headers.indexOf('Number');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][classCol]) === String(className) && String(data[i][numCol]) === String(number)) return i+1; // 1-indexed
  }
  return -1;
}

function loginStudent(body) {
  var className = body.class;
  var number = body.number;
  var password = body.password;
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var classCol = headers.indexOf('Class');
  var numCol = headers.indexOf('Number');
  var nameCol = headers.indexOf('Name');
  var idCol = headers.indexOf('ID');
  var pwdCol = headers.indexOf('Password');
  var lastCol = headers.indexOf('LastLogin');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][classCol]) === String(className) && String(data[i][numCol]) === String(number)) {
      var stored = String(data[i][pwdCol]);
      if (stored !== String(password)) return ContentService.createTextOutput(JSON.stringify({success:false, error:'密碼錯誤'})).setMimeType(ContentService.MimeType.JSON);
      // success: generate token and update last login
      var token = generateToken(className, number);
      var now = new Date();
      sheet.getRange(i+1, lastCol+1).setValue(now);
      storeToken(token, {class: className, number: number, name: data[i][nameCol], ts: now});
      return ContentService.createTextOutput(JSON.stringify({success:true, name: data[i][nameCol], token: token})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success:false, error:'學生記錄不存在'})).setMimeType(ContentService.MimeType.JSON);
}

function changePassword(body) {
  var className = body.class;
  var number = body.number;
  var oldPassword = body.oldPassword;
  var newPassword = body.newPassword;
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var classCol = headers.indexOf('Class');
  var numCol = headers.indexOf('Number');
  var pwdCol = headers.indexOf('Password');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][classCol]) === String(className) && String(data[i][numCol]) === String(number)) {
      var stored = String(data[i][pwdCol]);
      if (stored !== String(oldPassword)) return ContentService.createTextOutput(JSON.stringify({success:false, error:'舊密碼錯誤'})).setMimeType(ContentService.MimeType.JSON);
      sheet.getRange(i+1, pwdCol+1).setValue(String(newPassword));
      return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({success:false, error:'學生記錄不存在'})).setMimeType(ContentService.MimeType.JSON);
}

function verifyToken(token) {
  var map = getTokenMap();
  if (map[token]) {
    var info = map[token];
    return ContentService.createTextOutput(JSON.stringify({success:true, name: info.name, class: info.class, number: info.number})).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({success:false, error:'invalid token'})).setMimeType(ContentService.MimeType.JSON);
}

function generateToken(cls, num) {
  var ts = new Date().getTime();
  var raw = cls + '|' + num + '|' + ts;
  var tok = Utilities.base64Encode(raw);
  return tok;
}

function getTokenMap(){
  var prop = PropertiesService.getScriptProperties().getProperty(TOKEN_PROPERTY);
  if (!prop) return {};
  try { return JSON.parse(prop); } catch(e){ return {}; }
}

function storeToken(token, info){
  var map = getTokenMap();
  map[token] = info;
  PropertiesService.getScriptProperties().setProperty(TOKEN_PROPERTY, JSON.stringify(map));
}
