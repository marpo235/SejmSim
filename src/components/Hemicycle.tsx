import { useMemo } from "react";
import { PARTIES, SPECTRUM_ORDER, type PartyId } from "@/data/parties";

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
  highlighted?: PartyId[] | null;
  width?: number;
}

export function Hemicycle({ seats, highlighted, width = 560 }: Props) {
  const rows = 9;
  const height = width * 0.52;
  const positions = useMemo(() => layout(460, rows), []);
  const seatR = useMemo(() => Math.max(2.6, width * 0.0068), [width]);

  // seat → party assignment in spectrum order, left→right
  const seatParties: (PartyId | null)[] = useMemo(() => {
    const out: (PartyId | null)[] = new Array(460).fill(null);
    let idx = 0;
    for (const p of SPECTRUM_ORDER) {
      for (let s = 0; s < (seats[p] ?? 0); s++) if (idx < 460) out[idx++] = p;
    }
    return out;
  }, [seats]);

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

  const dim = (p: PartyId | null) =>
    highlighted && highlighted.length > 0 && (!p || !highlighted.includes(p));

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
        {positions.map((pos, i) => {
          const p = seatParties[i];
          return (
            <circle
              key={i}
              cx={pos.x}
              cy={pos.y}
              r={0.0155}
              fill={p ? PARTIES[p].color : "#1e293b"}
              opacity={dim(p) ? 0.18 : 1}
            />
          );
        })}
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
