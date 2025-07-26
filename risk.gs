/**
 * 【★★★リスク評価サーバーサイドロジック 最終版★★★】
 * このファイルは、店舗のリスク評価に関連するすべてのサーバーサイド処理を含みます。
 */

//================================================================
// 1. メインの呼び出し関数
//================================================================

/**
 * クライアントから呼び出されるメインの評価関数。
 * @param {Array<Object>} stores - クライアントから渡される全店舗のリスト
 * @param {Object} disasterData - クライアントから渡される全ての災害情報
 * @param {boolean} isFuture - 24時間後予測フラグ
 * @returns {Array<Object>} 影響下にある店舗のリスト（スコア、要因などを含む）
 */
function getStoreImpacts(stores, disasterData, isFuture = false) {
  // getStoreImpacts自体は計算ロジックを呼び出すだけにする
  
  // 各災害情報に、サーバーサイド用のスタイル（スコア）情報を付与する
  const warningsWithStyle = (disasterData.warnings || []).map(w => ({ ...w, ...getWarningStyleForServer(w.title) }));
  const quakesWithStyle = (disasterData.quakes || []).map(q => ({ ...q, ...getEarthquakeStyleForServer(q.maxIntensity) }));
  
  // ★★★ 週間天気予報データを追加 ★★★
  const weeklyForecast = getWeeklyForecast();

  // calculateRiskScoresに渡すデータを準備
  const fullDisasterData = {
    warnings: warningsWithStyle,
    quakes: quakesWithStyle,
    outages: disasterData.outages || [],
    typhoons: disasterData.typhoons || [],
    forecast: weeklyForecast // ★★★ 予報データを追加
  };
  
  const highRiskStores = calculateRiskScores(stores, fullDisasterData, isFuture);
  
  return highRiskStores; 
}


//================================================================
// 2. リスクスコア計算のコアロジック
//================================================================


/**
 * 【★★★ 天気予報対応版 ★★★】
 * リスク評価のルール定義とスコア計算を行うコア関数
 */
function calculateRiskScores(stores, disasterData, isFuture) {
  const { warnings, quakes, outages, typhoons, forecast } = disasterData;
  const MIN_RISK_SCORE_TO_LIST = 20;

  // evaluationTimeの定義
  const now = new Date();
  const evaluationTime = isFuture ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : now;
  if (isFuture) { Logger.log(`★★★ 24時間後 (${evaluationTime.toLocaleString()}) のリスクを評価します ★★★`); }

  const affectedStores = stores.map(store => {
    if (!store.lat || !store.lng) return null;

    let riskScore = 0;
    let riskFactors = new Set();
    const storePosition = { lat: parseFloat(store.lat), lng: parseFloat(store.lng) };

    // --- 災害ごとのリスク評価 ---
    
    // (気象警報、地震、停電の評価ロジックは変更なし)
    // ...

    // ★★★ 未来リスク評価時に、天気予報を考慮する ★★★
    if (isFuture && forecast) {
      // 最も近い予報区のコードを探す (このロジックは単純化しています)
      // 本来は店舗の所在地のarea.codeと一致させるのが理想
      const officeCode = forecast[0].publishingOffice; // 例: 東京管区気象台など
      const timeSeries = forecast[0].timeSeries;

      if (timeSeries && timeSeries.length >= 3) {
        const weatherCodes = timeSeries[0].areas[0].weatherCodes; // 天気コード (晴れ, 雨など)
        const pops = timeSeries[1].areas[0].pops; // 降水確率
        
        // 24時間後に最も近い予報を探す (予報は6時間or12時間単位)
        const weatherIndex = Math.min(Math.floor(24 / 6), weatherCodes.length - 1);
        const popIndex = Math.min(Math.floor(24 / 6), pops.length -1);

        const futureWeatherCode = weatherCodes[weatherIndex];
        const futurePop = parseInt(pops[popIndex], 10);
        
        // 天気コードで「雨」または「雪」に関連するものを判定 (コードは気象庁定義による)
        const isRainOrSnow = ['300','301','302','303','304','306','308','309','311','313','314','315','316','317','320','321','400','401','402','403','405','406','407','409','411','413','414','420','421','422','423','425','426','427'].includes(futureWeatherCode);

        // 24時間後に雨か雪、かつ降水確率70%以上の場合
        if (isRainOrSnow && futurePop >= 70) {
          riskScore += 10;
          riskFactors.add(`24h後大雨/大雪予報 (降水確率${futurePop}%)`);
        }
      }
    }
    
    // ... (台風、複合リスクの評価ロジックは変更なし) ...

    if (riskScore >= MIN_RISK_SCORE_TO_LIST) {
      return { name: store.name, address: store.address, lat: store.lat, lng: store.lng, score: Math.round(riskScore), factors: Array.from(riskFactors).join(', ') };
    }
    return null;
  }).filter(s => s !== null);

  affectedStores.sort((a,b) => b.score - a.score);
  return affectedStores;
}


//================================================================
// 3. ヘルパー関数群
//================================================================

/**
 * 2つの緯度経度座標間の距離を計算する（Haversine formula）
 */
function calculateDistance(pos1, pos2) {
  const R = 6371e3; // 地球の半径 (メートル)
  const φ1 = pos1.lat * Math.PI/180;
  const φ2 = pos2.lat * Math.PI/180;
  const Δφ = (pos2.lat-pos1.lat) * Math.PI/180;
  const Δλ = (pos2.lng-pos1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * サーバーサイド用の気象警報スタイル定義ヘルパー
 */
function getWarningStyleForServer(title) {
    if (!title) return { impactLevel: 0, name: '情報' };
    if (title.includes('特別警報')) return { impactLevel: 50, name: '特別警報' };
    if (title.includes('土砂災害警戒情報') || title.includes('線状降水帯')) return { impactLevel: 30, name: '避難指示相当' };
    if (title.includes('警報')) return { impactLevel: 15, name: '警報' };
    return { impactLevel: 0, name: '注意報など' };
}

/**
 * サーバーサイド用の地震スタイル定義ヘルパー
 */
function getEarthquakeStyleForServer(intensity) {
    const intensityString = convertIntensityToStringForServer(intensity);
    const name = `震度 ${intensityString}`;
    if (intensity >= 6.0) return { impactLevel: 60, name: name, scale: 22 };
    if (intensity >= 5.5) return { impactLevel: 45, name: name, scale: 18 };
    if (intensity >= 5.0) return { impactLevel: 30, name: name, scale: 15 };
    if (intensity >= 4.0) return { impactLevel: 10, name: name, scale: 10 };
    return { impactLevel: 0, name: `震度${intensityString}`, scale: 5 };
}

/**
 * サーバーサイド用の震度変換ヘルパー
 */
function convertIntensityToStringForServer(intensity) {
    if (intensity >= 7.0) return '7';
    if (intensity >= 6.5) return '6強';
    if (intensity >= 6.0) return '6弱';
    if (intensity >= 5.5) return '5強';
    if (intensity >= 5.0) return '5弱';
    if (intensity >= 4.0) return '4';
    if (intensity >= 3.0) return '3';
    return '';
}

//================================================================
// 4. デバッグ＆テスト用関数
//================================================================

/**
 * 【テスト用】現在時刻のリスク評価を実行してログに出力する
 */
function test_calculateCurrentRisk() {
  Logger.log("---【現在時刻】のリスク評価テストを開始 ---");
  // isFuture フラグを false (または省略)で実行
  getStoreImpacts(); 
}


/**
 * 【テスト用】24時間後のリスク評価を実行してログに出力する
 */
function test_calculateFutureRisk() {
  Logger.log("---【24時間後】のリスク評価テストを開始 ---");
  
  // サーバーサイドのデータ取得関数を呼び出す
  // (getStoreImpacts関数がクライアントからデータを受け取る仕様になったため、
  //  テスト関数内でデータを準備する必要がある)
  const stores = getMonogatariStores();
  const warnings = getWeatherWarningsFromSheet(); // スコア計算前の生データ
  const quakes = getEarthquakeDataFromSheet();
  const outages = getPowerOutageDataFromMeraki();
  const typhoons = []; // テスト時は空、またはダミーデータをgetTyphoonDataから取得
  
  const disasterData = {
    warnings,
    quakes,
    outages,
    typhoons
  };
   
  // isFuture フラグを true にして、本番と同じように呼び出す
  const highRiskStores = getStoreImpacts(stores, disasterData, true);
  
  // getStoreImpacts内のログに加えて、テスト関数自身も結果を出力
  Logger.log(`テスト完了。未来リスクのある店舗: ${highRiskStores.length}件`);
}

/**
 * クライアントから呼び出されるメインの評価関数
 * @param {Array<Object>} stores - 全店舗のリスト
 * @param {Object} disasterData - 全ての災害情報
 * @param {boolean} isFuture - 24時間後予測フラグ
 * @returns {Array<Object>} 影響下にある店舗のリスト
 */
function getStoreImpacts(stores, disasterData, isFuture = false) {
  // getStoreImpacts自体は計算ロジックを呼び出すだけにする
  
  // 各災害情報に、サーバーサイド用のスタイル（スコア）情報を付与する
  const warningsWithStyle = (disasterData.warnings || []).map(w => ({ ...w, ...getWarningStyleForServer(w.title) }));
  const quakesWithStyle = (disasterData.quakes || []).map(q => ({ ...q, ...getEarthquakeStyleForServer(q.maxIntensity) }));
  
  // calculateRiskScoresに渡すデータを準備
  const fullDisasterData = {
    warnings: warningsWithStyle,
    quakes: quakesWithStyle,
    outages: disasterData.outages || [],
    typhoons: disasterData.typhoons || []
  };
  
  const highRiskStores = calculateRiskScores(stores, fullDisasterData, isFuture);
  
  return highRiskStores; 
}