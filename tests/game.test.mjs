import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  reduce,
  recommend,
  memberChoice,
  ALLIANCES,
  RULES,
  TYPES,
} from "../src/game.js";
import { readSave } from "../src/save.js";

const act = (state, type, args = {}) => reduce(state, { type, ...args });
function joined(id = "trend") {
  const state = act(createGame(), "PREFER", {
    preferences: [
      ...new Set([...ALLIANCES[id].preferences, "tea", "game", "cafe"]),
    ].slice(0, 3),
  });
  return act(state, "JOIN", { alliance: id });
}
function challenge(state = joined()) {
  return act(state, "CHALLENGE", { shopId: "unit01" });
}
function invite(state) {
  return ALLIANCES[state.player.alliance].members.reduce(
    (s, m) => act(s, "INVITE", { memberId: m.id }),
    state,
  );
}
function rush(state, success, id = "rush-1") {
  return act(state, "RESULT", {
    roundId: id,
    shopId: "unit01",
    sessionId: state.sessionId,
    contestId: state.contest.id,
    game: "rush",
    success,
  });
}
function ballot(id = "trend") {
  return act(rush(invite(challenge(joined(id))), true), "PROPOSE");
}
function cast(
  state,
  choices = [
    state.proposal.options[0],
    state.proposal.options[0],
    state.proposal.options[1],
  ],
) {
  return state.proposal.eligible.reduce(
    (s, memberId, i) => act(s, "VOTE", { memberId, choice: choices[i] }),
    state,
  );
}

test("each alliance can reach the next-day opening through the public actions", () => {
  for (const id of Object.keys(ALLIANCES)) {
    const voted = cast(ballot(id));
    const win = act(voted, "CLOSE_VOTE");
    assert.equal(win.shops.unit01.type, "donut");
    assert.equal(win.shops.unit01.phase, "renovating");
    assert.equal(win.proposal.winner, voted.proposal.options[0]);
    const reopened = act(win, "ADVANCE");
    assert.equal(reopened.shops.unit01.type, win.proposal.winner);
    assert.equal(reopened.shops.unit01.phase, "reopened");
    assert.equal(reopened.day, 1 + RULES.renovationDays);
    assert.equal(reopened.shops.unit01.owner, id);
    assert.equal(reopened.events.at(-1).kind, "opening");
    assert.equal(reopened.history[0].fromType, "donut");
    assert.equal(reopened.history[0].toType, win.proposal.winner);
  }
});

test("matching counts stated preferences and resolves a tied match using the earliest preference", () => {
  for (const [id, team] of Object.entries(ALLIANCES)) {
    assert.equal(recommend(team.preferences), id);
  }
  assert.equal(recommend(["tea", "cafe"]), "trend");
  assert.equal(recommend(["cafe", "tea"]), "comfort");
  assert.equal(recommend(["sushi", "tea", "game"]), "trend");
});

test("invalid sequence and hostile property names cannot create membership or visit a phantom shop", () => {
  const s = createGame();
  assert.equal(act(s, "JOIN", { alliance: "trend" }), s);
  assert.equal(act(s, "CHALLENGE", { shopId: "unit01" }), s);
  assert.equal(act(s, "PREFER", { preferences: ["constructor"] }), s);
  assert.equal(act(s, "PREFER", { preferences: ["tea", "tea", "cafe"] }), s);
  assert.equal(act(s, "PREFER", { preferences: ["tea", "game"] }), s);
  assert.equal(act(s, "VISIT", { shopId: "__proto__" }), s);
  assert.equal(act(s, "ADVANCE"), s);
  const t = joined();
  assert.equal(act(t, "PREFER", { preferences: ["cafe"] }), t);
  assert.equal(act(t, "JOIN", { alliance: "collective" }), t);
});

test("capturing needs three distinct allies and a rush win in either order", () => {
  const c = challenge();
  const p = rush(c, true);
  assert.equal(p.shops.unit01.phase, "contested");
  assert.equal(act(p, "PROPOSE"), p);
  assert.equal(act(p, "INVITE", { memberId: "player" }), p);
  assert.equal(act(p, "INVITE", { memberId: "wai" }), p);
  const two = act(p, "INVITE", { memberId: "mina" });
  assert.equal(act(two, "INVITE", { memberId: "mina" }), two);
  assert.equal(two.shops.unit01.owner, "incumbent");
  const three = act(two, "INVITE", { memberId: "kit" });
  assert.equal(three.shops.unit01.phase, "captured");
  assert.equal(three.shops.unit01.owner, "trend");
  assert.equal(three.events.filter((e) => e.kind === "capture").length, 1);
  assert.equal(three.events.at(-1).previousOwner, two.shops.unit01.owner);
  assert.equal(three.events.at(-1).owner, three.shops.unit01.owner);
  assert.equal(rush(three, true, "duplicate"), three);
  assert.equal(act(three, "INVITE", { memberId: "kit" }), three);
  assert.equal(c.shops.unit01.phase, "contested");
  assert.deepEqual(c.contest.participants, ["player"]);
});

test("failed rush is a defended shop with a fresh contest and roster on retry", () => {
  const c = invite(challenge());
  const fail = rush(c, false);
  assert.equal(fail.shops.unit01.phase, "open");
  assert.equal(fail.shops.unit01.owner, "incumbent");
  assert.equal(fail.contest.status, "defended");
  assert.equal(fail.events.at(-1).kind, "defense");
  const retry = challenge(fail);
  assert.notEqual(retry.contest.id, c.contest.id);
  assert.deepEqual(retry.contest.participants, ["player"]);
  assert.equal(rush(retry, true, "rush-1"), retry);
  assert.equal(
    act(retry, "RESULT", {
      success: true,
      game: "rush",
      sessionId: retry.sessionId,
      shopId: "unit01",
      roundId: "late",
      contestId: c.contest.id,
    }),
    retry,
  );
  const captured = rush(invite(retry), true, "rush-2");
  assert.equal(captured.shops.unit01.phase, "captured");
  assert.equal(captured.results.length, 2);
});

test("an abandoned world cannot receive a late rush result", () => {
  const retired = challenge();
  const fresh = challenge();
  assert.notEqual(retired.sessionId, fresh.sessionId);
  assert.equal(
    act(fresh, "RESULT", {
      success: true,
      game: "rush",
      sessionId: retired.sessionId,
      shopId: "unit01",
      roundId: "late",
      contestId: retired.contest.id,
    }),
    fresh,
  );
});

test("ballots reject ineligible, duplicate and late votes; settlement occurs only once", () => {
  const s = ballot();
  assert.equal(act(s, "VOTE", { memberId: "wai", choice: "tea" }), s);
  assert.equal(act(s, "VOTE", { memberId: "mina", choice: "donut" }), s);
  assert.equal(
    act(s, "VOTE", { memberId: "mina", choice: "tea", proposalId: "old" }),
    s,
  );
  const once = act(s, "VOTE", { memberId: "player", choice: "tea" });
  assert.equal(act(once, "VOTE", { memberId: "player", choice: "game" }), once);
  assert.equal(act(once, "CLOSE_VOTE"), once);
  const won = act(cast(once), "CLOSE_VOTE");
  assert.equal(act(won, "VOTE", { memberId: "kit", choice: "tea" }), won);
  assert.equal(act(won, "CLOSE_VOTE"), won);
  const reopened = act(won, "ADVANCE");
  assert.equal(act(reopened, "ADVANCE"), reopened);
  assert.equal(reopened.history.length, 1);
});

test("three-way ties use the published ballot order", () => {
  const s = ballot();
  const choices = [...s.proposal.options].reverse();
  const win = act(cast(s, choices), "CLOSE_VOTE");
  assert.equal(win.proposal.winner, s.proposal.options[0]);
  assert.equal(win.proposal.tied, true);
});

test("entire renovation can round-trip through a JSON save before opening", () => {
  const s = act(cast(ballot(), ["cafe", "game", "cafe"]), "CLOSE_VOTE");
  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(restored, s);
  assert.deepEqual(act(restored, "ADVANCE"), act(s, "ADVANCE"));
  assert.equal(act(restored, "ADVANCE").shops.unit01.type, "cafe");
});

test("owned shop management, emergencies, decoration and visits change measurable shop state", () => {
  let s = joined();
  const result = (shopId, success, game, roundId) =>
    act(s, "RESULT", {
      shopId,
      success,
      game,
      roundId,
      sessionId: s.sessionId,
    });
  assert.equal(result("unit02", true, "emergency", "invalid"), s);
  assert.equal(act(s, "DECORATE", { shopId: "unit02" }), s);
  assert.equal(act(s, "CHALLENGE", { shopId: "unit03" }), s);
  s = act(s, "VISIT", { shopId: "unit03" });
  assert.equal(s.visits.unit03, 1);
  s = act(s, "DECORATE", { shopId: "unit03" });
  assert.equal(s.shops.unit03.decorated, true);
  assert.equal(act(s, "DECORATE", { shopId: "unit03" }), s);
  const baseline = s.shops.unit03.defense;
  s = result("unit03", true, "emergency", "1");
  assert.equal(s.shops.unit03.defense, baseline + RULES.defenseReward);
  assert.equal(result("unit03", true, "emergency", "1"), s);
  s = result("unit03", false, "rush", "2");
  assert.equal(s.shops.unit03.defense, baseline);
  assert.equal(s.results.length, 2);
  const staffed = act(s, "STAFF", { shopId: "unit03", memberId: "mina" });
  assert.equal(staffed.shops.unit03.defense, baseline + 1);
  assert.equal(
    act(staffed, "STAFF", { shopId: "unit03", memberId: "mina" }),
    staffed,
  );
  assert.equal(
    act(staffed, "STAFF", { shopId: "unit03", memberId: "wai" }),
    staffed,
  );
});

test("an active campaign cannot be lost by challenging a different rival shop", () => {
  const c = challenge();
  assert.equal(act(c, "CHALLENGE", { shopId: "unit02" }), c);
  const voting = ballot();
  assert.equal(act(voting, "CHALLENGE", { shopId: "unit02" }), voting);
  const nextDay = act(act(cast(voting), "CLOSE_VOTE"), "ADVANCE");
  const next = act(nextDay, "CHALLENGE", { shopId: "unit02" });
  assert.equal(next.contest.shopId, "unit02");
  assert.equal(next.history.length, 1);
  assert.equal(next.shops.unit01.type, "tea");
  assert.ok(Object.values(next.shops).every((s) => TYPES[s.type]?.shopName));
});

test("a late attacking result cannot settle as a friendly shift after reopening", () => {
  const s = act(act(cast(ballot()), "CLOSE_VOTE"), "ADVANCE");
  assert.equal(rush(s, true, "late-attack"), s);
  const active = challenge();
  assert.equal(
    act(active, "RESULT", {
      sessionId: active.sessionId,
      roundId: "missing-contest",
      shopId: "unit01",
      game: "rush",
      success: true,
    }),
    active,
  );
});

test("allies use separate rankings, including when the local player loses", () => {
  const s = ballot();
  assert.deepEqual(s.proposal.options, ["tea", "game", "cafe"]);
  const allies = ALLIANCES.trend.members.map((m) =>
    memberChoice(m.id, s.proposal.options),
  );
  assert.deepEqual(allies, ["tea", "game"]);
  for (const local of ["tea", "cafe"]) {
    const result = act(cast(s, [local, ...allies]), "CLOSE_VOTE");
    assert.equal(result.proposal.winner, "tea");
    assert.equal(result.proposal.tied, local === "cafe");
  }
});

test("the sushi unit can reopen as a hot pot restaurant with independent votes", () => {
  let s = act(createGame(), "PREFER", {
    preferences: ["hotpot", "market", "tea"],
  });
  s = act(s, "JOIN", { alliance: "collective" });
  s = invite(act(s, "CHALLENGE", { shopId: "unit02" }));
  s = act(s, "RESULT", {
    sessionId: s.sessionId,
    contestId: s.contest.id,
    shopId: "unit02",
    roundId: "sushi-rush",
    game: "rush",
    success: true,
  });
  s = act(s, "PROPOSE");
  assert.deepEqual(s.proposal.options, ["hotpot", "market", "tea"]);
  const allyVotes = ALLIANCES.collective.members.map((m) =>
    memberChoice(m.id, s.proposal.options),
  );
  const opened = act(
    act(cast(s, ["hotpot", ...allyVotes]), "CLOSE_VOTE"),
    "ADVANCE",
  );
  assert.equal(opened.shops.unit02.type, "hotpot");
  assert.equal(opened.shops.unit01.type, "donut");
});

test("the save reader restores old v1 ballots and every campaign phase", () => {
  const c = challenge();
  const rallied = act(c, "RALLY");
  assert.equal(act(rallied, "RALLY"), rallied);
  const b = ballot();
  const refit = act(cast(b), "CLOSE_VOTE");
  const oldBallot = ballot("comfort");
  oldBallot.proposal.options = ["tea", "game", "cafe"];
  const stages = [
    createGame(),
    joined(),
    rallied,
    rush(c, false),
    rush(c, true),
    rush(invite(c), true),
    b,
    oldBallot,
    act(b, "VOTE", { memberId: "player", choice: "game" }),
    refit,
    act(refit, "ADVANCE"),
  ];
  for (const state of stages) {
    const saved = readSave(
      JSON.stringify({ state, view: { scene: "shop", shopId: "unit02" } }),
      {},
    );
    assert.equal(saved.status, "ready");
    assert.deepEqual(saved.state, state);
    assert.equal(saved.view.shopId, "unit02");
  }
});

test("malformed worlds enter recovery while bad view references preserve a valid world", () => {
  assert.equal(readSave(null, {}).status, "empty");
  for (const raw of [
    "{",
    "null",
    '{"state":{"version":1,"shops":{"unit01":{}}},"view":{}}',
  ])
    assert.equal(readSave(raw, {}).status, "unreadable");
  const state = ballot();
  const saved = readSave(
    JSON.stringify({
      state,
      view: { scene: "invalid", loc: "nowhere", shopId: "gone" },
    }),
    {},
  );
  assert.equal(saved.status, "ready");
  assert.deepEqual(saved.state, state);
  assert.deepEqual(saved.view, {
    scene: "map",
    loc: null,
    shopId: "unit01",
    mapShopId: null,
    started: true,
    sound: true,
    territories: false,
  });
  for (const breakSave of [
    (s) => {
      delete s.shops.unit06;
    },
    (s) => {
      delete s.events;
    },
    (s) => {
      s.contest.shopId = "unknown";
    },
    (s) => {
      s.proposal.eligible[1] = "missing-ally";
    },
    (s) => {
      s.proposal = null;
    },
  ]) {
    const damaged = structuredClone(state);
    breakSave(damaged);
    assert.equal(
      readSave(JSON.stringify({ state: damaged }), {}).status,
      "unreadable",
    );
  }
});

test("street focus survives refresh and old saves return to the correct storefront", () => {
  const captured = rush(invite(challenge()), true);
  const loadView = (view, state = captured) => {
    const result = readSave(JSON.stringify({ state, view }), { central: true });
    assert.equal(result.status, "ready");
    assert.deepEqual(result.state, state);
    return result.view;
  };
  // Before street focus existed, a shop save contained only the unit being visited.
  assert.equal(
    loadView({ scene: "shop", shopId: "unit06" }).mapShopId,
    "unit06",
  );
  assert.equal(
    loadView({ scene: "shop", shopId: "unit02", mapShopId: "unit01" })
      .mapShopId,
    "unit02",
  );
  const map = { scene: "map", territories: true, shopId: "unit02" };
  assert.equal(loadView(map).mapShopId, captured.contest.shopId);
  assert.equal(loadView({ ...map, mapShopId: "unit05" }).mapShopId, "unit05");
  assert.equal(loadView({ ...map, mapShopId: null }).mapShopId, null);
  assert.equal(loadView({ ...map, mapShopId: "unknown" }).mapShopId, null);
  assert.equal(
    loadView({ ...map, mapShopId: "unit03", territories: false }).mapShopId,
    "unit03",
  );
  assert.equal(
    loadView({ ...map, mapShopId: "unit03", loc: "central" }).mapShopId,
    null,
  );
  assert.equal(
    loadView({ ...map, scene: "mall", mapShopId: "unit03" }).mapShopId,
    null,
  );
  assert.equal(loadView(map, joined()).mapShopId, null);
});

test("capture ownership remains on the original event after another challenge; a legacy ledger stays readable", () => {
  const opened = act(act(cast(ballot()), "CLOSE_VOTE"), "ADVANCE");
  const next = act(opened, "CHALLENGE", { shopId: "unit02" });
  assert.equal(next.contest.previousOwner, "comfort");
  const event = next.events.find((e) => e.kind === "capture");
  assert.deepEqual(
    [event.shopId, event.previousOwner, event.owner],
    ["unit01", "incumbent", "trend"],
  );

  const legacy = structuredClone(next);
  const old = legacy.events.find((e) => e.kind === "capture");
  delete old.previousOwner;
  delete old.owner;
  const record = readSave(JSON.stringify({ state: legacy }), {});
  assert.equal(record.status, "ready");
  assert.deepEqual(record.state, legacy);
  old.owner = "unknown";
  assert.equal(
    readSave(JSON.stringify({ state: legacy }), {}).status,
    "unreadable",
  );
});

test("each crew can finish its last rival refit and recover every unit from the save", () => {
  for (const alliance of Object.keys(ALLIANCES)) {
    let s = joined(alliance);
    const rivals = Object.values(s.shops).filter(
      (shop) => shop.owner !== alliance,
    );
    for (const shop of rivals) {
      s = invite(act(s, "CHALLENGE", { shopId: shop.id }));
      s = act(s, "RESULT", {
        shopId: shop.id,
        sessionId: s.sessionId,
        contestId: s.contest.id,
        roundId: "rush-" + shop.id,
        game: "rush",
        success: true,
      });
      s = act(s, "PROPOSE");
      assert.ok(!s.proposal.options.includes(shop.type));
      const p = s.proposal;
      const choices = [
        p.options.at(-1),
        ...ALLIANCES[alliance].members.map((m) =>
          memberChoice(m.id, p.options),
        ),
      ];
      s = act(act(cast(s, choices), "CLOSE_VOTE"), "ADVANCE");
      const loaded = readSave(JSON.stringify({ state: s }), {});
      assert.equal(loaded.status, "ready");
      s = loaded.state;
    }
    assert.equal(s.day, 1 + rivals.length);
    assert.equal(s.history.length, rivals.length);
    assert.equal(s.results.length, rivals.length);
    assert.ok(Object.values(s.shops).every((shop) => shop.owner === alliance));
    assert.equal(act(s, "ADVANCE"), s);
  }
});
