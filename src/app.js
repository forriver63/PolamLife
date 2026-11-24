import { installLanguage, languageButton } from "./i18n.js";
import {
  createGame,
  reduce,
  recommend,
  uniqueId,
  memberChoice,
  TYPES,
  ALLIANCES,
  RULES,
} from "./game.js";
import { initialView, readSave } from "./save.js";
import { districtFocusShop, mountWorld } from "./world.js";
import { icon } from "./icons.js";
import { mountRound } from "./rounds.js";
import { daily, insights, allianceProfile, director } from "./community.js";

const key = "polamlife.fieldguide.v1";
const root = document.querySelector("#game");
const areas = {
  central: [
    "MCP Central",
    "新都城中心二期",
    "Step through the glass atrium to explore six alliance-run shops.",
  ],
  station: [
    "Po Lam Station",
    "寶琳站",
    "The terminus of the Tseung Kwan O line. A covered walkway leads to MCP Central.",
  ],
  estate: [
    "Po Lam Estate",
    "寶林邨",
    "Residential towers rise around the footpaths of this hillside estate.",
  ],
  park: [
    "Po Tsui Park",
    "寶翠公園",
    "Beyond the football pitches, a tree-lined path leads back to the mall.",
  ],
  discovery: [
    "MCP Discovery",
    "新都城中心三期",
    "Across the road from Central, footbridges tie the neighborhood together.",
  ],
  one: [
    "MCP ONE",
    "新都城中心一期",
    "The southern mall anchors this end of the district.",
  ],
};
const teamIcons = { trend: "bolt", comfort: "flower", collective: "leaf" };
const phaseNames = {
  open: "Open for business",
  contested: "Contest in progress",
  captured: "Captured · shutters down",
  voting: "Alliance ballot open",
  renovating: "Under renovation",
  reopened: "Grand opening",
};
let lastSnapshot = null;
const load = () => {
  try {
    lastSnapshot = localStorage.getItem(key);
    return readSave(lastSnapshot, areas);
  } catch {
    return { status: "unavailable" };
  }
};
const saved = load();
let state = saved.state ?? createGame();
let view = saved.view ?? initialView();
let protectSave = saved.status === "unreadable";
let saveChangedElsewhere = false;
let modal = protectSave ? "recovery" : "",
  picks = [],
  selectedTeam = "",
  worldCleanup,
  roundCleanup,
  noticeTimer,
  botTimer,
  botInvite = false,
  roundMode = "",
  saveError = protectSave || saved.status === "unavailable",
  audioCtx = null,
  gameResult = null,
  menuSnapshot = null;
const team = () => ALLIANCES[state.player.alliance];
const shop = () => state.shops[view.shopId];
const owner = (s) => ALLIANCES[s.owner]?.name ?? "Arcade Guild";
const target = () => state.shops[state.contest?.shopId || "unit01"];
const unit = (s) => "Unit " + s.id.slice(-2);
const btn = (action, label, kind = "primary", glyph = "arrow", extra = "") =>
  `<button class="btn ${kind}" data-do="${action}" ${extra}>${label}${glyph ? icon(glyph, 18) : ""}</button>`;
const noun = (type) => TYPES[type]?.shopName ?? "Shop";
const sprite = (name, cls = "") =>
  `<img class="sprite ${cls}" alt="" src="assets/world/${name}.png">`;
const itemArt = (t) =>
  `<img class="item-art" alt="" src="assets/items/${t}.webp" onerror="this.onerror=null;this.src='assets/world/${t}.png'">`;
const eyebrow = (s) => `<div class="eyebrow">${s}</div>`;
function reportSaveConflict() {
  if (saveChangedElsewhere) return;
  saveChangedElsewhere = true;
  saveError = true;
  clearTimeout(botTimer);
  botInvite = false;
  // A conflict can be detected during an action. Show the notice after its UI has settled.
  queueMicrotask(() => {
    modal = "saveConflict";
    render();
  });
}
function persist() {
  if (protectSave || saveChangedElsewhere) return;
  try {
    if (localStorage.getItem(key) !== lastSnapshot) {
      reportSaveConflict();
      return;
    }
    const snapshot = JSON.stringify({ state, view });
    localStorage.setItem(key, snapshot);
    lastSnapshot = snapshot;
    saveError = false;
  } catch {
    saveError = true;
  }
}
function act(type, args = {}) {
  const next = reduce(state, { type, ...args });
  if (next === state) return false;
  state = next;
  persist();
  return true;
}
function sound(f = 390) {
  if (!view.sound) return;
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    let o = audioCtx.createOscillator(),
      g = audioCtx.createGain(),
      t = audioCtx.currentTime;
    o.type = "sine";
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.06);
    g.gain.setValueAtTime(0.035, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(t + 0.11);
  } catch {}
}
function toast(msg) {
  const el = document.querySelector("#announcer");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function go(scene, id) {
  if ((scene === "shop" || id != null) && !Object.hasOwn(state.shops, id))
    return;
  modal = "";
  view.scene = scene;
  view.loc = null;
  view.mapShopId = id ?? null;
  if (scene !== "map") view.started = true;
  if (scene === "shop") {
    view.shopId = id;
    act("VISIT", { shopId: id });
  } else persist();
  render();
}
function start() {
  view.started = true;
  go("shop", "unit01");
}
function openModal(name) {
  if (modal === "round") return;
  modal = name;
  renderDialog();
}
function closeModal() {
  if (modal === "round") {
    modal = "";
    render();
    toast("Round closed.");
    return;
  }
  modal = "";
  renderDialog();
}
function card(kicker, title, desc, actions, extra = "", cls = "") {
  return `<article class="field-card ${cls}"><div class="card-kicker">${icon("flag", 13)} ${kicker}</div><div class="card-inner"><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}${extra}<div class="card-actions">${actions}</div></div></article>`;
}
function sceneCard() {
  const s = shop(),
    focusedShop = view.scene === "map" ? state.shops[view.mapShopId] : null,
    t = focusedShop || districtFocusShop(state),
    joined = !!team();
  const allOwned =
    joined &&
    Object.values(state.shops).every(
      (store) =>
        store.owner === state.player.alliance &&
        ["open", "reopened"].includes(store.phase),
    );
  if (
    allOwned &&
    ((view.scene === "map" && !view.loc && !focusedShop) ||
      view.scene === "mall")
  )
    return card(
      "MCP CENTRAL · SIX ALLIANCE SHOPS",
      "The mall is yours",
      "Your crew runs every counter. Read the district paper, visit a shop or start a fresh neighborhood.",
      btn("daily", "Read the Daily", "primary", "paper") +
        btn("confirmReset", "New game", "link", "reset"),
    );
  if (!view.started && !view.loc && !focusedShop)
    return card(
      "NEIGHBORHOOD FIELD GUIDE",
      "Welcome to<br><em>Po Lam.</em>",
      "Which shops belong on your walk home? Join an alliance and reshape your corner of Hong Kong.",
      btn("start", "Enter Po Lam"),
      "",
      "welcome",
    );
  if (view.scene === "map") {
    if (view.loc) {
      const a = areas[view.loc];
      return card(
        "DISTRICT LANDMARK · " + a[1],
        a[0],
        a[2],
        btn(
          "mall",
          view.loc === "central" ? "Enter the mall" : "Visit MCP Central",
        ),
        view.loc === "central" && t.phase === "reopened"
          ? `<div class="small-chip">${icon("star", 14)} Just opened · ${noun(state.shops[state.history.at(-1).shopId].type)}</div>`
          : "",
      );
    }
    if (!view.started) return "";
    if (focusedShop) {
      const nextAction = {
        captured: ["propose", "Open alliance ballot", "primary", "paper"],
        voting: ["voting", "View alliance ballot", "primary", "paper"],
        renovating: ["advance", "Advance to next day", "primary", "next"],
      }[t.phase];
      const returnButton = btn("focusShop", "Return to " + unit(t), "secondary", "shop");
      // A street marker frames three doors. Only offer a shortcut back to
      // a door the player actually visited, or to the current refit.
      if (!nextAction)
        return t.id === view.shopId && state.visits[t.id] > 0 ? returnButton : "";
      return card(
        unit(t).toUpperCase() + " · " + phaseNames[t.phase].toUpperCase(),
        noun(t.type),
        "Held by " + owner(t),
        btn(...nextAction) + returnButton,
        "",
        "compact",
      );
    }
    if (["contested", "captured", "voting", "renovating"].includes(t.phase)) {
      const copy = {
        contested: "Your crew has challenged " + noun(t.type) + ".",
        captured:
          owner(t) +
          " now holds " +
          unit(t) +
          ". Your crew can vote on a new tenant.",
        voting:
          "Your alliance is choosing the next tenant for " + unit(t) + ".",
        renovating:
          noun(state.renovation?.toType) +
          " opens here on Day " +
          state.renovation?.readyDay +
          ".",
      };
      return card(
        "MCP CENTRAL · " + unit(t).toUpperCase(),
        phaseNames[t.phase],
        copy[t.phase],
        btn("focusShop", "Return to " + unit(t), "primary", "shop"),
        "",
        "compact",
      );
    }
    return card(
      joined ? "ALLIANCE FIELD GUIDE" : "FIRST VISIT",
      state.history.length
        ? "A new day in Po Lam"
        : joined
          ? "Choose a shopping street"
          : "A stop before class",
      state.history.length
        ? noun(state.history.at(-1).toType) +
            " opened in the former home of " +
            noun(state.history.at(-1).fromType) +
            "."
        : joined
          ? "Tap a street sign to see its three shops. Glaze Lane is on Station Walk."
          : "A donut counter sits along the station walkway. Take a look inside.",
      btn("mall", "Explore MCP Central", joined ? "secondary" : "primary"),
      joined
        ? `<span class="team-tag">${icon(teamIcons[state.player.alliance], 14)} ${team().name}</span>`
        : "",
      "compact",
    );
  }
  if (view.scene === "mall")
    return card(
      "MCP CENTRAL · SIX STOREFRONTS",
      "Central Atrium",
      "Select a shop on either level.",
      btn("focusShop", "Visit " + noun(t.type)),
      "",
      "compact mall-card",
    );
  if (!joined)
    return card(
      "YOUR FIRST STOP · " + unit(s).toUpperCase(),
      noun(s.type),
      "A donut on the way to class? Maybe you’d rather have milk tea. Pick the stops you wish were here.",
      btn("prefs", "Choose your favorites") +
        btn("returnToStreet", "Back to shopping street", "link", "map"),
    );
  let desc = "",
    actions = "",
    caption = unit(s).toUpperCase() + " · " + phaseNames[s.phase].toUpperCase(),
    title = noun(s.type);
  if (s.phase === "contested") {
    title = "Counter challenge";
    desc = `${state.contest.participants.length} of ${RULES.minParticipants} crew members are here. ${state.contest.wonRush ? "The rush is cleared. Rally the rest of your crew." : "Rally your crew and clear the order queue to claim this counter."}`;
    actions = btn("contest", "Open challenge", "primary", "flag");
  } else if (s.phase === "captured") {
    title = "Territory secured!";
    desc =
      owner(s) +
      " captured the counter. The shutters are down while your crew decides what comes next.";
    actions =
      btn("propose", "Open alliance ballot", "primary", "paper") +
      btn("territoryMap", "View territory change", "link", "map");
  } else if (s.phase === "voting") {
    desc = "Members are choosing the next shop for this unit.";
    actions = btn("voting", "View alliance ballot", "primary", "paper");
  } else if (s.phase === "renovating") {
    title = "Under renovation";
    desc = `${noun(state.renovation.toType)} is moving in. Opens on Day ${state.renovation.readyDay}. Fast-forward the demo clock to see the new counter.`;
    actions = btn("advance", "Advance to next day", "primary", "next");
  } else if (s.owner === state.player.alliance) {
    desc =
      s.phase === "reopened"
        ? "The new sign is up. Your crew chose this counter together. Step in and serve the first customers."
        : "Your alliance holds this shop. Help the counter staff keep it running.";
    actions =
      btn("manage", "Help manage", "primary", "shop") +
      (s.phase === "reopened"
        ? btn("daily", "Read today’s paper", "link", "paper")
        : "");
  } else {
    desc =
      "Scout the counter, bring two allies and take on the shop rush to win this spot.";
    actions = btn("scout", "Scout this shop", "primary", "compass");
  }
  return card(
    caption,
    title,
    desc,
    actions +
      (s.phase === "captured"
        ? ""
        : btn("returnToStreet", "Back to shopping street", "link", "map")),
    `<span class="team-tag">${icon(teamIcons[s.owner] || "flag", 14)} ${owner(s)}</span>`,
    s.phase === "reopened" ? "opening-card" : "compact",
  );
}
function nav(id, label, glyph, active = false) {
  return `<button class="rail-btn ${active ? "active" : ""}" data-do="${id}" title="${label}">${icon(glyph, 23)}<span>${label}</span></button>`;
}
function render() {
  worldCleanup?.();
  worldCleanup = null;
  roundCleanup?.();
  roundCleanup = null;
  const map = view.scene === "map",
    mall = view.scene === "mall";
  const location = map
    ? "Po Lam District"
    : mall
      ? "MCP Central"
      : noun(shop().type);
  root.innerHTML = `<header class="mast"><div class="brand"><img class="series-mark" src="assets/agentopia-logo.png" alt="Agentopia" width="616" height="262"><span class="game-title" translate="no">PolamLife</span></div><div class="mast-right"><span class="online"><i></i> LOCAL WORLD</span><i class="mast-rule"></i><span class="day">${icon("sun", 19)} Day ${String(state.day).padStart(2, "0")}</span>${languageButton()}<button class="top-icon" data-do="sound" title="Turn sound ${view.sound ? "off" : "on"}" aria-label="Turn sound ${view.sound ? "off" : "on"}">${icon(view.sound ? "sound" : "mute", 19)}</button><button class="top-icon" data-do="settings" aria-label="Settings" title="Settings">${icon("settings", 19)}</button></div></header>
 <div class="game-body"><nav class="rail" aria-label="Field guide">${nav("map", "World", "map", true)}${nav("alliance", "Alliance", "flag")}${nav("daily", "Daily", "paper")}${nav("insights", "Insights", "chart")}<div class="rail-bottom">${nav("help", "Guide", "book")}<span class="rail-avatar" title="Your resident">${sprite("player")}</span></div></nav>
 <main class="viewport"><div id="world"></div><div class="world-top"><div class="district-tag"><span class="tag-symbol">${icon(map ? "map" : mall ? "shop" : "pin", 22)}</span><span><small>${map ? "DISTRICT MAP" : mall ? "SHOPPING MALL" : unit(shop()).toUpperCase() + " · INTERIOR"}</small><strong>${map ? "Digital Po Lam" : location}</strong></span></div>${map ? `<button class="layer-btn ${view.territories ? "on" : ""}" data-do="layers" aria-pressed="${view.territories}">${icon("layers", 16)} Territories <i></i></button>` : `<button class="layer-btn" data-do="${mall ? "map" : "mall"}">${icon("back", 16)} ${mall ? "District map" : "Mall atrium"}</button>`}</div>
 <section class="scene-card" aria-label="Current objective">${sceneCard()}</section><div id="effects" aria-hidden="true"></div></main></div>
 <footer class="statusbar"><span class="district-code"><i></i> PL / ${map ? "DISTRICT 01" : mall ? "MCP CENTRAL" : unit(shop()).toUpperCase()}</span><span class="foot-location">${icon("pin", 13)} ${map ? "Tseung Kwan O, Hong Kong" : "Po Lam · " + location}</span><span class="foot-tip">${icon(map ? "move" : "cursor", 13)} ${map ? "Drag to pan · Scroll to zoom" : mall ? "Select a storefront" : "Shop interior"}</span><span class="save-status">${icon("check", 13)} ${saveError ? "Session only" : "Local save"}</span></footer><div id="overlay"></div>`;
  const worldElement = document.querySelector("#world");
  worldCleanup = mountWorld(worldElement, {
    state,
    scene: view.scene,
    shopId: view.shopId,
    territories: view.territories,
    mapShopId: view.mapShopId,
    onMapShopFocus: (id) => {
      if (
        !worldElement.isConnected ||
        modal ||
        view.scene !== "map" ||
        (id !== null && !Object.hasOwn(state.shops, id))
      )
        return;
      if (view.mapShopId === id && !view.loc) return;
      view.mapShopId = id;
      view.loc = null;
      if (id !== null) view.started = true;
      persist();
      document.querySelector(".scene-card").innerHTML = sceneCard();
    },
    onLocation: (id) => {
      if (!worldElement.isConnected || modal || !Object.hasOwn(areas, id))
        return;
      view.loc = id;
      view.mapShopId = null;
      sound();
      persist();
      document.querySelector(".scene-card").innerHTML = sceneCard();
    },
    onShop: (id) => {
      if (
        !worldElement.isConnected ||
        modal ||
        view.scene === "shop" ||
        !Object.hasOwn(state.shops, id)
      )
        return;
      sound();
      go("shop", id);
    },
  });
  renderDialog();
}
function dialog(title, kicker, body, cls = "") {
  return `<div class="scrim"><section class="dialog ${cls}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header class="dialog-head"><div>${eyebrow(kicker)}<h2 id="dialog-title">${title}</h2></div>${languageButton()}<button class="circle-x" data-do="close" aria-label="Close">${icon("close")}</button></header><div class="dialog-content">${body}</div></section></div>`;
}
function quiz() {
  const ids = ["tea", "game", "hotpot", "cafe", "sushi", "donut", "market"];
  return dialog(
    "What belongs in Po Lam?",
    "YOUR NEIGHBORHOOD BALLOT",
    `<p class="lead">Pick three stops you’d love to find on your walk home, in order of preference.</p><div class="choice-grid">${ids.map((id) => `<button data-choice="${id}" aria-pressed="${picks.includes(id)}" class="choice ${picks.includes(id) ? "picked" : ""}">${itemArt(id)}<strong>${TYPES[id].name}</strong><i>${picks.includes(id) ? picks.indexOf(id) + 1 : "+"}</i></button>`).join("")}</div><div class="dialog-foot"><b class="mono">${picks.length} / 3 selected</b>${btn("match", "Find my alliance", "primary", "arrow", picks.length !== 3 ? "disabled" : "")}</div>`,
    "wide",
  );
}
function teams() {
  const rec = recommend(state.player.preferences);
  return dialog(
    "Find your people",
    "ALLIANCE MATCH",
    `<p class="lead">Your picks · ${state.player.preferences.map((i) => TYPES[i].name).join(" / ")}</p><div class="team-options">${[
      rec,
      ...Object.keys(ALLIANCES).filter((i) => i !== rec),
    ]
      .map((id) => {
        const a = ALLIANCES[id];
        return `<button data-team="${id}" aria-pressed="${selectedTeam === id}" class="team-option ${selectedTeam === id ? "picked" : ""}"><i class="team-emblem" style="--team:${a.color}">${icon(teamIcons[id], 28)}</i><span>${id === rec ? eyebrow("YOUR CLOSEST MATCH") : ""}<strong>${a.name}</strong><small>${a.description}</small></span>${icon(selectedTeam === id ? "check" : "flag", 18)}</button>`;
      })
      .join(
        "",
      )}</div><div class="dialog-foot"><span>2 simulated allies in each crew</span>${btn("join", "Join alliance", "primary", "flag")}</div>`,
  );
}
function contestPanel() {
  const c = state.contest;
  if (!c || c.status !== "active") return "";
  const ready = c.participants.length >= RULES.minParticipants;
  return dialog(
    "Rally at the counter",
    "TERRITORY CHALLENGE · " + unit(target()).toUpperCase(),
    `<div class="challenge-banner">${sprite(target().type)}<div>${eyebrow("CHALLENGE TARGET")}<h3>${noun(target().type)}</h3><span>Held by ${owner(target())}</span></div></div><div class="line-title"><b>Challenge crew</b><span class="mono">${c.participants.length} / ${RULES.minParticipants} HERE</span></div><div class="crew">${[{ id: "player", name: "You", role: "Counter lead" }, ...team().members].map((m, i) => `<div class="crew-row">${sprite(["player", "mei", "kit"][i])}<span><b>${m.name}</b><small>${m.role}${i ? " · simulated" : ""}</small></span><em>${c.participants.includes(m.id) ? "At the counter" : botInvite ? "On the way" : "Awaiting invite"}</em></div>`).join("")}</div><p class="lead">${c.wonRush ? "Orders cleared. Your allies must arrive to claim the unit." : "Match the orders before time runs out. Your crew needs three distinct members to take over."}</p><div class="dialog-foot">${!ready ? btn("invite", botInvite ? "Crew on the way…" : "Invite allies", "secondary", "people", botInvite ? "disabled" : "") : `<span class="team-tag">${icon("check", 16)} Crew assembled</span>`}${!c.wonRush ? btn("rush", "Play shop rush", "primary", "game") : ""}</div>`,
  );
}
function voting() {
  const p = state.proposal;
  if (!p) return "";
  const votes = Object.values(p.votes),
    mine = p.votes.player;
  const favorites = team()
    .members.map(
      (member) =>
        member.name +
        " favors " +
        TYPES[memberChoice(member.id, p.options)].name,
    )
    .join(". ");
  return dialog(
    "What opens here next?",
    "ALLIANCE BALLOT · " + unit(target()).toUpperCase(),
    `<p class="lead">${favorites}. ${RULES.tieBreak}</p><div class="ballot-grid">${p.options.map((id) => `<button class="ballot-option ${mine === id ? "picked" : ""}" data-vote="${id}" ${mine ? "disabled" : ""}><div>${itemArt(id)}</div><strong>${TYPES[id].name}</strong><span>${votes.filter((v) => v === id).length} votes</span></button>`).join("")}</div><div class="vote-progress">${p.eligible.map((id) => `<span class="${p.votes[id] ? "done" : ""}">${icon(p.votes[id] ? "check" : "clock", 14)} ${id === state.player.id ? "You" : team().members.find((x) => x.id === id).name}</span>`).join("")}</div><div class="dialog-foot"><span class="mono">${votes.length} / ${p.eligible.length} BALLOTS</span>${votes.length === p.eligible.length ? btn("count", "Count the votes", "primary", "check") : `<small>${mine ? "Simulated allies are voting…" : "Select a shop to cast your vote"}</small>`}</div>`,
  );
}
function manage() {
  const s = shop();
  const nextAlly = team().members.find((m) => !s.staff?.includes(m.id));
  return dialog(
    noun(s.type),
    "ALLIANCE SHOP · " + unit(s).toUpperCase(),
    `<p class="lead">${owner(s)} holds this shop. Defense ${s.defense} / ${RULES.maxDefense}.</p><div class="action-stack">${btn("rush", "Help manage · Shop Rush", "secondary", "bag")}${btn("emergency", "Solve emergency · Service Relay", "secondary", "bolt")}${btn("staff", nextAlly ? "Invite " + nextAlly.name + " to defend" : "Full defense crew on duty", "secondary", "people", nextAlly ? "" : "disabled")}${btn("decorate", s.decorated ? "Pennants installed" : "Hang alliance pennants", "secondary", "flag", s.decorated ? "disabled" : "")}</div>`,
  );
}
function settings() {
  return dialog(
    "Field settings",
    "PAUSE MENU",
    `<div class="action-stack">${btn("resume", "Continue game", "primary", "arrow")}${saveChangedElsewhere ? btn("reloadSave", "Load latest save", "secondary", "reset") : ""}${btn("confirmReset", "New game / Reset demo", "secondary", "reset")}${btn("director", "Demo Director", "secondary", "settings")}</div>`,
  );
}
function renderDialog() {
  const el = document.querySelector("#overlay");
  if (!el) return;
  const before = document.activeElement;
  const sameFocus = el.contains(before)
    ? ["do", "choice", "vote", "team"]
        .map((k) => (before.dataset?.[k] ? [k, before.dataset[k]] : null))
        .find(Boolean)
    : null;
  if (modal === "round" && roundCleanup) return;
  if (!modal) {
    el.innerHTML = "";
    root.querySelector(".game-body").inert = false;
    root.querySelector(".mast").inert = false;
    if (menuSnapshot?.isConnected) menuSnapshot.focus({ preventScroll: true });
    menuSnapshot = null;
    return;
  }
  if (!el.firstChild) menuSnapshot = before;
  const d = dialog;
  let contents;
  switch (modal) {
    case "prefs":
      contents = quiz();
      break;
    case "teams":
      contents = teams();
      break;
    case "contest":
      contents = contestPanel();
      break;
    case "voting":
      contents = voting();
      break;
    case "manage":
      contents = manage();
      break;
    case "scout":
      contents = d(
        "Scout report",
        "MCP CENTRAL · " + unit(shop()).toUpperCase(),
        `<div class="scout-art" style="background-image:url('assets/interiors/${shop().type}.webp')"></div><h3>${noun(shop().type)}</h3><p>Held by ${owner(shop())}. Defense ${shop().defense} / ${RULES.maxDefense}. Win a timed shop rush with ${RULES.minParticipants} distinct crew members to take control.</p>${btn("challenge", "Launch a challenge", "primary", "flag")}`,
      );
      break;
    case "alliance":
      contents = d(
        team() ? "Your alliance" : "Find an alliance",
        "CREW REGISTER",
        team()
          ? allianceProfile(state)
          : `<p class="lead">Pick your favorite community stops to meet a crew with a similar vision.</p>${btn("prefs", "Choose your favorites")}`,
      );
      break;
    case "daily":
      contents = d(
        "Po Lam Daily",
        "COMMUNITY EDITION · DAY " + String(state.day).padStart(2, "0"),
        daily(state),
        "wide",
      );
      break;
    case "insights":
      contents = d(
        "Merchant insights",
        "COMMUNITY FIELD NOTES",
        insights(state),
        "wide",
      );
      break;
    case "settings":
      contents = settings();
      break;
    case "saveConflict":
      contents = d(
        "Your world changed in another tab",
        "LOCAL SAVE",
        '<p class="lead">Saving is paused in this tab. Load the latest world to continue from the saved progress.</p><div class="dialog-foot">' +
          btn("close", "Play without saving", "secondary", "arrow") +
          btn("reloadSave", "Load latest save", "primary", "reset") +
          "</div>",
      );
      break;
    case "recovery":
      contents = d(
        "This save could not be opened",
        "LOCAL SAVE",
        '<p class="lead">Your saved world is still on this device. You can play a temporary game or replace the save with a new Day 01 world.</p><div class="dialog-foot">' +
          btn("close", "Play without saving", "secondary", "arrow") +
          btn("reset", "Replace save", "primary", "reset") +
          "</div>",
      );
      break;
    case "confirmGuided":
      contents = d(
        "Restart the guided route?",
        "DEMO DIRECTOR",
        '<p>The guided route starts a new local game at Glaze Lane.</p><div class="dialog-foot">' +
          btn("director", "Cancel", "secondary", "back") +
          btn("guidedStart", "Restart guided demo") +
          "</div>",
      );
      break;
    case "director":
      contents = d("Demo Director", "PRESENTATION CONTROLS", director(state));
      break;
    case "confirmReset":
      contents = d(
        "Start a new neighborhood?",
        "RESET DEMO",
        `<p class="lead">This clears your local alliance, ballots and renovations. You will return to Day 01.</p><div class="dialog-foot">${btn("settings", "Keep playing", "secondary", "back")}${btn("reset", "Reset demo", "primary", "reset")}</div>`,
      );
      break;
    case "help":
      contents = d(
        "Your field guide",
        "HOW TO PLAY",
        `<ol class="steps"><li><b>Find your crew</b>Choose three shop preferences and join an alliance.</li><li><b>Take the counter</b>Visit Glaze Lane at MCP Central. Invite two allies and clear the rush.</li><li><b>Choose the next shop</b>Cast your ballot, count the votes and advance a day to see the new storefront.</li></ol>${btn("close", "Back to the district")}`,
      );
      break;
    case "round":
      contents = d(
        roundMode === "rush" ? "Shop Rush" : "Service Relay",
        "AT THE COUNTER · " + noun(shop().type).toUpperCase(),
        '<div id="round"></div>',
        "round-dialog",
      );
      break;
    case "outcome":
      contents = d(
        gameResult.title,
        gameResult.kicker,
        `<div class="result-hero">${icon(gameResult.won ? "trophy" : "flag", 54)}</div><p class="lead">${gameResult.msg}</p>${btn(gameResult.next, gameResult.cta)}${gameResult.next === "propose" ? btn("territoryMap", "View territory change", "link", "map") : ""}`,
        gameResult.won ? "win" : "",
      );
      break;
  }
  el.innerHTML = contents || "";
  root.querySelector(".game-body").inert = !!contents;
  root.querySelector(".mast").inert = !!contents;
  if (el.firstChild) {
    const nextFocus = sameFocus
      ? el.querySelector("[data-" + sameFocus[0] + '="' + sameFocus[1] + '"]')
      : null;
    (nextFocus && !nextFocus.disabled
      ? nextFocus
      : el.querySelector(".circle-x")
    )?.focus({ preventScroll: true });
  }
  if (modal === "round") {
    const s = shop(),
      sid = state.sessionId,
      cid = s.phase === "contested" ? state.contest.id : null,
      rid = uniqueId("round"),
      game = roundMode;
    roundCleanup = mountRound(document.querySelector("#round"), {
      game,
      shop: s,
      sessionId: sid,
      sound: view.sound,
      crewSupport: () => {
        const members = cid
          ? state.contest?.participants
          : state.shops[s.id].staff;
        return team().members.filter((member) => members?.includes(member.id));
      },
      onFinish: (success) =>
        act("RESULT", {
          success,
          roundId: rid,
          sessionId: sid,
          shopId: s.id,
          game,
          contestId: cid,
        }),
      onReport: (success) => {
        if (
          state.sessionId !== sid ||
          !state.results.some((r) => r.roundId === rid)
        )
          return;
        sound(success ? 650 : 210);
        const captured = shop().phase === "captured",
          cont = shop().phase === "contested",
          defended =
            state.contest?.status === "defended" &&
            shop().owner !== state.player.alliance;
        gameResult = {
          won: success,
          kicker: captured
            ? "ALLIANCE TAKEOVER"
            : defended
              ? "DEFENSE HOLDS"
              : "SHIFT REPORT",
          title: captured
            ? "Territory secured!"
            : defended
              ? "The shop held on"
              : success
                ? "Shift complete!"
                : "Shift ended",
          msg: captured
            ? "Your crew has claimed " +
              noun(s.type) +
              ". The old counter is closed. Your crew can now vote on its replacement."
            : defended
              ? "The defending crew kept the counter. Scout the shop to launch a fresh challenge."
              : cont
                ? "The rush is clear. Rally the rest of your crew to finish the takeover."
                : "The counter has a defense rating of " +
                  shop().defense +
                  " / " +
                  RULES.maxDefense +
                  ".",
          next: captured ? "propose" : cont ? "contest" : "close",
          cta: captured
            ? "Open alliance ballot"
            : cont
              ? "Rally the crew"
              : "Return to shop",
        };
        modal = "outcome";
        render();
      },
    });
  }
}
function reset() {
  clearTimeout(botTimer);
  botInvite = false;
  roundCleanup?.();
  roundCleanup = null;
  state = createGame();
  protectSave = false;
  view = initialView();
  picks = [];
  modal = "";
  persist();
  render();
}
function inviteNext() {
  clearTimeout(botTimer);
  if (!team() || state.contest?.status !== "active") {
    botInvite = false;
    return;
  }
  const missing = team().members.find(
    (m) => !state.contest.participants.includes(m.id),
  );
  if (!missing) {
    botInvite = false;
    if (modal === "contest") renderDialog();
    return;
  }
  const sessionId = state.sessionId,
    cid = state.contest.id;
  botTimer = setTimeout(() => {
    if (sessionId !== state.sessionId || cid !== state.contest?.id) {
      botInvite = false;
      return;
    }
    if (act("INVITE", { memberId: missing.id, sessionId })) {
      toast(missing.name + " joined as " + missing.role.toLowerCase() + ".");
      sound(480);
    }
    if (target().phase === "captured") {
      if (view.shopId === target().id && ["contest", "outcome"].includes(modal))
        modal = "";
      if (modal !== "round") render();
      toast("Crew assembled · territory secured!");
    } else {
      if (modal === "contest" || modal === "director") renderDialog();
      document.querySelector(".scene-card").innerHTML = sceneCard();
    }
    inviteNext();
  }, 800);
}
function botVotes() {
  clearTimeout(botTimer);
  botInvite = false;
  if (
    !state.proposal?.votes.player ||
    state.proposal.winner ||
    target().phase !== "voting"
  )
    return;
  const p = state.proposal,
    sid = state.sessionId,
    idx = team().members.findIndex((m) => !p.votes[m.id]);
  if (idx < 0) return;
  botTimer = setTimeout(() => {
    if (state.sessionId !== sid || state.proposal?.id !== p.id) return;
    const member = team().members[idx];
    const choice = memberChoice(member.id, p.options);
    act("VOTE", {
      memberId: member.id,
      choice,
      proposalId: p.id,
      sessionId: sid,
    });
    if (modal === "voting") {
      sound(450 + idx * 90);
      renderDialog();
    }
    botVotes();
  }, 900);
}
function showPrefs() {
  view.started = true;
  picks = [...state.player.preferences];
  persist();
  openModal("prefs");
}
function action(id) {
  switch (id) {
    case "start":
      start();
      break;
    case "reloadSave":
      location.reload();
      break;
    case "map":
      go("map");
      break;
    case "territoryMap":
      if (state.contest?.status !== "won") return;
      view.territories = true;
      go("map", state.contest.shopId);
      break;
    case "returnToStreet":
      if (view.scene !== "shop") return;
      go("map", view.shopId);
      break;
    case "mall":
      view.started = true;
      go("mall");
      break;
    case "focusShop":
      if (!["map", "mall"].includes(view.scene)) return;
      go("shop", view.mapShopId ?? districtFocusShop(state).id);
      break;
    case "prefs":
      showPrefs();
      break;
    case "match":
      if (picks.length !== 3) return;
      act("PREFER", { preferences: picks });
      selectedTeam = recommend(picks);
      openModal("teams");
      break;
    case "join":
      if (act("JOIN", { alliance: selectedTeam })) {
        view.territories = true;
        go("map");
        toast("Joined " + team().name + " · choose a street on the map.");
      }
      break;
    case "layers":
      view.territories = !view.territories;
      persist();
      render();
      break;
    case "sound":
      view.sound = !view.sound;
      persist();
      render();
      toast("Game sound " + (view.sound ? "on" : "off"));
      break;
    case "settings":
    case "director":
    case "help":
    case "alliance":
    case "daily":
    case "insights":
    case "scout":
    case "manage":
    case "confirmReset":
      openModal(id);
      break;
    case "close":
    case "resume":
      closeModal();
      break;
    case "challenge":
      if (act("CHALLENGE", { shopId: view.shopId })) {
        modal = "contest";
        render();
      } else toast("Finish the current shop challenge first.");
      break;
    case "contest":
      openModal("contest");
      break;
    case "invite":
      if (!botInvite && state.contest?.status === "active") {
        act("RALLY");
        botInvite = true;
        renderDialog();
        inviteNext();
      }
      break;
    case "rush":
    case "emergency":
      roundMode = id;
      openModal("round");
      break;
    case "staff": {
      const m = team()?.members.find((m) => !shop().staff?.includes(m.id));
      if (m && act("STAFF", { shopId: view.shopId, memberId: m.id })) {
        render();
        toast(m.name + " joined the defense shift.");
      }
      break;
    }
    case "decorate":
      if (act("DECORATE", { shopId: view.shopId })) {
        modal = "";
        render();
        toast("Your alliance pennants are up.");
      }
      break;
    case "propose":
      if (act("PROPOSE")) {
        modal = "voting";
        render();
      }
      break;
    case "voting":
      openModal("voting");
      botVotes();
      break;
    case "count":
      if (act("CLOSE_VOTE")) {
        modal = "";
        render();
        toast(TYPES[state.proposal.winner].name + " won the ballot!");
      }
      break;
    case "advance":
      if (act("ADVANCE")) {
        view.shopId = state.renovation.shopId;
        go("shop", view.shopId);
        const fx = document.querySelector("#effects");
        fx.innerHTML =
          '<div class="opening-ribbon"><small>ONE DAY LATER</small><b>Grand opening</b><span>' +
          noun(shop().type) +
          "</span></div>" +
          Array.from(
            { length: 24 },
            (_, i) =>
              `<i class="confetti" style="left:${(i * 27) % 100}%;--lag:${(i % 6) * 0.09}s;--color:${["#f8c25f", "#7dbdaf", "#ed8f7e"][i % 3]}"></i>`,
          ).join("");
        toast("Day " + state.day + " · The district map has been updated.");
        sound(740);
      }
      break;
    case "guided":
      if (view.started || protectSave) {
        openModal("confirmGuided");
      } else {
        reset();
        start();
      }
      break;
    case "guidedStart":
      reset();
      start();
      break;
    case "reset":
      if (modal === "director") {
        openModal("confirmReset");
        return;
      }
      reset();
      break;
  }
}
root.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.disabled || b.closest("#round") || b.closest("#world")) return;
  sound();
  if (b.dataset.choice) {
    const v = b.dataset.choice,
      i = picks.indexOf(v);
    if (i >= 0) picks.splice(i, 1);
    else if (picks.length < 3) picks.push(v);
    else {
      toast("Remove a pick to choose another stop.");
      return;
    }
    renderDialog();
  } else if (b.dataset.team) {
    selectedTeam = b.dataset.team;
    renderDialog();
  } else if (b.dataset.vote) {
    if (
      act("VOTE", {
        memberId: state.player.id,
        choice: b.dataset.vote,
        proposalId: state.proposal.id,
      })
    ) {
      renderDialog();
      botVotes();
    }
  } else if (b.dataset.do) action(b.dataset.do);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal) {
    e.preventDefault();
    closeModal();
  }
  if (e.key === "Tab" && modal) {
    const nodes = [
      ...root.querySelectorAll(
        '.dialog button:not([disabled]),.dialog [tabindex="0"]',
      ),
    ].filter((el) => el.offsetParent !== null);
    if (!nodes.length) return;
    if (e.shiftKey && document.activeElement === nodes[0]) {
      e.preventDefault();
      nodes.at(-1).focus();
    } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
      e.preventDefault();
      nodes[0].focus();
    }
  }
});
window.addEventListener("storage", (event) => {
  if (
    event.storageArea === localStorage &&
    (event.key === key || event.key === null) &&
    localStorage.getItem(key) !== lastSnapshot
  )
    reportSaveConflict();
});
installLanguage();
render();
if (state.contest?.status === "active" && state.contest.invitesRequested) {
  botInvite = true;
  inviteNext();
}
if (state.proposal?.votes.player && !state.proposal.winner) botVotes();
