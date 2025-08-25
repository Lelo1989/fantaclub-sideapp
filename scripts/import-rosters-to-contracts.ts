/**
 * Importa le rose da CSV -> crea contratti di 1 anno,
 * scala il budget del team e scrive in teamHistory.
 *
 * LOG dettagliati per ogni riga SKIPPATA (motivo incluso).
 *
 * ENV richieste:
 *  - FIREBASE_ADMIN_KEY_PATH=./secrets/firebase-admin-key.json
 *  - SEASON_ID=2025-26
 *  - INPUT=scripts/data/tiranacarta-cup-rosters.csv
 *
 * CSV atteso (header flessibile, case-insensitive):
 *  - team  (può essere 'Team1'..'TeamN' oppure il nome visuale in teams.name)
 *  - fgId  (id numerico come stringa della collezione fgSeasons/{SEASON_ID}/players/{fgId})
 *  - price (numero; costo d'acquisto)
 *
 * Opzionali:
 *  - DRY_RUN=1                -> non scrive, solo log
 *  - ONLY_TEAM=Team3          -> processa solo quel teamId
 *  - LIMIT=200                -> processa al massimo N righe
 *  - LOG_ALL_SKIPS=1          -> logga anche gli skip di validazione base
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

/* ===================== ENV ===================== */
const SEASON_ID = process.env.SEASON_ID || "2025-26";
const INPUT = process.env.INPUT || "scripts/data/tiranacarta-cup-rosters.csv";
const KEY_PATH = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";

const DRY_RUN = process.env.DRY_RUN === "1";
const ONLY_TEAM = process.env.ONLY_TEAM || "";
const LIMIT = Number(process.env.LIMIT || 0);
const LOG_ALL_SKIPS = process.env.LOG_ALL_SKIPS === "1";

/* ===================== UTILS ===================== */
const toStr = (v: any) => String(v ?? "").trim();
const toNum = (v: any) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
function assertFiles() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Service account non trovato: ${path.resolve(KEY_PATH)}`);
  }
  if (!fs.existsSync(INPUT)) {
    throw new Error(`CSV non trovato: ${path.resolve(INPUT)}`);
  }
}

/**
 * Inizializzazione Admin SDK super-robusta:
 * - prova API modulare (firebase-admin/app + firestore)
 * - in caso di problemi, fallback al namespace classico ('firebase-admin')
 * - **mai** accede a `.length` su oggetti non definiti.
 */
async function initDb(): Promise<{
  db: any;
  serverTimestamp: () => any;
}> {
  const sa = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));

  try {
    // Tentativo con API modulare
    const appMod: any = await import("firebase-admin/app");
    const fsMod: any = await import("firebase-admin/firestore");

    const getAppsSafe: (() => any[]) | undefined = appMod?.getApps;
    const initializeAppSafe = appMod?.initializeApp;
    const certSafe = appMod?.cert;

    const appsArr = typeof getAppsSafe === "function" ? getAppsSafe() : [];
    const app =
      Array.isArray(appsArr) && appsArr.length
        ? appsArr[0]
        : initializeAppSafe({ credential: certSafe(sa), projectId: sa.project_id });

    const db = fsMod.getFirestore(app);
    const serverTimestamp = () => fsMod.FieldValue.serverTimestamp();
    return { db, serverTimestamp };
  } catch {
    // Fallback al namespace classico
    const adminNs: any = await import("firebase-admin");
    const adm: any = adminNs?.default || adminNs;

    const appsArr = Array.isArray(adm?.apps) ? adm.apps : [];
    if (!appsArr.length) {
      adm.initializeApp({ credential: adm.credential.cert(sa) });
    }
    const db = adm.firestore();
    const serverTimestamp = () => adm.firestore.FieldValue.serverTimestamp();
    return { db, serverTimestamp };
  }
}

/* ===================== TYPES ===================== */
type CsvRow = {
  team?: string;
  teamid?: string;
  fgid?: string | number;
  id?: string | number;         // alias
  playerid?: string | number;   // alias
  price?: string | number;
  valore?: string | number;     // alias
  acquisto?: string | number;   // alias
};

type SeasonPlayer = {
  fgId: string;   // = doc.id
  name: string;
  role?: string;
};

type TeamDoc = {
  id: string;
  name: string;
  budget?: number;
  seasonId?: string;
};

/* ===================== MAIN ===================== */
async function main() {
  console.log(`[env] SEASON_ID=${SEASON_ID}`);
  console.log(`[env] INPUT=${INPUT}`);
  console.log(`[env] DRY_RUN=${DRY_RUN ? "ON" : "OFF"}`);

  assertFiles();
  const { db, serverTimestamp } = await initDb();

  // --- Carica CSV
  const raw = fs.readFileSync(INPUT, "utf8");
  const csvRows = parse(raw, {
    columns: (h) => h.map((x: string) => x.trim().toLowerCase()),
    bom: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  console.log(`[csv] righe: ${csvRows.length}`);

  // --- Indicizza giocatori stagione
  const playersSnap = await db.collection("fgSeasons").doc(SEASON_ID).collection("players").get();
  const playersById = new Map<string, SeasonPlayer>();
  playersSnap.forEach((d: any) => {
    const data = d.data() || {};
    playersById.set(String(d.id), {
      fgId: String(d.id),
      name: toStr(data.name),
      role: data.role ? toStr(data.role) : undefined,
    });
  });
  console.log(`[players] indicizzati: ${playersById.size}`);

  // --- Indicizza team per stagione
  const teamsSnap = await db.collection("teams").where("seasonId", "==", SEASON_ID).get();
  const teamsById = new Map<string, TeamDoc>();
  const teamNameToId = new Map<string, string>(); // name lc -> teamId
  teamsSnap.forEach((d: any) => {
    const t = { id: d.id, ...(d.data() || {}) } as TeamDoc;
    teamsById.set(t.id, t);
    if (t.name) teamNameToId.set(toStr(t.name).toLowerCase(), t.id);
  });
  console.log(`[teams] caricati: ${teamsById.size}`);

  // --- Contratti esistenti (per dedup per stagione)
  const existingContractsSnap = await db.collection("contracts").where("seasonId", "==", SEASON_ID).get();
  const hasContract = new Set<string>(); // chiave teamId|fgId
  existingContractsSnap.forEach((d: any) => {
    const c = d.data() || {};
    if (c.teamId && c.fgId) hasContract.add(`${c.teamId}|${String(c.fgId)}`);
  });
  console.log(`[contracts] esistenti per stagione: ${hasContract.size}`);

  // --- Counters e motivi di skip
  let processed = 0;
  let created = 0;
  const skipCounts: Record<string, number> = {};
  const logSkip = (code: string, msg: string) => {
    skipCounts[code] = (skipCounts[code] || 0) + 1;
    console.log(`SKIP [${code}]: ${msg}`);
  };

  // --- Elabora CSV
  for (let i = 0; i < csvRows.length; i++) {
    if (LIMIT > 0 && processed >= LIMIT) break;
    processed++;

    const r = csvRows[i];

    // Normalizza header flessibili
    const teamCell = toStr(r.team ?? r.teamid);
    const fgIdCsv = toStr(r.fgid ?? r.id ?? r.playerid);
    const price = toNum(r.price ?? r.valore ?? r.acquisto);

    if (!teamCell || !fgIdCsv) {
      if (LOG_ALL_SKIPS) logSkip("ROW_INVALID", `team="${teamCell}" fgId="${fgIdCsv}"`);
      continue;
    }
    if (!/^\d+$/.test(fgIdCsv)) {
      logSkip("FGID_NOT_NUMERIC", `fgId="${fgIdCsv}"`);
      continue;
    }
    if (!Number.isFinite(price) || price < 0) {
      logSkip("PRICE_INVALID", `price="${r.price ?? r.valore ?? r.acquisto}"`);
      continue;
    }

    // Risolvi teamId: accetta TeamX o nome squadra
    let teamId = teamCell;
    if (!teamsById.has(teamId)) {
      const found = teamNameToId.get(teamCell.toLowerCase());
      if (found) teamId = found;
    }
    const team = teamsById.get(teamId);
    if (!team) {
      logSkip("TEAM_UNKNOWN", `team="${teamCell}" (non trovato come id né come name nella stagione ${SEASON_ID})`);
      continue;
    }
    if (ONLY_TEAM && teamId !== ONLY_TEAM) continue;

    // Risolvi giocatore in stagione
    const pl = playersById.get(fgIdCsv);
    if (!pl) {
      logSkip("FGID_NOT_FOUND", `fgId="${fgIdCsv}" non presente in fgSeasons/${SEASON_ID}/players`);
      continue;
    }

    // Doppione?
    const dupKey = `${teamId}|${fgIdCsv}`;
    if (hasContract.has(dupKey)) {
      if (LOG_ALL_SKIPS) logSkip("DUPLICATE_CONTRACT", `teamId=${teamId} fgId=${fgIdCsv}`);
      continue;
    }

    // Budget sufficiente?
    const currentBudget = Number(team.budget ?? 0);
    if (currentBudget < price) {
      logSkip("BUDGET_INSUFFICIENT", `${team.name} budget=${currentBudget} < price=${price}`);
      continue;
    }

    // Scrittura (transazione)
    if (DRY_RUN) {
      created++;
      hasContract.add(dupKey);
      console.log(`[DRY] ${team.name}: contratto ${pl.name} (${pl.role ?? "?"}) €${price}`);
      continue;
    }

    try {
      await db.runTransaction(async (tx: any) => {
        const teamRef = db.collection("teams").doc(teamId);
        const teamSnap = await tx.get(teamRef);
        if (!teamSnap.exists) throw new Error(`Team scomparso in transazione: ${teamId}`);

        const liveBudget = Number((teamSnap.data()?.budget ?? 0));
        if (liveBudget < price) throw new Error(`Budget insufficiente live: ${liveBudget} < ${price}`);

        // crea contratto (auto id) + storico
        const contractRef = db.collection("contracts").doc();
        const seasonYear = Number(SEASON_ID.split("-")[0]) || new Date().getFullYear();

        tx.set(contractRef, {
          teamId,
          fgId: fgIdCsv,
          seasonId: SEASON_ID,
          playerName: pl.name,
          role: pl.role ?? null,
          cost: price,
          startYear: seasonYear,
          endYear: seasonYear + 1,
          status: "active",
          createdAt: serverTimestamp(),
        });

        tx.update(teamRef, { budget: liveBudget - price });

        const histRef = db.collection("teamHistory").doc();
        tx.set(histRef, {
          teamId,
          seasonId: SEASON_ID,
          kind: "contract",
          payload: {
            fgId: fgIdCsv,
            playerName: pl.name,
            role: pl.role ?? null,
            cost: price,
            startYear: seasonYear,
            endYear: seasonYear + 1,
          },
          createdAt: serverTimestamp(),
        });
      });

      created++;
      hasContract.add(dupKey);
      console.log(`${team.name}: contratto creato → ${pl.name} (${pl.role ?? "?"}) €${price}`);
    } catch (e: any) {
      logSkip("TX_ERROR", `${teamId}/${fgIdCsv}: ${e?.message || e}`);
    }
  }

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Righe processate: ${processed}`);
  console.log(`Contratti creati : ${created}${DRY_RUN ? " (DRY RUN)" : ""}`);
  console.log(`Skips:`);
  const keys = Object.keys(skipCounts).sort();
  if (!keys.length) {
    console.log("  nessuno");
  } else {
    for (const k of keys) console.log(`  ${k}: ${skipCounts[k]}`);
  }
  console.log("");
}

// BOOT
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
