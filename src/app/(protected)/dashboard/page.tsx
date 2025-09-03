"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useTeamData } from "@/hooks/useTeamData";
import { useStadium } from "@/hooks/useStadium";
import { useExpiringContracts, type Contract } from "@/hooks/useExpiringContracts";
import { useCurrentSeasonId } from "@/hooks/useCurrentSeasonId";
import { CardSkeleton } from "@/components/CardSkeleton";
import { TableSkeleton } from "@/components/TableSkeleton";
import DebugDock from "@/components/DebugDock";

type Stadium = { id: string; teamId: string; name: string; capacity: number; ticketPrice: number; imageUrl?: string; };
type HistoryEvent = { id: string; teamId: string; seasonId?: string; kind: string; payload?: any; createdAt?: any; };

function withDocId<T extends Record<string, any>>(d: QueryDocumentSnapshot<DocumentData>) {
  const data = d.data() as Record<string, any>;
  const { id: _ignore, ...rest } = data;
  return { id: d.id, ...rest } as T & { id: string };
}

function Section({ title, right, children, alt=false, onClick }: { title: string; right?: React.ReactNode; children: React.ReactNode; alt?: boolean; onClick?: () => void }) {
  return (
    <section onClick={onClick} className={`fm-card ${alt ? "fm-card--alt" : ""} ${onClick ? "cursor-pointer" : ""}`}>
      <header className="px-4 md:px-5 py-3 md:py-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </header>
      <div className="px-4 md:px-5 pb-4">{children}</div>
    </section>
  );
}

function OverviewCard({ teamName, budget, seasonId, error }: { teamName?: string; budget?: number; seasonId?: string | null; error?: string | null }) {
  const money = (n?: number) => (n==null? "—" : new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n));
  return (
    <Section title="Panoramica" alt>
      <div className="grid grid-cols-2 gap-4 text-sm fm-muted">
        <div className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-xs uppercase tracking-wider">Squadra</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold">
            {teamName ?? "—"}
            {!teamName && error ? ` (${error})` : ""}
          </div>
        </div>
        <div className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-xs uppercase tracking-wider">Budget</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold">
            {budget==null ? "—" : money(budget)}
            {budget==null && error ? ` (${error})` : ""}
          </div>
        </div>
        <div className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-xs uppercase tracking-wider">Stagione</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold">
            {seasonId ?? "—"}
            {!seasonId && error ? ` (${error})` : ""}
          </div>
        </div>
        <div className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-xs uppercase tracking-wider">Azioni rapide</div>
          <div className="mt-2 flex gap-2">
            <Link href="/contracts" className="fm-btn">Rinnovi</Link>
            <Link href="/stadium" className="fm-btn fm-btn--accent">Matchday</Link>
          </div>
        </div>
      </div>
    </Section>
  );
}

function StadiumCard({ stadium }: { stadium: Stadium | null }) {
  return (
    <Section title={stadium?.name ?? "Stadio"} right={<Link href="/stadium" className="fm-link text-sm">Apri Stadio</Link>}>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border fm-border">
          <Image
            src={stadium?.imageUrl || "/stadium-placeholder.jpg"}
            alt={stadium?.name || "Stadio"}
            fill
            className="object-cover"
            sizes="112px"
            priority
          />
        </div>
        <div className="text-sm fm-muted">
          <div>Capienza: <b className="text-[var(--fm-text)]">{stadium?.capacity ?? "—"}</b></div>
          <div>Prezzo medio: <b className="text-[var(--fm-text)]">{stadium?.ticketPrice ?? "—"}</b></div>
        </div>
      </div>
    </Section>
  );
}

function ExpiringContractsList({ data, seasonId }: { data: Contract[]; seasonId?: string | null }) {
  return (
    <Section
      title={`Contratti in scadenza ${seasonId ? `(${seasonId})` : ""}`}
      right={<Link href="/contracts" className="fm-link text-sm">Gestisci</Link>}
    >
      {data.length === 0 ? (
        <div className="text-sm fm-muted">Nessun contratto in scadenza.</div>
      ) : (
        <ul className="divide-y divide-[var(--fm-border)]">
          {data.map((c) => (
            <li key={c.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.playerName}</div>
                <div className="text-xs fm-muted">{c.role}</div>
              </div>
              <Link className="fm-btn" href="/contracts">Rinnova</Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function HistoryList({ events }: { events: HistoryEvent[] }) {
  const fmtDate = (x:any) => {
    try{ if (x?.toDate) return x.toDate().toLocaleString("it-IT"); const d=new Date(x); return isNaN(+d)?"":d.toLocaleString("it-IT"); }catch{ return ""; }
  };
  return (
    <Section title="Ultimi eventi" right={<Link href="/history" className="fm-link text-sm">Dettagli</Link>} alt>
      {events.length === 0 ? (
        <div className="text-sm fm-muted">Nessun evento recente.</div>
      ) : (
        <ul className="divide-y divide-[var(--fm-border)]">
          {events.map((e) => (
            <li key={e.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{e.kind.replace(/\./g, " · ")}</div>
                <div className="text-xs fm-muted truncate">{fmtDate(e.createdAt)}</div>
              </div>
              <span className="fm-badge">{e.seasonId ?? ""}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function RosaCard() {
  const router = useRouter();
  const go = () => router.push("/rosa");
  return (
    <Section
      title="Rosa"
      right={<Link href="/rosa" onClick={(e) => e.stopPropagation()} className="fm-link text-sm">Apri Rosa</Link>}
      onClick={go}
    >
      <p className="text-sm fm-muted">Gestisci la rosa della tua squadra.</p>
    </Section>
  );
}

function StandingsCard() {
  const router = useRouter();
  const go = () => router.push("/standings");
  return (
    <Section
      title="Classifica"
      right={<Link href="/standings" onClick={(e) => e.stopPropagation()} className="fm-link text-sm">Apri Classifica</Link>}
      onClick={go}
    >
      <p className="text-sm fm-muted">Visualizza la classifica aggiornata.</p>
    </Section>
  );
}

/** Nuova card: Dettagli tecnici (senza alterare layout generale) */
function TechDetailsCard(props: {
  team: any;
  stadium: Stadium | null;
  contractsCount: number;
  expiringCount: number;
  lastEvent: HistoryEvent | null;
}) {
  const fmtDate = (x:any) => {
    try{ if (x?.toDate) return x.toDate().toLocaleString("it-IT"); const d=new Date(x); return isNaN(+d)?"":d.toLocaleString("it-IT"); }catch{ return ""; }
  };
  const teamId = props.team?.id ?? props.team?.teamId ?? null;
  return (
    <Section title="Dettagli tecnici">
      <ul className="text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
        <li className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-xs uppercase tracking-wider fm-muted">Team ID</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold break-all">{teamId ?? "—"}</div>
        </li>
        <li className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-xs uppercase tracking-wider fm-muted">Owner UID</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold break-all">{props.team?.ownerUserId ?? "—"}</div>
        </li>
        <li className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-xs uppercase tracking-wider fm-muted">Stadium ID</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold break-all">{props.stadium?.id ?? "—"}</div>
        </li>
        <li className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-xs uppercase tracking-wider fm-muted">Contratti totali</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold">{props.contractsCount}</div>
        </li>
        <li className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-xs uppercase tracking-wider fm-muted">Contratti in scadenza</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold">{props.expiringCount}</div>
        </li>
        <li className="rounded-xl border fm-border bg-[rgba(255,255,255,0.03)] p-3">
          <div className="text-xs uppercase tracking-wider fm-muted">Ultimo evento</div>
          <div className="mt-1 text-[var(--fm-text)] font-semibold">
            {props.lastEvent ? `${props.lastEvent.kind.replace(/\./g, " · ")} — ${fmtDate(props.lastEvent.createdAt)}` : "—"}
          </div>
        </li>
      </ul>
    </Section>
  );
}

export default function DashboardPage() {
  // useTeamData ora fornisce anche i contratti totali
  const { team, contracts, loading: loadingTeam, error } = useTeamData();
  console.log('[dashboard]', { team, contracts, loadingTeam, error });
  const teamId = useMemo(() => (team as any)?.id ?? (team as any)?.teamId ?? null, [team]);
  const seasonId = useCurrentSeasonId((team as any)?.seasonId);

  const { stadium, loading: loadingStadium } = useStadium(teamId ?? undefined);
  const { data: expiring, loading: loadingContracts } = useExpiringContracts(teamId ?? undefined, seasonId ?? undefined);

  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // LOG lato pagina (attivo solo se FC_DEBUG=1)
  useEffect(() => {
    // @ts-ignore
    const dbg = typeof window !== "undefined" && (window as any).FC_DEBUG;
    if (!dbg) return;
    console.debug("[FC][dashboard] state", {
      teamId,
      seasonId,
      loadingTeam,
      loadingStadium,
      loadingContracts,
      loadingEvents,
      stadiumName: (stadium as any)?.name ?? null,
      expiringLen: expiring?.length ?? 0,
      eventsLen: events?.length ?? 0,
      teamName: (team as any)?.name ?? null,
      contractsLen: contracts?.length ?? 0,
    });
  }, [team, contracts, teamId, seasonId, stadium, expiring, events, loadingTeam, loadingStadium, loadingContracts, loadingEvents]);

  useEffect(() => {
  if (!teamId) return;
  setLoadingEvents(true);

  console.time("[FC][dashboard] history");
  const watchdog = setTimeout(() => {
    // @ts-ignore
    if (typeof window !== "undefined" && (window as any).FC_DEBUG) {
      console.warn("[FC][dashboard] history taking >4000ms", { teamId });
    }
  }, 4000);

  const q = query(
    collection(db, "teamHistory"),
    where("teamId","==",teamId),
    orderBy("createdAt","desc"),
    limit(5)
  );
  const unsub = onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => withDocId<HistoryEvent>(d));
      setEvents(rows); setLoadingEvents(false);
      console.timeEnd("[FC][dashboard] history");
      // @ts-ignore
      if (typeof window !== "undefined" && (window as any).FC_DEBUG) {
        console.debug("[FC][dashboard] history snapshot", { count: rows.length });
      }
      clearTimeout(watchdog);
    },
    (err) => {
      console.timeEnd("[FC][dashboard] history");
      console.error("[FC][dashboard] history ERROR", err);
      setLoadingEvents(false);
      clearTimeout(watchdog);
    }
  );
  return () => {
    clearTimeout(watchdog);
    unsub();
  };
}, [teamId]); // 🔑 dipendenza

  const lastEvent = events.length > 0 ? events[0] : null;
  if (loadingTeam) {
    return (
      <>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <CardSkeleton />
              <CardSkeleton />
              <TableSkeleton />
              <TableSkeleton />
            </div>
            <div className="md:col-span-1 space-y-6">
              <CardSkeleton />
            </div>
          </div>
        </div>

        {/* DEBUG DOCK */}
        <DebugDock>
          <div><b>teamId</b>: {teamId ?? "-"}</div>
          <div><b>seasonId</b>: {seasonId ?? "-"}</div>
          <div><b>loading</b>: team {String(loadingTeam)} · stadium {String(loadingStadium)} · contracts {String(loadingContracts)} · events {String(loadingEvents)}</div>
          <div><b>stadium</b>: {(stadium as any)?.name ?? "-"}</div>
          <div><b>contracts (tot)</b>: {contracts?.length ?? 0}</div>
          <div><b>expiring</b>: {expiring?.length ?? 0}</div>
          <div><b>events</b>: {events?.length ?? 0}</div>
          <div><b>team</b>: {(team as any)?.name ?? "-"}</div>
        </DebugDock>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {!team && error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <OverviewCard teamName={(team as any)?.name} budget={(team as any)?.budget} seasonId={seasonId} error={error} />
            {/* Nuova card con i campi richiesti */}
            <TechDetailsCard
              team={team as any}
              stadium={stadium as any}
              contractsCount={contracts?.length ?? 0}
              expiringCount={expiring?.length ?? 0}
              lastEvent={lastEvent}
            />
            {loadingContracts ? <TableSkeleton /> : <ExpiringContractsList data={expiring} seasonId={seasonId} />}
            {loadingEvents ? <TableSkeleton /> : <HistoryList events={events} />}
          </div>
          <div className="md:col-span-1 space-y-6">
            {loadingStadium ? <CardSkeleton /> : <StadiumCard stadium={stadium as any} />}
            <RosaCard />
            <StandingsCard />
          </div>
        </div>
      </div>

      {/* DEBUG DOCK */}
      <DebugDock>
        <div><b>teamId</b>: {teamId ?? "-"}</div>
        <div><b>seasonId</b>: {seasonId ?? "-"}</div>
        <div><b>loading</b>: team {String(loadingTeam)} · stadium {String(loadingStadium)} · contracts {String(loadingContracts)} · events {String(loadingEvents)}</div>
        <div><b>stadium</b>: {(stadium as any)?.name ?? "-"}</div>
        <div><b>contracts (tot)</b>: {contracts?.length ?? 0}</div>
        <div><b>expiring</b>: {expiring?.length ?? 0}</div>
        <div><b>events</b>: {events?.length ?? 0}</div>
        <div><b>team</b>: {(team as any)?.name ?? "-"}</div>
      </DebugDock>
    </>
  );
}
