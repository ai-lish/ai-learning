/**
 * HKDSE Review - Upload to Google Drive
 * 
 * 這個 Script 接收 JSON 數據並上傳到指定 Google Drive 資料夾
 * 
 * 部署方法：
 * 1. 前往 https://script.google.com
 * 2. 新建專案
 * 3. 貼上此代碼
 * 4. 部署 > 新增部署 > Web 應用程式
 * 5. 設定為「任何人可存取」
 * 6. 複製 Web 應用程式 URL
 */

// 設定 Drive 資料夾 ID
const FOLDER_ID = '175Lo70oD0xbHDJYChLXN8qMvqGjJlNcF';

/**
 * 處理 POST 請求
 * 接收 JSON 數據並上傳到 Google Drive
 */
function doPost(e) {
  try {
    // 解析請求內容
    const contents = JSON.parse(e.postData.contents);
    
    // 獲取資料夾
    const folder = DriveApp.getFolderById(FOLDER_ID);
    
    // 生成檔案名稱
    const type = contents.type || 'unknown';
    const date = new Date().toISOString().split('T')[0];
    const filename = `hkdse_${type}_${date}_${contents.total || 0}題.json`;
    
    // 創建檔案
    const file = folder.createFile(filename, JSON.stringify(contents, null, 2), 'application/json');
    
    // 返回成功響應
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '檔案已上傳',
        filename: filename,
        fileId: file.getId(),
        url: file.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // 返回錯誤響應
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 GET 請求（測試用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'HKDSE Upload API is running',
      folderId: FOLDER_ID
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 手動上傳檔案（用於測試）
 */
function manualUpload() {
  const testData = {
    type: 'test',
    export_date: new Date().toISOString(),
    total: 0,
    message: '這是測試上傳'
  };
  
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const filename = `test_${new Date().toISOString()}.json`;
  const file = folder.createFile(filename, JSON.stringify(testData, null, 2), 'application/json');
  
  Logger.log(`上傳成功: ${file.getUrl()}`);
}
