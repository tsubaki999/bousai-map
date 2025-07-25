/**
 * 訓練用のダミー停電データを生成するヘルパー関数。
 * @returns {Array<Object>} ダミーの店舗データ配列。
 */
function getDummyPowerOutageDataForTraining() {
  Logger.log("★★★ 訓練用のダミーデータを生成します ★★★");
  // テストしたい店舗のダミーデータをここで定義します。
  // 店舗名、住所、緯度、経度をご自身のデータに合わせて自由に書き換えてください。
  const dummyData = [
    {
      storeName: '【訓練】渋谷スクランブル店',
      address: '東京都渋谷区渋谷２丁目',
      status: 'down',
      lastSeen: new Date().toISOString(), // 現在時刻をISO形式で設定
      lat: 35.659,
      lng: 139.702
    },
    {
      storeName: '【訓練】横浜ランドマーク店',
      address: '神奈川県横浜市西区みなとみらい２丁目',
      status: 'down',
      lastSeen: new Date().toISOString(),
      lat: 35.455,
      lng: 139.631
    },
    {
      storeName: '【訓練】大阪梅田店',
      address: '大阪府大阪市北区梅田３丁目',
      status: 'down',
      lastSeen: new Date().toISOString(),
      lat: 34.702,
      lng: 135.495
    }
  ];
  return dummyData;
}
/**
 * Merakiのデバイス情報から停電（ダウン状態）の店舗データを取得する関数。
 * 全デバイスリストを基準に、各デバイスのステータスを判定するロジック。
 * @returns {Array<Object>} 停電している店舗のデータ配列。各オブジェクトはstoreName, address, status, lastSeen, lat, lng を含む。
 */
function getPowerOutageDataFromMeraki() {
  
  const isTestMode = false;
  const showDummyOnEmptyResult = true; 

  if (isTestMode) {
    Logger.log("★★★ Meraki停電情報：強制テストモードが有効です ★★★");
    return getDummyPowerOutageDataForTraining();
  }

  const props = PropertiesService.getScriptProperties();
  const apiKey = props.getProperty('MERAKI_API_KEY');
  const orgId = '1066896';

  if (!apiKey || !orgId) {
    Logger.log('Meraki APIキーまたは組織IDが設定されていません。');
    return [];
  }

  const options = {
    'method': 'get',
    'headers': { 'X-Cisco-Meraki-API-Key': apiKey, 'Content-Type': 'application/json' },
    'muteHttpExceptions': true
  };

  try {
    // 1. 組織内の全デバイスの詳細リストを先に取得する
    const devicesUrl = `https://api.meraki.com/api/v1/organizations/${orgId}/devices`;
    const devicesResponse = UrlFetchApp.fetch(devicesUrl, options);
    if (devicesResponse.getResponseCode() !== 200) {
      Logger.log(`Meraki API (devices) からエラー応答がありました。Code: ${devicesResponse.getResponseCode()}, Response: ${devicesResponse.getContentText()}`);
      return [];
    }
    const allDevices = JSON.parse(devicesResponse.getContentText());

    // 2. 全デバイスのステータスリストを取得する
    const statusesUrl = `https://api.meraki.com/api/v1/organizations/${orgId}/devices/statuses`;
    const statusesResponse = UrlFetchApp.fetch(statusesUrl, options);
    if (statusesResponse.getResponseCode() !== 200) {
      Logger.log(`Meraki API (statuses) からエラー応答がありました。Code: ${statusesResponse.getResponseCode()}, Response: ${statusesResponse.getContentText()}`);
      return [];
    }
    const deviceStatuses = JSON.parse(statusesResponse.getContentText());
    
    // 3. 全デバイスをループし、MSスイッチかつオンラインでないものを抽出する
    let downSwitchesInfo = [];
    allDevices.forEach(device => {
      if (device.model && device.model.startsWith('MS')) {
        const statusInfo = deviceStatuses.find(s => s.serial === device.serial);
        // ステータス情報があるか、もしなければUnreachableとみなし、オンラインでないものを対象とする
        if (!statusInfo || statusInfo.status !== 'online') {
          downSwitchesInfo.push(device);
          // デバッグログ
          Logger.log(` -> ダウンデバイスとして検知: ${device.name || '名前なし'} (Model: ${device.model}, Status: ${statusInfo ? statusInfo.status : 'Unreachable'})`);
        }
      }
    });

    if (downSwitchesInfo.length === 0) {
      Logger.log("ダウン状態のMSスイッチは見つかりませんでした。");
       if (showDummyOnEmptyResult) {
        Logger.log("設定に基づき、訓練用のダミーデータを返します。");
        return getDummyPowerOutageDataForTraining();
      }
      return [];
    }
     
    // 4. 地図表示用にデータを整形する
    let downSwitchesForMap = [];
    downSwitchesInfo.forEach(function(device) {
      if (device.address && device.address.trim() !== "") {
        var geocodeResult = Maps.newGeocoder().geocode(device.address);
        
        if (geocodeResult.status === 'OK' && geocodeResult.results.length > 0) {
          var location = geocodeResult.results[0].geometry.location;
          var statusInfo = deviceStatuses.find(s => s.serial === device.serial);
          
          downSwitchesForMap.push({
            storeName: device.name || '名前未設定のデバイス',
            address: device.address,
            status: 'down',
            originalStatus: statusInfo ? statusInfo.status : 'Unreachable',
            lastSeen: device.lastReportedAt || null, 
            lat: location.lat,
            lng: location.lng
          });
        } else {
            Logger.log('ジオコーディング失敗: ' + (device.name || '名前未設定') + ', ' + device.address + ' - Status: ' + geocodeResult.status);
        }
      } else {
          Logger.log('住所が設定されていないダウンデバイス: ' + (device.name || '名前未設定') + ', Serial: ' + device.serial);
      }
    });

    Logger.log(`停電（Meraki Down）として地図にプロットする店舗数: ${downSwitchesForMap.length}件`);
    
    if (downSwitchesForMap.length === 0 && showDummyOnEmptyResult) {
      Logger.log("住所がジオコーディングできたダウン状態のMSスイッチがなかったため、訓練用のダミーデータを返します。");
      return getDummyPowerOutageDataForTraining();
    }
    
    return downSwitchesForMap;

  } catch (e) {
    Logger.log('Meraki APIの処理中にエラーが発生しました: ' + e.message + ' Stack: ' + e.stack);
    return [];
  }
}