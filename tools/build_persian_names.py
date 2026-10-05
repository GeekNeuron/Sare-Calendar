"""tools/persian-names.tsv را به assets/persian-names.js تبدیل می‌کند.

ستون‌های فایل TSV: نام، گروه (پسر/دختر/هر دو)، معنی، ریشه و توضیح.
این فهرست را دستی و با گزینشِ نام‌هایی با ریشه‌ی ایرانی (اوستایی، پارسی باستان،
پارسی میانه، شاهنامه‌ای یا پارسی نو) نوشته‌ایم؛ نام‌های عربی/ترکی در آن نیست.
"""
import json
import os

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "persian-names.tsv")
OUT = os.path.join(HERE, "..", "assets", "persian-names.js")


def main():
    rows = []
    seen = set()
    with open(SRC, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            name, group, meaning, root = line.split("\t")
            assert group in ("پسر", "دختر", "هر دو"), (name, group)
            assert name not in seen, f"تکراری: {name}"
            seen.add(name)
            rows.append({"n": name, "g": group, "m": meaning, "r": root})
    rows.sort(key=lambda r: r["n"])
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("window.SARE_PERSIAN_NAMES = ")
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"{OUT} -> {len(rows)} names")


if __name__ == "__main__":
    main()
