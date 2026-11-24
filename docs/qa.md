# Verification

## Run the checks

Use Node.js 20 or newer. The game, local server, production build and reducer tests use Node.js and browser APIs already available on the host. The two browser suites use the pinned Playwright development dependency.

```sh
npm ci
npx playwright install chromium --only-shell
npm test
npm run build
npm run dev
```

Leave the server running and execute the browser suites in a second terminal.

```sh
npm run test:e2e
npm run test:bilingual
```

The default test address is `http://127.0.0.1:4173/`. Set `DEMO_URL` to test another local server, the built entry at `/dist/`, or a file URL for the built `dist/index.html`. Set `CHROME_PATH` to use an existing Chrome executable. `PLAYWRIGHT_PATH` can select an alternate Playwright installation. Screenshots from the pitch suite go to `test-results/screenshots/` unless `SCREENSHOT_DIR` is set. Each suite starts in a disposable browser context.

## Handoff checks, 24 November 2026

| Surface | Evidence |
| --- | --- |
| Rules and saved worlds | All 17 Node tests pass. They cover recommendation ties, duplicate and late results, independent ballots, the sushi-to-hot-pot example, old v1 ballots, malformed worlds and every crew’s route to owning all six units. |
| Browser pitch | The strict browser pitch passed on the loopback server. It played a failed challenge and a successful retry, inspected alliance territory before and after capture, elected tea, restored the renovation on reload, opened Pearl Club and completed Service Relay at Pixel Port. It verified the reward, decoration and reset. It checks failed HTTP responses, image loads, document overflow and uncaught page errors along the route. |
| Language | The bilingual suite passed on the loopback server and with the built entry opened directly from disk. It switched between English and Simplified Chinese during preference selection, a timed rush and voting. It verified the current order, clock and vote survive the switch, checked shop and relay instructions, and read the opening-day paper and insights after reloading. |
| Interrupted play | Independent Chrome checks confirmed that an ended shift saves during its final frame. Refreshing then preserves one result. Requested invitations and pending ally ballots resume. Exiting an unfinished shift leaves the result count unchanged. |
| Save recovery | An invalid landmark retained the valid world. An unreadable save survived temporary play byte for byte until explicit replacement. A stale tab detected another tab’s reset, paused its writes and loaded the latest world on request. The pre-write check also blocked the old snapshot with storage event delivery suppressed. |
| Packaging and serving | `npm run build` produced the offline entry and its local styles and artwork. The loopback server served the source and built entry points, scripts, styles and art. It returned 404 for ordinary project documentation, tests and metadata, and 405 for an unsupported HTTP method. |

## Presentation views

The pitch suite captures 16 views at 1440 × 900, including the captured territory in English and Simplified Chinese. Seven of those views are also captured at 1366 × 768 and 1920 × 1080. The Chinese map after capture has a 390 × 844 portrait view, bringing the total to 31 images. It reads the actual order tickets and waits for visible lights in Service Relay before selecting each station. The camera test waits for the district illustration to decode before checking zoom, pan and recentering.

| Pitch sequence | Scene evidence |
| --- | --- |
| Meet the district | [Opening](screenshots/01-opening.jpg) · [District map](screenshots/04-district-map.jpg) |
| Find a crew | [Preference cards](screenshots/02-preferences.jpg) · [Alliance match](screenshots/03-alliance-selection.jpg) |
| Explore MCP Central | [Mall atrium](screenshots/05-mall-atrium.jpg) · [Glaze Lane](screenshots/06-donut-shop.jpg) |
| Win a counter | [Shop Rush](screenshots/07-shop-competition.jpg) · [Alliance ballot](screenshots/08-alliance-voting.jpg) |
| Inspect the captured territory | [English](screenshots/15-territory-capture.jpg) · [简体中文](screenshots/16-territory-zh.jpg) |
| See the refit | [Renovation](screenshots/09-renovation.jpg) · [Grand opening](screenshots/10-grand-opening.jpg) · [Reopened storefront](screenshots/13-reopened-atrium.jpg) |
| Follow the change | [Community paper](screenshots/12-po-lam-daily.jpg) · [Merchant insights](screenshots/11-merchant-insights.jpg) · [Updated district](screenshots/14-updated-district.jpg) |

The `-1366` and `-1920` files show the additional screen sizes for selected scenes. See the [walkthrough](demo-walkthrough.md) for a four-minute presentation and the [reference study](reference-study.md) for the district reference.

## Visual review and independent handoff

The first browser comparison used the live Agentopia Po Lam district and mall alongside the playable opening, preference ballot, mall, both sides of the counter, renovation, opening and newspaper. The initial territory markers made a change of control hard to read. An initial revision added state-driven zones to the mall roof and a separate floor diagram. A later playtest found that splitting the screen made it hard to relate the two views. The current design draws the six influence areas directly on the district illustration. The opening count and the takeover count were captured on either side of the same contest.

After the authorized 4:3 map and Agentopia logo were integrated, a second comparison exposed overlapping station and MCP Discovery labels. The signs were offset while their anchor points stayed on the corresponding landmarks. Desktop checks covered 1366, 1440 and 1920 pixels across. At widths of 320 and 390 pixels the same layer remained on the map. Pinching or using the minus control revealed the full 4:3 district, with all six shop emblems accessible. Dragging a colored region panned the map, a tap opened its shop, and hiding or showing the layer preserved the camera. The before-capture and after-capture screenshots show the same district at one of six and two of six shops. A separate browser run reached six of six shops, reloaded, and confirmed all six still belonged to the same alliance.

A fresh reviewer followed the README in an isolated copy. They reproduced the complete tea route, the single-participant win and the three-way tie. Their feedback clarified when the shop closes, when the next attack becomes available and which option wins that tie. They also found that opening-day flags used to mask the change after manually decorating a reopened shop. Opening-day confetti and the ribbon now mark the new shop; the alliance pennants appear only when installed, inside the shop and on its storefront.
