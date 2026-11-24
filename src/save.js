import { ALLIANCES, TYPES, RULES } from "./game.js";

const shopIds = ["unit01", "unit02", "unit03", "unit04", "unit05", "unit06"];
const phases = [
  "open",
  "contested",
  "captured",
  "voting",
  "renovating",
  "reopened",
];
const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const integer = (value, min = 0) => Number.isSafeInteger(value) && value >= min;
const knownType = (value) =>
  typeof value === "string" && Object.hasOwn(TYPES, value);
const hasTeam = (id) => typeof id === "string" && Object.hasOwn(ALLIANCES, id);
const knownOwner = (id) => id === "incumbent" || hasTeam(id);
const list = (value, check) => Array.isArray(value) && value.every(check);
const unique = (values) => values.length === new Set(values).size;
const validShop = (id) => shopIds.includes(id);
const text = (value) => typeof value === "string" && value.length > 0;

function validRefit(refit) {
  return (
    record(refit) &&
    validShop(refit.shopId) &&
    knownType(refit.fromType) &&
    knownType(refit.toType) &&
    refit.fromType !== refit.toType &&
    integer(refit.startDay, 1) &&
    integer(refit.readyDay, refit.startDay + 1) &&
    typeof refit.complete === "boolean"
  );
}

function validCampaign(world) {
  const { contest, proposal, renovation, player, shops } = world;
  const pending = Object.values(shops).filter(
    (s) => !["open", "reopened"].includes(s.phase),
  );
  if (contest === null)
    return !pending.length && proposal === null && renovation === null;
  if (
    !record(contest) ||
    !text(contest.id) ||
    !validShop(contest.shopId) ||
    !hasTeam(contest.alliance) ||
    contest.alliance !== player.alliance ||
    !["open", "reopened"].includes(contest.previousPhase) ||
    !knownOwner(contest.previousOwner) ||
    typeof contest.wonRush !== "boolean"
  )
    return false;
  const members = [
    player.id,
    ...ALLIANCES[player.alliance].members.map((m) => m.id),
  ];
  if (
    !list(contest.participants, (id) => members.includes(id)) ||
    !unique(contest.participants) ||
    !contest.participants.includes(player.id) ||
    pending.some((s) => s.id !== contest.shopId)
  )
    return false;
  const shop = shops[contest.shopId];
  if (contest.status === "active" || contest.status === "defended") {
    const phase =
      contest.status === "active" ? "contested" : contest.previousPhase;
    return (
      shop.phase === phase &&
      shop.owner === contest.previousOwner &&
      proposal === null &&
      renovation === null
    );
  }
  if (
    contest.status !== "won" ||
    !contest.wonRush ||
    shop.owner !== player.alliance ||
    contest.participants.length < RULES.minParticipants
  )
    return false;
  if (proposal === null)
    return shop.phase === "captured" && renovation === null;
  if (
    !record(proposal) ||
    !text(proposal.id) ||
    proposal.shopId !== shop.id ||
    !list(proposal.options, knownType) ||
    proposal.options.length !== RULES.proposalCount ||
    !unique(proposal.options) ||
    !list(proposal.eligible, (id) => members.includes(id)) ||
    proposal.eligible.length !== members.length ||
    !unique(proposal.eligible) ||
    !record(proposal.votes) ||
    !Object.entries(proposal.votes).every(
      ([id, type]) => members.includes(id) && proposal.options.includes(type),
    )
  )
    return false;
  if (proposal.winner === null)
    return shop.phase === "voting" && renovation === null;
  return (
    proposal.options.includes(proposal.winner) &&
    Object.keys(proposal.votes).length === members.length &&
    validRefit(renovation) &&
    renovation.shopId === shop.id &&
    renovation.toType === proposal.winner &&
    (renovation.complete
      ? shop.phase === "reopened" && shop.type === renovation.toType
      : shop.phase === "renovating" && shop.type === renovation.fromType)
  );
}

function validWorld(world) {
  if (
    !record(world) ||
    world.version !== 1 ||
    !text(world.sessionId) ||
    !integer(world.day, 1)
  )
    return false;
  const { player, shops, visits } = world;
  if (
    !record(player) ||
    player.id !== "player" ||
    !(player.alliance === null || hasTeam(player.alliance)) ||
    !list(player.preferences, knownType) ||
    !record(shops) ||
    !record(visits) ||
    Object.keys(shops).length !== shopIds.length ||
    Object.keys(visits).length !== shopIds.length
  )
    return false;
  if (
    !shopIds.every((id) => {
      const s = shops[id];
      return (
        record(s) &&
        s.id === id &&
        knownType(s.type) &&
        phases.includes(s.phase) &&
        knownOwner(s.owner) &&
        integer(s.defense) &&
        s.defense <= RULES.maxDefense &&
        (s.staff === undefined || list(s.staff, text)) &&
        integer(visits[id])
      );
    })
  )
    return false;
  return (
    list(
      world.events,
      (e) =>
        record(e) &&
        text(e.kind) &&
        text(e.text) &&
        integer(e.day, 1) &&
        (e.kind !== "capture" ||
          (validShop(e.shopId) &&
            (e.previousOwner === undefined || knownOwner(e.previousOwner)) &&
            (e.owner === undefined || hasTeam(e.owner)))),
    ) &&
    list(
      world.results,
      (r) => record(r) && text(r.roundId) && validShop(r.shopId),
    ) &&
    list(world.history, (h) => validRefit(h) && h.complete) &&
    validCampaign(world)
  );
}

export function initialView() {
  return {
    scene: "map",
    shopId: "unit01",
    mapShopId: null,
    loc: null,
    started: false,
    territories: false,
    sound: true,
  };
}

export function readSave(raw, areas) {
  if (raw === null) return { status: "empty" };
  try {
    const data = JSON.parse(raw);
    if (!validWorld(data?.state)) return { status: "unreadable" };
    const source = record(data.view) ? data.view : {};
    const view = initialView();
    if (["map", "mall", "shop"].includes(source.scene))
      view.scene = source.scene;
    if (validShop(source.shopId)) view.shopId = source.shopId;
    if (
      view.scene === "map" &&
      typeof source.loc === "string" &&
      Object.hasOwn(areas, source.loc)
    )
      view.loc = source.loc;
    for (const key of ["started", "territories", "sound"])
      if (typeof source[key] === "boolean") view[key] = source[key];
    if (view.scene === "shop") {
      // The actual unit is enough to recover the return route from an older v1 save.
      view.mapShopId = view.shopId;
    } else if (view.scene === "map" && !view.loc) {
      if (validShop(source.mapShopId)) {
        view.mapShopId = source.mapShopId;
      } else if (
        view.territories &&
        !Object.hasOwn(source, "mapShopId") &&
        data.state.contest?.status === "won"
      ) {
        // Older capture views recorded the campaign and unit, but no map selection.
        const captured = data.state.shops[data.state.contest.shopId];
        if (["captured", "voting", "renovating"].includes(captured.phase))
          view.mapShopId = captured.id;
      }
    }
    view.started ||=
      !!view.mapShopId || !!data.state.player.alliance || view.scene !== "map";
    return { status: "ready", state: data.state, view };
  } catch {
    return { status: "unreadable" };
  }
}
