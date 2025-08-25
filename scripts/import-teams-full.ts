// scripts/import-teams-full.ts
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import slugify from "slugify";

const SERVICE_ACCOUNT = process.env.FIREBASE_ADMIN_KEY_PATH || "./secrets/firebase-admin-key.json";
const INPUT = process.env.INPUT || "scripts/data/teams-slots-2025-26-full.csv";

function ensureAdmin() {
  if (getApps().length) return;
  const keyPath = path.isAbsolute(SERVICE_ACCOUNT) ? SERVICE_ACCOUNT : path.resolve(process.cwd(), SERVICE_ACCOUNT);
  const sa = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
}

type Row = {
  slot: string;
  name: string;
  budget?: string | number;
  seasonId?: string;
  foundedYear?: string | number;
  slug?: string;
  stadiumId?: string;
  logoUrl?: string;
  ownerUserId?: string;
};

const toSlug = (s: string) => slugify(s, { lower: true, strict: true });

async function main() {
  ensureAdmin();
  const db = getFirestore();

  const filePath = path.isAbsolute(INPUT) ? INPUT : path.resolve(process.cwd(), INPUT);
  const rows = parse(fs.readFileSync(filePath), { columns: true, skip_empty_lines: true }) as Row[];

  let upTeams = 0, upStadiums = 0;

  for (const r of rows) {
    const id = r.slot.trim(); // es. Team1, Team2...
    const ref = db.collection("teams").doc(id);
    const prev = await ref.get();
    const existing = prev.exists ? (prev.data() as any) : {};

    const name = r.name.trim();
    const stadiumId = r.stadiumId?.trim() || existing.stadiumId || `${id}-STADIUM`;

    // 1) Team
    const payload: any = {
      name,
      slug: (r.slug || toSlug(name)),
      budget: r.budget !== undefined ? Number(r.budget) : (existing.budget ?? 500),
      seasonId: r.seasonId || existing.seasonId || "2025-26",
      foundedYear: r.foundedYear !== undefined && r.foundedYear !== "" ? Number(r.foundedYear) : (existing.foundedYear ?? null),
      stadiumId,
      logoUrl: r.logoUrl ?? existing.logoUrl ?? "",
      ownerUserId: r.ownerUserId ?? existing.ownerUserId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await ref.set(payload, { merge: true });
    upTeams++;

    // 2) Stadium (se non esiste lo creo con default)
    const stRef = db.collection("stadiums").doc(stadiumId);
    const stSnap = await stRef.get();
    if (!stSnap.exists) {
      await stRef.set({
        teamId: id,
        name: `${name} Stadium`,
        capacity: 20000,
        ticketPrice: 20,
        theme: null,
        createdAt: FieldValue.serverTimestamp(),
      });
      upStadiums++;
    }
  }

  console.log(`✅ Teams aggiornati: ${upTeams}`);
  console.log(`✅ Stadi creati: ${upStadiums}`);
}

main().catch(e => { console.error(e); process.exit(1); });
