/**
 * HKDSE Math Image Proxy v2
 * Google Apps Script to serve Google Drive images
 * 
 * Setup:
 * 1. Create new Apps Script project
 * 2. Paste this code
 * 3. Save and Deploy > New deployment > Web app
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Copy the Deployment URL
 * 
 * Usage:
 * https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?id=FILE_ID
 */

function doGet(e) {
  const id = e.parameter.id;
  
  if (!id) {
    return HtmlService.createHtmlOutput('Missing id parameter')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  try {
    // Get the file from Google Drive
    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    const contentType = blob.getContentType();
    const data = Utilities.base64Encode(blob.getBytes());
    
    // Return as data URL
    const imgSrc = `data:${contentType};base64,${data}`;
    const html = `<img src="${imgSrc}" style="max-width:100%;height:auto;" />`;
    
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setTitle('HKDSE Image');
      
  } catch (error) {
    return HtmlService.createHtmlOutput(`Error: ${error.message}`)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Alternative endpoint for direct image embedding in <img> src
 * Returns redirect to Google Drive thumbnail (if file is public)
 */
function doGetThumbnail(e) {
  const id = e.parameter.id;
  
  if (!id) {
    return ContentService.createTextOutput('Missing id parameter');
  }
  
  // Use Google's thumbnail service (works for public files)
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
  
  return HtmlService.createHtmlOutput(
    `<img src="${thumbnailUrl}" />`
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * CORS proxy endpoint - returns image with proper headers
 */
function doGetCORS(e) {
  const id = e.parameter.id;
  
  if (!id) {
    return ContentService.createTextOutput(JSON.stringify({error: 'Missing id'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    
    return ContentService.createTextOutput(blob.getDataAsString())
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Content-Type': blob.getContentType(),
        'Cache-Control': 'public, max-age=3600'
      });
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
