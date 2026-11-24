# PolamLife implementation contract

The source runs as browser ES modules. `npm run dev` serves the game on loopback, and `npm run build` produces a presentation copy in `dist/` that also opens from disk. Keep the entry page, styles and assets together.

## World state

`src/game.js` defines the seven tenant types, three playable alliances, named residents and round rules. `createGame()` initializes six persistent units at MCP Central. Unit 01 starts as Glaze Lane, held by the incumbent Arcade Guild. Each playable crew starts with one or two other units. The unit ID stays fixed through changes of tenant and owner.

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

A successful Shop Rush and three distinct participants can arrive in either order. Together they change ownership immediately and close the shop. A failed attacking shift restores the prior open phase and owner. A fresh challenge starts a new roster. The winning crew can challenge another rival after opening day. The six-unit completion prompt links to the daily paper and a confirmed restart. [Game design notes](game-design-notes.md)

## Scene and activity interfaces

`src/world.js` exports `mountWorld(container, {state, scene, shopId, territories, onLocation, onShop})` for the map, mall and shop views. It returns a cleanup function. The district has six landmarks. MCP Central contains six playable storefronts. Its territory overlay is registered to the same camera-transformed district illustration. Six clickable areas represent the influence of the six mall shops and read each saved owner. The game counts controlled shop IDs. The area outlines are illustrative. Joining enables the layer. The manual switch persists with the view. `districtFocusShop(state)` selects the current contest or refit, then the latest reopening, then Unit 01.

`src/rounds.js` mounts Shop Rush and Service Relay. The controller supplies a live crew lookup, a result callback for immediate settlement and a later callback for displaying the report. Leaving an unfinished shift discards its clock and inputs. `src/community.js` renders the daily paper, alliance roster, insights and Director controls from the same world.

## Persistence and language

`src/app.js` owns navigation, simulated arrivals and votes, and the write to `polamlife.fieldguide.v1`. `src/save.js` validates v1 worlds and repairs invalid view selections. If a world is unreadable, the player can continue temporarily or explicitly replace the saved data. A tab that detects another writer pauses saving and offers to load the latest world.

`src/i18n.js` and the three `src/locale-*.js` files provide English and Simplified Chinese. Switching languages updates visible text and accessibility labels in place so timers, focus and game selections survive. The language preference has its own local storage key.

For runnable commands and the rehearsal route, see the [verification guide](qa.md) and [pitch walkthrough](demo-walkthrough.md).
