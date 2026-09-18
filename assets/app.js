import { toGregorian, jalaaliMonthLength, isLeapJalaaliYear, toJalaali } from "./vendor/jalaali.js";

const MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const WEEKDAYS_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const GREG_MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

const HIJRI_MONTHS_FA = [
  "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی",
  "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه",
];

const ZOROASTRIAN_DAY_NAMES = [
  "هرمزد", "بهمن", "اردیبهشت", "شهریور", "اسپندارمذ", "خرداد", "مرداد",
  "دی‌به‌آذر", "آذر", "آبان", "خور", "ماه", "تیر", "گوش", "دی‌به‌مهر",
  "مهر", "سروش", "رشن", "فروردین", "بهرام", "رام", "باد", "دی‌به‌دین",
  "دین", "ارد", "اشتاد", "آسمان", "زامیاد", "مارسپند", "انیران",
];

const JASHN_DAYS = {
  "1-19": "جشن فروردین‌گان",
  "2-3": "جشن اردیبهشت‌گان",
  "3-6": "جشن خردادگان",
  "4-13": "جشن تیرگان",
  "5-7": "جشن مردادگان",
  "6-4": "جشن شهریورگان",
  "7-16": "جشن مهرگان",
  "8-10": "جشن آبانگان",
  "9-9": "جشن آذرگان",
  "10-8": "جشن دی‌گان (دی‌به‌آذر)",
  "10-15": "جشن دی‌گان (دی‌به‌مهر)",
  "10-23": "جشن دی‌گان (دی‌به‌دین)",
  "11-2": "جشن بهمن‌گان",
  "12-5": "جشن اسپندگان",
};

const ANIMALS_FA = ["موش", "گاو", "پلنگ", "خرگوش", "نهنگ", "مار", "اسب", "گوسفند", "میمون", "مرغ", "سگ", "خوک"];

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFaDigits = (n) => String(n).replace(/[0-9]/g, (d) => FA_DIGITS[d]);

const weekdayIndex = (jsDate) => (jsDate.getDay() + 1) % 7;

const EVENTS = window.SARE_EVENTS || {};
const EVENTS_REGIONAL = window.SARE_EVENTS_REGIONAL || {};
const HISTORY_FACTS = window.SARE_HISTORY_FACTS || [];
const PROVERBS = window.SARE_PROVERBS || [];
const EVENT_CONTEXT = window.SARE_EVENT_CONTEXT || {};
const PASBAN_WORDS = window.SARE_PASBAN_WORDS || {};

const REGIONAL_KEY = "sareRegionalEvents";
const regionalEnabled = () => localStorage.getItem(REGIONAL_KEY) === "on";

function pad2(n) { return String(n).padStart(2, "0"); }

function dayInfo(jy, jm, jd) {
  const key = `${jy}-${pad2(jm)}-${pad2(jd)}`;
  const base = EVENTS[key] || { events: [], is_holiday: false };
  if (regionalEnabled() && EVENTS_REGIONAL[key]) {
    return { events: [...base.events, ...EVENTS_REGIONAL[key]], is_holiday: base.is_holiday };
  }
  return base;
}

function jashnFor(jm, jd) {
  return JASHN_DAYS[`${jm}-${jd}`] || null;
}

function yearAnimal(jy) {
  const idx = (((jy + 5) % 12) + 12) % 12;
  return ANIMALS_FA[idx];
}

function gregorianToJDN(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function jdnToGregorian(jdn) {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d2 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d2) / 4);
  const m2 = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m2 + 2) / 5) + 1;
  const month = m2 + 3 - 12 * Math.floor(m2 / 10);
  const year = 100 * b + d2 - 4800 + Math.floor(m2 / 10);
  return { gy: year, gm: month, gd: day };
}

function jdnToHijri(jdn) {
  let l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { hy: year, hm: month, hd: day };
}

function hijriToJDN(hy, hm, hd) {
  return Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
}

function todayJalali() {
  const now = new Date();
  return gregorianToJalaliApprox(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function gregorianToJalaliApprox(gy, gm, gd) {
  let jy = gy - 622;
  for (const candidate of [jy, jy + 1, jy - 1]) {
    const g1 = toGregorian(candidate, 1, 1);
    const g2 = toGregorian(candidate + 1, 1, 1);
    const d0 = Date.UTC(g1.gy, g1.gm - 1, g1.gd);
    const d1 = Date.UTC(g2.gy, g2.gm - 1, g2.gd);
    const dTarget = Date.UTC(gy, gm - 1, gd);
    if (dTarget >= d0 && dTarget < d1) {
      const diffDays = Math.round((dTarget - d0) / 86400000);
      return addDaysToJalali(candidate, 1, 1, diffDays);
    }
  }
  return { jy, jm: 1, jd: 1 };
}

function addDaysToJalali(jy, jm, jd, days) {
  let y = jy, m = jm, d = jd + days;
  while (true) {
    const len = jalaaliMonthLength(y, m);
    if (d <= len) break;
    d -= len;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return { jy: y, jm: m, jd: d };
}

function jalaliToGregDate(jy, jm, jd) {
  const g = toGregorian(jy, jm, jd);
  return new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
}

function daysBetweenJalali(a, b) {
  const da = jalaliToGregDate(a.jy, a.jm, a.jd);
  const db = jalaliToGregDate(b.jy, b.jm, b.jd);
  return Math.round((db - da) / 86400000);
}

const NOTES_KEY = "sareNotes";

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function buildMonthGrid(jy, jm) {
  const daysInMonth = jalaaliMonthLength(jy, jm);
  const firstGreg = toGregorian(jy, jm, 1);
  const firstJs = new Date(firstGreg.gy, firstGreg.gm - 1, firstGreg.gd);
  const startOffset = weekdayIndex(firstJs);

  const today = todayJalali();
  const notes = loadNotes();

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);

  for (let d = 1; d <= daysInMonth; d += 1) {
    const g = toGregorian(jy, jm, d);
    const info = dayInfo(jy, jm, d);
    const jashn = jashnFor(jm, d);
    const key = `${jy}-${pad2(jm)}-${pad2(d)}`;
    cells.push({
      day: d,
      dayFa: toFaDigits(d),
      dayNameFa: ZOROASTRIAN_DAY_NAMES[(d - 1) % 30],
      gregorianLabel: `${pad2(g.gd)} ${GREG_MONTHS_FA[g.gm - 1]}`,
      isToday: today.jy === jy && today.jm === jm && today.jd === d,
      isHoliday: !!info.is_holiday,
      hasNote: !!notes[key],
      events: jashn ? [jashn, ...(info.events || [])] : (info.events || []),
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function renderGrid(weeks) {
  const head = WEEKDAYS_FA.map((w) => `<div class="head-cell">${w}</div>`).join("");
  const rows = weeks.map((week) => {
    const rowCells = week.map((cell) => {
      if (!cell) return `<div class="cell empty"></div>`;
      const classes = ["cell"];
      if (cell.isToday) classes.push("today");
      if (cell.isHoliday) classes.push("holiday");
      const noteDot = cell.hasNote ? `<span class="note-dot" title="یادداشت دارد"></span>` : "";
      const dot = cell.events.length ? `<span class="event-dot" title="رخداد دارد"></span>` : "";
      return `<div class="${classes.join(" ")}" data-day="${cell.day}" tabindex="0" role="button" aria-label="${cell.dayFa} ${cell.dayNameFa}${cell.isHoliday ? "، فرویش" : ""}">
        <div class="cell-top">
          <span class="day-num">${cell.dayFa}</span>
          <span class="day-greg">${cell.gregorianLabel}</span>
        </div>
        <span class="day-name-fa">${cell.dayNameFa}</span>
        ${dot}
        ${noteDot}
      </div>`;
    }).join("");
    return `<div class="grid-row">${rowCells}</div>`;
  }).join("");

  return `<div class="grid-head">${head}</div>${rows}`;
}

function renderDayDetail(jy, jm, jd) {
  const g = toGregorian(jy, jm, jd);
  const jdn = gregorianToJDN(g.gy, g.gm, g.gd);
  const h = jdnToHijri(jdn);
  const info = dayInfo(jy, jm, jd);
  const jashn = jashnFor(jm, jd);
  const events = jashn ? [jashn, ...(info.events || [])] : (info.events || []);
  const dayName = ZOROASTRIAN_DAY_NAMES[(jd - 1) % 30];
  const notes = loadNotes();
  const noteKey = `${jy}-${pad2(jm)}-${pad2(jd)}`;
  const note = notes[noteKey];

  const eventsHtml = events.length
    ? `<ul class="detail-event-list">${events.map((e) => {
        const ctx = EVENT_CONTEXT[e];
        if (ctx) {
          return `<li class="expandable"><span class="ev-row"><span class="ev-text">${escapeHtml(e)}</span><span class="ev-arrow">›</span></span></li>`;
        }
        return `<li><span class="ev-row"><span class="ev-text">${escapeHtml(e)}</span></span></li>`;
      }).join("")}</ul>`
    : `<p class="detail-empty">رخدادی برای این روز ثبت نشده.</p>`;
  const noteHtml = note ? `<p class="detail-note"><b>یادداشت شما:</b> ${escapeHtml(note)}</p>` : "";

  const holder = document.getElementById("day-detail");
  holder.classList.remove("refresh");
  holder.innerHTML = `
    <div class="detail-header">
      <span class="detail-date">${toFaDigits(jd)} ${MONTHS_FA[jm - 1]} ${toFaDigits(jy)}</span>
      <span class="detail-sub">${dayName} · ${pad2(g.gd)} ${GREG_MONTHS_FA[g.gm - 1]} ${g.gy} · ${toFaDigits(h.hd)} ${HIJRI_MONTHS_FA[h.hm - 1]} ${toFaDigits(h.hy)}${info.is_holiday ? " · فرویش" : ""}</span>
    </div>
    ${eventsHtml}
    ${noteHtml}`;
  const withContext = events.filter((e) => EVENT_CONTEXT[e]);
  holder.querySelectorAll(".detail-event-list li.expandable").forEach((li, i) => {
    const eventText = withContext[i];
    li.addEventListener("click", () => {
      openModal(eventText, `<p class="popup-text">${escapeHtml(EVENT_CONTEXT[eventText])}</p>`);
    });
  });
  void holder.offsetWidth;
  holder.classList.add("refresh");
}

let selectedDay = null;

function selectDay(jy, jm, jd) {
  selectedDay = { jy, jm, jd };
  document.querySelectorAll(".cell.selected").forEach((c) => c.classList.remove("selected"));
  const cell = document.querySelector(`.cell[data-day="${jd}"]`);
  if (cell) cell.classList.add("selected");
  renderDayDetail(jy, jm, jd);
}

function render(jy, jm) {
  const weeks = buildMonthGrid(jy, jm);
  const grid = document.getElementById("grid");
  grid.classList.remove("fade-in");
  grid.innerHTML = renderGrid(weeks);
  void grid.offsetWidth;
  grid.classList.add("fade-in");
  document.getElementById("month-name").textContent = MONTHS_FA[jm - 1];
  document.getElementById("year-name").textContent = toFaDigits(jy);
  document.querySelector("main").dataset.jy = jy;
  document.querySelector("main").dataset.jm = jm;

  grid.querySelectorAll(".cell[data-day]").forEach((cellEl) => {
    const d = Number(cellEl.dataset.day);
    cellEl.addEventListener("click", () => selectDay(jy, jm, d));
    cellEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectDay(jy, jm, d); }
    });
  });

  const today = todayJalali();
  const isCurrentMonth = today.jy === jy && today.jm === jm;
  document.getElementById("today-row").classList.toggle("show", !isCurrentMonth);

  let defaultDay = isCurrentMonth ? today.jd : 1;
  if (selectedDay && selectedDay.jy === jy && selectedDay.jm === jm) {
    defaultDay = selectedDay.jd;
  }
  selectDay(jy, jm, defaultDay);
}

function shiftMonth(jy, jm, delta) {
  let m = jm + delta, y = jy;
  if (m < 1) { m = 12; y -= 1; }
  if (m > 12) { m = 1; y += 1; }
  return { y, m };
}

const TEHRAN_TIME_FMT = new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function updateClock() {
  const parts = TEHRAN_TIME_FMT.formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "00";
  const label = `${toFaDigits(get("hour"))}:${toFaDigits(get("minute"))}:${toFaDigits(get("second"))}`;
  const el = document.getElementById("clock-pill");
  if (el) el.textContent = "ساعت ایران " + label;
}

function stableDayNumber(jy, jm, jd) {
  return jy * 372 + jm * 31 + jd;
}

function renderFactOfTheDay() {
  const el = document.getElementById("fact-text");
  if (!el) return;
  const t = todayJalali();
  const info = dayInfo(t.jy, t.jm, t.jd);
  const jashn = jashnFor(t.jm, t.jd);
  const todaysEvents = jashn ? [jashn, ...(info.events || [])] : (info.events || []);
  if (todaysEvents.length) {
    const idx = stableDayNumber(t.jy, t.jm, t.jd) % todaysEvents.length;
    const chosen = todaysEvents[idx];
    const ctx = EVENT_CONTEXT[chosen];
    el.textContent = ctx ? `${chosen} ${ctx}` : chosen;
    return;
  }
  if (!HISTORY_FACTS.length) return;
  const idx = stableDayNumber(t.jy, t.jm, t.jd) % HISTORY_FACTS.length;
  el.textContent = HISTORY_FACTS[idx];
}

function renderProverbOfTheDay() {
  if (!PROVERBS.length) return;
  const t = todayJalali();
  const idx = (stableDayNumber(t.jy, t.jm, t.jd) + 7) % PROVERBS.length;
  const el = document.getElementById("proverb-text");
  if (el) el.textContent = PROVERBS[idx];
}

function openSideMenu() {
  document.getElementById("side-menu").classList.add("open");
  document.getElementById("menu-overlay").classList.add("visible");
}

function closeSideMenu() {
  document.getElementById("side-menu").classList.remove("open");
  document.getElementById("menu-overlay").classList.remove("visible");
}

function openModal(title, bodyHtml) {
  document.getElementById("modal-title").textContent = title;
  const body = document.getElementById("modal-body");
  body.innerHTML = bodyHtml;
  document.getElementById("modal-overlay").classList.add("visible");
  wireSteppers(body);
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("visible");
}

function wireSteppers(root) {
  root.querySelectorAll(".step-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      const step = parseInt(btn.dataset.step, 10);
      const cur = parseInt(input.value, 10) || 0;
      let next = cur + step;
      if (input.min !== "" && next < parseInt(input.min, 10)) next = parseInt(input.min, 10);
      if (input.max !== "" && next > parseInt(input.max, 10)) next = parseInt(input.max, 10);
      input.value = next;
    });
  });
}

function dateFieldRow(idPrefix, label, defaults, monthNames) {
  const opts = monthNames.map((m, i) =>
    `<option value="${i + 1}" ${defaults.m === i + 1 ? "selected" : ""}>${m}</option>`
  ).join("");
  return `
  <div class="field-row">
    <label>${label}</label>
    <div class="date-field">
      <div class="stepper">
        <button type="button" class="step-btn" data-target="${idPrefix}-y" data-step="-1">−</button>
        <input type="number" id="${idPrefix}-y" value="${defaults.y}">
        <button type="button" class="step-btn" data-target="${idPrefix}-y" data-step="1">+</button>
      </div>
      <select class="month-select" id="${idPrefix}-m">${opts}</select>
      <div class="stepper">
        <button type="button" class="step-btn" data-target="${idPrefix}-d" data-step="-1" data-min="1" data-max="31">−</button>
        <input type="number" id="${idPrefix}-d" min="1" max="31" value="${defaults.d}">
        <button type="button" class="step-btn" data-target="${idPrefix}-d" data-step="1">+</button>
      </div>
    </div>
  </div>`;
}

function readDateField(idPrefix) {
  return {
    y: parseInt(document.getElementById(`${idPrefix}-y`).value, 10),
    m: parseInt(document.getElementById(`${idPrefix}-m`).value, 10),
    d: parseInt(document.getElementById(`${idPrefix}-d`).value, 10),
  };
}

function yearStepperRow(id, label, value) {
  return `
  <div class="field-row">
    <label>${label}</label>
    <div class="stepper">
      <button type="button" class="step-btn" data-target="${id}" data-step="-1">−</button>
      <input type="number" id="${id}" value="${value}">
      <button type="button" class="step-btn" data-target="${id}" data-step="1">+</button>
    </div>
  </div>`;
}

function jalaliInputRow(idPrefix, label, defaults) {
  return dateFieldRow(idPrefix, label, { y: defaults.jy, m: defaults.jm, d: defaults.jd }, MONTHS_FA);
}

function readJalaliInput(idPrefix) {
  const { y, m, d } = readDateField(idPrefix);
  return { jy: y, jm: m, jd: d };
}

function toolDateConverter() {
  const t = todayJalali();
  const gToday = new Date();
  const gDefault = { y: gToday.getFullYear(), m: gToday.getMonth() + 1, d: gToday.getDate() };
  const jdnToday = gregorianToJDN(gDefault.y, gDefault.m, gDefault.d);
  const hRaw = jdnToHijri(jdnToday);
  const hDefault = { y: hRaw.hy, m: hRaw.hm, d: hRaw.hd };

  const html = `
    <div class="conv-tabs">
      <button class="conv-tab active" data-tab="jalali">جلالی</button>
      <button class="conv-tab" data-tab="gregorian">ترسایی</button>
      <button class="conv-tab" data-tab="hijri">مهی</button>
    </div>
    <div class="conv-panel" id="conv-panel-jalali">
      ${dateFieldRow("cj", "روزشمار جلالی", t, MONTHS_FA)}
    </div>
    <div class="conv-panel" id="conv-panel-gregorian" style="display:none">
      ${dateFieldRow("cg", "روزشمار ترسایی", gDefault, GREG_MONTHS_FA)}
    </div>
    <div class="conv-panel" id="conv-panel-hijri" style="display:none">
      ${dateFieldRow("ch", "روزشمار مهی", hDefault, HIJRI_MONTHS_FA)}
    </div>
    <button class="tool-btn" id="conv-run">ترادیس کن</button>
    <div class="tool-result" id="conv-result"></div>
    <p class="tool-note">ترادیسیِ مهی بر پایه‌ی گاهشمار جدولی انجام می‌شود، نه دیدِ مستقیم ماه، و ممکن است یک روز جابه‌جا باشد.</p>`;
  openModal("ترادیسیِ روزشمار", html);

  let activeTab = "jalali";
  document.querySelectorAll(".conv-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".conv-tab").forEach((b) => b.classList.remove("active"));
      tab.classList.add("active");
      activeTab = tab.dataset.tab;
      ["jalali", "gregorian", "hijri"].forEach((k) => {
        document.getElementById(`conv-panel-${k}`).style.display = k === activeTab ? "" : "none";
      });
    });
  });

  document.getElementById("conv-run").addEventListener("click", () => {
    const out = document.getElementById("conv-result");
    let jy, jm, jd, gy, gm, gd, hy, hm, hd;

    if (activeTab === "jalali") {
      const v = readDateField("cj");
      if (!v.y || !v.m || !v.d || v.d < 1 || v.d > jalaaliMonthLength(v.y, v.m)) {
        out.textContent = "روزشمار نوشته‌شده پای‌مند نیست.";
        return;
      }
      jy = v.y; jm = v.m; jd = v.d;
      const g = toGregorian(jy, jm, jd);
      gy = g.gy; gm = g.gm; gd = g.gd;
    } else if (activeTab === "gregorian") {
      const v = readDateField("cg");
      if (!v.y || !v.m || !v.d) { out.textContent = "روزشمار نوشته‌شده پای‌مند نیست."; return; }
      gy = v.y; gm = v.m; gd = v.d;
      const j = toJalaali(gy, gm, gd);
      jy = j.jy; jm = j.jm; jd = j.jd;
    } else {
      const v = readDateField("ch");
      if (!v.y || !v.m || !v.d) { out.textContent = "روزشمار نوشته‌شده پای‌مند نیست."; return; }
      const jdn = hijriToJDN(v.y, v.m, v.d);
      const g = jdnToGregorian(jdn);
      gy = g.gy; gm = g.gm; gd = g.gd;
      const j = toJalaali(gy, gm, gd);
      jy = j.jy; jm = j.jm; jd = j.jd;
    }

    const jdnFinal = gregorianToJDN(gy, gm, gd);
    const h = jdnToHijri(jdnFinal);
    hy = h.hy; hm = h.hm; hd = h.hd;

    out.innerHTML = `
      <div class="conv-result-grid">
        <div class="conv-result-row"><span>جلالی</span><b>${toFaDigits(jd)} ${MONTHS_FA[jm - 1]} ${toFaDigits(jy)}</b></div>
        <div class="conv-result-row"><span>ترسایی</span><b>${gd} ${GREG_MONTHS_FA[gm - 1]} ${gy}</b></div>
        <div class="conv-result-row"><span>مهی</span><b>${toFaDigits(hd)} ${HIJRI_MONTHS_FA[hm - 1]} ${toFaDigits(hy)}</b></div>
      </div>`;
  });
}

function toolDateDiff() {
  const t = todayJalali();
  const html = `
    <div class="tool-section">
      <h3>فاصله‌ی دو روزشمار / دیره</h3>
      ${jalaliInputRow("d1", "روزشمار نخست (برای نمونه، زایش)", t)}
      ${jalaliInputRow("d2", "روزشمار دوم (پیش‌گزیده: امروز)", t)}
      <button class="tool-btn" id="diff-run">بشمار</button>
      <div class="tool-result" id="diff-result"></div>
    </div>`;
  openModal("فاصله‌ی دو روزشمار و دیره", html);

  document.getElementById("diff-run").addEventListener("click", () => {
    const a = readJalaliInput("d1");
    const b = readJalaliInput("d2");
    const out = document.getElementById("diff-result");
    if (!a.jy || !a.jm || !a.jd || !b.jy || !b.jm || !b.jd) {
      out.textContent = "هر دو روزشمار را به‌تمامی بنویسید.";
      return;
    }
    const days = Math.abs(daysBetweenJalali(a, b));
    let years = Math.abs(b.jy - a.jy);
    let months = b.jm - a.jm;
    let dd = b.jd - a.jd;
    if (dd < 0) { months -= 1; }
    if (months < 0) { months += 12; years -= 1; }
    out.innerHTML = `
      فاصله: <b>${toFaDigits(days)}</b> روز
      <br>همتای کمابیش: <b>${toFaDigits(Math.abs(years))}</b> سال و <b>${toFaDigits(Math.abs(months))}</b> ماه`;
  });
}

function toolYearAnimal() {
  const t = todayJalali();
  const html = `
    <div class="tool-section">
      <h3>جانور سالِ زایش</h3>
      ${yearStepperRow("animal-year", "سال جلالی", t.jy)}
      <button class="tool-btn" id="animal-run">پیدا کن</button>
      <div class="tool-result" id="animal-result"></div>
      <p class="tool-note">بر پایه‌ی گاهشماری دوازده‌جانوریِ ترکی-مغولی که در ایران هم رواج داشته؛ تطبیقش با سال جلالی کمابیش است.</p>
    </div>`;
  openModal("جانور سال", html);

  document.getElementById("animal-run").addEventListener("click", () => {
    const jy = parseInt(document.getElementById("animal-year").value, 10);
    const out = document.getElementById("animal-result");
    if (!jy) { out.textContent = "یک سال پای‌مند بنویسید."; return; }
    out.innerHTML = `سال <b>${toFaDigits(jy)}</b> — سال <b>${yearAnimal(jy)}</b> است.`;
  });
}

function nextHolidayFrom(t) {
  let jy = t.jy, jm = t.jm, jd = t.jd;
  for (let i = 0; i < 400; i += 1) {
    const advanced = addDaysToJalali(jy, jm, jd, 1);
    jy = advanced.jy; jm = advanced.jm; jd = advanced.jd;
    const info = dayInfo(jy, jm, jd);
    if (info.is_holiday) return { jy, jm, jd, events: info.events };
  }
  return null;
}

function toolCountdown() {
  const t = todayJalali();
  const holiday = nextHolidayFrom(t);
  const nowruz = t.jm === 1 && t.jd === 1
    ? { jy: t.jy + 1, jm: 1, jd: 1 }
    : { jy: t.jm === 1 ? t.jy : t.jy + 1, jm: 1, jd: 1 };
  const daysToNowruz = daysBetweenJalali(t, nowruz);

  let holidayHtml = "چیزی یافت نشد.";
  if (holiday) {
    const days = daysBetweenJalali(t, holiday);
    const label = holiday.events && holiday.events.length ? holiday.events.join("، ") : "فرویش";
    holidayHtml = `<b>${toFaDigits(days)}</b> روز تا ${escapeHtml(label)}
      (${toFaDigits(holiday.jd)} ${MONTHS_FA[holiday.jm - 1]} ${toFaDigits(holiday.jy)})`;
  }

  const html = `
    <div class="tool-section">
      <h3>تا نوروز</h3>
      <div class="tool-result">${toFaDigits(daysToNowruz)} روز مانده</div>
    </div>
    <div class="tool-section">
      <h3>تا نزدیک‌ترین فرویش</h3>
      <div class="tool-result">${holidayHtml}</div>
    </div>`;
  openModal("شمارش وارونه", html);
}

function toolNotes() {
  const t = todayJalali();
  const renderList = () => {
    const entries = Object.entries(loadNotes()).sort(([a], [b]) => a.localeCompare(b));
    if (!entries.length) return `<p class="tool-note">هنوز یادداشتی نیست.</p>`;
    return `<ul class="note-list">${entries.map(([key, text]) => `
      <li>
        <span class="note-date">${key}</span>
        <span class="note-text">${escapeHtml(text)}</span>
        <button class="note-del" data-key="${key}" aria-label="زدایش">×</button>
      </li>`).join("")}</ul>`;
  };

  const html = `
    <div class="tool-section">
      <h3>یادداشت تازه</h3>
      ${jalaliInputRow("note", "روزشمار", t)}
      <div class="field-row">
        <label>نوشته‌ی یادداشت</label>
        <input type="text" id="note-text" placeholder="مثلاً سالگرد ازدواج">
      </div>
      <button class="tool-btn" id="note-add">بیفزای</button>
    </div>
    <div class="tool-section">
      <h3>یادداشت‌های شما</h3>
      <div id="note-list-holder">${renderList()}</div>
      <p class="tool-note">یادداشت‌ها فقط در همین مرورگر و روی همین دستگاه نگاه‌داری می‌شوند.</p>
      <div class="btn-row">
        <button class="tool-btn secondary" id="export-notes-btn">برون‌ریزی (JSON)</button>
        <label class="tool-btn secondary" for="import-notes-input">درون‌ریزی</label>
        <input type="file" id="import-notes-input" accept="application/json" style="display:none">
      </div>
      <div class="tool-note" id="notes-io-status"></div>
    </div>`;
  openModal("یادداشت‌ها", html);

  const attachDeleteHandlers = () => {
    document.querySelectorAll(".note-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const all = loadNotes();
        delete all[btn.dataset.key];
        saveNotes(all);
        document.getElementById("note-list-holder").innerHTML = renderList();
        attachDeleteHandlers();
        const cur = document.querySelector("main");
        render(Number(cur.dataset.jy), Number(cur.dataset.jm));
      });
    });
  };
  attachDeleteHandlers();

  document.getElementById("export-notes-btn").addEventListener("click", () => {
    const data = JSON.stringify(loadNotes(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sare-calendar-notes.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("import-notes-input").addEventListener("change", (e) => {
    const file = e.target.files[0];
    const status = document.getElementById("notes-io-status");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        const merged = { ...loadNotes(), ...imported };
        saveNotes(merged);
        document.getElementById("note-list-holder").innerHTML = renderList();
        attachDeleteHandlers();
        status.textContent = "یادداشت‌ها درون‌ریزی شدند.";
        const cur = document.querySelector("main");
        render(Number(cur.dataset.jy), Number(cur.dataset.jm));
      } catch {
        status.textContent = "فایل معتبر نبود.";
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("note-add").addEventListener("click", () => {
    const { jy, jm, jd } = readJalaliInput("note");
    const text = document.getElementById("note-text").value.trim();
    if (!jy || !jm || !jd || !text) return;
    const key = `${jy}-${pad2(jm)}-${pad2(jd)}`;
    const all = loadNotes();
    all[key] = text;
    saveNotes(all);
    document.getElementById("note-list-holder").innerHTML = renderList();
    attachDeleteHandlers();
    document.getElementById("note-text").value = "";
    const cur = document.querySelector("main");
    render(Number(cur.dataset.jy), Number(cur.dataset.jm));
  });
}

function miniMonthHtml(jy, jm) {
  const daysInMonth = jalaaliMonthLength(jy, jm);
  const firstGreg = toGregorian(jy, jm, 1);
  const firstJs = new Date(firstGreg.gy, firstGreg.gm - 1, firstGreg.gd);
  const startOffset = weekdayIndex(firstJs);
  const today = todayJalali();

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push("<span></span>");
  for (let d = 1; d <= daysInMonth; d += 1) {
    const info = dayInfo(jy, jm, d);
    const isToday = today.jy === jy && today.jm === jm && today.jd === d;
    const cls = [info.is_holiday ? "mm-holiday" : "", isToday ? "mm-today" : ""].join(" ").trim();
    cells.push(`<span class="${cls}">${toFaDigits(d)}</span>`);
  }
  return `<div class="mini-month">
    <h4>${MONTHS_FA[jm - 1]}</h4>
    <div class="mini-grid">${cells.join("")}</div>
  </div>`;
}

function toolYearView() {
  const t = todayJalali();
  const html = `
    ${yearStepperRow("year-view-year", "سال جلالی", t.jy)}
    <button class="tool-btn" id="year-view-run">بنمای</button>
    <div class="year-grid" id="year-grid"></div>`;
  openModal("نمای سال", html);

  const draw = (jy) => {
    const holder = document.getElementById("year-grid");
    holder.innerHTML = Array.from({ length: 12 }, (_, i) => miniMonthHtml(jy, i + 1)).join("");
  };
  draw(t.jy);
  document.getElementById("year-view-run").addEventListener("click", () => {
    const jy = parseInt(document.getElementById("year-view-year").value, 10);
    if (jy) draw(jy);
  });
}

function toolShareToday() {
  const t = todayJalali();
  const info = dayInfo(t.jy, t.jm, t.jd);
  const jashn = jashnFor(t.jm, t.jd);
  const events = jashn ? [jashn, ...(info.events || [])] : (info.events || []);
  const dateLine = `${toFaDigits(t.jd)} ${MONTHS_FA[t.jm - 1]} ${toFaDigits(t.jy)}`;
  const text = `امروز ${dateLine}${events.length ? "\n" + events.join("، ") : ""}`;

  const html = `
    <div class="tool-section">
      <div class="tool-result" id="share-text" style="white-space:pre-line">${escapeHtml(text)}</div>
      <div class="btn-row">
        <button class="tool-btn" id="share-run">هم‌رسانی</button>
        <button class="tool-btn secondary" id="copy-run">رونگاری نوشته</button>
      </div>
      <div class="tool-note" id="share-status"></div>
    </div>`;
  openModal("هم‌رسانیِ امروز", html);

  document.getElementById("share-run").addEventListener("click", async () => {
    const status = document.getElementById("share-status");
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "گاهشمار سره" });
      } catch {}
    } else {
      status.textContent = "هم‌رسانی سرراست روی این مرورگر پشتیبانی نمی‌شود؛ از رونگاری به‌کار ببرید.";
    }
  });

  document.getElementById("copy-run").addEventListener("click", async () => {
    const status = document.getElementById("share-status");
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "رونگاری شد.";
    } catch {
      status.textContent = "رونگاریِ خودکار شدنی نبود؛ نوشته را دستی رونگاری کنید.";
    }
  });
}

function normalizePersianLetter(ch) {
  if (ch === "ك") return "ک";
  if (ch === "ي") return "ی";
  return ch;
}

function pasbanLetters() {
  const set = new Set();
  Object.keys(PASBAN_WORDS).forEach((w) => {
    const ch = normalizePersianLetter(w[0]);
    if (/\p{L}/u.test(ch)) set.add(ch);
  });
  return [...set].sort((a, b) => a.localeCompare(b, "fa"));
}

function pasbanWordsByLetter(letter) {
  const entries = Object.entries(PASBAN_WORDS).filter(([w]) => normalizePersianLetter(w[0]) === letter);
  entries.sort((a, b) => a[0].localeCompare(b[0], "fa"));
  return entries;
}

function toolWordFinder() {
  const letters = pasbanLetters();
  const html = `
    <div class="conv-tabs">
      <button class="conv-tab active" data-tab="search">جست‌وجو</button>
      <button class="conv-tab" data-tab="browse">مرور الفبایی</button>
    </div>
    <div class="conv-panel" id="wf-panel-search">
      <div class="field-row">
        <label>واژه را بنویسید</label>
        <input type="text" id="word-input" placeholder="برای نمونه: کامپیوتر">
      </div>
      <button class="tool-btn" id="word-run">بجوی</button>
      <div class="tool-result" id="word-result"></div>
    </div>
    <div class="conv-panel" id="wf-panel-browse" style="display:none">
      <div class="letter-grid">${letters.map((l) => `<button class="letter-btn" data-letter="${l}">${l}</button>`).join("")}</div>
      <div id="glossary-holder"></div>
    </div>
    <p class="tool-note">این جستار از پایگاه‌داده‌ی آزادِ «پاسبان» (Pasban) بهره می‌برد — بیش از ۲۰هزار واژه‌ی بیگانه با برابرِ پارسیِ سره. <a href="https://github.com/keyaruga33/pasban_db" target="_blank" rel="noopener">pasban_db</a></p>`;
  openModal("واژه‌یاب سره", html);

  document.querySelectorAll(".conv-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".conv-tab").forEach((b) => b.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("wf-panel-search").style.display = tab.dataset.tab === "search" ? "" : "none";
      document.getElementById("wf-panel-browse").style.display = tab.dataset.tab === "browse" ? "" : "none";
    });
  });

  const run = () => {
    const q = document.getElementById("word-input").value.trim();
    const out = document.getElementById("word-result");
    if (!q) { out.textContent = ""; return; }
    if (PASBAN_WORDS[q]) {
      out.innerHTML = `<b>${escapeHtml(q)}</b> ← ${escapeHtml(PASBAN_WORDS[q])}`;
      return;
    }
    const matches = Object.keys(PASBAN_WORDS).filter((w) => w.includes(q)).slice(0, 8);
    if (!matches.length) {
      out.textContent = "چیزی یافت نشد — شاید این واژه خود پارسی است.";
      return;
    }
    out.innerHTML = matches.map((w) => `${escapeHtml(w)} ← ${escapeHtml(PASBAN_WORDS[w])}`).join("<br>");
  };
  document.getElementById("word-run").addEventListener("click", run);
  document.getElementById("word-input").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });

  const BATCH_SIZE = 150;
  document.querySelectorAll(".letter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".letter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const entries = pasbanWordsByLetter(btn.dataset.letter);
      let shown = 0;
      const holder = document.getElementById("glossary-holder");

      const renderBatch = () => {
        const next = entries.slice(shown, shown + BATCH_SIZE);
        const listHtml = next.map(([w, p]) => `<li><b>${escapeHtml(w)}</b> ← ${escapeHtml(p)}</li>`).join("");
        let list = holder.querySelector(".glossary-list");
        if (!list) {
          holder.innerHTML = `<ul class="glossary-list"></ul>`;
          list = holder.querySelector(".glossary-list");
        }
        list.insertAdjacentHTML("beforeend", listHtml);
        shown += next.length;
        const moreBtn = holder.querySelector("#glossary-more");
        if (moreBtn) moreBtn.remove();
        if (shown < entries.length) {
          holder.insertAdjacentHTML("beforeend",
            `<button class="tool-btn secondary" id="glossary-more">نمایش بیشتر (${toFaDigits(entries.length - shown)} مورد دیگر)</button>`);
          document.getElementById("glossary-more").addEventListener("click", renderBatch);
        }
      };
      holder.innerHTML = "";
      renderBatch();
    });
  });
}

function searchEvents(query) {
  const q = query.trim();
  if (!q) return [];
  const year = todayJalali().jy;
  const results = [];
  for (let jm = 1; jm <= 12; jm += 1) {
    const days = jalaaliMonthLength(year, jm);
    for (let jd = 1; jd <= days; jd += 1) {
      const jashn = jashnFor(jm, jd);
      const info = dayInfo(year, jm, jd);
      const events = jashn ? [jashn, ...(info.events || [])] : (info.events || []);
      events.forEach((e) => {
        if (e.includes(q)) results.push({ jm, jd, text: e });
      });
    }
  }
  return results;
}

function toolEventSearch() {
  const html = `
    <div class="tool-section">
      <div class="field-row">
        <label>نام یا رخداد را بجویید</label>
        <input type="text" id="search-input" placeholder="برای نمونه: کوروش">
      </div>
      <button class="tool-btn" id="search-run">بجوی</button>
      <div id="search-results"></div>
    </div>`;
  openModal("جست‌وجوی رخداد", html);

  const run = () => {
    const q = document.getElementById("search-input").value;
    const holder = document.getElementById("search-results");
    if (!q.trim()) { holder.innerHTML = ""; return; }
    const results = searchEvents(q);
    if (!results.length) {
      holder.innerHTML = `<p class="tool-note">چیزی یافت نشد.</p>`;
      return;
    }
    holder.innerHTML = `<ul class="search-result-list">${results.map((r) =>
      `<li class="search-result-item" data-m="${r.jm}" data-d="${r.jd}">
        <span class="sr-date">${toFaDigits(r.jd)} ${MONTHS_FA[r.jm - 1]}</span>
        <span class="sr-text">${escapeHtml(r.text)}</span>
      </li>`
    ).join("")}</ul>`;
    holder.querySelectorAll(".search-result-item").forEach((li) => {
      li.addEventListener("click", () => {
        const jm = Number(li.dataset.m);
        const jd = Number(li.dataset.d);
        const t = todayJalali();
        closeModal();
        render(t.jy, jm);
        selectDay(t.jy, jm, jd);
      });
    });
  };
  document.getElementById("search-run").addEventListener("click", run);
  document.getElementById("search-input").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
}

function toolSettings() {
  const on = regionalEnabled();
  const curTheme = localStorage.getItem(THEME_KEY) || "light";
  const curFont = localStorage.getItem(FONT_SIZE_KEY) || "md";
  const html = `
    <div class="tool-section">
      <h3>پوسته</h3>
      <div class="seg-control" id="theme-seg">
        <button class="seg-btn ${curTheme === "light" ? "active" : ""}" data-value="light">روشن</button>
        <button class="seg-btn ${curTheme === "dark" ? "active" : ""}" data-value="dark">تاریک</button>
        <button class="seg-btn ${curTheme === "auto" ? "active" : ""}" data-value="auto">خودکار (پیرو سیستم)</button>
      </div>
    </div>
    <div class="tool-section">
      <h3>اندازه‌ی نوشته</h3>
      <div class="seg-control" id="font-seg">
        <button class="seg-btn ${curFont === "sm" ? "active" : ""}" data-value="sm">کوچک</button>
        <button class="seg-btn ${curFont === "md" ? "active" : ""}" data-value="md">متوسط</button>
        <button class="seg-btn ${curFont === "lg" ? "active" : ""}" data-value="lg">بزرگ</button>
      </div>
    </div>
    <div class="tool-section">
      <div class="toggle-row">
        <div>
          <div class="toggle-label">رخدادهای منطقه‌ای</div>
          <div class="tool-note" style="margin-top:2px">روزهای شیراز، اصفهان، کرمان و چند شهر دیگر را هم به تقویم اضافه کن.</div>
        </div>
        <button class="toggle-switch ${on ? "on" : ""}" id="regional-toggle" role="switch" aria-checked="${on}"><span class="toggle-knob"></span></button>
      </div>
    </div>
    <div class="tool-section">
      <h3>یادداشت‌ها</h3>
      <button class="tool-btn danger" id="clear-notes-btn">پاک‌کردن همه‌ی یادداشت‌ها</button>
    </div>
    <div class="tool-section about-section">
      <h3>درباره</h3>
      <p class="popup-text">گاهشمار سره یک تقویم جلالیِ آزاد و متن‌باز است — سرشار از تاریخ و فرهنگ ایران، بدون شلوغی، و به‌طور کامل در همین مرورگر اجرا می‌شود.</p>
      <ul class="about-list">
        <li>تبدیل گاهشماری: <a href="https://github.com/jalaali/jalaali-js" target="_blank" rel="noopener">jalaali-js</a> (MIT)</li>
        <li>داده‌ی رخدادها: بستهٔ آزاد <a href="https://github.com/openscilab/rokh" target="_blank" rel="noopener">rokh</a></li>
        <li>واژه‌یاب سره: پایگاه‌داده‌ی <a href="https://github.com/keyaruga33/pasban_db" target="_blank" rel="noopener">پاسبان</a> (Pasban)</li>
        <li>فونت: <a href="https://github.com/rastikerdar/vazirmatn" target="_blank" rel="noopener">وزیرمتن</a> (SIL OFL)</li>
      </ul>
      <p class="tool-note">جزئیات گزینش رخدادها در <a href="CURATION-NOTES.md" target="_blank" rel="noopener">CURATION-NOTES.md</a> آمده است.</p>
      <p class="tool-note">نگارش ${SARE_VERSION}</p>
    </div>`;
  openModal("تنظیمات", html);

  document.querySelectorAll("#theme-seg .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#theme-seg .seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setThemePref(btn.dataset.value);
    });
  });

  document.querySelectorAll("#font-seg .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#font-seg .seg-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setFontSizePref(btn.dataset.value);
    });
  });

  document.getElementById("regional-toggle").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const next = !btn.classList.contains("on");
    btn.classList.toggle("on", next);
    btn.setAttribute("aria-checked", String(next));
    localStorage.setItem(REGIONAL_KEY, next ? "on" : "off");
    const cur = document.querySelector("main");
    render(Number(cur.dataset.jy), Number(cur.dataset.jm));
  });

  let clearArmed = false;
  document.getElementById("clear-notes-btn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    if (!clearArmed) {
      clearArmed = true;
      btn.textContent = "مطمئنید؟ (دوباره بزنید)";
      setTimeout(() => {
        clearArmed = false;
        btn.textContent = "پاک‌کردن همه‌ی یادداشت‌ها";
      }, 3000);
      return;
    }
    saveNotes({});
    clearArmed = false;
    btn.textContent = "همه‌ی یادداشت‌ها پاک شد";
    const cur = document.querySelector("main");
    render(Number(cur.dataset.jy), Number(cur.dataset.jm));
  });
}

const TOOLS = {
  "date-converter": { label: "ترادیسیِ روزشمار", run: toolDateConverter },
  "date-diff": { label: "فاصله‌ی دو روزشمار و دیره", run: toolDateDiff },
  "year-animal": { label: "جانور سال", run: toolYearAnimal },
  "countdown": { label: "شمارش وارونه", run: toolCountdown },
  "notes": { label: "یادداشت‌ها", run: toolNotes },
  "year-view": { label: "نمای سال", run: toolYearView },
  "share-today": { label: "هم‌رسانیِ امروز", run: toolShareToday },
  "event-search": { label: "جست‌وجوی رخداد", run: toolEventSearch },
  "word-finder": { label: "واژه‌یاب سره", run: toolWordFinder },
  "settings": { label: "تنظیمات", run: toolSettings },
};

function buildSideMenu() {
  const list = document.getElementById("tool-list");
  list.innerHTML = Object.entries(TOOLS).map(([id, tool]) =>
    `<button class="tool-list-item" data-tool="${id}">${tool.label}</button>`
  ).join("");
  list.querySelectorAll(".tool-list-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeSideMenu();
      TOOLS[btn.dataset.tool].run();
    });
  });
}

const THEME_KEY = "sareTheme";
const FONT_SIZE_KEY = "sareFontSize";
const SARE_VERSION = "۱.۰";

function systemPrefersDark() {
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function applyTheme(pref) {
  const dark = pref === "auto" ? systemPrefersDark() : pref === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function setThemePref(pref) {
  localStorage.setItem(THEME_KEY, pref);
  applyTheme(pref);
}

function applyFontSize(size) {
  document.documentElement.classList.remove("font-sm", "font-md", "font-lg");
  document.documentElement.classList.add(`font-${size}`);
}

function setFontSizePref(size) {
  localStorage.setItem(FONT_SIZE_KEY, size);
  applyFontSize(size);
}

function registerServiceWorker() {
  if (navigator.serviceWorker && typeof navigator.serviceWorker.register === "function") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

const SUN_SVG = `<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/></svg>`;
const MOON_SVG = `<svg class="moon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 1 0 10.5 10.5z"/></svg>`;

function main() {
  const today = todayJalali();
  const { jy, jm } = today;

  document.getElementById("theme-toggle").innerHTML = SUN_SVG + MOON_SVG;
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  applyFontSize(localStorage.getItem(FONT_SIZE_KEY) || "md");
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if ((localStorage.getItem(THEME_KEY) || "light") === "auto") applyTheme("auto");
    });
  }
  updateClock();
  setInterval(updateClock, 1000);

  render(jy, jm);
  renderFactOfTheDay();
  renderProverbOfTheDay();
  buildSideMenu();
  registerServiceWorker();

  document.getElementById("prev-btn").addEventListener("click", () => {
    const cur = document.querySelector("main");
    const shifted = shiftMonth(Number(cur.dataset.jy), Number(cur.dataset.jm), -1);
    render(shifted.y, shifted.m);
  });
  document.getElementById("next-btn").addEventListener("click", () => {
    const cur = document.querySelector("main");
    const shifted = shiftMonth(Number(cur.dataset.jy), Number(cur.dataset.jm), 1);
    render(shifted.y, shifted.m);
  });
  document.getElementById("today-btn").addEventListener("click", () => {
    const t = todayJalali();
    render(t.jy, t.jm);
  });

  document.getElementById("tools-btn").addEventListener("click", openSideMenu);
  document.getElementById("menu-close").addEventListener("click", closeSideMenu);
  document.getElementById("menu-overlay").addEventListener("click", closeSideMenu);

  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") closeModal();
  });

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
}

main();
