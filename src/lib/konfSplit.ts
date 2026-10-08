import { konfSlotSeq, type KonfFaction } from "@/data/parties";
import type { DistrictResult } from "@/engine/types";

export interface KonfSplit {
  nn: number;
  rn: number;
  /** faction seat counts keyed by district id */
  perDistrict: Record<number, { nn: number; rn: number }>;
}

/**
 * Distribute each district's Konfederacja seats across the faction slot
 * sequence (seat i → seq[i mod 4]). Pure post-processing — the engine still
 * allocates KONF seats via district D'Hondt.
 */
export function splitKonfederacja(districts: DistrictResult[]): KonfSplit {
  const out: KonfSplit = { nn: 0, rn: 0, perDistrict: {} };
  for (const d of districts) {
    const s = d.votes.find((v) => v.party === "KONF")?.seats ?? 0;
    const seq = konfSlotSeq(d.id);
    let nn = 0;
    let rn = 0;
    for (let i = 0; i < s; i++) {
      const f: KonfFaction = seq[i % seq.length];
      if (f === "NN") nn++;
      else rn++;
    }
    out.perDistrict[d.id] = { nn, rn };
    out.nn += nn;
    out.rn += rn;
  }
  return out;
}
