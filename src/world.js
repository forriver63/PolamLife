import { ALLIANCES, TYPES } from "./game.js";
import { icon } from "./icons.js";
import { shopStreet, STREETS } from "./streets.js";

// Positions are percentages of the *illustration*, so labels follow the buildings at every zoom.
const LANDMARKS = [
  { id: "estate", name: "Po Lam Estate", local: "寶林邨", x: 22, y: 10 },
  { id: "park", name: "Po Tsui Park", local: "寶翠公園", x: 15, y: 38 },
  {
    id: "central",
    name: "MCP Central",
    local: "新都城中心二期",
    x: 70,
    y: 53,
  },
  { id: "station", name: "Po Lam Station", local: "寶琳站", x: 66, y: 69 },
  {
    id: "discovery",
    name: "MCP Discovery",
    local: "新都城中心三期",
    x: 53,
    y: 72,
  },
  { id: "one", name: "MCP ONE", local: "新都城中心一期", x: 46, y: 84 },
];
// Walkway centre lines are measured on the reference's 1000 x 750 map canvas.
const INTERCHANGE = [656, 583];
const NORTH_WALK = [
  INTERCHANGE,
  [622, 535],
  [582, 481],
  [549, 433],
  [515, 388],
  [491, 370],
];
const EAST_WALK = [INTERCHANGE, [682, 561]];
const SOUTH_WALK = [INTERCHANGE, [626, 601]];
const WALKWAYS = {
  central: [...EAST_WALK, [704, 547], [735, 526], [745, 509]],
  station: [...EAST_WALK, [674, 543]],
  discovery: [...SOUTH_WALK, [610, 599], [589, 593], [574, 592]],
  one: [...SOUTH_WALK, [585, 623], [543, 648], [497, 669], [480, 651]],
  park: [
    ...NORTH_WALK,
    [453, 398],
    [400, 438],
    [355, 479],
    [318, 501],
    [276, 478],
    [223, 452],
    [164, 427],
    [114, 400],
    [77, 369],
  ],
  estate: [
    ...NORTH_WALK,
    [542, 336],
    [592, 302],
    [638, 255],
    [686, 208],
    [653, 165],
    [615, 129],
    [559, 100],
    [501, 83],
    [437, 71],
    [326, 78],
    [260, 88],
    [211, 94],
  ],
};
const BAYS = {
  unit01: [50, 59.3],
  unit02: [20.4, 33.4],
  unit03: [79.6, 33.4],
  unit04: [20.4, 59.3],
  unit05: [50, 33.4],
  unit06: [79.6, 59.3],
};
const FACTIONS = {
  trend: { short: "Trendsetters", symbol: "bolt" },
  comfort: { short: "Comfort Club", symbol: "flower" },
  collective: { short: "Collective", symbol: "leaf" },
  incumbent: { short: "Arcade Guild", symbol: "shop" },
};
const FINISHES = {
  donut: ["#ac5269", "#edb6ac"],
  tea: ["#2d7468", "#b7d2a7"],
  game: ["#5b587f", "#bbb7d4"],
  cafe: ["#82604b", "#dbbb98"],
  sushi: ["#426676", "#ddd4ba"],
  market: ["#57734e", "#caca8a"],
  hotpot: ["#98564c", "#ebba85"],
  renovating: ["#69706a", "#d7be83"],
};
const mapViews = new WeakMap();
let memory = { session: null, map: null, location: "central" };

function el(tag, cls, value) {
  const item = document.createElement(tag);
  if (cls) item.className = cls;
  if (value !== undefined) item.textContent = value;
  return item;
}

function sprite(type, cls = "w-sprite") {
  const img = el("img", cls);
  img.src = "assets/world/" + type + ".png";
  img.alt = "";
  img.draggable = false;
  return img;
}

function at(node, x, y) {
  node.style.left = x + "%";
  node.style.top = y + "%";
  return node;
}

function hotspot(label, callback, cls) {
  const button = el("button", cls);
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.addEventListener("click", callback);
  return button;
}

function ownerName(owner) {
  return ALLIANCES[owner]?.name || "Arcade Guild";
}

function ownerColor(owner) {
  return ALLIANCES[owner]?.color || "#bc92aa";
}

function isShut(shop) {
  return ["captured", "voting", "renovating"].includes(shop.phase);
}

export function districtFocusShop(state) {
  const live = state.shops[state.contest?.shopId];
  if (live && (live.phase === "contested" || isShut(live))) return live;
  return state.shops[state.history.at(-1)?.shopId] || state.shops.unit01;
}

function phaseText(shop) {
  switch (shop.phase) {
    case "contested":
      return "Shop contest";
    case "captured":
      return "Captured · closed";
    case "voting":
      return "Alliance ballot";
    case "renovating":
      return "Under renovation";
    case "reopened":
      return "Grand opening";
    default:
      return "Open";
  }
}

function addPerson(board, type, x, y, label, motion = "") {
  const person = at(el("div", "w-person " + motion), x, y);
  person.setAttribute("aria-hidden", "true");
  if (label) person.append(el("span", "w-person-name", label));
  person.append(sprite(type));
  board.append(person);
  return person;
}

function walkTo(person, location) {
  const from = WALKWAYS[memory.location];
  const to = WALKWAYS[location];
  const [x, y] = to.at(-1);
  const interrupted = person
    .getAnimations()
    .filter((a) => a.playState === "running");
  interrupted.forEach((a) => a.cancel());
  at(person, x / 10, y / 7.5);
  memory.location = location;
  if (
    from === to ||
    interrupted.length ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  let shared = 0;
  while (from[shared + 1] && from[shared + 1] === to[shared + 1]) shared++;
  const route = [...from.slice(shared).reverse(), ...to.slice(shared + 1)];
  let distance = 0;
  const frames = route.map(([cx, cy], i) => {
    if (i) distance += Math.hypot(cx - route[i - 1][0], cy - route[i - 1][1]);
    return { left: cx / 10 + "%", top: cy / 7.5 + "%", offset: distance };
  });
  frames.forEach((frame) => {
    frame.offset /= distance;
  });
  person.animate(frames, {
    duration: Math.min(4400, Math.max(600, distance * 4)),
    easing: "ease-in-out",
  });
}

function mapLayer(board, state, territories, onLocation, onShop, selectStreet) {
  const focus = districtFocusShop(state);
  const latest = lastCapture(state);
  board.append(territoryOverlay(state, latest, territories, selectStreet));
  const [startX, startY] = WALKWAYS[memory.location].at(-1);
  addPerson(board, "kit", 78.1, 64.3, "", "w-local-person w-central-walk");
  addPerson(board, "jo", 24.4, 39.8, "", "w-local-person w-park-walk");
  const avatar = addPerson(
    board,
    "player",
    startX / 10,
    startY / 7.5,
    "YOU",
    "w-your-person",
  );
  // The mall sign carries the tenant's actual artwork on the district map.
  const signType = isShut(focus) ? "renovating" : focus.type;
  const rooftop = hotspot(
    "Visit " + TYPES[focus.type].shopName + " · " + phaseText(focus),
    () =>
      territories ? selectStreet(shopStreet(focus.id)) : onShop?.(focus.id),
    "w-rooftop",
  );
  rooftop.title = isShut(focus) ? phaseText(focus) : TYPES[focus.type].shopName;
  rooftop.dataset.tenant = signType;
  rooftop.dataset.focusUnit = focus.id;
  rooftop.style.setProperty("--sign-edge", FINISHES[signType][0]);
  rooftop.append(sprite(signType));
  board.append(at(rooftop, 77.8, 59));
  for (const place of LANDMARKS) {
    const main = place.id === "central";
    const marker = hotspot(
      place.name + " · " + place.local,
      () => {
        walkTo(avatar, place.id);
        if (territories && (place.id === "park" || place.id === "station"))
          selectStreet(place.id);
        else onLocation?.(place.id);
      },
      "w-place" + (main ? " w-place-main" : ""),
    );
    at(marker, place.x, place.y);
    marker.dataset.location = place.id;
    const sign = el("span", "w-place-sign");
    const medallion = el("span", "w-place-icon");
    medallion.append(sprite(place.id));
    const text = el("span", "w-place-copy");
    text.append(el("strong", "", place.name), el("small", "", place.local));
    sign.append(medallion, text);
    if (main) {
      marker.style.setProperty("--w-focus-owner", ownerColor(focus.owner));
      if (territories) marker.classList.add("w-marked-mall");
      const arrow = el("i", "w-enter-arrow");
      arrow.innerHTML = icon("arrow", 14);
      sign.append(arrow);
    }
    marker.append(sign);
    if (main && focus.phase !== "open") {
      const strip = el("span", "w-signal w-live");
      strip.append(
        el("i", "w-light"),
        document.createTextNode(
          focus.phase === "reopened"
            ? TYPES[focus.type].shopName + " opens"
            : phaseText(focus),
        ),
      );
      marker.append(strip);
    }
    marker.append(el("span", "w-marker-foot"));
    board.append(marker);
  }
}

// Influence is a schematic catchment for each shop, registered to the original
// 1000 × 750 district canvas. Shared polylines trace arterial roads and local streets.
const INFLUENCE_INK = {
  trend: "#14acac",
  comfort: "#f16f57",
  collective: "#eeb32c",
  incumbent: "#bd78ca",
};

function svgNode(tag, attributes = {}, value) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, val] of Object.entries(attributes))
    node.setAttribute(key, val);
  if (value !== undefined) node.textContent = value;
  return node;
}

function lastCapture(state) {
  return state.events.findLast(
    (event) => event.kind === "capture" && state.shops[event.shopId],
  );
}

function factionBadge(owner) {
  const badge = el("span", "w-faction-badge");
  badge.style.setProperty("--w-owner", ownerColor(owner));
  badge.innerHTML = icon(FACTIONS[owner].symbol, 15);
  return badge;
}

function ownedOnStreet(state, street) {
  return street.units.filter(
    ({ id }) => state.shops[id].owner === state.player.alliance,
  ).length;
}

function segmentMarker(street, state) {
  const [x, y] = street.marker;
  const marker = svgNode("g", {
    class: "w-segment-marker",
    transform: `translate(${x} ${y})`,
  });
  const sign = svgNode("g", { class: "w-segment-sign" });
  sign.append(
    svgNode("rect", { x: -79, y: -19, width: 158, height: 38, rx: 8 }),
  );
  const image = svgNode("image", {
    href: "assets/world/" + street.icon + ".png",
    x: -73,
    y: -12,
    width: 24,
    height: 24,
  });
  const count = ownedOnStreet(state, street);
  sign.append(
    image,
    svgNode("text", { x: -44, y: -2, class: "w-segment-name" }, street.name),
    svgNode("text", { x: -44, y: 12, class: "w-segment-sub" }, "3 storefronts"),
  );
  const tally = state.player.alliance ? count + "/3" : "›";
  sign.append(
    svgNode(
      "text",
      { x: 69, y: 5, class: "w-segment-tally", "text-anchor": "end" },
      tally,
    ),
  );
  marker.append(sign);
  return marker;
}

function drawBorder(overlay, points, kind, units) {
  if (kind !== "internal")
    overlay.append(svgNode("polyline", { class: "w-line-casing", points }));
  overlay.append(
    svgNode("polyline", {
      class: "w-domain-line",
      points,
      "data-edge": kind,
      "data-border-units": units.sort().join(" "),
    }),
  );
}

function territoryOverlay(state, lastClaim, territories, selectStreet) {
  const svg = svgNode("svg", {
    viewBox: "0 0 1000 750",
    class: "w-commerce-map" + (territories ? " w-territories" : ""),
    role: "group",
    "aria-label": "Shopping streets in Po Lam",
  });
  const zones = svgNode("g"),
    borders = svgNode("g");
  for (const [key, street] of Object.entries(STREETS)) {
    const group = svgNode("g", {
      class: "w-segment-zone",
      "data-map-segment": key,
      role: "button",
      tabindex: "0",
      "aria-label": "Explore " + street.name,
    });
    for (const [i, { id, door }] of street.units.entries()) {
      const next = (i + 1) % 3,
        prev = (i + 2) % 3,
        shop = state.shops[id],
        other = state.shops[street.units[prev].id];
      const perimeter = [
        street.outer[i],
        street.arms[next],
        street.arms[i].split(" ").reverse().join(" "),
      ].join(" ");
      const tile = svgNode("g", {
        class: "w-domain",
        "data-territory-unit": id,
        "data-owner": shop.owner,
        "data-phase": shop.phase,
      });
      tile.append(
        svgNode(
          "title",
          {},
          street.name +
            " · " +
            TYPES[shop.type].shopName +
            " · " +
            ownerName(shop.owner) +
            (lastClaim?.shopId === id ? " · Latest capture" : ""),
        ),
        svgNode("polygon", {
          class: "w-domain-fill",
          points: perimeter,
          fill: INFLUENCE_INK[shop.owner],
        }),
      );
      const pin = svgNode("g", {
        class: "w-overview-unit",
        transform: `translate(${door[0]} ${door[1]})`,
      });
      pin.append(
        svgNode("circle", { r: 11, fill: ownerColor(shop.owner) }),
        svgNode("text", { y: 3.5 }, id.slice(-2)),
      );
      tile.append(pin);
      if (lastClaim?.shopId === id) {
        tile.setAttribute("data-latest-capture", "");
        pin.prepend(svgNode("circle", { class: "w-claim-ring", r: 15 }));
      }
      group.append(tile);
      drawBorder(borders, street.outer[i], "perimeter", [id]);
      drawBorder(
        borders,
        street.arms[i],
        other.owner === shop.owner ? "internal" : "border",
        [id, other.id],
      );
    }
    const activate = () => selectStreet(key);
    group.addEventListener("click", activate);
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    group.append(segmentMarker(street, state));
    zones.append(group);
  }
  // Paint the road borders below the clickable signs and unit badges.
  svg.append(borders, zones);
  return svg;
}

function streetFront(state, shop, point, onShop) {
  const type = isShut(shop) ? "renovating" : shop.type;
  const name = TYPES[shop.type].shopName,
    phase = phaseText(shop);
  const door = hotspot(
    ["Unit " + shop.id.slice(-2), name, ownerName(shop.owner), phase].join(
      " · ",
    ),
    () => onShop?.(shop.id),
    "w-map-store",
  );
  Object.assign(door.dataset, {
    mapStore: shop.id,
    owner: shop.owner,
    type,
    phase: shop.phase,
  });
  door.style.setProperty("--w-owner", ownerColor(shop.owner));
  at(door, point[0] / 10, point[1] / 7.5);
  const top = el("span", "w-street-unit", "Unit " + shop.id.slice(-2));
  const shopfront = el("span", "w-map-front");
  const art = el("img", "w-map-frontart");
  art.src = "assets/world/front-" + type + ".webp";
  art.width = 230;
  art.height = 116;
  art.alt = "";
  art.draggable = false;
  shopfront.append(art, el("strong", "w-front-name", name));
  const info = el("span", "w-store-owner");
  info.append(
    factionBadge(shop.owner),
    el("b", "", FACTIONS[shop.owner].short),
  );
  door.append(top, shopfront, info);
  const status = el("span", "w-store-phase");
  if (shop.phase !== "open")
    status.append(el("i"), document.createTextNode(phase));
  if (shop.phase === "renovating" && state.renovation?.shopId === shop.id)
    status.append(
      document.createTextNode(" · "),
      el("span", "", TYPES[state.renovation.toType].shopName),
    );
  if (status.childNodes.length) door.append(status);
  return door;
}

function streetHud(state, key, selectStreet) {
  const street = STREETS[key],
    hud = el("section", "w-segment-hud");
  hud.setAttribute("aria-label", street.name);
  const nav = el("div", "w-segment-nav");
  const back = hotspot(
    "Back to district",
    () => selectStreet(null),
    "w-street-back",
  );
  back.dataset.segmentBack = "";
  back.innerHTML = icon("back", 15);
  back.append(el("span", "", "District"));
  const other = key === "park" ? "station" : "park";
  const swap = hotspot(
    "Explore " + STREETS[other].name,
    () => selectStreet(other),
    "w-street-switch",
  );
  swap.dataset.switchSegment = other;
  swap.append(el("span", "", STREETS[other].name));
  swap.insertAdjacentHTML("beforeend", icon("arrow", 15));
  nav.append(back, swap);
  const headline = el("div", "w-street-headline");
  headline.append(sprite(street.icon), el("strong", "", street.name));
  const owners = new Set(street.units.map(({ id }) => state.shops[id].owner));
  headline.append(
    el(
      "small",
      "w-street-mix",
      owners.size > 1 ? "Mixed control" : "Unified control",
    ),
  );
  if (state.player.alliance) {
    const total = ownedOnStreet(state, street);
    const count = el("b", "w-street-count", total + " / 3");
    count.dataset.segmentCount = total;
    const holdings = el("span", "w-street-holdings");
    holdings.title = "Shops your alliance controls";
    holdings.append(el("small", "", "Ours"), count);
    headline.append(holdings);
    const event = state.events.findLast(
      (e) => e.kind === "capture" && shopStreet(e.shopId) === key,
    );
    if (event && state.shops[event.shopId].owner === state.player.alliance) {
      const prior =
        event.previousOwner ||
        (state.contest?.status === "won" &&
        state.contest.shopId === event.shopId
          ? state.contest.previousOwner
          : null);
      const change = el("div", "w-street-change");
      change.dataset.segmentChange = event.shopId;
      change.append(el("b", "", "Unit " + event.shopId.slice(-2)));
      if (prior && FACTIONS[prior])
        change.append(
          el(
            "span",
            "",
            FACTIONS[prior].short +
              " → " +
              FACTIONS[state.player.alliance].short,
          ),
        );
      change.append(el("strong", "", total - 1 + "/3 → " + total + "/3"));
      hud.append(nav, headline, change);
      return hud;
    }
  }
  hud.append(nav, headline);
  return hud;
}

function territoryKey(state) {
  const key = el("section", "w-territory-key");
  key.setAttribute("aria-label", "Shop influence legend");
  const details = el("details", "w-influence-details");
  const summary = el("summary");
  const player = state.player.alliance;
  if (player) summary.append(factionBadge(player));
  const title = el("span", "w-influence-title");
  title.append(
    el("b", "", player ? FACTIONS[player].short : "MCP Central"),
    el("small", "", "Shop influence areas"),
  );
  summary.append(title);
  const shops = Object.values(state.shops);
  if (player) {
    const held = shops.filter((shop) => shop.owner === player).length;
    const count = el("strong", "", held + " / " + shops.length);
    count.dataset.ownedCount = held;
    summary.append(count);
  }
  const chevron = el("i", "w-key-disclosure");
  chevron.setAttribute("aria-hidden", "true");
  summary.append(chevron);
  const legend = el("ul", "w-influence-factions");
  for (const [owner, faction] of Object.entries(FACTIONS)) {
    const row = el("li");
    row.dataset.faction = owner;
    row.append(
      factionBadge(owner),
      el("span", "", faction.short),
      el("b", "", shops.filter((shop) => shop.owner === owner).length),
    );
    legend.append(row);
  }
  details.append(
    summary,
    legend,
    el(
      "p",
      "",
      "Select a street, then choose a storefront. Colors show each shop’s influence.",
    ),
  );
  key.append(details);
  return key;
}

function bunting(color) {
  const string = el("div", "w-bunting");
  string.ariaHidden = "true";
  for (let i = 0; i < 9; i++) {
    const flag = el("i");
    flag.style.backgroundColor = [color, "#f6d9a4", "#de9177"][i % 3];
    string.append(flag);
  }
  return string;
}

function mallLayer(board, state, territories, onShop) {
  for (const [id, [x, y]] of Object.entries(BAYS)) {
    const shop = state.shops[id];
    const type = isShut(shop) ? "renovating" : shop.type;
    const name = TYPES[shop.type].shopName;
    const button = hotspot(
      name + " · " + phaseText(shop),
      () => onShop?.(id),
      "w-shop-door",
    );
    at(button, x, y);
    button.dataset.shop = id;
    button.dataset.phase = shop.phase;
    button.dataset.type = type;
    button.style.backgroundImage =
      'url("assets/world/front-' + type + '.webp")';
    const [dark, light] = FINISHES[type];
    button.style.setProperty("--w-trim", dark);
    button.style.setProperty("--w-stripe", light);
    button.style.setProperty("--w-owner", ownerColor(shop.owner));
    const shopIcon = el("span", "w-trade-sign");
    shopIcon.append(sprite(type));
    const frame = el("span", "w-shop-frame");
    const storeTitle = el(
      "strong",
      "w-shop-title",
      isShut(shop)
        ? shop.phase === "renovating"
          ? "Shop fitting"
          : "Shutters down"
        : name,
    );
    const awning = el("span", "w-awning");
    const front = el("span", "w-store-window");
    if (shop.decorated) front.append(bunting(ownerColor(shop.owner)));
    frame.append(storeTitle, awning, front);
    const unit = el("span", "w-unit");
    const showStatus = shop.phase !== "open";
    unit.append(
      el("b", "", id.slice(-2)),
      document.createTextNode(
        " " + (showStatus ? phaseText(shop) : TYPES[shop.type].name),
      ),
    );
    button.append(frame, shopIcon, unit);
    const flag = el(
      "span",
      "w-owner-flag",
      territories ? ownerName(shop.owner) : FACTIONS[shop.owner].short,
    );
    flag.title = ownerName(shop.owner);
    button.append(flag);
    board.append(button);
  }
  addPerson(board, "kit", 64, 83, "", "w-stroll");
  addPerson(board, "jo", 40, 78, "", "w-stroll w-stroll-back");
  addPerson(board, "player", 50, 83, "YOU", "w-your-person");
}

function shopLayer(board, state, shop) {
  if (shop.decorated) {
    const garland = bunting(ownerColor(shop.owner));
    garland.classList.add("w-interior-bunting");
    board.append(garland);
  }
  if (shop.phase === "reopened") {
    const confetti = el("div", "w-confetti");
    confetti.ariaHidden = "true";
    for (let i = 0; i < 30; i++) {
      const bit = el("i");
      bit.style.left = ((i * 47 + 3) % 100) + "%";
      bit.style.setProperty("--w-delay", (-i % 11) * 0.18 + "s");
      bit.style.setProperty("--w-fall", 2.9 + (i % 5) * 0.3 + "s");
      bit.style.backgroundColor = ["#ecac70", "#d87988", "#7fbbac", "#ffdb71"][
        i % 4
      ];
      confetti.append(bit);
    }
    board.append(confetti);
  }
}

// Keep the map's 4:3 aspect ratio, with independent district and storefront framing.
function configureCamera(host, board, img, interactive, scene) {
  const model =
    scene === "map" && memory.map ? { ...memory.map } : { k: 1, x: 0, y: 0 };
  let w = 1,
    h = 1,
    vw = 1,
    vh = 1,
    minimumZoom = 1;
  let focusedStreet = null;
  function draw() {
    const limitX = Math.max(0, (w * model.k - vw) / 2, ((model.k - 1) * w) / 2);
    const limitY = Math.max(0, (h * model.k - vh) / 2, ((model.k - 1) * h) / 2);
    model.x = Math.max(-limitX, Math.min(limitX, model.x));
    model.y = Math.max(-limitY, Math.min(limitY, model.y));
    board.style.transform =
      "translate(" +
      ((vw - w * model.k) / 2 + model.x) +
      "px," +
      ((vh - h * model.k) / 2 + model.y) +
      "px) scale(" +
      model.k +
      ")";
    board.style.setProperty("--w-counter-zoom", Math.min(1, 1 / model.k));
    board.style.setProperty("--w-store-counter", 1 / model.k);
    if (scene === "map") {
      const screenScale = (w * model.k) / 1000;
      host.classList.toggle("w-map-overview", screenScale < 0.58);
      board.style.setProperty("--w-mini-scale", 1 / screenScale);
    }
    if (scene === "map" && !focusedStreet) {
      model.overviewWidth = vw;
      memory.map = { ...model };
    }
  }
  function frameDistrict() {
    model.k = minimumZoom;
    model.x = 0;
    model.y = 0;
    if (scene !== "map" || vw >= 590) return;
    // Compact street signs are 98 screen pixels wide. Split the remaining
    // space between their two centers, leaving a margin on both sides.
    const west = STREETS.park.marker[0];
    const east = STREETS.station.marker[0];
    const separation = Math.min(vw * 0.61, vw - 98 - 20);
    const districtWidth = (1000 * separation) / (east - west);
    model.k = Math.max(minimumZoom, Math.min(1, districtWidth / w));
    model.x = (0.5 - (west + east) / 2000) * w * model.k;
  }
  function fit() {
    vw = host.clientWidth || 1;
    vh = host.clientHeight || 1;
    const ratio =
      img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : scene === "map"
          ? 1448 / 1086
          : scene === "mall"
            ? 1152 / 672
            : 16 / 9;
    w =
      scene === "map" && vw >= 590
        ? Math.min(vw - 16, (vh - 14) * ratio)
        : Math.max(vw, vh * ratio);
    h = w / ratio;
    minimumZoom =
      scene === "map" && vw < 590
        ? Math.min(1, Math.max(1, vw - 12) / w, Math.max(1, vh - 12) / h)
        : 1;
    model.k = Math.max(minimumZoom, model.k);
    board.style.width = w + "px";
    board.style.height = h + "px";
    if (focusedStreet) frameStreet();
    else if (scene === "map" && model.overviewWidth !== vw) frameDistrict();
    draw();
  }
  const abort = new AbortController();
  const options = { signal: abort.signal };
  img.addEventListener("load", fit, options);
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  fit();
  const zoom = (factor, cx = 0, cy = 0) => {
    const old = model.k;
    model.k = Math.max(minimumZoom, Math.min(2.4, old * factor));
    const delta = model.k / old;
    model.x = cx - (cx - model.x) * delta;
    model.y = cy - (cy - model.y) * delta;
    draw();
    return model.k;
  };
  function frameStreet() {
    const points = STREETS[focusedStreet].units.map((unit) => unit.door);
    const xs = points.map((point) => point[0]),
      ys = points.map((point) => point[1]);
    const left = Math.min(...xs),
      right = Math.max(...xs),
      top = Math.min(...ys),
      bottom = Math.max(...ys);
    const narrow = vw < 600;
    const doorWidth = narrow
      ? Math.max(89, Math.min(122, vw * 0.31))
      : Math.max(135, Math.min(205, vw * 0.15));
    const scale = Math.min(
      2.35,
      (vw - doorWidth - (narrow ? 18 : 65)) / (right - left),
      (vh - doorWidth * 0.87 - (narrow ? 174 : 165)) / (bottom - top),
    );
    model.k = Math.max(minimumZoom, Math.min(2.4, (scale * 1000) / w));
    model.x = (0.5 - (left + right) / 2000) * w * model.k;
    model.y = (0.5 - (top + bottom) / 1500) * h * model.k + doorWidth * 0.18;
    board.style.setProperty("--w-store-width", doorWidth + "px");
  }
  function selectStreet(key) {
    if (key === focusedStreet) return;
    focusedStreet = key;
    if (key) frameStreet();
    else if (vw < 590 || memory.map?.overviewWidth !== vw) frameDistrict();
    else Object.assign(model, memory.map);
    draw();
  }
  function reset() {
    if (focusedStreet) {
      frameStreet();
      draw();
      return;
    }
    frameDistrict();
    draw();
  }
  if (interactive) {
    const pointers = new Map();
    let distance = 0;
    let dragging = false;
    function startDrag() {
      dragging = true;
      host.classList.add("w-grabbing");
      for (const id of pointers.keys()) host.setPointerCapture(id);
    }
    host.addEventListener(
      "pointerdown",
      (event) => {
        if (
          event.button !== 0 ||
          event.target.closest("button, .w-territory-key")
        )
          return;
        if (!pointers.size) dragging = false;
        pointers.set(event.pointerId, [event.clientX, event.clientY]);
        if (pointers.size === 2) {
          startDrag();
          const [a, b] = [...pointers.values()];
          distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
        }
      },
      options,
    );
    host.addEventListener(
      "pointermove",
      (event) => {
        const old = pointers.get(event.pointerId);
        if (!old) return;
        if (!dragging) {
          if (Math.hypot(event.clientX - old[0], event.clientY - old[1]) < 6)
            return;
          startDrag();
        }
        pointers.set(event.pointerId, [event.clientX, event.clientY]);
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (d && distance) zoom(d / distance);
          distance = d;
        } else {
          model.x += event.clientX - old[0];
          model.y += event.clientY - old[1];
          draw();
        }
      },
      options,
    );
    function release(event) {
      if (event.type === "lostpointercapture" && event.target !== host) return;
      pointers.delete(event.pointerId);
      if (!pointers.size) host.classList.remove("w-grabbing");
    }
    host.addEventListener("lostpointercapture", release, options);
    host.addEventListener("pointerup", release, options);
    host.addEventListener("pointercancel", release, options);
    host.addEventListener(
      "pointerleave",
      (event) => {
        if (!dragging) release(event);
      },
      options,
    );
    host.addEventListener(
      "click",
      (event) => {
        if (
          dragging &&
          event.detail > 0 &&
          !event.target.closest("button, .w-territory-key")
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { ...options, capture: true },
    );
    host.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        const rect = host.getBoundingClientRect();
        zoom(
          Math.exp(-event.deltaY * 0.0018),
          event.clientX - rect.left - vw / 2,
          event.clientY - rect.top - vh / 2,
        );
      },
      { ...options, passive: false },
    );
    host.addEventListener(
      "keydown",
      (event) => {
        if (event.target !== host) return;
        switch (event.key) {
          case "+":
          case "=":
            zoom(1.25);
            break;
          case "-":
            zoom(1 / 1.25);
            break;
          case "Home":
            reset();
            break;
          case "ArrowRight":
            model.x -= 55;
            draw();
            break;
          case "ArrowLeft":
            model.x += 55;
            draw();
            break;
          case "ArrowDown":
            model.y -= 55;
            draw();
            break;
          case "ArrowUp":
            model.y += 55;
            draw();
            break;
          default:
            return;
        }
        event.preventDefault();
      },
      options,
    );
  }
  return {
    zoom,
    reset,
    selectStreet,
    dispose() {
      observer.disconnect();
      abort.abort();
    },
  };
}

function addControls(host, camera) {
  const bar = el("div", "w-controls");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Map camera");
  for (const [label, symbol, handler] of [
    ["Zoom in", "+", () => camera.zoom(1.25)],
    ["Zoom out", "−", () => camera.zoom(0.8)],
    ["Recenter map", null, camera.reset],
  ]) {
    const btn = hotspot(label, handler, "w-control");
    btn.title = label;
    if (symbol) btn.textContent = symbol;
    else btn.innerHTML = icon("compass", 19);
    bar.append(btn);
  }
  host.append(bar);
}

export function mountWorld(
  container,
  {
    state,
    scene = "map",
    shopId = "unit01",
    territories = false,
    onLocation,
    onShop,
    mapShopId = null,
    onMapShopFocus,
  },
) {
  mapViews.get(container)?.();
  if (memory.session !== state.sessionId)
    memory = { session: state.sessionId, map: null, location: "central" };
  const shop = state.shops[shopId] || state.shops.unit01;
  const host = el("div", "w-scene w-" + scene);
  host.setAttribute("role", "region");
  const titles = {
    map: "Interactive map of Po Lam",
    mall: "MCP Central shopping arcade",
    shop: TYPES[shop.type].shopName + " interior",
  };
  host.setAttribute("aria-label", titles[scene]);
  const movable = scene !== "shop";
  if (movable) host.tabIndex = 0;
  const board = el("div", "w-board");
  const img = el("img", "w-art");
  img.alt =
    scene === "map"
      ? "An illustrated aerial view of Po Lam’s malls, station, tower blocks and park."
      : scene === "mall"
        ? "A two-storey shopping arcade around the central atrium."
        : isShut(shop)
          ? "A closed shop being prepared for its next tenant."
          : TYPES[shop.type].name + " with its stock and furnishings.";
  img.draggable = false;
  img.src =
    scene === "map"
      ? "assets/map.webp"
      : scene === "mall"
        ? "assets/mall.webp"
        : "assets/interiors/" +
          (isShut(shop) ? "renovating" : shop.type) +
          ".webp";
  board.append(img);
  let camera,
    focusedKey = null;
  function focusStreet(key, notify = true) {
    if (key === focusedKey && host.dataset.focusedSegment !== undefined) return;
    focusedKey = key;
    host.dataset.focusedSegment = key || "";
    board.querySelectorAll(".w-map-store").forEach((node) => node.remove());
    host.querySelector(".w-segment-hud")?.remove();
    for (const zone of board.querySelectorAll("[data-map-segment]")) {
      zone.setAttribute(
        "aria-pressed",
        String(zone.dataset.mapSegment === key),
      );
      zone.setAttribute("tabindex", key === null ? "0" : "-1");
    }
    if (key) {
      for (const { id, door } of STREETS[key].units) {
        const store = streetFront(state, state.shops[id], door, onShop);
        if (lastCapture(state)?.shopId === id)
          store.setAttribute("data-recent-store", "");
        if (id === (notify ? STREETS[key].home : mapShopId)) {
          store.setAttribute("aria-current", "true");
          store.dataset.focusedStore = id;
        }
        board.append(store);
      }
      host.append(streetHud(state, key, focusStreet));
    }
    camera?.selectStreet(key);
    if (notify) {
      onMapShopFocus?.(key ? STREETS[key].home : null);
      if (key)
        host
          .querySelector("[data-segment-back]")
          ?.focus({ preventScroll: true });
      else
        board
          .querySelector(
            '[data-map-segment="' + (lastStreet || "station") + '"]',
          )
          ?.focus({ preventScroll: true });
    }
    if (key) lastStreet = key;
  }
  let lastStreet = null;
  if (scene === "map")
    mapLayer(board, state, territories, onLocation, onShop, focusStreet);
  else if (scene === "mall") mallLayer(board, state, territories, onShop);
  else shopLayer(board, state, shop);
  host.append(board);
  container.replaceChildren(host);
  if (scene === "map" && territories) {
    host.classList.add("w-influence-on");
    host.append(territoryKey(state));
  }
  camera = configureCamera(host, board, img, movable, scene);
  if (scene === "map") {
    addControls(host, camera);
    focusStreet(shopStreet(mapShopId) || null, false);
  }
  const clean = () => {
    camera.dispose();
    host.remove();
    if (mapViews.get(container) === clean) mapViews.delete(container);
  };
  mapViews.set(container, clean);
  return clean;
}
