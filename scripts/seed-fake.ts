// scripts/seed-fake.ts
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

  const fakePlayers = [
    { name: "Lautaro Martinez", role: "A" },
    { name: "Brahim Diaz", role: "C" },
    { name: "Sandro Tonali", role: "C" },
    { name: "Theo Hernandez", role: "D" },
    { name: "Mike Maignan", role: "P" },
    { name: "Dusan Vlahovic", role: "A" },
    { name: "Nicolò Barella", role: "C" },
    { name: "Federico Dimarco", role: "D" },
    { name: "Victor Osimhen", role: "A" },
    { name: "Gianluigi Donnarumma", role: "P" },
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
        capacity: 20000 + Math.floor(Math.random() * 10000),
        ticketPrice: 10 + Math.floor(Math.random() * 10),
        theme: "classic",
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // CONTRACTS (2–3 fake per team)
    const chosen = fakePlayers.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const p of chosen) {
      await db.collection("contracts").add({
        teamId: t.id,
        playerName: p.name,
        role: p.role,
        cost: 10 + Math.floor(Math.random() * 30),
        startYear: 2025,
        endYear: 2026 + Math.floor(Math.random() * 2), // 2026–2027
        status: "active",
        notes: "",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  console.log("✅ Seed fake completato: 10 squadre, stadi e contratti.");
}

main().catch((e) => {
  console.error("❌ Errore seed:", e);
  process.exit(1);
});
