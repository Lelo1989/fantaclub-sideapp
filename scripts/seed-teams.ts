// scripts/seed-teams.ts
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
    { id: "CDS-2015", name: "CDS", foundedYear: 2015 },
    { id: "DIVANO-2012", name: "Divano Kiev", foundedYear: 2012 },
    { id: "ALLSTARS-2012", name: "All Stars", foundedYear: 2012 },
    { id: "DIAMOND-2020", name: "Diamond", foundedYear: 2020 },
    { id: "LEONI-2018", name: "Leoni FC", foundedYear: 2018 },
    { id: "TIGERS-2017", name: "Tigers United", foundedYear: 2017 },
    { id: "FENIX-2016", name: "Fenix Club", foundedYear: 2016 },
    { id: "DRAGONS-2014", name: "Dragons 1914", foundedYear: 2014 },
    { id: "SHARKS-2019", name: "Sharks 2019", foundedYear: 2019 },
    { id: "WOLVES-2013", name: "Wolves Team", foundedYear: 2013 },
  ];

  for (const t of teams) {
    // TEAM
    await db.collection("teams").doc(t.id).set(
      {
        name: t.name,
        slug: t.name.toLowerCase().replace(/\s+/g, "-"),
        foundedYear: t.foundedYear,
        ownerUserId: null,
        logoUrl: "",
        budget: 500,
        seasonId,
        stadiumId: `${t.id}-STADIUM`,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // STADIUM
    await db.collection("stadiums").doc(`${t.id}-STADIUM`).set(
      {
        teamId: t.id,
        name: `${t.name} Arena`,
        capacity: 20000,
        ticketPrice: 15,
        theme: "classic",
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  console.log("✅ Seed 10 squadre completato");
}

main().catch((e) => {
  console.error("❌ Errore seed:", e);
  process.exit(1);
});
