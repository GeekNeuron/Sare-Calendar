"""رخدادهای گاهشمار را از بسته‌ی `rokh` می‌سازد.

سه خروجی:
  assets/events-data.js      رخدادهای اصلیِ هر روز ۱۴۰۰ تا ۱۴۳۰ (جلالی) + رنگِ فرویش (h=true: فرویشِ قمری)
  assets/events-regional.js  لایه‌ی اختیاریِ روزهای شهرها و استان‌ها
  assets/events-global.js    لایه‌ی اختیاریِ رخدادها و روزهای جهانی (کلید: «ماه-روز» میلادی)

قاعده‌ی گزینش: همه‌ی رخدادهای rokh نگه داشته می‌شوند، مگر
  - موارد مذهبیِ اسلامی (فهرست EXCLUDED_ISLAMIC)،
  - نسخه‌های تکراریِ جشن‌های ماهانه که برنامه خودش نشان می‌دهد (DUPLICATE_OF_APP).
نام‌های ناسره یا ناپاکیزه با RENAME پاکیزه می‌شوند.
برای ویرایش قاعده، همین فایل را عوض و دوباره اجرا کنید.
"""
import json
import os
import re

import jdatetime
from rokh import DateSystem, get_events

START_YEAR = 1400
END_YEAR = 1430

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(HERE, "..", "assets", "events-data.js")
REGIONAL_OUT_PATH = os.path.join(HERE, "..", "assets", "events-regional.js")
GLOBAL_OUT_PATH = os.path.join(HERE, "..", "assets", "events-global.js")


def norm(s: str) -> str:
    """برای هم‌سنجیِ رشته‌ها: بی‌نیم‌فاصله، بی‌فاصله‌ی تکراری، «ك/ي» عربی یکسان."""
    s = s.replace("ك", "ک").replace("ي", "ی").replace("\u200c", "")
    return re.sub(r"\s+", " ", s).strip()


# --- موارد مذهبیِ اسلامی: در تقویم نمی‌آیند ---------------------------------
EXCLUDED_ISLAMIC = {norm(s) for s in [
    "هجرت محمد (ص) از مکه به مدینه و انتخاب این روز به عنوان مبدأ تاریخ مسلمانان در دو تقویم هجری شمسی و هجری قمری",
    "روز تبلیغ و اطلاع‌رسانی دینی",
    "تأسیس سازمان تبلیغات اسلامی",
    "روز عفاف و حجاب",
    "روز حقوق بشر اسلامی و کرامت انسانی",
    "روز بانکداری اسلامی",
    "سالروز تصویب قانون عملیات بانکی بدون ربا",
    "روز علوم انسانی اسلامی",
    "روز امور تربیتی و تربیت اسلامی",
    "روز ترویج فرهنگ قرض‌الحسنه",
    "تأسیس کانون‌های فرهنگی هنری مساجد کشور",
    "بزرگداشت شهدای منا",
    "بزرگداشت شیخ صدوق",
    "بزرگداشت شیخ کلینی",
    "بزرگداشت شیخ مفید",
    "بزرگداشت علامه امینی",
    "بزرگداشت علامه مجلسی",
    "درگذشت علامه حلی از علمای شیعه قرن هشتم قمری",
    "بزرگداشت آیت‌الله سید محمدحسین طباطبایی",
    "درگذشت میرزا احمد آشتیانی فقیه، فیلسوف شیعی ایرانی",
]}

# رخدادهای میلادیِ مذهبیِ اسلامی (برای لایه‌ی جهانی)
EXCLUDED_ISLAMIC_GLOBAL = {norm(s) for s in [
    "روز جهانی قدس",
    "روز بین‌المللی مبارزه با اسلام‌هراسی",
    # روزهای مربوط به فلسطین و غزه (بنا بر انتخابِ سردبیریِ این گاهشمار در لایه‌ی جهانی نمی‌آیند)
    "روز جهانی حماسه فلسطین",
    "روز جهانی همبستگی با مردم فلسطین",
]}

# جشن‌های ماهانه‌ای که برنامه (JASHN_DAYS در app.js) خودش نشان می‌دهد
DUPLICATE_OF_APP = {norm(s) for s in [
    "فروردین روز، جشن فروردینگان",
    "خرداد روز، جشن خردادگان",
    "تیر روز، جشن تیرگان",
    "اَمرداد روز، جشن اَمردادگان",
    "شهریور روز، جشن شهریورگان",
    "مهر روز، جشن مهرگان",
    "آبان روز، جشن آبانگان",
    "جشن آذرگان، آذر روز",
    "دی به آذر روز، دومین جشن دیگان",
    "دی به مهر روز، سومین جشن دیگان",
    "دی به دین روز، چهارمین جشن دیگان",
    "بهمن روز، جشن بهمنگان",
]}

# لایه‌ی اختیاریِ منطقه‌ای
REGIONAL_EVENTS = {norm(s) for s in [
    "روز شیراز",
    "روز زنجان",
    "روز همدان",
    "روز اصفهان",
    "روز کرمان",
    "روز چهارمحال و بختیاری",
    "روز بوشهر",
    "روز ملّی مازندران",
]}

# پاکیزه‌سازیِ نوشته‌ها
RENAME = {norm(k): v for k, v in {
    "روز ملّی مازندران": "روز مازندران",
    "سالروز زلزله رودبار و منجیل [1369خورشیدی]": "زمین\u200cلرزه\u200cی رودبار و منجیل [۱۳۶۹ خورشیدی]",
    "زمین لرزه طبس به قدرت 7/8 ریشتر": "زمین\u200cلرزه\u200cی طبس [۱۳۵۷ خورشیدی]",
    "زمین لرزه ی بم [1382 خورشیدی]": "زمین\u200cلرزه\u200cی بم [۱۳۸۲ خورشیدی]",
    "روز ملی گل وگیاه": "روز ملی گل و گیاه",
    "روز محیط\u200c\u200c\u200c\u200c\u200c\u200c\u200c\u200c\u200c\u200c\u200c\u200c\u200c بان": "روز محیط\u200cبان",
    "روز کوروش بزرگ: کوروش بزرگ بنیانگذار امپراتوری هخامنشیان در ایران، شهر بابِل، بزرگترین شهر دنیای باستان و مرکز تمدن بابل را فتح کرد.": "روز کوروش بزرگ",
    "سروش روز، جشن سروشگان": "جشن سروشگان (سروش\u200cروز)",
    "جشن خام خواری": "جشن خام\u200cخواری",
    "جشن خرم روز، نخستین جشن دیگان": "جشن خرم\u200cروز، نخستین جشن دی\u200cگان",
    "آذر جشن": "آذرجشن",
    "روز جهانی زن در ریاضیات (به افتخار روز تولد مریم میرزاخانی)": "روز جهانی زن در ریاضیات (زادروز مریم میرزاخانی)",
    "روز کُشتی": "روز کشتی",
    "زادروز حیدر رقابی متخلص به هاله از شاعران معاصر اهل ایران": "زادروز حیدر رقابی (هاله)، شاعر معاصر ایرانی",
    "جشن تیرگان، بزرگداشت کمان کشیدن جان فدای ایران، آرش کمانگیر بر فراز البرز": "بزرگداشت آرش کمانگیر بر فراز البرز",
    "روزملی کارآفرینی": "روز ملی کارآفرینی",
    "روزصنعت چاپ": "روز صنعت چاپ",
}.items()}


def clean(desc: str) -> str:
    return RENAME.get(norm(desc), re.sub(r"\s+", " ", desc).strip())


def month_length(jy: int, jm: int) -> int:
    if jm <= 6:
        return 31
    if jm <= 11:
        return 30
    return 30 if jdatetime.date(jy, 1, 1).isleap() else 29


def write_js(path: str, var: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(f"window.{var} = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")


def main():
    data = {}
    regional = {}
    for jy in range(START_YEAR, END_YEAR + 1):
        for jm in range(1, 13):
            for jd in range(1, month_length(jy, jm) + 1):
                info = get_events(day=jd, month=jm, year=jy, input_date_system=DateSystem.JALALI)
                key = f"{jy:04d}-{jm:02d}-{jd:02d}"
                kept, reg = [], []
                for e in info["events"]["jalali"]:
                    n = norm(e["description"])
                    if n in EXCLUDED_ISLAMIC or n in DUPLICATE_OF_APP:
                        continue
                    if n in REGIONAL_EVENTS:
                        reg.append(clean(e["description"]))
                        continue
                    kept.append(e)
                events = []
                for e in kept:
                    text = clean(e["description"])
                    if text not in events:
                        events.append(text)
                # رنگِ فرویش: از رخدادهای نگه‌داشته‌شده یا از تقویم قمری
                civil = any(e["is_holiday"] for e in kept)
                lunar = any(e["is_holiday"] for e in info["events"]["hijri"])
                is_holiday = civil or lunar
                if events or is_holiday:
                    data[key] = {"events": events, "is_holiday": is_holiday}
                    if lunar and not civil:
                        data[key]["h"] = True  # فرویشِ برخاسته تنها از تقویم قمری؛ در تنظیمات خاموش‌شدنی
                if reg:
                    regional[key] = reg
    write_js(OUT_PATH, "SARE_EVENTS", data)
    print(f"{OUT_PATH} -> {len(data)} days")
    write_js(REGIONAL_OUT_PATH, "SARE_EVENTS_REGIONAL", regional)
    print(f"{REGIONAL_OUT_PATH} -> {len(regional)} days")

    # لایه‌ی جهانی: بر پایه‌ی «ماه-روز» میلادی (سال کبیسه برای ۲۹ فوریه)
    glob = {}
    for gm in range(1, 13):
        for gd in range(1, [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][gm - 1] + 1):
            info = get_events(day=gd, month=gm, year=2024, input_date_system=DateSystem.GREGORIAN)
            texts = []
            for e in info["events"].get("gregorian", []):
                if norm(e["description"]) in EXCLUDED_ISLAMIC_GLOBAL:
                    continue
                t = clean(e["description"])
                if t not in texts:
                    texts.append(t)
            if texts:
                glob[f"{gm:02d}-{gd:02d}"] = texts
    write_js(GLOBAL_OUT_PATH, "SARE_EVENTS_GLOBAL", glob)
    print(f"{GLOBAL_OUT_PATH} -> {len(glob)} days, {sum(len(v) for v in glob.values())} events")


if __name__ == "__main__":
    main()
