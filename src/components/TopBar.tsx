import { useState } from "react";
import { PRESETS } from "@/data/parties";
import type { DeterministicResult } from "@/engine/types";
import { exportCsv, exportSvgAsPng } from "@/lib/exporters";
import { HEMICYCLE_ID } from "./Hemicycle";
import { MAP_ID } from "./PolandMap";
import { MethodologyModal } from "./MethodologyModal";
import { Button } from "./ui/primitives";
import { BookOpenText, Check, ChevronDown, Download, Share2 } from "lucide-react";

interface Props {
  onPreset: (name: string) => void;
  det: DeterministicResult | null;
}

export function TopBar({ onPreset, det }: Props) {
  const [methodOpen, setMethodOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2">
        <div className="mr-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 font-mono text-sm font-black text-slate-950">
            S
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-slate-50">
              SejmSim <span className="text-amber-500">2027</span>
              <span className="num ml-2 hidden text-[10px] font-normal text-slate-500 sm:inline">
                // 41-District Projection Engine
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              probabilistic 460-seat allocation · fully client-side
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onPreset(e.target.value);
              e.target.value = "";
            }}
            className="h-8 cursor-pointer rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
            aria-label="Scenario presets"
          >
            <option value="" disabled>
              Presets…
            </option>
            {PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          <details className="group relative">
            <summary className="flex h-8 cursor-pointer list-none items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2.5 text-xs text-slate-200 hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
              <Download size={13} />
              Export
              <ChevronDown size={11} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-md border border-slate-700 bg-slate-900 shadow-xl">
              <button
                className="block w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                onClick={() => exportSvgAsPng(HEMICYCLE_ID, "sejmsim-hemicycle.png")}
              >
                Hemicycle PNG
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                onClick={() => exportSvgAsPng(MAP_ID, "sejmsim-map.png")}
              >
                District map PNG
              </button>
              <button
                className="block w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                onClick={() => det && exportCsv(det, "sejmsim-results.csv")}
              >
                Results CSV
              </button>
            </div>
          </details>

          <Button variant="outline" size="sm" onClick={share} className="h-8">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
            {copied ? "Copied!" : "Share URL"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMethodOpen(true)} className="h-8">
            <BookOpenText size={13} />
            Methodology
          </Button>
        </div>
      </div>
      <MethodologyModal open={methodOpen} onOpenChange={setMethodOpen} />
    </header>
  );
}
