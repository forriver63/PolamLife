/* Run against a local server or set DEMO_URL to the offline presentation entry. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");

async function run() {
  const executablePath = process.env.CHROME_PATH || undefined;
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    locale: "en-US",
    viewport: { width: 1366, height: 768 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6500);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const dialog = page.getByRole("dialog");
  const scope = async () => (await dialog.count()) ? dialog : page;
  const act = async (id) => {
    await (await scope()).locator('[data-do="' + id + '"]:visible').first().click();
  };
  const lang = () => page.locator("html").getAttribute("lang");
  const switchTo = async (language) => {
    if (await lang() !== language) {
      await (await scope()).locator("[data-language-switch]:visible").click();
    }
    await page.waitForFunction((code) => document.documentElement.lang === code, language);
  };
  const world = () => page.evaluate(() => JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")).state);
  async function chinese(locator, stage) {
    const lines = (await locator.allInnerTexts()).join("\n").split("\n").map((line) =>
      // People, the language-switch caption, and the masthead are proper names.
      line.replace(/\b(?:Mina|Kit|Wai|June|Lok|Yan|English|EN|PolamLife|MCP|PL)\b/gi, ""),
    );
    assert.deepEqual(lines.filter((line) => /[a-z]{2,}/i.test(line)), [], stage + " left visible English");
  }
  async function serveChineseTicket() {
    const ticket = await page.locator("[data-prompt]").innerText();
    assert.match(ticket, /[\u3400-\u9fff]/, "The order must be readable in Chinese");
    await page.getByRole("button", { name: "递上" + ticket, exact: true }).click();
  }
  const influence = page.locator(".w-board > svg.w-territories");
  const legend = page.locator(".w-territory-key");
  const marker = (id) => page.locator('.w-map [data-location="' + id + '"]');
  const region = (id) => page.locator('[data-region="' + id + '"]');
  const door = (area, id) => region(area).locator('button[data-shop="' + id + '"]');
  const centralStore = door("central", "unit01");

  async function enterRegion(id) {
    await marker(id).press("Enter");
    await region(id).waitFor();
  }

  async function revisitTarget(phase, centralCount) {
    await act("map");
    await influence.waitFor();
    const state = await world();
    const districtCount = Object.values(state.shops).filter((shop) => shop.owner === "trend").length;
    assert.equal(await legend.locator("[data-owned-count]").innerText(), districtCount + " / 21");
    assert.equal(await marker("central").locator("[data-location-count]").innerText(), centralCount + " / 6");
    await enterRegion("central");
    assert.equal(await region("central").locator("button[data-shop]").count(), 6);
    assert.equal((await world()).visits.unit01, state.visits.unit01);
    assert.equal(await centralStore.getAttribute("data-phase"), phase);
    assert.equal(await centralStore.getAttribute("data-owner"), centralCount === 1 ? "incumbent" : "trend");
    assert.equal(await region("central").locator("[data-region-count]").innerText(), centralCount + " / 6");
    const label = await centralStore.getAttribute("aria-label");
    assert.match(label, /[\u3400-\u9fff]/);
    assert.doesNotMatch(label, /[a-z]{2,}/i);
    const expectedArt = phase === "reopened" ? "tea" : phase === "contested" ? "donut" : "renovating";
    const background = await centralStore.evaluate((button) => button.style.backgroundImage);
    assert.ok(background.includes("front-" + expectedArt + ".webp"), phase + " should display the matching facade");
    if (phase === "renovating") {
      await switchTo("en");
      assert.match(await centralStore.getAttribute("aria-label"), /Glaze Lane/);
      await switchTo("zh-CN");
      await page.reload();
      await centralStore.waitFor();
      await chinese(region("central").locator("button[data-shop]"), "Storefronts after Chinese reload");
      assert.match(await centralStore.getAttribute("aria-label"), /糖霜小巷/);
      assert.equal(await centralStore.getAttribute("data-phase"), phase);
    }
    await centralStore.press("Enter");
    await page.locator('.w-shop[data-unit="unit01"]').waitFor();
    assert.equal((await world()).visits.unit01, state.visits.unit01 + 1);
  }

  try {
    await page.goto(process.env.DEMO_URL || "http://127.0.0.1:4173/");
    await page.locator('[data-do="start"]').waitFor();
    await switchTo("en");
    assert.match(await page.locator(".scene-card").innerText(), /Welcome to/);
    await switchTo("zh-CN");
    await page.reload();
    await page.locator('[data-do="start"]').waitFor();
    assert.equal(await lang(), "zh-CN", "A language choice made before starting must persist");
    await chinese(page.locator(".scene-card, .rail, .world-top, .statusbar"), "Welcome");

    await act("start");
    await act("prefs");
    await chinese(dialog, "Preference ballot");
    await page.getByRole("button", { name: /奶茶店/ }).click();
    await switchTo("en");
    const tea = page.locator('[data-choice="tea"]');
    assert.equal(await tea.getAttribute("aria-pressed"), "true");
    assert.match(await tea.innerText(), /Bubble Tea Shop/);
    await switchTo("zh-CN");
    await page.getByRole("button", { name: /电玩店/ }).click();
    await page.getByRole("button", { name: /咖啡店/ }).click();
    await act("match");
    await chinese(dialog, "Alliance recommendation");
    await act("join");
    assert.deepEqual((await world()).player.preferences, ["tea", "game", "cafe"]);
    await influence.waitFor();
    assert.match(await influence.getAttribute("aria-label"), /宝琳|商段|影响/);
    assert.equal(await legend.getAttribute("aria-label"), "商铺影响图例");
    const details = legend.locator("details");
    if (!await details.evaluate((node) => node.open)) await legend.locator("summary").click();
    assert.equal(await details.evaluate((node) => node.open), true, "The legend must expand on click");
    await chinese(legend, "District influence legend");
    const factionCounts = await legend.locator("li[data-faction]").evaluateAll((rows) =>
      Object.fromEntries(rows.map((row) => [row.dataset.faction, Number(row.querySelector("b").textContent)])),
    );
    const initialState = await world();
    const regionalTotals = {};
    for (const shop of Object.values(initialState.shops))
      regionalTotals[shop.owner] = (regionalTotals[shop.owner] || 0) + 1;
    assert.deepEqual(factionCounts, regionalTotals);
    assert.equal(Object.keys(initialState.shops).length, 21);
    assert.equal(await page.locator(".w-map button[data-location]").count(), 6);
    assert.match(await legend.locator("[data-owned-count]").innerText(), /5 \/ 21/);
    await switchTo("en");
    assert.match(await influence.getAttribute("aria-label"), /Po Lam|district|street/i);
    assert.equal(await legend.getAttribute("aria-label"), "Shop influence legend");
    assert.equal(await details.evaluate((node) => node.open), true, "Switching languages must keep the legend open");
    assert.match(await marker("station").getAttribute("aria-label"), /station/i);
    await switchTo("zh-CN");
    await legend.locator("summary").click();
    assert.match(await marker("station").getAttribute("aria-label"), /宝琳站/);
    for (const id of ["park", "station", "estate", "discovery", "one"]) {
      const areaName = await marker(id).getAttribute("aria-label");
      assert.match(areaName, /[\u3400-\u9fff]/);
      await enterRegion(id);
      assert.equal(await region(id).getAttribute("aria-label"), areaName);
      const doors = region(id).locator("button[data-shop]");
      assert.equal(await doors.count(), 3);
      await chinese(region(id), areaName + " and its three storefronts");
      for (const button of await doors.all()) {
        const label = await button.getAttribute("aria-label");
        assert.doesNotMatch(label, /[a-z]{2,}/i);
        const shopId = await button.getAttribute("data-shop");
        assert.equal(initialState.shops[shopId].location, id);
      }
      const first = doors.first();
      const shopId = await first.getAttribute("data-shop");
      await first.press("Enter");
      await page.locator('.w-shop[data-unit="' + shopId + '"]').waitFor();
      await chinese(page.locator(".scene-card, .world-top, .statusbar"), areaName + " shop interior");
      await act("returnToStreet");
      assert.equal(await first.getAttribute("aria-current"), "true");
      await act("map");
    }
    await enterRegion("central");
    await chinese(page.locator("[data-shop]"), "Six storefronts");
    await page.locator('[data-shop="unit01"]').click();
    await act("scout");
    await chinese(dialog, "Scouting");
    await act("challenge");
    await act("close");
    await revisitTarget("contested", 1);
    await act("contest");
    await act("invite");
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")).state.contest.participants.length === 3,
    );
    await chinese(dialog, "Crew arrivals");
    await act("rush");
    await chinese(dialog, "Rush briefing");
    await page.locator("[data-round-start]").click();
    await serveChineseTicket();
    await page.waitForFunction(() => parseInt(document.querySelector("[data-time]").innerText) < 28);
    const time = page.locator("[data-time]");
    const remaining = parseInt(await time.innerText());
    const progress = page.locator("[data-progress]");
    const board = page.locator(".rg-board");
    const order = await board.getAttribute("data-order");
    assert.match(await progress.innerText(), /^1\s*\/\s*5$/);
    await switchTo("en");
    assert.match(await page.locator("[data-prompt]").innerText(), /Berry ring|Cocoa crunch|Lemon glaze/);
    assert.equal(await board.getAttribute("data-order"), order);
    assert.equal(await board.getAttribute("data-phase"), "play");
    assert(parseInt(await time.innerText()) <= remaining, "Switching language restarted the clock");
    await switchTo("zh-CN");
    assert.equal(await board.getAttribute("data-order"), order);
    assert.match(await progress.innerText(), /^1\s*\/\s*5$/);
    await chinese(dialog, "Live rush");
    for (let i = 0; i < 4; i++) await serveChineseTicket();
    await dialog.locator('[data-do="propose"]').waitFor();
    await chinese(dialog, "Takeover result");
    await act("territoryMap");
    await enterRegion("central");
    await centralStore.waitFor();
    assert.equal(await centralStore.getAttribute("data-phase"), "captured");
    const capturedLabel = await centralStore.getAttribute("aria-label");
    assert.match(capturedLabel, /已占领/);
    assert.doesNotMatch(capturedLabel, /Captured|closed/i);
    await chinese(centralStore, "Captured storefront");
    await centralStore.press("Enter");
    await page.locator(".w-shop").waitFor();
    await act("propose");
    await chinese(dialog, "Ballot choices and resident preferences");
    await page.getByRole("button", { name: /奶茶店/ }).click();
    await switchTo("en");
    assert.equal(await page.locator("[data-vote]:disabled").count(), 3);
    assert.equal((await world()).proposal.votes.player, "tea");
    await switchTo("zh-CN");
    await dialog.locator('[data-do="count"]').waitFor();
    assert.deepEqual((await world()).proposal.votes, { player: "tea", mina: "tea", kit: "game" });
    await chinese(dialog, "Completed ballots");
    await act("close");
    await revisitTarget("voting", 2);
    await act("voting");
    await act("count");
    await chinese(page.locator(".scene-card"), "Renovation");
    await revisitTarget("renovating", 2);
    await page.reload();
    await page.locator('[data-do="advance"]').waitFor();
    assert.equal(await lang(), "zh-CN");
    assert.equal((await world()).shops.unit01.phase, "renovating");
    await act("advance");
    assert.equal((await world()).day, 2);
    assert.equal((await world()).shops.unit01.type, "tea");
    await chinese(page.locator(".scene-card, .opening-ribbon"), "Opening day");
    await revisitTarget("reopened", 2);
    await act("daily");
    await chinese(dialog, "Newspaper and saved events");
    assert.match(await dialog.innerText(), /珍珠茶社/);
    assert.match(await dialog.innerText(), /糖霜小巷/);
    await switchTo("en");
    assert.match(await dialog.innerText(), /Pearl Club opens its doors/);
    await switchTo("zh-CN");
    await act("close");
    await act("insights");
    await chinese(dialog, "Merchant insights, unit visits and refit history");
    assert.match(await dialog.innerText(), /糖霜小巷\s*→\s*珍珠茶社/);
    await act("close");

    await act("manage");
    await act("emergency");
    await chinese(dialog, "Service relay briefing");
    const defense = (await world()).shops.unit01.defense;
    await page.locator("[data-round-start]").click();
    for (const length of [2, 3, 4]) {
      const sequence = [];
      for (let cue = 1; cue <= length; cue++) {
        const signal = page.locator("[data-detail]").filter({
          hasText: new RegExp("^第 " + cue + " 步 · "),
        });
        await signal.waitFor();
        sequence.push((await signal.innerText()).split(" · ")[1]);
      }
      await dialog.getByText("轮到你了", { exact: true }).waitFor();
      for (const station of sequence)
        await dialog.getByRole("button", { name: "操作" + station, exact: true }).click();
    }
    await dialog.locator('[data-do="close"].btn').waitFor();
    assert.equal((await world()).shops.unit01.defense, defense + 1);
    await chinese(dialog, "Friendly shop shift result");
    await act("close");

    // Play a complete second takeover with this location's own shop, products and ballot.
    await act("returnToStreet");
    await region("central").waitFor();
    await act("map");
    await enterRegion("park");
    const lemon = door("park", "unit07");
    assert.match(await region("park").getAttribute("aria-label"), /宝翠公园/);
    await chinese(region("park"), "Park and its three local traders");
    assert.match(await lemon.innerText(), /柠檬跑圈/);
    assert.match(await door("park", "unit08").innerText(), /纸燕风筝/);
    assert.match(await door("park", "unit09").innerText(), /球场轮社/);
    await lemon.click();
    await page.locator('.w-shop[data-unit="unit07"]').waitFor();
    await act("scout");
    await act("challenge");
    await act("invite");
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")).state.contest.participants.length === 3);
    await act("rush");
    await chinese(dialog, "Lemonade stall rush");
    await page.locator("[data-round-start]").click();
    for (let i = 0; i < 5; i++) {
      const order = await page.locator("[data-prompt]").innerText();
      assert.match(order, /^(柠檬汽水|红西柚汽水|青柠冰饮)$/);
      await serveChineseTicket();
    }
    await dialog.locator('[data-do="territoryMap"]').waitFor();
    await act("territoryMap");
    assert.equal(await marker("park").locator("[data-location-count]").innerText(), "2 / 3");
    assert.equal(await marker("central").locator("[data-location-count]").innerText(), "2 / 6");
    await enterRegion("park");
    assert.equal(await lemon.getAttribute("data-phase"), "captured");
    await lemon.click();
    await act("propose");
    await chinese(dialog, "Park ballot and named allies");
    assert.deepEqual(await dialog.locator("[data-vote]").evaluateAll((options) => options.map((button) => button.dataset.vote)), ["kite", "skate"]);
    await dialog.locator('[data-vote="kite"]').click();
    await dialog.locator('[data-do="count"]').waitFor();
    await act("count");
    await act("advance");
    await act("returnToStreet");
    await page.reload();
    await lemon.waitFor();
    assert.equal(await lemon.getAttribute("data-type"), "kite");
    assert.match(await lemon.innerText(), /纸燕风筝/);
    assert.equal(await lemon.getAttribute("aria-current"), "true");
    await act("daily");
    await chinese(dialog, "Park opening news and capture ledger");
    assert.match(await dialog.innerText(), /宝翠公园/);
    await act("close");
    await act("insights");
    await chinese(dialog, "Insights after visiting two regions");
    await act("close");

    await act("settings");
    await act("confirmReset");
    await act("reset");
    await page.reload();
    await page.locator('[data-do="start"]').waitFor();
    assert.equal(await lang(), "zh-CN", "A new game must retain the language setting");
    assert.equal((await world()).day, 1);
    await switchTo("en");
    await page.reload();
    await page.locator('[data-do="start"]').waitFor();
    assert.equal(await lang(), "en");
    assert.match(await page.locator(".scene-card").innerText(), /Welcome to/);
    assert.deepEqual(errors, []);
    console.log("Passed bilingual six-area navigation, two regional campaigns, localized live orders and ballots, service relay, saved refits, current-area shop news, insights and reset.");
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
