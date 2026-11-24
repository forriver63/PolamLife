export const worldText = {
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
    /^(?:Unit \d+|Po Lam Estate|Po Tsui Park|Po Lam Station|MCP (?:Central|Discovery|ONE)|Glaze Lane|Pearl Club|Pixel Port|Little Steam|Roll Call|Sunday Coffee|Neighbour Mart) · /.test(
      s,
    )
  ) {
    const [first, ...rest] = s.split(" · ");
    const name = tr(first);
    if (rest.length === 1 && /^[\u3400-\u9fff]+$/u.test(rest[0])) return name;
    return [name, ...rest.map(tr)].join(" · ");
  }
}
