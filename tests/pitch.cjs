/* Run node tests/pitch.cjs against a running local demo. See docs/qa.md for options. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");
const url = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const dir =
  process.env.SCREENSHOT_DIR || path.join(__dirname, "../test-results/screenshots");
const draft = process.argv.includes("--draft");
const baseSize = { width: 1440, height: 900 };
const laptop = { width: 1366, height: 768 };
const wide = { width: 1920, height: 1080 };
const phone = { width: 390, height: 844 };
const desktopSizes = [laptop, wide, baseSize];
async function run() {
  const executablePath = process.env.CHROME_PATH || undefined;
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({
    viewport: baseSize,
    deviceScaleFactor: 1,
  });
  const errors = new Set();
  page.on("pageerror", (e) => errors.add(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.add(r.status() + " " + r.url());
  });
  page.setDefaultTimeout(6000);
  const saved = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")),
    );
  const world = async () => (await saved()).state;
  const act = async (id) => {
    const dialog = page.getByRole("dialog");
    const scope = (await dialog.count()) ? dialog : page;
    await scope
      .locator('[data-do="' + id + '"]:visible')
      .first()
      .click();
  };
  async function snap(name, sizes = [baseSize]) {
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForFunction(() =>
        [...document.images].every((i) => i.complete),
      );
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      // Let entrance animations and Chromium's resized compositor surface settle.
      await page.waitForTimeout(360);
      if (!draft) {
        const broken = await page.evaluate(() =>
          [...document.images]
            .filter((i) => !i.naturalWidth)
            .map((i) => i.currentSrc),
        );
        assert.deepEqual(broken, [], name + " has broken images");
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      assert.equal(
        overflow,
        false,
        "Viewport overflows at " + name + "/" + size.width,
      );
      const label =
        name + (size.width === baseSize.width ? "" : "-" + size.width);
      await page.screenshot({
        path: path.join(dir, label + ".jpg"),
        type: "jpeg",
        quality: 88,
      });
    }
    console.log("Captured " + name);
  }

  async function startChallenge() {
    await act("scout");
    await act("challenge");
  }
  async function playRush(win) {
    await act("rush");
    assert.equal(await page.locator("[data-time]").innerText(), win ? "29s" : "25s");
    await page.locator("[data-round-start]").click();
    if (win) {
      await snap("07-shop-competition");
      const ticket = await page.locator("[data-prompt]").innerText();
      const wrong = page.locator(".rg-choice").filter({ hasNotText: ticket }).first();
      await wrong.click();
      assert.match(await page.locator("[data-crew]").innerText(), /Mina caught a wrong order/);
      assert.equal(await page.locator("[data-strikes] .rg-lost").count(), 0);
      await wrong.click();
      assert.equal(await page.locator("[data-strikes] .rg-lost").count(), 1);
    }
    const board = page.locator(".rg-board");
    for (
      let n = 0;
      n < 10 && (await board.getAttribute("data-phase")) === "play";
      n++
    ) {
      const text = await page.locator("[data-prompt]").innerText();
      const correct = page.getByRole("button", {
        name: "Serve " + text,
        exact: true,
      });
      if (win) await correct.click();
      else {
        const options = page.locator(".rg-choice");
        for (const b of await options.all()) {
          if ((await b.getAttribute("aria-label")) !== "Serve " + text) {
            await b.click();
            break;
          }
        }
      }
    }
    await page
      .getByRole("dialog")
      .getByRole("heading", {
        name: win ? "Territory secured!" : "The shop held on",
        exact: true,
      })
      .waitFor();
  }

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator('[data-do="start"]').waitFor();
    await snap("01-opening", desktopSizes);
    await act("start");
    assert.equal((await saved()).view.shopId, "unit01");
    await snap("06-donut-shop");
    await act("prefs");
    for (const type of ["tea", "game", "cafe"])
      await page.locator('[data-choice="' + type + '"]').click();
    await snap("02-preferences", desktopSizes);
    await act("match");
    const best = page.locator("[data-team]").first();
    assert.equal(await best.getAttribute("data-team"), "trend");
    await snap("03-alliance-selection");
    await best.click();
    await act("join");
    assert.equal((await world()).player.alliance, "trend");
    if ((await saved()).view.scene !== "map") await act("map");
    const map = page.locator(".w-map");
    const transform = () =>
      map.locator(".w-board").evaluate((el) => el.style.transform);
    await map.locator(".w-art").evaluate((img) => img.decode());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const initialCamera = await transform();
    await map.focus();
    await page.keyboard.press("=");
    assert.notEqual(await transform(), initialCamera);
    await page.keyboard.press("=");
    const zoomed = await transform();
    await page.keyboard.press("ArrowRight");
    assert.notEqual(await transform(), zoomed);
    await page.keyboard.press("Home");
    assert.equal(await transform(), initialCamera);
    const territories = map.locator("svg.w-territories");
    const holdings = map.locator("[data-owned-count]");
    const claim = map.locator('[data-territory-unit="unit01"]');
    const otherParcels = () => map.locator('[data-territory-unit]:not([data-territory-unit="unit01"])')
      .evaluateAll((lots) => lots.map(lot => [lot.dataset.territoryUnit, lot.dataset.owner, lot.getAttribute("fill")]));
    await territories.waitFor();
    assert.equal(await map.locator("[data-location]").count(), 6);
    assert.equal(await map.locator("[data-territory-unit]").count(), 21);
    const initialOwned = Object.values((await world()).shops).filter(shop => shop.owner === "trend").length;
    assert.equal(await holdings.getAttribute("data-owned-count"), String(initialOwned));
    const initialOthers = await otherParcels();
    const originalFill = await claim.getAttribute("fill");
    await snap("04-district-map", desktopSizes);
    await act("layers");
    assert.equal(await territories.count(), 0);
    const place = map.locator('[data-location="central"]');
    await place.click();
    assert.equal(await page.locator("[data-shop]").count(), 6);
    await snap("05-mall-atrium", desktopSizes);
    await page.locator('[data-shop="unit01"]').click();
    await startChallenge();
    await playRush(false);
    const defended = await world();
    assert.equal(defended.contest.status, "defended");
    assert.equal(defended.shops.unit01.owner, "incumbent");
    assert.equal(defended.shops.unit01.phase, "open");
    await act("close");
    await act("returnToStreet");
    const originalDoor = page.locator('[data-shop="unit01"]');
    assert.equal(await originalDoor.getAttribute("data-phase"), "open");
    await originalDoor.click();
    await startChallenge();
    await act("invite");
    await page.getByText("Crew assembled", { exact: true }).waitFor();
    assert.equal(new Set((await world()).contest.participants).size, 3);
    await playRush(true);
    assert.equal((await world()).shops.unit01.owner, "trend");
    await act("territoryMap");
    await territories.waitFor();
    assert.equal(await holdings.getAttribute("data-owned-count"), String(initialOwned + 1));
    assert.equal(await claim.getAttribute("data-owner"), "trend");
    assert.equal(await claim.getAttribute("data-phase"), "captured");
    assert.equal(await claim.getAttribute("data-latest-capture"), "");
    assert.notEqual(await claim.getAttribute("fill"), originalFill);
    assert.deepEqual(await otherParcels(), initialOthers, "A capture must affect only this particular shop");
    await snap("15-territory-capture", desktopSizes);
    const languageToggle = page.locator("header.mast [data-language-switch]");
    await languageToggle.click();
    assert.match(await claim.locator("title").textContent(), /糖霜小巷/);
    await snap("16-territory-zh", [phone, baseSize]);
    await languageToggle.click();
    await place.click();
    assert.equal(await page.locator("[data-region-count]").innerText(), "2 / 6");
    await originalDoor.click();
    await act("propose");
    await page.locator('[data-vote="tea"]').click();
    await page.locator('[data-do="count"]').waitFor();
    assert.equal(await page.locator("[data-vote]:disabled").count(), 3);
    await snap("08-alliance-voting");
    await act("count");
    assert.equal((await world()).proposal.winner, "tea");
    await snap("09-renovation");
    const beforeRefresh = await saved();
    assert.equal(beforeRefresh.state.shops.unit01.phase, "renovating");
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual((await saved()).state, beforeRefresh.state);
    await act("advance");
    assert.equal((await world()).day, 2);
    assert.equal((await world()).shops.unit01.type, "tea");
    assert.equal((await world()).history.length, 1);
    await snap("10-grand-opening", desktopSizes);
    await act("returnToStreet");
    assert.equal(await originalDoor.getAttribute("data-phase"), "reopened");
    assert.match(await originalDoor.innerText(), /Pearl Club/);
    await originalDoor.click();
    await act("daily");
    assert.match(
      await page.locator(".cn-lead").innerText(),
      /Pearl Club opens/,
    );
    await snap("12-po-lam-daily");
    await act("close");
    await act("insights");
    const ledger = page.getByRole("dialog");
    assert.match(await ledger.innerText(), /Simulated allies/);
    assert.match(await ledger.innerText(), /Glaze Lane → Pearl Club/);
    await snap("11-merchant-insights", desktopSizes);
    await act("close");
    await act("mall");
    const newFront = page.locator('[data-shop="unit01"]');
    assert.equal(await newFront.getAttribute("data-type"), "tea");
    assert.match(await newFront.innerText(), /Pearl Club/);
    assert.equal(await newFront.locator(".w-bunting").count(), 0);
    await snap("13-reopened-atrium");
    await newFront.click();
    assert.equal(await page.locator(".w-interior-bunting").count(), 0);
    await act("manage");
    await act("decorate");
    assert.equal(await page.locator(".w-interior-bunting").count(), 1);
    await act("mall");
    assert.equal(await newFront.locator(".w-bunting").count(), 1);
    await page.locator('[data-shop="unit03"]').click();
    await act("manage");
    await act("emergency");
    const oldDefense = (await world()).shops.unit03.defense;
    await page.locator("[data-round-start]").click();
    // Observe each visible station cue, then reproduce it through the player's controls.
    for (const length of [2, 3, 4]) {
      const sequence = [];
      for (let n = 1; n <= length; n++) {
        const detail = page
          .locator("[data-detail]")
          .filter({ hasText: new RegExp("^" + n + " · ") });
        await detail.waitFor();
        sequence.push((await detail.innerText()).split(" · ")[1]);
      }
      await page.getByText("Your turn", { exact: true }).waitFor();
      for (const label of sequence)
        await page
          .getByRole("button", { name: "Activate " + label, exact: true })
          .click();
    }
    await page
      .getByRole("heading", { name: "Shift complete!", exact: true })
      .waitFor();
    assert.equal((await world()).shops.unit03.defense, oldDefense + 1);
    await act("close");
    await act("manage");
    await act("decorate");
    assert((await world()).shops.unit03.decorated);
    await act("mall");
    await page.locator('[data-shop="unit02"]').click();
    await act("scout");
    assert.match(await page.getByRole("dialog").innerText(), /Roll Call/);
    await act("close");
    await act("map");
    assert.equal(await claim.getAttribute("data-phase"), "reopened");
    assert.match(await claim.locator("title").textContent(), /Pearl Club/);
    await snap("14-updated-district");
    await act("settings");
    await act("director");
    assert(await page.locator('[data-do="advance"]').isDisabled());
    await act("close");
    await act("settings");
    await act("confirmReset");
    await act("reset");
    await page.locator('[data-do="start"]').waitFor();
    const reset = await saved();
    if (reset) {
      assert.equal(reset.state.day, 1);
      assert.equal(reset.state.player.alliance, null);
      assert.equal(reset.state.shops.unit01.type, "donut");
      assert.equal(reset.state.events.length, 1);
    }
    await page.reload();
    await page.locator('[data-do="start"]').waitFor();
    if (draft && errors.size) console.warn([...errors]);
    else assert.deepEqual([...errors], [], "Browser diagnostics");
    console.log(
      "Passed the six-area overview, per-shop control, the complete MCP Central takeover, refit, shift and reset.",
    );
  } catch (error) {
    await page
      .screenshot({
        path: path.join(dir, "diagnostic.jpg"),
        type: "jpeg",
        quality: 80,
      })
      .catch(() => {});
    console.error(
      "Screen on failure:",
      (await page.locator("body").innerText()).slice(-2200),
    );
    console.error("Browser diagnostics:", [...errors]);
    throw error;
  } finally {
    await browser.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
