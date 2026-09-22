import json
import os
import sqlite3
import urllib.request

DB_URL = "https://github.com/keyaruga33/pasban_db/releases/download/1787762548/pasban.db"
DB_PATH = os.path.join(os.path.dirname(__file__), "pasban.db")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "pasban-words.json")


def main():
    if not os.path.exists(DB_PATH):
        urllib.request.urlretrieve(DB_URL, DB_PATH)
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT word, parsi FROM words")
    data = {word: parsi for word, parsi in cur.fetchall()}
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{OUT_PATH} -> {len(data)} words")


if __name__ == "__main__":
    main()
