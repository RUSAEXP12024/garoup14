function getGPS() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID); // スプレッドシートIDをここに入力
  var sheet = ss.getSheetByName('GPS'); // シート名をここに入力
  var last = sheet.getLastRow()
  var location = sheet.getSheetValues(last, 2, 1, 2) // location = [latitude, longitude]

  console.log(location)

  return location
}