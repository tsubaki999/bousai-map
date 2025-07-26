
//地震情報表示(南海トラフ)

function getEarthquakeData() {
  return [
    {
      title: "南海トラフ巨大地震（想定）",
      content: "最大震度7（想定）",
      maxIntensity: 7,
      lat: 33.0,      // 想定震源地：紀伊半島沖
      lng: 136.5,
      detailLink: "https://www.jma.go.jp/jma/menu/menureport.html"
    },
    {
      title: "名古屋市（震度6強）",
      content: "建物倒壊多数（想定）",
      maxIntensity: 6,
      lat: 35.17,
      lng: 136.9,
      detailLink: "https://www.city.nagoya.jp/"
    },
    {
      title: "大阪市（震度6弱）",
      content: "交通機関に影響（想定）",
      maxIntensity: 6,
      lat: 34.69,
      lng: 135.5,
      detailLink: "https://www.city.osaka.lg.jp/"
    },
    {
      title: "高知市（震度7）",
      content: "津波被害大（想定）",
      maxIntensity: 7,
      lat: 33.56,
      lng: 133.53,
      detailLink: "https://www.city.kochi.kochi.jp/"
    },
    {
      title: "浜松市（震度6強）",
      content: "液状化被害（想定）",
      maxIntensity: 6,
      lat: 34.71,
      lng: 137.73,
      detailLink: "https://www.city.hamamatsu.shizuoka.jp/"
    }
  ];
}



/**
 * 【データソース変更・最終版】P2P地震情報APIから地震情報を取得し、シートに書き込む
 * @returns {Array<Object>} 地震情報の配列
 */
function getEarthquakeDataAndWriteToSheet() {
  const SHEET_NAME = '地震情報'; 
  const MAX_RECORDS = 50;

  try {
    // ★★★ データソースをP2P地震情報APIに変更 ★★★
    const url = 'https://api.p2pquake.net/v2/history?codes=551&limit=10';
    const options = {
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    
    // 200 OK以外はエラーとして扱う
    if (response.getResponseCode() !== 200) {
      Logger.log('P2P地震情報APIの取得に失敗しました。 Code: ' + response.getResponseCode());
      return [];
    }

    const json = JSON.parse(response.getContentText());
    if (!Array.isArray(json) || json.length === 0) {
      Logger.log('P2P地震情報APIから地震情報が見つかりませんでした。');
      return [];
    }

    // クライアントに返す＆シートに書き込むためのデータ配列
    const quakes = [];
    const recordsToWrite = [];
    const now = new Date(); // 取得日時

    // APIのレスポンス形式に合わせてデータを整形
    json.forEach(function(item) {
      if (item.code !== 551 || !item.earthquake) { return; } // 地震情報(code:551)以外はスキップ
      
      const eq = item.earthquake;
      const intensityMap = { '1':1, '2':2, '3':3, '4':4, '5-':5, '5+':5.5, '6-':6, '6+':6.5, '7':7 };

      const quakeData = {
        time: eq.time,
        title: '震度' + eq.maxScale / 10 + ' ' + eq.hypocenter.name,
        content: `最大震度: ${eq.maxScale / 10}, M${eq.hypocenter.magnitude}, 深さ: ${eq.hypocenter.depth}km`,
        maxIntensity: intensityMap[eq.maxScale] || eq.maxScale / 10, // 数値に変換
        magnitude: eq.hypocenter.magnitude,
        epicenter: eq.hypocenter.name,
        depth: eq.hypocenter.depth + 'km',
        lat: eq.hypocenter.latitude,
        lng: eq.hypocenter.longitude,
        detailLink: `https://www.p2pquake.net/user_earthquake_detail/${item.id}`
      };
      
      quakes.push(quakeData);

      recordsToWrite.push([
        now,
        new Date(eq.time),
        quakeData.title,
        quakeData.epicenter,
        eq.maxScale / 10, // 表示用の震度
        quakeData.magnitude,
        quakeData.depth,
        quakeData.lat,
        quakeData.lng,
        quakeData.detailLink
      ]);
    });

    // --- ここからがスプレッドシートへの書き込み処理（変更なし） ---
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        '取得日時', '発表時刻', 'タイトル', '震源地', '最大震度', 
        'マグニチュード', '深さ', '緯度', '経度', '詳細リンク'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange("A:B").setNumberFormat("yyyy/mm/dd hh:mm:ss");
      sheet.setFrozenRows(1);
    }
    
    const lastRow = sheet.getLastRow();
    const existingLinks = lastRow > 1 ? sheet.getRange(2, 10, lastRow - 1, 1).getValues().flat() : [];
    
    const newRecords = recordsToWrite.filter(function(record) {
      const link = record[9];
      return !existingLinks.includes(link);
    });

    if (newRecords.length > 0) {
      sheet.insertRowsBefore(2, newRecords.length);
      sheet.getRange(2, 1, newRecords.length, newRecords[0].length).setValues(newRecords);
      Logger.log(newRecords.length + '件の新しい地震情報をシートに記録しました。');

      const totalRows = sheet.getLastRow();
      if (totalRows > MAX_RECORDS + 1) {
        const rowsToDelete = totalRows - (MAX_RECORDS + 1);
        sheet.deleteRows(MAX_RECORDS + 2, rowsToDelete);
        Logger.log(rowsToDelete + '件の古い地震情報を削除しました。');
      }
    } else {
      Logger.log('新しい地震情報はありませんでした。');
    }

    return quakes;

  } catch (e) {
    Logger.log('地震情報の取得・処理中にエラーが発生しました: ' + e.toString() + ' Stack: ' + e.stack);
    return [];
  }
}

/**
 * 地震情報を取得する関数
 * ★★★【時間フィルター追加】発生から3時間以内のデータのみを対象とする ★★★
 * @returns {Array<Object>} 地震情報の配列
 */
function getEarthquakeDataFromSheet() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'earthquake_data_v3'; // ロジック変更のためキーを更新

  const cachedData = cache.get(cacheKey);
  if (cachedData != null) {
    Logger.log("地震情報：キャッシュからデータを取得しました。");
    return JSON.parse(cachedData);
  }

  Logger.log("地震情報：キャッシュがないため、スプレッドシートから新規にデータを取得します。");
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('地震情報');
    let quakes = [];

    if (sheet && sheet.getLastRow() > 1) {
      const numRows = Math.min(50, sheet.getLastRow() - 1);
      const data = sheet.getRange(2, 1, numRows, 10).getValues();
      
      const now = new Date();
      // ★★★ 3時間前の時刻を計算 ★★★
      const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));

      quakes = data
        .map(function(row) {
          const eventTime = new Date(row[1]);
          // ★★★ 時間フィルター：発生から3時間以上経過したデータは除外 ★★★
          if (eventTime < threeHoursAgo) {
            return null;
          }
        
          const intensityStr = String(row[4]);
          const intensityMap = { '5-':5, '5+':5.5, '6-':6, '6+':6.5 };
          return {
            time: eventTime.toISOString(),
            title: row[2],
            content: `最大震度: ${row[4]}, M${row[5]}, 深さ: ${row[6]}`,
            maxIntensity: intensityMap[intensityStr] || parseFloat(intensityStr),
            magnitude: row[5], epicenter: row[3], depth: row[6],
            lat: row[7], lng: row[8], detailLink: row[9]
          };
        })
        .filter(q => q !== null && q.lat && q.lng); // nullと無効なデータを除外
    }

    // データをキャッシュに保存（データが0件でも空配列をキャッシュ）
    Logger.log(`${quakes.length}件の有効な地震情報を取得し、キャッシュに保存します。（有効期限10分）`);
    cache.put(cacheKey, JSON.stringify(quakes), 600);

    // 3. データが取得できたか判定
    if (quakes.length > 0) {
      // 取得できた場合：データをキャッシュに保存して返す
      Logger.log(`${quakes.length}件の地震情報をシートから取得し、キャッシュに保存します。（有効期限10分）`);
      cache.put(cacheKey, JSON.stringify(quakes), 600); // 有効期限を600秒 (10分) に設定
      return quakes;
    } else {
      // 取得できなかった場合：訓練用の南海トラフ地震データを生成して返す
      Logger.log("★★★ 有効な地震情報がなかったため、訓練用の南海トラフ地震データを返します。★★★");
      const dummyQuakeData = [
        { time: new Date().toISOString(), title: '【訓練】南海トラフ巨大地震 - 紀伊半島沖', content: '最大震度: 7, M8.5, 深さ: 20km', maxIntensity: 7, lat: 33.5, lng: 135.9, detailLink: '#' },
        { time: new Date().toISOString(), title: '【訓練】南海トラフ巨大地震 - 四国沖', content: '最大震度: 7, M8.7, 深さ: 25km', maxIntensity: 7, lat: 32.8, lng: 133.8, detailLink: '#' },
        { time: new Date().toISOString(), title: '【訓練】南海トラフ巨大地震 - 東海沖', content: '最大震度: 6強, M8.2, 深さ: 30km', maxIntensity: 6.5, lat: 34.0, lng: 137.5, detailLink: '#' },
        { time: new Date().toISOString(), title: '【訓練】南海トラフ巨大地震 - 日向灘', content: '最大震度: 6強, M7.8, 深さ: 15km', maxIntensity: 6.5, lat: 32.0, lng: 132.0, detailLink: '#' }
      ];
      return dummyQuakeData;
    }
  } catch (e) {
    Logger.log('シートからの地震情報読み込み中にエラーが発生しました: ' + e.toString());
    return []; // エラー時は空配列を返す
  }
}