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
const HISTORY_FACTS = window.SARE_HISTORY_FACTS || [];
const PASBAN_WORDS = window.SARE_PASBAN_WORDS || {};

function pad2(n) { return String(n).padStart(2, "0"); }

function dayInfo(jy, jm, jd) {
  const key = `${jy}-${pad2(jm)}-${pad2(jd)}`;
  return EVENTS[key] || { events: [], is_holiday: false };
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
      return `<div class="${classes.join(" ")}" data-day="${cell.day}" tabindex="0" role="button">
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
  const info = dayInfo(jy, jm, jd);
  const jashn = jashnFor(jm, jd);
  const events = jashn ? [jashn, ...(info.events || [])] : (info.events || []);
  const dayName = ZOROASTRIAN_DAY_NAMES[(jd - 1) % 30];
  const notes = loadNotes();
  const noteKey = `${jy}-${pad2(jm)}-${pad2(jd)}`;
  const note = notes[noteKey];

  const eventsHtml = events.length
    ? `<ul class="detail-event-list">${events.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : `<p class="detail-empty">رخدادی برای این روز ثبت نشده.</p>`;
  const noteHtml = note ? `<p class="detail-note"><b>یادداشت شما:</b> ${escapeHtml(note)}</p>` : "";

  const holder = document.getElementById("day-detail");
  holder.innerHTML = `
    <div class="detail-header">
      <span class="detail-date">${toFaDigits(jd)} ${MONTHS_FA[jm - 1]} ${toFaDigits(jy)}</span>
      <span class="detail-sub">${dayName} — ${pad2(g.gd)} ${GREG_MONTHS_FA[g.gm - 1]} ${g.gy}${info.is_holiday ? " · فرویش" : ""}</span>
    </div>
    ${eventsHtml}
    ${noteHtml}`;
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
  let defaultDay = (today.jy === jy && today.jm === jm) ? today.jd : 1;
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

function updateTodayPill() {
  const el = document.getElementById("today-pill");
  if (!el) return;
  const g = new Date();
  el.textContent = "امروز: " + `${g.getFullYear()}-${pad2(g.getMonth() + 1)}-${pad2(g.getDate())}` + " (ترسایی)";
}

function stableDayNumber(jy, jm, jd) {
  return jy * 372 + jm * 31 + jd;
}

function renderFactOfTheDay() {
  if (!HISTORY_FACTS.length) return;
  const t = todayJalali();
  const idx = stableDayNumber(t.jy, t.jm, t.jd) % HISTORY_FACTS.length;
  const el = document.getElementById("fact-text");
  if (el) el.textContent = HISTORY_FACTS[idx];
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
  document.getElementById("modal-body").innerHTML = bodyHtml;
  document.getElementById("modal-overlay").classList.add("visible");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("visible");
}

function jalaliInputRow(idPrefix, label, defaults) {
  return `
  <div class="field-row">
    <label>${label}</label>
    <div class="field-triplet">
      <input type="number" id="${idPrefix}-y" placeholder="سال" value="${defaults.jy}">
      <input type="number" id="${idPrefix}-m" placeholder="ماه" min="1" max="12" value="${defaults.jm}">
      <input type="number" id="${idPrefix}-d" placeholder="روز" min="1" max="31" value="${defaults.jd}">
    </div>
  </div>`;
}

function readJalaliInput(idPrefix) {
  const jy = parseInt(document.getElementById(`${idPrefix}-y`).value, 10);
  const jm = parseInt(document.getElementById(`${idPrefix}-m`).value, 10);
  const jd = parseInt(document.getElementById(`${idPrefix}-d`).value, 10);
  return { jy, jm, jd };
}

function toolDateConverter() {
  const t = todayJalali();
  const html = `
    <div class="tool-section">
      <h3>جلالی به ترسایی و مهی</h3>
      ${jalaliInputRow("jg", "روزشمار جلالی", t)}
      <button class="tool-btn" id="jg-run">ترادیس کن</button>
      <div class="tool-result" id="jg-result"></div>
    </div>
    <div class="tool-section">
      <h3>ترسایی به جلالی</h3>
      <div class="field-row">
        <label>روزشمار ترسایی</label>
        <input type="date" id="gj-input">
      </div>
      <button class="tool-btn" id="gj-run">ترادیس کن</button>
      <div class="tool-result" id="gj-result"></div>
    </div>
    <p class="tool-note">این ترادیسی بر پایه‌ی گاهشمار مهیِ جدولی انجام می‌شود، نه دیدِ مستقیم ماه، و ممکن است یک روز جابه‌جا باشد.</p>`;
  openModal("ترادیسیِ روزشمار", html);

  document.getElementById("jg-run").addEventListener("click", () => {
    const { jy, jm, jd } = readJalaliInput("jg");
    const out = document.getElementById("jg-result");
    if (!jy || !jm || !jd || jm < 1 || jm > 12 || jd < 1 || jd > jalaaliMonthLength(jy, jm)) {
      out.textContent = "روزشمار نوشته‌شده پای‌مند نیست.";
      return;
    }
    const g = toGregorian(jy, jm, jd);
    const jdn = gregorianToJDN(g.gy, g.gm, g.gd);
    const h = jdnToHijri(jdn);
    out.innerHTML = `ترسایی: <b>${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}</b>
      <br>مهی (کمابیش): <b>${toFaDigits(h.hd)} ${HIJRI_MONTHS_FA[h.hm - 1]} ${toFaDigits(h.hy)}</b>`;
  });

  document.getElementById("gj-run").addEventListener("click", () => {
    const val = document.getElementById("gj-input").value;
    const out = document.getElementById("gj-result");
    if (!val) { out.textContent = "یک روزشمار ترسایی برگزینید."; return; }
    const [gy, gm, gd] = val.split("-").map((x) => parseInt(x, 10));
    const j = toJalaali(gy, gm, gd);
    out.textContent = `${toFaDigits(j.jy)}/${toFaDigits(pad2(j.jm))}/${toFaDigits(pad2(j.jd))} — ${MONTHS_FA[j.jm - 1]} ${toFaDigits(j.jy)}`;
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
      <div class="field-row">
        <label>سال جلالی</label>
        <input type="number" id="animal-year" value="${t.jy}">
      </div>
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
    <div class="field-row">
      <label>سال جلالی</label>
      <input type="number" id="year-view-year" value="${t.jy}">
    </div>
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
      <button class="tool-btn" id="share-run">هم‌رسانی</button>
      <button class="tool-btn secondary" id="copy-run">رونگاری نوشته</button>
      <div class="tool-note" id="share-status"></div>
    </div>`;
  openModal("هم‌رسانیِ امروز", html);

  document.getElementById("share-run").addEventListener("click", async () => {
    const status = document.getElementById("share-status");
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "تقویم سره" });
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

function toolWordFinder() {
  const html = `
    <div class="tool-section">
      <div class="field-row">
        <label>واژه را بنویسید</label>
        <input type="text" id="word-input" placeholder="برای نمونه: کامپیوتر">
      </div>
      <button class="tool-btn" id="word-run">بجوی</button>
      <div class="tool-result" id="word-result"></div>
    </div>
    <p class="tool-note">این جستار از پایگاه‌داده‌ی آزادِ «پاسبان» (Pasban) بهره می‌برد — بیش از ۲۰هزار واژه‌ی بیگانه با برابرِ پارسیِ سره. <a href="https://github.com/keyaruga33/pasban_db" target="_blank" rel="noopener">pasban_db</a></p>`;
  openModal("واژه‌یاب سره", html);

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
}

const TOOLS = {
  "date-converter": { label: "ترادیسیِ روزشمار", run: toolDateConverter },
  "date-diff": { label: "فاصله‌ی دو روزشمار و دیره", run: toolDateDiff },
  "year-animal": { label: "جانور سال", run: toolYearAnimal },
  "countdown": { label: "شمارش وارونه", run: toolCountdown },
  "notes": { label: "یادداشت‌ها", run: toolNotes },
  "year-view": { label: "نمای سال", run: toolYearView },
  "share-today": { label: "هم‌رسانیِ امروز", run: toolShareToday },
  "word-finder": { label: "واژه‌یاب سره", run: toolWordFinder },
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

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}

function registerServiceWorker() {
  if (navigator.serviceWorker && typeof navigator.serviceWorker.register === "function") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function main() {
  const today = todayJalali();
  const { jy, jm } = today;

  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  updateTodayPill();
  updateClock();
  setInterval(updateClock, 1000);

  render(jy, jm);
  renderFactOfTheDay();
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
