// Nature Remoから環境データを取得
function getEnvironmentData() {
  var url = 'https://api.nature.global/1/devices';
  var options = {
    'method' : 'get',
    'headers': {
      'Authorization': 'Bearer ' + REMO_API_TOKEN
    }
  };
  var response = UrlFetchApp.fetch(url, options);
  var devices = JSON.parse(response.getContentText());
  
  var device = devices[0]; // 仮に最初のデバイスを使用
  return {
    temperature: device.newest_events.te.val,
    humidity: device.newest_events.hu.val
  };
}

// エアコン操作用関数
function controlAircon(operation, temperature) {
  var url = 'https://api.nature.global/1/appliances/' + AIRCON_ID + '/aircon_settings';
  var options = {
    'method' : 'post',
    'headers': {
      'Authorization': 'Bearer ' + REMO_API_TOKEN
    },
    'payload' : {
      'button' : operation === 'ON' ? 'power-on' : 'power-off',
      'temperature' : temperature //temperatureはstring型であることに注意
    }
  };
  UrlFetchApp.fetch(url, options);
}

// スプレッドシートのデータを読み込んでエアコンを操作する
function checkAndControlAircon() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  // 現在の温度と湿度を取得
  var environmentData = getEnvironmentData();
  var currentTemperature = environmentData.temperature;
  var currentHumidity = environmentData.humidity;

  for (var i = 1; i < data.length; i++) {
    var operation = data[i][0];
    var setTemperature = data[i][1];
    var conditionTemperature = data[i][2];
    var conditionHumidity = data[i][3];

    if ((currentTemperature >= conditionTemperature) && (currentHumidity >= conditionHumidity)) {
      controlAircon(operation, setTemperature);
    }
  }
}

// トリガーを設定して定期的に実行
function createTrigger() {
  ScriptApp.newTrigger('checkAndControlAircon')
    .timeBased()
    .everyMinutes(1)
    .create();
}