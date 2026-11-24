// Small ownership parcels are traced on a 720 × 540 copy of the licensed map.
// Rows are edges of the same patch: neighboring lots share the same vertices.
// The colors illustrate shop influence rather than ownership of a public building.
export const REGION_LAYOUT = {
  estate: {
    portraitCrop: "46%",
    portraitDoors: [
      [22, 77],
      [50, 62],
      [78, 81],
    ],
    pin: [23, 11],
    lots: [["unit13", "unit14", "unit15"]],
    grid: [
      [
        [75, 9],
        [119, 5],
        [167, 3],
        [223, 2],
      ],
      [
        [74, 69],
        [122, 58],
        [169, 51],
        [231, 38],
      ],
    ],
    doors: [
      [23, 77],
      [52, 69],
      [81, 79],
    ],
  },
  park: {
    portraitCrop: "43%",
    portraitDoors: [
      [23, 79],
      [51, 65],
      [78, 82],
    ],
    pin: [16, 39],
    lots: [["unit07", "unit08", "unit09"]],
    grid: [
      [
        [33, 153],
        [75, 146],
        [126, 151],
        [174, 157],
      ],
      [
        [60, 239],
        [93, 255],
        [149, 252],
        [190, 231],
      ],
    ],
    doors: [
      [22, 78],
      [51, 70],
      [80, 78],
    ],
  },
  central: {
    pin: [71.6, 54],
    lots: [
      ["unit02", "unit05", "unit03"],
      ["unit04", "unit01", "unit06"],
    ],
    grid: [
      [
        [389, 251],
        [432, 232],
        [481, 217],
        [527, 208],
      ],
      [
        [428, 312],
        [474, 299],
        [522, 279],
        [560, 261],
      ],
      [
        [485, 374],
        [523, 363],
        [564, 343],
        [600, 321],
      ],
    ],
    doors: [
      [50, 59.3],
      [20.4, 33.4],
      [79.6, 33.4],
      [20.4, 59.3],
      [50, 33.4],
      [79.6, 59.3],
    ],
  },
  station: {
    portraitCrop: "27%",
    portraitDoors: [
      [23, 79],
      [51, 65],
      [77, 79],
    ],
    pin: [67, 70.5],
    lots: [["unit10", "unit11", "unit12"]],
    grid: [
      [
        [410, 331],
        [429, 350],
        [452, 375],
        [475, 402],
      ],
      [
        [429, 318],
        [448, 338],
        [472, 362],
        [496, 389],
      ],
    ],
    doors: [
      [20, 75],
      [51, 67],
      [81, 75],
    ],
  },
  discovery: {
    portraitCrop: "52%",
    portraitDoors: [
      [23, 79],
      [53, 64],
      [78, 81],
    ],
    pin: [53, 72.5],
    lots: [["unit16", "unit17", "unit18"]],
    grid: [
      [
        [328, 355],
        [355, 340],
        [382, 329],
        [405, 319],
      ],
      [
        [365, 423],
        [395, 415],
        [427, 404],
        [445, 385],
      ],
    ],
    doors: [
      [21, 76],
      [50, 65],
      [80, 76],
    ],
  },
  one: {
    portraitCrop: "52%",
    portraitDoors: [
      [23, 81],
      [50, 67],
      [78, 82],
    ],
    pin: [47, 85.3],
    lots: [["unit19", "unit20", "unit21"]],
    grid: [
      [
        [289, 417],
        [310, 406],
        [331, 401],
        [350, 394],
      ],
      [
        [313, 476],
        [335, 468],
        [358, 462],
        [380, 451],
      ],
    ],
    doors: [
      [20, 79],
      [50, 68],
      [81, 78],
    ],
  },
};
