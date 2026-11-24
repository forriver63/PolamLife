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
  const donutUnit = influence.locator('[data-territory-unit="unit01"]');
  async function revisitTarget(phase, ownedCount) {
    await act("map");
    await influence.waitFor();
    assert.equal(await donutUnit.getAttribute("data-phase"), phase);
    assert.equal(await legend.locator("[data-owned-count]").getAttribute("data-owned-count"), String(ownedCount));
    assert.equal(await donutUnit.getAttribute("data-owner"), ownedCount === 1 ? "incumbent" : "trend");
    const label = await donutUnit.getAttribute("aria-label");
    assert.match(label, /[\u3400-\u9fff]/);
    assert.doesNotMatch(label, /[a-z]{2,}/i);
    if (ownedCount === 2) assert.match(label, /最近占领/);
    await donutUnit.focus();
    await page.keyboard.press("Enter");
    await page.locator(".w-shop").waitFor();
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
    assert.equal(await influence.getAttribute("aria-label"), "宝琳商铺影响范围示意");
    assert.equal(await legend.getAttribute("aria-label"), "商铺影响图例");
    const details = legend.locator("details");
    if (!await details.evaluate((node) => node.open)) await legend.locator("summary").click();
    assert.equal(await details.evaluate((node) => node.open), true, "The legend must expand on click");
    await chinese(legend, "District influence legend");
    const factionCounts = await legend.locator("li[data-faction]").evaluateAll((rows) =>
      Object.fromEntries(rows.map((row) => [row.dataset.faction, Number(row.querySelector("b").textContent)])),
    );
    assert.deepEqual(factionCounts, { trend: 1, comfort: 2, collective: 2, incumbent: 1 });
    await switchTo("en");
    assert.equal(await influence.getAttribute("aria-label"), "Illustrative shop influence areas in Po Lam");
    assert.equal(await legend.getAttribute("aria-label"), "Shop influence legend");
    assert.equal(await details.evaluate((node) => node.open), true, "Switching languages must keep the legend open");
    assert.match(await donutUnit.getAttribute("aria-label"), /Glaze Lane/);
    await switchTo("zh-CN");
    await legend.locator("summary").click();
    assert.match(await donutUnit.getAttribute("aria-label"), /糖霜小巷/);
    await act("mall");
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
    console.log("Passed bilingual preferences, live rush, service relay, ballot, persistent renovation, next-day news, insights and new game.");
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
