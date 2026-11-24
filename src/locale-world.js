export const worldText = {
  "Select a landmark to explore its shops. Colors show each shop’s influence.":
    "点击地标，走进现场选店。各铺颜色取自所属联盟。",
  "Station Walk": "车站商段",
  "Park Parade": "公园商段",
  "Explore Station Walk": "探索车站商段",
  "Explore Park Parade": "探索公园商段",
  "Shopping streets in Po Lam": "宝琳的商业街段",
  "Back to district": "返回街区",
  District: "街区",
  "3 storefronts": "三家商铺",
  "Mixed control": "多方控制",
  Ours: "我方",
  "Unified control": "统一控制",
  "Shops your alliance controls": "我方控制的商铺",
  "Select a street, then choose a storefront. Colors show each shop’s influence.":
    "先选择商段，再点击店面。色块示意各铺位的影响范围。",
  "Shop influence legend": "商铺影响图例",
  "Shop influence areas": "商铺影响范围示意",
  "Illustrative shop influence areas in Po Lam": "宝琳商铺影响范围示意",
  "Colors show illustrative shop influence. Select an area to enter its shop.":
    "色块示意商铺影响范围。点击地块可进入对应店铺。",
  "Territory map": "势力版图",
  "Alliance territory map": "联盟势力版图",
  "Six shop territories at MCP Central": "新都城中心二期六个铺位的势力分布",
  "MCP CENTRAL · SHOP HOLDINGS": "新都城中心二期 · 铺位归属",
  "Your territory": "我方控制",
  "Select a territory to enter its shop.": "点击地块，进入对应店铺。",
  "Contested district": "可争夺铺位",
  "6 shops": "6 家店",
  "Latest capture": "最近占领",
  "Upper level": "一楼",
  "Ground level": "地下",
  "Map camera": "地图视野",
  "Zoom in": "放大",
  "Zoom out": "缩小",
  "Recenter map": "地图复位",
  "Interactive map of Po Lam": "宝琳互动地图",
  "MCP Central shopping arcade": "新都城中心二期商场",
  "An illustrated aerial view of Po Lam’s malls, station, tower blocks and park.":
    "宝琳鸟瞰图，包括商场、车站、屋邨和公园。",
  "A two-storey shopping arcade around the central atrium.":
    "两层商铺环绕着中央广场。",
  "A closed shop being prepared for its next tenant.":
    "店铺已落闸，正在为新租户装修。",
  Open: "营业中",
  "Shop contest": "铺位争夺中",
  "Captured · closed": "已占领 · 暂停营业",
  "Alliance ballot": "联盟投票",
  "Under renovation": "装修中",
  "Grand opening": "新店开业",
  "Shop fitting": "店铺装修中",
  "Shutters down": "暂停营业",
  Territories: "势力图",
};

export function worldPatterns(s, tr) {
  const shop = s.match(
    /^(.+) (with its stock and furnishings\.|interior|opens)$/,
  );
  if (shop) {
    const suffix = {
      interior: "店内",
      opens: "开业",
      "with its stock and furnishings.": "的商品和店内陈设。",
    };
    return tr(shop[1]) + suffix[shop[2]];
  }
  if (s.startsWith("Visit ") && s.includes(" · ")) {
    return "前往" + s.slice(6).split(" · ").map(tr).join(" · ");
  }
  if (
    /^(?:Unit \d+|Station Walk|Park Parade|Po Lam Estate|Po Tsui Park|Po Lam Station|MCP (?:Central|Discovery|ONE)|Glaze Lane|Pearl Club|Pixel Port|Little Steam|Roll Call|Sunday Coffee|Neighbour Mart) · /.test(
      s,
    )
  ) {
    const [first, ...rest] = s.split(" · ");
    const name = tr(first);
    if (rest.length === 1 && /^[\u3400-\u9fff]+$/u.test(rest[0])) return name;
    return [name, ...rest.map(tr)].join(" · ");
  }
}
