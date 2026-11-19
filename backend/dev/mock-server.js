#!/usr/bin/env node
/**
 * Local test server for the Apps Script backend.
 * Runs the Apps Script backend (Vendor.gs, Security.gs, Pricing.gs, Code.gs, Ops.gs) in Node with in-memory stand-ins for Google's services
 * (SpreadsheetApp, DriveApp, MailApp, ...), so the website can be tested without deploying.
 *
 *   node backend/dev/mock-server.js            # http://127.0.0.1:8787
 *   OWNER=me@example.com PORT=8787 node backend/dev/mock-server.js
 *
 * Emails are printed to the console and listed at GET /__mail (handy for sign-in codes).
 * Google sign-in: send credential "test-google:<email>" to simulate a verified Google account.
 * Nothing is persisted: restart = empty database.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8787);
const OWNER = (process.env.OWNER || "owner@example.com").toLowerCase();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-client.apps.googleusercontent.com";

/* ---------- Spreadsheet ---------- */
class Range {
    constructor(sheet, r, c, nr = 1, nc = 1) { Object.assign(this, { sheet, r, c, nr, nc }); }
    setValues(vals) { vals.forEach((row, i) => row.forEach((v, j) => this.sheet.set(this.r + i, this.c + j, v))); return this; }
    setValue(v) { this.sheet.set(this.r, this.c, v); return this; }
    getValues() { return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => this.sheet.get(this.r + i, this.c + j))); }
    setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; }
}
class Sheet {
    constructor(name) { this.name = name; this.rows = []; this.hidden = false; }
    set(r, c, v) { if (typeof v === "string" && v[0] === "'") v = v.slice(1); /* like Sheets: a leading apostrophe only marks the cell as text */ while (this.rows.length < r) this.rows.push([]); const row = this.rows[r - 1]; while (row.length < c) row.push(""); row[c - 1] = v; }
    get(r, c) { return (this.rows[r - 1] || [])[c - 1] ?? ""; }
    width() { return Math.max(1, ...this.rows.map(r => r.length)); }
    getDataRange() { const w = this.width(); const rows = this.rows.length ? this.rows : [[]]; return { getValues: () => rows.map(r => Array.from({ length: w }, (_, i) => r[i] ?? "")) }; }
    appendRow(row) { this.rows.push(row.map(v => typeof v === "string" && v[0] === "'" ? v.slice(1) : v)); return this; }
    getLastRow() { return this.rows.length; }
    deleteRow(i) { this.rows.splice(i - 1, 1); }
    deleteRows(i, n) { this.rows.splice(i - 1, n); }
    getRange(r, c, nr, nc) { return new Range(this, r, c, nr, nc); }
    setFrozenRows() { } hideSheet() { this.hidden = true; }
}
const sheets = new Map();
const spreadsheet = {
    getSheetByName: n => sheets.get(n) || null,
    insertSheet: n => { const s = new Sheet(n); sheets.set(n, s); return s; },
    getUrl: () => "https://docs.google.com/spreadsheets/d/LOCAL-MOCK/edit",
    getName: () => "KCM Pilot Database (local mock)",
};

/* ---------- Drive ---------- */
const files = new Map();
let nextId = 1;
const newId = p => `${p}${(nextId++).toString(36)}${crypto.randomBytes(3).toString("hex")}`;
function makeFolder(name) {
    const id = newId("folder_");
    const folder = {
        getId: () => id, getName: () => name,
        createFolder: n => makeFolder(n),
        createFile: blob => { const fid = newId("file_"); files.set(fid, blob); return { getId: () => fid }; },
    };
    files.set(id, folder);
    return folder;
}

/* ---------- Other services ---------- */
const props = new Map();
const cache = new Map();
const mail = [];
const whatsapp = []; // captured CallMeBot alerts: GET /__whatsapp
const toSigned = buf => Array.from(buf, b => (b > 127 ? b - 256 : b));

const context = {
    console,
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, getUi: () => { throw new Error("No UI in mock"); } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props.get(k) ?? null, setProperty: (k, v) => props.set(k, String(v)), deleteProperty: k => props.delete(k) }) },
    CacheService: { getScriptCache: () => ({ get: k => cache.get(k) ?? null, put: (k, v) => cache.set(k, v), remove: k => cache.delete(k) }) },
    LockService: { getScriptLock: () => ({ waitLock() { }, releaseLock() { } }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => OWNER }) },
    MailApp: {
        sendEmail: m => { mail.push({ ...m, time: new Date().toISOString() }); const code = /letter-spacing:4px">(\d{6})</.exec(m.htmlBody || ""); console.log(`[mail] to ${m.to}: ${m.subject}${code ? "  (code " + code[1] + ")" : ""}`); },
        getRemainingDailyQuota: () => 100,
    },
    DriveApp: {
        createFolder: n => makeFolder(n),
        getFolderById: id => { const f = files.get(id); if (!f || !f.createFile) throw new Error("No folder " + id); return f; },
        getFileById: id => { const b = files.get(id); if (!b || b.createFile) throw new Error("No file " + id); return { getBlob: () => b }; },
    },
    Utilities: {
        getUuid: () => crypto.randomUUID(),
        DigestAlgorithm: { SHA_256: "sha256" },
        computeDigest: (alg, s) => toSigned(crypto.createHash(alg).update(String(s), "utf8").digest()),
        base64Decode: s => toSigned(Buffer.from(s, "base64")),
        base64Encode: bytes => Buffer.from(bytes.map(b => b & 255)).toString("base64"),
        newBlob: (bytes, type, name) => ({ getBytes: () => bytes, getContentType: () => type, getName: () => name }),
        formatDate: (d, tz, fmt) => {
            const p2 = n => String(n).padStart(2, "0"), M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const map = { yyyy: String(d.getFullYear()), yy: String(d.getFullYear()).slice(2), MMM: M[d.getMonth()], MM: p2(d.getMonth() + 1), dd: p2(d.getDate()), d: String(d.getDate()), HH: p2(d.getHours()), mm: p2(d.getMinutes()) };
            return fmt.replace(/yyyy|yy|MMM|MM|dd|d|HH|mm/g, t => map[t]);
        },
    },
    UrlFetchApp: {
        fetch: url => {
            const tok = decodeURIComponent((/id_token=([^&]+)/.exec(url) || [])[1] || "");
            const m = /^test-google:(.+)$/.exec(tok);
            const ok = !!m;
            const info = ok ? { iss: "https://accounts.google.com", aud: props.get("GOOGLE_CLIENT_ID"), email: m[1], email_verified: "true", name: m[1].split("@")[0], exp: String(Math.floor(Date.now() / 1000) + 3600) } : { error: "invalid_token" };
            return { getResponseCode: () => (ok ? 200 : 400), getContentText: () => JSON.stringify(info) };
        },
        fetchAll: reqs => reqs.map(r => {
            const q = new URL(r.url).searchParams;
            whatsapp.push({ phone: q.get("phone"), text: q.get("text"), time: new Date().toISOString() });
            console.log(`[whatsapp] to ${q.get("phone")}: ${q.get("text").split("\n")[0]}`);
            return { getResponseCode: () => 200, getContentText: () => "Message queued" };
        }),
    },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => { const c = { timeBased: () => c, everyHours: () => c, create: () => ({}) }; return c; } },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: s => ({ content: s, setMimeType() { return this; } }) },
};
vm.createContext(context);
// same order as scripts/build_backend.py (dist/KCM-Backend.gs)
const FILES = ["Vendor.gs", "Security.gs", "Pricing.gs", "Code.gs", "Ops.gs", "Demo.gs"];
const code = FILES.map(f => fs.readFileSync(path.join(__dirname, "..", "apps-script", f), "utf8")).join("\n;\n");
vm.runInContext(code + "\n;this.__api = { doGet, doPost, setup, opsSweep, backfillTickets_, setUserFields_, legacyHashPassword_, upsertUser_, loadDemoData_, removeDemoData_ };", context, { filename: "KCM-Backend.gs" });
props.set("GOOGLE_CLIENT_ID", CLIENT_ID);
props.set("SITE_URL", process.env.SITE_URL || "http://127.0.0.1:5217");
props.set("WHATSAPP_ALERTS", JSON.stringify([{ phone: "27764360010", apikey: "test" }]));
console.log(context.__api.setup());

http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Headers", "Content-Type"); res.end(); return; }
    if (req.method === "GET" && req.url.startsWith("/__mail")) { res.end(JSON.stringify(mail)); return; }
    if (req.method === "GET" && req.url.startsWith("/__whatsapp")) { res.end(JSON.stringify(whatsapp)); return; }
    // TEST ONLY (mock): plant a pre-1.4 password hash to prove it is upgraded to Argon2id on sign-in
    if (req.method === "GET" && req.url.startsWith("/__demo")) { // test-only: same functions as the Sheet menu items
        const t0 = Date.now(); let out;
        try { out = req.url.includes("remove") ? context.__api.removeDemoData_() : context.__api.loadDemoData_(); } catch (e) { out = { error: e.message, stack: e.stack }; }
        res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ ms: Date.now() - t0, out })); return;
    }
    if (req.method === "GET" && req.url.startsWith("/__legacy")) {
        const q = new URL(req.url, "http://x").searchParams, email = q.get("email"), salt = "abc123";
        context.__api.upsertUser_(email, { role: q.get("role") || "PARTNER", status: "active", provider: "password" });
        context.__api.setUserFields_(email, { PasswordHash: context.__api.legacyHashPassword_(q.get("password"), salt), PasswordSalt: salt });
        res.end(JSON.stringify({ ok: true })); return;
    }
    if (req.method === "GET" && req.url.startsWith("/__sheet")) {
        const name = decodeURIComponent((/name=([^&]+)/.exec(req.url) || [])[1] || "Partners");
        res.end(JSON.stringify(sheets.get(name)?.rows || [])); return;
    }
    if (req.method === "GET") { res.end(context.__api.doGet().content); return; }
    let body = "";
    req.on("data", c => { body += c; if (body.length > 20e6) req.destroy(); });
    req.on("end", () => {
        try { res.end(context.__api.doPost({ postData: { contents: body } }).content); }
        catch (e) { console.error(e); res.statusCode = 500; res.end(JSON.stringify({ ok: false, error: String(e) })); }
    });
}).listen(PORT, "127.0.0.1", () => console.log(`KCM mock backend on http://127.0.0.1:${PORT} (owner ${OWNER})`));
