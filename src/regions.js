// The six MCP Central units keep their original IDs and tenant pool.
export const CENTRAL_TYPES = ["tea", "game", "hotpot", "cafe", "sushi", "donut", "market"];

// Each location has its own fictional traders. A ballot can replace a trader
// with another from the same location, while its unit number stays fixed.
export const REGIONAL_TYPES = {
  lemonade: { name: "Lemonade Stand", shopName: "Lemon Lap", cn: "柠檬水亭", shopNameCn: "柠檬跑圈" },
  kite: { name: "Kite Workshop", shopName: "Paper Swallow", cn: "风筝工房", shopNameCn: "纸燕风筝" },
  skate: { name: "Skateboard Rental", shopName: "Courtside Wheels", cn: "滑板租用站", shopNameCn: "球场轮社" },
  ticketpress: { name: "Postcard Press", shopName: "Last Train Press", cn: "明信片印铺", shopNameCn: "尾班车印务" },
  onigiri: { name: "Rice Ball Counter", shopName: "Platform Picnic", cn: "饭团小铺", shopNameCn: "月台饭团" },
  umbrella: { name: "Umbrella Stall", shopName: "Rain Check", cn: "雨伞档", shopNameCn: "晴雨伞档" },
  florist: { name: "Flower Stall", shopName: "Lift Lobby Flowers", cn: "鲜花档", shopNameCn: "楼下花档" },
  repair: { name: "Repair Shop", shopName: "Good as New", cn: "街坊修理铺", shopNameCn: "修好再用" },
  bakery: { name: "Bun Bakery", shopName: "Morning Oven", cn: "面包坊", shopNameCn: "晨光饼家" },
  record: { name: "Record Shop", shopName: "Side B Records", cn: "黑胶唱片店", shopNameCn: "乙面唱片" },
  ceramics: { name: "Pottery Studio", shopName: "Clay Corner", cn: "陶艺工房", shopNameCn: "转角陶房" },
  camera: { name: "Film Camera Shop", shopName: "Silver Frame", cn: "胶片相机店", shopNameCn: "银框相机" },
  noodles: { name: "Noodle Bar", shopName: "Steam Ribbon", cn: "面档", shopNameCn: "热汤面档" },
  sewing: { name: "Tailor Shop", shopName: "Red Bobbin", cn: "裁缝铺", shopNameCn: "红线辘" },
  books: { name: "Bookshop", shopName: "Little Book Steps", cn: "书店", shopNameCn: "书阶小屋" },
};

function region(name, cn, lots, types = lots.map((lot) => lot.type)) {
  return { name, cn, lots, units: lots.map((lot) => lot.id), types };
}

function lot(id, type, owner) {
  return { id, type, owner };
}

export const REGIONS = {
  central: region("MCP Central", "新都城中心二期", [
    lot("unit01", "donut", "incumbent"),
    lot("unit02", "sushi", "comfort"),
    lot("unit03", "game", "trend"),
    lot("unit04", "cafe", "comfort"),
    lot("unit05", "market", "collective"),
    lot("unit06", "hotpot", "collective"),
  ], CENTRAL_TYPES),
  park: region("Po Tsui Park", "宝翠公园", [
    lot("unit07", "lemonade", "comfort"),
    lot("unit08", "kite", "collective"),
    lot("unit09", "skate", "trend"),
  ]),
  station: region("Po Lam Station", "宝琳站", [
    lot("unit10", "ticketpress", "trend"),
    lot("unit11", "onigiri", "comfort"),
    lot("unit12", "umbrella", "collective"),
  ]),
  estate: region("Po Lam Estate", "宝林邨", [
    lot("unit13", "florist", "comfort"),
    lot("unit14", "repair", "collective"),
    lot("unit15", "bakery", "incumbent"),
  ]),
  discovery: region("MCP Discovery", "新都城中心三期", [
    lot("unit16", "record", "trend"),
    lot("unit17", "ceramics", "comfort"),
    lot("unit18", "camera", "incumbent"),
  ]),
  one: region("MCP ONE", "新都城中心一期", [
    lot("unit19", "noodles", "collective"),
    lot("unit20", "sewing", "incumbent"),
    lot("unit21", "books", "trend"),
  ]),
};

const shopRegions = new Map();
for (const [regionId, area] of Object.entries(REGIONS)) {
  for (const unit of area.units) shopRegions.set(unit, regionId);
}

export function regionOfShop(shopId) {
  return shopRegions.get(shopId) ?? null;
}
