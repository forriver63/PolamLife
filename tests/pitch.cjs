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

  // Exercise every entrance in a separate save so these QA visits do not appear
  // in the main pitch's newspaper or merchant footfall.
  async function checkTerritoryControls(snapshot) {
    const probe = await browser.newPage({ viewport: baseSize, reducedMotion: "reduce", hasTouch: true });
    probe.setDefaultTimeout(6000);
    try {
      await probe.goto(url);
      await probe.evaluate((data) => {
        localStorage.setItem("polamlife.fieldguide.v1", JSON.stringify(data));
      }, snapshot);
      await probe.reload();
      const map = probe.locator(".w-map");
      const layer = map.locator(".w-board > svg.w-territories");
      const art = map.locator(".w-board > .w-art");
      const toggle = probe.locator('[data-do="layers"]');
      const settle = async () => {
        await art.evaluate((img) => img.decode());
        await probe.evaluate(() => new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ));
      };
      const sameFrame = (actual, expected, label) => {
        assert(actual && expected, label + " must be visible");
        for (const key of ["x", "y", "width", "height"])
          assert(Math.abs(actual[key] - expected[key]) <= 1, label + " changed " + key);
      };
      const visibleDistrict = () => layer.evaluate((svg) => {
        const frame = svg.closest(".w-map").getBoundingClientRect();
        for (let y = frame.top + 72; y < frame.bottom - 70; y += 20) {
          for (let x = frame.left + 25; x < frame.right - 85; x += 20) {
            const district = document.elementFromPoint(x, y)?.closest("[data-territory-unit]");
            if (district) return { x, y, unit: district.getAttribute("data-territory-unit") };
          }
        }
        return null;
      });
      const checkShop = async (id) => {
        await probe.locator(".w-shop").waitFor();
        assert.equal(await probe.evaluate(() =>
          JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")).view.shopId), id);
        await probe.locator('.rail [data-do="map"]').click();
        await settle();
      };

      for (const size of [baseSize, phone, { width: 320, height: 700 }]) {
        await probe.setViewportSize(size);
        await settle();
        assert.equal(await layer.locator("[data-territory-unit]").count(), 6);
        const viewport = await map.boundingBox();
        const painting = await art.boundingBox();
        sameFrame(await layer.boundingBox(), painting, "Influence overlay at " + size.width);
        await toggle.click();
        await settle();
        assert.equal(await layer.count(), 0);
        assert.equal(await probe.locator("[data-owned-count]").count(), 0);
        sameFrame(await map.boundingBox(), viewport, "Map viewport with layer off");
        sameFrame(await art.boundingBox(), painting, "Base map with layer off");
        await toggle.click();
        await settle();
        sameFrame(await layer.boundingBox(), painting, "Restored overlay");
        assert.equal(await probe.evaluate(() => document.documentElement.scrollWidth), size.width);
        const key = await probe.locator(".w-territory-key").boundingBox();
        assert(key && key.x >= 0 && key.y >= 0 &&
          key.x + key.width <= size.width + 1 && key.y + key.height <= size.height + 1,
          "Territory key must fit inside the viewport at " + size.width);
        if (size.width < 500) {
          const target = await visibleDistrict();
          assert(target, "The narrow map must expose a touchable colored district");
          await probe.touchscreen.tap(target.x, target.y);
          await checkShop(target.unit);
        }
      }

      await probe.setViewportSize(baseSize);
      await settle();
      const beforeZoom = await art.boundingBox();
      await map.focus();
      await probe.keyboard.press("=");
      await probe.keyboard.press("=");
      const afterZoom = await art.boundingBox();
      assert(afterZoom.width > beforeZoom.width);
      sameFrame(await layer.boundingBox(), afterZoom, "Zoomed influence overlay");
      await probe.keyboard.press("ArrowRight");
      const panned = await art.boundingBox();
      assert(Math.abs(panned.x - afterZoom.x) > 1);
      sameFrame(await layer.boundingBox(), panned, "Panned influence overlay");
      const startPoint = await visibleDistrict();
      assert(startPoint, "A colored district must accept pointer input");
      await probe.mouse.move(startPoint.x, startPoint.y);
      await probe.mouse.down();
      await probe.mouse.move(startPoint.x + 75, startPoint.y + 35, { steps: 8 });
      await probe.mouse.up();
      assert.equal(await map.count(), 1, "Dragging a district must keep the player on the map");
      const dragged = await art.boundingBox();
      assert(Math.abs(dragged.x - panned.x) > 10, "Dragging a colored district must pan the map");
      sameFrame(await layer.boundingBox(), dragged, "Dragged influence overlay");
      const tap = await visibleDistrict();
      assert(tap);
      await probe.mouse.click(tap.x, tap.y);
      await checkShop(tap.unit);
      sameFrame(await art.boundingBox(), dragged, "Returning to the map must restore the camera");
      await toggle.click();
      await settle();
      sameFrame(await art.boundingBox(), dragged, "Hiding the layer must preserve camera position and zoom");
      await toggle.click();
      await settle();
      sameFrame(await layer.boundingBox(), dragged, "Showing the layer must preserve the camera");
      await map.focus();
      await probe.keyboard.press("Home");

      for (const [index, shop] of Object.values(snapshot.state.shops).entries()) {
        const area = layer.locator('[data-territory-unit="' + shop.id + '"]');
        assert.equal(await area.getAttribute("data-owner"), shop.owner);
        assert.equal(await area.getAttribute("data-phase"), shop.phase);
        assert.equal(await area.getAttribute("role"), "button");
        assert.equal(await area.getAttribute("tabindex"), "0");
        for (const method of ["pointer", index % 2 ? "Space" : "Enter"]) {
          if (method === "pointer") await area.click();
          else {
            await area.focus();
            await probe.keyboard.press(method);
          }
          await checkShop(shop.id);
        }
      }
    } finally {
      await probe.close();
    }
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
    const map = page.getByRole("region", { name: "Interactive map of Po Lam" });
    const transform = () =>
      map.locator(".w-board").evaluate((el) => el.style.transform);
    await map.locator(".w-art").evaluate((img) => img.decode());
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.equal(
      await map.locator(".w-rooftop").getAttribute("data-tenant"),
      "donut",
    );
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
    const territories = page.locator(".w-map .w-board > svg.w-territories");
    const holdings = page.locator(".w-territory-key [data-owned-count]");
    const claim = territories.locator('[data-territory-unit="unit01"]');
    await territories.waitFor();
    assert.equal(await holdings.getAttribute("data-owned-count"), "1");
    assert.equal(await claim.getAttribute("data-owner"), "incumbent");
    const originalFill = await claim.locator("polygon.w-domain-fill").evaluate((shape) => getComputedStyle(shape).fill);
    await checkTerritoryControls(await saved());
    await snap("04-district-map", desktopSizes);
    await act("layers");
    assert.equal(await territories.count(), 0);
    const place = page.locator('[data-location="central"]');
    await place.click();
    await act("mall");
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
    await startChallenge();
    await act("invite");
    await page.getByText("Crew assembled", { exact: true }).waitFor();
    assert.equal(new Set((await world()).contest.participants).size, 3);
    await playRush(true);
    assert.equal((await world()).shops.unit01.owner, "trend");
    await act("territoryMap");
    await territories.waitFor();
    assert.equal(await holdings.getAttribute("data-owned-count"), "2");
    assert.equal(await claim.getAttribute("data-owner"), "trend");
    assert.equal(await claim.getAttribute("data-phase"), "captured");
    assert.equal(await claim.getAttribute("data-latest-capture"), "");
    assert.equal(await territories.locator("[data-latest-capture]").count(), 1);
    const captureFill = await claim.locator("polygon.w-domain-fill").evaluate((shape) => getComputedStyle(shape).fill);
    assert.notEqual(captureFill, originalFill, "Capture must recolor the map itself");
    const friendly = territories.locator('[data-territory-unit="unit03"] polygon.w-domain-fill');
    assert.equal(captureFill, await friendly.evaluate((shape) => getComputedStyle(shape).fill));
    await snap("15-territory-capture", desktopSizes);
    const languageToggle = page.locator("header.mast [data-language-switch]");
    await languageToggle.click();
    assert.match(await claim.getAttribute("aria-label"), /最近占领/);
    assert.equal(await holdings.getAttribute("data-owned-count"), "2");
    await snap("16-territory-zh", [phone, baseSize]);
    await languageToggle.click();
    await claim.click();
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
    assert.match(await claim.getAttribute("aria-label"), /Pearl Club/);
    await act("layers");
    assert.match(await place.innerText(), /Pearl Club opens/);
    assert.equal(
      await map.locator(".w-rooftop").getAttribute("data-tenant"),
      "tea",
    );
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
      "Passed UI pitch, defense and retry, allied participation, ballot, persistent refit, opening, service relay, map sync and reset.",
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
