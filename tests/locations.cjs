// Verify each entrance and a whole local takeover through the player's controls.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright");

const districts = {
  central: ["donut", "sushi", "game", "cafe", "market", "hotpot"],
  park: ["lemonade", "kite", "skate"],
  station: ["ticketpress", "onigiri", "umbrella"],
  estate: ["florist", "repair", "bakery"],
  discovery: ["record", "ceramics", "camera"],
  one: ["noodles", "sewing", "books"],
};
const url = process.env.DEMO_URL || "http://127.0.0.1:4173/";
const dir = process.env.SCREENSHOT_DIR || path.join(__dirname, "../test-results/screenshots");

async function exercise(browser, mobile) {
  const page = await browser.newPage({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: mobile, reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) errors.push(r.status() + " " + r.url()); });
  page.setDefaultTimeout(6000);
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")));
  const tap = (locator) => mobile ? locator.tap() : locator.click();
  const action = async id => {
    const dialog = page.getByRole("dialog");
    const scope = await dialog.count() ? dialog : page;
    await tap(scope.locator('[data-do="' + id + '"]:visible').first());
  };
  const door = id => page.locator('button[data-shop="' + id + '"]');
  const place = id => page.locator('button[data-location="' + id + '"]');
  const snap = async name => {
    await page.locator("#announcer.show").waitFor({state:"hidden"});
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, img => img.decode()));
    });
    await page.screenshot({ path: path.join(dir, name + (mobile ? "-390" : "") + ".jpg"), quality: 87 });
  };
  try {
    await page.goto(url);
    await tap(place("park")); // A new player can explore before joining an alliance.
    await tap(door("unit07"));
    assert.equal((await saved()).view.region, "park");
    await action("prefs");
    for (const id of ["tea", "game", "cafe"]) await tap(page.locator('[data-choice="' + id + '"]'));
    await action("match"); await action("join");
    const initial = (await saved()).state;
    assert.equal(Object.keys(initial.shops).length, 21);
    assert.equal(initial.player.alliance, "trend");
    await page.locator("header [data-language-switch]").click();
    let unitNumber = 0;
    for (const [area, types] of Object.entries(districts)) {
      await tap(place(area));
      const scene = page.locator('.w-mall[data-region="' + area + '"]');
      await scene.waitFor();
      const art = scene.locator("img.w-art").first();
      assert((await art.getAttribute("src")).endsWith(area === "central" ? "assets/mall.webp" : "assets/regions/" + area + ".webp"));
      assert.equal(await scene.locator("[data-shop]").count(), types.length);
      if (area !== "central" && (!mobile || area === "park")) await snap("area-" + area);
      if (area === "park") {
        await page.reload();
        await scene.waitFor();
        assert.equal((await saved()).view.region, area);
      }
      for (const type of types) {
        const id = "unit" + String(++unitNumber).padStart(2, "0");
        const entrance = door(id);
        assert.equal((await saved()).view.scene, "mall");
        const before = (await saved()).state.visits[id];
        await tap(entrance);
        const inside = page.locator(".w-shop");
        await inside.waitFor();
        const current = await saved();
        assert.equal(current.view.shopId, id);
        assert.equal(current.state.visits[id], before + 1);
        assert.equal(current.state.shops[id].type, type);
        await inside.locator("img.w-art").first().evaluate(img => img.decode());
        assert((await inside.locator("img.w-art").first().getAttribute("src")).endsWith("/interiors/" + type + ".webp"));
        if (area === "park" && type === "kite" && !mobile) await snap("inside-park-kite");
        await action("returnToStreet");
        assert.equal((await saved()).view.region, area);
      }
      await action("map");
    }
    if (!mobile) {
      await tap(place("park")); await tap(door("unit07"));
      await action("scout"); await action("challenge"); await action("invite");
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("polamlife.fieldguide.v1")).state.contest.participants.length === 3);
      await action("rush"); await tap(page.locator("[data-round-start]"));
      for (let n = 0; n < 5; n++) {
        const ticket = await page.locator("[data-prompt]").innerText();
        assert.match(ticket, /柠檬汽水|西柚汽水|青柠冰饮/);
        await page.getByRole("button", {name:"递上" + ticket, exact:true}).click();
      }
      await action("territoryMap");
      assert.equal(await page.locator('[data-territory-unit="unit07"]').getAttribute("data-owner"), "trend");
      await tap(place("park"));
      assert.equal((await page.locator("[data-region-count]").innerText()).trim(), "2 / 3");
      assert.equal(await door("unit07").getAttribute("data-phase"), "captured");
      await snap("area-park-captured");
      await tap(door("unit07")); await action("propose");
      const ballot = await page.locator("button[data-vote]").evaluateAll(nodes => nodes.map(n => n.dataset.vote).sort());
      assert.deepEqual(ballot, ["kite", "skate"]);
      await tap(page.locator('[data-vote="kite"]')); await action("count");
      await page.reload(); await action("advance");
      const final = (await saved()).state;
      assert.equal(final.day, 2);
      assert.equal(final.shops.unit07.location, "park");
      assert.equal(final.shops.unit07.type, final.proposal.winner);
      assert.equal(final.shops.unit07.phase, "reopened");
      for (const [id, unit] of Object.entries(initial.shops))
        if (id !== "unit07") assert.deepEqual(final.shops[id], unit, id + " changed during the park takeover");
      await action("returnToStreet");
      assert.equal(await door("unit07").getAttribute("data-phase"), "reopened");
      await snap("area-park-open");
      await action("daily");
      assert.match(await page.locator(".cn-lead").innerText(), /宝翠公园/);
    }
    assert.deepEqual(errors, []);
    console.log((mobile ? "390px touch" : "1440px desktop") + ": six locations, 21 unique working shop doors and return paths passed.");
  } catch (err) {
    await page.screenshot({path: path.join(dir, "location-diagnostic.png")});
    throw err;
  } finally { await page.close(); }
}

(async () => {
  fs.mkdirSync(dir, {recursive:true});
  const browser = await chromium.launch({executablePath: process.env.CHROME_PATH || undefined});
  try { await exercise(browser, false); await exercise(browser, true); }
  finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
