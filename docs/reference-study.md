# Po Lam visual reference

The team inspected the public [Agentopia map](https://cciwang.github.io/Agentopia_HKdemo/) and the [source at commit 750997e](https://github.com/CCiWang/Agentopia_HKdemo/tree/750997e57f27410ff0116674f27e4a46aa8aaa95) on 24 November 2026. These observations describe the reference artwork and its game geography. The pitch uses fictional shops.

## District composition

The district illustration looks down at a compact town at an oblique angle. Its 4:3 frame contains apartment courtyards, pairs of pitches, tiny double-deckers and footbridges. Broad gray roads curve around each cluster and meet at yellow box junctions. Bright cream tower tops contrast with “stacks” of violet and blue window bays. Low, coral-and-gold mall podiums carry blue barrel-glass roofs. Green tree clusters and occasional pink flowering trees fill the verge between roads and buildings.

| Landmark | Approximate location in the reference | Visual relationship |
| --- | --- | --- |
| Po Lam Estate | Upper left | Tall towers behind the northern road |
| Po Tsui Park | Middle left | Paired football pitches inside the western loop |
| MCP Central | Middle right | Large mall beside the station canopy |
| Po Lam Station | Lower right of center | Long covered interchange between the malls |
| MCP Discovery | Below center | Smaller glass-roofed mall west of the station |
| MCP ONE | Lower center | Smaller podium south of the station |

## How the reference works

The root index and Agentopia_HK_Map_v7.html are byte-identical at the inspected commit. Each embeds the Po Lam illustration as an unlettered WebP. A 1000 × 750 logical canvas holds percentage-positioned location buttons in a separate layer. The Chinese map labels correspond to entries in a bilingual location list. Filters toggle place categories. MCP Central opens a separate mall page. The other location buttons select a short description.

The mall page has a central atrium, west and east wings, plus pedestrian bridges toward housing and the station. It builds the floor with positioned room shapes, directional signage and an avatar. Its scripts separate room records, pan/zoom, shop selection and collision-aware movement. On L1 the room distribution draws on the mall's [published atrium venue plan](https://www.metrocityplaza.com/xml/images/ExhibitionArea/1/FloorPlan/1/MCP2%28L1%29AtriumA_B.pdf). Its other floors are marked provisional. Its current shop dialog uses a black-and-pink pixel-art room shared by many tenants. A neutral oak-and-sage version also remains in the repository. PolamLife's before/after sequence needs distinct room art, merchandise and frontage for each winning proposal.

## Inspect the reference

Open the [live district selector](https://cciwang.github.io/Agentopia_HKdemo/) and choose Po Lam, then select MCP Central. The [mall reference](https://cciwang.github.io/Agentopia_HKdemo/mcp-central.html) also opens directly. Local reference captures were used for comparison. The shared repository contains original PolamLife screenshots only.

## Asset use

The inspected repository has no root license file, and its root and mall readmes contain no express grant covering redistribution of its art or code. It describes the room images as generated artwork. On 24 November 2026, the project owner confirmed permission to include the original Agentopia logo and the Po Lam district map in the game and its private reviewer repository. These two original images are bundled locally. The mall, tenants, counters, territory overlay and interactions are specific to PolamLife.
