import { PARTIES, PARTY_IDS, type PartyId } from "@/data/parties";
import type { MonteCarloResult } from "@/engine/types";
import { cn, fmtPct } from "@/lib/utils";
import { Badge } from "./ui/primitives";

interface Props {
  seats: Record<PartyId, number>;
  selected: PartyId[];
  onToggle: (p: PartyId) => void;
  mc: MonteCarloResult | null;
}

export function CoalitionBuilder({ seats, selected, onToggle, mc }: Props) {
  const total = selected.reduce((a, p) => a + (seats[p] ?? 0), 0);
  const pct = Math.min(100, (total / 460) * 100);
  const majority = total >= 231;
  const constitutional = total >= 276;
  const prob = mc?.customCoalition;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Coalition builder
        </h2>
        <span className="num text-xs text-slate-500">
          {selected.length ? `${total} / 460 seats` : "select committees"}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PARTY_IDS.map((p) => {
          const on = selected.includes(p);
          const s = seats[p] ?? 0;
          return (
            <button
              key={p}
              onClick={() => onToggle(p)}
              disabled={s === 0 && !on}
              className={cn(
                "rounded-md border px-2 py-1 text-[11px] font-mono font-semibold transition-all cursor-pointer",
                on
                  ? "border-transparent text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500",
                s === 0 && !on && "opacity-30 cursor-not-allowed"
              )}
              style={on ? { background: PARTIES[p].color } : { color: PARTIES[p].color }}
            >
              {PARTIES[p].short} {s > 0 && <span className="opacity-80">{s}</span>}
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
              ? "CONSTITUTIONAL MAJORITY"
              : majority
                ? "GOVERNING MAJORITY"
                : `${231 - total} seats short`}
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
        <div className="mt-1 text-[10px] text-slate-600">Run MC to get coalition probabilities</div>
      )}
    </div>
  );
}
