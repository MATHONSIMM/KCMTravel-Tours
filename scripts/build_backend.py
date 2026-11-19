#!/usr/bin/env python3
"""Combine the Apps Script backend into ONE file to paste into the Apps Script editor.

    python3 scripts/build_backend.py   ->  backend/apps-script/dist/KCM-Backend.gs

Order matters (later files use earlier ones): Vendor, Security, Pricing, Code, Ops, Demo.
Vendor.gs is the bundled @noble/hashes + @noble/ciphers (MIT). To refresh it:
    npm i @noble/hashes@1 @noble/ciphers@1 esbuild && npx esbuild entry.mjs --bundle --format=iife --minify
with entry.mjs = import {argon2id} from '@noble/hashes/argon2'; ... globalThis.KCMCrypto = {argon2id, hmac, sha1, sha256, gcm};
"""
import pathlib, datetime
root = pathlib.Path(__file__).resolve().parent.parent / "backend" / "apps-script"
order = ["Vendor.gs", "Security.gs", "Pricing.gs", "Code.gs", "Ops.gs", "Demo.gs"]
out = root / "dist" / "KCM-Backend.gs"
out.parent.mkdir(exist_ok=True)
parts = [f"/* KCM Travel & Tours backend, combined {datetime.date.today().isoformat()} from {', '.join(order)}.\n   Paste this whole file into Code.gs in the Apps Script editor (replace everything), save, run setup, then\n   Deploy > Manage deployments > Edit > New version. Source: backend/apps-script/ in the repository. */\n"]
for f in order:
    parts.append(f"\n/* ======================= {f} ======================= */\n")
    parts.append((root / f).read_text())
out.write_text("".join(parts))
print("wrote", out, f"{out.stat().st_size/1024:.0f} KB")
