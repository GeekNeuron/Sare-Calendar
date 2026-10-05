"""رخدادهای طبیعیِ نجومی (برابری شب و روز، بلندترین روز، گرفت‌ها، ...) را برای
سال‌های ۱۴۰۰ تا ۱۴۳۰ می‌شمارد و در assets/events-natural.js می‌نویسد.

نیازمندی: pip install astronomy-engine jdatetime
زمان‌ها به وقت ایران (Asia/Tehran) هستند.
"""
import datetime as dt
import json
import os
from zoneinfo import ZoneInfo

import astronomy as ast
import jdatetime

START_YEAR = 1400
END_YEAR = 1430
TZ = ZoneInfo("Asia/Tehran")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "events-natural.js")
TEHRAN = ast.Observer(35.6892, 51.3890, 1200)

FA = "۰۱۲۳۴۵۶۷۸۹"

# توضیحِ پاپ‌آپ؛ کلید = نوشته‌ی رخداد پیش از « · »
CONTEXT = {
    "برابری شب و روز بهاری؛ تحویل سال نو": "در این لحظه خورشید از استوای آسمان به سوی شمال می‌گذرد و شب و روز در سراسر جهان کمابیش برابر می‌شوند. آغاز سال خورشیدیِ ایرانی، یعنی لحظه‌ی تحویل سال، همین است و روزِ نوروز بر پایه‌ی آن (ساعتِ تهران پیش از نیمروز یا پس از آن) برگزیده می‌شود. ساعتِ نوشته‌شده به وقت ایران است.",
    "بلندترین روز سال؛ آغاز تابستان": "خورشید به دورترین جای شمالیِ مسیرش می‌رسد؛ در نیم‌کره‌ی شمالی این بلندترین روز و کوتاه‌ترین شب سال است و تابستانِ ستاره‌شناختی آغاز می‌شود. ساعتِ نوشته‌شده به وقت ایران است.",
    "برابری شب و روز پاییزی؛ آغاز پاییز": "خورشید دوباره از استوای آسمان می‌گذرد، این بار به سوی جنوب، و شب و روز کمابیش برابر می‌شوند. از این لحظه پاییزِ ستاره‌شناختی در نیم‌کره‌ی شمالی آغاز می‌شود. ساعتِ نوشته‌شده به وقت ایران است.",
    "درازترین شب سال؛ آغاز زمستان": "خورشید به دورترین جای جنوبیِ مسیرش می‌رسد؛ در نیم‌کره‌ی شمالی این درازترین شب و کوتاه‌ترین روز سال است و زمستانِ ستاره‌شناختی آغاز می‌شود. شب یلدا بر پایه‌ی همین رخداد در ایران جشن گرفته می‌شود. ساعتِ نوشته‌شده به وقت ایران است.",
    "کمترین فاصله‌ی زمین از خورشید": "زمین در مسیر بیضی‌شکلش به نزدیک‌ترین نقطه از خورشید می‌رسد (حدود ۱۴۷ میلیون کیلومتر). این رخداد در زمستانِ نیم‌کره‌ی شمالی رخ می‌دهد و ربطی به گرمی و سردیِ فصل‌ها ندارد؛ فصل‌ها از کجیِ محور زمین پدید می‌آیند.",
    "بیشترین فاصله‌ی زمین از خورشید": "زمین در مسیر بیضی‌شکلش به دورترین نقطه از خورشید می‌رسد (حدود ۱۵۲ میلیون کیلومتر). این رخداد در تابستانِ نیم‌کره‌ی شمالی رخ می‌دهد؛ فصل‌ها از کجیِ محور زمین پدید می‌آیند، نه از فاصله‌ی آن تا خورشید.",
    "ماه‌گرفتگیِ کامل": "زمین میان خورشید و ماه قرار می‌گیرد و ماه به‌کلی در سایه‌ی زمین فرو می‌رود؛ ماه در این هنگام معمولاً رنگی مسی و سرخ‌فام دارد. هرجا ماه بالای افق باشد می‌توان آن را دید و دیدنش نیازی به ابزار ندارد.",
    "ماه‌گرفتگیِ بخشی": "تنها بخشی از ماه در سایه‌ی تاریکِ زمین فرو می‌رود. هرجا ماه بالای افق باشد می‌توان آن را دید و دیدنش نیازی به ابزار ندارد.",
    "خورشیدگرفتگیِ کامل": "ماه درست میان زمین و خورشید قرار می‌گیرد و در نوار باریکی از زمین، قرصِ خورشید را به‌کلی می‌پوشاند. دیدن آن تنها از همان نوار شدنی است؛ جاهای دیگر گرفتِ بخشی دیده می‌شود. نگاه‌کردن بی‌پوششِ ایمن به خورشید آسیب جدی به چشم می‌زند.",
    "خورشیدگرفتگیِ حلقه‌ای": "ماه میان زمین و خورشید قرار می‌گیرد، اما چون کمی دورتر از زمین است قرصش کوچک‌تر از قرص خورشید می‌نماید و حلقه‌ای درخشان پیرامونش می‌ماند. نگاه‌کردن بی‌پوششِ ایمن به خورشید آسیب جدی به چشم می‌زند.",
    "خورشیدگرفتگیِ بخشی": "ماه تنها بخشی از قرص خورشید را می‌پوشاند. نگاه‌کردن بی‌پوششِ ایمن به خورشید آسیب جدی به چشم می‌زند.",
    "خورشیدگرفتگیِ ترکیبی": "در بخشی از مسیر گرفت، ماه خورشید را به‌کلی می‌پوشاند و در بخشی دیگر حلقه‌ای می‌ماند. نگاه‌کردن بی‌پوششِ ایمن به خورشید آسیب جدی به چشم می‌زند.",
}

METEORS = [(1, 4, "بارش شهابیِ چارکی‌ها (کوادرانتیدها)"), (4, 22, "بارش شهابیِ شلیاقی‌ها (لیریدها)"),
           (8, 12, "بارش شهابیِ برساووشی‌ها (پرسئیدها)"), (10, 21, "بارش شهابیِ جباری‌ها (اوریونیدها)"),
           (11, 17, "بارش شهابیِ اسدی‌ها (لئونیدها)"), (12, 14, "بارش شهابیِ جوزایی‌ها (ژمینیدها)")]
for _m, _d, _name in METEORS:
    CONTEXT[_name] = ("هر سال زمین از میان بازمانده‌های غبارِ یک دنباله‌دار یا سیارک می‌گذرد و ذره‌های ریز با شتاب در جو می‌سوزند و «شهاب» می‌سازند. "
                      "روز نوشته‌شده اوجِ کمابیشِ این بارش است و می‌تواند یک روز پس‌وپیش شود. برای دیدن بهتر، شب‌های بی‌ماه و دور از روشنایی شهر را برگزینید.")


def fa(s):
    return "".join(FA[int(c)] if c.isdigit() else c for c in str(s))


def local(astro_time):
    return astro_time.Utc().replace(tzinfo=dt.timezone.utc).astimezone(TZ)


def jkey(d):
    j = jdatetime.date.fromgregorian(date=d)
    return f"{j.year:04d}-{j.month:02d}-{j.day:02d}", j.year


def hhmm(t):
    return fa(t.strftime("%H:%M"))


def main():
    data = {}

    def add(t_local, text):
        key, jy = jkey(t_local.date())
        if START_YEAR <= jy <= END_YEAR:
            data.setdefault(key, []).append(text)

    g0, g1 = START_YEAR + 620, END_YEAR + 622
    for gy in range(g0, g1 + 1):
        s = ast.Seasons(gy)
        add(local(s.mar_equinox), f"برابری شب و روز بهاری؛ تحویل سال نو · ساعت {hhmm(local(s.mar_equinox))}")
        add(local(s.jun_solstice), f"بلندترین روز سال؛ آغاز تابستان · ساعت {hhmm(local(s.jun_solstice))}")
        add(local(s.sep_equinox), f"برابری شب و روز پاییزی؛ آغاز پاییز · ساعت {hhmm(local(s.sep_equinox))}")
        add(local(s.dec_solstice), f"درازترین شب سال؛ آغاز زمستان · ساعت {hhmm(local(s.dec_solstice))}")

        # نزدیک‌ترین و دورترین فاصله‌ی زمین از خورشید
        apsis = ast.SearchPlanetApsis(ast.Body.Earth, ast.Time.Make(gy, 1, 1, 0, 0, 0))
        for _ in range(3):
            t = local(apsis.time)
            if t.year != gy:
                break
            if apsis.kind == ast.ApsisKind.Pericenter:
                add(t, f"کمترین فاصله‌ی زمین از خورشید · ساعت {hhmm(t)}")
            else:
                add(t, f"بیشترین فاصله‌ی زمین از خورشید · ساعت {hhmm(t)}")
            apsis = ast.NextPlanetApsis(ast.Body.Earth, apsis)

        # بارش‌های شهابیِ بزرگ (اوجِ کمابیش)
        for (m, d, name) in METEORS:
            add(dt.datetime(gy, m, d, 12, tzinfo=TZ), f"{name} · اوج کمابیش")

    # ماه‌گرفتگی‌ها
    ecl = ast.SearchLunarEclipse(ast.Time.Make(g0, 1, 1, 0, 0, 0))
    while True:
        t = local(ecl.peak)
        if t.year > g1:
            break
        if ecl.kind in (ast.EclipseKind.Total, ast.EclipseKind.Partial):
            kind = "کامل" if ecl.kind == ast.EclipseKind.Total else "بخشی"
            eq = ast.Equator(ast.Body.Moon, ecl.peak, TEHRAN, True, True)
            hor = ast.Horizon(ecl.peak, TEHRAN, eq.ra, eq.dec, ast.Refraction.Normal)
            vis = "در ایران دیدنی است" if hor.altitude > 0 else "در ایران دیده نمی‌شود"
            add(t, f"ماه‌گرفتگیِ {kind} · اوج ساعت {hhmm(t)} · {vis}")
        ecl = ast.NextLunarEclipse(ecl.peak)

    # خورشیدگرفتگی‌ها
    se = ast.SearchGlobalSolarEclipse(ast.Time.Make(g0, 1, 1, 0, 0, 0))
    while True:
        t = local(se.peak)
        if t.year > g1:
            break
        kinds = {ast.EclipseKind.Total: "کامل", ast.EclipseKind.Annular: "حلقه‌ای",
                 ast.EclipseKind.Partial: "بخشی"}
        kind = kinds.get(se.kind, "ترکیبی")
        loc = ast.SearchLocalSolarEclipse(se.peak.AddDays(-1), TEHRAN)
        in_iran = abs(loc.peak.time.ut - se.peak.ut) < 0.5 and loc.peak.altitude > 0
        vis = "در ایران دیدنی است" if in_iran else "در ایران دیده نمی‌شود"
        add(t, f"خورشیدگرفتگیِ {kind} · اوج ساعت {hhmm(t)} · {vis}")
        se = ast.NextGlobalSolarEclipse(se.peak)

    data = {k: data[k] for k in sorted(data)}
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("window.SARE_EVENTS_NATURAL = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
        f.write("window.SARE_NATURAL_CONTEXT = ")
        json.dump(CONTEXT, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"{OUT_PATH} -> {len(data)} days, {sum(len(v) for v in data.values())} events")


if __name__ == "__main__":
    main()
