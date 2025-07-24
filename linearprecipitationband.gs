/**
 * 【★★★ キャッシュ対応＆フォールバック機能付き ★★★】
 * 線状降水帯の情報を取得する。キャッシュ -> シートの順で探し、それでもデータがなければ訓練データを返す。
 * @returns {Object} { polygons: Array, texts: Array } という形式のオブジェクト
 */
function getLineShapedPrecipitationFromSheet() {
  
  // 1. キャッシュサービスを取得
  const cache = CacheService.getScriptCache();
  const cacheKey = 'lsp_data_v2'; // 線状降水帯データ用のキャッシュキー
  const defaultValue = { polygons: [], texts: [] };

  // 2. キャッシュにデータがあるか確認
  const cachedData = cache.get(cacheKey);
  if (cachedData != null) {
    Logger.log("線状降水帯：キャッシュからデータを取得しました。");
    return JSON.parse(cachedData); // キャッシュされたデータを返す
  }

  // --- ▼▼▼ キャッシュがなかった場合の処理 ▼▼▼ ---
  Logger.log("線状降水帯：キャッシュがないため、シートから新規にデータを取得します。");
  
  try {
    const SHEET_NAME = '線状降水帯';
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet) {
      Logger.log(`シート「${SHEET_NAME}」が見つからないため、新規作成しますが、データは0件です。`);
      // シートがない場合はダミーデータを返す
      return generateDummyLspData();
    }
    
    let polygonAreas = [];
    let textAreaList = [];

    // --- 実際のデータを読み込む処理 ---
    if (sheet.getLastRow() >= 2) {
      const numRows = Math.min(20, sheet.getLastRow() - 1); // 直近20件に絞る
      const data = sheet.getRange(2, 1, numRows, 4).getValues();

      data.forEach(function(row) {
        // row[1] (発表時刻) をDateオブジェクトに変換
        const time = new Date(row[1]).toISOString(); 
        const name = row[2];
        const coordinatesJson = row[3];
        try {
          const coordinates = JSON.parse(coordinatesJson);
          if (coordinates && coordinates.length > 0) {
            polygonAreas.push({ time, name, coordinates });
          } else {
            textAreaList.push({ time, name });
          }
        } catch (e) {
          textAreaList.push({ time, name });
        }
      });
    }

    // 3. データが取得できたか判定
    let finalData;
    if (polygonAreas.length > 0 || textAreaList.length > 0) {
      // 取得できた場合
      finalData = { polygons: polygonAreas, texts: textAreaList };
      Logger.log(`線状降水帯: 実データ ${polygonAreas.length + textAreaList.length}件をキャッシュに保存します。（有効期限10分）`);
      cache.put(cacheKey, JSON.stringify(finalData), 600); // 10分間キャッシュ
    } else {
      // 取得できなかった場合：訓練用のダミーデータを生成
      Logger.log("線状降水帯データが0件のため、訓練用のダミーデータを生成します。");
      finalData = generateDummyLspData();
    }
    
    return finalData;

  } catch (e) {
    Logger.log('シートからの線状降水帯情報読み込み中にエラーが発生: ' + e.toString());
    return defaultValue;
  }
}


/**
 * 訓練用の線状降水帯ダミーデータを生成するヘルパー関数
 */
function generateDummyLspData() {
  const dummyPolygon = [
    {
      time: new Date().toISOString(),
      name: '【訓練】関東南部',
      coordinates: [[ [139.6, 35.6], [140.2, 35.6], [140.2, 35.2], [139.6, 35.2], [139.6, 35.6] ]] 
    }
  ];
  const dummyText = [
    {
      time: new Date().toISOString(),
      name: '【訓練】伊豆諸島（座標なし）'
    }
  ];
  return { polygons: dummyPolygon, texts: dummyText };
}
