import { ALLIANCES, TYPES } from "./game.js";
import { icon } from "./icons.js";

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

function mapLayer(board, state, territories, onLocation, onShop) {
  const focus = districtFocusShop(state);
  const latest = lastCapture(state);
  if (territories) board.append(territoryOverlay(state, latest, onShop));
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
    () => onShop?.(focus.id),
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
        onLocation?.(place.id);
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
const DOMAINS = [
  [
    { unit: "unit02", x: 168, y: 211 },
    { unit: "unit05", x: 467, y: 188 },
    { unit: "unit06", x: 810, y: 239 },
  ],
  [
    { unit: "unit04", x: 212, y: 554 },
    { unit: "unit01", x: 448, y: 506 },
    { unit: "unit03", x: 767, y: 575 },
  ],
];
const EAST_WEST = [
  [
    "22,148 77,126 132,110 197,93 262,81 326,73 380,68",
    "380,68 445,67 499,74 554,88 611,118 653,154 686,208",
    "686,208 727,172 768,148 784,115 817,97 842,78 859,36",
  ],
  [
    "76,366 114,396 164,425 222,451 270,476 319,500",
    "319,500 352,478 400,438 446,403 491,370",
    "491,370 534,349 562,337 592,333 625,343 649,355 681,344 728,324 751,354 781,396 814,430 850,449",
  ],
  [
    "18,628 80,633 156,634 228,646 288,653 350,666 423,686",
    "423,686 470,673 519,649 578,623 622,601 655,586",
    "655,586 682,610 708,647 742,684 759,708 828,716 894,707 947,695",
  ],
];
const NORTH_SOUTH = [
  [
    "22,148 12,187 17,226 26,267 41,308 57,341 76,366",
    "380,68 379,120 365,143 349,157 315,164 276,190 258,238 262,273 248,312 264,337 288,350 294,385 321,414 349,433 355,465 319,500",
    "686,208 651,243 623,273 590,302 546,336 491,370",
    "859,36 893,84 922,124 948,166 956,201 935,239 908,265 888,301 887,341 899,371 871,410 850,449",
  ],
  [
    "76,366 58,390 36,417 22,451 30,484 21,519 32,558 15,596 18,628",
    "319,500 343,540 370,582 394,622 411,653 423,686",
    "491,370 516,392 550,436 582,481 623,535 655,586",
    "850,449 875,485 912,532 950,578 985,614 972,659 947,695",
  ],
];
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

function domainLabel(shop, x, y, latest) {
  const name = TYPES[shop.type].shopName;
  const width = name.length >= 12 ? 148 : 130;
  const label = svgNode("g", {
    class: "w-domain-label",
    transform: `translate(${x - (width - 130) / 2} ${y})`,
  });
  const color = ownerColor(shop.owner);
  label.append(
    svgNode("rect", {
      x: -65,
      y: -17,
      width,
      height: 35,
      rx: 5,
      fill: "#322339",
      stroke: color,
      "stroke-width": 1.7,
    }),
  );
  label.append(
    svgNode("path", { d: "M-65 -16 H-37 V6 L-51 18 -65 6Z", fill: color }),
  );
  const sigil = svgNode("g", {
    transform: "translate(-60 -10)",
    color: "#342337",
  });
  sigil.innerHTML = icon(FACTIONS[shop.owner].symbol, 18);
  label.append(sigil);
  label.append(
    svgNode(
      "text",
      { class: "w-domain-unit", x: -30, y: -3 },
      "Unit " + shop.id.slice(-2),
    ),
    svgNode("text", { class: "w-domain-name", x: -30, y: 11 }, name),
  );
  if (latest) {
    const star = svgNode("g", {
      class: "w-claim-stamp",
      transform: `translate(${width - 71} -15)`,
    });
    star.append(
      svgNode("circle", { r: 9 }),
      svgNode("path", {
        d: "M0 -6 1.8 -1.8 6 0 1.8 1.8 0 6 -1.8 1.8 -6 0 -1.8 -1.8Z",
      }),
    );
    label.append(star);
  }
  const miniature = svgNode("g", { class: "w-domain-mini" });
  miniature.append(
    svgNode("rect", {
      x: -19,
      y: -9,
      width: 38,
      height: 18,
      rx: 4,
      fill: "#322339",
      stroke: latest ? "#ffe69b" : color,
      "stroke-width": latest ? 2.5 : 1.5,
    }),
  );
  const crest = svgNode("g", { transform: "translate(-16 -6)", color });
  crest.innerHTML = icon(FACTIONS[shop.owner].symbol, 12);
  miniature.append(crest, svgNode("text", { x: -1, y: 4 }, shop.id.slice(-2)));
  label.append(miniature);
  return label;
}

function territoryOverlay(state, lastClaim, onShop) {
  const svg = svgNode("svg", {
    viewBox: "0 0 1000 750",
    class: "w-territories",
    role: "group",
    "aria-label": "Illustrative shop influence areas in Po Lam",
  });
  const edges = new Map();
  for (const [row, domains] of DOMAINS.entries()) {
    for (const [col, { unit, x, y }] of domains.entries()) {
      const shop = state.shops[unit];
      const claimed = lastClaim?.shopId === unit;
      const info = [
        "Unit " + unit.slice(-2),
        TYPES[shop.type].shopName,
        ownerName(shop.owner),
        phaseText(shop),
      ];
      if (claimed) info.push("Latest capture");
      const tile = svgNode("g", {
        class: "w-domain",
        role: "button",
        tabindex: "0",
        "aria-label": info.join(" · "),
        "data-territory-unit": unit,
        "data-owner": shop.owner,
        "data-phase": shop.phase,
      });
      tile.append(svgNode("title", {}, info.join(" · ")));
      if (claimed) tile.setAttribute("data-latest-capture", "");
      const sides = [
        EAST_WEST[row][col],
        NORTH_SOUTH[row][col + 1],
        EAST_WEST[row + 1][col],
        NORTH_SOUTH[row][col],
      ];
      const perimeter = sides
        .flatMap((side, index) => {
          const points = side.split(" ");
          edges.set(side, [...(edges.get(side) || []), shop.owner]);
          return index < 2 ? points : points.reverse();
        })
        .join(" ");
      tile.append(
        svgNode("polygon", {
          class: "w-domain-fill",
          points: perimeter,
          fill: INFLUENCE_INK[shop.owner],
        }),
      );
      if (claimed)
        tile.append(
          svgNode("polygon", { class: "w-claim-outline", points: perimeter }),
        );
      tile.append(domainLabel(shop, x, y, claimed));
      tile.addEventListener("click", () => onShop?.(unit));
      tile.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onShop?.(unit);
        }
      });
      svg.append(tile);
    }
  }
  for (const [points, owners] of edges) {
    const boundary =
      owners.length === 1
        ? "perimeter"
        : owners[0] === owners[1]
          ? "internal"
          : "border";
    if (boundary !== "internal")
      svg.append(svgNode("polyline", { class: "w-line-casing", points }));
    svg.append(
      svgNode("polyline", {
        class: "w-domain-line",
        points,
        "data-edge": boundary,
      }),
    );
  }
  return svg;
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
      "Colors show illustrative shop influence. Select an area to enter its shop.",
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

// Cover the viewport without distorting the painting. In narrow views panning exposes its edges.
function configureCamera(host, board, img, interactive, scene) {
  const model =
    scene === "map" && memory.map ? { ...memory.map } : { k: 1, x: 0, y: 0 };
  let w = 1,
    h = 1,
    vw = 1,
    vh = 1,
    minimumZoom = 1;
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
    if (scene === "map") {
      const screenScale = (w * model.k) / 1000;
      host.classList.toggle("w-map-overview", screenScale < 0.58);
      board.style.setProperty("--w-mini-scale", 1 / screenScale);
    }
    if (scene === "map") memory.map = { ...model };
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
  function reset() {
    model.k = 1;
    model.x = model.y = 0;
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
  if (scene === "map") mapLayer(board, state, territories, onLocation, onShop);
  else if (scene === "mall") mallLayer(board, state, territories, onShop);
  else shopLayer(board, state, shop);
  host.append(board);
  container.replaceChildren(host);
  if (scene === "map" && territories) {
    host.classList.add("w-influence-on");
    host.append(territoryKey(state));
  }
  const camera = configureCamera(host, board, img, movable, scene);
  if (scene === "map") addControls(host, camera);
  const clean = () => {
    camera.dispose();
    host.remove();
    if (mapViews.get(container) === clean) mapViews.delete(container);
  };
  mapViews.set(container, clean);
  return clean;
}
