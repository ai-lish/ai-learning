/**
 * HKDSE Math Image Proxy
 * Google Apps Script to serve Google Drive images
 * 
 * Deploy as Web App:
 * 1. Deploy > New deployment > Web app
 * 2. Execute as: Me
 * 3. Who has access: Anyone
 * 4. Copy the Web App URL
 * 
 * Usage:
 * https://script.google.com/macros/s/.../exec?id=FILE_ID
 */

function doGet(e) {
  const id = e.parameter.id;
  
  if (!id) {
    return HtmlService.createHtmlOutput('Missing id parameter')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  try {
    // Use Google's thumbnail service - redirects to lh3.googleusercontent.com
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
            img { max-width: 100%; height: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <img src="${thumbnailUrl}" alt="HKDSE Image" crossorigin="anonymous" />
        </body>
      </html>
    `;
    
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setTitle('HKDSE Image');
      
  } catch (error) {
    return HtmlService.createHtmlOutput(`Error: ${error.message}`)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Debug: Check if we can access a file
 */
function doGetDebug(e) {
  const id = e.parameter.id;
  
  if (!id) {
    return ContentService.createTextOutput('Missing id parameter');
  }
  
  try {
    const file = DriveApp.getFileById(id);
    return ContentService.createTextOutput(`File accessible: ${file.getName()}`);
  } catch (error) {
    return ContentService.createTextOutput(`Cannot access file: ${error.message}`);
  }
}
