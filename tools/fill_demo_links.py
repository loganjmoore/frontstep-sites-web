#!/usr/bin/env python3
"""Fill the demo_link column of a prospect CSV.

Usage:  python3 fill_demo_links.py [pipeline.csv] [--out FILE] [--force] [--base URL]

Input is required. Without --out it is rewritten in place (a .bak copy is kept).
Only empty demo_link cells are filled unless --force. Uses business, trade, city, phone only.
Never adds a `since` value: nothing in the CSV says how long a business has been open.
"""
import argparse, csv, os, shutil, sys
from urllib.parse import urlencode

PAGES = {"plumbing": "plumber", "roofing": "roofer", "landscaping": "landscaper",
         "cleaning": "cleaner", "painting": "painter", "hvac": "hvac"}

ap = argparse.ArgumentParser()
ap.add_argument("csv")
ap.add_argument("--out")
ap.add_argument("--force", action="store_true")
ap.add_argument("--base", default="https://frontstepsites.com")
a = ap.parse_args()

with open(a.csv, newline="", encoding="utf-8") as f:
    rd = csv.DictReader(f)
    fields, rows = rd.fieldnames, list(rd)
required = {"business", "trade", "city", "phone", "demo_link"}
if not required.issubset(fields or []):
    sys.exit("missing required columns: " + ", ".join(sorted(required - set(fields or []))))

filled = skipped = 0
for r in rows:
    if r["demo_link"].strip() and not a.force:
        skipped += 1
        continue
    page = PAGES.get(r["trade"].strip().lower())
    name = r["business"].strip()
    if not page or not name:
        print(f"skip (unknown trade or no name): {name or '?'} / {r['trade']}", file=sys.stderr)
        continue
    q = {"n": name}
    if r["city"].strip():
        q["c"] = r["city"].strip()
    digits = "".join(ch for ch in r["phone"] if ch.isdigit())
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        q["p"] = digits
    r["demo_link"] = f"{a.base.rstrip('/')}/{page}/?{urlencode(q)}"
    filled += 1

out = a.out or a.csv
if out == a.csv:
    shutil.copyfile(a.csv, a.csv + ".bak")
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)
print(f"filled {filled}, left {skipped} existing, wrote {out}")
