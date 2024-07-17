function recordSensorData() {
  const deviceData = getNatureRemoData("devices");　　　　//data取得
  const lastSensorData = getLastData("sensor");　　　　　//最終data取得

  var arg = {
    te:deviceData[0].newest_events.te.val,　　//温度
    hu:deviceData[0].newest_events.hu.val,　　//湿度
    il:deviceData[0].newest_events.il.val,　  //照度
  }

  setSensorData(arg, lastSensorData + 1);
}

function setSensorData(data, row) {
  getSheet('sensor').getRange(row, 1, 1, 4).setValues([[new Date(), data.te, data.hu, data.il]])
}
var access_token = ''//←トークンを入れる
var spreadsheetId = ''//←スプレッドシートのIDを入れる
function remo() {
  var data = getNatureRemoData();　　　　//data取得
  var lastData = getLastData();　　　　　//最終date取得
  setLaremoData(
  {
    te:data[0].newest_events.te.val,　　//温度
    hu:data[0].newest_events.hu.val,　　//湿度
    il:data[0].newest_events.il.val,　　//照度
  },
  lastData.row + 1//最終data追加作業
  );
}
 
function getNatureRemoData() {　　　　　　//Remoのapiをお借りします
  var url = "https://api.nature.global/1/devices";
  var headers = {
    "Content-Type" : "application/json;",
    'Authorization': 'Bearer ' + access_token,
  };
 
  var postData = {
 
  };
 
  var options = {





    "method" : "get",
    "headers" : headers,
  };
 
  var data = JSON.parse(UrlFetchApp.fetch(url, options));
  Logger.log(data[0].newest_events)
  Logger.log(data[0].newest_events.te.val)
  Logger.log(data[0].newest_events.hu.val)
  Logger.log(data[0].newest_events.il.val)
 
  return data;
  
}
 
function getLastData() {
  var datas = SpreadsheetApp.openById(spreadsheetId).getSheetByName('log').getDataRange().getValues()　　//logシートをゲットする
  var data = datas[datas.length - 1]
 
  return {
    totalpoint:data[1],
    coupon:data[2],
    row:datas.length,
  }
}
 
function setLaremoData(data, row) {
  SpreadsheetApp.openById(spreadsheetId).getSheetByName('log').getRange(row, 1).setValue(new Date())//A2にゲットした日時ほりこむ
  SpreadsheetApp.openById(spreadsheetId).getSheetByName('log').getRange(row, 2).setValue(data.te)　　//B2に温度追加
  SpreadsheetApp.openById(spreadsheetId).getSheetByName('log').getRange(row, 3).setValue(data.hu)　　//C2湿度追加(幅があるけど気にしない)
  SpreadsheetApp.openById(spreadsheetId).getSheetByName('log').getRange(row, 4).setValue(data.il)　　//D2照度追加
}