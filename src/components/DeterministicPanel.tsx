import { Fragment } from "react";
import { KONF_FACTIONS, PARTIES, SPECTRUM_ORDER } from "@/data/parties";
import type { DeterministicResult } from "@/engine/types";
import { useT } from "@/lib/i18n";
import type { KonfSplit } from "@/lib/konfSplit";
import { cn, fmtPct, fmtSigned } from "@/lib/utils";
import { Badge } from "./ui/primitives";

export function DeterministicPanel({
  det,
  konfSplit,
}: {
  det: DeterministicResult;
  konfSplit?: KonfSplit | null;
}) {
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
              const factionRows =
                p === "KONF" && konfSplit && s > 0
                  ? (["NN", "RN"] as const).map((f) => (
                      <tr key={`KONF-${f}`} className="border-b border-slate-800/50 bg-slate-900/40">
                        <td className="px-3 py-1 pl-7">
                          <span
                            className="mr-2 inline-block h-2 w-2 rounded-sm"
                            style={{ background: KONF_FACTIONS[f].color }}
                          />
                          <span className="text-[12px] text-slate-400">↳ {KONF_FACTIONS[f].name}</span>
                        </td>
                        <td className="px-3 py-1 text-right text-[11px] text-slate-600">—</td>
                        <td className="px-3 py-1 text-center">
                          <Badge variant="outline">{t.konf.faction}</Badge>
                        </td>
                        <td className="num px-3 py-1 text-right text-sm font-bold text-slate-200">
                          {konfSplit[f.toLowerCase() as "nn" | "rn"]}
                        </td>
                        <td className="px-3 py-1 text-right text-[11px] text-slate-600">—</td>
                        <td className="px-3 py-1 text-right text-[11px] text-slate-600">—</td>
                        <td className="px-3 py-1">
                          <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(konfSplit[f.toLowerCase() as "nn" | "rn"] / 460) * 100}%`,
                                background: KONF_FACTIONS[f].color,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  : null;
              return (
                <Fragment key={p}>
                <tr className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20">
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
                {factionRows}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[10px] text-slate-600">{t.detPanel.footnote}</div>
    </div>
  );
}
