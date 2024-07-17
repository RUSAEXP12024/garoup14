const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // GoogleスプレッドシートのID
const SHEET_NAME = 'RecordUserIDs';

function resetProperties() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteAllProperties();
  Logger.log("Script properties have been reset.");
}

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  Logger.log(json); // ログにイベントデータを出力
  const events = json.events;

  //resetProperties();

  if (events && events.length > 0) {
    events.forEach(event => {
      const userId = event.source.userId;
      Logger.log(userId); // ログにユーザーIDを出力

      if (userId) {
        recordUserId(userId);
        if (event.message && event.message.text === "天気通知を受け取る") {
          sendReplyMessage(userId, '雨雲通知が登録されました。');
          createRainTrigger();
        } else if (event.message && event.message.text === '熱中症アラートを受け取る') {
          sendReplyMessage(userId, '熱中症アラートが登録されました。');
          createHeatAlertTrigger();
        } else if (event.message && (event.message.text === 'エアコンをオンにする')) {
          sendReplyMessage(userId, 'エアコンをオンにしました。現在の設定温度は24℃です❄️');
          const operation = event.message.text === 'エアコンをオンにする' ? 'ON' : 'OFF';
          controlAircon(operation, '24'); // 例として24度に設定
          sendReplyMessage(userId, `エアコンを${operation === 'ON' ? 'オン' : 'オフ'}にしました。`);
        } else if(event.message.text === 'エアコンをオフにする') {
          sendReplyMessage(userId, 'エアコンをオフにしました。');
        }
      }
    });
  }
 
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}));
}

function recordUserId(userId) {
  Logger.log("Recording userId: " + userId); // ログに出力
  
  // スプレッドシートを取得
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!spreadsheet) {
    Logger.log("Spreadsheet not found with ID: " + SPREADSHEET_ID);
    return;
  }
  
  // 指定したシート名のシートを取得
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("Sheet not found with name: " + SHEET_NAME);
    return;
  }
  
  // シートが空でないことを確認し、空の場合は何もせず終了
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow([userId]);
    Logger.log("UserId recorded in an empty sheet: " + userId); // 新規追加のユーザーID
    return;
  }

  // シートの内容をログに出力して確認
  const data = sheet.getRange(1, 1, lastRow, 1).getValues();
  Logger.log("Sheet data: " + JSON.stringify(data));
  
  // 重複チェック
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) {
      Logger.log("UserId already exists: " + userId); // 既存のユーザーID
      return; // 既に存在する場合は何もしない
    }
  }
  
  // 新しいユーザーIDを追加
  sheet.appendRow([userId]);
  Logger.log("UserId recorded: " + userId); // 新規追加のユーザーID
}

function sendReplyMessage(userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    'to': userId,
    'messages': [{
      'type': 'text',
      'text': message
    }]
  };
  
  const options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
    },
    'payload': JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log('Sent reply to userId: ' + userId + ', response: ' + response.getContentText());
}

function getWeather() {
  var url = "https://api.openweathermap.org/data/2.5/weather?units=metric&lat="; //以下, 必要な情報を足していく
  url = url.concat(getGPS()[0]); //緯度を足す
  url = url + "&lon=";
  url = url.concat(getGPS()[1]-0.022); //経度を足す
  url = url + "&appid=";
  url = url.concat(OPENWEATHERMAP_API_KEY); //トークン

  const options = {
    'method': 'GET',
    'muteHttpExceptions': true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = response.getContentText();
    Logger.log('Weather API response: ' + json);
    const data = JSON.parse(json);
    if (response.getResponseCode() === 200 && data.weather) {
      return data;
    } else {
      Logger.log('Invalid API response: ' + json);
      return null;
    }
  } catch (e) {
    Logger.log('Error fetching weather data: ' + e);
    return null;
  }
}

function sendLineNotification(message) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getRange('A:A').getValues();
  data.forEach(row => {
    const userId = row[0];
    if (userId) {
      const url = 'https://api.line.me/v2/bot/message/push';
      const payload = {
        'to': userId,
        'messages': [{
          'type': 'text',
          'text': message
        }]
      };
    
      const options = {
        'method': 'post',
        'headers': {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN
        },
        'payload': JSON.stringify(payload)
      };
    
      const response = UrlFetchApp.fetch(url, options);
      Logger.log('Sent notification to userId: ' + userId + ', response: ' + response.getContentText());
    }
  });
}

function monitorWeather() {
  const weatherData = getWeather();
  if (weatherData && weatherData.weather) {
    const weatherCondition = weatherData.weather[0].main.toLowerCase();
    if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle') || weatherCondition.includes('thunderstorm')) {
      sendLineNotification('まもなく、現在地で雨が降りそうです☔️');
    } else {
      sendLineNotification('しばらくの間，現在地で雨は降らないでしょう☀️☁️');
    }
  } else {
    Logger.log('天気情報を取得できませんでした。');
  }
}

function monitorTemperature() {
  const weatherData = getWeather();
  if (weatherData && weatherData.main) {
    const temperature = weatherData.main.temp;
    if (temperature > TEMP_THRESHOLD_HIGH) {
      sendLineNotification(`現在の気温は${temperature}度です。こまめに水分を摂り，熱中症に気をつけましょう！🫠💦`);
    } else {
      Logger.log('現在の気温は高温ではありません。');
    }
  } else {
    Logger.log('天気情報を取得できませんでした。');
  }
}

// 雨雲通知のためのトリガーを設定
function createRainTrigger() {
  deleteRainTriggers();
  ScriptApp.newTrigger('monitorWeather')
    .timeBased()
    .everyMinutes(5)
    .create();
}

// 高温注意のためのトリガーを設定
function createHeatAlertTrigger() {
  deleteHeatAlertTriggers();
  ScriptApp.newTrigger('monitorTemperature')
    .timeBased()
    .everyMinutes(5)
    .create();
}

function deleteRainTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'monitorWeather') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

function deleteHeatAlertTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'monitorTemperature') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}