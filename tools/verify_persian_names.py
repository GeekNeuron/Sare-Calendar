"""صحت‌سنجیِ فهرست نام‌های پارسی با منابع بازِ موجود.

منابع (همگی بازبین‌شدنی و رایگان، از گیت‌هاب):
  1. mohammadhejazirad/persian-names        ← ۱۰ هزار نام + جنسیت
  2. nabidam/persian-names                  ← ۸٫۸ هزار نام + جنسیت و فهرست «راستان» با نمره‌ی کاربرد
  3. nikahd99/iranian-Names-Database-By-Gender ← ۲۰ هزار نام + جنسیت
  4. PJSoftCo/BabyNames                     ← ۴٫۵ هزار نام فارسی با معنی (برای هم‌سنجیِ معنی)

برای هر نامِ persian-names.tsv این‌ها سنجیده می‌شود:
  - در چند منبع (از ۵ فهرست) آمده است؛
  - جنسیتِ ثبت‌شده با منابع ناسازگار نیست؛
  - معنی با معنیِ فهرستِ BabyNames هم‌پوشانیِ واژگانی دارد یا نه («review» یعنی باید دستی دید).
    مواردِ «review» را یکی‌یکی دستی بازبینی کرده‌ایم: بیشترشان تفاوتِ نگارشی یا اختصارند و
    در چند مورد (اورنگ، انوش، افشین، هوشنگ، پرویز، …) فهرستِ BabyNames ریشه‌شناسی عامیانه
    دارد و معنیِ پژوهشیِ ما نگه داشته شده است.

خروجی: persian-names-verification.json. اجرا:  python3 tools/verify_persian_names.py
نکته: این سنجش «وجود و هم‌خوانیِ» نام را می‌سنجد، نه درستیِ ریشه‌شناسی؛ ریشه‌ها را
باید با فرهنگ‌های ریشه‌شناسی (دهخدا، فرهنگ ایرانیان و …) هم‌سنجی کرد.
"""
import csv
import gzip
import json
import os
import re
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TSV = os.path.join(HERE, "persian-names.tsv")
OUT = os.path.join(HERE, "persian-names-verification.json")
REPOS = {
    "mhr": "mohammadhejazirad/persian-names",
    "nabidam": "nabidam/persian-names",
    "nikahd": "nikahd99/iranian-Names-Database-By-Gender",
    "babynames": "PJSoftCo/BabyNames",
}
STOP = set("نام از و در که است را به با یک کسی آن این یا برای مانند بر نیز هم یکی از‌".split())


def norm(s):
    s = s.replace("ك", "ک").replace("ي", "ی").replace("ى", "ی").replace("ۀ", "ه")
    s = s.replace("\u200c", "").replace(" ", "")
    s = re.sub("[\u064B-\u0652\u0670\u0640]", "", s)
    return s.replace("أ", "ا").replace("إ", "ا").strip()


def tokens(text):
    text = re.sub(r"\(.*?\)", " ", text.replace("\u200c", " "))
    words = re.findall(r"[\u0600-\u06FF]+", text)
    out = set()
    for w in words:
        w = norm(w)
        if len(w) >= 3 and w not in STOP:
            out.add(w)
            out.add(re.sub(r"(ها|ان|ی|ه)$", "", w))
    return out


def overlap(a, b):
    """هم‌پوشانیِ واژگانی (با پذیرفتنِ پیشوندِ مشترکِ ۴ حرفی)؛ سنجشی خام و فقط برای نشان‌کردنِ موارد بازبینی است."""
    ta, tb = tokens(a), tokens(b)
    return any(x == y or (len(x) >= 4 and len(y) >= 4 and x[:4] == y[:4]) for x in ta for y in tb)


def clone(tmp):
    for key, repo in REPOS.items():
        dest = os.path.join(tmp, key)
        subprocess.run(["git", "clone", "-q", "--depth", "1", f"https://github.com/{repo}.git", dest], check=True)


def load_sources(tmp):
    S = {}
    BN = {}
    gm = {"MALE": "M", "FEMALE": "F", "M": "M", "F": "F", "m": "M", "f": "F"}

    def add(src, name, g):
        n = norm(name or "")
        if n:
            S.setdefault(src, {}).setdefault(n, set()).add(gm.get(g, "?"))

    mh = json.loads(gzip.open(os.path.join(tmp, "mhr/src/assets/persian_names.json.gz")).read().decode("utf-8"))
    for v in mh:
        add("mhr", v["n"], v.get("g"))
    nj = json.load(open(os.path.join(tmp, "nabidam/names.json"), encoding="utf-8"))
    for k, v in nj.items():
        add("nabidam", k, v.get("gender"))
    for r in csv.DictReader(open(os.path.join(tmp, "nabidam/names_2.csv"), encoding="utf-8")):
        for g in (["M"] if r["Pesar"] else []) + (["F"] if r["Dokhtar"] else []) or ["?"]:
            add("nabidam", r["Naam"], g)
    for r in csv.DictReader(open(os.path.join(tmp, "nikahd/iranianNamesDataset.csv"), encoding="utf-8")):
        add("nikahd", r["Names"], r["Gender"])
    for line in open(os.path.join(tmp, "babynames/README.md"), encoding="utf-8"):
        if " ~ " not in line:
            continue
        p = [x.strip() for x in line.split("~")]
        if len(p) < 4 or p[0] != "فارسی":
            continue
        name = re.sub(r"\(.*?\)", "", p[1]).strip()
        g = {"boy": "M", "girl": "F"}.get(p[3], "?")
        BN[norm(name)] = p[2]
        add("babynames", name, g)
    return S, BN


def main():
    tmp = sys.argv[1] if len(sys.argv) > 1 else tempfile.mkdtemp(prefix="names-src-")
    if not os.path.exists(os.path.join(tmp, "mhr")):
        clone(tmp)
    S, BN = load_sources(tmp)
    rows = []
    for line in open(TSV, encoding="utf-8"):
        if line.strip() and not line.startswith("#"):
            rows.append(line.rstrip("\n").split("\t"))

    report = {}
    low, gender_conflict, meaning_review = [], [], []
    for name, group, meaning, _root in rows:
        k = norm(name)
        found = [s for s in ("mhr", "nabidam", "nikahd", "babynames") if k in S.get(s, {})]
        genders = set()
        for s in found:
            genders |= S[s][k] - {"?"}
        want = {"پسر": {"M"}, "دختر": {"F"}, "هر دو": {"M", "F"}}[group]
        g_ok = (not genders) or bool(genders & want)
        ref = BN.get(k)
        if ref is None:
            m_state = "none"
        else:
            m_state = "agree" if overlap(meaning, ref) else "review"
        report[name] = {"sources": len(found), "gender_ok": g_ok, "meaning": m_state}
        if len(found) < 3:
            low.append(name)
        if not g_ok:
            gender_conflict.append(name)
        if m_state == "review":
            meaning_review.append((name, meaning, ref))

    json.dump(report, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(rows)} نام سنجیده شد → {OUT}")
    print("کم‌منبع (کمتر از ۳ از ۴ فهرست):", low)
    print("ناسازگاری جنسیت:", gender_conflict)
    print(f"معنی برای بازبینیِ دستی (هم‌پوشانیِ واژگانی با BabyNames نیست) ({len(meaning_review)}):")
    for n, m, r in meaning_review:
        print(f"  {n}: ما «{m}» ← منبع «{r[:70]}»")


if __name__ == "__main__":
    main()
