// scripts/seed.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";

const keyPath = "./secrets/firebase-admin-key.json";
if (!existsSync(keyPath)) {
  throw new Error("Manca secrets/firebase-admin-key.json");
}

// Leggi il JSON come oggetto (ESM-safe)
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));

initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore();

// --- lascia invariato tutto il resto (main(), season/teams/stadiums/...) ---


async function main() {
  // --- 1) SEASON ---
  const seasonId = "2025-26";
  await db.collection("seasons").doc(seasonId).set({
    name: "Stagione 2025/26",
    startDate: new Date("2025-09-01"),
    endDate: new Date("2026-06-30"),
    isCurrent: true,
  }, { merge: true });

  // --- 2) TEAMS (esempio 2 squadre; aggiungine altre) ---
  const teams = [
    { id: "CDS-2015", name: "CDS", slug: "cds", foundedYear: 2015 },
    { id: "DIVANO-2012", name: "Divano Kiev", slug: "divano-kiev", foundedYear: 2012 },
  ];

  for (const t of teams) {
    await db.collection("teams").doc(t.id).set({
      name: t.name,
      slug: t.slug,
      ownerUserId: null,         // lo imposterai dopo i signup
      foundedYear: t.foundedYear,
      logoUrl: "",
      budget: 500,
      stadiumId: null,
      seasonId: seasonId,
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // --- 3) STADIUMS (uno per team) ---
  const stadiums = [
    { id: "CDS-ARENA", teamId: "CDS-2015", name: "CDS Arena" },
    { id: "DIVANO-PARK", teamId: "DIVANO-2012", name: "Divano Park" },
  ];

  for (const s of stadiums) {
    await db.collection("stadiums").doc(s.id).set({
      teamId: s.teamId,
      name: s.name,
      capacity: 20000,
      ticketPrice: 15,
      theme: "classic",
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // aggiorna il riferimento sul team
    await db.collection("teams").doc(s.teamId).set({
      stadiumId: s.id,
    }, { merge: true });
  }

  // --- 4) CONTRACTS (qualche giocatore di esempio) ---
  const contracts = [
    {
      teamId: "CDS-2015",
      playerName: "Lautaro Martinez",
      role: "A", cost: 25, startYear: 2025, endYear: 2027, status: "active",
    },
    {
      teamId: "DIVANO-2012",
      playerName: "Brahim Diaz",
      role: "C", cost: 18, startYear: 2025, endYear: 2026, status: "active",
    },
  ];

  for (const c of contracts) {
    await db.collection("contracts").add({
      ...c,
      notes: "",
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  // --- 5) STANDINGS snapshot iniziale ---
  await db.collection("standings").add({
    seasonId,
    positions: [
      { teamId: "CDS-2015", rank: 1, points: 0, gf: 0, gs: 0, diff: 0 },
      { teamId: "DIVANO-2012", rank: 2, points: 0, gf: 0, gs: 0, diff: 0 },
    ],
    updatedAt: FieldValue.serverTimestamp(),
  });

  // --- 6) TRANSFERS esempio ---
  await db.collection("transfers").add({
    seasonId,
    type: "signing",
    teamId: "CDS-2015",
    playerName: "Lautaro Martinez",
    amount: 120,
    notes: "Acquisto asta iniziale",
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log("✅ Seed completato");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
