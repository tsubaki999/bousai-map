//気象区マスタ
const regionLatLngMaster = {
  "北海道": {
    lat: 43.0642, // 都道府県代表点（札幌市）
    lng: 141.3469,
    regions: {
      // 一次細分区域
      "宗谷地方": { lat: 45.4156, lng: 141.7036, representative: "稚内市" },
      "上川地方": { lat: 43.7702, lng: 142.3653, representative: "旭川市" },
      "留萌地方": { lat: 43.9357, lng: 141.6574, representative: "留萌市" },
      "石狩地方": { lat: 43.0642, lng: 141.3469, representative: "札幌市" },
      "空知地方": { lat: 43.1978, lng: 141.7858, representative: "岩見沢市" },
      "後志地方": { lat: 42.9027, lng: 140.7523, representative: "倶知安町" }, // 統合
      "網走地方": { lat: 44.0229, lng: 144.2625, representative: "網走市" },
      "北見地方": { lat: 43.8028, lng: 143.8943, representative: "北見市" },
      "紋別地方": { lat: 44.3551, lng: 143.3541, representative: "紋別市" },
      "胆振地方": { lat: 42.3217, lng: 140.9701, representative: "室蘭市" },
      "日高地方": { lat: 42.1691, lng: 142.7720, representative: "浦河町" },
      "渡島地方": { lat: 41.7687, lng: 140.7289, representative: "函館市" },
      "檜山地方": { lat: 41.8576, lng: 140.1265, representative: "江差町" },
      "根室地方": { lat: 43.3307, lng: 145.5823, representative: "根室市" },
      "釧路地方": { lat: 42.9849, lng: 144.3816, representative: "釧路市" },
      "十勝地方": { lat: 42.9268, lng: 143.2045, representative: "帯広市" },
      // 市町村等をまとめた地域等
      "石狩北部": { lat: 43.1762, lng: 141.3148, representative: "石狩市" },
      "石狩中部": { lat: 43.0642, lng: 141.3469, representative: "札幌市" },
      "石狩南部": { lat: 42.8193, lng: 141.6507, representative: "千歳市" },
      "南空知": { lat: 43.1978, lng: 141.7858, representative: "岩見沢市" },
      "中空知": { lat: 43.5574, lng: 141.9088, representative: "滝川市" },
      "北空知": { lat: 43.7176, lng: 142.0401, representative: "深川市" },
      "後志北部": { lat: 43.1907, lng: 140.9947, representative: "小樽市" },
      "後志西部": { lat: 42.7937, lng: 140.2330, representative: "寿都町" },
      "羊蹄山麓": { lat: 42.9027, lng: 140.7523, representative: "倶知安町" },
      "胆振中部": { lat: 42.6322, lng: 141.6033, representative: "苫小牧市" },
      "胆振西部": { lat: 42.3155, lng: 140.9741, representative: "室蘭市" },
      "胆振東部": { lat: 42.7303, lng: 141.8795, representative: "厚真町" },
      "日高東部": { lat: 42.1691, lng: 142.7720, representative: "浦河町" },
      "日高中部": { lat: 42.3386, lng: 142.3688, representative: "新ひだか町" },
      "日高西部": { lat: 42.5028, lng: 141.9367, representative: "日高町" },
      "渡島東部": { lat: 41.7687, lng: 140.7289, representative: "函館市" },
      "渡島西部": { lat: 41.4287, lng: 140.1062, representative: "松前町" },
      "渡島北部": { lat: 42.2536, lng: 140.2709, representative: "八雲町" },
      "檜山南部": { lat: 41.8028, lng: 140.1192, representative: "上ノ国町" },
      "檜山北部": { lat: 42.4533, lng: 139.8458, representative: "せたな町" },
      "檜山奥尻島": { lat: 42.1627, lng: 139.5132, representative: "奥尻町" },
      "上川北部": { lat: 44.3541, lng: 142.4631, representative: "名寄市" },
      "上川中部": { lat: 43.7702, lng: 142.3653, representative: "旭川市" },
      "上川南部": { lat: 43.3442, lng: 142.3831, representative: "富良野市" },
      "留萌北部": { lat: 44.8912, lng: 141.7456, representative: "天塩町" },
      "留萌中部": { lat: 44.3056, lng: 141.6669, representative: "苫前町" },
      "留萌南部": { lat: 43.9357, lng: 141.6574, representative: "留萌市" },
      "宗谷北部": { lat: 45.4156, lng: 141.7036, representative: "稚内市" },
      "宗谷南部": { lat: 44.9295, lng: 142.5855, representative: "枝幸町" },
      "利尻・礼文": { lat: 45.2447, lng: 141.2206, representative: "利尻富士町" },
      "網走東部": { lat: 44.0229, lng: 144.2625, representative: "網走市" },
      "網走西部": { lat: 43.8028, lng: 143.8943, representative: "北見市" },
      "網走南部": { lat: 43.8966, lng: 144.1750, representative: "大空町" },
      "紋別北部": { lat: 44.3551, lng: 143.3541, representative: "紋別市" },
      "紋別南部": { lat: 44.0500, lng: 143.5333, representative: "遠軽町" },
      "根室北部": { lat: 43.6593, lng: 145.1328, representative: "標津町" },
      "根室中部": { lat: 43.3444, lng: 145.1118, representative: "別海町" },
      "根室南部": { lat: 43.3307, lng: 145.5823, representative: "根室市" },
      "釧路北部": { lat: 43.4862, lng: 144.4593, representative: "弟子屈町" },
      "釧路中部": { lat: 43.2982, lng: 144.6062, representative: "標茶町" },
      "釧路南東部": { lat: 43.0135, lng: 144.4756, representative: "釧路町" },
      "釧路南西部": { lat: 42.9849, lng: 144.3816, representative: "釧路市" },
      "十勝北部": { lat: 43.2323, lng: 143.2925, representative: "上士幌町" },
      "十勝中部": { lat: 42.9268, lng: 143.2045, representative: "帯広市" },
      "十勝南部": { lat: 42.5186, lng: 143.2721, representative: "大樹町" },
    }
  },
  "青森県": {
    lat: 40.8222,
    lng: 140.7474,
    regions: {
      "津軽": { lat: 40.8222, lng: 140.7474, representative: "青森市" },
      "下北": { lat: 41.2917, lng: 141.2163, representative: "むつ市" },
      "三八上北": { lat: 40.5136, lng: 141.4883, representative: "八戸市" },
      "東青津軽": { lat: 40.8222, lng: 140.7474, representative: "青森市" },
      "北五津軽": { lat: 40.8049, lng: 140.4431, representative: "五所川原市" },
      "西津軽": { lat: 40.8083, lng: 140.3804, representative: "つがる市" },
      "中南津軽": { lat: 40.6053, lng: 140.4647, representative: "弘前市" },
      "三八": { lat: 40.5136, lng: 141.4883, representative: "八戸市" },
      "上北": { lat: 40.6125, lng: 141.2099, representative: "十和田市" },
    }
  },
  "岩手県": {
    lat: 39.7020,
    lng: 141.1545,
    regions: {
      "沿岸": { lat: 39.6416, lng: 141.9463, representative: "宮古市" },
      "内陸": { lat: 39.7020, lng: 141.1545, representative: "盛岡市" },
       "宮古地域": { lat: 39.6416, lng: 141.9463, representative: "宮古市" },
      "県北地域": { lat: 40.2673, lng: 141.3023, representative: "二戸市" },
      "久慈地域": { lat: 40.1911, lng: 141.7719, representative: "久慈市" },
      "盛岡地域": { lat: 39.7020, lng: 141.1545, representative: "盛岡市" },
      "大船渡地域": { lat: 39.0820, lng: 141.7099, representative: "大船渡市" },
      "釜石地域": { lat: 39.2755, lng: 141.8841, representative: "釜石市" },
      "花北地域": { lat: 39.3879, lng: 141.1147, representative: "花巻市" },
      "奥州金ケ崎地域": { lat: 39.1416, lng: 141.1398, representative: "奥州市" },
      "両磐地域": { lat: 38.9376, lng: 141.1309, representative: "一関市" },
      "二戸地域": { lat: 40.2673, lng: 141.3023, representative: "二戸市" },
      "遠野地域": { lat: 39.3330, lng: 141.5303, representative: "遠野市" },
    }
  },
  "宮城県": {
    lat: 38.2682,
    lng: 140.8721,
    regions: {
      "東部": { lat: 38.4343, lng: 141.3023, representative: "石巻市" },
      "西部": { lat: 38.5772, lng: 140.9576, representative: "大崎市" },
      "東部仙台": { lat: 38.2682, lng: 140.8721, representative: "仙台市" },
      "石巻地域": { lat: 38.4343, lng: 141.3023, representative: "石巻市" },
      "気仙沼地域": { lat: 38.9055, lng: 141.5694, representative: "気仙沼市" },
      "登米・東部栗原": { lat: 38.6946, lng: 141.1913, representative: "登米市" },
      "東部大崎": { lat: 38.5772, lng: 140.9576, representative: "大崎市" },
      "東部仙南": { lat: 37.9739, lng: 140.7813, representative: "角田市" },
      "西部仙南": { lat: 38.0039, lng: 140.6214, representative: "白石市" },
      "西部仙台": { lat: 38.2682, lng: 140.8721, representative: "仙台市" },
      "西部栗原": { lat: 38.7297, lng: 141.0180, representative: "栗原市" },
      "西部大崎": { lat: 38.5772, lng: 140.9576, representative: "大崎市" },
    }
  },
  "秋田県": {
    lat: 39.7200,
    lng: 140.1036,
    regions: {
      "沿岸": { lat: 39.7200, lng: 140.1036, representative: "秋田市" },
      "内陸": { lat: 39.4589, lng: 140.4746, representative: "大仙市" },
      "秋田中央地域": { lat: 39.7200, lng: 140.1036, representative: "秋田市" },
      "本荘由利地域": { lat: 39.3860, lng: 140.0526, representative: "由利本荘市" },
      "能代山本地域": { lat: 40.2133, lng: 140.0253, representative: "能代市" },
      "北秋鹿角地域": { lat: 40.2741, lng: 140.5647, representative: "大館市" },
      "仙北平鹿地域": { lat: 39.4589, lng: 140.4746, representative: "大仙市" },
      "湯沢雄勝地域": { lat: 39.1651, lng: 140.4950, representative: "湯沢市" },
    }
  },
  "山形県": {
    lat: 38.2554,
    lng: 140.3396,
    regions: {
      "村山": { lat: 38.2554, lng: 140.3396, representative: "山形市" },
      "最上": { lat: 38.7663, lng: 140.3013, representative: "新庄市" },
      "置賜": { lat: 37.9152, lng: 140.1172, representative: "米沢市" },
      "庄内": { lat: 38.7245, lng: 139.8242, representative: "鶴岡市" },
      "庄内南部": { lat: 38.7245, lng: 139.8242, representative: "鶴岡市" },
      "庄内北部": { lat: 38.9169, lng: 139.8322, representative: "酒田市" },
      "西置賜": { lat: 38.1064, lng: 140.0381, representative: "長井市" },
      "西村山": { lat: 38.3752, lng: 140.2731, representative: "寒河江市" },
      "北村山": { lat: 38.4839, lng: 140.3755, representative: "村山市" },
      "東南置賜": { lat: 37.9152, lng: 140.1172, representative: "米沢市" },
      "東南村山": { lat: 38.2554, lng: 140.3396, representative: "山形市" },
    }
  },
  "福島県": {
    lat: 37.7503,
    lng: 140.4676,
    regions: {
      "中通り": { lat: 37.3995, lng: 140.3888, representative: "郡山市" },
      "浜通り": { lat: 37.0501, lng: 140.8933, representative: "いわき市" },
      "会津": { lat: 37.4947, lng: 139.9239, representative: "会津若松市" },
      "浜通り南部": { lat: 37.0501, lng: 140.8933, representative: "いわき市" },
      "浜通り中部": { lat: 37.4489, lng: 141.0068, representative: "双葉町" },
      "浜通り北部": { lat: 37.7972, lng: 140.9200, representative: "相馬市" },
      "中通り中部": { lat: 37.3995, lng: 140.3888, representative: "郡山市" },
      "中通り北部": { lat: 37.7606, lng: 140.4735, representative: "福島市" },
      "中通り南部": { lat: 37.1311, lng: 140.2109, representative: "白河市" },
      "会津南部": { lat: 37.2458, lng: 139.6917, representative: "南会津町" },
      "会津中部": { lat: 37.4947, lng: 139.9239, representative: "会津若松市" },
      "会津北部": { lat: 37.6493, lng: 139.8732, representative: "喜多方市" },
    }
  },
  "茨城県": {
    lat: 36.3418,
    lng: 140.4468,
    regions: {
      "北部": { lat: 36.5929, lng: 140.6471, representative: "日立市" },
      "南部": { lat: 36.0628, lng: 140.1112, representative: "つくば市" },
      "鹿行地域": { lat: 35.9672, lng: 140.6433, representative: "鹿嶋市" },
    }
  },
  "栃木県": {
    lat: 36.5657,
    lng: 139.8836,
    regions: {
      "日光地域": { lat: 36.7490, lng: 139.6106, representative: "日光市" },
      "那須地域": { lat: 36.8711, lng: 140.0163, representative: "大田原市" },
    }
  },
  "群馬県": {
    lat: 36.3912,
    lng: 139.0608,
    regions: {
      "北部": { lat: 36.6509, lng: 138.9912, representative: "みなかみ町" },
      "南部": { lat: 36.3912, lng: 139.0608, representative: "前橋市" },
      "利根・沼田地域": { lat: 36.6456, lng: 139.0494, representative: "沼田市" },
      "吾妻地域": { lat: 36.5913, lng: 138.8475, representative: "中之条町" },
      "前橋・桐生地域": { lat: 36.3912, lng: 139.0608, representative: "前橋市" },
      "高崎・藤岡地域": { lat: 36.3241, lng: 139.0031, representative: "高崎市" },
      "伊勢崎・太田地域": { lat: 36.3130, lng: 139.1979, representative: "伊勢崎市" },
    }
  },
  "埼玉県": {
    lat: 35.8617,
    lng: 139.6455,
    regions: {
      "南部平野部": { lat: 35.8617, lng: 139.6455, representative: "さいたま市" },
      "北部平野部": { lat: 36.1264, lng: 139.3888, representative: "熊谷市" },
      "秩父地方": { lat: 35.9875, lng: 139.0800, representative: "秩父市" },
    }
  },
  "千葉県": {
    lat: 35.6047,
    lng: 140.1233,
    regions: {
      "北西部": { lat: 35.6047, lng: 140.1233, representative: "千葉市" },
      "北東部": { lat: 35.7144, lng: 140.7578, representative: "銚子市" },
      "南部": { lat: 34.9961, lng: 139.8698, representative: "館山市" },
      "東葛飾": { lat: 35.7876, lng: 139.9038, representative: "松戸市" },
      "夷隅・安房": { lat: 35.1508, lng: 140.3150, representative: "勝浦市" },
      "山武・長生": { lat: 35.5593, lng: 140.3644, representative: "東金市" },
      "千葉中央": { lat: 35.6047, lng: 140.1233, representative: "千葉市" },
      "君津": { lat: 35.3776, lng: 139.9239, representative: "木更津市" },
      "香取・海匝": { lat: 35.8974, lng: 140.5019, representative: "香取市" },
      "南西部": { lat: 34.9961, lng: 139.8698, representative: "館山市" },
      "印旛": { lat: 35.7226, lng: 140.2285, representative: "佐倉市" },
    }
  },
  "東京都": {
    lat: 35.6895, 
    lng: 139.6917,
    regions: {
      "東京地方": { lat: 35.6895, lng: 139.6917, representative: "新宿区" },
      "伊豆諸島北部": { lat: 34.7561, lng: 139.3621, representative: "大島町" },
      "伊豆諸島南部": { lat: 33.1070, lng: 139.7946, representative: "八丈町" },
      "小笠原諸島": { lat: 27.0945, lng: 142.1911, representative: "小笠原村" },
      "大島": { lat: 34.7561, lng: 139.3621, representative: "大島町" },
      "新島": { lat: 34.3540, lng: 139.2618, representative: "新島村" },
      "三宅島": { lat: 34.0734, lng: 139.5269, representative: "三宅村" },
      "八丈島": { lat: 33.1070, lng: 139.7946, representative: "八丈町" },
      "２３区西部": { lat: 35.6895, lng: 139.7004, representative: "新宿区" },
      "２３区東部": { lat: 35.6702, lng: 139.8055, representative: "江東区" },
      "多摩北部": { lat: 35.7118, lng: 139.4147, representative: "立川市" },
      "多摩南部": { lat: 35.6559, lng: 139.3175, representative: "八王子市" },
      "多摩西部": { lat: 35.7891, lng: 139.2520, representative: "青梅市" },
    }
  },
  "神奈川県": {
    lat: 35.4437,
    lng: 139.6380,
    regions: {
      "三浦半島": { lat: 35.2831, lng: 139.6738, representative: "横須賀市" },
      "横浜・川崎": { lat: 35.4437, lng: 139.6380, representative: "横浜市" },
      "湘南": { lat: 35.3392, lng: 139.4899, representative: "藤沢市" },
      "西湘": { lat: 35.2554, lng: 139.1550, representative: "小田原市" },
      "県央部": { lat: 35.4385, lng: 139.3636, representative: "厚木市" },
      "相模原": { lat: 35.5744, lng: 139.3738, representative: "相模原市" },
      "足柄上": { lat: 35.3448, lng: 139.1415, representative: "松田町" },
    }
  },
  "新潟県": {
    lat: 37.9022,
    lng: 139.0232,
    regions: {
      "下越": { lat: 37.9022, lng: 139.0232, representative: "新潟市" },
      "中越": { lat: 37.4452, lng: 138.8415, representative: "長岡市" },
      "上越": { lat: 37.1500, lng: 138.2500, representative: "上越市" },
      "佐渡": { lat: 38.0538, lng: 138.3375, representative: "佐渡市" },
      "長岡地域": { lat: 37.4452, lng: 138.8415, representative: "長岡市" },
      "岩船地域": { lat: 38.2255, lng: 139.4812, representative: "村上市" },
      "県央地域": { lat: 37.6364, lng: 138.9610, representative: "三条市" },
      "柏崎地域": { lat: 37.3691, lng: 138.5583, representative: "柏崎市" },
      "新発田地域": { lat: 37.9463, lng: 139.3248, representative: "新発田市" },
      "新潟地域": { lat: 37.9161, lng: 139.0364, representative: "新潟市" },
      "三条地域": { lat: 37.6364, lng: 138.9610, representative: "三条市" },
      "南魚沼地域": { lat: 37.0782, lng: 138.8914, representative: "南魚沼市" },
      "十日町地域": { lat: 37.1309, lng: 138.7617, representative: "十日町市" },
      "五泉地域": { lat: 37.7408, lng: 139.1831, representative: "五泉市" },
    }
  },
  "富山県": { lat: 36.6953, lng: 137.2137, representative: "富山市" },
  "石川県": {
    lat: 36.5659,
    lng: 136.6571,
    regions: {
      "加賀": { lat: 36.5659, lng: 136.6571, representative: "金沢市" },
      "能登": { lat: 37.0427, lng: 136.9634, representative: "七尾市" },
      "加賀南部": { lat: 36.4057, lng: 136.4447, representative: "小松市" },
      "能登北部": { lat: 37.3917, lng: 136.9032, representative: "輪島市" },
      "能登南部": { lat: 37.0427, lng: 136.9634, representative: "七尾市" },
      "加賀北部": { lat: 36.5659, lng: 136.6571, representative: "金沢市" },
    }
  },
  "福井県": {
    lat: 36.0641,
    lng: 136.2195,
    regions: {
      "嶺北": { lat: 36.0641, lng: 136.2195, representative: "福井市" },
      "嶺南": { lat: 35.6457, lng: 136.0609, representative: "敦賀市" },
      "嶺北北部": { lat: 36.2198, lng: 136.1952, representative: "あわら市" },
      "嶺北南部": { lat: 36.0641, lng: 136.2195, representative: "福井市" },
      "嶺南東部": { lat: 35.6457, lng: 136.0609, representative: "敦賀市" },
      "嶺南西部": { lat: 35.4981, lng: 135.7460, representative: "小浜市" },
      "奥越": { lat: 35.9818, lng: 136.4883, representative: "大野市" },
    }
  },
  "山梨県": {
    lat: 35.6642,
    lng: 138.5683,
    regions: {
      "中・西部": { lat: 35.6642, lng: 138.5683, representative: "甲府市" },
      "東部・富士五湖": { lat: 35.4988, lng: 138.7610, representative: "富士河口湖町" },
      "中北地域": { lat: 35.6642, lng: 138.5683, representative: "甲府市" },
      "峡東地域": { lat: 35.6888, lng: 138.6833, representative: "山梨市" },
      "峡南地域": { lat: 35.3400, lng: 138.4527, representative: "身延町" },
    }
  },
  "長野県": {
    lat: 36.6513,
    lng: 138.1812,
    regions: {
      "北部": { lat: 36.6513, lng: 138.1812, representative: "長野市" },
      "中部": { lat: 36.2381, lng: 137.9719, representative: "松本市" },
      "南部": { lat: 35.5152, lng: 137.8239, representative: "飯田市" },
      "長野地域": { lat: 36.6513, lng: 138.1812, representative: "長野市" },
      "佐久地域": { lat: 36.2514, lng: 138.4719, representative: "佐久市" },
      "大北地域": { lat: 36.5041, lng: 137.8488, representative: "大町市" },
      "中野飯山地域": { lat: 36.7455, lng: 138.3695, representative: "中野市" },
      "松本地域": { lat: 36.2381, lng: 137.9719, representative: "松本市" },
      "上田地域": { lat: 36.4030, lng: 138.2492, representative: "上田市" },
      "諏訪地域": { lat: 36.0425, lng: 138.1147, representative: "諏訪市" },
      "上伊那地域": { lat: 35.8392, lng: 137.9547, representative: "伊那市" },
      "木曽地域": { lat: 35.8398, lng: 137.6258, representative: "木曽町" },
      "下伊那地域": { lat: 35.5152, lng: 137.8239, representative: "飯田市" },
      "乗鞍上高地地域": { lat: 36.2415, lng: 137.6409, representative: "松本市" },
    }
  },
  "岐阜県": {
    lat: 35.3912,
    lng: 136.7222,
    regions: {
      "美濃地方": { lat: 35.3912, lng: 136.7222, representative: "岐阜市" },
      "飛騨地方": { lat: 36.1462, lng: 137.2520, representative: "高山市" },
      "中濃": { lat: 35.4891, lng: 136.9157, representative: "関市" },
      "岐阜・西濃": { lat: 35.4227, lng: 136.7605, representative: "岐阜市" },
      "飛騨北部": { lat: 36.2372, lng: 137.1856, representative: "飛騨市" },
      "東濃": { lat: 35.3344, lng: 137.1213, representative: "多治見市" },
      "飛騨南部": { lat: 35.8055, lng: 137.2452, representative: "下呂市" },
    }
  },
  "静岡県": {
    lat: 34.9756,
    lng: 138.3828,
    regions: {
      "中部": { lat: 34.9756, lng: 138.3828, representative: "静岡市" },
      "東部": { lat: 35.0886, lng: 138.8741, representative: "沼津市" },
      "西部": { lat: 34.7108, lng: 137.7261, representative: "浜松市" },
      "伊豆": { lat: 34.9754, lng: 138.9482, representative: "伊東市" },
      "東部北": { lat: 35.1189, lng: 138.9165, representative: "三島市" },
      "東部南": { lat: 34.6761, lng: 138.9450, representative: "下田市" },
      "遠州南": { lat: 34.7108, lng: 137.7261, representative: "浜松市" },
      "伊豆南": { lat: 34.6761, lng: 138.9450, representative: "下田市" },
      "西部北": { lat: 34.8309, lng: 138.1751, representative: "島田市" },
      "西部南": { lat: 34.7176, lng: 137.8517, representative: "磐田市" },
      "伊豆北": { lat: 35.0425, lng: 138.9372, representative: "伊豆の国市" },
      "富士山南東": { lat: 35.1743, lng: 138.9090, representative: "裾野市" },
      "富士山南西": { lat: 35.2227, lng: 138.6166, representative: "富士宮市" },
      "遠州北": { lat: 34.8872, lng: 137.7490, representative: "浜松市" },
    }
  },
  "愛知県": {
    lat: 35.1815,
    lng: 136.9066,
    regions: {
      "西部": { lat: 35.1815, lng: 136.9066, representative: "名古屋市" },
      "東部": { lat: 34.7684, lng: 137.3918, representative: "豊橋市" },
      "東三河南部": { lat: 34.7684, lng: 137.3918, representative: "豊橋市" },
      "知多地域": { lat: 34.8967, lng: 136.9312, representative: "半田市" },
      "西三河南部": { lat: 34.9575, lng: 137.0864, representative: "安城市" },
      "尾張東部": { lat: 35.2480, lng: 136.9680, representative: "春日井市" },
      "尾張西部": { lat: 35.3039, lng: 136.8021, representative: "一宮市" },
      "西三河北西部": { lat: 35.0827, lng: 137.1540, representative: "豊田市" },
      "東三河北部": { lat: 34.9103, lng: 137.5029, representative: "新城市" },
      "西三河北東部": { lat: 35.2167, lng: 137.3333, representative: "豊田市" },
    }
  },
  "三重県": {
    lat: 34.7303,
    lng: 136.5086,
    regions: {
      "北部": { lat: 34.9606, lng: 136.6219, representative: "四日市市" },
      "中部": { lat: 34.7303, lng: 136.5086, representative: "津市" },
      "南部": { lat: 34.0527, lng: 136.1950, representative: "尾鷲市" },
      "伊勢志摩": { lat: 34.4883, lng: 136.7098, representative: "伊勢市" },
      "紀勢・東紀州": { lat: 34.0722, lng: 136.1912, representative: "尾鷲市" },
      "伊賀": { lat: 34.7699, lng: 136.1306, representative: "伊賀市" },
    }
  },
  "滋賀県": {
    lat: 35.0045,
    lng: 135.8686,
    regions: {
      "南部": { lat: 35.0045, lng: 135.8686, representative: "大津市" },
      "北部": { lat: 35.2743, lng: 136.2589, representative: "彦根市" },
      "湖北": { lat: 35.3801, lng: 136.2655, representative: "長浜市" },
      "近江西部": { lat: 35.3184, lng: 135.9922, representative: "高島市" },
      "湖東": { lat: 35.2743, lng: 136.2589, representative: "彦根市" },
      "東近江": { lat: 35.1121, lng: 136.0829, representative: "東近江市" },
      "近江南部": { lat: 35.0045, lng: 135.8686, representative: "大津市" },
      "甲賀": { lat: 34.9090, lng: 136.1824, representative: "甲賀市" },
    }
  },
  "京都府": {
    lat: 35.0116,
    lng: 135.7681,
    regions: {
      "南部": { lat: 35.0116, lng: 135.7681, representative: "京都市" },
      "北部": { lat: 35.4746, lng: 135.3204, representative: "舞鶴市" },
      "舞鶴・綾部": { lat: 35.4746, lng: 135.3204, representative: "舞鶴市" },
      "丹後": { lat: 35.6300, lng: 135.0500, representative: "京丹後市" },
      "福知山": { lat: 35.2974, lng: 135.1278, representative: "福知山市" },
      "京都・亀岡": { lat: 35.0116, lng: 135.7681, representative: "京都市" },
      "南丹・京丹波": { lat: 35.1051, lng: 135.4746, representative: "南丹市" },
      "山城中部": { lat: 34.8913, lng: 135.8057, representative: "宇治市" },
      "山城南部": { lat: 34.7397, lng: 135.8197, representative: "木津川市" },
    }
  },
  "大阪府": {
    lat: 34.6864,
    lng: 135.5200,
    regions: {
      "泉州": { lat: 34.4608, lng: 135.3697, representative: "岸和田市" },
      "大阪市": { lat: 34.6937, lng: 135.5023, representative: "大阪市" },
      "東部大阪": { lat: 34.6811, lng: 135.6186, representative: "東大阪市" },
      "北大阪": { lat: 34.7674, lng: 135.5398, representative: "吹田市" },
      "南河内": { lat: 34.5029, lng: 135.5997, representative: "富田林市" },
    }
  },
  "兵庫県": {
    lat: 34.6913,
    lng: 135.1830,
    regions: {
      "南部": { lat: 34.6913, lng: 135.1830, representative: "神戸市" },
      "北部": { lat: 35.5414, lng: 134.8211, representative: "豊岡市" },
      "但馬北部": { lat: 35.5414, lng: 134.8211, representative: "豊岡市" },
      "播磨南西部": { lat: 34.8152, lng: 134.6861, representative: "姫路市" },
      "播磨南東部": { lat: 34.6465, lng: 134.9930, representative: "明石市" },
      "阪神": { lat: 34.7290, lng: 135.4120, representative: "尼崎市" },
      "淡路島": { lat: 34.3411, lng: 134.8966, representative: "洲本市" },
      "播磨北西部": { lat: 35.0118, lng: 134.5682, representative: "宍粟市" },
      "北播丹波": { lat: 34.8875, lng: 135.2263, representative: "三田市" },
      "但馬南部": { lat: 35.4055, lng: 134.7770, representative: "養父市" },
      "県央": { lat: 34.7981, lng: 134.9877, representative: "三木市" },
    }
  },
  "奈良県": {
    lat: 34.6851,
    lng: 135.8328,
    regions: {
      "北部": { lat: 34.6851, lng: 135.8328, representative: "奈良市" },
      "南部": { lat: 34.3486, lng: 135.6922, representative: "五條市" },
      "五條・北部吉野": { lat: 34.3486, lng: 135.6922, representative: "五條市" },
    }
  },
  "和歌山県": {
    lat: 34.2304,
    lng: 135.1675,
    regions: {
      "北部": { lat: 34.2304, lng: 135.1675, representative: "和歌山市" },
      "南部": { lat: 33.7314, lng: 135.3789, representative: "田辺市" },
      "新宮・東牟婁": { lat: 33.7259, lng: 135.9912, representative: "新宮市" },
      "田辺・西牟婁": { lat: 33.7314, lng: 135.3789, representative: "田辺市" },
      "紀中": { lat: 33.8906, lng: 135.1558, representative: "御坊市" },
      "紀北": { lat: 34.2690, lng: 135.3621, representative: "紀の川市" },
    }
  },
  "鳥取県": {
    lat: 35.5036,
    lng: 134.2355,
    regions: {
      "東部": { lat: 35.5036, lng: 134.2355, representative: "鳥取市" },
      "中・西部": { lat: 35.4293, lng: 133.3297, representative: "米子市" },
      "米子地区": { lat: 35.4293, lng: 133.3297, representative: "米子市" },
      "倉吉地区": { lat: 35.4300, lng: 133.8228, representative: "倉吉市" },
      "鳥取地区": { lat: 35.5036, lng: 134.2355, representative: "鳥取市" },
      "八頭地区": { lat: 35.3908, lng: 134.2274, representative: "八頭町" },
      "日野地区": { lat: 35.2155, lng: 133.3761, representative: "日野町" },
    }
  },
  "島根県": {
    lat: 35.4723,
    lng: 133.0505,
    regions: {
      "東部": { lat: 35.4723, lng: 133.0505, representative: "松江市" },
      "西部": { lat: 34.8980, lng: 132.0818, representative: "浜田市" },
      "隠岐": { lat: 36.2081, lng: 133.3283, representative: "隠岐の島町" },
      "松江地区": { lat: 35.4723, lng: 133.0505, representative: "松江市" },
      "浜田地区": { lat: 34.8980, lng: 132.0818, representative: "浜田市" },
      "益田地区": { lat: 34.6750, lng: 131.8481, representative: "益田市" },
      "出雲地区": { lat: 35.3670, lng: 132.7562, representative: "出雲市" },
      "大田邑智地区": { lat: 35.1911, lng: 132.4975, representative: "大田市" },
      "雲南地区": { lat: 35.3050, lng: 132.9150, representative: "雲南市" },
    }
  },
  "岡山県": {
    lat: 34.6617,
    lng: 133.9350,
    regions: {
      "南部": { lat: 34.6617, lng: 133.9350, representative: "岡山市" },
      "北部": { lat: 35.0617, lng: 134.0019, representative: "津山市" },
      "岡山地域": { lat: 34.6617, lng: 133.9350, representative: "岡山市" },
      "倉敷地域": { lat: 34.5960, lng: 133.7712, representative: "倉敷市" },
      "東備地域": { lat: 34.7408, lng: 134.2047, representative: "備前市" },
      "井笠地域": { lat: 34.5090, lng: 133.5042, representative: "笠岡市" },
      "津山地域": { lat: 35.0617, lng: 134.0019, representative: "津山市" },
      "真庭地域": { lat: 35.0500, lng: 133.7333, representative: "真庭市" },
      "備北": { lat: 34.9859, lng: 133.4697, representative: "新見市" },
      "新見地域": { lat: 34.9859, lng: 133.4697, representative: "新見市" },
      "勝英地域": { lat: 35.0083, lng: 134.1544, representative: "美作市" },
      "高梁地域": { lat: 34.7951, lng: 133.6167, representative: "高梁市" },
    }
  },
  "広島県": {
    lat: 34.3853,
    lng: 132.4553,
    regions: {
      "南部": { lat: 34.3853, lng: 132.4553, representative: "広島市" },
      "北部": { lat: 34.8066, lng: 132.8524, representative: "三次市" },
      "中部南": { lat: 34.2498, lng: 132.5532, representative: "呉市" },
      "広島・呉": { lat: 34.3853, lng: 132.4553, representative: "広島市" },
      "福山・尾三": { lat: 34.4862, lng: 133.3626, representative: "福山市" },
      "東広島・竹原": { lat: 34.4223, lng: 132.7397, representative: "東広島市" },
      "南東部": { lat: 34.4862, lng: 133.3626, representative: "福山市" },
      "南中部": { lat: 34.3400, lng: 132.9094, representative: "竹原市" },
      "北西部": { lat: 34.6643, lng: 132.7000, representative: "安芸高田市" },
      "南西部": { lat: 34.3475, lng: 132.3364, representative: "廿日市市" },
      "北東部": { lat: 34.8584, lng: 133.0182, representative: "庄原市" },
      "芸北": { lat: 34.6186, lng: 132.5369, representative: "北広島町" },
      "中部北": { lat: 34.8066, lng: 132.8524, representative: "三次市" },
    }
  },
  "山口県": {
    lat: 34.1859,
    lng: 131.4706,
    regions: {
      "西部": { lat: 33.9579, lng: 130.9412, representative: "下関市" },
      "中部": { lat: 34.1859, lng: 131.4706, representative: "山口市" },
      "東部": { lat: 34.1669, lng: 132.2215, representative: "岩国市" },
      "北部": { lat: 34.4055, lng: 131.4017, representative: "萩市" },
      "萩・美祢": { lat: 34.4055, lng: 131.4017, representative: "萩市" },
      "山口・防府": { lat: 34.1859, lng: 131.4706, representative: "山口市" },
      "周南・下松": { lat: 34.0538, lng: 131.8080, representative: "周南市" },
      "長門": { lat: 34.3768, lng: 131.1895, representative: "長門市" },
      "柳井・光": { lat: 33.9634, lng: 132.1026, representative: "柳井市" },
      "宇部・山陽小野田": { lat: 33.9515, lng: 131.2468, representative: "宇部市" },
      "岩国": { lat: 34.1669, lng: 132.2215, representative: "岩国市" },
      "下関": { lat: 33.9579, lng: 130.9412, representative: "下関市" },
    }
  },
  "徳島県": {
    lat: 34.0704,
    lng: 134.5548,
    regions: {
      "北部": { lat: 34.0704, lng: 134.5548, representative: "徳島市" },
      "南部": { lat: 33.9174, lng: 134.6596, representative: "阿南市" },
      "阿南": { lat: 33.9174, lng: 134.6596, representative: "阿南市" },
      "海部": { lat: 33.5937, lng: 134.3486, representative: "海陽町" },
      "徳島・鳴門": { lat: 34.0704, lng: 134.5548, representative: "徳島市" },
      "三好": { lat: 33.9189, lng: 133.8821, representative: "三好市" },
      "美馬北部・阿北": { lat: 34.0883, lng: 134.2201, representative: "阿波市" },
      "那賀・勝浦": { lat: 33.8436, lng: 134.2858, representative: "那賀町" },
      "美馬南部・神山": { lat: 34.0583, lng: 134.1504, representative: "美馬市" },
    }
  },
  "香川県": {
    lat: 34.3401,
    lng: 134.0434,
    regions: {
      "香川県": { lat: 34.3401, lng: 134.0434, representative: "高松市" }, // 1区分
      "中讃": { lat: 34.2908, lng: 133.7972, representative: "丸亀市" },
      "西讃": { lat: 34.1293, lng: 133.6506, representative: "観音寺市" },
      "高松地域": { lat: 34.3401, lng: 134.0434, representative: "高松市" },
      "東讃": { lat: 34.3221, lng: 134.1539, representative: "さぬき市" },
      "小豆": { lat: 34.4842, lng: 134.2981, representative: "小豆島町" },
    }
  },
  "愛媛県": {
    lat: 33.8416,
    lng: 132.7661,
    regions: {
      "東予": { lat: 33.9189, lng: 133.1812, representative: "西条市" },
      "中予": { lat: 33.8416, lng: 132.7661, representative: "松山市" },
      "南予": { lat: 33.2185, lng: 132.5620, representative: "宇和島市" },
      "南予南部": { lat: 33.2185, lng: 132.5620, representative: "宇和島市" },
      "南予北部": { lat: 33.5098, lng: 132.5484, representative: "大洲市" },
      "東予西部": { lat: 33.9189, lng: 133.1812, representative: "西条市" },
      "東予東部": { lat: 33.9859, lng: 133.5607, representative: "四国中央市" },
    }
  },
  "高知県": {
    lat: 33.5594,
    lng: 133.5311,
    regions: {
      "東部": { lat: 33.5048, lng: 133.9015, representative: "安芸市" },
      "中部": { lat: 33.5594, lng: 133.5311, representative: "高知市" },
      "西部": { lat: 32.9912, lng: 132.9340, representative: "四万十市" },
      "高知中央": { lat: 33.5594, lng: 133.5311, representative: "高知市" },
      "室戸": { lat: 33.2872, lng: 134.1481, representative: "室戸市" },
      "安芸": { lat: 33.5048, lng: 133.9015, representative: "安芸市" },
      "幡多": { lat: 32.9912, lng: 132.9340, representative: "四万十市" },
      "高幡": { lat: 33.2721, lng: 133.1118, representative: "四万十町" },
      "高吾北": { lat: 33.5786, lng: 133.4289, representative: "いの町" },
      "嶺北": { lat: 33.7548, lng: 133.5938, representative: "本山町" },
    }
  },
  "福岡県": {
    lat: 33.5904,
    lng: 130.4017,
    regions: {
      "福岡地方": { lat: 33.5904, lng: 130.4017, representative: "福岡市" },
      "北九州地方": { lat: 33.8833, lng: 130.8833, representative: "北九州市" },
      "筑後地方": { lat: 33.3183, lng: 130.5056, representative: "久留米市" },
      "筑豊地方": { lat: 33.6429, lng: 130.6860, representative: "飯塚市" },
      "北九州・遠賀地区": { lat: 33.8833, lng: 130.8833, representative: "北九州市" },
      "京築": { lat: 33.7314, lng: 131.0201, representative: "行橋市" },
      "筑後南部": { lat: 33.0289, lng: 130.4439, representative: "大牟田市" },
      "筑後北部": { lat: 33.3183, lng: 130.5056, representative: "久留米市" },
    }
  },
  "佐賀県": {
    lat: 33.2494,
    lng: 130.3005,
    regions: {
      "南部": { lat: 33.2494, lng: 130.3005, representative: "佐賀市" },
      "北部": { lat: 33.4503, lng: 130.0152, representative: "唐津市" },
      "唐津地区": { lat: 33.4503, lng: 130.0152, representative: "唐津市" },
      "佐賀多久地区": { lat: 33.2494, lng: 130.3005, representative: "佐賀市" },
      "武雄地区": { lat: 33.1901, lng: 130.0195, representative: "武雄市" },
      "鹿島地区": { lat: 33.1065, lng: 130.0913, representative: "鹿島市" },
      "伊万里地区": { lat: 33.2647, lng: 129.8805, representative: "伊万里市" },
      "鳥栖地区": { lat: 33.3768, lng: 130.5135, representative: "鳥栖市" },
    }
  },
  "長崎県": {
    lat: 32.7503,
    lng: 129.8779,
    regions: {
      "南部": { lat: 32.7503, lng: 129.8779, representative: "長崎市" },
      "北部": { lat: 33.1797, lng: 129.7188, representative: "佐世保市" },
      "五島": { lat: 32.6983, lng: 128.8436, representative: "五島市" },
      "壱岐・対馬": { lat: 34.2057, lng: 129.2894, representative: "対馬市" },
      "平戸・松浦地区": { lat: 33.3644, lng: 129.5539, representative: "平戸市" },
      "上五島": { lat: 32.9868, lng: 129.0763, representative: "新上五島町" },
      "下五島": { lat: 32.6983, lng: 128.8436, representative: "五島市" },
      "下対馬": { lat: 34.2057, lng: 129.2894, representative: "対馬市" },
      "壱岐": { lat: 33.7844, lng: 129.7335, representative: "壱岐市" },
      "西彼杵半島": { lat: 32.8943, lng: 129.6917, representative: "西海市" },
      "佐世保・東彼地区": { lat: 33.1797, lng: 129.7188, representative: "佐世保市" },
      "島原半島": { lat: 32.7871, lng: 130.3685, representative: "島原市" },
      "諫早・大村地区": { lat: 32.8464, lng: 130.0487, representative: "諫早市" },
      "上対馬": { lat: 34.6469, lng: 129.4589, representative: "対馬市" },
    }
  },
  "熊本県": {
    lat: 32.8032,
    lng: 130.7079,
    regions: {
      "熊本地方": { lat: 32.8032, lng: 130.7079, representative: "熊本市" },
      "阿蘇地方": { lat: 32.9431, lng: 131.0667, representative: "阿蘇市" },
      "天草・芦北地方": { lat: 32.4552, lng: 130.1905, representative: "天草市" },
      "球磨地方": { lat: 32.2132, lng: 130.7601, representative: "人吉市" },
      "宇城八代": { lat: 32.6845, lng: 130.6554, representative: "宇城市" },
      "天草地方": { lat: 32.4552, lng: 130.1905, representative: "天草市" },
      "熊本市": { lat: 32.8032, lng: 130.7079, representative: "熊本市" },
      "荒尾玉名": { lat: 32.9298, lng: 130.5606, representative: "玉名市" },
      "芦北地方": { lat: 32.3215, lng: 130.5367, representative: "芦北町" },
      "上益城": { lat: 32.7118, lng: 130.8142, representative: "御船町" },
      "山鹿菊池": { lat: 33.0135, lng: 130.6923, representative: "山鹿市" },
    }
  },
  "大分県": {
    lat: 33.2382,
    lng: 131.6126,
    regions: {
      "北部": { lat: 33.5133, lng: 131.4939, representative: "中津市" },
      "中部": { lat: 33.2382, lng: 131.6126, representative: "大分市" },
      "南部": { lat: 32.9691, lng: 131.9056, representative: "佐伯市" },
      "西部": { lat: 33.3223, lng: 130.9392, representative: "日田市" },
      "日田玖珠": { lat: 33.3223, lng: 130.9392, representative: "日田市" },
      "竹田市": { lat: 32.9691, lng: 131.3996, representative: "竹田市" },
      "豊後大野市": { lat: 32.9839, lng: 131.5791, representative: "豊後大野市" },
    }
  },
  "宮崎県": {
    lat: 31.9111,
    lng: 131.4239,
    regions: {
      "南部平野部": { lat: 31.9111, lng: 131.4239, representative: "宮崎市" },
      "北部平野部": { lat: 32.5833, lng: 131.6667, representative: "延岡市" },
      "南部山沿い": { lat: 31.7225, lng: 131.0601, representative: "都城市" },
      "北部山沿い": { lat: 32.7099, lng: 131.3060, representative: "高千穂町" },
      "宮崎地区": { lat: 31.9111, lng: 131.4239, representative: "宮崎市" },
      "日南・串間地区": { lat: 31.5997, lng: 131.3969, representative: "日南市" },
      "延岡・日向地区": { lat: 32.5833, lng: 131.6667, representative: "延岡市" },
      "西都・高鍋地区": { lat: 32.1105, lng: 131.4011, representative: "西都市" },
      "都城地区": { lat: 31.7225, lng: 131.0601, representative: "都城市" },
      "小林・えびの地区": { lat: 32.0003, lng: 130.9705, representative: "小林市" },
      "椎葉・美郷地区": { lat: 32.3667, lng: 131.1833, representative: "椎葉村" },
      "高千穂地区": { lat: 32.7099, lng: 131.3060, representative: "高千穂町" },
    }
  },
  "鹿児島県": {
    lat: 31.5969,
    lng: 130.5571,
    regions: {
      "薩摩地方": { lat: 31.5969, lng: 130.5571, representative: "鹿児島市" },
      "大隅地方": { lat: 31.3784, lng: 130.8540, representative: "鹿屋市" },
      "種子島・屋久島地方": { lat: 30.3556, lng: 130.5283, representative: "屋久島町" },
      "奄美地方": { lat: 28.3842, lng: 129.4961, representative: "奄美市" },
      "川薩・姶良": { lat: 31.8155, lng: 130.3015, representative: "薩摩川内市" },
      "出水・伊佐": { lat: 32.0911, lng: 130.3479, representative: "出水市" },
      "肝属": { lat: 31.3784, lng: 130.8540, representative: "鹿屋市" },
      "鹿児島・日置": { lat: 31.5969, lng: 130.5571, representative: "鹿児島市" },
      "指宿・川辺": { lat: 31.2504, lng: 130.6341, representative: "指宿市" },
      "曽於": { lat: 31.6669, lng: 131.0200, representative: "曽於市" },
      "種子島地方": { lat: 30.7302, lng: 130.9904, representative: "西之表市" },
      "屋久島地方": { lat: 30.3556, lng: 130.5283, representative: "屋久島町" },
      "十島村": { lat: 29.596, lng: 129.576, representative: "十島村" },
      "甑島": { lat: 31.8155, lng: 129.8974, representative: "薩摩川内市(甑島)" },
    }
  },
  "沖縄県": {
    lat: 26.2124,
    lng: 127.6809,
    regions: {
      "沖縄本島地方": { lat: 26.2124, lng: 127.6809, representative: "那覇市" },
      "大東島地方": { lat: 25.8459, lng: 131.2407, representative: "南大東村" },
      "宮古島地方": { lat: 24.8055, lng: 125.2818, representative: "宮古島市" },
      "八重山地方": { lat: 24.4069, lng: 124.1557, representative: "石垣市" },
      "石垣島地方": { lat: 24.4069, lng: 124.1557, representative: "石垣市" },
      "与那国島地方": { lat: 24.4682, lng: 122.9831, representative: "与那国町" },
      "久米島": { lat: 26.3508, lng: 126.7725, representative: "久米島町" },
      "本島中南部": { lat: 26.2124, lng: 127.6809, representative: "那覇市" },
      "本島北部": { lat: 26.5898, lng: 127.9782, representative: "名護市" },
      "名護地区": { lat: 26.5898, lng: 127.9782, representative: "名護市" },
      "国頭地区": { lat: 26.7469, lng: 128.1706, representative: "国頭村" },
      "恩納・金武地区": { lat: 26.5028, lng: 127.8596, representative: "恩納村" },
      "慶良間・粟国諸島": { lat: 26.1952, lng: 127.3551, representative: "渡嘉敷村" },
      "伊是名・伊平屋": { lat: 26.9242, lng: 127.9442, representative: "伊是名村" },
      "宮古島": { lat: 24.8055, lng: 125.2818, representative: "宮古島市" },
      "多良間島": { lat: 24.6592, lng: 124.7001, representative: "多良間村" },
      "竹富町": { lat: 24.3294, lng: 123.8115, representative: "竹富町" },
    }
  },
};

function runtest(){

  const result = getLatLngFromRegionName("四国地方");
  if (result) {
    console.log(`緯度: ${result.lat}, 経度: ${result.lng}, マッチ: ${result.matched}`);
  } else {
    console.log("該当なし");
  }

}
