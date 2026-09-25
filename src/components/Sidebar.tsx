import { PARTIES, PARTY_IDS, PRESETS, type PartyId, type Scenario } from "@/data/parties";
import { isAboveThreshold, otherShare, setShare, thresholdOf } from "@/lib/scenario";
import { cn } from "@/lib/utils";
import {
  Badge,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Slider,
  Switch,
} from "./ui/primitives";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

interface Props {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
  onPreset: (name: string) => void;
}

export function Sidebar({ scenario, onChange, onPreset }: Props) {
  const other = otherShare(scenario);
  return (
    <aside className="space-y-4">
      {/* national polling sliders */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            National polling
          </h2>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
            <Switch
              checked={scenario.autoNormalize}
              onCheckedChange={(v) => onChange({ ...scenario, autoNormalize: v })}
            />
            auto-normalize
          </label>
        </div>
        <div className="space-y-2.5">
          {PARTY_IDS.map((p) => (
            <PartySlider key={p} party={p} scenario={scenario} onChange={onChange} />
          ))}
          {/* residual others */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/70">
            <span className="w-8 text-[11px] font-mono font-semibold text-slate-500">oth.</span>
            <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-slate-600" style={{ width: `${other}%` }} />
            </div>
            <span className="num w-12 text-right text-xs text-slate-500">
              {other.toFixed(1)}%
            </span>
            <span className="w-14" />
          </div>
        </div>
      </section>

      {/* presets */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Scenario presets
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((pr) => (
            <button
              key={pr.name}
              onClick={() => onPreset(pr.name)}
              title={pr.description}
              className="rounded-md border border-slate-700/80 bg-slate-800/60 px-2 py-1.5 text-left text-[11px] font-medium text-slate-200 transition-colors hover:border-amber-500/50 hover:bg-slate-800 cursor-pointer"
            >
              {pr.name}
            </button>
          ))}
        </div>
      </section>

      {/* advanced engine config */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <Collapsible>
          <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-200">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal size={13} />
              Engine configuration
            </span>
            <ChevronDown size={14} className="transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 border-t border-slate-800 px-3 py-3">
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>
                    2025 shape weight w<sub>25</sub>
                  </span>
                  <span className="num text-slate-200">{scenario.w25.toFixed(2)}</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[scenario.w25]}
                  onValueChange={([v]) => onChange({ ...scenario, w25: v })}
                />
                <div className="mt-0.5 flex justify-between text-[9px] text-slate-600">
                  <span>2023 Sejm only</span>
                  <span>2025 Pres. only</span>
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>Poll volatility σ (logit)</span>
                  <span className="num text-slate-200">{scenario.sigma.toFixed(2)}</span>
                </div>
                <Slider
                  min={0.02}
                  max={0.25}
                  step={0.01}
                  value={[scenario.sigma]}
                  onValueChange={([v]) => onChange({ ...scenario, sigma: v })}
                />
              </div>
              <div>
                <div className="mb-1.5 text-[11px] text-slate-400">
                  Committee dispersion α<sub>k</sub>
                </div>
                <div className="space-y-1.5">
                  {PARTY_IDS.map((p) => (
                    <div key={p} className="flex items-center gap-2">
                      <span className="w-10 text-[10px] font-mono" style={{ color: PARTIES[p].color }}>
                        {PARTIES[p].short}
                      </span>
                      <Slider
                        min={0}
                        max={1.5}
                        step={0.05}
                        value={[scenario.alpha[p]]}
                        onValueChange={([v]) =>
                          onChange({
                            ...scenario,
                            alpha: { ...scenario.alpha, [p]: v },
                          })
                        }
                        trackColor={PARTIES[p].color}
                        className="flex-1"
                      />
                      <span className="num w-8 text-right text-[10px] text-slate-400">
                        {scenario.alpha[p].toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 text-[9px] text-slate-600">
                  α=0 flattens the party's geographic shape; α&gt;1 sharpens it.
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-[11px] text-slate-400">Committee type (8% coalition gate)</div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                  {PARTY_IDS.map((p) => (
                    <label key={p} className="flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                      <Checkbox
                        checked={scenario.coalitionFlag[p]}
                        onCheckedChange={(v) =>
                          onChange({
                            ...scenario,
                            coalitionFlag: { ...scenario.coalitionFlag, [p]: !!v },
                          })
                        }
                      />
                      {PARTIES[p].short}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>MC iterations</span>
                  <span className="num text-slate-200">{scenario.iterations.toLocaleString()}</span>
                </div>
                <Slider
                  min={1000}
                  max={50000}
                  step={1000}
                  value={[scenario.iterations]}
                  onValueChange={([v]) => onChange({ ...scenario, iterations: v })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>
    </aside>
  );
}

function PartySlider({
  party,
  scenario,
  onChange,
}: {
  party: PartyId;
  scenario: Scenario;
  onChange: (s: Scenario) => void;
}) {
  const def = PARTIES[party];
  const val = scenario.shares[party];
  const thr = thresholdOf(scenario, party);
  const above = isAboveThreshold(scenario, party);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 shrink-0 text-[11px] font-mono font-bold" style={{ color: def.color }}>
        {def.short}
      </span>
      <Slider
        min={0}
        max={55}
        step={0.1}
        value={[val]}
        onValueChange={([v]) => onChange(setShare(scenario, party, v))}
        trackColor={def.color}
        className="flex-1"
      />
      <input
        type="number"
        min={0}
        max={100}
        step={0.1}
        value={val}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (Number.isFinite(n)) onChange(setShare(scenario, party, n));
        }}
        className="num w-12 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-right text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
      />
      <Badge variant={above ? "ok" : "danger"} className="w-14 justify-center">
        {above ? `≥${thr}%` : `<${thr}%`}
      </Badge>
    </div>
  );
}
