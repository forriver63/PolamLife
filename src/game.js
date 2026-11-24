// Temporary playtest values. Change these together with the visible rules of the round.
export const RULES = Object.freeze({
  minParticipants: 3,
  renovationDays: 1,
  rushSeconds: 25,
  emergencySeconds: 24,
  rushGoal: 5,
  emergencyGoal: 3,
  defenseReward: 1,
  baseDefense: 2,
  maxDefense: 6,
  proposalCount: 3,
  tieBreak: "The earliest listed proposal wins a tied ballot.",
});

export const TYPES = {
  tea: { name: "Bubble Tea Shop", shopName: "Pearl Club" },
  game: { name: "Gaming Store", shopName: "Pixel Port" },
  hotpot: { name: "Hot Pot Restaurant", shopName: "Little Steam" },
  cafe: { name: "Café", shopName: "Sunday Coffee" },
  sushi: { name: "Sushi Restaurant", shopName: "Roll Call" },
  donut: { name: "Donut Shop", shopName: "Glaze Lane" },
  market: { name: "Convenience Store", shopName: "Neighbour Mart" },
};

export const ALLIANCES = {
  trend: {
    name: "The Trendsetters",
    color: "#83cac0",
    description: "A tea stop before class, an arcade after dark.",
    preferences: ["tea", "game"],
    members: [
      { id: "mina", name: "Mina", role: "Order runner" },
      { id: "kit", name: "Kit", role: "Queue marshal" },
    ],
  },
  comfort: {
    name: "The Comfort Club",
    color: "#e99885",
    description: "Coffee counters, slow mornings and a corner table.",
    preferences: ["cafe", "donut", "sushi"],
    members: [
      { id: "wai", name: "Wai", role: "Order runner" },
      { id: "june", name: "June", role: "Queue marshal" },
    ],
  },
  collective: {
    name: "The Neighborhood Collective",
    color: "#eac472",
    description: "Everyday essentials and big tables for a shared meal.",
    preferences: ["market", "hotpot"],
    members: [
      { id: "lok", name: "Lok", role: "Order runner" },
      { id: "yan", name: "Yan", role: "Queue marshal" },
    ],
  },
};

const INITIAL_UNITS = [
  ["unit01", "donut", "incumbent"],
  ["unit02", "sushi", "comfort"],
  ["unit03", "game", "trend"],
  ["unit04", "cafe", "comfort"],
  ["unit05", "market", "collective"],
  ["unit06", "hotpot", "collective"],
];

const ownKey = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
const playable = (shop) => shop && ["open", "reopened"].includes(shop.phase);

// Each resident votes for their first available choice, independently of the player.
const MEMBER_RANKINGS = {
  mina: ["tea", "cafe", "game", "donut", "hotpot", "sushi", "market"],
  kit: ["game", "tea", "hotpot", "market", "sushi", "cafe", "donut"],
  wai: ["cafe", "sushi", "tea", "market", "hotpot", "donut", "game"],
  june: ["donut", "cafe", "tea", "sushi", "hotpot", "market", "game"],
  lok: ["market", "hotpot", "sushi", "tea", "game", "cafe", "donut"],
  yan: ["hotpot", "sushi", "market", "cafe", "donut", "tea", "game"],
};

export function memberChoice(memberId, options) {
  return MEMBER_RANKINGS[memberId].find((type) => options.includes(type));
}

function proposalOptions(player, team, currentType) {
  const replacements = (types) => types.filter((type) => type !== currentType);
  const picks = replacements(player.preferences);
  const crewPicks = replacements(team.preferences);
  const shortlist = [
    ...picks.slice(0, 1),
    ...(currentType === "sushi" ? ["hotpot"] : []),
    ...crewPicks.slice(0, 1),
    ...picks,
    ...crewPicks,
    ...replacements(Object.keys(TYPES)),
  ];
  return [...new Set(shortlist)].slice(0, RULES.proposalCount);
}

export function uniqueId(prefix) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2)
  );
}

export function recommend(preferences = []) {
  // First pick decides among equally matched teams.
  const score = Object.fromEntries(Object.keys(ALLIANCES).map((id) => [id, 0]));
  const first = {};
  preferences.forEach((type, i) => {
    for (const [id, alliance] of Object.entries(ALLIANCES)) {
      if (!alliance.preferences.includes(type)) continue;
      score[id] += 1;
      first[id] ??= i;
    }
  });
  return Object.keys(ALLIANCES).sort(
    (a, b) =>
      score[b] - score[a] || (first[a] ?? Infinity) - (first[b] ?? Infinity),
  )[0];
}

export function createGame() {
  const shops = {};
  for (const [id, type, owner] of INITIAL_UNITS) {
    shops[id] = {
      id,
      type,
      owner,
      phase: "open",
      defense: RULES.baseDefense,
      decorated: false,
      location: "central",
    };
  }
  return {
    version: 1,
    sessionId: uniqueId("world"),
    day: 1,
    player: { id: "player", name: "You", alliance: null, preferences: [] },
    shops,
    contest: null,
    proposal: null,
    renovation: null,
    history: [],
    events: [
      {
        id: "event-1",
        kind: "arrival",
        day: 1,
        text: "Glaze Lane opens its shutters at MCP Central.",
      },
    ],
    results: [],
    visits: Object.fromEntries(INITIAL_UNITS.map(([id]) => [id, 0])),
  };
}

function log(state, kind, text, shopId = null, memberId = null) {
  const event = {
    id: "event-" + (state.events.length + 1),
    kind,
    day: state.day,
    text,
    shopId,
    memberId,
  };
  state.events.push(event);
  return event;
}

function tryCapture(state) {
  const c = state.contest;
  if (!c.wonRush || c.participants.length < RULES.minParticipants) return;
  const shop = state.shops[c.shopId];
  const previousOwner = shop.owner;
  shop.phase = "captured";
  shop.owner = c.alliance;
  shop.decorated = false;
  shop.staff = [];
  shop.defense = 1;
  c.status = "won";
  const capture = log(
    state,
    "capture",
    ALLIANCES[c.alliance].name +
      " captured " +
      TYPES[shop.type].shopName +
      ". Shutters down for a new proposal.",
    shop.id,
  );
  capture.previousOwner = previousOwner;
  capture.owner = shop.owner;
}

// Each accepted action produces a complete, serializable world snapshot. A rejected action
// preserves reference identity, allowing callers to skip saving, sound and animation.
export function reduce(state, action) {
  if (
    !state ||
    !action ||
    (action.sessionId && action.sessionId !== state.sessionId)
  )
    return state;
  const { player, contest, proposal, renovation } = state;
  const team = ALLIANCES[player.alliance];
  const shop = ownKey(state.shops, action.shopId)
    ? state.shops[action.shopId]
    : null;
  const target = contest && state.shops[contest.shopId];
  const copy = () => structuredClone(state);

  switch (action.type) {
    case "STAFF": {
      if (!team || !playable(shop) || shop.owner !== player.alliance)
        return state;
      const member = team.members.find((m) => m.id === action.memberId);
      if (!member || shop.staff?.includes(member.id)) return state;
      const next = copy();
      next.shops[shop.id].staff = [...(shop.staff ?? []), member.id];
      next.shops[shop.id].defense = Math.min(
        RULES.maxDefense,
        shop.defense + RULES.defenseReward,
      );
      log(
        next,
        "support",
        member.name +
          " signed on for a defense shift at " +
          TYPES[shop.type].shopName +
          ".",
        shop.id,
        member.id,
      );
      return next;
    }
    case "PREFER": {
      const prefs = action.preferences;
      if (
        player.alliance ||
        !Array.isArray(prefs) ||
        prefs.length !== 3 ||
        new Set(prefs).size !== 3 ||
        !prefs.every((type) => ownKey(TYPES, type))
      )
        return state;
      if (JSON.stringify(prefs) === JSON.stringify(player.preferences))
        return state;
      const next = copy();
      next.player.preferences = [...prefs];
      return next;
    }
    case "JOIN": {
      if (
        player.alliance ||
        !player.preferences.length ||
        !ownKey(ALLIANCES, action.alliance)
      )
        return state;
      const next = copy();
      next.player.alliance = action.alliance;
      log(
        next,
        "alliance",
        "You joined " + ALLIANCES[action.alliance].name + ".",
        null,
        player.id,
      );
      return next;
    }
    case "VISIT": {
      if (!shop) return state;
      const next = copy();
      next.visits[shop.id]++;
      return next;
    }
    case "CHALLENGE": {
      if (
        !team ||
        !playable(shop) ||
        shop.owner === player.alliance ||
        (target && !playable(target))
      )
        return state;
      const next = copy();
      next.contest = {
        id: "contest-" + (state.events.length + 1),
        shopId: shop.id,
        alliance: player.alliance,
        previousOwner: shop.owner,
        previousPhase: shop.phase,
        participants: [player.id],
        wonRush: false,
        status: "active",
      };
      next.shops[shop.id].phase = "contested";
      next.proposal = null;
      next.renovation = null;
      log(
        next,
        "contest",
        team.name +
          " challenged " +
          TYPES[shop.type].shopName +
          " to a shop rush.",
        shop.id,
        player.id,
      );
      return next;
    }
    case "RALLY": {
      if (target?.phase !== "contested" || contest.invitesRequested)
        return state;
      const next = copy();
      next.contest.invitesRequested = true;
      return next;
    }
    case "INVITE": {
      if (
        !team ||
        target?.phase !== "contested" ||
        contest.participants.includes(action.memberId)
      )
        return state;
      const member = team.members.find((m) => m.id === action.memberId);
      if (!member) return state;
      const next = copy();
      next.contest.participants.push(member.id);
      log(
        next,
        "support",
        member.name +
          " joined the counter as " +
          member.role.toLowerCase() +
          ".",
        target.id,
        member.id,
      );
      tryCapture(next);
      return next;
    }
    case "RESULT": {
      if (
        !shop ||
        !team ||
        action.sessionId !== state.sessionId ||
        !action.roundId ||
        typeof action.roundId !== "string" ||
        typeof action.success !== "boolean" ||
        !["rush", "emergency"].includes(action.game) ||
        state.results.some((r) => r.roundId === action.roundId)
      )
        return state;
      const attacking =
        shop.phase === "contested" &&
        shop.id === target?.id &&
        contest.alliance === player.alliance;
      const managing = playable(shop) && shop.owner === player.alliance;
      if (
        (!attacking && !managing) ||
        (attacking &&
          (action.game !== "rush" ||
            contest.wonRush ||
            action.contestId !== contest.id)) ||
        (managing && action.contestId != null)
      )
        return state;
      const next = copy();
      next.results.push({
        roundId: action.roundId,
        shopId: shop.id,
        game: action.game,
        success: action.success,
        contestId: attacking ? contest.id : null,
        day: state.day,
        memberId: player.id,
      });
      const name = TYPES[shop.type].shopName;
      if (attacking) {
        next.contest.wonRush = action.success;
        if (action.success) {
          log(
            next,
            "rush",
            "You cleared the counter rush at " + name + ".",
            shop.id,
            player.id,
          );
          tryCapture(next);
        } else {
          next.shops[shop.id].phase = contest.previousPhase;
          next.contest.status = "defended";
          log(
            next,
            "defense",
            name +
              " held its territory. Your crew can regroup for another challenge.",
            shop.id,
          );
        }
      } else {
        const points = action.success ? RULES.defenseReward : -1;
        next.shops[shop.id].defense = Math.min(
          RULES.maxDefense,
          Math.max(0, shop.defense + points),
        );
        const message =
          action.game === "rush" ? "counter rush" : "shop emergency";
        log(
          next,
          "management",
          name +
            (action.success ? " handled its " : " struggled with its ") +
            message +
            ".",
          shop.id,
          player.id,
        );
      }
      return next;
    }
    case "DECORATE": {
      if (
        !team ||
        !playable(shop) ||
        shop.owner !== player.alliance ||
        shop.decorated
      )
        return state;
      const next = copy();
      next.shops[shop.id].decorated = true;
      log(
        next,
        "decoration",
        team.name +
          " hung its pennants over " +
          TYPES[shop.type].shopName +
          ".",
        shop.id,
        player.id,
      );
      return next;
    }
    case "PROPOSE": {
      if (
        target?.phase !== "captured" ||
        target.owner !== player.alliance ||
        proposal
      )
        return state;
      const next = copy();
      next.proposal = {
        id: "ballot-" + contest.id,
        shopId: target.id,
        options: proposalOptions(player, team, target.type),
        eligible: [player.id, ...team.members.map((m) => m.id)],
        votes: {},
        winner: null,
        tied: false,
      };
      next.shops[target.id].phase = "voting";
      log(
        next,
        "proposal",
        team.name + " opened a ballot for the vacant counter.",
        target.id,
      );
      return next;
    }
    case "VOTE": {
      if (
        !proposal ||
        target?.phase !== "voting" ||
        target.owner !== player.alliance ||
        !proposal.eligible.includes(action.memberId) ||
        !proposal.options.includes(action.choice) ||
        ownKey(proposal.votes, action.memberId) ||
        (action.proposalId && action.proposalId !== proposal.id)
      )
        return state;
      const next = copy();
      next.proposal.votes[action.memberId] = action.choice;
      return next;
    }
    case "CLOSE_VOTE": {
      if (
        !proposal ||
        target?.phase !== "voting" ||
        proposal.winner ||
        !proposal.eligible.every((id) => ownKey(proposal.votes, id))
      )
        return state;
      const tally = proposal.options.map(
        (type) =>
          Object.values(proposal.votes).filter((v) => v === type).length,
      );
      const maximum = Math.max(...tally);
      const winner = proposal.options[tally.indexOf(maximum)];
      const next = copy();
      next.proposal.winner = winner;
      next.proposal.tied = tally.filter((v) => v === maximum).length > 1;
      next.renovation = {
        shopId: target.id,
        fromType: target.type,
        toType: winner,
        startDay: state.day,
        readyDay: state.day + RULES.renovationDays,
        complete: false,
      };
      next.shops[target.id].phase = "renovating";
      log(
        next,
        "renovation",
        TYPES[winner].name +
          " won the ballot. The crew starts fitting out the shop.",
        target.id,
      );
      return next;
    }
    case "ADVANCE": {
      if (!renovation || renovation.complete || target?.phase !== "renovating")
        return state;
      const next = copy();
      next.day = renovation.readyDay;
      next.renovation.complete = true;
      next.shops[target.id].phase = "reopened";
      next.shops[target.id].type = renovation.toType;
      next.history.push({
        ...next.renovation,
        owner: target.owner,
        votes: { ...proposal.votes },
      });
      log(
        next,
        "opening",
        TYPES[renovation.toType].shopName +
          " opened in MCP Central, in the former home of " +
          TYPES[renovation.fromType].shopName +
          ".",
        target.id,
      );
      return next;
    }
    default:
      return state;
  }
}
