import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PRESETS, type PartyId, type Scenario } from "@/data/parties";
import { applyShares } from "@/lib/scenario";
import { decodeState, encodeState, type AppState } from "@/lib/urlState";
import { deterministic, runMonteCarloAsync, type McHandle } from "@/engine/client";
import type { DeterministicResult, MonteCarloResult } from "@/engine/types";
import { CoalitionBuilder } from "@/components/CoalitionBuilder";
import { DeterministicPanel } from "@/components/DeterministicPanel";
import { DistrictInspector } from "@/components/DistrictInspector";
import { Hemicycle } from "@/components/Hemicycle";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { PolandMap } from "@/components/PolandMap";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { Loader2 } from "lucide-react";

function initialState(): AppState {
  try {
    return decodeState(window.location.search);
  } catch {
    return decodeState("");
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [mc, setMc] = useState<MonteCarloResult | null>(null);
  const [mcProgress, setMcProgress] = useState<{ done: number; total: number } | null>(null);
  const mcHandle = useRef<McHandle | null>(null);

  const { scenario, coalition, district, tab } = state;

  // deterministic pass — instant, on every change
  const det: DeterministicResult = useMemo(() => deterministic(scenario), [scenario]);

  // Monte Carlo — debounced, cancellable, off-thread
  useEffect(() => {
    setMcProgress({ done: 0, total: scenario.iterations });
    const t = setTimeout(() => {
      mcHandle.current?.cancel();
      const handle = runMonteCarloAsync(scenario, coalition, (done, total) =>
        setMcProgress({ done, total })
      );
      mcHandle.current = handle;
      handle.promise
        .then((r) => {
          setMc(r);
          setMcProgress(null);
        })
        .catch(() => setMcProgress(null));
    }, 350);
    return () => clearTimeout(t);
  }, [scenario, coalition]);

  useEffect(() => () => mcHandle.current?.cancel(), []);

  // URL state sync
  useEffect(() => {
    const t = setTimeout(() => {
      const q = encodeState({ scenario, coalition, district, tab });
      const url = q ? `${location.pathname}${q}` : location.pathname;
      window.history.replaceState(null, "", url);
    }, 150);
    return () => clearTimeout(t);
  }, [scenario, coalition, district, tab]);

  const patch = useCallback(
    (p: Partial<AppState>) => setState((s) => ({ ...s, ...p })),
    []
  );
  const onScenario = useCallback((s: Scenario) => patch({ scenario: s }), [patch]);
  const onPreset = useCallback(
    (name: string) => {
      const pr = PRESETS.find((x) => x.name === name);
      if (pr) patch({ scenario: applyShares(state.scenario, pr.shares) });
    },
    [patch, state.scenario]
  );
  const onToggleCoalition = useCallback(
    (p: PartyId) =>
      patch({
        coalition: coalition.includes(p)
          ? coalition.filter((x) => x !== p)
          : [...coalition, p],
      }),
    [patch, coalition]
  );

  const selectedDistrict = det.districts.find((d) => d.id === district) ?? null;
  const coalitionSeats = coalition.reduce((a, p) => a + det.seats[p], 0);
  const running = mcProgress != null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <TopBar onPreset={onPreset} det={det} />

      {/* progress hairline */}
      <div className="h-0.5 w-full bg-transparent">
        {running && (
          <div
            className="h-full bg-amber-500 transition-all duration-200"
            style={{ width: `${(mcProgress!.done / mcProgress!.total) * 100}%` }}
          />
        )}
      </div>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-3 p-3 xl:grid-cols-[300px_minmax(0,1fr)_400px]">
        {/* left: controls */}
        <Sidebar scenario={scenario} onChange={onScenario} onPreset={onPreset} />

        {/* center: hemicycle + coalition + tabs */}
        <div className="min-w-0 space-y-3">
          <section className="relative rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Sejm — 460 seats
              </h2>
              <span className="num flex items-center gap-1.5 text-[11px] text-slate-500">
                {running && (
                  <>
                    <Loader2 size={11} className="animate-spin text-amber-500" />
                    sampling {mcProgress!.done.toLocaleString()}/
                    {mcProgress!.total.toLocaleString()}
                  </>
                )}
                {!running && mc && (
                  <>{mc.iterations.toLocaleString()} MC runs · {mc.elapsedMs.toFixed(0)} ms</>
                )}
              </span>
            </div>
            <div className="relative mt-1 flex justify-center">
              <Hemicycle
                seats={det.seats}
                highlighted={coalition.length ? coalition : null}
                width={620}
              />
              {/* center overlay */}
              <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                {coalition.length > 0 ? (
                  <>
                    <div className="num text-3xl font-bold text-slate-50">{coalitionSeats}</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">
                      coalition of {coalition.length} ·{" "}
                      {coalitionSeats >= 276
                        ? "constitutional"
                        : coalitionSeats >= 231
                          ? "majority"
                          : "minority"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="num text-xl font-bold text-slate-300">
                      {Object.entries(det.seats).sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">
                      largest committee
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <CoalitionBuilder
            seats={det.seats}
            selected={coalition}
            onToggle={onToggleCoalition}
            mc={mc}
          />

          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <Tabs value={tab} onValueChange={(v) => patch({ tab: v as "det" | "mc" })}>
              <TabsList>
                <TabsTrigger value="det">Deterministic district allocation</TabsTrigger>
                <TabsTrigger value="mc">Monte Carlo probabilities</TabsTrigger>
              </TabsList>
              <TabsContent value="det" className="mt-3">
                <DeterministicPanel det={det} />
              </TabsContent>
              <TabsContent value="mc" className="mt-3">
                {mc ? (
                  <MonteCarloPanel mc={mc} />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                    <Loader2 size={15} className="mr-2 animate-spin" />
                    running simulation…
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>

        {/* right: map + inspector */}
        <div className="min-w-0 space-y-3">
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              41 electoral districts
            </h2>
            <PolandMap
              districts={det.districts}
              selected={district}
              onSelect={(id) => patch({ district: id })}
            />
          </section>
          <DistrictInspector
            district={selectedDistrict}
            onClose={() => patch({ district: null })}
          />
        </div>
      </main>

      <footer className="mx-auto max-w-[1600px] px-3 pb-6 pt-2 text-[10px] leading-relaxed text-slate-600">
        SejmSim 2027 — exploratory projection tool, not a forecast. District magnitudes, 2023 Sejm
        and 2025 presidential results: official PKW data. Map geometry adapted from MIT-licensed
        work (github.com/Dyzio18/2023wybory.pl). Computed locally in your browser.
      </footer>
    </div>
  );
}
