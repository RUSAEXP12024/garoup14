function getWeather() {
  const url = 'https://api.openweathermap.org/data/2.5/weather?lat=TARGET_LATITUDE&lon=TARGET_LONGITUDE&appid=OPENWEATHERMAP_API_KEY'; //現状，APIが無効となるエラーが出る．解決策を模索中
  const response = UrlFetchApp.fetch(url);
  const json = response.getContentText();
  return JSON.parse(json);
}

function sendLineNotification(message) {
  const url = 'https://notify-api.line.me/api/notify';
  const payload = {
    'message': message
  };

  const options = {
    'method': 'post',
    'payload': payload,
    'headers': {
      'Authorization': 'Bearer ' + LINE_NOTIFY_TOKEN
    },
    'muteHttpExceptions': true
  };

  UrlFetchApp.fetch(url, options);
}

function monitorWeather() {
  const weatherData = getWeather();
  if (weatherData && weatherData.current) {
    const weatherCondition = weatherData.current.weather[0].main.toLowerCase();
    if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle') || weatherCondition.includes('thunderstorm')) {
      sendLineNotification('現在、指定された場所で雨が降っています。');
    } else {
      Logger.log('現在、雨は降っていません。');
    }
  } else {
    Logger.log('天気情報を取得できませんでした。');
  }
}

// 定期実行するためのトリガーを設定
function createTrigger() {
  ScriptApp.newTrigger('monitorWeather')
    .timeBased()
    .everyMinutes(5)
    .create();
}

// トリガーを削除するための関数
function deleteTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
}