// scripts/import-fg-players.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import slugify from "slugify";

type CsvRow = {
  Id?: string | number;
  R: string;
  RM?: string;
  Nome: string;
  Squadra: string;
  "Qt.A"?: string | number;
  "Qt.I"?: string | number;
  "Diff."?: string | number;
  "Qt.A M"?: string | number;
  "Qt.I M"?: string | number;
  "Diff.M"?: string | number;
  FVM?: string | number;
  "FVM M"?: string | number;
  Annuale?: string | number;
  Biennale?: string | number;
  Triennale?: string | number;
};

const SERVICE_ACCOUNT = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";
const SEASON_ID = process.env.SEASON_ID || "2025-26";
const INPUT = process.env.INPUT || "scripts/data/Database Giocatori - Tutti.csv";

function toId(s: string) {
  return slugify(s, { lower: true, strict: true }).replace(/-/g, "_");
}
function num(v: any) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function roleMap(r: string): "P"|"D"|"C"|"A" {
  const R = (r || "").toUpperCase().trim();
  if (R.startsWith("P")) return "P";
  if (R.startsWith("D")) return "D";
  if (R.startsWith("C") || R.startsWith("M")) return "C";
  return "A";
}

function ensureAdmin() {
  if (getApps().length) return;

  const raw = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";
  const keyPath = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  if (!fs.existsSync(keyPath)) {
    console.error("[import] Service account non trovato:", keyPath);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  initializeApp({
    credential: cert(sa),
    projectId: sa.project_id,
  });
  console.log("[import] Service account caricato:", keyPath);
}



async function chunked<T>(arr: T[], size: number, fn: (part: T[], i: number) => Promise<void>) {
  for (let i = 0; i < arr.length; i += size) {
    await fn(arr.slice(i, i + size), i / size);
  }
}

async function main() {
  ensureAdmin();
  const db = getFirestore();

  const filePath = path.isAbsolute(INPUT) ? INPUT : path.resolve(process.cwd(), INPUT);
  const buf = fs.readFileSync(filePath);
  const rows = parse(buf, { columns: true, skip_empty_lines: true }) as CsvRow[];

  // filtra righe “vuote” (nel tuo file sono ~478)
  const data = rows.filter(r => (r.Nome || "").toString().trim().length > 0);

  // opzionale: crea/aggiorna teams derivati
  const teamSet = new Set<string>();
  for (const r of data) teamSet.add((r.Squadra || "").toString().trim());
  const teams = Array.from(teamSet).map(name => ({
    id: toId(name),
    name,
  }));
  await chunked(teams, 500, async (part, bi) => {
    const b = db.batch();
    for (const t of part) {
      const ref = db.collection("fgSeasons").doc(SEASON_ID).collection("teams").doc(t.id);
      b.set(ref, { id: t.id, name: t.name, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await b.commit();
    console.log(`Teams batch ${bi + 1} ✅ (${part.length})`);
  });

  // players
  const players = data.map((r) => {
    const name = String(r.Nome).trim();
    const role = roleMap(String(r.R || "C"));
    const teamName = String(r.Squadra || "").trim();
    const teamId = toId(teamName);
    const fgIdRaw = (r.Id ?? `${name}__${role}__${teamName}`).toString();
    const docId = toId(fgIdRaw);

    return {
      _docId: docId,
      fgId: fgIdRaw,
      name,
      name_lc: name.toLowerCase(),
      role,
      roleLong: r.RM || null,
      teamId,
      teamName,
      price: num(r["Qt.A"]),
      priceInitial: num(r["Qt.I"]),
      priceDelta: num(r["Diff."]),
      priceMkt: num(r["Qt.A M"]),
      priceInitialMkt: num(r["Qt.I M"]),
      priceDeltaMkt: num(r["Diff.M"]),
      fvm: num(r.FVM),
      fvmM: num(r["FVM M"]),
      annual: num(r.Annuale),
      biennial: num(r.Biennale),
      triennial: num(r.Triennale),
      seasonId: SEASON_ID,
      updatedAt: FieldValue.serverTimestamp()
    };
  });

  await chunked(players, 500, async (part, bi) => {
    const b = db.batch();
    for (const p of part) {
      const ref = db.collection("fgSeasons").doc(SEASON_ID).collection("players").doc(p._docId);
      const { _docId, ...payload } = p as any;
      b.set(ref, payload, { merge: true }); // idempotente
    }
    await b.commit();
    console.log(`Players batch ${bi + 1} ✅ (${part.length})`);
  });

  console.log(`\nImport completato: ${players.length} giocatori su stagione ${SEASON_ID} 🎉`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
