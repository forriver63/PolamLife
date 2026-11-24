# PolamLife implementation contract

The source runs as browser ES modules. `npm run dev` serves the game on loopback, and `npm run build` produces a presentation copy in `dist/` that also opens from disk. Keep the entry page, styles and assets together.

## World state

`src/regions.js` assigns 21 stable units to six locations. The original six and their seven possible tenants belong to MCP Central. Each other location starts with three different local tenants. The last two digits identify the same unit across visits, captures and new tenants. `src/game.js` defines the three playable alliances, residents and round rules.

`reduce(state, action)` returns a new serializable world when it accepts an action. Rejected actions return the prior object. The world contains the session ID, day, player, units, current contest, proposal, renovation, event ledger, round results, visits by unit and completed refits.

| Action | Acceptance and effect |
| --- | --- |
| `PREFER`, `JOIN` | Record three distinct ranked tenant types and choose an alliance. `recommend()` counts matches and uses the earliest-ranked matching preference to break a tie. |
| `VISIT` | Increment the selected unit’s entry count. |
| `CHALLENGE` | Start a contest at an open rival unit when no other takeover or refit is in progress. The player joins the roster. |
| `RALLY`, `INVITE` | Record the invitation request, then add each eligible ally once as they arrive. |
| `RESULT` | Provide the game, unit, success flag, round ID and session ID. Attacking results require the current contest ID. Friendly management uses no contest ID. Each round settles once. |
| `PROPOSE`, `VOTE`, `CLOSE_VOTE` | Open a three-option replacement ballot after capture. Store one choice per eligible member. Count the votes once every ballot arrives, with printed order breaking a tie. |
| `ADVANCE` | Open the winning tenant on its scheduled day and append one history entry. |
| `STAFF`, `DECORATE` | Assign a named defender once per friendly unit, or install the alliance’s pennants. |

A successful Shop Rush and three distinct participants can arrive in either order. Together they change ownership immediately and close the shop. A failed attacking shift restores the prior open phase and owner. A fresh challenge starts a new roster. The winning crew can challenge another rival after opening day. The district-wide completion prompt links to the daily paper and a confirmed restart. [Game design notes](game-design-notes.md)

## Scene and activity interfaces

`mountWorld(container, {state, scene, areaId, shopId, territories, mapShopId, onLocation, onShop})` in `src/world.js` returns a cleanup function. The overview uses `scene="map"`. Selecting a place enters its own background with `scene="mall"` and its region ID. Each physical door resolves its own unit, tenant, owner and phase. The shop screen returns to that region. `src/region-layout.js` supplies positions for the overview parcels and local doors. `src/save.js` migrates valid six-shop v1 worlds to v2 by preserving their six units and game history, then adding the other fifteen units and visit counters.

`src/rounds.js` mounts Shop Rush and Service Relay. The controller supplies a live crew lookup, a result callback for immediate settlement and a later callback for displaying the report. Leaving an unfinished shift discards its clock and inputs. `src/community.js` renders the daily paper, alliance roster, insights and Director controls from the same world.

## Persistence and language

`src/app.js` owns navigation, simulated arrivals and votes, and the write to `polamlife.fieldguide.v1`. `src/save.js` validates v1 worlds and repairs invalid view selections. If a world is unreadable, the player can continue temporarily or explicitly replace the saved data. A tab that detects another writer pauses saving and offers to load the latest world.

`src/i18n.js` and the three `src/locale-*.js` files provide English and Simplified Chinese. Switching languages updates visible text and accessibility labels in place so timers, focus and game selections survive. The language preference has its own local storage key.

For runnable commands and the rehearsal route, see the [verification guide](qa.md) and [pitch walkthrough](demo-walkthrough.md).
