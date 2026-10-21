import { KONF_NN_WEIGHT, type CoalitionMember, type PartyId } from "@/data/parties";
import type { DistrictResult } from "@/engine/types";

export interface KonfSplit {
  nn: number;
  rn: number;
  /** faction seat counts keyed by district id */
  perDistrict: Record<number, { nn: number; rn: number }>;
}

/**
 * Distribute Konfederacja's seats between NN and RN as ≈ 55/45 for NN —
 * largest-remainder apportionment across districts so the national split
 * always reflects NN being the slightly larger faction. Pure
 * post-processing — the engine still allocates KONF seats via district
 * D'Hondt.
 */
export function splitKonfederacja(districts: DistrictResult[]): KonfSplit {
  const out: KonfSplit = { nn: 0, rn: 0, perDistrict: {} };
  const units: { id: number; seats: number; base: number; rem: number }[] = [];
  let total = 0;
  let baseSum = 0;
  for (const d of districts) {
    const s = d.votes.find((v) => v.party === "KONF")?.seats ?? 0;
    if (s === 0) continue;
    const exact = s * KONF_NN_WEIGHT;
    const base = Math.floor(exact);
    units.push({ id: d.id, seats: s, base, rem: exact - base });
    total += s;
    baseSum += base;
  }
  // hand the remaining NN seats to the districts with the largest remainders
  let leftover = Math.round(total * KONF_NN_WEIGHT) - baseSum;
  units.sort((a, b) => b.rem - a.rem || b.seats - a.seats || a.id - b.id);
  for (const u of units) {
    if (leftover <= 0) break;
    u.base += 1;
    leftover -= 1;
  }
  for (const u of units) {
    out.perDistrict[u.id] = { nn: u.base, rn: u.seats - u.base };
    out.nn += u.base;
    out.rn += u.seats - u.base;
  }
  return out;
}

/**
 * Seat count of a coalition-builder member: real committees read the
 * D'Hondt result; NN/RN factions read the deterministic Konfederacja split
 * (0 when the split toggle is off).
 */
export function memberSeats(
  m: CoalitionMember,
  seats: Record<PartyId, number>,
  split: Pick<KonfSplit, "nn" | "rn"> | null | undefined
): number {
  if (m === "NN") return split?.nn ?? 0;
  if (m === "RN") return split?.rn ?? 0;
  return seats[m] ?? 0;
}

/**
 * Translate a UI coalition (which may contain NN/RN factions) into the
 * committee-level list the MC engine can evaluate. Both factions selected
 * together ≈ the whole Konfederacja committee; a lone faction can't be
 * evaluated (the engine doesn't split KONF seats) and is dropped.
 */
export function engineCoalitionOf(members: CoalitionMember[]): PartyId[] {
  const both = members.includes("NN") && members.includes("RN");
  const out = new Set<PartyId>();
  for (const m of members) {
    if (m === "NN" || m === "RN") {
      if (both) out.add("KONF");
    } else {
      out.add(m);
    }
  }
  return [...out];
}
