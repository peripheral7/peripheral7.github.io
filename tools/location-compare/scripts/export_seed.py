"""원본 "입지 비교 리포트" 앱의 DB(data/app.db)에서 화면에 쓰는 자료만 뽑아 src/seed.json 으로 저장한다.

정적 블로그에는 서버(DB)가 없으므로, 이 파일이 "처음 열었을 때 보이는 예시 데이터"가 된다.
후보 주택·거점·교통 선호도만 담는다(대중교통 POI·버스 노선 표는 화면에서 쓰지 않아 뺀다).

사용:
    python scripts/export_seed.py "<원본 폴더>"      # 예: "C:/.../입지 비교 리포트"
    python scripts/export_seed.py "<원본 폴더>" --dry-run   # 내용만 보고 파일은 쓰지 않는다
"""
import hashlib
import json
import os
import sqlite3
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "src", "seed.json")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    db_path = os.path.join(args[0], "data", "app.db")
    if not os.path.exists(db_path):
        sys.exit(f"DB 를 찾지 못했습니다: {db_path}")

    con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)  # 읽기 전용으로만 연다
    con.row_factory = sqlite3.Row

    homes = []
    for row in con.execute("SELECT * FROM homes ORDER BY id"):
        d = dict(row)
        d["selected"] = bool(d["selected"])
        homes.append(d)

    hubs = [dict(r) for r in con.execute("SELECT * FROM hubs ORDER BY id")]

    pref_row = dict(con.execute("SELECT * FROM preferences WHERE id=1").fetchone())
    preferences = {
        "primary_modes": json.loads(pref_row["primary_modes"] or "[]"),
        "secondary_modes": json.loads(pref_row["secondary_modes"] or "[]"),
        "transit_weight": pref_row["transit_weight"],
        "car_weight": pref_row["car_weight"],
        "active_weight": pref_row["active_weight"],
        "transit_priority_hub_ids": json.loads(pref_row["transit_priority_hub_ids"] or "[]"),
        "hub_monthly_roundtrips": json.loads(pref_row["hub_monthly_roundtrips"] or "{}"),
        "hub_weight_multipliers": json.loads(pref_row["hub_weight_multipliers"] or "{}"),
    }

    # AUTOINCREMENT 이 마지막으로 준 번호 — 새 후보·거점이 같은 번호를 다시 받지 않게 이어서 센다.
    seq = {r["name"]: r["seq"] for r in con.execute("SELECT name, seq FROM sqlite_sequence")}

    body = {
        "seq": {"homes": seq.get("homes", max([h["id"] for h in homes] or [0])), "hubs": seq.get("hubs", max([h["id"] for h in hubs] or [0]))},
        "homes": homes,
        "hubs": hubs,
        "preferences": preferences,
    }
    # 내용이 바뀌면 version 이 바뀐다 → 방문자 브라우저에 저장된 옛 예시 데이터가 새 예시로 교체된다.
    version = hashlib.sha1(json.dumps(body, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:10]
    out = {"version": version, **body}

    print(f"후보 주택 {len(homes)}건 · 거점 {len(hubs)}건 · version {version}")
    for h in homes:
        print(f"  후보 {h['id']}: {h['name']} · {h['address']}")
    for h in hubs:
        print(f"  거점 {h['id']} ({h['category']}): {h['name']} · {h['address']}")
    if dry:
        print("(--dry-run: 파일을 쓰지 않았습니다)")
        return
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("저장:", OUT)


main()
