function doGet() {
  return HtmlService.createHtmlOutputFromFile('GPS');
}

function recordLocation(latitude, longitude) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID); // スプレッドシートIDをここに入力
  var sheet = ss.getSheetByName('GPS'); // シート名をここに入力
  sheet.appendRow([new Date(), latitude, longitude]);
  return 'Latitude: ' + latitude + ', Longitude: ' + longitude;
}