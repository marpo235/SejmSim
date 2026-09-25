import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PARTIES, SPECTRUM_ORDER } from "@/data/parties";
import type { MonteCarloResult } from "@/engine/types";
import { fmtPct } from "@/lib/utils";

const CHART_PROPS = {
  barCategoryGap: "15%" as const,
  margin: { top: 4, right: 4, bottom: 4, left: -18 },
};

function HistTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] num">
      {d.seat} seats: <b>{fmtPct(d.share, 1)}</b>
    </div>
  );
}

function PartyHistogram({ result, party }: { result: MonteCarloResult; party: (typeof SPECTRUM_ORDER)[number] }) {
  const dist = result.distributions.find((d) => d.party === party)!;
  const data = useMemo(() => {
    const arr: { seat: number; share: number }[] = [];
    const h = dist.histogram;
    const lo = Math.max(0, dist.p10 - 6);
    const hi = Math.min(460, dist.p90 + 6);
    for (let i = lo; i <= hi; i++) arr.push({ seat: i, share: h[i] });
    return arr;
  }, [dist]);
  const color = PARTIES[party].color;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2">
      <div className="mb-0.5 flex items-baseline justify-between">
        <span className="text-[11px] font-mono font-bold" style={{ color }}>
          {PARTIES[party].short}
        </span>
        <span className="num text-[10px] text-slate-400">
          P<sub>10</sub> {dist.p10} · <b className="text-slate-100">P₅₀ {dist.p50}</b> · P
          <sub>90</sub> {dist.p90}
        </span>
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} {...CHART_PROPS}>
            <XAxis dataKey="seat" hide />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip content={<HistTooltip />} cursor={{ fill: "#ffffff10" }} />
            <Bar dataKey="share" isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={color}
                  opacity={d.seat >= dist.p10 && d.seat <= dist.p90 ? 0.95 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonteCarloPanel({ mc }: { mc: MonteCarloResult }) {
  const mortality = useMemo(
    () =>
      mc.distributions.map((d) => ({
        party: PARTIES[d.party].short,
        p0: d.pZeroSeats * 100,
        pthr: d.pBelowThreshold * 100,
        color: PARTIES[d.party].color,
      })),
    [mc]
  );
  const coalData = useMemo(() => {
    const arr = mc.coalitions.map((c) => ({
      name: c.name,
      p: +(c.pMajority * 100).toFixed(1),
      p276: +(c.pConstitutional * 100).toFixed(1),
      med: c.medianSeats,
    }));
    if (mc.customCoalition)
      arr.push({
        name: "Custom",
        p: +(mc.customCoalition.pMajority * 100).toFixed(1),
        p276: +(mc.customCoalition.pConstitutional * 100).toFixed(1),
        med: mc.customCoalition.medianSeats,
      });
    return arr;
  }, [mc]);

  return (
    <div className="space-y-4">
      <div className="num text-[11px] text-slate-500">
        {mc.iterations.toLocaleString()} iterations · {mc.elapsedMs.toFixed(0)} ms in-worker ·
        logit-normal sampler σ + 41-district D'Hondt
      </div>

      {/* seat distributions */}
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Seat distributions (P<sub>10</sub> / P<sub>50</sub> / P<sub>90</sub>)
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {SPECTRUM_ORDER.map((p) => (
            <PartyHistogram key={p} result={mc} party={p} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* threshold mortality */}
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Threshold mortality risk
          </h3>
          <div className="h-56 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mortality} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="party"
                  tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  cursor={{ fill: "#ffffff10" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: "JetBrains Mono",
                  }}
                  formatter={(v: any, name: any) => [
                    `${Number(v).toFixed(1)}%`,
                    name === "p0" ? "P(S=0)" : "P(C<threshold)",
                  ]}
                />
                <Bar dataKey="p0" name="p0" fill="#e30613" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="pthr" name="pthr" fill="#f59e0b" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex gap-4 text-[10px] text-slate-500">
            <span>
              <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#e30613" }} />
              P(Sₖ = 0) — zero seats
            </span>
            <span>
              <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#f59e0b" }} />
              P(Cₖ &lt; threshold) — national gate
            </span>
          </div>
        </div>

        {/* coalition probabilities */}
        <div>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Coalition majority probabilities P(C ≥ 231)
          </h3>
          <div className="h-56 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coalData} layout="vertical" margin={{ top: 4, right: 30, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff10" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: "JetBrains Mono",
                  }}
                  formatter={(v: any, name: any, item: any) => [
                    `${v}% (median ${item.payload.med})`,
                    name === "p" ? "P(≥231)" : "P(≥276)",
                  ]}
                />
                <Bar dataKey="p" name="p" fill="#4a90e2" radius={[0, 2, 2, 0]} isAnimationActive={false} />
                <Bar dataKey="p276" name="p276" fill="#2e9e4f" radius={[0, 2, 2, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex gap-4 text-[10px] text-slate-500">
            <span>
              <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#4a90e2" }} />
              P(≥231) governing
            </span>
            <span>
              <i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: "#2e9e4f" }} />
              P(≥276) constitutional
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
