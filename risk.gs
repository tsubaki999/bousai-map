/**
 * 2つの緯度経度座標間の距離をメートル単位で計算する（Haversine formula）
 * google.maps.geometry.spherical.computeDistanceBetween のサーバーサイド版代替。
 * @param {Object} pos1 - {lat, lng} を持つオブジェクト
 * @param {Object} pos2 - {lat, lng} を持つオブジェクト
 * @returns {number} 2点間の距離 (メートル)
 */
function calculateDistance(pos1, pos2) {
  const R = 6371e3; // 地球の半径 (メートル)
  const φ1 = pos1.lat * Math.PI/180; // φ, λ in radians
  const φ2 = pos2.lat * Math.PI/180;
  const Δφ = (pos2.lat-pos1.lat) * Math.PI/180;
  const Δλ = (pos2.lng-pos1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // メートル単位の距離
}


/**
 * リスク評価のルール定義とスコア計算を行うコア関数
 * @param {Array<Object>} stores - 全店舗のリスト {name, address, lat, lng}
 * @param {Object} disasterData - 全ての災害情報を含むオブジェクト
 * @returns {Array<Object>} リスクスコアが閾値以上の店舗情報の配列
 */
function calculateRiskScores(stores, disasterData) {
  const { warnings, quakes, outages } = disasterData;
  const MIN_RISK_SCORE = 20; // このスコア以上の店舗のみを結果に含める
  
  const affectedStores = stores.map(store => {
    if (!store.lat || !store.lng) return null;

    let riskScore = 0;
    let riskFactors = new Set();
    const storePosition = { lat: parseFloat(store.lat), lng: parseFloat(store.lng) };

    // 1. 各災害の単体リスクを評価
    const weatherImpact = warnings
      .filter(c => calculateDistance(storePosition, {lat: c.lat, lng: c.lng}) <= 20000) // 20km
      .reduce((max, c) => (c.impactLevel > max.impactLevel) ? c : max, { impactLevel: 0 });
    if (weatherImpact.impactLevel > 0) {
      riskScore += weatherImpact.impactLevel;
      riskFactors.add(weatherImpact.name);
    }

    const quakeImpact = quakes
      .filter(q => calculateDistance(storePosition, {lat: q.lat, lng: q.lng}) <= (q.scale * 15000))
      .reduce((max, q) => (q.impactLevel > max.impactLevel) ? q : max, { impactLevel: 0 });
    if (quakeImpact.impactLevel > 0) {
      riskScore += quakeImpact.impactLevel;
      riskFactors.add(quakeImpact.name);
    }

    const isOutage = outages.some(o => calculateDistance(storePosition, {lat: o.lat, lng: o.lng}) < 1000); // 1km
    if (isOutage) {
      riskScore += 10;
      riskFactors.add('停電');
    }

    // 2. 複合災害リスクの評価
    const hasWeatherFactor = weatherImpact.impactLevel >= 20;
    const hasQuakeFactor = quakeImpact.impactLevel >= 15;

    if (hasWeatherFactor && hasQuakeFactor) {
      riskScore += (quakeImpact.impactLevel >= 30) ? 20 : 10;
      riskFactors.add('複合(大雨+地震)');
    }
    if (isOutage && (hasWeatherFactor || hasQuakeFactor)) {
      riskScore += 20;
      riskFactors.add('複合(停電)');
    }

    if (riskScore >= MIN_RISK_SCORE) {
      return {
        name: store.name,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
        score: Math.round(riskScore),
        factors: Array.from(riskFactors).join(', ')
      };
    }
    return null;
  }).filter(s => s !== null);

  // スコアの高い順にソート
  affectedStores.sort((a,b) => b.score - a.score);
  
  return affectedStores;
}


/**
 * 【★★★ デバッグ強化版 ★★★】
 * クライアントから呼び出されるメインの評価関数
 * 全ての災害・店舗データを集め、リスク評価を実行して結果を返す
 * @returns {Array<Object>} 影響下にある店舗のリスト
 */
function getStoreImpacts() {
  // 1. 各データソースから情報を取得
  const stores = getMonogatariStores();
  const warnings = getWeatherWarningsFromSheet().map(w => ({ ...w, ...getWarningStyleForServer(w.title) }));
  const quakes = getEarthquakeDataFromSheet().map(q => ({ ...q, ...getEarthquakeStyleForServer(q.maxIntensity) }));
  const outages = getPowerOutageDataFromMeraki();

  const disasterData = {
    warnings,
    quakes,
    outages,
  };

  // 2. リスクスコアを計算
  const highRiskStores = calculateRiskScores(stores, disasterData);
  
  // ★★★ ここからがデバッグ用のログ出力 ★★★
  Logger.log('-------------------- リスク評価結果デバッグ --------------------');
  if (highRiskStores.length > 0) {
    Logger.log(`リスク評価完了。${highRiskStores.length}件のハイリスク店舗を検出しました。`);
    highRiskStores.forEach((store, index) => {
      // ログが見やすいように整形して出力
      const logMessage = `  [${index + 1}] 店名: ${store.name}, ` +
                         `スコア: ${store.score}, ` +
                         `要因: [${store.factors}], ` +
                         `座標: (${store.lat}, ${store.lng})`;
      Logger.log(logMessage);
    });
  } else {
    Logger.log('リスク評価完了。ハイリスク店舗は検出されませんでした。');
  }
  Logger.log('--------------------------------------------------------------');
  // ★★★ デバッグログここまで ★★★

  return highRiskStores;
}

// サーバーサイド用のスタイル定義ヘルパー
function getWarningStyleForServer(title) {
    if (!title) return { impactLevel: 0, name: '情報' };
    if (title.includes('特別警報')) return { impactLevel: 60, name: '特別警報' };
    if (title.includes('土砂災害警戒情報') || title.includes('線状降水帯')) return { impactLevel: 40, name: '避難指示相当' };
    if (title.includes('警報')) return { impactLevel: 20, name: '警報' };
    if (title.includes('注意報')) return { impactLevel: 5, name: '注意報' };
    return { impactLevel: 0, name: 'その他情報' };
}
function getEarthquakeStyleForServer(intensity) {
    const intensityString = convertIntensityToStringForServer(intensity);
    const name = `震度 ${intensityString}`;
    if (intensity >= 6.0) return { impactLevel: 50, name: name, scale: 22 };
    if (intensity >= 5.5) return { impactLevel: 40, name: name, scale: 18 };
    if (intensity >= 5.0) return { impactLevel: 30, name: name, scale: 15 };
    if (intensity >= 4.0) return { impactLevel: 15, name: name, scale: 10 };
    return { impactLevel: 0, name: `震度${intensityString}`, scale: 5 };
}
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