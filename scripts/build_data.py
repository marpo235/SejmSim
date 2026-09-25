#!/usr/bin/env python3
"""Build src/data/districts.json + src/data/map.json for SejmSim 2027.

Sources (all public / official):
  - PKW Sejm 2023: okregi_sejm_csv.zip, wyniki_gl_na_listy_po_okregach_sejm_csv.zip,
    protokoly_po_obwodach_sejm_csv.zip (per-precinct; used to map TERYT powiat -> sejm district)
  - 2025 presidential R1 per-precinct results (PKW export mirrored at hrpunio/PLWybory)
  - District SVG paths: scripts/SejmMap_source.tsx (MIT, (c) 2023 Dyzio — github.com/Dyzio18/2023wybory.pl)

PKW TERYT convention: gmina code is WWPPG (type digit stripped); powiat key = gmina[:-1] + '0'.
"""
import csv, io, json, re, sys, zipfile
from pathlib import Path
from urllib.request import urlopen

RAW = Path(__file__).parent / "raw"
RAW.mkdir(exist_ok=True)
ROOT = Path(__file__).parent.parent

URLS = {
    "okregi_sejm_utf8.csv": "https://sejmsenat2023.pkw.gov.pl/sejmsenat2023/data/csv/okregi_sejm_csv.zip",
    "wyniki_gl_na_listy_po_okregach_sejm_utf8.csv": "https://sejmsenat2023.pkw.gov.pl/sejmsenat2023/data/csv/wyniki_gl_na_listy_po_okregach_sejm_csv.zip",
    "protokoly_po_obwodach_sejm_utf8.csv": "https://sejmsenat2023.pkw.gov.pl/sejmsenat2023/data/csv/protokoly_po_obwodach_sejm_csv.zip",
    "prezydent2025_po_obwodach.csv": "https://raw.githubusercontent.com/hrpunio/PLWybory/HEAD/2025/protokoly_po_obwodach_utf8.csv",
}


def fetch(name: str) -> Path:
    out = RAW / name
    if out.exists():
        return out
    url = URLS[name]
    print(f"downloading {url}")
    data = urlopen(url, timeout=120).read()
    if url.endswith(".zip"):
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            inner = z.namelist()[0]
            data = z.read(inner)
    out.write_bytes(data)
    return out


def read_csv(path: Path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f, delimiter=";"))


def main():
    # --- district metadata (2023) ---
    okregi = read_csv(fetch("okregi_sejm_utf8.csv"))
    districts = {}
    for r in okregi:
        d = int(r["Numer okręgu"])
        districts[d] = {
            "id": d,
            "name": r["Siedziba OKW"],
            "seats": int(r["Liczba mandatów"]),
            "voters": int(r["Wyborcy"]),
        }
    assert len(districts) == 41
    assert sum(d["seats"] for d in districts.values()) == 460

    # --- 2023 sejm results per district ---
    COMMITTEES_23 = {
        "KOMITET WYBORCZY BEZPARTYJNI SAMORZĄDOWCY": "BS",
        "KOALICYJNY KOMITET WYBORCZY TRZECIA DROGA POLSKA 2050 SZYMONA HOŁOWNI - POLSKIE STRONNICTWO LUDOWE": "TD",
        "KOMITET WYBORCZY NOWA LEWICA": "NL",
        "KOMITET WYBORCZY PRAWO I SPRAWIEDLIWOŚĆ": "PIS",
        "KOMITET WYBORCZY KONFEDERACJA WOLNOŚĆ I NIEPODLEGŁOŚĆ": "KONF",
        "KOALICYJNY KOMITET WYBORCZY KOALICJA OBYWATELSKA PO .N IPL ZIELONI": "KO",
        "KOMITET WYBORCZY POLSKA JEST JEDNA": "PJJ",
    }
    res23 = read_csv(fetch("wyniki_gl_na_listy_po_okregach_sejm_utf8.csv"))
    committee_cols = [c for c in res23[0] if c.startswith(("KOMITET", "KOALICYJNY"))]
    for r in res23:
        d = int(r["Nr okręgu"])
        votes = {}
        for col in committee_cols:
            key = COMMITTEES_23.get(col, "OTHER")
            votes[key] = votes.get(key, 0) + (int(r[col]) if r[col] else 0)
        districts[d]["sejm2023"] = {
            "valid": int(r["Liczba głosów ważnych oddanych łącznie na wszystkie listy kandydatów"]),
            "eligible": int(r["Liczba wyborców uprawnionych do głosowania"]),
            "votes": votes,
        }

    # --- gmina -> district bridge from 2023 precinct protocols ---
    proto23 = read_csv(fetch("protokoly_po_obwodach_sejm_utf8.csv"))
    gmina2okr = {}
    conflicts = []
    for r in proto23:
        g = r["TERYT Gminy"].strip()
        if not g:
            continue
        okr = int(r["Nr okręgu"])
        if g in gmina2okr and gmina2okr[g] != okr:
            conflicts.append((g, r["Gmina"], gmina2okr[g], okr))
        gmina2okr[g] = okr
    if conflicts:
        print("CONFLICTS:", conflicts[:20])
    # gminas created after the 2023 election (split-offs)
    gmina2okr["120713"] = 14  # gm. Szczawa (limanowski, małopolskie) -> Nowy Sącz
    gmina2okr["200216"] = 24  # gm. Grabówka (białostocki, podlaskie) -> Białystok
    print(f"gmina->district bridge: {len(gmina2okr)} gminas")

    # --- 2025 presidential R1 results aggregated to sejm districts ---
    CANDS_25 = [
        "BARTOSZEWICZ", "BIEJAT", "BRAUN", "HOŁOWNIA", "JAKUBIAK", "MACIAK",
        "MENTZEN", "NAWROCKI", "SENYSZYN", "STANOWSKI", "TRZASKOWSKI", "WOCH", "ZANDBERG",
    ]
    prez = read_csv(fetch("prezydent2025_po_obwodach.csv"))
    norm = lambda s: (s or "").replace("\xa0", " ").strip()
    valid_col = next(c for c in prez[0] if norm(c).startswith("Liczba głosów ważnych oddanych"))
    elig_col = next(c for c in prez[0] if norm(c).startswith("Liczba wyborców uprawnionych"))
    col2key = {}
    for c in prez[0]:
        for n in CANDS_25:
            if norm(c).startswith(n + " "):
                col2key[c] = n
    assert len(col2key) == 13, col2key

    unmapped = 0
    unmapped_pow = {}
    for r in prez:
        pkey = r["Teryt Gminy"].strip()
        okr = gmina2okr.get(pkey)
        if okr is None:
            unmapped += 1
            unmapped_pow[(r["Gmina"], r["Powiat"], r["Województwo"])] = unmapped_pow.get((r["Gmina"], r["Powiat"], r["Województwo"]), 0) + 1
            continue
        d = districts[okr]
        slot = d.setdefault("prez2025", {"valid": 0, "eligible": 0, "votes": {n: 0 for n in CANDS_25}})
        slot["valid"] += int(r[valid_col] or 0)
        slot["eligible"] += int(r[elig_col] or 0)
        for c, k in col2key.items():
            slot["votes"][k] += int(r[c] or 0)
    print(f"2025 precincts unmapped (abroad/ships/etc.): {unmapped}")
    print("unmapped powiats:", list(unmapped_pow.items())[:10])

    # --- sanity: national 2025 totals ---
    nat = {n: sum(d["prez2025"]["votes"][n] for d in districts.values()) for n in CANDS_25}
    tot = sum(nat.values())
    print("national 2025 mapped totals:", {k: round(v / tot * 100, 2) for k, v in sorted(nat.items(), key=lambda x: -x[1])})
    # expected: TRZ ~31.4, NAW ~29.5, MEN ~14.8, BRAUN ~6.3 (minus abroad votes)

    out = {
        "meta": {
            "generated": "build_data.py",
            "sources": list(URLS.values()) + ["scripts/SejmMap_source.tsx"],
        },
        "districts": [districts[i] for i in sorted(districts)],
    }
    (ROOT / "src/data/districts.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print("wrote src/data/districts.json")

    # --- map paths ---
    src = (ROOT / "scripts/SejmMap_source.tsx").read_text(encoding="utf-8")
    map_paths = {}
    blocks = re.split(r"regionId=\{(\d+)\}", src)
    # blocks: [pre, "1", body1, "2", body2, ...]
    for i in range(1, len(blocks) - 1, 2):
        rid = int(blocks[i])
        body = blocks[i + 1]
        # region body ends at next </Region>
        body = body.split("</Region>")[0]
        paths = re.findall(r'<path\b[^>]*?\bd="([^"]+)"', body, re.S)
        if not paths:
            print(f"WARNING: no path for district {rid}")
        map_paths[rid] = paths
    assert len(map_paths) == 41, len(map_paths)
    (ROOT / "src/data/map.json").write_text(json.dumps(map_paths, ensure_ascii=False), encoding="utf-8")
    print("wrote src/data/map.json")


if __name__ == "__main__":
    sys.exit(main())
