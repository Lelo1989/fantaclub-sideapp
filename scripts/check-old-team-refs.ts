// scripts/check-old-team-refs.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

const SERVICE_ACCOUNT = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";

function ensureAdmin() {
  if (getApps().length) return;
  const keyPath = path.isAbsolute(SERVICE_ACCOUNT) ? SERVICE_ACCOUNT : path.resolve(process.cwd(), SERVICE_ACCOUNT);
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

function isOldTeam(id: string | null | undefined) {
  if (!id) return false;
  return !id.startsWith("Team"); // se NON inizia con "Team"
}

async function main() {
  ensureAdmin();
  const db = getFirestore();

  // ---- USERS ----
  const usersSnap = await db.collection("users").get();
  const badUsers = usersSnap.docs.filter(d => isOldTeam((d.data() as any).teamId));

  // ---- CONTRACTS ----
  const contractsSnap = await db.collection("contracts").get();
  const badContracts = contractsSnap.docs.filter(d => isOldTeam((d.data() as any).teamId));

  // ---- STADIUMS ----
  const stadiumsSnap = await db.collection("stadiums").get();
  const badStadiums = stadiumsSnap.docs.filter(d => isOldTeam((d.data() as any).teamId));

  // ---- TEAM HISTORY ----
  const historySnap = await db.collection("teamHistory").get();
  const badHistory = historySnap.docs.filter(d => isOldTeam((d.data() as any).teamId));

  // ---- STANDINGS (array positions) ----
  const standingsSnap = await db.collection("standings").get();
  const badStandings: {id:string;badIds:string[]}[] = [];
  standingsSnap.forEach(doc => {
    const data = doc.data() as any;
    const badIds = (data.positions || [])
      .map((p: any) => p.teamId)
      .filter((tid: string) => isOldTeam(tid));
    if (badIds.length > 0) {
      badStandings.push({ id: doc.id, badIds });
    }
  });

  // ---- Report ----
  console.log("=== CHECK TEAM REFERENCES ===");
  console.log(`Users con teamId non valido: ${badUsers.length}`);
  badUsers.slice(0,5).forEach(u => console.log("  ", u.id, (u.data() as any).teamId));

  console.log(`Contracts con teamId non valido: ${badContracts.length}`);
  badContracts.slice(0,5).forEach(c => console.log("  ", c.id, (c.data() as any).teamId));

  console.log(`Stadiums con teamId non valido: ${badStadiums.length}`);
  badStadiums.slice(0,5).forEach(s => console.log("  ", s.id, (s.data() as any).teamId));

  console.log(`TeamHistory con teamId non valido: ${badHistory.length}`);
  badHistory.slice(0,5).forEach(h => console.log("  ", h.id, (h.data() as any).teamId));

  console.log(`Standings con teamId non valido: ${badStandings.length}`);
  badStandings.slice(0,3).forEach(st => console.log("  ", st.id, st.badIds));
}

main().catch(e => { console.error(e); process.exit(1); });
