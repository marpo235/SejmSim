import districtsJson from "@/data/districts.json";
import { PARTIES, PARTY_IDS, type PartyId } from "@/data/parties";

export interface DistrictData {
  id: number;
  name: string;
  seats: number;
  voters: number;
  sejm2023: { valid: number; eligible: number; votes: Record<string, number> };
  prez2025: { valid: number; eligible: number; votes: Record<string, number> };
}

export const DISTRICTS: DistrictData[] = (
  districtsJson as { districts: DistrictData[] }
).districts;

export const N_DISTRICTS = DISTRICTS.length; // 41
export const N_SEATS = 460;
export const MAJORITY = 231;
export const CONSTITUTIONAL = 276;

type Prior25Key = NonNullable<(typeof PARTIES)[PartyId]["prior25"]>;

function votes25(dd: DistrictData, key: Prior25Key): number {
  if (key === "FLAT") return 0;
  if (key === "NAWROCKI") {
    // Jakubiak's right-wing electorate folds into the PiS-side shape.
    return (dd.prez2025.votes.NAWROCKI ?? 0) + (dd.prez2025.votes.JAKUBIAK ?? 0);
  }
  return dd.prez2025.votes[key] ?? 0;
}

/**
 * Stage 2 — prior construction.
 *
 * g_{k,d} is the *geographic multiplier*: the committee's district vote share
 * divided by its national share, i.e. g ≈ 1.0 on average (0.4–3 typical range).
 * The smoothed historical shape mixes 2023 Sejm and 2025 presidential matrices:
 *
 *   mix_{k,d}  = w25·s²⁵_{k,d} + (1−w25)·s²³_{k,d} + ε
 *   g_{k,d}    = mix_{k,d} / mix_{k,nat}
 *
 * so that at α = 1 and Cₖ = mix_{k,nat} the engine reproduces the blended
 * historical election. Parties without a footprint (prior == FLAT) get g ≡ 1.
 */
export function buildPriors(w25: number): Record<PartyId, Float64Array> {
  const w23 = 1 - w25;
  const out = {} as Record<PartyId, Float64Array>;
  const totValid23 = DISTRICTS.reduce((a, d) => a + d.sejm2023.valid, 0);
  const totValid25 = DISTRICTS.reduce((a, d) => a + d.prez2025.valid, 0);

  for (const id of PARTY_IDS) {
    const def = PARTIES[id];
    const g = new Float64Array(N_DISTRICTS);

    if (def.prior23 === "FLAT" && def.prior25 === "FLAT") {
      g.fill(1);
      out[id] = g;
      continue;
    }

    // national share of the mapped blocs
    let nat23 = 0;
    let nat25 = 0;
    for (const dd of DISTRICTS) {
      if (def.prior23 !== "FLAT") nat23 += dd.sejm2023.votes[def.prior23] ?? 0;
      if (def.prior25 !== "FLAT") nat25 += votes25(dd, def.prior25);
    }
    nat23 /= totValid23;
    nat25 /= totValid25;
    const natMix =
      w25 * (def.prior25 === "FLAT" ? 0 : nat25) +
      w23 * (def.prior23 === "FLAT" ? 0 : nat23);
    const laplace = 0.02 * Math.max(natMix, 0.02); // relative smoothing ε

    for (let d = 0; d < N_DISTRICTS; d++) {
      const dd = DISTRICTS[d];
      const s23 =
        def.prior23 === "FLAT"
          ? 0
          : (dd.sejm2023.votes[def.prior23] ?? 0) / dd.sejm2023.valid;
      const s25 =
        def.prior25 === "FLAT" ? 0 : votes25(dd, def.prior25) / dd.prez2025.valid;
      // single-sided priors: renormalize the remaining weight
      let mix = w25 * s25 + w23 * s23;
      const wSum =
        (def.prior25 === "FLAT" ? 0 : w25) + (def.prior23 === "FLAT" ? 0 : w23);
      if (wSum > 0 && wSum < 1) mix /= wSum;
      g[d] = (mix + laplace) / (natMix + laplace);
    }
    out[id] = g;
  }
  return out;
}

/**
 * Precompute g^α for every party×district once per run — the hot loop then
 * only needs multiplication. OTHER (residual) is modelled with a flat shape.
 */
export function buildDispersion(
  priors: Record<PartyId, Float64Array>,
  alpha: Record<PartyId, number>
): Record<PartyId, Float64Array> {
  const out = {} as Record<PartyId, Float64Array>;
  for (const id of PARTY_IDS) {
    const g = priors[id];
    const a = alpha[id];
    const arr = new Float64Array(N_DISTRICTS);
    if (a === 0) {
      arr.fill(1);
    } else if (a === 1) {
      arr.set(g);
    } else {
      for (let d = 0; d < N_DISTRICTS; d++) arr[d] = Math.pow(g[d], a);
    }
    out[id] = arr;
  }
  return out;
}

export const FLAT_SHAPE = (() => {
  const a = new Float64Array(N_DISTRICTS);
  a.fill(1);
  return a;
})();
