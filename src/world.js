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
  if (territories) board.append(roofTerritories(state, latest));
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
  const flags = Object.values(state.shops);
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
    if (main && (territories || focus.phase !== "open")) {
      const strip = el("span", "w-signal");
      if (focus.phase !== "open") {
        strip.classList.add("w-live");
        strip.append(
          el("i", "w-light"),
          document.createTextNode(
            focus.phase === "reopened"
              ? TYPES[focus.type].shopName + " opens"
              : phaseText(focus),
          ),
        );
      } else {
        strip.append(document.createTextNode("Territories"));
        for (const shop of flags) {
          const flag = el("i", "w-tiny-flag");
          flag.title =
            TYPES[shop.type].shopName + " · " + ownerName(shop.owner);
          flag.style.setProperty("--w-owner", ownerColor(shop.owner));
          strip.append(flag);
        }
      }
      marker.append(strip);
    }
    marker.append(el("span", "w-marker-foot"));
    board.append(marker);
  }
}

// Shared edges follow the upper and ground-level rows of the playable atrium.
// Each edge is drawn once, so two adjoining holdings can share a single domain.
const DOMAIN_ROWS = [
  ["unit02", "unit05", "unit03"],
  ["unit04", "unit01", "unit06"],
];
const EAST_WEST = [
  [
    "12,35 32,18 110,18 132,9",
    "132,9 195,9 208,18 258,18 276,12",
    "276,12 358,12 391,36",
  ],
  [
    "19,110 51,110 66,119 116,119 136,106",
    "136,106 174,106 188,115 227,115 241,104 275,104",
    "275,104 305,109 331,104 381,104",
  ],
  [
    "14,184 35,208 112,208 137,217",
    "137,217 196,217 208,210 255,210 278,217",
    "278,217 352,217 387,190",
  ],
];
const NORTH_SOUTH = [
  [
    "12,35 12,79 19,87 19,110",
    "132,9 132,47 142,57 142,84 136,90 136,106",
    "276,12 276,49 260,64 260,83 275,94 275,104",
    "391,36 391,81 381,91 381,104",
  ],
  [
    "19,110 19,137 10,151 14,184",
    "136,106 136,139 124,149 124,168 137,183 137,217",
    "275,104 275,137 287,146 287,177 278,187 278,217",
    "381,104 381,145 394,156 387,190",
  ],
];

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

function roofTerritories(state, latest) {
  const plan = svgNode("svg", {
    class: "w-roof-territories",
    viewBox: "0 0 1000 750",
    "aria-hidden": "true",
  });
  // Project onto the eastern roof terrace. The arch, station and nearby flats
  // remain visible when territory control changes.
  const point = (col, row) =>
    [
      681 + (col * 55) / 3 + (row * 48) / 2,
      359 - (col * 22) / 3 + (row * 66) / 2,
    ].join(",");
  for (const [row, units] of DOMAIN_ROWS.entries()) {
    for (const [col, unit] of units.entries()) {
      const shop = state.shops[unit];
      const tile = svgNode("polygon", {
        points: [
          point(col, row),
          point(col + 1, row),
          point(col + 1, row + 1),
          point(col, row + 1),
        ].join(" "),
        fill: ownerColor(shop.owner),
        "data-roof-unit": unit,
        "data-owner": shop.owner,
      });
      if (latest?.shopId === unit) tile.classList.add("w-roof-claim");
      plan.append(tile);
    }
  }
  return plan;
}

function factionBadge(owner) {
  const badge = el("span", "w-faction-badge");
  badge.style.setProperty("--w-owner", ownerColor(owner));
  badge.innerHTML = icon(FACTIONS[owner].symbol, 16);
  return badge;
}

function territoryChart(state, lastClaim, onShop) {
  const svg = svgNode("svg", {
    viewBox: "0 0 404 226",
    class: "w-territory-chart",
    role: "group",
    "aria-label": "Six shop territories at MCP Central",
  });
  const edges = new Map();
  for (const [row, units] of DOMAIN_ROWS.entries()) {
    for (const [col, unit] of units.entries()) {
      const shop = state.shops[unit];
      const name = TYPES[shop.type].shopName;
      const claimed = lastClaim?.shopId === unit;
      const accessible = [
        "Unit " + unit.slice(-2),
        name,
        ownerName(shop.owner),
        phaseText(shop),
      ];
      if (claimed) accessible.push("Latest capture");
      const tile = svgNode("g", {
        class: "w-domain",
        role: "button",
        tabindex: "0",
        "aria-label": accessible.join(" · "),
        "data-territory-unit": unit,
        "data-owner": shop.owner,
        "data-phase": shop.phase,
      });
      tile.append(svgNode("title", {}, accessible.join(" · ")));
      if (claimed) tile.setAttribute("data-latest-capture", "");
      const sides = [
        EAST_WEST[row][col],
        NORTH_SOUTH[row][col + 1],
        EAST_WEST[row + 1][col],
        NORTH_SOUTH[row][col],
      ];
      const perimeter = sides.flatMap((side, index) => {
        const points = side.split(" ");
        edges.set(side, [...(edges.get(side) || []), shop.owner]);
        return index < 2 ? points : points.reverse();
      });
      tile.append(
        svgNode("polygon", {
          points: perimeter.join(" "),
          fill: ownerColor(shop.owner),
        }),
      );
      const x = [74, 204, 330][col],
        y = [57, 155][row];
      const mark = svgNode("g", {
        transform: "translate(" + (x - 9) + " " + (y - 15) + ")",
      });
      mark.innerHTML = icon(FACTIONS[shop.owner].symbol, 18);
      tile.append(
        mark,
        svgNode(
          "text",
          { class: "w-domain-unit", x, y: y + 16 },
          "Unit " + unit.slice(-2),
        ),
        svgNode("text", { class: "w-domain-name", x, y: y + 31 }, name),
      );
      if (claimed) {
        const stamp = svgNode("g", {
          class: "w-claim-stamp",
          transform: "translate(" + (x + 31) + " " + (y - 15) + ")",
        });
        stamp.append(
          svgNode("circle", {
            r: 9,
            fill: "#ffebf7",
            stroke: "#543762",
            "stroke-width": "1.5",
          }),
        );
        stamp.append(
          svgNode("path", {
            d: "M0 -6 1.8 -1.8 6 0 1.8 1.8 0 6 -1.8 1.8 -6 0 -1.8 -1.8Z",
            fill: "#684475",
          }),
        );
        tile.append(stamp);
      }
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

function territoryAtlas(state, onShop) {
  const panel = el("section", "w-territory-atlas");
  panel.setAttribute("aria-label", "Alliance territory map");
  const shops = Object.values(state.shops);
  const player = state.player.alliance;
  const counts = Object.fromEntries(
    Object.keys(FACTIONS).map((owner) => [
      owner,
      shops.filter((shop) => shop.owner === owner).length,
    ]),
  );
  const latest = lastCapture(state);
  const header = el("header", "w-atlas-head");
  header.append(
    el("small", "w-atlas-kicker", "MCP CENTRAL · SHOP HOLDINGS"),
    el("h2", "", "Territory map"),
  );
  const score = el("div", "w-atlas-score");
  if (player) {
    const count = el("strong", "", counts[player] + " / " + shops.length);
    count.dataset.ownedCount = counts[player];
    const team = el("span", "w-score-team");
    team.append(
      el("small", "", "Your territory"),
      el("b", "", FACTIONS[player].short),
    );
    score.append(factionBadge(player), team, count);
  } else {
    score.append(
      el("span", "", "Contested district"),
      el("strong", "", "6 shops"),
    );
  }
  const chart = territoryChart(state, latest, onShop);
  const legend = el("ul", "w-atlas-key");
  for (const [owner, faction] of Object.entries(FACTIONS)) {
    const row = el("li");
    row.dataset.faction = owner;
    const name = el("span", "", faction.short);
    name.title = ownerName(owner);
    row.append(factionBadge(owner), name, el("b", "", counts[owner]));
    legend.append(row);
  }
  const plate = el("div", "w-atlas-plate");
  plate.append(
    el("span", "w-atlas-level", "Upper level"),
    chart,
    el("span", "w-atlas-level", "Ground level"),
  );
  panel.append(
    header,
    score,
    plate,
    el("p", "w-atlas-hint", "Select a territory to enter its shop."),
    legend,
  );
  if (latest) {
    const shop = state.shops[latest.shopId];
    const log = el("div", "w-atlas-claim");
    log.innerHTML = icon("star", 15);
    log.append(
      el("span", "", "Latest capture"),
      el(
        "b",
        "",
        "Unit " + shop.id.slice(-2) + " · " + FACTIONS[shop.owner].short,
      ),
    );
    panel.append(log);
  }
  return panel;
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
    if (shop.decorated)
      front.append(bunting(ownerColor(shop.owner)));
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
    vh = 1;
  function draw() {
    const limitX = Math.max(0, (w * model.k - vw) / 2);
    const limitY = Math.max(0, (h * model.k - vh) / 2);
    // Keep the mall's entire primary sign visible at the opening scale, also
    // on a phone where the map window must crop the district's western edge.
    const atlasOffset = host.classList.contains("w-with-atlas")
      ? Math.max(
          -limitX,
          Math.min(
            limitX,
            w * 0.065,
            vw / 2 - w * 0.2 - Math.min(114, vw * 0.3),
          ),
        ) * model.k
      : 0;
    model.x = Math.max(
      -limitX - atlasOffset,
      Math.min(limitX - atlasOffset, model.x),
    );
    model.y = Math.max(-limitY, Math.min(limitY, model.y));
    board.style.transform =
      "translate(" +
      ((vw - w * model.k) / 2 + model.x + atlasOffset) +
      "px," +
      ((vh - h * model.k) / 2 + model.y) +
      "px) scale(" +
      model.k +
      ")";
    board.style.setProperty("--w-counter-zoom", Math.min(1, 1 / model.k));
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
    model.k = Math.max(1, Math.min(2.4, old * factor));
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
    host.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0 || event.target.closest("button")) return;
        host.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, [event.clientX, event.clientY]);
        host.classList.add("w-grabbing");
        if (pointers.size === 2) {
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
      pointers.delete(event.pointerId);
      if (!pointers.size) host.classList.remove("w-grabbing");
    }
    host.addEventListener("lostpointercapture", release, options);
    host.addEventListener("pointerup", release, options);
    host.addEventListener("pointercancel", release, options);
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
    host.classList.add("w-with-atlas");
    container.append(territoryAtlas(state, onShop));
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
