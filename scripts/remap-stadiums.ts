// scripts/remap-stadiums.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const SERVICE_ACCOUNT = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";
const INPUT = process.env.INPUT || "scripts/data/team-id-mapping.csv";
const DRY_RUN = String(process.env.DRY_RUN || "false").toLowerCase() === "true";
const DELETE_OLD = String(process.env.DELETE_OLD || "true").toLowerCase() === "true"; // elimina i doc stadio vecchi dopo il merge

function ensureAdmin() {
  if (getApps().length) return;
  const keyPath = path.isAbsolute(SERVICE_ACCOUNT) ? SERVICE_ACCOUNT : path.resolve(process.cwd(), SERVICE_ACCOUNT);
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

type MapRow = { oldId: string; newId: string };

async function main() {
  ensureAdmin();
  const db = getFirestore();

  const filePath = path.isAbsolute(INPUT) ? INPUT : path.resolve(process.cwd(), INPUT);
  const mappings = parse(fs.readFileSync(filePath), { columns: true, skip_empty_lines: true }) as MapRow[];

  let moved = 0, deleted = 0, patchedTeams = 0;

  for (const m of mappings) {
    const oldId = m.oldId.trim();
    const newId = m.newId.trim();
    if (!oldId || !newId) continue;

    console.log(`\n➡️  Remap stadiums: ${oldId} → ${newId}`);

    // quale sarà lo stadiumId finale?
    const teamSnap = await db.collection("teams").doc(newId).get();
    const teamData = teamSnap.exists ? teamSnap.data() as any : {};
    const targetStadiumId = (teamData?.stadiumId as string) || `${newId}-STADIUM`;

    // tutti gli stadi che ancora puntano al vecchio teamId
    const stSnap = await db.collection("stadiums").where("teamId", "==", oldId).get();
    if (stSnap.empty) { console.log("  nessuno stadio da migrare"); continue; }

    // merge in un unico doc target
    for (const doc of stSnap.docs) {
      const data = doc.data();
      const targetRef = db.collection("stadiums").doc(targetStadiumId);

      console.log(`  • ${doc.id}  ->  ${targetStadiumId}`);
      if (!DRY_RUN) {
        await targetRef.set(
          {
            // priorità ai dati esistenti nel target, altrimenti uso quelli del doc sorgente
            ...data,
            teamId: newId,
            name: data.name || teamData?.name ? `${teamData?.name} Stadium` : `${newId} Stadium`,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
      moved++;

      if (DELETE_OLD && doc.id !== targetStadiumId && !DRY_RUN) {
        await doc.ref.delete();
        deleted++;
      }
    }

    // assicuro che il team punti allo stadiumId target
    if (!DRY_RUN) {
      await db.collection("teams").doc(newId).update({ stadiumId: targetStadiumId });
    }
    patchedTeams++;
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Stadi migrati/mergiati: ${moved}`);
  console.log(`Stadi eliminati:       ${deleted}`);
  console.log(`Team patchati:         ${patchedTeams}`);
  if (DRY_RUN) console.log("(dry-run: nessuna scrittura eseguita)");
}

main().catch(e => { console.error(e); process.exit(1); });
