import { KONF_JEDYNKI, type CoalitionMember, type PartyId } from "@/data/parties";
import type { DistrictResult } from "@/engine/types";

export interface KonfSplit {
  nn: number;
  rn: number;
  /** faction seat counts keyed by district id */
  perDistrict: Record<number, { nn: number; rn: number }>;
}

/**
 * Distribute each district's Konfederacja seats between the factions using
 * the historical 2023 list leaders (KONF_JEDYNKI): the faction holding the
 * "jedynka" in a district takes ceil(s/2) seats, the other floor(s/2).
 * Pure post-processing — the engine still allocates KONF seats via
 * district D'Hondt.
 */
export function splitKonfederacja(districts: DistrictResult[]): KonfSplit {
  const out: KonfSplit = { nn: 0, rn: 0, perDistrict: {} };
  for (const d of districts) {
    const s = d.votes.find((v) => v.party === "KONF")?.seats ?? 0;
    const lead = KONF_JEDYNKI[d.id - 1];
    const major = Math.ceil(s / 2);
    const nn = lead === "NN" ? major : s - major;
    const rn = s - nn;
    out.perDistrict[d.id] = { nn, rn };
    out.nn += nn;
    out.rn += rn;
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
