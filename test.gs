// スクリプト実行中の緯度経度検索結果をキャッシュするオブジェクト
const latLngCache = {};


// --- ▼▼▼ ここからが今回提供するコードの中心です ▼▼▼ ---

/**
 * [新規] XMLデバッグ用の専用関数。
 * 直近1時間以内のXMLを取得し、その内容を "XMLデバッグ" シートに書き出します。
 * 먼저 이 함수를 실행하여 어떤 XML이 수신되고 있는지 확인하십시오.
 */
function debugLatestJmaXml() {
  const feedUrl = 'https://www.data.jma.go.jp/developer/xml/feed/regular.xml';
  const xml = UrlFetchApp.fetch(feedUrl).getContentText('UTF-8');
  const doc = XmlService.parse(xml);
  const root = doc.getRootElement();
  const ns = root.getNamespace();

  // 直近1時間のフィードをフィルタリング
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
  
  const recentEntries = root.getChildren('entry', ns).filter(entry => {
    const updatedStr = entry.getChildText('updated', ns);
    if (!updatedStr) return false;
    return new Date(updatedStr) >= oneHourAgo;
  });

  if (recentEntries.length === 0) {
    Logger.log('直近1時間にデバッグ対象のXMLはありませんでした。');
    SpreadsheetApp.getUi().alert('直近1時間にデバッグ対象のXMLはありませんでした。');
    return;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'XMLデバッグ';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName, 0); // 先頭にシートを追加
  }
  sheet.clear();
  sheet.appendRow(['更新時刻', 'タイトル', 'URL', 'XML本文']);
  sheet.setFrozenRows(1);

  Logger.log(`${recentEntries.length}件のXMLをデバッグシートに出力します...`);

  const uniqueUrls = new Set();
  recentEntries.forEach(entry => {
    try {
      const url = entry.getChild('link', ns)?.getAttribute('href')?.getValue();
      if (!url || uniqueUrls.has(url)) return; // 重複URLはスキップ
      uniqueUrls.add(url);

      const updatedTime = entry.getChildText('updated', ns);
      const title = entry.getChildText('title', ns);
      
      const xmlText = UrlFetchApp.fetch(url).getContentText('UTF-8');
      
      sheet.appendRow([updatedTime, title, url, xmlText]);
      Utilities.sleep(1000); // 連続リクエストを避ける
    } catch (e) {
      Logger.log(`デバッグ用XML取得失敗: ${e.message}`);
    }
  });

  // 列幅を自動調整
  sheet.autoResizeColumns(1, 3);

  Logger.log('✅ XMLデバッグシートの出力を完了しました。');
  SpreadsheetApp.getUi().alert('XMLデバッグシートに出力しました。内容を確認してください。');
}


/**
 * メインの解析関数（デバッグ後の修正のために残してあります）
 * @param {string} detailUrl
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function parseAlertToSheet(detailUrl, sheet) {
  try {
    const xmlText = UrlFetchApp.fetch(detailUrl).getContentText('UTF-8');
    const doc = XmlService.parse(xmlText);
    const root = doc.getRootElement();

    const nsHead = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/informationBasis1/');
    const nsBody = XmlService.getNamespace('http://xml.kishou.go.jp/jmaxml1/body/meteorology1/');

    const head = root.getChild('Head', nsHead);
    const reportDateTime = head?.getChildText('ReportDateTime', nsHead) || '不明';

    const body = root.getChild('Body', nsBody) || root.getChild('Body');
    if (!body) return;

    body.getChildren().forEach(block => {
      switch (block.getName()) {
        case 'Warning':
          processWarningBlock(block, reportDateTime, sheet, nsBody);
          break;
        case 'MeteorologicalInfos':
          processMeteoInfoBlock(block, reportDateTime, sheet, nsBody);
          break;
      }
    });

  } catch (e) {
    Logger.log(`❌ URL処理中にエラー: ${detailUrl} → ${e.toString()}`);
  }
}

/**
 * 警報・注意報ブロック (Warning) を処理する
 */
function processWarningBlock(warning, reportDateTime, sheet, nsBody) {
  const contextComment = warning.getChild('Comment', nsBody);
  const contextText = contextComment ? findSentencesRecursively(contextComment).join('\n') : '(本文情報なし)';

  warning.getChildren('Item', nsBody).forEach(item => {
    const areaName = item.getChild('Area', nsBody)?.getChildText('Name', nsBody);
    if (!areaName) return;
    const { lat, lng } = getLatLngFromRegionName(areaName);
    
    const kindsList = item.getChildren('Kind', nsBody).map(kind => {
      const type = kind.getChild('Property', nsBody)?.getChildText('Type', nsBody);
      const status = kind.getChildText('Status', nsBody);
      const validKeywords = ['警報', '特別警報', '注意報'];
      if (!type || !validKeywords.some(keyword => type.includes(keyword))) return null;
      return status ? `${type} (${status})` : type;
    }).filter(Boolean);

    if (kindsList.length > 0) {
      sheet.appendRow([reportDateTime, areaName, kindsList.join(', '), contextText, '', '', lat, lng]);
    }
  });
}

/**
 * 気象解説情報ブロック (MeteorologicalInfos) を処理する
 */
function processMeteoInfoBlock(meteoInfos, reportDateTime, sheet, nsBody) {
  const infoType = meteoInfos.getAttribute('type')?.getValue() || '気象解説情報';

  meteoInfos.getChildren('MeteorologicalInfo', nsBody).forEach(info => {
    info.getChildren('Item', nsBody).forEach(item => {
      const areaName = item.getChild('Area', nsBody)?.getChildText('Name', nsBody);
      if (!areaName) return;
      const { lat, lng } = getLatLngFromRegionName(areaName);
      
      item.getChildren('Kind', nsBody).forEach(kind => {
        const property = kind.getChild('Property', nsBody);
        if (!property) return;
        let kindType = property.getChildText('Type', nsBody) || infoType;
        const validKeywords = ['危険度', '浸水', '土砂', '洪水', '潮位'];
        if (!validKeywords.some(keyword => kindType.includes(keyword))) return;
        
        const ebValues = findEbValuesRecursively(property);
        const sentences = findSentencesRecursively(property);
        const description = sentences.join('\n');
        
        if (ebValues.length > 0) {
          ebValues.forEach(eb => {
            sheet.appendRow([reportDateTime, areaName, kindType, (eb.desc || description), eb.value, eb.unit, lat, lng]);
          });
        } else if (description) {
          sheet.appendRow([reportDateTime, areaName, kindType, description, '', '', lat, lng]);
        }
      });
    });
  });
}

/**
 * 再帰的に文章を探すヘルパー関数
 */
function findSentencesRecursively(element) { /* (内容は変更なしのため省略) */ }

/**
 * 再帰的に数値をさがすヘルパー関数
 */
function findEbValuesRecursively(element) { /* (内容は変更なしのため省略) */ }



function debugXml() {
  const url = 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml';
  const xml = UrlFetchApp.fetch(url).getContentText();
  Logger.log(xml); // ← XML全文をログに出す
}

const XML_FEED_URL = "https://www.data.jma.go.jp/developer/xml/feed/regular.xml";


/**
 * 気象庁XMLフィードを取得して、各詳細XMLをパースするメイン関数
 */
function fetchAndParseWeatherXML() {
  try {
    const xmlFeedText = UrlFetchApp.fetch(XML_FEED_URL).getContentText();
    const doc = XmlService.parse(xmlFeedText);
    const root = doc.getRootElement();
    const ns = root.getNamespace();

    console.log(xmlFeedText);

    // channel/item の中に警報等XMLのリンクがある
    const channel = root.getChild("channel", ns);
    const items = channel.getChildren("item", ns);

    const results = [];

    items.forEach(item => {
      const link = item.getChildText("link", ns);
      if (link) {
        // 詳細XMLを取得・パース
        const detailText = UrlFetchApp.fetch(link).getContentText();
        const detailDoc = XmlService.parse(detailText);
        const parsed = parseDetailXml(detailDoc);
        if (parsed) {
          results.push(parsed);
        }
      }
    });

    Logger.log(results);
    return results;

  } catch (e) {
    Logger.log("Error: " + e.message);
    return [];
  }
}

/**
 * 詳細XMLをパースして必要情報を抽出する
 */
function parseDetailXml(detailDoc) {
  try {
    const root = detailDoc.getRootElement();
    Logger.log("root namespace: " + root.getNamespace().getURI());

    // まずBodyを名前空間ありで取得
    const bodyNs = XmlService.getNamespace("http://xml.kishou.go.jp/jmaxml1/body/meteorology1/");
    let body = root.getChild("Body", bodyNs);
    Logger.log("body (bodyNs): " + (body ? "found" : "null"));

    // なければ名前空間なしで試す
    if (!body) {
      const emptyNs = XmlService.getNamespace("");
      body = root.getChild("Body", emptyNs);
      Logger.log("body (emptyNs): " + (body ? "found" : "null"));
    }

    if (!body) {
      Logger.log("Body要素が見つかりません。");
      return null;
    }

    // Bodyの子要素（例：MeteorologicalInfos）も名前空間を合わせて取得
    const meteorologicalInfos = body.getChild("MeteorologicalInfos", bodyNs) || body.getChild("MeteorologicalInfos");
    if (!meteorologicalInfos) {
      Logger.log("MeteorologicalInfos要素が見つかりません。");
      return null;
    }

    const meteorologicalInfoList = meteorologicalInfos.getChildren("MeteorologicalInfo", bodyNs);
    if (!meteorologicalInfoList || meteorologicalInfoList.length === 0) {
      Logger.log("MeteorologicalInfo要素が空です。");
      return null;
    }

    // 以降、必要に応じてさらに要素取得時にnullチェックと名前空間の工夫を入れる

    // 例として一つ目のエリア情報だけ取得する簡易コード
    const firstInfo = meteorologicalInfoList[0];
    const item = firstInfo.getChild("Item", bodyNs);
    if (!item) {
      Logger.log("Item要素が見つかりません。");
      return null;
    }

    const area = item.getChild("Area", bodyNs);
    const areaName = area ? area.getChildText("Name", bodyNs) : null;

    Logger.log("areaName: " + areaName);

    return {
      areaName,
      meteorologicalInfoCount: meteorologicalInfoList.length
    };

  } catch (e) {
    Logger.log("parseDetailXml Error: " + e.message);
    return null;
  }
}
