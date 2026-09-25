import { useMemo, useState } from "react";
import mapJson from "@/data/map.json";
import { PARTIES, type PartyId } from "@/data/parties";
import type { DistrictResult } from "@/engine/types";
import { cn } from "@/lib/utils";

export const MAP_ID = "sejmsim-map";

const PATHS = mapJson as unknown as Record<string, string[]>;

interface Props {
  districts: DistrictResult[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}

export function PolandMap({ districts, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const winner = useMemo(() => {
    const w = new Map<number, PartyId | null>();
    for (const d of districts) {
      let best: PartyId | null = null;
      let bs = 0;
      let bq = -1;
      for (const v of d.votes) {
        if (v.seats > bs || (v.seats === bs && v.seats > 0 && v.qualified > bq)) {
          best = v.party;
          bs = v.seats;
          bq = v.qualified;
        }
      }
      w.set(d.id, best);
    }
    return w;
  }, [districts]);

  const hoveredDistrict = districts.find((d) => d.id === hovered);

  return (
    <div className="relative">
      <svg
        id={MAP_ID}
        viewBox="0 0 1000 1000"
        className="w-full h-auto"
        role="img"
        aria-label="Map of Poland's 41 electoral districts"
      >
        {Object.entries(PATHS).map(([idStr, paths]) => {
          const id = Number(idStr);
          const w = winner.get(id);
          const isSel = selected === id;
          const isHov = hovered === id;
          return (
            <g key={id}>
              {paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={w ? PARTIES[w].color : "#1e293b"}
                  fillOpacity={isSel ? 1 : isHov ? 0.95 : 0.78}
                  stroke={isSel ? "#f8fafc" : isHov ? "#cbd5e1" : "#0f172a"}
                  strokeWidth={isSel ? 3 : 1.5}
                  className="cursor-pointer transition-all duration-100"
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onSelect(isSel ? null : id)}
                />
              ))}
            </g>
          );
        })}
      </svg>
      {hoveredDistrict && (
        <div className="pointer-events-none absolute top-2 left-2 rounded-md border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs shadow-lg">
          <div className="font-semibold text-slate-100">
            Okręg {hoveredDistrict.id} — {hoveredDistrict.name}
          </div>
          <div className="num text-slate-400">
            {hoveredDistrict.seats} seats · winner:{" "}
            {winner.get(hoveredDistrict.id)
              ? PARTIES[winner.get(hoveredDistrict.id)!].name
              : "—"}
          </div>
        </div>
      )}
    </div>
  );
}
