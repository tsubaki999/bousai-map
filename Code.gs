// グローバル変数
const ss = SpreadsheetApp.getActiveSpreadsheet();

/**
 * 他のHTMLファイルをインポートするためのヘルパー関数
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * ウェブアプリのGETリクエストを処理する関数。
 * HTMLテンプレートを使用して、複数ファイルを結合します。
 */
function doGet(e) {
  var htmlOutput = HtmlService.createTemplateFromFile('map').evaluate()
      .setTitle('物語防災マップ(アルファ版)')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  var faviconUrl = 'https://cdn-icons-png.flaticon.com/512/6572/6572628.png';
  htmlOutput.setFaviconUrl(faviconUrl);
      
  return htmlOutput;
}

/**
 * ウェブアプリのGETリクエストを処理する関数。
 * .setTitle() と .setFaviconUrl() を使ってタイトルとファビコンを確実に設定します。
 * FaviconはサポートされているPNG形式のURLを使用します。
 */
/*
function doGet(e) {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('map')
      .setTitle('物語防災マップ(アルファ版)') // ページタイトルを直接設定
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      
  // ★★★ 修正点：最も安定している透過PNG画像のURLに戻します ★★★
  var faviconUrl = 'https://cdn-icons-png.flaticon.com/512/6572/6572628.png';
  htmlOutput.setFaviconUrl(faviconUrl);
      
  return htmlOutput;
}*/

// 配送ルートデータをスプレッドシートから取得し返す（経由地可変対応）
function getRouteMapData() {
  const routeSheet = ss.getSheetByName('配送ルート指定');
  const baseSheet = ss.getSheetByName('拠点一覧');
  const storeSheet = ss.getSheetByName('店舗一覧');

  const baseMap = Object.fromEntries(
    baseSheet.getDataRange().getValues().slice(1).map(r => [r[0].trim(), r[2].trim()])
  );
  const storeMap = Object.fromEntries(
    storeSheet.getDataRange().getValues().slice(1).map(r => [r[0].trim(), r[2].trim()])
  );

  const routeData = routeSheet.getDataRange().getValues().slice(1);
  const results = [];

  routeData.forEach(row => {
    const originName = row[0]?.toString().trim();
    if (!originName || !baseMap[originName]) return;

    // 経由地：列B以降〜列Zの中で、空白列が出るまで読み取る
    const waypointNames = [];
    for (let i = 1; i < row.length; i++) {
      const val = row[i]?.toString().trim();
      if (val === '') break;
      waypointNames.push(val);
    }

    if (waypointNames.length === 0) return;

    const priority = row[waypointNames.length + 1]?.toString().trim() || '未設定';
    const frequency = row[waypointNames.length + 2]?.toString().trim() || '未設定';
    const notes = row[waypointNames.length + 3]?.toString().trim() || '-';

    const origin = baseMap[originName];
    const waypoints = waypointNames.map(name => ({
      name,
      address: storeMap[name] || baseMap[name] || ''
    })).filter(w => w.address);

    if (waypoints.length === 0) return;

    results.push({
      originName: originName,
      origin: origin,
      destinationName: waypoints[waypoints.length - 1].name,
      destination: waypoints[waypoints.length - 1].address,
      waypoints: waypoints.slice(0, -1),
      priority,
      frequency,
      notes
    });
  });

  Logger.log(JSON.stringify(results, null, 2));
  return results;
}

// Script PropertiesからAPIキーを取得
function getApiKey() {
  return PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');
}

//配送ルート再計算
function recordRouteSegments() {
  const routeSheet = ss.getSheetByName('配送ルート指定');
  const baseSheet = ss.getSheetByName('拠点一覧');
  const storeSheet = ss.getSheetByName('店舗一覧');
  const outputSheet = ss.getSheetByName('配送距離詳細') || ss.insertSheet('配送距離詳細');

  outputSheet.clearContents();
  outputSheet.appendRow(['No', '出発地', '到着地', '区間名', '距離 (km)', '所要時間 (分)', '渋滞時所要時間 (分)']);

  const baseMap = Object.fromEntries(baseSheet.getDataRange().getValues().slice(1).map(r => [r[0].trim(), r[2].trim()]));
  const storeMap = Object.fromEntries(storeSheet.getDataRange().getValues().slice(1).map(r => [r[0].trim(), r[2].trim()]));

  const routeData = routeSheet.getDataRange().getValues().slice(1);
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');
  let counter = 1;

  const departureTime = Math.floor(Date.now() / 1000); // UNIXタイムスタンプ秒

  for (const row of routeData) {
    const originName = row[0]?.toString().trim();
    // 1列目以降すべてを経由地とみなす（空欄は除外）
    const waypointNames = row.slice(1).filter(n => n && n.toString().trim()).map(n => n.toString().trim());
    const allNames = [originName, ...waypointNames];

    for (let i = 0; i < allNames.length - 1; i++) {
      const fromName = allNames[i];
      const toName = allNames[i + 1];
      const fromAddress = baseMap[fromName] || storeMap[fromName];
      const toAddress = baseMap[toName] || storeMap[toName];

      if (!fromAddress) {
        Logger.log(`住所不明: 出発地 '${fromName}'`);
        continue;
      }
      if (!toAddress) {
        Logger.log(`住所不明: 到着地 '${toName}'`);
        continue;
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(fromAddress)}&destination=${encodeURIComponent(toAddress)}&mode=driving&departure_time=${departureTime}&key=${apiKey}`;
      try {
        const response = UrlFetchApp.fetch(url);
        const json = JSON.parse(response.getContentText());

        if (json.status === 'OK') {
          const leg = json.routes[0].legs[0];
          const distanceKm = leg.distance.value / 1000;
          //const durationMin = Math.round(leg.duration.value / 60);
          //const trafficMin = leg.duration_in_traffic ? Math.round(leg.duration_in_traffic.value / 60) : durationMin;


        let durationMin = Math.round(leg.duration.value / 60);
        let trafficMin = leg.duration_in_traffic ? Math.round(leg.duration_in_traffic.value / 60) : durationMin;

        // 異常パターンに対処：渋滞時の方が早い → 値をスワップまたは修正
        if (trafficMin < durationMin) {
          Logger.log(`⚠ 渋滞時の方が短い (${fromName} → ${toName}) → 値を補正`);
          [trafficMin, durationMin] = [durationMin, trafficMin]; // 値を入れ替え
}

          outputSheet.appendRow([
            counter++,
            fromName,
            toName,
            `${fromName} → ${toName}`,
            distanceKm.toFixed(1),
            durationMin,
            trafficMin
          ]);
        } else {
          Logger.log(`APIエラー: ${json.status} (${fromName} → ${toName})`);
        }
      } catch (e) {
        Logger.log(`API通信エラー: ${e.message}`);
      }

      Utilities.sleep(1000); // レート制限対策
    }
  }

  SpreadsheetApp.flush();
}

function runTest() {
  const start = "東京都渋谷区";
  const end = "東京都新宿区";
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}&mode=driving&departure_time=now&key=${apiKey}`;
  const res = UrlFetchApp.fetch(url);
  const json = JSON.parse(res.getContentText());

  Logger.log(json.status); // OKが出れば成功
  Logger.log(JSON.stringify(json.routes[0].legs[0], null, 2));
}

function fetchDisasterInfo() {
  const sheet = ss.getSheetByName("災害情報");
  if (!sheet) ss.insertSheet("災害情報");

  const url = "https://alerts.weather.yahoo.co.jp/rss/warning/13.xml"; // 東京都
  const xml = UrlFetchApp.fetch(url).getContentText();
  const document = XmlService.parse(xml);
  const channel = document.getRootElement().getChild("channel");
  const items = channel.getChildren("item");

  sheet.clearContents();
  sheet.appendRow(["日時", "タイトル", "リンク"]);

  items.forEach(item => {
    const title = item.getChildText("title");
    const link = item.getChildText("link");
    const pubDate = item.getChildText("pubDate");

    sheet.appendRow([pubDate, title, link]);
  });
}

function parseJmaAlertDetailFullToSheet() {
  const detailUrl = 'https://www.data.jma.go.jp/developer/xml/data/20250712064001_0_VPFD60_430000.xml';
  const xmlText = UrlFetchApp.fetch(detailUrl).getContentText('UTF-8');
  const doc = XmlService.parse(xmlText);
  const root = doc.getRootElement();

  const nsJmx = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/');
  const nsHead = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/informationBasis1/');
  const nsBody = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/body/meteorology1/');
  const nsEb = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/elementBasis1/');

  const head = root.getChild('Head', nsHead);
  const reportDateTime = head ? head.getChildText('ReportDateTime', nsHead) : '不明';

  const body = root.getChild('Body', nsBody);
  if (!body) {
    Logger.log("Body要素が見つかりません");
    return;
  }

  const sheetName = 'JMA_Alert_Full';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  const headers = ['発表時刻', '地域', '項目', '説明文', '数値', '単位', '緯度', '経度'];
  sheet.appendRow(headers);

  // 地域名 → 緯度経度 の辞書（熊本県内）
  const locationMap = {
    '熊本地方': [32.8032164, 130.7079369],
    '阿蘇地方': [32.9521207, 131.1211959],
    '天草・芦北地方': [32.2985124, 130.4940582],
    '球磨地方': [32.2523649, 130.6512065]
  };

  const meteoInfos = body.getChildren('MeteorologicalInfos', nsBody);
  meteoInfos.forEach(infoGroup => {
    const infoList = infoGroup.getChildren('MeteorologicalInfo', nsBody);
    infoList.forEach(info => {
      const items = info.getChildren('Item', nsBody);
      items.forEach(item => {
        const area = item.getChild('Area', nsBody);
        const areaName = area ? area.getChildText('Name', nsBody) : '不明';
        //const [lat, lng] = locationMap[areaName] || ['', ''];
        const [lat, lng] = getLatLngFromAddress(areaName);

        const kinds = item.getChildren('Kind', nsBody);
        kinds.forEach(kind => {
          const property = kind.getChild('Property', nsBody);
          if (!property) return;

          const type = property.getChildText('Type', nsBody) || '不明項目';
          const detail = property.getChild('DetailForecast', nsBody);
          if (!detail) return;

          const parts = detail.getChildren();
          parts.forEach(part => {
            const sentence = part.getChildText('Sentence', nsBody) || '';
            const base = part.getChild('Base', nsBody);
            let value = '';
            let unit = '';
            let desc = sentence;

            if (base) {
              const ebChildren = base.getChildren().filter(c => c.getNamespace().getURI() === nsEb.getURI());
              if (ebChildren.length > 0) {
                const eb = ebChildren[0];
                value = eb.getText() || '';
                unit = eb.getAttribute('unit')?.getValue() || '';
                desc = eb.getAttribute('description')?.getValue() || sentence;
              }
            }

            sheet.appendRow([reportDateTime, areaName, type, desc, value, unit, lat, lng]);
          });
        });
      });
    });
  });

  Logger.log('完了：スプレッドシートへ出力しました（緯度経度付き）');
}


function getWeatherObservations() {
  const sheet = ss.getSheetByName("気象データ");
  if (!sheet) {
    Logger.log("❌ シートが見つかりません");
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  Logger.log("ヘッダー:", headers);

  const regionIdx = headers.indexOf("地域");
  const itemIdx = headers.indexOf("項目");
  const valueIdx = headers.indexOf("数値");
  const unitIdx = headers.indexOf("単位");
  const timeIdx = headers.indexOf("発表時刻");

  const regionLatLngMap = {
    "熊本地方": { lat: 32.8, lng: 130.7 },
    "阿蘇地方": { lat: 32.9, lng: 131.1 },
    "天草・芦北地方": { lat: 32.4, lng: 130.0 },
    "球磨地方": { lat: 32.2, lng: 130.8 }
  };

  const result = [];

  for (let i = 1; i < data.length; i++) {
    const region = data[i][regionIdx];
    const item = data[i][itemIdx];
    const value = data[i][valueIdx];
    const unit = data[i][unitIdx];
    const updated = data[i][timeIdx];

    Logger.log(`解析中: 地域=${region}, 数値=${value}`);

    if (!regionLatLngMap[region]) continue;
    if (typeof value !== 'number') continue;

    result.push({
      region, item, value, unit, updated,
      lat: regionLatLngMap[region].lat,
      lng: regionLatLngMap[region].lng
    });
  }

  Logger.log("✅ 結果:", result);
  return result;
}


function updateLatLngSheet() {
  const sheet = ss.getSheetByName('地域緯度経度');
  const data = sheet.getDataRange().getValues();

  // ヘッダーがある前提（地域名, 緯度, 経度）
  for (let i = 1; i < data.length; i++) {
    const region = data[i][0];
    if (!data[i][1] || !data[i][2]) {
      const [lat, lng] = getLatLngFromAddress(region);
      sheet.getRange(i + 1, 2).setValue(lat);
      sheet.getRange(i + 1, 3).setValue(lng);
      Utilities.sleep(200); // API制限対策で少し待機
    }
  }
}

// 【重要】この関数は手動で一度だけ実行します
/**
 * '店舗一覧'シートを読み込み、緯度経度が空の店舗のジオコーディングを行って結果をシートに書き込む関数。
 * API制限を避けるため、1秒に1回のリクエストに制限しています。
 */
function updateStoreCoordinates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('店舗一覧');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('「店舗一覧」という名前のシートが見つかりません。');
    return;
  }
  
  // A列からE列までのデータを取得
  const data = sheet.getRange("A1:E" + sheet.getLastRow()).getValues();
  
  // 先頭行（ヘッダー）をスキップ
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // 列番号を実際のシートに合わせる
    const storeName = row[0]; // A列
    const address = row[2];   // C列
    const lat = row[3];       // D列
    const lng = row[4];       // E列

    // D列かE列が空欄の場合のみジオコーディングを実行
    if (!lat || !lng) {
      if (address) {
        Logger.log(`ジオコーディング中: ${storeName} (${address})`);
        try {
          const geocodeResult = Maps.newGeocoder().geocode(address);
          
          if (geocodeResult.status === 'OK' && geocodeResult.results.length > 0) {
            const location = geocodeResult.results[0].geometry.location;
            // D列（緯度）とE列（経度）に結果を書き込む
            sheet.getRange(i + 1, 4).setValue(location.lat); // D列は4番目
            sheet.getRange(i + 1, 5).setValue(location.lng); // E列は5番目
            Logger.log(` -> 成功: lat=${location.lat}, lng=${location.lng}`);
          } else {
            Logger.log(` -> ジオコーディング失敗: ${geocodeResult.status}`);
          }
           // Google Maps APIの利用制限を避けるために1秒待機
          Utilities.sleep(1000); 
        } catch (e) {
          Logger.log(` -> エラー発生: ${e.message}`);
        }
      }
    }
  }
  SpreadsheetApp.getUi().alert('緯度経度の更新処理が完了しました。');
}
