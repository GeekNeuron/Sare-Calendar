// -*- coding: utf-8 -*-
// «تقویم سره» (Sare Calendar) — منطق نمایش گاهشمار، در مرورگر (بدون هیچ سرور)
import { toGregorian, jalaaliMonthLength, isLeapJalaaliYear } from "./vendor/jalaali.js";

const MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

// هفته‌ی ایرانی از شنبه آغاز می‌شود
const WEEKDAYS_FA = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

const GREG_MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toFaDigits = (n) => String(n).replace(/[0-9]/g, (d) => FA_DIGITS[d]);

// شماره‌ی روز هفته با آغاز از شنبه (۰) تا جمعه (۶)، بر پایه‌ی Date.getDay() جاوااسکریپت
const weekdayIndex = (jsDate) => (jsDate.getDay() + 1) % 7;

// داده‌ها از پیش، با تگ‌های <script> عادی در index.html، در window قرار گرفته‌اند
// (assets/events-data.js و assets/history-facts.js) — نیازی به fetch و انتظار نیست،
// برای همین نمایش بدون هیچ حالت «در حال بارگذاری» بلافاصله انجام می‌شود.
const EVENTS = window.SARE_EVENTS || {};
const HISTORY_FACTS = window.SARE_HISTORY_FACTS || [];

function pad2(n) { return String(n).padStart(2, "0"); }

function dayInfo(jy, jm, jd) {
  const key = `${jy}-${pad2(jm)}-${pad2(jd)}`;
  return EVENTS[key] || { events: [], is_holiday: false };
}

function todayJalali() {
  // امروز را با استفاده از توابع میلادی مرورگر و برگرداندنش به جلالی محاسبه می‌کنیم
  const now = new Date();
  // با جست‌وجوی خطی کوچک دور امروز، تاریخ جلالی معادل را می‌یابیم
  // (چون کتابخانه فقط تبدیل جلالی به میلادی و برعکس با jdn دارد، این‌جا از راه ساده‌تر استفاده می‌کنیم)
  return gregorianToJalaliApprox(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// تبدیل میلادی به جلالی با گام برداشتن از یک نقطه‌ی مرجع شناخته‌شده
function gregorianToJalaliApprox(gy, gm, gd) {
  // نقطه‌ی مرجع: نوروز هر سال میلادی نزدیک به ۲۰ یا ۲۱ مارس رخ می‌دهد
  let jy = gy - 622;
  // march day of Farvardin 1 for candidate jy and jy+1
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
  // در موارد نادر بازگشت به سال جاری
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

function buildMonthGrid(jy, jm) {
  const daysInMonth = jalaaliMonthLength(jy, jm);
  const firstGreg = toGregorian(jy, jm, 1);
  const firstJs = new Date(firstGreg.gy, firstGreg.gm - 1, firstGreg.gd);
  const startOffset = weekdayIndex(firstJs);

  const today = todayJalali();

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(null);

  for (let d = 1; d <= daysInMonth; d += 1) {
    const g = toGregorian(jy, jm, d);
    const info = dayInfo(jy, jm, d);
    cells.push({
      day: d,
      dayFa: toFaDigits(d),
      gregorianLabel: `${pad2(g.gd)} ${GREG_MONTHS_FA[g.gm - 1]}`,
      isToday: today.jy === jy && today.jm === jm && today.jd === d,
      isHoliday: !!info.is_holiday,
      events: info.events || [],
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function renderGrid(weeks) {
  const head = WEEKDAYS_FA.map((w) => `<div class="head-cell">${w}</div>`).join("");
  const rows = weeks.map((week) => {
    const rowCells = week.map((cell) => {
      if (!cell) return `<div class="cell empty"></div>`;
      const classes = ["cell"];
      if (cell.isToday) classes.push("today");
      if (cell.isHoliday) classes.push("holiday");
      const shown = cell.events.slice(0, 2)
        .map((e) => `<li>${escapeHtml(e)}</li>`).join("");
      const more = cell.events.length > 2
        ? `<li class="more">+${toFaDigits(cell.events.length - 2)} رخداد دیگر</li>` : "";
      const list = cell.events.length ? `<ul class="event-list">${shown}${more}</ul>` : "";
      return `<div class="${classes.join(" ")}">
        <div class="cell-top">
          <span class="day-num">${cell.dayFa}</span>
          <span class="day-greg">${cell.gregorianLabel}</span>
        </div>
        ${list}
      </div>`;
    }).join("");
    return `<div class="grid-row">${rowCells}</div>`;
  }).join("");

  return `<div class="grid-head">${head}</div>${rows}`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function render(jy, jm) {
  const weeks = buildMonthGrid(jy, jm);
  document.getElementById("grid").innerHTML = renderGrid(weeks);
  document.getElementById("month-name").textContent = MONTHS_FA[jm - 1];
  document.getElementById("year-name").textContent = toFaDigits(jy);
  document.querySelector("main").dataset.jy = jy;
  document.querySelector("main").dataset.jm = jm;
}

function shiftMonth(jy, jm, delta) {
  let m = jm + delta, y = jy;
  if (m < 1) { m = 12; y -= 1; }
  if (m > 12) { m = 1; y += 1; }
  return { y, m };
}

// ساعت رسمی ایران: منطقه‌ی زمانی «Asia/Tehran»، همان مبنایی که time.ir از آن استفاده
// می‌کند (از سال ۱۴۰۱ ایران دیگر ساعت تابستانی/زمستانی ندارد و آفست همیشه +۳:۳۰ است).
// چون هیچ سروری در کار نیست، ساعت از ساعتِ خودِ دستگاه کاربر محاسبه می‌شود، نه از یک
// اتصال زنده به time.ir؛ اگر ساعت دستگاه درست تنظیم باشد، دقیقاً با آن یکسان خواهد بود.
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
  el.textContent = "امروز: " + `${g.getFullYear()}-${pad2(g.getMonth() + 1)}-${pad2(g.getDate())}` + " (میلادی)";
}

// یک عدد پایدار برای هر روزِ تقویم (نه هر بارگذاری صفحه) تا انتخاب جمله‌ی روز ثابت بماند
function stableDayNumber(jy, jm, jd) {
  return jy * 372 + jm * 31 + jd; // شماره‌ای یکتا و پیوسته برای هر روز جلالی
}

function renderFactOfTheDay() {
  if (!HISTORY_FACTS.length) return;
  const t = todayJalali();
  const idx = stableDayNumber(t.jy, t.jm, t.jd) % HISTORY_FACTS.length;
  const el = document.getElementById("fact-text");
  if (el) el.textContent = HISTORY_FACTS[idx];
}

function main() {
  const today = todayJalali();
  const { jy, jm } = today;

  updateTodayPill();
  updateClock();
  setInterval(updateClock, 1000);

  render(jy, jm);
  renderFactOfTheDay();

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
}

main();
