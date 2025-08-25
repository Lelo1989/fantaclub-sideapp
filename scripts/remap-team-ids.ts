// scripts/remap-team-ids.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const SERVICE_ACCOUNT = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";
const INPUT = process.env.INPUT || "scripts/data/team-id-mapping.csv";
const DRY_RUN = String(process.env.DRY_RUN || "false").toLowerCase() === "true";
const DELETE_OLD_STADIUMS = String(process.env.DELETE_OLD_STADIUMS || "false").toLowerCase() === "true";

function ensureAdmin() {
  if (getApps().length) return;
  const keyPath = path.isAbsolute(SERVICE_ACCOUNT) ? SERVICE_ACCOUNT : path.resolve(process.cwd(), SERVICE_ACCOUNT);
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

type MapRow = { oldId: string; newId: string };

async function updateColWhereTeamId(col: string, oldId: string, newId: string) {
  const db = getFirestore();
  const qs = await db.collection(col).where("teamId", "==", oldId).get();
  if (qs.empty) return 0;
  if (DRY_RUN) return qs.size;

  const batch = db.batch();
  qs.forEach(d => batch.update(d.ref, { teamId: newId, updatedAt: FieldValue.serverTimestamp() }));
  await batch.commit();
  return qs.size;
}

async function migrateStadiums(oldId: string, newId: string) {
  const db = getFirestore();
  const qs = await db.collection("stadiums").where("teamId", "==", oldId).get();
  if (qs.empty) return { moved: 0, deleted: 0 };

  // prendo lo stadiumId previsto dal doc team target, se esiste
  const teamTarget = await db.collection("teams").doc(newId).get();
  const suggestedStadiumId = teamTarget.exists && (teamTarget.data() as any).stadiumId
    ? (teamTarget.data() as any).stadiumId
    : `${newId}-STADIUM`;

  let moved = 0, deleted = 0;
  for (const d of qs.docs) {
    const data = d.data();
    const newDocId = suggestedStadiumId; // convogliamo tutti sullo stadiumId target
    const newRef = db.collection("stadiums").doc(newDocId);

    if (!DRY_RUN) {
      await newRef.set(
        { ...data, teamId: newId, name: data.name || `${newId} Stadium`, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    moved++;

    // eventualmente cancello il vecchio
    if (DELETE_OLD_STADIUMS && d.id !== newDocId && !DRY_RUN) {
      await d.ref.delete();
      deleted++;
    }
  }
  return { moved, deleted };
}

async function patchStandings(oldId: string, newId: string) {
  const db = getFirestore();
  const snap = await db.collection("standings").get();
  let patched = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as any;
    if (!Array.isArray(data.positions)) continue;

    let touched = false;
    const positions = data.positions.map((p: any) => {
      if (p?.teamId === oldId) { touched = true; return { ...p, teamId: newId }; }
      return p;
    });

    if (touched) {
      if (!DRY_RUN) await doc.ref.update({ positions });
      patched++;
    }
  }
  return patched;
}

async function main() {
  ensureAdmin();
  const db = getFirestore();

  const filePath = path.isAbsolute(INPUT) ? INPUT : path.resolve(process.cwd(), INPUT);
  const mapRows = parse(fs.readFileSync(filePath), { columns: true, skip_empty_lines: true }) as MapRow[];

  console.log(`Found ${mapRows.length} mappings`);
  let totals = { users: 0, contracts: 0, stadiumsMoved: 0, stadiumsDeleted: 0, history: 0, standings: 0 };

  for (const m of mapRows) {
    const oldId = m.oldId.trim();
    const newId = m.newId.trim();
    if (!oldId || !newId) continue;

    console.log(`\n➡️  ${oldId}  →  ${newId}`);

    const u = await updateColWhereTeamId("users", oldId, newId);
    const c = await updateColWhereTeamId("contracts", oldId, newId);
    const h = await updateColWhereTeamId("teamHistory", oldId, newId);
    const st = await migrateStadiums(oldId, newId);
    const s = await patchStandings(oldId, newId);

    totals.users += u;
    totals.contracts += c;
    totals.history += h;
    totals.stadiumsMoved += st.moved;
    totals.stadiumsDeleted += st.deleted;
    totals.standings += s;

    console.log(`   users:${u}  contracts:${c}  history:${h}  stadiums moved:${st.moved} (deleted:${st.deleted})  standings patched:${s}`);
  }

  console.log("\n=== SUMMARY ===");
  console.log(totals, DRY_RUN ? "(dry-run: nessuna scrittura eseguita)" : "");
}

main().catch(e => { console.error(e); process.exit(1); });
