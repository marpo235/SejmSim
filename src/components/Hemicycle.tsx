import { useMemo } from "react";
import {
  KONF_FACTIONS,
  PARTIES,
  SPECTRUM_ORDER,
  type CoalitionMember,
  type KonfFaction,
  type PartyId,
} from "@/data/parties";

export const HEMICYCLE_ID = "sejmsim-hemicycle";

interface SeatPos {
  x: number;
  y: number;
  row: number;
  idxInRow: number;
}

/** Classic parliament-arc layout: seats on concentric arcs, capacity ∝ radius. */
function layout(total: number, rows: number): SeatPos[] {
  const rInner = 0.34;
  const radii: number[] = [];
  for (let i = 0; i < rows; i++) radii.push(rInner + ((1 - rInner) * i) / (rows - 1));
  const arcLen = radii.map((r) => Math.PI * r);
  const totalArc = arcLen.reduce((a, b) => a + b, 0);
  const counts = arcLen.map((a) => (a / totalArc) * total);
  const rounded = counts.map(Math.floor);
  let rem = total - rounded.reduce((a, b) => a + b, 0);
  const fracOrder = counts
    .map((c, i) => ({ i, f: c - Math.floor(c) }))
    .sort((a, b) => b.f - a.f);
  let k = 0;
  while (rem > 0) {
    rounded[fracOrder[k % fracOrder.length].i]++;
    rem--;
    k++;
  }
  const seats: SeatPos[] = [];
  for (let i = 0; i < rows; i++) {
    const n = rounded[i];
    for (let j = 0; j < n; j++) {
      const theta = Math.PI * (1 - (j + 0.5) / n); // π (left) → 0 (right)
      seats.push({ x: radii[i] * Math.cos(theta), y: radii[i] * Math.sin(theta), row: i, idxInRow: j });
    }
  }
  return seats;
}

interface Props {
  seats: Record<PartyId, number>;
  highlighted?: CoalitionMember[] | null;
  /** When set, the KONF seat block is painted as NN (first nn seats) + RN. */
  konfSplit?: { nn: number; rn: number } | null;
  width?: number;
}

export function Hemicycle({ seats, highlighted, konfSplit, width = 560 }: Props) {
  const rows = 9;
  const height = width * 0.52;
  const positions = useMemo(() => layout(460, rows), []);
  const seatR = useMemo(() => Math.max(2.6, width * 0.0068), [width]);

  // seat → fill color (KONF block splits into NN/RN when konfSplit is set)
  const seatFills = useMemo(() => {
    const out: (string | null)[] = new Array(460).fill(null);
    let idx = 0;
    for (const p of SPECTRUM_ORDER) {
      const n = seats[p] ?? 0;
      for (let s = 0; s < n; s++) {
        if (idx >= 460) break;
        out[idx++] =
          p === "KONF" && konfSplit
            ? s < konfSplit.nn
              ? KONF_FACTIONS.NN.color
              : KONF_FACTIONS.RN.color
            : PARTIES[p].color;
      }
    }
    return out;
  }, [seats, konfSplit]);

  // majority boundary ticks: order all seats by angle, mark between seat #b and #b+1
  const markers = useMemo(() => {
    const byAngle = positions
      .map((p) => Math.atan2(p.y, p.x))
      .sort((a, b) => b - a);
    const ticks: { x1: number; y1: number; x2: number; y2: number; label: string; lx: number; ly: number }[] = [];
    for (const bound of [231, 276]) {
      const t = (byAngle[bound - 1] + byAngle[bound]) / 2;
      const r1 = 1.02;
      const r2 = 1.14;
      ticks.push({
        x1: r1 * Math.cos(t),
        y1: r1 * Math.sin(t),
        x2: r2 * Math.cos(t),
        y2: r2 * Math.sin(t),
        label: String(bound),
        lx: r2 * Math.cos(t),
        ly: r2 * Math.sin(t),
      });
    }
    return ticks;
  }, [positions]);

  // seat → selected flag: parties match by id; with the split on, each KONF
  // seat is selected only when its own faction (NN/RN) is in the coalition
  const seatSelected = useMemo(() => {
    const out = new Array<boolean>(460).fill(true);
    if (!highlighted || highlighted.length === 0) return out;
    let idx = 0;
    for (const p of SPECTRUM_ORDER) {
      const n = seats[p] ?? 0;
      for (let s = 0; s < n; s++) {
        if (idx >= 460) break;
        let sel = highlighted.includes(p as CoalitionMember);
        if (!sel && p === "KONF" && konfSplit) {
          const f: KonfFaction = s < konfSplit.nn ? "NN" : "RN";
          sel = highlighted.includes(f);
        }
        out[idx++] = sel;
      }
    }
    for (; idx < 460; idx++) out[idx] = false;
    return out;
  }, [seats, highlighted, konfSplit]);

  const dim = (i: number) =>
    highlighted && highlighted.length > 0 && !seatSelected[i];

  return (
    <svg
      id={HEMICYCLE_ID}
      viewBox="-1.22 -1.06 2.44 1.24"
      width={width}
      height={height}
      style={{ overflow: "visible" }}
      role="img"
      aria-label="Sejm hemicycle"
    >
      <g transform="scale(1,-1)">
        {positions.map((pos, i) => (
          <circle
            key={i}
            cx={pos.x}
            cy={pos.y}
            r={0.0155}
            fill={seatFills[i] ?? "#1e293b"}
            opacity={dim(i) ? 0.18 : 1}
          />
        ))}
        {markers.map((m, i) => (
          <g key={i}>
            <line
              x1={m.x1}
              y1={m.y1}
              x2={m.x2}
              y2={m.y2}
              stroke="#94a3b8"
              strokeWidth={0.008}
              strokeDasharray="0.02 0.012"
            />
            <text
              x={m.lx}
              y={m.ly}
              transform="scale(1,-1)"
              fontSize={0.055}
              fill="#94a3b8"
              textAnchor={m.lx < 0 ? "end" : "start"}
              style={{ fontFamily: "JetBrains Mono, monospace" }}
            >
              {m.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
