// scripts/seed-standings.ts
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

  const rows = teams.map((t) => {
    const points = Math.floor(Math.random() * 40) + 10;
    const gf = Math.floor(Math.random() * 40) + 10;
    const gs = Math.floor(Math.random() * 30);
    return { teamId: t, points, gf, gs, diff: gf - gs, rank: 0 };
  });

  rows.sort((a, b) => b.points - a.points || b.diff - a.diff);
  rows.forEach((r, i) => (r.rank = i + 1));

  await db.collection("standings").add({
    seasonId,
    positions: rows,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seed standings completato");
}

main().catch((e) => {
  console.error("❌ Errore seed standings:", e);
  process.exit(1);
});
