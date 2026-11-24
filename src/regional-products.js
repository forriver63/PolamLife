// Each order ticket and its matching counter button share a product and colour.
export const REGIONAL_ORDERS = {
  lemonade: [["Lemon soda", "柠檬汽水", "#f0cf54"], ["Pink grapefruit", "红西柚汽水", "#e9938b"], ["Lime cooler", "青柠冰饮", "#a7c77b"]],
  kite: [["Swallow kite", "燕子风筝", "#7fb9cf"], ["Goldfish kite", "金鱼风筝", "#df8d58"], ["Butterfly kite", "蝴蝶风筝", "#bc95c6"]],
  skate: [["Lagoon skates", "海蓝轮滑鞋", "#6ab6b7"], ["Sunset skates", "落日轮滑鞋", "#e59375"], ["Lilac skates", "丁香轮滑鞋", "#ba9cd1"]],
  ticketpress: [["Platform print", "月台版画", "#87b8c7"], ["Tram postcard", "电车明信片", "#c79f62"], ["Night ticket", "夜车纪念票", "#a397c0"]],
  onigiri: [["Salmon rice ball", "三文鱼饭团", "#e59a85"], ["Plum rice ball", "梅子饭团", "#c78099"], ["Corn rice ball", "玉米饭团", "#e9c66c"]],
  umbrella: [["Coral parasol", "珊瑚阳伞", "#db8a84"], ["Sky umbrella", "天蓝雨伞", "#88b8d2"], ["Plum umbrella", "梅紫雨伞", "#b08ebc"]],
  florist: [["Sunflowers", "向日葵花束", "#e8ba57"], ["Pink carnations", "粉康乃馨", "#df99af"], ["Blue hydrangeas", "蓝绣球", "#929fcc"]],
  repair: [["Pocket radio", "袖珍收音机", "#deb977"], ["Desk fan", "台式风扇", "#a7b7c7"], ["Alarm clock", "闹钟", "#c48e78"]],
  bakery: [["Pineapple bun", "菠萝包", "#deb36b"], ["Cocoa bun", "可可包", "#aa775c"], ["Taro bun", "芋泥包", "#c29cb5"]],
  record: [["Harbour jazz", "海港爵士唱片", "#78a7b7"], ["Neon pop", "霓虹流行唱片", "#d993b1"], ["Sunset soul", "夕阳灵魂乐唱片", "#d5ac6c"]],
  ceramics: [["Celadon bowl", "青瓷碗", "#a7c3ad"], ["Cobalt bowl", "钴蓝碗", "#86a5c1"], ["Coral bowl", "珊瑚瓷碗", "#dda893"]],
  camera: [["Daylight film", "日光胶卷", "#dec064"], ["Portrait film", "人像胶卷", "#d69787"], ["Night film", "夜景胶卷", "#9d9fbe"]],
  noodles: [["Wonton noodles", "云吞面", "#dda56b"], ["Beef brisket noodles", "牛腩面", "#ba8366"], ["Scallion noodles", "葱油面", "#a6b47b"]],
  sewing: [["Indigo spool", "靛蓝线轴", "#859aca"], ["Saffron spool", "藏红线轴", "#d6ac5e"], ["Rose spool", "玫红线轴", "#ca89a1"]],
  books: [["Harbour atlas", "海港图册", "#84a8b5"], ["Poetry booklet", "诗歌小册", "#b698bd"], ["Pocket comic", "口袋漫画", "#d9aa74"]],
};

const drawings = {
  lemonade: '<path d="M19 19h33l-4 31-6 5H29l-7-5z"/><path d="M25 20l4 26M38 19l5-14h8" fill="none"/><path d="M18 26h17l-8-12z" fill="#ffe793"/>',
  kite: '<path d="M14 21l19-14 23 8-17 26z"/><path d="M14 21l42-6M33 7l6 34q5 7 1 12l10 3" fill="none"/><path d="m40 49-6-4v7zm4 4 7-2v7z"/>',
  skate: '<path d="m17 12 18 2 1 13 7 7 11 2 5 7-3 4H16l-3-6 4-8z"/><path d="m19 17 12 2m3 8-8-1m11 6-9-1m12 7-10-1" fill="none" stroke="#ffefcf"/><path d="M17 46h38v4H17z" fill="#615464"/><g fill="#e3a458"><circle cx="21" cy="52" r="5"/><circle cx="49" cy="52" r="5"/></g>',
  ticketpress: '<path d="m10 23 43-11 7 29-44 12z"/><path d="m16 27 22-6 2 10-22 6z" fill="#f5e5c2"/><path d="m44 21 7-2m-6 8 7-2m-29 19 30-8"/>',
  onigiri: '<path d="M15 42q0-7 16-27 5-7 11 0l15 23q6 11-5 12l-31 2q-9-1-6-10z" fill="#fff3d7"/><path d="m27 37 19-2 3 16-20 1z" fill="#526658"/><circle cx="35" cy="26" r="5"/>',
  umbrella: '<path d="M8 33q6-22 24-25 20-1 30 17l-9-1-7 5-9-2-8 7-10-2-9 5z"/><path d="m34 8 3 19 5 20q2 7-5 8-5 1-6-4M34 8q-10 7-12 24m12-24q13 6 17 17" fill="none"/>',
  florist: '<path d="m24 32 13 22 15-34-12 7z" fill="#c1c998"/><path d="m24 33 16 18 4-24" fill="#f1d9b6"/><g><circle cx="24" cy="25" r="8"/><circle cx="36" cy="18" r="9"/><circle cx="47" cy="25" r="8"/></g><g fill="#fae7a9"><circle cx="24" cy="25" r="2"/><circle cx="36" cy="18" r="2"/><circle cx="47" cy="25" r="2"/></g>',
  repair: [
    '<path d="M10 24h50v26H10z"/><path d="m22 24 20-17" fill="none"/><circle cx="24" cy="37" r="8" fill="#675759"/><path d="M38 31h15v5H38z" fill="#f3dfb1"/><circle cx="48" cy="43" r="3"/>',
    '<path d="M31 41h8v9h10v4H22v-4h9z"/><circle cx="35" cy="26" r="18"/><path d="M35 26q-12-14-14-3 1 7 14 3-7 17 4 13 5-4-4-13 17-4 9-11-7-2-9 11z" fill="#e9dfc8"/><circle cx="35" cy="26" r="3"/>',
    '<path d="m22 44-4 8m30-7 5 7" fill="none"/><path d="M13 21q-3-12 10-13l5 4zm32-8 6-5q12 1 10 13z"/><circle cx="36" cy="32" r="18"/><circle cx="36" cy="32" r="13" fill="#f6e8cc"/><path d="M36 23v9l7 3" fill="none"/>',
  ],
  bakery: '<path d="M9 41q0-21 21-25 21-5 31 15 5 12-8 18-25 10-42-2z"/><path d="m16 36 19-18m-11 25 23-24m-11 27 20-19M19 25l24 18m-12-23 23 16" fill="none" stroke="#a36b4f"/>',
  record: '<ellipse cx="35" cy="31" rx="25" ry="22" fill="#423c53"/><ellipse cx="35" cy="31" rx="19" ry="16" fill="none" stroke="#72687a"/><ellipse cx="35" cy="31" rx="10" ry="9"/><circle cx="35" cy="31" r="2" fill="#f4e2c6"/>',
  ceramics: '<path d="M9 27q3 20 24 23 21 1 30-23z"/><ellipse cx="36" cy="26" rx="27" ry="8" fill="#f9ead4"/><path d="M16 35q18 10 40 0" fill="none" stroke="#f5e6cb"/><path d="M27 49h17l-3 4H30z"/>',
  camera: '<path d="M16 17h24v31H16z"/><ellipse cx="28" cy="17" rx="12" ry="4" fill="#4d4652"/><path d="m40 29 20-5v18l-20 6z" fill="#996c53"/><path d="m45 31 10-3v8l-10 3z" fill="#d7ba86"/><path d="M18 25h19v11H18z" fill="#f5e5c8"/>',
  noodles: '<path d="M9 29h52q-5 22-25 23-21-1-27-23z"/><ellipse cx="35" cy="28" rx="26" ry="8" fill="#ddbd78"/><path d="m18 29 7-4 7 5 7-5 6 3m-8-3 15-19m-10 21L58 7" fill="none"/><path d="M15 36q18 9 40 0" fill="none" stroke="#f5e6cf"/>',
  sewing: '<path d="M20 19h30v28H20z"/><ellipse cx="35" cy="18" rx="20" ry="6" fill="#d9b697"/><ellipse cx="35" cy="48" rx="20" ry="5" fill="#d9b697"/><path d="m22 26 26 4m-26 2 26 4m-26 2 26 4m1 0q8-1 11 7" fill="none"/>',
  books: '<path d="m14 20 33-9 11 33-33 10-9-4z" fill="#eddec2"/><path d="m11 17 34-9 11 32-34 10z"/><path d="m17 16 10 32m-2-25 17-5m-15 10 12-4" fill="none" stroke="#f7eacb"/>',
};

export const orderTranslations = Object.fromEntries(
  Object.values(REGIONAL_ORDERS).flat().map(([name, translation]) => [name, translation]),
);

export function regionalProduct(type, index = 0) {
  const color = REGIONAL_ORDERS[type][index][2];
  const shape = drawings[type];
  const art = Array.isArray(shape) ? shape[index] : shape;
  return '<svg class="rg-art" aria-hidden="true" viewBox="0 0 72 64" stroke="#493c48" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" fill="' + color + '"><ellipse cx="36" cy="54" rx="25" ry="4" fill="#352638" opacity=".12" stroke="none"/>' + art + '</svg>';
}
