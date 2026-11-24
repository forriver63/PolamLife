import { ALLIANCES, TYPES } from "./game.js";
import { icon } from "./icons.js";
import { REGIONS, regionOfShop } from "./regions.js";
import { REGION_LAYOUT } from "./region-layout.js";
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
let memory = { session: null, cameras: {} };

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

function mapLayer(board, state, territories, onLocation, focusId) {
  const claim = lastCapture(state);
  if (territories) board.append(territoryOverlay(state, claim, onLocation));
  addPerson(board, "kit", 78.1, 64.3, "", "w-local-person w-central-walk");
  addPerson(board, "jo", 24.4, 39.8, "", "w-local-person w-park-walk");
  for (const [id, layout] of Object.entries(REGION_LAYOUT)) {
    const area = REGIONS[id];
    const marker = hotspot(area.name, () => onLocation?.(id), "w-place");
    marker.dataset.location = id;
    marker.title = area.name;
    at(marker, ...layout.pin);
    const sign = el("span", "w-place-sign");
    const medallion = el("span", "w-place-icon");
    medallion.append(sprite(id));
    const text = el("span", "w-place-copy");
    text.append(el("strong", "", area.name));
    if (territories && state.player.alliance) {
      const count = controlled(state, area);
      const tally = el(
        "small",
        "w-place-tally",
        count + " / " + area.units.length,
      );
      tally.title = "Shops your alliance controls";
      tally.dataset.locationCount = count;
      const flags = el("span", "w-place-holdings");
      flags.ariaHidden = "true";
      for (const unit of area.units) {
        const flag = el("i", "w-tiny-flag");
        flag.style.setProperty(
          "--w-owner",
          ownerColor(state.shops[unit].owner),
        );
        flags.append(flag);
      }
      flags.append(tally);
      text.append(flags);
    }
    sign.append(medallion, text);
    marker.append(sign, el("span", "w-marker-foot"));
    if (claim && regionOfShop(claim.shopId) === id) {
      marker.dataset.lastClaim = claim.shopId;
      marker.append(el("span", "w-claim-tag", "★ " + claim.shopId.slice(-2)));
      marker.title += " · Latest capture · Unit " + claim.shopId.slice(-2);
    }
    if (focusId && regionOfShop(focusId) === id)
      marker.classList.add("w-return-region");
    board.append(marker);
  }
}

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

function controlled(state, area) {
  return area.units.filter(
    (id) => state.shops[id].owner === state.player.alliance,
  ).length;
}

function territoryOverlay(state, latest, onLocation) {
  const svg = svgNode("svg", {
    viewBox: "0 0 720 540",
    class: "w-commerce-map w-territories",
    role: "group",
    "aria-label": "Illustrative shop influence areas in Po Lam",
  });
  for (const [areaId, { grid, lots }] of Object.entries(REGION_LAYOUT)) {
    const area = svgNode("g", {
      class: "w-parcels",
      "data-map-region": areaId,
    });
    const edges = new Map();
    lots.forEach((row, r) =>
      row.forEach((id, c) => {
        const shop = state.shops[id];
        const points = [
          grid[r][c],
          grid[r][c + 1],
          grid[r + 1][c + 1],
          grid[r + 1][c],
        ];
        const tile = svgNode("polygon", {
          class: "w-domain-fill",
          points: points.join(" "),
          fill: INFLUENCE_INK[shop.owner],
          "data-territory-unit": id,
          "data-owner": shop.owner,
          "data-phase": shop.phase,
        });
        tile.append(
          svgNode(
            "title",
            {},
            [
              "Unit " + id.slice(-2),
              TYPES[shop.type].shopName,
              ownerName(shop.owner),
            ].join(" · "),
          ),
        );
        if (latest?.shopId === id) tile.setAttribute("data-latest-capture", "");
        area.append(tile);
        points.forEach((point, i) => {
          const pair = [String(point), String(points[(i + 1) % points.length])]
            .sort()
            .join(" ");
          if (!edges.has(pair)) edges.set(pair, []);
          edges.get(pair).push(id);
        });
      }),
    );
    for (const [points, units] of edges) {
      const [first, second] = units;
      const kind = !second
        ? "perimeter"
        : state.shops[first].owner === state.shops[second].owner
          ? "internal"
          : "border";
      area.append(
        svgNode("polyline", {
          points,
          class: "w-domain-line",
          "data-edge": kind,
          "data-border-units": units.sort().join(" "),
        }),
      );
    }
    area.addEventListener("click", () => onLocation?.(areaId));
    svg.append(area);
  }
  return svg;
}

function regionHud(state, areaId) {
  if (!state.player.alliance) return null;
  const area = REGIONS[areaId];
  const hud = el("aside", "w-region-hud");
  hud.setAttribute("aria-label", "Shops your alliance controls");
  const held = controlled(state, area);
  const tally = el("strong", "", held + " / " + area.units.length);
  tally.dataset.regionCount = held;
  hud.append(
    factionBadge(state.player.alliance),
    el("span", "", "Ours"),
    tally,
  );
  const latest = state.events.findLast(
    (event) =>
      event.kind === "capture" && regionOfShop(event.shopId) === areaId,
  );
  if (latest) {
    const prior =
      latest.previousOwner ??
      (state.contest?.shopId === latest.shopId
        ? state.contest.previousOwner
        : null);
    const owner = latest.owner ?? state.shops[latest.shopId].owner;
    const change = el("span", "w-recent-gain");
    change.dataset.regionChange = latest.shopId;
    change.append(
      el("b", "", "Unit " + latest.shopId.slice(-2)),
      document.createTextNode(" · "),
    );
    if (prior && FACTIONS[prior])
      change.append(
        el("span", "", FACTIONS[prior].short),
        document.createTextNode(" → "),
      );
    change.append(el("span", "", FACTIONS[owner].short));
    if (prior && prior !== owner && owner === state.player.alliance) {
      const size = area.units.length;
      change.append(
        el(
          "b",
          "w-gain-count",
          held - 1 + "/" + size + " → " + held + "/" + size,
        ),
      );
    }
    hud.append(change);
  }
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
    el("b", "", player ? FACTIONS[player].short : "Digital Po Lam"),
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
      "Select a landmark to explore its shops. Colors show each shop’s influence.",
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

function localDoor(shop, point, onShop) {
  const name = TYPES[shop.type].shopName;
  const status = phaseText(shop);
  const door = hotspot(
    ["Unit " + shop.id.slice(-2), name, ownerName(shop.owner), status].join(
      " · ",
    ),
    () => onShop?.(shop.id),
    "w-local-door",
  );
  door.style.setProperty("--w-door-x", point[0] + "%");
  door.style.setProperty("--w-door-y", point[1] + "%");
  Object.assign(door.dataset, {
    shop: shop.id,
    type: shop.type,
    owner: shop.owner,
    phase: shop.phase,
  });
  door.style.setProperty("--w-owner", ownerColor(shop.owner));
  const art = el("img", "w-local-front");
  art.src =
    "assets/world/front-" +
    (isShut(shop) ? "regional-shutter" : shop.type) +
    ".webp";
  art.alt = "";
  art.width = 250;
  art.height = 140;
  art.draggable = false;
  const sign = el("span", "w-local-sign");
  sign.append(el("b", "", shop.id.slice(-2)), el("strong", "", name));
  const flag = el("span", "w-local-flag");
  flag.append(
    factionBadge(shop.owner),
    el("span", "", FACTIONS[shop.owner].short),
  );
  const caption = el("span", "w-local-caption");
  caption.append(sign, flag);
  if (shop.phase !== "open")
    caption.append(el("span", "w-local-status", status));
  door.append(art, caption);
  if (shop.decorated) door.append(bunting(ownerColor(shop.owner)));
  return door;
}

function mallLayer(board, state, areaId, territories, onShop, focusId) {
  const ids = REGIONS[areaId].units;
  const points = REGION_LAYOUT[areaId].doors;
  if (areaId !== "central") {
    ids.forEach((id, i) => {
      const door = localDoor(state.shops[id], points[i], onShop);
      const [x, y] = REGION_LAYOUT[areaId].portraitDoors[i];
      door.style.setProperty("--w-portrait-x", x + "%");
      door.style.setProperty("--w-portrait-y", y + "%");
      if (i === 1) door.classList.add("w-rear-stall");
      if (id === focusId) door.setAttribute("aria-current", "true");
      board.append(door);
    });
    return;
  }
  for (const [i, id] of ids.entries()) {
    const [x, y] = points[i];
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
    button.dataset.type = shop.type;
    button.dataset.owner = shop.owner;
    if (id === focusId) button.setAttribute("aria-current", "true");
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

// All hotspot positions are measured on the artwork. A scene keeps its own
// camera so returning from an interior restores the same group of storefronts.
function configureCamera(host, board, img, interactive, scene, areaId) {
  const key = scene === "mall" ? areaId : scene;
  const model = memory.cameras[key]
    ? { ...memory.cameras[key] }
    : { k: 1, x: 0, y: 0 };
  let w = 1,
    h = 1,
    vw = 1,
    vh = 1,
    minimumZoom = 1;
  function draw() {
    const limitX = Math.max(0, (w * model.k - vw) / 2);
    const limitY = Math.max(0, (h * model.k - vh) / 2);
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
    board.style.setProperty("--w-counter-zoom", 1 / model.k);
    if (interactive)
      memory.cameras[key] = { ...model, frameWidth: vw, frameHeight: vh };
  }
  function reset() {
    model.k = 1;
    model.x = scene === "map" && vw < 600 ? w * 0.045 : 0;
    model.y = 0;
    draw();
  }
  function fit() {
    vw = host.clientWidth || 1;
    vh = host.clientHeight || 1;
    const ratio =
      img.naturalWidth && img.naturalHeight
        ? img.naturalWidth / img.naturalHeight
        : scene === "map"
          ? 4 / 3
          : scene === "mall"
            ? 12 / 7
            : 16 / 9;
    const compact = vw < 600;
    const portrait =
      scene === "mall" && areaId !== "central" && compact && vh > vw;
    host.classList.toggle("w-compact", compact);
    host.classList.toggle("w-portrait-region", portrait);
    if (scene === "map") {
      // Fit the full spread of landmark signs on a phone at the default zoom.
      w = Math.min(compact ? vw * 1.16 : vw - 12, (vh - 14) * ratio);
    } else if (scene === "mall") {
      w = Math.min(compact ? vw * 1.08 : vw, vh * ratio);
    } else {
      w = Math.max(vw, vh * ratio);
    }
    h = w / ratio;
    if (portrait) {
      w = vw;
      h = vh;
    }
    minimumZoom = Math.min(1, vw / w, vh / h);
    board.style.width = w + "px";
    board.style.height = h + "px";
    const lastView = memory.cameras[key];
    if (!lastView || lastView.frameWidth !== vw || lastView.frameHeight !== vh)
      reset();
    else draw();
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
    mapShopId = null,
    areaId = "central",
  },
) {
  mapViews.get(container)?.();
  if (memory.session !== state.sessionId)
    memory = { session: state.sessionId, cameras: {} };
  const shop = state.shops[shopId] || state.shops.unit01;
  if (!Object.hasOwn(REGIONS, areaId)) areaId = "central";
  const area = REGIONS[areaId];
  const host = el("div", "w-scene w-" + scene);
  if (scene === "mall") host.dataset.region = areaId;
  if (scene === "shop") host.dataset.unit = shop.id;
  host.setAttribute("role", "region");
  const titles = {
    map: "Interactive map of Po Lam",
    mall: areaId === "central" ? "MCP Central shopping arcade" : area.name,
    shop: TYPES[shop.type].shopName + " interior",
  };
  host.setAttribute("aria-label", titles[scene]);
  const movable = scene !== "shop";
  if (movable) host.tabIndex = 0;
  const board = el("div", "w-board");
  const img = el("img", "w-art");
  img.draggable = false;
  if (scene === "map") {
    img.alt =
      "An illustrated aerial view of Po Lam’s malls, station, tower blocks and park.";
    img.src = "assets/map.webp";
    board.append(img);
    mapLayer(board, state, territories, onLocation, mapShopId);
    if (territories) host.classList.add("w-influence-on");
  } else if (scene === "mall") {
    img.alt =
      areaId === "central"
        ? "A two-storey shopping arcade around the central atrium."
        : area.name;
    img.src =
      areaId === "central"
        ? "assets/mall.webp"
        : "assets/regions/" + areaId + ".webp";
    host.style.setProperty(
      "--w-portrait-crop",
      REGION_LAYOUT[areaId].portraitCrop || "50%",
    );
    host.style.setProperty("--w-scene-art", "url('" + img.src + "')");
    board.append(img);
    mallLayer(board, state, areaId, territories, onShop, mapShopId);
  } else {
    img.alt = isShut(shop)
      ? "A closed shop being prepared for its next tenant."
      : TYPES[shop.type].name + " with its stock and furnishings.";
    img.src =
      "assets/interiors/" + (isShut(shop) ? "renovating" : shop.type) + ".webp";
    board.append(img);
    shopLayer(board, state, shop);
  }
  host.append(board);
  container.replaceChildren(host);
  if (scene === "map" && territories) host.append(territoryKey(state));
  if (scene === "mall") {
    const hud = regionHud(state, areaId);
    if (hud) host.append(hud);
  }
  const camera = configureCamera(host, board, img, movable, scene, areaId);
  if (movable) addControls(host, camera);
  const clean = () => {
    camera.dispose();
    host.remove();
    if (mapViews.get(container) === clean) mapViews.delete(container);
  };
  mapViews.set(container, clean);
  return clean;
}
