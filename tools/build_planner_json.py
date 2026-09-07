#!/usr/bin/env python3
"""MY HI-UP XLSX -> planner JSON shards. Python standard library only."""
from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, re, json, shutil

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "data" / "MY_HI_UP_DATA.xlsx"
OUT = ROOT / "data" / "planners"
MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

def norm_code(v):
    if v is None: return ""
    s = str(v).strip().upper()
    if s.endswith(".0") and s[:-2].isdigit(): s = s[:-2]
    return s.zfill(6) if s.isdigit() else s

def num(v, default=0):
    if v is None or v == "": return default
    try:
        x = float(v)
        return int(x) if x.is_integer() else x
    except Exception:
        return default

def col_idx(ref):
    letters = re.match(r"([A-Z]+)", ref).group(1)
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch) - 64
    return n - 1

def get(row, idx):
    return row[idx] if idx < len(row) else None

def load_rows(z, sheet_num, shared):
    root = ET.fromstring(z.read(f"xl/worksheets/sheet{sheet_num}.xml"))
    rows = {}
    for row in root.findall(f".//{{{MAIN}}}sheetData/{{{MAIN}}}row"):
        vals = {}
        for c in row.findall(f"{{{MAIN}}}c"):
            idx = col_idx(c.attrib["r"])
            typ = c.attrib.get("t")
            v = c.find(f"{{{MAIN}}}v")
            if typ == "inlineStr":
                node = c.find(f"{{{MAIN}}}is")
                val = "".join(t.text or "" for t in node.iter(f"{{{MAIN}}}t")) if node is not None else ""
            elif v is None:
                val = None
            else:
                txt = v.text
                if typ == "s": val = shared[int(txt)]
                elif typ == "b": val = (txt == "1")
                elif typ == "str": val = txt
                else:
                    try:
                        val = float(txt)
                        if val.is_integer(): val = int(val)
                    except Exception:
                        val = txt
            vals[idx] = val
        if vals:
            arr = [None] * (max(vals) + 1)
            for i, val in vals.items(): arr[i] = val
            rows[int(row.attrib["r"])] = arr
    return rows

def main():
    if not XLSX.exists():
        raise SystemExit(f"Missing: {XLSX}")
    with zipfile.ZipFile(XLSX) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            sr = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in sr.findall(f"{{{MAIN}}}si"):
                shared.append("".join(t.text or "" for t in si.iter(f"{{{MAIN}}}t")))
        p_rows = load_rows(z, 1, shared)
        h_rows = load_rows(z, 2, shared)
        t_rows = load_rows(z, 3, shared)

    data = {}

    for rn, r in p_rows.items():
        if rn < 5: continue
        c = norm_code(get(r, 3))
        if not c: continue
        target = num(get(r, 6))
        rec = {
            "region": get(r,1), "branch": get(r,2), "code": c, "name": get(r,4),
            "careerMonth": num(get(r,5), None),
            "months": {
                "7": {"target":target,"actual":num(get(r,7)),"shortfall":num(get(r,8),None),"award":num(get(r,9)),"flag":num(get(r,17),None)},
                "8": {"target":target,"actual":num(get(r,10)),"shortfall":num(get(r,11),None),"award":num(get(r,12)),"flag":num(get(r,18),None)},
                "9": {"target":target,"actual":num(get(r,13)),"shortfall":num(get(r,14),None),"award":num(get(r,15)),"flag":num(get(r,19),None)}
            }
        }
        data.setdefault(c, {})["personalIncrease"] = rec

    for rn, r in h_rows.items():
        if rn < 5: continue
        c = norm_code(get(r, 4))
        if not c: continue
        rec = {
            "region":get(r,1),"branch":get(r,2),"team":str(get(r,3)) if get(r,3) is not None else None,
            "code":c,"name":get(r,5),"careerMonth":num(get(r,6),None),
            "monthlyPerformance":{"7":num(get(r,8)),"8":num(get(r,9)),"9":num(get(r,10))},
            "averagePerformance":num(get(r,11)),"grade":get(r,12) or "-","awardAmount":num(get(r,13))
        }
        data.setdefault(c, {})["honors"] = rec

    for rn, r in t_rows.items():
        if rn < 5: continue
        c = norm_code(get(r, 3))
        if not c: continue
        note = str(get(r,13) or "").strip()
        rec = {
            "region":get(r,1),"branch":get(r,2),"code":c,"name":get(r,4),"careerMonth":num(get(r,5),None),
            "lifeInsurance":num(get(r,6)),"autoPerformance":num(get(r,7)),"conversionPerformance":num(get(r,8)),
            "incomeProgress":num(get(r,11)),"awardAmount":num(get(r,12)),"prevMonthNote":note,
            "status":"조기 달성" if note else "유지 달성 도전자"
        }
        data.setdefault(c, {})["tcStepUp"] = rec

    for c, rec in data.items():
        rec["code"] = c
        rec.setdefault("personalIncrease", None)
        rec.setdefault("honors", None)
        rec.setdefault("tcStepUp", None)

    tmp = OUT.with_name("planners_tmp")
    if tmp.exists(): shutil.rmtree(tmp)
    tmp.mkdir(parents=True)
    prefixes = sorted({c[:3] for c in data})
    for prefix in prefixes:
        shard = {c: data[c] for c in data if c.startswith(prefix)}
        (tmp / f"{prefix}.json").write_text(
            json.dumps(shard, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
    if OUT.exists(): shutil.rmtree(OUT)
    tmp.rename(OUT)
    print(f"Generated {len(prefixes)} shards for {len(data)} planner codes.")

if __name__ == "__main__":
    main()
