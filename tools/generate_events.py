# -*- coding: utf-8 -*-
"""
تولید داده‌ی ایستای رخدادها برای «تقویم سره» (نسخه‌ی وب ایستا / GitHub Pages).

این اسکریپت یک‌بار روی ماشین توسعه‌دهنده اجرا می‌شود (نه در مرورگر کاربر)؛
خروجی‌اش فایل data/events.json است که سایت ایستا مستقیماً آن را می‌خواند.
اگر خواستید بازه‌ی سال‌ها را عوض کنید یا داده را به‌روز کنید، همین را دوباره اجرا کنید.

توجه: رخدادهای قمری/اسلامی (مثل شهادت‌ها، اعیاد مذهبی) به‌عمد از فهرست متنیِ
نمایش‌داده‌شده کنار گذاشته شده‌اند؛ اما اگر همان روز طبق منبع rokh «تعطیل رسمی»
باشد، پرچم is_holiday همچنان درست ثبت می‌شود — یعنی روز به‌عنوان تعطیل رسمی
(با رنگ جداگانه) در تقویم مشخص می‌ماند، فقط بدون نمایش متن رویداد مذهبی.

اجرا:
    pip install rokh jdatetime --break-system-packages
    python3 tools/generate_events.py
"""
import json
import os
import jdatetime
from rokh import get_events, DateSystem

START_YEAR = 1400
END_YEAR = 1430  # سی سال، برای پوشش بلندمدت

OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "events-data.js")


def month_length(jy: int, jm: int) -> int:
    if jm <= 6:
        return 31
    if jm <= 11:
        return 30
    return 30 if jdatetime.date(jy, 1, 1).isleap() else 29


def main():
    data = {}
    for jy in range(START_YEAR, END_YEAR + 1):
        for jm in range(1, 13):
            for jd in range(1, month_length(jy, jm) + 1):
                info = get_events(day=jd, month=jm, year=jy, input_date_system=DateSystem.JALALI)
                # فقط رخدادهای جلالی (غیرمذهبی/غیرقمری) در فهرست متنی می‌مانند
                events = [e["description"] for e in info["events"]["jalali"]]
                is_holiday = bool(info.get("is_holiday"))  # این هنوز شامل تعطیلی‌های قمری هم می‌شود
                if events or is_holiday:
                    key = f"{jy:04d}-{jm:02d}-{jd:02d}"
                    data[key] = {"events": events, "is_holiday": is_holiday}
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("// این فایل به‌طور خودکار با tools/generate_events.py ساخته می‌شود — دستی ویرایشش نکنید.\n")
        f.write("window.SARE_EVENTS = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"نوشته شد: {OUT_PATH} — {len(data)} روز دارای رخداد یا تعطیلی، بازه‌ی {START_YEAR} تا {END_YEAR}")


if __name__ == "__main__":
    main()
