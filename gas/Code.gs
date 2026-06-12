// =====================================================================
// RETIRED 2026-06-12 — see PLANNING/20260611_GLOBAL_LOGIN_FIREBASE_GOOGLE_V3.md
// =====================================================================
// V3 改用 Firebase Authentication + Google provider。
// 舊嘅 GAS login endpoint 已被退役，唔再由前端呼叫。
//
// 保留本檔只作 archive / reference；任何前端唔應該再 import 或 call
// 下列 endpoint。如需重新啟用班別／學號／密碼登入，必須先開新 planning。
//
// 已退役功能：
//   - doPost action='login'             → 由 Firebase Auth Google 取代
//   - doPost action='changePassword'    → Google 帳戶由 Google 自己管理
//
// 仍保留（archive 用）：
//   - doGet action='verify'             → verifyToken（前端已不再用）
//   - SPREADSHEET_ID                    → 保留作 reference，新工作唔再需要
// =====================================================================

// Sheet expected: 名稱 = '學生資料', columns: Class, Number, Name, ID, Password, LastLogin
const SHEET_NAME = '學生資料';
const TOKEN_KEY = 'ail_student_tokens_v1'; // Used as PropertiesService key

function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || '';
    // V3 RETIRED — login + changePassword 全部停用。Response 改為 success:false
    if (action === 'login') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'RETIRED: GAS login endpoint 已退役。請用 Firebase Auth Google 登入。'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'changePassword') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'RETIRED: GAS changePassword endpoint 已退役。Google 帳戶密碼由 Google 管理。'
      })).setMimeType(ContentService.MimeType.JSON);
    }
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

// ─── CONFIG ────────────────────────────────────────────────
// RETIRED — SPREADSHEET_ID 留低只作 archive reference。
// 前端已經唔再 import / call GAS endpoint；新工作唔需要此 ID。
const SPREADSHEET_ID = '1gbCWh6_9tYJkUUJJEK68InI_RbxAs6C4ZiSLISLyXB4';

function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" not found.');
  return sheet;
}

// ─── RETIRED 函式（保留作 archive；前端唔再呼叫）─────────────────────
function loginStudent_RETIRED_DO_NOT_USE(body) {
  // ... 原始實作保留喺 git history。
  // V3 後任何前端 import 都會喺 doPost 收到 success:false 嘅 RETIRED 訊息。
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'RETIRED'
  })).setMimeType(ContentService.MimeType.JSON);
}

function changePassword_RETIRED_DO_NOT_USE(body) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'RETIRED'
  })).setMimeType(ContentService.MimeType.JSON);
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

function getTokenMap() {
  var prop = PropertiesService.getScriptProperties().getProperty(TOKEN_KEY);
  if (!prop) return {};
  try { return JSON.parse(prop); } catch(e){ return {}; }
}

function storeToken(token, info) {
  var map = getTokenMap();
  map[token] = info;
  PropertiesService.getScriptProperties().setProperty(TOKEN_KEY, JSON.stringify(map));
}
