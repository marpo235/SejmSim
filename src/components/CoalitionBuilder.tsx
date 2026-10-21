import {
  KONF_FACTIONS,
  KONF_MEMBER_IDS,
  PARTIES,
  PARTY_IDS,
  type CoalitionMember,
  type PartyId,
} from "@/data/parties";
import type { MonteCarloResult } from "@/engine/types";
import { useT } from "@/lib/i18n";
import { memberSeats, type KonfSplit } from "@/lib/konfSplit";
import { cn, fmtPct } from "@/lib/utils";
import { Badge } from "./ui/primitives";

interface Props {
  seats: Record<PartyId, number>;
  konfSplit?: KonfSplit | null;
  selected: CoalitionMember[];
  onToggle: (p: CoalitionMember) => void;
  mc: MonteCarloResult | null;
}

export function CoalitionBuilder({ seats, konfSplit, selected, onToggle, mc }: Props) {
  const t = useT();
  // when the Konfederacja split is on, the "Konf" button becomes NN + RN
  const members = PARTY_IDS.flatMap((p) => {
    if (p === "KONF" && konfSplit) {
      return KONF_MEMBER_IDS.map((f) => ({
        id: f as CoalitionMember,
        short: KONF_FACTIONS[f].short,
        color: KONF_FACTIONS[f].color,
      }));
    }
    return [{ id: p as CoalitionMember, short: PARTIES[p].short, color: PARTIES[p].color }];
  });
  const total = selected.reduce((a, m) => a + memberSeats(m, seats, konfSplit), 0);
  const pct = Math.min(100, (total / 460) * 100);
  const majority = total >= 231;
  const constitutional = total >= 276;
  const prob = mc?.customCoalition;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          {t.coalition.title}
        </h2>
        <span className="num text-xs text-slate-500">
          {selected.length ? t.coalition.seats(total) : t.coalition.select}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {members.map((m) => {
          const on = selected.includes(m.id);
          const s = memberSeats(m.id, seats, konfSplit);
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              disabled={s === 0 && !on}
              className={cn(
                "rounded-md border px-2 py-1 text-[11px] font-mono font-semibold transition-all cursor-pointer",
                on
                  ? "border-transparent text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500",
                s === 0 && !on && "opacity-30 cursor-not-allowed"
              )}
              style={on ? { background: m.color } : { color: m.color }}
            >
              {m.short} {s > 0 && <span className="opacity-80">{s}</span>}
            </button>
          );
        })}
      </div>
      {/* needle bar */}
      <div className="relative h-4 rounded-full bg-slate-800 overflow-visible">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            constitutional ? "bg-emerald-500" : majority ? "bg-amber-500" : "bg-slate-600"
          )}
          style={{ width: `${pct}%` }}
        />
        {[231, 276].map((b) => (
          <div
            key={b}
            className="absolute top-[-4px] bottom-[-4px] w-px bg-slate-400/70"
            style={{ left: `${(b / 460) * 100}%` }}
          >
            <span className="num absolute -top-4 -translate-x-1/2 text-[9px] text-slate-500">
              {b}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-semibold",
            constitutional ? "text-emerald-400" : majority ? "text-amber-400" : "text-slate-500"
          )}
        >
          {selected.length === 0
            ? "—"
            : constitutional
              ? t.coalition.constMaj
              : majority
                ? t.coalition.govMaj
                : t.coalition.short(231 - total)}
        </span>
        {prob && (
          <span className="num text-slate-400">
            P(≥231) ={" "}
            <span className="font-bold text-slate-100">{fmtPct(prob.pMajority, 0)}</span>
            {" · "}P(≥276) ={" "}
            <span className="font-bold text-slate-100">{fmtPct(prob.pConstitutional, 0)}</span>
          </span>
        )}
      </div>
      {!prob && selected.length > 0 && mc == null && (
        <div className="mt-1 text-[10px] text-slate-600">{t.coalition.runMc}</div>
      )}
    </div>
  );
}
