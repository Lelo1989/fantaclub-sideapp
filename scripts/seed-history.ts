// scripts/seed-history.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";

const keyPath = "./secrets/firebase-admin-key.json";
if (!existsSync(keyPath)) throw new Error("Manca secrets/firebase-admin-key.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));

initializeApp({ credential: cert(serviceAccount as any) });
const db = getFirestore();

async function main() {
  const seasonId = "2025-26";

  const teams = [
    "CDS-2015",
    "DIVANO-2012",
    "ALLSTARS-2012",
    "DIAMOND-2020",
    "LEONI-2018",
    "TIGERS-2017",
    "FENIX-2016",
    "DRAGONS-2014",
    "SHARKS-2019",
    "WOLVES-2013",
  ];

  for (const t of teams) {
    await db.collection("teamHistory").add({
      teamId: t,
      seasonId,
      kind: "contract",
      payload: { playerName: "Player X", startYear: 2025, endYear: 2026 },
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection("teamHistory").add({
      teamId: t,
      seasonId,
      kind: "renewal",
      payload: { playerName: "Player X", newEnd: 2027 },
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection("teamHistory").add({
      teamId: t,
      seasonId,
      kind: "revenue",
      payload: { opponent: "Random FC", attendance: 18000, ticketPrice: 15, revenue: 270000 },
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  console.log("✅ Seed teamHistory completato");
}

main().catch((e) => {
  console.error("❌ Errore seed teamHistory:", e);
  process.exit(1);
});
