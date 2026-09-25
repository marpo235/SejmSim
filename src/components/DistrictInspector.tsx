import { useState } from "react";
import { PARTIES } from "@/data/parties";
import type { DistrictResult } from "@/engine/types";
import { useT } from "@/lib/i18n";
import { fmtInt, fmtPct, cn } from "@/lib/utils";
import { Badge, Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/primitives";
import { ChevronDown, X, AlertTriangle } from "lucide-react";

interface Props {
  district: DistrictResult | null;
  onClose: () => void;
}

export function DistrictInspector({ district, onClose }: Props) {
  const t = useT();
  const [auditOpen, setAuditOpen] = useState(false);
  if (!district) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
        {t.inspector.placeholder}
      </div>
    );
  }

  const topFlip = district.flips[0];
  const sortedVotes = [...district.votes].sort((a, b) => b.qualified - a.qualified);
  const winners = sortedVotes.filter((v) => v.seats > 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-start justify-between px-4 pt-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-500">
            {t.inspector.districtNo(district.id)}
          </div>
          <div className="text-lg font-bold text-slate-100">{district.name}</div>
          <div className="num text-xs text-slate-400">
            {t.inspector.seatsInfo(
              district.seats,
              district.qStar.toFixed(4),
              fmtInt(district.totalVotes)
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 cursor-pointer"
          aria-label={t.inspector.close}
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-3 px-4 py-3 md:grid-cols-2">
        {/* vote shares */}
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t.inspector.voteShare}
          </div>
          <div className="space-y-1">
            {sortedVotes.map((v) => (
              <div key={v.party} className="flex items-center gap-2 text-xs">
                <span
                  className="w-12 shrink-0 font-mono font-semibold"
                  style={{ color: PARTIES[v.party].color }}
                >
                  {PARTIES[v.party].short}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full"
                    style={{
                      width: `${v.qualified * 100}%`,
                      background: PARTIES[v.party].color,
                      opacity: v.gated ? 0.3 : 1,
                    }}
                  />
                </div>
                <span className="num w-14 text-right text-slate-300">
                  {fmtPct(v.qualified, 1)}
                </span>
                <span className={cn("num w-8 text-right font-semibold", v.seats > 0 ? "text-slate-100" : "text-slate-600")}>
                  {v.seats}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            {t.inspector.voteShareNote}
          </div>
        </div>

        {/* winners + flip */}
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t.inspector.mandates}
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {winners.map((v) => (
              <Badge key={v.party} className="text-xs" style={{ borderColor: PARTIES[v.party].color, color: PARTIES[v.party].color } as React.CSSProperties}>
                {PARTIES[v.party].short} ×{v.seats}
              </Badge>
            ))}
          </div>

          {topFlip && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-2.5 text-xs">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertTriangle size={13} />
                {t.inspector.flipTitle}
              </div>
              <div className="num leading-relaxed text-amber-100/90">
                <span style={{ color: PARTIES[topFlip.party].color }} className="font-bold">
                  {PARTIES[topFlip.party].short}
                </span>{" "}
                {t.inspector.flipTextBefore}
                {(topFlip.deltaShare * 100).toFixed(2)}
                {t.inspector.flipTextMid}
                {fmtInt(topFlip.deltaVotes)}
                {t.inspector.flipTextMid2}
                {topFlip.seatNumber}
                {t.inspector.flipTextMid3}
                <span style={{ color: PARTIES[topFlip.fromParty].color }} className="font-bold">
                  {PARTIES[topFlip.fromParty].short}
                </span>
              </div>
              {district.flips[1] && (
                <div className="num mt-1 text-[10px] text-amber-200/60">
                  {t.inspector.flipNext(
                    PARTIES[district.flips[1].party].short,
                    (district.flips[1].deltaShare * 100).toFixed(2)
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* quotient audit */}
      <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between border-t border-slate-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300">
          {t.inspector.auditTitle}
          <ChevronDown size={14} className={cn("transition-transform", auditOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="max-h-64 overflow-auto border-t border-slate-800 px-4 py-2">
            <table className="num w-full text-[11px]">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-3">{t.inspector.thRank}</th>
                  <th className="py-1 pr-3">{t.inspector.thParty}</th>
                  <th className="py-1 pr-3">V/m</th>
                  <th className="py-1">{t.inspector.thSeat}</th>
                </tr>
              </thead>
              <tbody>
                {district.quotients.slice(0, district.seats + 12).map((q, i) => (
                  <tr key={i} className={cn("border-t border-slate-800/50", q.won ? "text-slate-200" : "text-slate-500")}>
                    <td className="py-0.5 pr-3 text-slate-500">{i + 1}</td>
                    <td className="py-0.5 pr-3" style={{ color: PARTIES[q.party].color }}>
                      {PARTIES[q.party].short}/{q.divisor}
                    </td>
                    <td className="py-0.5 pr-3">{q.value.toFixed(4)}</td>
                    <td className="py-0.5">{q.won ? "✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
