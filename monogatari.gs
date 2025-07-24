/**
 * 【ウェブアプリ用】'店舗一覧'シートからキャッシュ化された店舗情報を取得する関数。
 * Sheets API v4 を利用して高速にデータを読み取る。
 * @returns {Array<Object>} 店舗情報の配列。
 */
function getMonogatariStores() {
  try {
    const spreadsheetId = ss.getId();
    const sheetName = '店舗一覧';
    
    // シートの最終行を取得（データ範囲を特定するため）
    const sheetForCheck = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheetForCheck) {
      Logger.log(`シート「${sheetName}」が見つかりません。`);
      return [];
    }
    const lastRow = sheetForCheck.getLastRow();
     if (lastRow <= 1) {
      Logger.log(`シート「${sheetName}」にデータがありません。`);
      return [];
    }
    
    // Sheets APIでデータを一括取得する範囲を指定 (A2からEの最終行まで)
    const range = `${sheetName}!A2:E${lastRow}`;

    // Sheets API を呼び出し
    const response = Sheets.Spreadsheets.Values.get(spreadsheetId, range);
    
    if (!response || !response.values) {
      Logger.log('Sheets APIから店舗データを取得できませんでした。');
      return [];
    }

    const stores = response.values.map(row => {
      // 列番号を実際のシートに合わせる
      const storeName = row[0]; // A列
      const address   = row[2]; // C列
      const lat       = row[3]; // D列
      const lng       = row[4]; // E列

      // 緯度(D列)と経度(E列)が空でなく、有効な値であることを確認
      if (lat != null && lng != null && lat !== '' && lng !== '') {
        return {
          name: storeName,
          address: address,
          lat: lat,
          lng: lng
        };
      }
      return null;
    }).filter(store => store !== null); // null になった行を除外

    return stores;

  } catch (e) {
    Logger.log('getMonogatariStores (Sheets API)でエラー: ' + e.message);
    // Sheets API特有のエラーメッセージを出力
    if (e.details && e.details.message) {
      Logger.log('APIエラー詳細: ' + e.details.message);
    }
    return [];
  }
}
