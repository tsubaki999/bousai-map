/**
 * 気象庁から最新の台風情報を取得・整形し、キャッシュする関数。
 * ★★★ 公式の防災情報電文リスト(regular.json)からXMLを取得する最終ロジック ★★★
 * @returns {Array<Object>} 各台風情報の配列
 */
function getTyphoonData() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'typhoon_data_v14_final'; // 最終版としてキーを更新
  
  const cachedData = cache.get(cacheKey);
  if (cachedData != null) {
    Logger.log("台風情報：キャッシュからデータを取得しました。");
    const parsedData = JSON.parse(cachedData);
    if (parsedData.length === 0) { return generateIsewanTyphoonDummyData(); }
    return parsedData;
  }

  Logger.log("--- 台風情報取得開始 (公式電文リストベース) ---");
  
  try {
    // 1. 最新の防災情報電文リストを取得
    const listUrl = "https://www.jma.go.jp/bosai/forecast/data/feed/regular.json?v=" + new Date().getTime();
    Logger.log("1. 電文リストを取得します: " + listUrl);

    const listResponse = UrlFetchApp.fetch(listUrl, {'muteHttpExceptions': true});
    if (listResponse.getResponseCode() !== 200) {
      Logger.log(`電文リストの取得に失敗 (Code: ${listResponse.getResponseCode()})。訓練データを返します。`);
      return generateIsewanTyphoonDummyData();
    }
    
    // 2. リストから最新の台風情報(VPTA5*)のXMLパスを抽出
    const summaryList = JSON.parse(listResponse.getContentText());
    // 最新のものを取得するため、逆順にして探す
    const latestTyphoonEntry = summaryList.reverse().find(item => item.id.startsWith("VPTA5"));
    
    if (!latestTyphoonEntry) {
      Logger.log("現在、電文リストに有効な台風情報(VPTA5*)がありません。訓練データを返します。");
      cache.put(cacheKey, JSON.stringify([]), 300);
      return generateIsewanTyphoonDummyData();
    }
    
    const xmlUrl = `https://www.jma.go.jp/bosai/${latestTyphoonEntry.json}`;
    Logger.log(`2. 最新の台風情報XMLを取得します: ${xmlUrl}`);

    // 3. XMLファイルを取得して解析
    const xmlResponse = UrlFetchApp.fetch(xmlUrl, {'muteHttpExceptions': true});
    if (xmlResponse.getResponseCode() !== 200) {
      Logger.log(`台風XMLの取得に失敗 (Code: ${xmlResponse.getResponseCode()})。訓練データを返します。`);
      return generateIsewanTyphoonDummyData();
    }

    const xmlText = xmlResponse.getContentText();
    const finalTyphoons = parseTyphoonXml(xmlText);
    
    if (finalTyphoons.length === 0) {
      Logger.log("★★★ XMLを解析しましたが有効な台風情報がなかったため、訓練データを表示します。 ★★★");
      cache.put(cacheKey, JSON.stringify([]), 300);
      return generateIsewanTyphoonDummyData();
    }
    
    cache.put(cacheKey, JSON.stringify(finalTyphoons), 300);
    Logger.log(`--- 台風情報取得終了 --- | 最終取得件数: ${finalTyphoons.length}件`);
    return finalTyphoons;

  } catch (e) {
    Logger.log("台風情報の取得または解析中に致命的なエラーが発生しました: " + e.message + "\nStack: " + e.stack);
    return generateIsewanTyphoonDummyData();
  }
}

/**
 * 【改訂版】気象庁の台風情報XMLを解析して地図用JSONに変換するヘルパー関数
 * @param {string} xmlText - 気象庁から取得したXML形式の文字列
 * @returns {Array<Object>} 地図描画用の台風データ配列
 */
function parseTyphoonXml(xmlText) {
  try {
    const document = XmlService.parse(xmlText);
    const root = document.getRootElement();
    const ns = root.getNamespace();
    const body = root.getChild('Body', ns);
    const meteorologicalInfos = body.getChild('MeteorologicalInfos', ns);
    const items = meteorologicalInfos.getChildren('Item', ns);
    
    let typhoons = {};

    items.forEach(item => {
      const kind = item.getChild('Kind', ns);
      const property = kind.getChild('Property', ns);
      const type = property.getChild('Type', ns).getText();
      
      // '台風情報' 以外の電文はスキップ
      if (type !== '台風情報') return;

      const typhoonNameProperty = property.getChild('TyphoonNamePart', ns);
      const name = typhoonNameProperty.getChild('Name', ns).getText();
      const number = typhoonNameProperty.getChild('TyphoonNumber', ns).getText(); // 例: 2407
      const typhoonNumberFull = 'T' + number; // T2407

      const area = item.getChild('Area', ns);
      const epicenter = area.getChild('Name', ns).getText(); // 例: 日本の南

      // 予報点情報を格納するための配列を準備
      if (!typhoons[typhoonNumberFull]) {
        typhoons[typhoonNumberFull] = { name: `台風第${parseInt(number.substring(2),10)}号（${name}）`, number: typhoonNumberFull, forecastPoints: [] };
      }

      // 'CenterPart' (実況) または 'ForecastPart' (予報) を処理
      const parts = item.getChildren('TimeDefine', ns);
      parts.forEach(part => {
        const timeDefines = part.getChildren('TimeDefine', ns);
        timeDefines.forEach(timeDefine => {
          const time = timeDefine.getChild('DateTime', ns).getText();
          const kind = timeDefine.getChild('Kind', ns);
          const pointType = kind.getChild('Property', ns).getChild('Type', ns).getText();
          const center = kind.getChild('Property', ns).getChild('Center', ns);
          
          if (!center) return;
          const coordinate = center.getChild('jmx_eb:Coordinate', center.getNamespace('eb'));
          const description = coordinate.getAttribute('description').getValue(); // "中心位置"など
          const latLng = coordinate.getText().split('/');
          const [lat, lng] = latLng[0].replace('+', '').split('+').map(Number);
          
          const point = {
            type: pointType, time: time, lat: lat, lng: lng,
            pressure: center.getChild('Pressure', ns) ? parseInt(center.getChild('Pressure', ns).getText(), 10) : null,
            maxWindSpeed: center.getChild('MaxWindSpeed',ns) ? parseFloat(center.getChild('MaxWindSpeed',ns).getText()) : null,
            forecastRadius: 0, windRadius: 0, stormRadius: 0
          };

          // 円情報を取得
          center.getChildren('jmx_eb:Circle', center.getNamespace('eb')).forEach(circle => {
            const base = circle.getChild('jmx_eb:BasePoint', circle.getNamespace('eb'));
            const radii = circle.getChildren('jmx_eb:Radius', circle.getNamespace('eb'));
            const circleType = base.getAttribute('type').getValue();
            
            radii.forEach(radius => {
              if (radius.getAttribute('unit').getValue() === 'km') {
                const r_km = parseFloat(radius.getText());
                if(circleType === '暴風域') point.stormRadius = r_km * 1000;
                else if(circleType === '強風域') point.windRadius = r_km * 1000;
                else if(circleType === '予報円') point.forecastRadius = r_km * 1000;
              }
            });
          });
          
          typhoons[typhoonNumberFull].forecastPoints.push(point);
        });
      });
    });

    return Object.values(typhoons);
  } catch(e) {
    Logger.log("XMLの解析中に致命的なエラーが発生しました: " + e.message + "\nStack: " + e.stack);
    return [];
  }
}

/**
 * 伊勢湾台風を想定した訓練用データを生成するヘルパー関数
 */
function generateIsewanTyphoonDummyData() {
  const now = new Date();
  const forecastPoints = [
      { type: '実況', time: now.toISOString(), lat: 33.45, lng: 135.76, pressure: 929, maxWindSpeed: 55, stormRadius: 110000, windRadius: 330000, forecastRadius: 0 },
      { type: '予報', time: new Date(now.getTime() + 3 * 3600 * 1000).toISOString(), lat: 34.5, lng: 136.2, pressure: 935, maxWindSpeed: 50, forecastRadius: 130000 },
      { type: '予報', time: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(), lat: 35.18, lng: 136.9, pressure: 940, maxWindSpeed: 45, forecastRadius: 150000 },
      { type: '予報', time: new Date(now.getTime() + 9 * 3600 * 1000).toISOString(), lat: 36.2, lng: 137.5, pressure: 950, maxWindSpeed: 40, forecastRadius: 185000 },
      { type: '予報', time: new Date(now.getTime() + 12 * 3600 * 1000).toISOString(), lat: 37.5, lng: 138.5, pressure: 960, maxWindSpeed: 35, forecastRadius: 220000 }
  ];

  return [{
      name: '【訓練】伊勢湾台風型',
      number: 'T5915',
      forecastPoints: forecastPoints
  }];
}
