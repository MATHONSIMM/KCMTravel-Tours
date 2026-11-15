#!/usr/bin/env python3
"""Export the running KCM site to static files for GitHub Pages.

Usage: python3 scripts/export_static.py <server-url> <wwwroot-dir> <out-dir> <base-path>
Example: python3 scripts/export_static.py http://127.0.0.1:5000 publish/wwwroot _site /KCMTravel-Tours
"""
import re, shutil, sys, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

server, wwwroot, out, base = sys.argv[1].rstrip("/"), Path(sys.argv[2]), Path(sys.argv[3]), sys.argv[4].rstrip("/")

def fetch(path):
    with urllib.request.urlopen(server + path, timeout=30) as r:
        return r.read().decode("utf-8")

def rebase(text, kind):
    if not base:
        return text
    if kind in ("html", "css"):
        text = re.sub(r'url\((["\']?)/(?!/)', rf'url(\1{base}/', text)
    if kind == "html":
        text = re.sub(r'(\s(?:href|src|action|srcset|imagesrcset)=")/(?!/)', rf'\1{base}/', text)
        text = re.sub(r'(<html\b[^>]*?)\sdata-base=""', rf'\1 data-base="{base}" data-static="1"', text, count=1)
    if kind in ("html", "json"):
        text = text.replace('"/images/', f'"{base}/images/')
    if kind == "manifest":
        text = re.sub(r'"/', f'"{base}/', text)
    return text

if out.exists():
    shutil.rmtree(out)
shutil.copytree(wwwroot, out)

for p in out.rglob("*"):
    if p.suffix == ".css":
        p.write_text(rebase(p.read_text(), "css"))
    elif p.name == "site.webmanifest":
        p.write_text(rebase(p.read_text(), "manifest"))

sitemap = fetch("/sitemap.xml")
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
locs = [l.text for l in ET.fromstring(sitemap).findall("s:url/s:loc", ns)]
paths = sorted({re.sub(r"^https?://[^/]+", "", l)[len(base):] or "/" for l in locs})
paths += [p for p in ("/account", "/admin", "/rate") if p not in paths]  # private pages (not in the sitemap)

for path in paths:
    html = rebase(fetch(path), "html")
    target = out / path.strip("/") / "index.html" if path != "/" else out / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html)
    print("page", path)

try:
    fetch("/error/404")
except urllib.error.HTTPError as e:
    (out / "404.html").write_text(rebase(e.read().decode("utf-8"), "html"))
(out / "api").mkdir(exist_ok=True)
(out / "api" / "catalog.json").write_text(rebase(fetch("/api/catalog.json"), "json"))
(out / "sitemap.xml").write_text(sitemap)
(out / "robots.txt").write_text(fetch("/robots.txt"))
(out / ".nojekyll").write_text("")
print(f"exported {len(paths)} pages to {out}")
