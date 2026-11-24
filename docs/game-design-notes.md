# Game design notes

## What comes from the concept PDF

| Reference | Design carried into the playable game |
| --- | --- |
| pp. 1–4 and hand-drawn pitch pp. 1–3 | The player passes a donut shop before class and imagines buying milk tea. The virtual setting uses the real Po Lam district. |
| pp. 5–6 and hand-drawn pitch pp. 4–5 | Neighbors with similar shop preferences form alliances, contest rival units and run, defend and decorate friendly shops. |
| pp. 7–8 and hand-drawn pitch pp. 6–7 | A sufficient number of distinct people must show up. The old shop closes, the capturing alliance votes, and its chosen replacement opens a day later. The changed neighborhood motivates the return visit. |
| pp. 9–11 and hand-drawn pitch p. 8 | Expressed preferences could inform questions about merchandising, tenant mix or locations. The business model, fairness rules and evidence of merchant demand remain open. |

## Demo decisions

The player ranks three shop choices. A count of matching choices recommends one of three authored alliances. The earliest-ranked matching choice breaks a tie. A player may select another alliance. The six fictional shops share one mall. Three playable crews have two simulated members each. The starting donut shop belongs to an incumbent so any playable crew can start this story.

Each contestant has a stable member ID. A successful rush and three distinct participants capture the unit in either order. A failed rush leaves the defending crew in possession. A new challenge starts with a fresh roster. Capture closes the storefront and changes the owner shown on the territory plan. The plan covers the six playable units at MCP Central. It marks the most recent capture and shows the crew’s share of the mall.

The ballot excludes the existing tenant type. It takes the player’s first eligible preference, includes hot pot when replacing sushi, then considers the alliance’s first eligible preference. The remaining player choices, alliance preferences and tenant catalog fill out three distinct options in that order. Each ally votes for the available option highest in their individual ranking. All three members must vote before the count. The earliest printed option wins a tie. On the classic tea, gaming and café ballot, Mina favors tea and Kit favors gaming. A player voting for tea wins 2–1. Voting for café creates a three-way tie that awards the shop to tea.

A game day is a discrete step. Renovation schedules the change for the following day. The presentation clock advances with the visible control. The new unit keeps its location, owner and visit count. A completed renovation records the previous and new types. Returning to the map or the atrium reads the same unit record. Another rival unit can be challenged after the opening. Once all six shops are operating under the same alliance, the map and mall offer the daily paper and a confirmed new game.

Shop Rush starts with 25 seconds, five orders and three strikes. A contested counter with defense above baseline adds one order for each extra defense point. Products follow the tenant. A present order runner can catch one wrong order without costing a strike, and the queue marshal extends the shift by four seconds. Those roles work for allies arriving at an attacking counter or assigned to a friendly shop. Service Relay gives 24 seconds to reproduce three sequences of two, three and four station signals. Winning a friendly activity adds one defense point, up to six. Missing the goal costs one, down to zero. Each ally can sign on once per friendly unit. Installing pennants changes the scene.

The local edition of the daily paper uses the event ledger and renovation history. Merchant insights label the player's declared choices, repeat entries to the unit, votes by source and a seeded geographic illustration using named simulated residents. The research question is explicitly a hypothesis. Adoption, revenue, real-world conversion and season outcomes remain open questions.

## Settlement and recovery

| From | Input and guard | Result |
| --- | --- | --- |
| Open | Allied player challenges an available rival unit | Contested with the player counted once |
| Contested | Failed rush | Original owner keeps unit and the crew can retry |
| Contested | Successful rush plus three unique members | Captured, new owner, shutters down |
| Captured | Open proposal | Voting with a fixed eligible roster |
| Voting | Every eligible member has voted and the count is requested | Renovating, winner and scheduled day fixed |
| Renovating | Advance game day | Reopened, new tenant, history entry, opening announcement |

Session, contest, proposal and round IDs guard callbacks. Reaching a win or loss settles the round immediately, before its report animation. A refresh keeps the contest roster, requested invitations, completed rounds, ballots, renovation and game day. An interrupted unfinished shift can be opened again at the counter. An outstanding invitation resumes on reload, as do remaining simulated votes after the player casts a ballot. Reset starts a new session. Switching between English and Simplified Chinese preserves the current activity and selections.

The save reader validates the world before rendering. It can repair a missing scene or invalid landmark while retaining valid game data. For an unreadable world, the player chooses temporary play or explicit replacement. If another tab changes the save, stale tabs suspend writes and offer to reload. A check immediately before writing also detects changes when the browser delays a storage event. Browser local storage offers no atomic compare-and-swap across tabs, so simultaneous cross-process writes have a residual race.

## Scope for a multiplayer pilot

This demo runs in one browser profile with named simulated neighbors. The six units are playable and the other district landmarks offer local information. The mall and estate positions are illustrative. There is no backend, live resident sample or merchant account.

For network play, move ownership, time, eligibility and transaction settlement to an authoritative service. Persist unique participation and ballots with server-side constraints and broadcast committed events to clients. Restore pending ballots and refits from a shared clock after reconnects. A pilot should test whether thresholds remain fair at different crew sizes and whether voluntary, aggregated preference evidence has value to participating residents and merchants.
