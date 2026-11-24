import { RULES, TYPES } from "./game.js";
import { icon } from "./icons.js";

const MENU = {
  donut: [
    ["Berry ring", "#f3a3a7"],
    ["Cocoa crunch", "#885843"],
    ["Lemon glaze", "#f2c66a"],
  ],
  tea: [
    ["Pearl milk", "#d2a46d"],
    ["Taro milk", "#bb9fc9"],
    ["Matcha milk", "#9fc394"],
  ],
  cafe: [
    ["House latte", "#d0a47c"],
    ["Mocha", "#92664c"],
    ["Matcha latte", "#a3ba8a"],
  ],
  sushi: [
    ["Salmon nigiri", "#f19c79"],
    ["Tamago nigiri", "#e9c45d"],
    ["Tuna nigiri", "#db8384"],
  ],
  hotpot: [
    ["Tomato pot", "#d9785f"],
    ["Miso pot", "#cd9f66"],
    ["Herbal pot", "#99b681"],
  ],
  market: [
    ["Lychee juice", "#e9a9aa"],
    ["Mango juice", "#f0bc5e"],
    ["Pear juice", "#a2c082"],
  ],
  game: [
    ["Ruby pad", "#e09a8f"],
    ["Ocean pad", "#88b4c2"],
    ["Lime pad", "#b8ca8e"],
  ],
};
const STATIONS = ["Ticket printer", "Stock crate", "Call bell"];
const ink = "#344237";
const sprite = (body, color) =>
  '<svg class="rg-art" aria-hidden="true" viewBox="0 0 72 64" fill="' +
  color +
  '" stroke="' +
  ink +
  '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="36" cy="55" rx="25" ry="5" fill="#132d26" opacity=".13" stroke="none"/>' +
  body +
  "</svg>";
const extra = [
  '<path d="M20 29l4 2m20-8 4 3m-1 18 3-2M34 36l2 3m-8-15 2-2" stroke="#fff2b6"/>',
  '<path d="m21 31 3-2 2 4-3 1zm23-8 3 1-1 4-3-2zm-2 17 3-2 3 3-3 2z" fill="#61452e" stroke-width="1"/>',
  '<path d="m17 35 10 5m-1-17 9 4m6 12 8 4m-1-18 8 4" fill="none" stroke="#fff8d0"/>',
];
function product(type, i) {
  const color = MENU[type][i][1];
  const bodies = {
    donut:
      '<path d="M10 35c0-12 12-22 27-22 14 0 25 8 25 20v4c0 13-14 21-27 21-15 0-25-10-25-23zm19-3c-1 4 4 7 9 5 4-1 7-5 6-8-1-3-6-4-10-2-3 1-5 3-5 5z" fill="#c48c58" fill-rule="evenodd"/><path d="M10 32c0-11 14-22 27-22 15 0 26 9 25 20 0 7-5 6-7 9-2 5-5 0-9 4-6 7-8 0-13 2-4 3-8 4-10-1s-5-2-8-5l-3-3zm18-2c-1 4 4 8 10 6s8-6 7-9c-1-4-6-5-11-3-4 1-6 4-6 6z" fill-rule="evenodd"/>' +
      extra[i],
    tea: '<path d="m38 18 6-16 5 2-6 16" fill="#e3a56f"/><path d="m18 21 4 31q12 8 28 0l5-31z"/><ellipse cx="36" cy="20" rx="20" ry="5" fill="#f8ead3"/><path d="m23 28 2 11" stroke="#fff8e7" stroke-width="3"/><g fill="#5d473a" stroke="none"><circle cx="29" cy="48" r="3"/><circle cx="37" cy="51" r="3"/><circle cx="44" cy="47" r="3"/><circle cx="36" cy="44" r="2.8"/></g>',
    cafe: '<ellipse cx="35" cy="51" rx="26" ry="6" fill="#f4e7cf"/><path d="M48 25c19-5 18 15 3 18l-2-5q14-5 3-8z" fill="#e6c29b"/><path d="M15 24h38l-3 19q-13 16-30 0z" fill="#eee2c9"/><ellipse cx="34" cy="24" rx="19" ry="6"/><path d="M25 23q8 8 18-1m-14 1q5 4 9-1" stroke="#ffefd3" fill="none"/>',
    sushi:
      '<path d="M9 38q0-9 10-13l30-5q14-1 15 12l-2 9q-3 8-17 11l-25 3Q9 55 9 43z" fill="#f8edce"/><path d="M8 36q1-11 13-16l27-5q12-1 16 10l-3 11q-14 0-38 11Q12 49 8 36z"/><path d="m22 23 13 16m1-19 13 15m-1-17 11 12" stroke="#ffe2ad" stroke-width="3"/>',
    hotpot:
      '<path d="M12 36H5v-6h10m42 0h9v6h-9" fill="#e3b274"/><path d="M11 27h48l-5 18q-15 15-35 1z" fill="#b35f4a"/><ellipse cx="35" cy="27" rx="24" ry="8"/><path d="m18 28 7-7 5 4m5 5 6-9 7 5" fill="#f7d7a2"/><path d="M25 15q-5-4 1-9m15 8q5-4 1-10" fill="none" stroke="#83978a"/>',
    market:
      '<path d="m19 18 7-9h21l7 9v32l-7 5H19z"/><path d="m19 18 27 1 8-1m-8 1v35M26 10l4 6h15" fill="none"/><path d="m22 26 20 1v15l-20-1z" fill="#fff1d2"/><circle cx="32" cy="34" r="5"/><path d="m32 28 4-3" stroke="#6a976d"/>',
    game: '<path d="M12 28q2-11 10-10l10 3h8l9-3q9-1 12 11l4 17q-1 11-8 7l-11-11H26L15 53q-9 4-8-8z"/><path d="M19 26h5v5h5v5h-5v5h-5v-5h-5v-5h5z" fill="#586453"/><circle cx="52" cy="29" r="3" fill="#f3c878"/><circle cx="46" cy="35" r="3" fill="#f2d6be"/><path d="M33 33h5" stroke-width="3"/>',
  };
  return sprite(bodies[type], color);
}
function station(i) {
  const bodies = [
    '<path d="M18 27h36l5 7v16H13V34z" fill="#7faaa0"/><path d="M23 29V10l4 2 3-2 4 2 4-2 4 2 5-2v19z" fill="#fff2cf"/><path d="M28 18h14m-14 5h10m-13 13h22" fill="none"/><path d="M23 47h26v9H23z" fill="#f4e3ba"/><circle cx="51" cy="39" r="2" fill="#f4b570"/>',
    '<path d="m8 26 28-10 28 9v23l-27 10-29-10z" fill="#ca966b"/><path d="m8 26 29 11 27-12M37 37v21m-25-21 20 8m9-2 19-8" fill="none"/><path d="m18 22 16-6 18 5-16 6z" fill="#f2c785"/><path d="m23 20 19 6" fill="none"/><path d="m20 34 7 3v9l-7-3z" fill="#efd5a5"/>',
    '<path d="M12 47q0-5 7-6h35q8 2 8 7v4H12z" fill="#8c664b"/><path d="M17 41q1-20 18-22 18 0 21 22z" fill="#e5b766"/><ellipse cx="36" cy="42" rx="21" ry="4" fill="#ebc478"/><path d="M35 19v-6m-4 0h10"/><path d="M24 33q2-7 7-8" stroke="#fff0ad"/>',
  ];
  return sprite(bodies[i], "#e3b278");
}

const queue = ["mei", "kit", "jo"];
function shuffled(list) {
  const copy = list.slice();
  for (let n = copy.length - 1; n > 0; n--) {
    const i = Math.floor(Math.random() * (n + 1));
    [copy[i], copy[n]] = [copy[n], copy[i]];
  }
  return copy;
}

export function mountRound(container, { game, shop, onFinish, onReport, sound = false, crewSupport = () => [] }) {
  const emergency = game === "emergency";
  const type = Object.hasOwn(MENU, shop.type) ? shop.type : "donut";
  const items = emergency ? STATIONS : MENU[type].map(([name]) => name);
  const art = (i) => (emergency ? station(i) : product(type, i));
  let limit = emergency ? RULES.emergencySeconds : RULES.rushSeconds;
  const queueBonusSeconds = 4;
  let runner, marshal;
  let runnerUsed = false;
  const goal = emergency
    ? RULES.emergencyGoal
    : RULES.rushGoal +
      (shop.phase === "contested"
        ? Math.max(0, shop.defense - RULES.baseDefense)
        : 0);
  const lives = 3;
  let phase = "brief",
    score = 0,
    mistakes = 0,
    deadline = 0;
  let order = -1,
    sequence = [],
    step = 0,
    interval = null,
    audio = null;
  let disposed = false;
  const timers = new Set();
  const after = (ms, fn) => {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!disposed) fn();
    }, ms);
    timers.add(id);
  };
  const clearTimers = () => {
    clearInterval(interval);
    timers.forEach(clearTimeout);
    timers.clear();
  };
  const beep = (pitch, duration = 0.09) => {
    if (!sound || !audio || audio.state !== "running") return;
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = pitch;
    gain.gain.setValueAtTime(0.045, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration,
    );
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  };

  container.innerHTML =
    '<div class="rg-board" data-phase="brief"><div class="rg-stats"><span class="rg-clock">' +
    icon("clock", 16) +
    "<b data-time>" +
    limit +
    's</b></span><div class="rg-meter"><i></i></div><b data-progress>0 / ' +
    goal +
    '</b></div><div class="rg-scene"><div class="rg-awning"></div><div class="rg-backwall"></div>' +
    '<div class="rg-scene-sign">' +
    TYPES[type].shopName +
    "</div>" +
    '<div class="rg-card"><div class="rg-ticket"><span data-caption></span><strong data-prompt></strong><small data-detail></small></div></div>' +
    '<div class="rg-queue" aria-hidden="true"></div><div class="rg-counter"></div></div>' +
    '<div class="rg-choices"></div><div class="rg-status" data-crew aria-live="polite" hidden></div><div class="rg-bottom"><span class="rg-status" aria-live="polite"></span>' +
    '<div data-strikes aria-label="3 chances remaining"><i></i><i></i><i></i></div></div>' +
    '<button type="button" class="rg-start" data-round-start>Start ' +
    (emergency ? "reset" : "shift") +
    " " +
    icon("arrow", 18) +
    "</button></div>";
  const find = (sel) => container.querySelector(sel);
  const board = find(".rg-board"),
    start = find("[data-round-start]");
  const choices = find(".rg-choices");
  choices.innerHTML = items
    .map(
      (label, i) =>
        '<button type="button" class="rg-choice" data-choice="' +
        i +
        '" aria-label="' +
        (emergency ? "Activate " : "Serve ") +
        label +
        '" aria-keyshortcuts="' +
        (i + 1) +
        '" disabled><kbd>' +
        (i + 1) +
        "</kbd>" +
        art(i) +
        "<span>" +
        label +
        "</span></button>",
    )
    .join("");
  const buttons = Array.from(choices.children);
  const ticket = find(".rg-ticket"),
    status = find(".rg-bottom .rg-status");
  const caption = find("[data-caption]"),
    prompt = find("[data-prompt]"),
    detail = find("[data-detail]");
  const time = find("[data-time]"),
    meter = find(".rg-meter i"),
    progress = find("[data-progress]");
  const strikes = find("[data-strikes]"),
    group = find(".rg-queue");
  const crewNote = find("[data-crew]");
  function showCrew() {
    const notes = [];
    if (runner)
      notes.push(
        runner.name +
          (runnerUsed ? " caught a wrong order." : " can catch one wrong order."),
      );
    if (marshal)
      notes.push(
        marshal.name + " keeps the queue open " + queueBonusSeconds + "s longer.",
      );
    crewNote.textContent = notes.join(" ");
    crewNote.hidden = !notes.length;
  }
  function checkArrivals() {
    if (emergency || (runner && marshal)) return;
    const present = crewSupport();
    const newRunner =
      !runner && present.find((member) => member.role === "Order runner");
    const newMarshal =
      !marshal && present.find((member) => member.role === "Queue marshal");
    if (!newRunner && !newMarshal) return;
    if (newRunner) runner = newRunner;
    if (newMarshal) {
      marshal = newMarshal;
      limit += queueBonusSeconds;
      if (deadline) deadline += queueBonusSeconds * 1000;
    }
    showCrew();
    if (phase === "brief") {
      time.textContent = limit + "s";
      briefRules();
    }
  }
  const repaint = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };
  const drawQueue = () => {
    group.innerHTML = queue
      .map(
        (_, i) =>
          '<img src="assets/world/' +
          queue[(score + i) % 3] +
          '.png" alt="" style="--rg-person:' +
          i +
          '">',
      )
      .join("");
  };
  const setPhase = (value) => {
    phase = value;
    board.dataset.phase = value;
  };
  caption.textContent = emergency ? "SERVICE CIRCUIT" : "COUNTER SHIFT";
  prompt.textContent = emergency ? "Restore the counter" : "The queue is here";
  detail.textContent = emergency
    ? "Watch the stations light up. Repeat the sequence."
    : "Read each order ticket. Pick the matching item below.";
  function briefRules() {
    const task = emergency
      ? "Restore " + goal + " circuits"
      : "Fill " + goal + " orders";
    status.textContent = task + " in " + limit + " seconds. Three strikes end the shift.";
  }
  briefRules();
  checkArrivals();
  drawQueue();

  function finish(success) {
    if (disposed || phase === "done") return;
    clearTimers();
    setPhase("done");
    buttons.forEach((button) => {
      button.disabled = true;
      button.classList.remove("rg-lit");
    });
    board.classList.toggle("rg-won", success);
    caption.textContent = success ? "SHIFT COMPLETE" : "SHIFT ENDED";
    prompt.textContent = success
      ? emergency
        ? "Systems restored!"
        : "Queue cleared!"
      : "Counter paused";
    detail.textContent = success
      ? "Your crew finished the job."
      : mistakes >= lives
        ? "Three misses this shift."
        : "The shift clock ran out.";
    status.textContent = detail.textContent;
    beep(success ? 810 : 185, 0.24);
    onFinish(success);
    if (onReport) after(650, () => onReport(success));
  }
  function tick() {
    checkArrivals();
    if (phase === "brief" || phase === "done") return;
    const remaining = Math.max(0, deadline - performance.now());
    const display = Math.ceil(remaining / 1000);
    time.textContent = display + "s";
    meter.style.width = remaining / (limit * 10) + "%";
    board.classList.toggle("rg-urgent", display <= 6);
    if (!remaining) finish(false);
  }
  function nextOrder() {
    const pool = shuffled([0, 1, 2].filter((i) => i !== order));
    order = pool[0];
    board.dataset.order = String(order);
    caption.textContent =
      "ORDER TICKET  /  " + String(score + 1).padStart(2, "0");
    prompt.textContent = items[order];
    detail.textContent = "One serving, please.";
    repaint(ticket, "rg-fresh");
    drawQueue();
  }
  function playSequence() {
    setPhase("watch");
    step = 0;
    sequence = shuffled([0, 1, 2]).slice(0, Math.min(score + 2, 3));
    if (score >= 2) sequence.push((sequence.at(-1) + 1) % 3);
    board.dataset.sequence = sequence.join(",");
    board.dataset.step = "0";
    caption.textContent =
      "SERVICE CIRCUIT  /  " + String(score + 1).padStart(2, "0");
    prompt.textContent = "Watch the signals";
    detail.textContent = sequence.length + " stations in this sequence.";
    sequence.forEach((i, n) => {
      after(300 + n * 730, () => {
        buttons[i].classList.add("rg-lit");
        detail.textContent = n + 1 + " · " + items[i];
        status.textContent = "Signal " + (n + 1) + ". " + items[i] + ".";
        beep(390 + i * 140, 0.16);
      });
      after(850 + n * 730, () => buttons[i].classList.remove("rg-lit"));
    });
    after(320 + sequence.length * 730, () => {
      setPhase("play");
      prompt.textContent = "Your turn";
      detail.textContent = "Replay the signals in order.";
      status.textContent = "Activate station 1 of " + sequence.length + ".";
    });
  }
  function choose(i) {
    if (disposed || phase !== "play") return;
    tick();
    if (phase === "done") return;
    const correct = i === (emergency ? sequence[step] : order);
    repaint(buttons[i], correct ? "rg-right" : "rg-wrong");
    if (!correct) {
      if (runner && !runnerUsed) {
        runnerUsed = true;
        showCrew();
        status.textContent = "Try that ticket again. You kept all remaining chances.";
        beep(355);
        return;
      }
      mistakes++;
      strikes.setAttribute(
        "aria-label",
        lives - mistakes + " chances remaining",
      );
      strikes.children[lives - mistakes].classList.add("rg-lost");
      beep(180, 0.18);
      status.textContent = emergency
        ? "Wrong station. Watch the circuit again."
        : "Check the ticket and try again.";
      if (mistakes >= lives) finish(false);
      else if (emergency) playSequence();
      return;
    }
    beep(490 + i * 120);
    if (emergency) {
      step++;
      board.dataset.step = String(step);
      if (step < sequence.length) {
        status.textContent =
          "Correct. Activate station " +
          (step + 1) +
          " of " +
          sequence.length +
          ".";
        return;
      }
    }
    score++;
    progress.textContent = score + " / " + goal;
    status.textContent = emergency
      ? "Circuit restored."
      : items[i] + " served.";
    if (score === goal) finish(true);
    else if (emergency) playSequence();
    else nextOrder();
  }
  function begin() {
    if (phase !== "brief") return;
    if (sound && window.AudioContext) {
      try {
        audio = new AudioContext();
        audio.resume().catch(() => {});
      } catch {
        /* Silent play remains available. */
      }
    }
    start.hidden = true;
    setPhase("play");
    buttons.forEach((button) => {
      button.disabled = false;
    });
    buttons[0].focus({ preventScroll: true });
    deadline = performance.now() + limit * 1000;
    status.textContent = emergency
      ? "Follow the lit stations."
      : "Click an item or use keys 1–3.";
    if (emergency) playSequence();
    else nextOrder();
    tick();
  }
  const onClick = (event) => {
    const target = event.target.closest("[data-choice]");
    if (target && choices.contains(target)) {
      event.stopPropagation();
      choose(Number(target.dataset.choice));
    }
  };
  const onKey = (event) => {
    if (
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      !/^[1-3]$/.test(event.key)
    )
      return;
    event.preventDefault();
    choose(Number(event.key) - 1);
  };
  start.addEventListener("click", begin);
  choices.addEventListener("click", onClick);
  container.addEventListener("keydown", onKey);
  interval = setInterval(tick, 90);
  return () => {
    disposed = true;
    clearTimers();
    start.removeEventListener("click", begin);
    choices.removeEventListener("click", onClick);
    container.removeEventListener("keydown", onKey);
    if (audio && audio.state !== "closed") audio.close().catch(() => {});
  };
}
