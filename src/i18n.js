// Translate presentation nodes in place. Active mini-games own their DOM and
// timers, and the simulation and saved event ledger use stable identifiers.
import { uiText, uiPatterns } from "./locale-ui.js";
import { activityText, activityPatterns } from "./locale-activities.js";
import { worldText, worldPatterns } from "./locale-world.js";
import { REGIONAL_TYPES } from "./regions.js";

const preferenceKey = "polamlife.language";
const skipSelector = '[translate="no"], script, style';
const attributes = ["aria-label", "title", "alt", "aria-description", "aria-roledescription"];
const lexicon = new Map();
for (const type of Object.values(REGIONAL_TYPES)) {
  lexicon.set(type.name.toLowerCase(), type.cn);
  lexicon.set(type.shopName.toLowerCase(), type.shopNameCn);
}
for (const wordlist of [uiText, activityText, worldText]) {
  for (const [source, translation] of Object.entries(wordlist)) {
    lexicon.set(source.toLowerCase(), translation);
  }
}

export function chinese(source) {
  const key = source.trim();
  if (!key || !/[A-Za-z]/.test(key)) return source;
  const phrase = lexicon.get(key.toLowerCase())
    || activityPatterns(key, chinese)
    || worldPatterns(key, chinese)
    || uiPatterns(key, chinese);
  if (phrase) return source.replace(key, () => phrase);
  const divider = [" · ", " → ", " / "].find(separator => key.includes(separator));
  if (!divider) return source;
  return source.replace(key, () => key.split(divider).map(chinese).join(divider));
}

function readLanguage() {
  try {
    return localStorage.getItem(preferenceKey) === "zh-CN" ? "zh-CN" : "en";
  } catch {
    return "en";
  }
}

let language = readLanguage();
function switchControl() {
  return language === "en"
    ? { target: "zh-CN", caption: "中文", label: "切换为简体中文" }
    : { target: "en", caption: "EN", label: "Switch to English" };
}
export function languageButton() {
  const { target, caption, label } = switchControl();
  return `<button type="button" class="lang-switch" data-language-switch translate="no" lang="${target}" aria-label="${label}">${caption}</button>`;
}

export function installLanguage() {
  const originals = new WeakMap();

  function update(node, field, current, write) {
    let fields = originals.get(node);
    if (!fields) {
      fields = new Map();
      originals.set(node, fields);
    }
    const previous = fields.get(field);
    const source = previous && current === previous.display ? previous.source : current;
    const display = language === "en" ? source : chinese(source);
    fields.set(field, { source, display });
    if (current !== display) write(display);
  }

  function localize(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.data.trim() || node.parentElement?.closest(skipSelector)) return;
      update(node, "text", node.data, text => { node.data = text; });
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.closest(skipSelector)) {
      for (const attr of attributes) {
        if (node.hasAttribute(attr)) {
          update(node, attr, node.getAttribute(attr), text => node.setAttribute(attr, text));
        }
      }
    }
  }

  function walk(node) {
    localize(node);
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tree = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (tree.nextNode()) localize(tree.currentNode);
  }

  function apply() {
    document.documentElement.lang = language;
    document.title = language === "en" ? "PolamLife · Digital Po Lam" : "PolamLife · 数字宝琳";
    walk(document.body);
    const { target, caption, label } = switchControl();
    for (const button of document.querySelectorAll("[data-language-switch]")) {
      button.textContent = caption;
      button.lang = target;
      button.setAttribute("aria-label", label);
    }
  }

  // Subsequent updates only visit changed fragments, such as a new order ticket.
  const observer = new MutationObserver(records => {
    if (language === "en") return;
    for (const record of records) {
      if (record.type === "childList") {
        for (const node of record.addedNodes) walk(node);
      } else {
        localize(record.target);
      }
    }
  });
  observer.observe(document.body, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: attributes,
  });
  document.addEventListener("click", event => {
    if (!event.target.closest?.("[data-language-switch]")) return;
    event.stopPropagation();
    language = switchControl().target;
    try {
      localStorage.setItem(preferenceKey, language);
    } catch { /* The selection remains active for this session. */ }
    apply();
  }, true);
  apply();
}
