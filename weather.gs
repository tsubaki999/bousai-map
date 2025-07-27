//緯度経度取得
function getLatLngFromRegionName(prefOrRegion) {
  for (const [prefName, prefData] of Object.entries(regionLatLngMaster)) {
    // 都道府県名に一致
    if (prefName === prefOrRegion) {
      return { lat: prefData.lat, lng: prefData.lng, matched: prefName };
    }

    // 気象区分に一致
    if (prefData.regions) {
      for (const [regionName, regionData] of Object.entries(prefData.regions)) {
        if (regionName === prefOrRegion) {
          return { lat: regionData.lat, lng: regionData.lng, matched: `${prefName} ${regionName}` };
        }
      }
    }
  }

  // スプレッドシートキャッシュ
  let sheet = ss.getSheetByName("緯度経度キャッシュ");
  if (!sheet) sheet = ss.insertSheet("緯度経度キャッシュ");

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) sheet.appendRow(["地域名", "緯度", "経度"]);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === prefOrRegion) {
      return { lat: data[i][1], lng: data[i][2], matched: `cache: ${prefOrRegion}` };
    }
  }

  // Google Maps API 呼び出し
  const [lat, lng] = fetchLatLngFromGoogle(prefOrRegion);
  if (lat && lng) {
    sheet.appendRow([prefOrRegion, lat, lng]);
    return { lat, lng, matched: `google: ${prefOrRegion}` };
  }
  return { lat: '', lng: '', matched: null };
}

// Google Maps API
function fetchLatLngFromGoogle(address) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const res = UrlFetchApp.fetch(url);
    const json = JSON.parse(res.getContentText());

    if (json.status === "OK" && json.results.length > 0) {
      const location = json.results[0].geometry.location;
      return [location.lat, location.lng];
    } else {
      Logger.log(`❌ Geocode failed for ${address}: ${json.status}`);
      return ['', ''];
    }
  } catch (e) {
    Logger.log(`❌ API error for ${address}: ${e.message}`);
    return ['', ''];
  }
}


function parseAlertToSheet(detailUrl, sheet, feedTitle = '') {
  try {
    const xmlText = UrlFetchApp.fetch(detailUrl).getContentText('UTF-8');
    const doc = XmlService.parse(xmlText);
    const root = doc.getRootElement();

    const nsHead = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/informationBasis1/');
    const nsBody = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/body/meteorology1/');
    const nsEb = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/elementBasis1/');

    const head = root.getChild('Head', nsHead);
    const reportDateTime = head?.getChildText('ReportDateTime', nsHead) || '不明';

    const body = root.getChild('Body', nsBody);
    if (!body) return;

    const meteoInfos = body.getChildren('MeteorologicalInfos', nsBody);
    meteoInfos.forEach(infoGroup => {
      const infoList = infoGroup.getChildren('MeteorologicalInfo', nsBody);
      infoList.forEach(info => {
        const items = info.getChildren('Item', nsBody);
        items.forEach(item => {
          const area = item.getChild('Area', nsBody);
          const areaName = area ? area.getChildText('Name', nsBody) : '不明';

          const result = getLatLngFromRegionName(areaName);
          const [lat, lng] = [result.lat, result.lng];

          const kinds = item.getChildren('Kind', nsBody);
          kinds.forEach(kind => {
            const property = kind.getChild('Property', nsBody);
            if (!property) return;

            const type = property.getChildText('Type', nsBody) || '不明項目';

            // 🔽 警報級の出力条件
            const include =
              type === '大雨特別警報' ||
              ((type.includes('特別警報') && type !== '大雨特別警報') || type === '高潮警報' || type === '土砂災害警戒情報') ||
              ((type.endsWith('警報') && type !== '高潮警報' && !type.includes('特別警報')) || type === '高潮注意報');

            if (!include) return;

            let value = '', unit = '', desc = '';

            const detail = property.getChild('DetailForecast', nsBody);
            if (detail) {
              const parts = detail.getChildren();
              parts.forEach(part => {
                const sentence = part.getChildText('Sentence', nsBody) || '';
                const base = part.getChild('Base', nsBody);
                if (base) {
                  const ebChildren = base.getChildren().filter(c => c.getNamespace().getURI() === nsEb.getURI());
                  if (ebChildren.length > 0) {
                    const eb = ebChildren[0];
                    value = eb.getText() || '';
                    unit = eb.getAttribute('unit')?.getValue() || '';
                    desc = eb.getAttribute('description')?.getValue() || sentence;
                  }
                } else {
                  desc = sentence;
                }
              });
            }

            // SentenceやBaseから補完
            if (!desc) {
              desc = property.getChildText('Sentence', nsBody) || '';
            }
            if (!value && !unit && !desc) {
              const base = property.getChild('Base', nsBody);
              if (base) {
                const ebChildren = base.getChildren().filter(c => c.getNamespace().getURI() === nsEb.getURI());
                if (ebChildren.length > 0) {
                  const eb = ebChildren[0];
                  value = eb.getText() || '';
                  unit = eb.getAttribute('unit')?.getValue() || '';
                  desc = eb.getAttribute('description')?.getValue() || '';
                }
              }
            }

            // 🔽 フィードのタイトル（概要）で補完
            if (!desc && feedTitle) desc = feedTitle;

            sheet.appendRow([reportDateTime, areaName, type, desc, value, unit, lat, lng]);
          });
        });
      });
    });
  } catch (e) {
    Logger.log(`❌ URL失敗: ${detailUrl} → ${e.message}`);
  }
}



/**
 * メインの実行関数
 */
function fetchWarningViaProxy() {
  Logger.log('高度プロキシ経由での防災情報XML取得処理を開始します...');
  
  try {
    const detailXmlUrls = getDetailXmlUrlsFromFeed_();
    
    if (detailXmlUrls === null) {
      Logger.log('警報ヘッドラインのフィード取得に失敗しました。処理を終了します。');
      return;
    }
    
    if (detailXmlUrls.length === 0) {
      Logger.log('現在発表されている新しい警報・注意報のフィードはありませんでした。');
      return;
    }
    
    Logger.log(`${detailXmlUrls.length}件の警報フィードが見つかりました。詳細を解析します...`);
    
    const allWarningRows = [];
    const fetchTime = new Date();

    for (const url of detailXmlUrls) {
      const parsedRows = parseDetailXml_(url, fetchTime);
      if (parsedRows && parsedRows.length > 0) {
        allWarningRows.push(...parsedRows);
      }
      Utilities.sleep(1200); // 各サーバーに配慮し、長めに待機
    }
    
    if (allWarningRows.length > 0) {
      appendToSheet_(allWarningRows);
      Logger.log(`${allWarningRows.length}件の詳細な警報・注意報を記録しました。`);
      SpreadsheetApp.getActiveSpreadsheet().toast(`${allWarningRows.length}件の警報を記録しました。`, '成功', 10);
    } else {
      Logger.log('フィードはありましたが、記録対象となる詳細な警報・注意報は見つかりませんでした。');
    }
    
  } catch (e) {
    Logger.log(`エラーが発生しました: ${e.stack}`);
  }
}

/**
 * ★★★ 今回の最重要修正点 ★★★
 * 高度なプロキシ経由でデータを取得し、中身を安全に返すヘルパー関数
 * @param {string} targetUrl - 取得したい本来のURL。
 * @return {string|null} 取得したデータの中身。失敗した場合はnull。
 */
function fetchDataViaProxy_(targetUrl) {
  // 以前のプロキシよりも信頼性が高いサービスに変更し、JSON形式で結果を取得
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
  
  try {
    const response = UrlFetchApp.fetch(proxyUrl, {'muteHttpExceptions': true});
    const responseCode = response.getResponseCode();
    
    if (responseCode !== 200) {
      Logger.log(`プロキシサーバー自体へのアクセスに失敗。Status: ${responseCode}`);
      return null;
    }

    // プロキシからの応答をJSONとして解析
    const jsonResponse = JSON.parse(response.getContentText());
    
    // プロキシが取得した先のサーバーのステータスコードをチェック
    if (jsonResponse.status && jsonResponse.status.http_code === 200) {
      // 成功した場合のみ、中身(contents)を返す
      return jsonResponse.contents;
    } else {
      Logger.log(`プロキシは動作しましたが、対象URLの取得に失敗。URL: ${targetUrl}, Target Status: ${jsonResponse.status.http_code}`);
      return null;
    }
  } catch (e) {
    Logger.log(`プロキシへのアクセスまたはJSON解析中にエラー: ${e.message}`);
    return null;
  }
}

/**
 * 警報ヘッドラインのフィードXMLを取得し、詳細XMLのURLを配列で返します。
 */
function getDetailXmlUrlsFromFeed_() {
  const feedUrl = 'https://www.data.jma.go.jp/developer/xml/feed/warn.xml';
  const xmlString = fetchDataViaProxy_(feedUrl);
  
  if (!xmlString) return null;
  
  const document = XmlService.parse(xmlString);
  const atom = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  
  const entries = document.getRootElement().getChildren('entry', atom);
  const urls = [];
  
  for (const entry of entries) {
    const link = entry.getChild('id', atom).getText();
    const title = entry.getChild('title', atom).getText();
    if (!title.includes('発表警報等なし') && !title.includes('解除')) {
      urls.push(link);
    }
  }
  return urls;
}

/**
 * 詳細XMLを解析し、スプレッドシートに書き込むための行データ配列を返します。
 */
function parseDetailXml_(url, fetchTime) {
  const xmlString = fetchDataViaProxy_(url);
  if (!xmlString) return null;

  try {
    const rows = [];
    const document = XmlService.parse(xmlString);
    const root = document.getRootElement();
    const jmx = root.getNamespace();

    const control = root.getChild('Control', jmx);
    const publishingOffice = control.getChild('PublishingOffice', jmx).getText();
    const reportDatetime = new Date(root.getChild('Head', jmx).getChild('ReportDateTime', jmx).getText()).toLocaleString('ja-JP');

    const items = root.getChild('Body', jmx).getChild('Warning', jmx).getChildren('Item', jmx);
    
    for (const item of items) {
      const areaName = item.getChild('Area', jmx).getChild('Name', jmx).getText();
      const kinds = item.getChildren('Kind', jmx);
      
      for (const kind of kinds) {
        const status = kind.getChild('Status', jmx).getText();
        if (status !== '解除' && status !== '発表警報等なし') {
          const kindName = kind.getChild('Name', jmx).getText();
          rows.push([
            fetchTime.toLocaleString('ja-JP'), reportDatetime, publishingOffice,
            areaName, kindName, status
          ]);
        }
      }
    }
    return rows;
  } catch (e) {
    Logger.log(`XMLの解析中にエラーが発生。URL: ${url}, エラー: ${e.message}`);
    return null; // 解析失敗時はnullを返す
  }
}

/**
 * (変更なし) スプレッドシートにデータを追記します。
 */
function appendToSheet_(dataRows) {
  if (dataRows.length === 0) return;
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME, 0);
    const header = ['取得日時', '発表日時', '都道府県', '市区町村', '警報・注意報', '状況'];
    sheet.appendRow(header);
    sheet.getRange('A1:F1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  sheet.getRange(sheet.getLastRow() + 1, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
  sheet.autoResizeColumns(1, dataRows[0].length);
}

//kokokara
// 気象警報・注意報取得
function getWeatherWarnings() {
  const url = 'https://www.data.jma.go.jp/developer/xml/feed/regular.xml';
  const xml = UrlFetchApp.fetch(url).getContentText();
  const doc = XmlService.parse(xml);
  const ns = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  
  const entries = doc.getRootElement().getChildren('entry', ns);
  const warnings = [];

  entries.forEach(entry => {
    warnings.push({
      title: entry.getChildText('title', ns),
      summary: entry.getChildText('summary', ns),
      updated: entry.getChildText('updated', ns),
      link: entry.getChild('link', ns).getAttribute('href').getValue(),
    });
  });
  return warnings;
}


// --- 設定項目 ---
const SHEET_NAME = '気象警報情報'; // 出力先のシート名

/**
 * 気象庁の防災情報フィードを取得し、地域情報を抽出してスプレッドシートに書き込みます。
 */
function pullMeteoAndWriteToSheet() {
  Logger.log('処理を開始します...');

  // 1. スプレッドシートとシートを準備
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['更新日時', 'タイトル', 'ヘッドライン本文', '検出地域', '緯度', '経度'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    Logger.log(`シート「${SHEET_NAME}」を新規作成し、ヘッダーを書き込みました。`);
  }

  // 2. 気象庁のフィードからデータを取得
  const url = 'http://www.data.jma.go.jp/developer/xml/feed/extra.xml';
  const xml = UrlFetchApp.fetch(url).getContentText();
  const xmlDoc = XmlService.parse(xml);
  const rootDoc = xmlDoc.getRootElement();
  const nsDefault = XmlService.getNamespace("", 'http://www.w3.org/2005/Atom');
  const entries = rootDoc.getChildren("entry", nsDefault);
  
  const valuesToWrite = []; // シートに書き込むための2次元配列
  
  for(let i = 0; i < entries.length; i++) {
    const title = entries[i].getChildText("title", nsDefault);
    const updated = entries[i].getChildText("updated", nsDefault);
    const content = entries[i].getChildText("content", nsDefault);

    // --- 【重要】重複記録を防ぐためのフィルタリング ---
    // トリガーで定期実行する場合、以下の時間のフィルタリングを有効にすることを強く推奨します。
    // 例えば10分毎に実行する場合、10分以内に更新された情報のみを対象にします。
    const date = new Date(updated).getTime();
    if (Date.now() - date > (10 * 60 * 1000)) { // 10分(600,000ミリ秒)より古い情報はスキップ
      continue;
    }
    // -----------------------------------------------------------

    // ヘッドライン本文から地域を全て検索
    const foundRegions = findRegionsInText(content);
    
    // 地域が見つかった場合、シートに書き込むデータを作成
    if (foundRegions.length > 0) {
      const formattedDate = toLocalDate(updated);
      
      // 1つのヘッドラインに複数地域あれば、その数だけ行データを作成
      foundRegions.forEach(region => {
        valuesToWrite.push([
          formattedDate,
          title,
          content,
          region.name,
          region.lat,
          region.lng
        ]);
      });
    }
  }
  
  // 3. データをスプレッドシートに書き込む
  if (valuesToWrite.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, valuesToWrite.length, valuesToWrite[0].length)
         .setValues(valuesToWrite);
    Logger.log(`${valuesToWrite.length}件のレコードをシート「${SHEET_NAME}」に追記しました。`);
  } else {
    Logger.log('シートに書き込む新しい情報はありませんでした。');
  }
  
  Logger.log('処理を終了します。');
}

/**
 * 指定されたテキストの中から、regionLatLngMasterに含まれる地域名をすべて検索し、
 * 該当する地域の情報（地域名, 緯度, 経度）を配列で返します。
 */
function findRegionsInText(text) {
  // (以前の回答と同じコードのため、内容は省略)
  const foundRegions = [];
  const foundRegionNames = new Set();
  if (!text || typeof text !== 'string') { return foundRegions; }
  for (const prefName in regionLatLngMaster) {
    if (text.includes(prefName) && !foundRegionNames.has(prefName)) {
      foundRegions.push({ name: prefName, lat: regionLatLngMaster[prefName].lat, lng: regionLatLngMaster[prefName].lng });
      foundRegionNames.add(prefName);
    }
    const prefData = regionLatLngMaster[prefName];
    if (prefData.regions && typeof prefData.regions === 'object') {
      for (const subRegionName in prefData.regions) {
        if (text.includes(subRegionName) && !foundRegionNames.has(subRegionName)) {
          const subRegionData = prefData.regions[subRegionName];
          foundRegions.push({ name: subRegionName, lat: subRegionData.lat, lng: subRegionData.lng });
          foundRegionNames.add(subRegionName);
        }
      }
    }
  }
  return foundRegions;
}

/**
 * ISO形式の日時文字列を日本の書式に変換します。
 */
function toLocalDate(dateString) {
  const date = new Date(dateString);
  return Utilities.formatDate(date, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
}


/**
 * スプレッドシートから気象警報情報を取得する【★★★ キャッシュ対応版 ★★★】
 * @return {Array<Object>} 警報情報の配列。
 */
/*
function getWeatherWarningsFromSheet() {
  
  // 1. キャッシュサービスを取得
  const cache = CacheService.getScriptCache();
  const cacheKey = 'weather_warnings_v2'; // キャッシュを識別するためのユニークなキー

  // 2. キャッシュにデータがあるか確認
  const cachedData = cache.get(cacheKey);
  if (cachedData != null) {
    Logger.log("気象警報：キャッシュからデータを取得しました。");
    return JSON.parse(cachedData); // キャッシュされたデータをすぐに返す
  }
  
  // --- ▼▼▼ キャッシュがなかった場合の処理 ▼▼▼ ---
  Logger.log("気象警報：キャッシュがないため、シートから新規にデータを取得します。");
  
  try {
    // データの更新
    pullMeteoAndWriteToSheet();
    SpreadsheetApp.flush(); // 更新を即時反映
    
    const sheetName = '気象警報情報';
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

    if (!sheet) {
      Logger.log('シート「' + sheetName + '」が見つかりません。');
      return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) { 
      return []; 
    }
    
    const startRow = Math.max(2, lastRow - 49); // パフォーマンスのため直近50件に絞る
    const numRows = lastRow - startRow + 1;
    
    const data = sheet.getRange(startRow, 1, numRows, 7).getValues();
    
    const mappedData = data.map(row => {
      return {
        time: (row[0] instanceof Date) ? row[0] : new Date(row[0]),
        title: row[1],
        summary: row[2],
        region: row[3],
        lat: row[4],
        lng: row[5],
        link: row[6]
      };
    });
    
    const now = new Date();
    const sixtyMinutesAgo = new Date(now.getTime() - (60 * 60 * 1000));

    const warnings = mappedData.filter(w => {
      const hasLat = w.lat !== null && w.lat !== '';
      const hasLng = w.lng !== null && w.lng !== '';
      const isNotCancelled = !w.title.includes('解除') && !w.summary.includes('解除');
      const isRecent = w.time >= sixtyMinutesAgo;
      return hasLat && hasLng && isNotCancelled && isRecent;
    });
    
    const finalData = warnings.map(w => ({ ...w, time: w.time.toISOString() }));

    // 3. 取得・整形したデータをキャッシュに保存
    // 有効期限を 300秒 (5分) に設定
    if(finalData.length > 0) {
      cache.put(cacheKey, JSON.stringify(finalData), 300);
      Logger.log(`気象警報：新しいデータをキャッシュに保存しました（${finalData.length}件、有効期限5分）。`);
    }

    return finalData;

  } catch (e) {
    Logger.log('getWeatherWarningsFromSheetでエラーが発生しました: ' + e.toString() + ' Stack: ' + e.stack);
    return []; 
  }
}
*/

/* =======================================================
   雨雲レーダー用のサーバー時刻タイムスタンプを生成する関数
   PCの時計ではなく、Googleサーバーの現在時刻を返す
 ======================================================= */
function getJmaTimestampFromServer() {
  try {
    var now = new Date(); // Googleサーバーの現在時刻を取得
    var baseTime = new Date(now.getTime() - 10 * 60 * 1000); 

    var minutes = baseTime.getUTCMinutes();
    var roundedMinutes = Math.floor(minutes / 5) * 5;
    
    var targetDate = new Date(baseTime);
    targetDate.setUTCMinutes(roundedMinutes, 0, 0);

    var Y = targetDate.getUTCFullYear();
    var M = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
    var D = String(targetDate.getUTCDate()).padStart(2, '0');
    var h = String(targetDate.getUTCHours()).padStart(2, '0');
    var m = String(targetDate.getUTCMinutes()).padStart(2, '0');
    
    return Y + M + D + h + m + '00';
  } catch (e) {
    console.error("getJmaTimestampFromServer failed:", e);
    return null;
  }
}

function getServerTime() {
  return new Date();
}

/**
 * 【★★★ データ構造FIX版 ★★★】
 * 気象庁から週間天気予報のデータを取得し、キャッシュする関数。
 */
function getWeeklyForecast() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'weekly_forecast_v3'; // ロジック変更のためキーを更新
  
  const cachedData = cache.get(cacheKey);
  if (cachedData != null) {
    Logger.log("週間天気予報：キャッシュからデータを取得しました。");
    return JSON.parse(cachedData);
  }

  Logger.log("週間天気予報：キャッシュがないため、APIから新規にデータを取得します。");

  try {
    const url = "https://www.jma.go.jp/bosai/forecast/data/forecast/010000.json?v=" + new Date().getTime();
    const response = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});

    if (response.getResponseCode() !== 200) {
      Logger.log(`週間天気予報の取得に失敗 (Code: ${response.getResponseCode()})`);
      cache.put(cacheKey, JSON.stringify(null), 300);
      return null;
    }
    
    const forecastData = JSON.parse(response.getContentText());
    
    // データが配列であり、中身があることを確認
    if (Array.isArray(forecastData) && forecastData.length > 0) {
      cache.put(cacheKey, JSON.stringify(forecastData), 10800); // 3時間キャッシュ
      Logger.log("週間天気予報：新しいデータをキャッシュに保存しました。");
      return forecastData;
    } else {
      Logger.log("取得した天気予報データが空または不正な形式です。");
      return null;
    }

  } catch (e) {
    Logger.log("週間天気予報の取得または解析中にエラー: " + e.message);
    return null;
  }
}


/**
 * 【テスト用・修正版】getWeeklyForecast関数の動作を確認する
 */
function test_getWeeklyForecast() {
  Logger.log("--- 週間天気予報 取得テスト開始 ---");

  // 1回目の実行
  Logger.log("1回目: APIから新規取得を試みます...");
  const firstData = getWeeklyForecast();

  // ★★★ 正しいキーと配列構造をチェック ★★★
  if (firstData && Array.isArray(firstData) && firstData.length > 0 && firstData[0].publishingOffice) {
    Logger.log(` -> 成功: ${firstData.length}件の予報区データを取得しました。`);
    Logger.log(` -> 例: 最初の予報発表官署「${firstData[0].publishingOffice}」`);
  } else if (firstData) {
    Logger.log(" -> データは取得できましたが、想定した構造と異なります。");
    Logger.log(" -> 取得データサンプル: " + JSON.stringify(firstData[0]).substring(0, 300));
  } else {
    Logger.log(" -> 失敗: データが取得できませんでした。");
  }
  
  Logger.log("--- 1回目の実行終了 ---");
  
  Utilities.sleep(2000); 

  Logger.log("--- 2回目の実行（キャッシュ利用）テスト開始 ---");

  // 2回目の実行
  const secondData = getWeeklyForecast();
  if (secondData && Array.isArray(secondData) && secondData.length > 0) {
    Logger.log(` -> 成功: キャッシュから ${secondData.length}件のデータを取得しました。`);
  } else {
    Logger.log(" -> 失敗: キャッシュからデータが取得できませんでした。");
  }
  
  Logger.log("--- 2回目の実行終了 ---");
}


/**
 * 【★★★ デバッグ強化版 ★★★】
 * スプレッドシートから気象警報情報を取得し、都道府県リストも併せて返す。
 */
function getWeatherWarningsFromSheet() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'weather_warnings_v5'; // デバッグのためキーを更新
  
  const cachedData = cache.get(cacheKey);
  if (cachedData != null) {
    Logger.log("気象警報：キャッシュからデータを取得しました。");
    return JSON.parse(cachedData);
  }
  
  Logger.log("気象警報：キャッシュがないため、シートから新規にデータを取得します。");
  
  try {
    // pullMeteoAndWriteToSheet(); // デバッグ中は一時的にコメントアウトして、既存のシートデータで確認
    // SpreadsheetApp.flush(); 
    
    const sheetName = '気象警報情報';
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) {
      Logger.log(`シート「${sheetName}」がないか、データがありません。`);
      return { warnings: [], affectedPrefectures: [] };
    }
    
    const numRows = Math.min(100, sheet.getLastRow() - 1);
    const data = sheet.getRange(2, 1, numRows, 7).getValues();
    Logger.log(`シートから ${data.length} 件のレコードを読み込みました。`);

    const mappedData = data.map(row => ({ time: new Date(row[0]), title: row[1], summary: row[2], region: row[3], lat: row[4], lng: row[5], link: row[6] }));
    
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    Logger.log(`フィルタリング基準時刻: ${threeHoursAgo.toLocaleString()}`);

    // ★★★ フィルタリング前の全データをログ出力 ★★★
    // mappedData.forEach((d, i) => {
    //   Logger.log(`[${i}] ${d.time.toLocaleString()} - ${d.title} - ${d.region}`);
    // });

    const warnings = mappedData.filter(w => 
        w.title && 
        !w.title.includes('解除') && 
        w.time >= threeHoursAgo
    );
    
    Logger.log(`時間フィルターと「解除」除外後の有効な警報件数: ${warnings.length} 件`);
    if(warnings.length > 0) {
      Logger.log(` -> 最初の有効な警報: ${warnings[0].title} in ${warnings[0].region}`);
    }

    const affectedPrefs = [...new Set(warnings.map(w => {
      if (!w.region) return null;
      const match = w.region.match(/^(.+[都道府県])/);
      return match ? match[1] : null;
    }).filter(p => p !== null))];

    const finalData = {
      warnings: warnings.map(w => ({ ...w, time: w.time.toISOString() })),
      affectedPrefectures: affectedPrefs
    };

    cache.put(cacheKey, JSON.stringify(finalData), 300);
    Logger.log(`最終的にクライアントに返すデータ: 警報${finalData.warnings.length}件, 都道府県${finalData.affectedPrefectures.length}件`);

    return finalData;

  } catch (e) {
    Logger.log('getWeatherWarningsFromSheetでエラー: ' + e.toString());
    return { warnings: [], affectedPrefectures: [] }; 
  }
}