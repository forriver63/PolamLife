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
const streetUnits = {
  station: ["unit01", "unit03", "unit06"],
  park: ["unit02", "unit04", "unit05"],
};

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

  async function checkOverviewSigns(map, stage) {
    const frame = await map.boundingBox();
    for (const segment of Object.keys(streetUnits)) {
      const sign = map.locator('[data-map-segment="' + segment + '"] .w-segment-sign');
      const box = await sign.locator("rect").boundingBox();
      assert(box && box.width > 0 && box.height > 0 &&
        box.x >= frame.x && box.y >= frame.y &&
        box.x + box.width <= frame.x + frame.width &&
        box.y + box.height <= frame.y + frame.height,
        segment + " sign is clipped on the 390px map " + stage);
      for (const part of ["rect", ".w-segment-name", ".w-segment-tally"]) {
        assert.equal(await sign.locator(part).evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return hit?.closest(".w-segment-sign") === node.parentElement;
        }), true, segment + " " + part + " is covered on the 390px map " + stage);
      }
    }
  }

  async function loadLegacyMap(probe, snapshot) {
    await probe.goto(url);
    await probe.evaluate(({ state, view }) => {
      // The earlier release saved shop progress but had no street-focus field.
      const { scene, shopId, loc, started, territories, sound } = view;
      localStorage.setItem("polamlife.fieldguide.v1", JSON.stringify({
        state,
        view: { scene, shopId, loc, started, territories, sound },
      }));
    }, snapshot);
    await probe.reload();
  }

  // Exercise every entrance in a separate save so these QA visits do not appear
  // in the main pitch's newspaper or merchant footfall.
  async function checkTerritoryControls(snapshot) {
    const probe = await browser.newPage({ viewport: baseSize, reducedMotion: "reduce", hasTouch: true });
    probe.setDefaultTimeout(6000);
    try {
      await loadLegacyMap(probe, snapshot);
      const readProbe = () => probe.evaluate(() =>
        JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")),
      );
      assert.deepEqual((await readProbe()).state, snapshot.state, "Loading an existing save must preserve its game");
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
            const segment = document.elementFromPoint(x, y)?.closest("[data-map-segment]");
            if (segment) return { x, y, segment: segment.getAttribute("data-map-segment") };
          }
        }
        return null;
      });
      const storefront = (id) => map.locator('button[data-map-store="' + id + '"]');
      const focusArea = (id) => layer.locator('[data-map-segment="' + id + '"]');
      const back = map.locator("[data-segment-back]");
      const verifyStreet = async (segment) => {
        await map.locator('button[data-map-store]').first().waitFor();
        assert.equal(await map.getAttribute("data-focused-segment"), segment);
        const present = await map.locator('button[data-map-store]').evaluateAll((buttons) =>
          buttons.map((button) => button.dataset.mapStore).sort(),
        );
        assert.deepEqual(present, streetUnits[segment], "Show all three stores on the selected street only");
        const count = streetUnits[segment].filter((id) => snapshot.state.shops[id].owner === "trend").length;
        assert.equal(await map.locator("[data-segment-count]").getAttribute("data-segment-count"), String(count));
      };
      const checkThreeVisible = async () => {
        const visible = await map.locator("button[data-map-store]").evaluateAll((doors) => doors.map((door) => {
          const art = door.querySelector("img.w-map-frontart").getBoundingClientRect();
          const hit = document.elementFromPoint(art.x + art.width / 2, art.y + art.height / 2);
          return !!hit && door.contains(hit);
        }));
        assert.deepEqual(visible, [true, true, true], "All three facade centers must be visible and clickable together");
      };
      const verifyInterior = async (id) => {
        const interior = probe.locator(".w-shop");
        await interior.waitFor();
        assert.equal((await readProbe()).view.shopId, id, "The chosen storefront must enter its own interior");
        const type = snapshot.state.shops[id].type;
        assert.equal(await interior.locator(".w-board > .w-art").getAttribute("src"), "assets/interiors/" + type + ".webp");
      };

      for (const size of [baseSize, phone, { width: 320, height: 700 }]) {
        await probe.setViewportSize(size);
        await settle();
        if (size.width === phone.width) {
          await probe.reload();
          await settle();
          await checkOverviewSigns(map, "on opening");
          await map.focus();
          await probe.keyboard.press("=");
          await probe.keyboard.press("ArrowRight");
          await map.getByRole("button", { name: "Recenter map" }).click();
          await settle();
          await checkOverviewSigns(map, "after recentering");
        }
        assert.equal(await layer.locator("[data-map-segment]").count(), 2);
        assert.equal(await map.locator("[data-map-store]").count(), 0, "The overview should choose a street before a shop");
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
          await verifyStreet(target.segment);
          await checkThreeVisible();
          const id = streetUnits[target.segment][1];
          await storefront(id).tap();
          await verifyInterior(id);
          await probe.locator('[data-do="returnToStreet"]').click();
          await verifyStreet(target.segment);
          const other = target.segment === "station" ? "park" : "station";
          await map.locator('[data-switch-segment="' + other + '"]').tap();
          await verifyStreet(other);
          await checkThreeVisible();
          const otherStore = streetUnits[other][2];
          await storefront(otherStore).tap();
          await verifyInterior(otherStore);
          await probe.locator('[data-do="returnToStreet"]').click();
          await verifyStreet(other);
          await back.click();
          await settle();
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
      assert.equal(await map.getAttribute("data-focused-segment"), "", "Dragging must not open a shopping street");
      const dragged = await art.boundingBox();
      assert(Math.abs(dragged.x - panned.x) > 10, "Dragging a colored district must pan the map");
      sameFrame(await layer.boundingBox(), dragged, "Dragged influence overlay");
      const tap = await visibleDistrict();
      assert(tap);
      await probe.mouse.click(tap.x, tap.y);
      await verifyStreet(tap.segment);
      await back.click();
      await settle();
      sameFrame(await art.boundingBox(), dragged, "Closing the street view must restore the overview camera");
      await toggle.click();
      await settle();
      sameFrame(await art.boundingBox(), dragged, "Hiding the layer must preserve camera position and zoom");
      await toggle.click();
      await settle();
      sameFrame(await layer.boundingBox(), dragged, "Showing the layer must preserve the camera");
      await map.focus();
      await probe.keyboard.press("Home");

      for (const [segment, ids] of Object.entries(streetUnits)) {
        const area = focusArea(segment);
        assert.equal(await area.getAttribute("role"), "button");
        assert.equal(await area.getAttribute("tabindex"), "0");
        const visitsBefore = (await readProbe()).state.visits;
        await area.focus();
        await probe.keyboard.press(segment === "station" ? "Enter" : "Space");
        await verifyStreet(segment);
        await checkThreeVisible();
        assert.deepEqual((await readProbe()).state.visits, visitsBefore, "Looking at a street is not a store visit");
        const other = segment === "station" ? "park" : "station";
        await map.locator('[data-switch-segment="' + other + '"]').click();
        await verifyStreet(other);
        await map.locator('[data-switch-segment="' + segment + '"]').click();
        await verifyStreet(segment);
        await probe.reload();
        await verifyStreet(segment);
        for (const [index, id] of ids.entries()) {
          const door = storefront(id);
          const shop = snapshot.state.shops[id];
          assert.equal(await door.getAttribute("data-owner"), shop.owner);
          assert.equal(await door.getAttribute("data-phase"), shop.phase);
          assert.equal(await door.getAttribute("data-type"), shop.type);
          for (const method of ["pointer", index % 2 ? "Space" : "Enter"]) {
            if (method === "pointer") await door.click();
            else await door.press(method);
            await verifyInterior(id);
            await probe.locator('[data-do="returnToStreet"]').click();
            await verifyStreet(segment);
            assert.equal((await readProbe()).view.mapShopId, id, "Return to the exact store's street");
          }
        }
        const lastStore = ids.at(-1);
        await probe.reload();
        await verifyStreet(segment);
        assert.equal((await readProbe()).view.mapShopId, lastStore);
        await probe.locator('.scene-card [data-do="focusShop"]').click();
        await verifyInterior(lastStore);
        await probe.locator('[data-do="returnToStreet"]').click();
        await back.click();
        assert.equal(await map.getAttribute("data-focused-segment"), "");
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
    const station = territories.locator('[data-map-segment="station"]');
    const park = territories.locator('[data-map-segment="park"]');
    const streetBack = map.locator("[data-segment-back]");
    const stationStore = map.locator('button[data-map-store="unit01"]');
    const stationBoundary = territories.locator('[data-border-units="unit01 unit03"][data-edge]');
    const boundaryAppearance = () => stationBoundary.evaluate((edge) => {
      const css = getComputedStyle(edge);
      return [css.stroke, css.strokeWidth, css.strokeDasharray, css.opacity, css.display];
    });
    const parkShops = () => park.locator("[data-territory-unit]").evaluateAll((lots) =>
      lots.map((lot) => ({
        shop: lot.dataset.territoryUnit,
        owner: lot.dataset.owner,
        phase: lot.dataset.phase,
        fill: getComputedStyle(lot.querySelector(".w-domain-fill")).fill,
      })),
    );
    await territories.waitFor();
    assert.equal(await holdings.getAttribute("data-owned-count"), "1");
    assert.equal(await claim.getAttribute("data-owner"), "incumbent");
    assert.equal(await stationBoundary.getAttribute("data-edge"), "border");
    const initialBoundary = await boundaryAppearance();
    const initialPark = await parkShops();
    assert.equal(initialPark.length, 3);
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
    await act("returnToStreet");
    assert.equal(await map.getAttribute("data-focused-segment"), "station");
    assert.equal(await map.locator("[data-segment-count]").innerText(), "1 / 3");
    assert.equal(await stationStore.getAttribute("data-owner"), "incumbent");
    assert.match(await stationStore.locator("img.w-map-frontart").getAttribute("src"), /front-donut\.webp$/);
    await stationStore.click();
    await startChallenge();
    await act("invite");
    await page.getByText("Crew assembled", { exact: true }).waitFor();
    assert.equal(new Set((await world()).contest.participants).size, 3);
    await playRush(true);
    assert.equal((await world()).shops.unit01.owner, "trend");
    await act("territoryMap");
    await territories.waitFor();
    assert.equal(await map.getAttribute("data-focused-segment"), "station");
    assert.equal(await map.locator("[data-segment-count]").innerText(), "2 / 3");
    assert.match(await map.locator("[data-segment-change]").innerText(), /1.*2/);
    assert.match(await stationStore.locator("img.w-map-frontart").getAttribute("src"), /front-renovating\.webp$/);
    const legacyCapture = await browser.newPage({ viewport: baseSize });
    try {
      const current = await saved();
      await loadLegacyMap(legacyCapture, current);
      const recovered = legacyCapture.locator('.w-map[data-focused-segment="station"] button[data-map-store="unit01"]');
      await recovered.waitFor();
      assert.equal(await recovered.getAttribute("data-phase"), "captured");
      assert.deepEqual(await legacyCapture.evaluate(() =>
        JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")).state), current.state);
      await recovered.press("Enter");
      await legacyCapture.locator(".w-shop").waitFor();
      await legacyCapture.locator('[data-do="propose"]').first().waitFor();
    } finally {
      await legacyCapture.close();
    }
    await streetBack.click();
    assert.equal(await holdings.getAttribute("data-owned-count"), "2");
    assert.equal(await stationBoundary.getAttribute("data-edge"), "internal");
    assert.notDeepEqual(await boundaryAppearance(), initialBoundary, "The former contested line must visibly change");
    assert.deepEqual(await parkShops(), initialPark, "A takeover at the station must leave every park shop untouched");
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
    const latestTitle = await claim.locator("title").textContent();
    for (const expected of ["车站商段", "糖霜小巷", "潮流派", "最近占领"])
      assert(latestTitle.includes(expected), "The latest map change should identify " + expected);
    assert.equal(await holdings.getAttribute("data-owned-count"), "2");
    await snap("16-territory-zh", [phone]);
    await checkOverviewSigns(page.locator(".w-map"), "after the takeover");
    await snap("16-territory-zh");
    await languageToggle.click();
    await station.locator(".w-segment-marker").click();
    await stationStore.click();
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
    assert.equal(await map.getAttribute("data-focused-segment"), "station");
    assert.equal(await stationStore.getAttribute("data-phase"), "reopened");
    assert.match(await stationStore.innerText(), /Pearl Club/);
    assert.match(await stationStore.locator("img.w-map-frontart").getAttribute("src"), /front-tea\.webp$/);
    assert.match(await map.locator('[data-map-store="unit03"]').innerText(), /Pixel Port/);
    assert.match(await map.locator('[data-map-store="unit06"]').innerText(), /Little Steam/);
    await snap("17-street-storefronts");
    await stationStore.click();
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
      "Passed both shopping streets, six storefronts, touch and keyboard, legacy saves, local boundary changes, the complete takeover, refit and reset.",
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
