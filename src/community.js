import { ALLIANCES, RULES, TYPES } from "./game.js";
import { icon } from "./icons.js";

const allianceSymbols = {
  trend: "bolt",
  comfort: "flower",
  collective: "leaf",
};
const phases = {
  open: "Open",
  contested: "Under challenge",
  captured: "Shutters down",
  voting: "Taking votes",
  renovating: "Under renovation",
  reopened: "Reopened",
};
const symbols = {
  opening: "sun",
  capture: "flag",
  renovation: "shop",
  support: "people",
  rush: "bolt",
  alliance: "flag",
  proposal: "paper",
  contest: "flag",
  defense: "trophy",
  management: "shop",
  decoration: "star",
  arrival: "pin",
};

function safe(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
const shopName = (type) => TYPES[type]?.shopName ?? "Shop";
const typeName = (type) => TYPES[type]?.name ?? "Shop";
const unit = (id) => "Unit " + id.replace("unit", "");
const note = (text) => '<p class="cn-note">' + safe(text) + "</p>";
const heading = (label, detail) =>
  '<div class="cn-section-head"><h3>' +
  safe(label) +
  "</h3><span>" +
  safe(detail) +
  "</span></div>";
const dayTag = (day) => "Day " + String(day).padStart(2, "0");

function eventList(events) {
  return (
    '<ol class="cn-ticker">' +
    [...events]
      .reverse()
      .map(
        (event) =>
          '<li><span class="cn-event-icon">' +
          icon(symbols[event.kind] ?? "paper", 17) +
          '</span><div><span class="eyebrow cn-caption">' +
          dayTag(event.day) +
          (event.kind === "support"
            ? " · Simulated ally"
            : event.kind === "arrival"
              ? " · Scenario setup"
              : "") +
          "</span><p>" +
          safe(event.text) +
          "</p></div></li>",
      )
      .join("") +
    "</ol>"
  );
}

export function daily(state) {
  const news = state.events.filter((e) => e.day === state.day);
  const lead =
    [...news].reverse().find((e) => e.kind === "opening") ?? news.at(-1);
  const unitOpened =
    lead?.kind === "opening" &&
    state.history.findLast(
      (h) => h.shopId === lead.shopId && h.readyDay === state.day,
    );
  const headline = unitOpened
    ? shopName(unitOpened.toType) + " opens its doors"
    : lead?.kind === "arrival"
      ? "Lights on at Glaze Lane"
      : lead?.kind === "capture"
        ? "The keys change hands"
        : lead?.kind === "renovation"
          ? "A new sign for the atrium"
          : "Around the neighborhood";
  const comparison = unitOpened
    ? '<figure class="cn-comparison">' +
      [
        [unitOpened.fromType, "Before"],
        [unitOpened.toType, "Opening day"],
      ]
        .map(
          ([type, when]) =>
            '<div><img alt="' +
            safe(typeName(type)) +
            ' storefront" src="assets/world/front-' +
            type +
            '.webp"><figcaption>' +
            when +
            " · " +
            safe(shopName(type)) +
            "</figcaption></div>",
        )
        .join("") +
      "</figure>"
    : "";
  return (
    '<div class="cn-book cn-daily"><div class="cn-folio"><span>寶琳社區報</span><span>' +
    dayTag(state.day) +
    ' · Local edition</span></div><div class="cn-lead"><span class="cn-edition">' +
    icon(unitOpened ? "sun" : "paper", 22) +
    " MCP Central</span><h3>" +
    safe(headline) +
    "</h3>" +
    (lead ? "<p>" + safe(lead.text) + "</p>" : "") +
    "</div>" +
    comparison +
    heading("Community dispatches", state.events.length + " on record") +
    eventList(state.events) +
    "</div>"
  );
}

function countTypes(choices) {
  const counts = new Map();
  for (const type of choices) counts.set(type, (counts.get(type) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}
function bars(entries) {
  const max = Math.max(...entries.map(([, n]) => n), 1);
  return (
    '<ul class="cn-bars">' +
    entries
      .map(
        ([label, n]) =>
          "<li><span>" +
          safe(label) +
          '</span><div class="cn-track" aria-hidden="true"><i style="width:' +
          (100 * n) / max +
          '%"></i></div><b>' +
          n +
          "</b></li>",
      )
      .join("") +
    "</ul>"
  );
}

function voteRecord(state) {
  const proposal = state.proposal;
  if (!proposal)
    return note(
      "The next alliance ballot will appear here when a shop changes hands.",
    );
  const ballot = Object.entries(proposal.votes);
  const rows = proposal.options
    .map((type) => {
      const forType = ballot.filter(([, choice]) => choice === type);
      const local = forType.filter(
        ([voter]) => voter === state.player.id,
      ).length;
      return (
        '<tr><th scope="row">' +
        safe(typeName(type)) +
        (type === proposal.winner ? " <small>Won</small>" : "") +
        "</th><td>" +
        local +
        "</td><td>" +
        (forType.length - local) +
        "</td></tr>"
      );
    })
    .join("");
  return (
    '<table class="cn-ballot"><caption>' +
    safe(unit(proposal.shopId)) +
    " · " +
    ballot.length +
    "/" +
    proposal.eligible.length +
    " votes received</caption><thead><tr><th>Proposal</th><th>You</th><th>Simulated allies</th></tr></thead><tbody>" +
    rows +
    "</tbody></table>" +
    (proposal.tied ? note(RULES.tieBreak) : "")
  );
}

export function insights(state) {
  const preferences = countTypes(state.player.preferences);
  const locations = new Set(Object.values(state.shops).map((s) => s.location));
  const visits = Object.entries(state.visits)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const completed = state.history;
  const refitLog = completed
    .map(
      (h) =>
        '<li><span class="eyebrow cn-caption">' +
        dayTag(h.readyDay) +
        " · " +
        safe(unit(h.shopId)) +
        "</span><strong>" +
        safe(shopName(h.fromType)) +
        " → " +
        safe(shopName(h.toType)) +
        "</strong></li>",
    )
    .join("");
  const hypothesis = preferences.length
    ? "Would local customers choose " +
      typeName(preferences[0][0]).toLowerCase() +
      " options near the station? A resident survey could test that idea."
    : "Which shops would residents like near the station? A local survey could test the ideas collected here.";
  const scope =
    locations.size === 1 && locations.has("central")
      ? "All shop activity in this save comes from MCP Central. Preference picks describe Po Lam as a whole. Other districts have no observations."
      : "Preference picks describe Po Lam as a whole. Shop entries are counted at their individual units.";
  // The six named NPCs have a seeded home stop. This is a scenario breakdown,
  // separate from the local player's selections and from observed shop entry counts.
  const neighborhoods = [
    { name: "Station walkway", members: ["mina", "kit"] },
    { name: "Estate courtyard", members: ["wai", "lok"] },
    { name: "Park entrance", members: ["june", "yan"] },
  ];
  const localInterests = neighborhoods
    .map((area) => {
      const choices = area.members.map((id) => {
        const group = Object.values(ALLIANCES).find((a) =>
          a.members.some((m) => m.id === id),
        );
        const index = group.members.findIndex((m) => m.id === id);
        return group.preferences[index % group.preferences.length];
      });
      return (
        "<li><b>" +
        area.name +
        "</b><span>" +
        choices.map(typeName).join(" · ") +
        "</span></li>"
      );
    })
    .join("");
  return (
    '<div class="cn-book"><div class="cn-folio"><span>Po Lam · Field notes</span><span>' +
    dayTag(state.day) +
    '</span></div><p class="cn-intro">One local playthrough in digital Po Lam. Ally responses are simulated.</p>' +
    "<section>" +
    heading("Shops you asked for", "Your preference picks") +
    (preferences.length
      ? '<ol class="cn-picks">' +
        state.player.preferences
          .map(
            (type, i) =>
              '<li><img src="assets/items/' +
              type +
              '.webp" alt=""><span><small>Pick ' +
              (i + 1) +
              "</small><b>" +
              safe(typeName(type)) +
              "</b></span></li>",
          )
          .join("") +
        "</ol>" +
        note("Ranked choices from the local player.")
      : note("Complete the preference cards to record your first picks.")) +
    "</section>" +
    "<section>" +
    heading("Alliance ballot", "One vote per member") +
    voteRecord(state) +
    "</section>" +
    "<section>" +
    heading("Footfall at MCP Central", "Your game activity") +
    (visits.length
      ? bars(
          visits.map(([id, n]) => [
            unit(id) + " · " + shopName(state.shops[id].type),
            n,
          ]),
        ) +
        note(
          "Counts every shop entry, including repeat visits. Each unit is shown with its current tenant.",
        )
      : note("Enter a virtual shop to record its first visit.")) +
    "</section><section>" +
    heading("Refit history", completed.length + " completed") +
    (refitLog
      ? '<ol class="cn-refits">' + refitLog + "</ol>"
      : note("Completed shop changes appear on opening day.")) +
    "</section>" +
    "<section>" +
    heading("Preferences around the district", "Seeded simulation") +
    '<ul class="cn-lines">' +
    localInterests +
    "</ul>" +
    note(
      "Two simulated neighbors per stop. Their assigned favorites illustrate how a geographic comparison could look.",
    ) +
    note(scope) +
    '</section><div class="cn-question"><span class="eyebrow cn-caption">Merchant research question</span><p>' +
    safe(hypothesis) +
    "</p>" +
    note(
      "This is a hypothesis. Resident demand and purchases require separate evidence.",
    ) +
    "</div></div>"
  );
}

export function allianceProfile(state) {
  const id = state.player.alliance;
  const team = ALLIANCES[id];
  if (!team)
    return (
      '<div class="cn-book">' +
      note(
        "Choose your neighborhood preferences to meet the alliances in Po Lam.",
      ) +
      "</div>"
    );
  const territory = Object.values(state.shops).filter((s) => s.owner === id);
  const contest = state.contest;
  const active = contest?.status === "active" && contest.alliance === id;
  const activeEntries = new Set(
    state.events.filter(
      (e) =>
        e.kind === "alliance" ||
        e.memberId === state.player.id ||
        team.members.some((m) => m.id === e.memberId) ||
        territory.some((s) => s.id === e.shopId),
    ),
  );
  const roster = [
    { id: state.player.id, name: "You", role: "Local player" },
    ...team.members,
  ];
  return (
    '<div class="cn-book"><div class="cn-crest"><span style="--cn-team:' +
    team.color +
    '">' +
    icon(allianceSymbols[id], 30) +
    "</span><div><h3>" +
    safe(team.name) +
    "</h3><p>" +
    safe(team.description) +
    "</p></div></div><section>" +
    heading("Neighborhood priorities", "Alliance preferences") +
    '<p class="cn-note">' +
    team.preferences.map((type) => safe(typeName(type))).join(" · ") +
    "</p></section>" +
    "<section>" +
    heading("Crew roster", roster.length + " members") +
    '<ul class="cn-lines">' +
    roster
      .map(
        (m) =>
          "<li><strong>" +
          safe(m.name) +
          "</strong><span>" +
          (m.id === state.player.id
            ? "Local player"
            : "Simulated · " + safe(m.role)) +
          (active && contest.participants.includes(m.id)
            ? " · At counter"
            : "") +
          "</span></li>",
      )
      .join("") +
    "</ul></section><section>" +
    heading("Alliance territory", territory.length + " shops") +
    '<ul class="cn-lines">' +
    territory
      .map(
        (s) =>
          "<li><strong>" +
          safe(shopName(s.type)) +
          "</strong><span>" +
          safe(unit(s.id)) +
          " · " +
          safe(phases[s.phase]) +
          "</span></li>",
      )
      .join("") +
    "</ul></section><section>" +
    heading(
      "Current challenge",
      active
        ? contest.participants.length + "/" + RULES.minParticipants + " present"
        : "No active challenge",
    ) +
    (active
      ? note(shopName(state.shops[contest.shopId].type) + " · MCP Central")
      : "") +
    "</section><section>" +
    heading("Crew dispatches", "Latest activity") +
    eventList([...activeEntries].slice(-4)) +
    "</section></div>"
  );
}

export function director(state) {
  const contest = state.contest;
  const unfinishedInvites =
    contest?.status === "active" &&
    ALLIANCES[state.player.alliance]?.members.some(
      (m) => !contest.participants.includes(m.id),
    );
  const canAdvance = state.renovation && !state.renovation.complete;
  return (
    '<div class="cn-book"><p class="cn-intro">Use these controls during a classroom pitch.</p>' +
    '<div class="cn-controls"><button class="btn primary" data-do="guided">Start guided demo</button>' +
    '<button class="btn secondary" data-do="invite"' +
    (unfinishedInvites ? "" : " disabled") +
    ">Invite simulated allies</button>" +
    '<button class="btn secondary" data-do="advance"' +
    (canAdvance ? "" : " disabled") +
    ">Advance to next day</button>" +
    '<button class="btn secondary" data-do="insights">Open merchant insights</button>' +
    '<button class="btn secondary" data-do="reset">Reset demo</button></div>' +
    note(
      "Invitations unlock during an active challenge. The clock advances once the winning proposal enters renovation.",
    ) +
    "</div>"
  );
}
