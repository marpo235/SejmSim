import { PARTIES, SPECTRUM_ORDER } from "@/data/parties";
import type { DeterministicResult } from "@/engine/types";
import { useT } from "@/lib/i18n";
import { cn, fmtPct, fmtSigned } from "@/lib/utils";
import { Badge } from "./ui/primitives";

export function DeterministicPanel({ det }: { det: DeterministicResult }) {
  const t = useT();
  const totalSeats = SPECTRUM_ORDER.reduce((a, p) => a + det.seats[p], 0);
  const gatedNames = det.gatedNationally.map((p) => PARTIES[p].short).join(", ");
  return (
    <div>
      <div className="num mb-2 text-[11px] text-slate-500">
        {t.detPanel
          .subtitle(det.gatedNationally.length > 0 ? t.detPanel.gated(gatedNames) : "")
          .replace("{SEATS}", String(totalSeats))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">{t.detPanel.thCommittee}</th>
              <th className="px-3 py-2 text-right">{t.detPanel.thShare}</th>
              <th className="px-3 py-2 text-center">{t.detPanel.thGate}</th>
              <th className="px-3 py-2 text-right">{t.detPanel.thSeats}</th>
              <th className="px-3 py-2 text-right">{t.detPanel.thDry}</th>
              <th className="px-3 py-2 text-right">{t.detPanel.thDelta}</th>
              <th className="px-3 py-2 w-1/3">{t.detPanel.thBar}</th>
            </tr>
          </thead>
          <tbody>
            {SPECTRUM_ORDER.map((p) => {
              const s = det.seats[p];
              const dry = det.dryNationalSeats[p];
              const gated = det.gatedNationally.includes(p);
              const delta = s - dry;
              return (
                <tr key={p} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20">
                  <td className="px-3 py-1.5">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PARTIES[p].color }} />
                    <span className="font-medium text-slate-200">{PARTIES[p].name}</span>
                    <span className="num ml-1.5 text-[10px] text-slate-500">{PARTIES[p].short}</span>
                  </td>
                  <td className="num px-3 py-1.5 text-right text-slate-300">
                    {fmtPct(det.nationalShares[p], 1)}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {gated ? (
                      <Badge variant="danger">{t.detPanel.outSejm}</Badge>
                    ) : (
                      <Badge variant="ok">{t.detPanel.inSejm}</Badge>
                    )}
                  </td>
                  <td className={cn("num px-3 py-1.5 text-right text-base font-bold", s > 0 ? "text-slate-50" : "text-slate-600")}>
                    {s}
                  </td>
                  <td className="num px-3 py-1.5 text-right text-slate-400">{dry}</td>
                  <td
                    className={cn(
                      "num px-3 py-1.5 text-right font-semibold",
                      delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-slate-600"
                    )}
                  >
                    {fmtSigned(delta)}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="h-2.5 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s / 460) * 100}%`,
                          background: PARTIES[p].color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[10px] text-slate-600">{t.detPanel.footnote}</div>
    </div>
  );
}
