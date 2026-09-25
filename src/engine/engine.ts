import {
  PARTIES,
  PARTY_IDS,
  SPECTRUM_ORDER,
  type PartyId,
  type Scenario,
} from "@/data/parties";
import {
  DISTRICTS,
  N_DISTRICTS,
  N_SEATS,
  buildDispersion,
  buildPriors,
} from "./priors";
import { Gaussian, mulberry32 } from "./rng";
import type {
  CoalitionProb,
  DeterministicResult,
  DistrictResult,
  DistrictVote,
  FlipDiagnostic,
  MonteCarloResult,
  QuotientEntry,
  SeatDistribution,
} from "./types";

const EPS_SHARE = 1e-4; // floor for logit inputs (~0.01%)
const OTHER_INDEX = PARTY_IDS.length; // implicit residual committee (never qualifies)

export interface Prepared {
  dispersion: Record<PartyId, Float64Array>;
  thresholds: Float64Array;
  seats: Int32Array;
  /** flat prior for the implicit OTHER committee */
  otherShape: Float64Array;
  /** scratch buffers reused across iterations */
  _v: Float64Array;
  _gate: Float64Array;
  _seatCount: Int32Array;
}

export function prepare(scenario: Scenario): Prepared {
  const priors = buildPriors(scenario.w25);
  const dispersion = buildDispersion(priors, scenario.alpha);
  const thresholds = new Float64Array(PARTY_IDS.length);
  PARTY_IDS.forEach((p, i) => {
    thresholds[i] = scenario.coalitionFlag[p] ? 0.08 : 0.05;
  });
  const seats = new Int32Array(N_DISTRICTS);
  DISTRICTS.forEach((d, i) => (seats[i] = d.seats));
  const otherShape = new Float64Array(N_DISTRICTS).fill(1);
  return {
    dispersion,
    thresholds,
    seats,
    otherShape,
    _v: new Float64Array(PARTY_IDS.length + 1),
    _gate: new Float64Array(PARTY_IDS.length + 1),
    _seatCount: new Int32Array(PARTY_IDS.length + 1),
  };
}

export function sharesToFractions(
  shares: Record<PartyId, number>
): { c: Float64Array; other: number } {
  const c = new Float64Array(PARTY_IDS.length);
  let sum = 0;
  PARTY_IDS.forEach((p, i) => {
    c[i] = Math.max(0, shares[p]) / 100;
    sum += c[i];
  });
  const other = Math.max(0, 1 - sum);
  if (sum > 1) {
    // normalize overflow defensively
    for (let i = 0; i < c.length; i++) c[i] /= sum;
    return { c, other: 0 };
  }
  return { c, other };
}

/** Stage 1 — logit-normal sampler: Z ~ N(μ,Σ) with OTHER as reference, softmax back. */
export function makeSampler(
  c: Float64Array,
  other: number,
  sigma: number,
  rho: number,
  gauss: Gaussian
): () => Float64Array {
  const K = c.length;
  const pRef = Math.max(other, EPS_SHARE);
  const mu = new Float64Array(K);
  for (let k = 0; k < K; k++) mu[k] = Math.log(Math.max(c[k], EPS_SHARE) / pRef);
  const sInd = sigma * Math.sqrt(1 - rho);
  const sCom = sigma * Math.sqrt(rho);

  return () => {
    const z = new Float64Array(K);
    const common = sCom * gauss.next();
    let max = 0;
    for (let k = 0; k < K; k++) {
      z[k] = mu[k] + common + sInd * gauss.next();
      if (z[k] > max) max = z[k];
    }
    const ref = Math.exp(-max); // exp(0 - max): the OTHER reference term
    let sum = ref;
    for (let k = 0; k < K; k++) sum += Math.exp(z[k] - max);
    const out = new Float64Array(K + 1);
    out[OTHER_INDEX] = ref / sum;
    for (let k = 0; k < K; k++) out[k] = Math.exp(z[k] - max) / sum;
    return out;
  };
}

/**
 * Stages 3–5 for one national vector c (index OTHER_INDEX = residual):
 * disaggregate, gate, run D'Hondt in all 41 districts.
 * Fills `seatTotals` (length K) and returns nothing — hot path.
 */
export function simulateSeats(
  c: Float64Array,
  prep: Prepared,
  seatTotals: Int32Array
): void {
  const K = PARTY_IDS.length;
  const { dispersion, thresholds, seats, otherShape } = prep;
  const v = prep._v;
  const sCount = prep._gate;
  const seatCount = prep._seatCount;

  seatTotals.fill(0);
  for (let d = 0; d < N_DISTRICTS; d++) {
    // stage 3: latent support + normalize
    let tot = 0;
    for (let k = 0; k < K; k++) {
      v[k] = c[k] * dispersion[PARTY_IDS[k]][d];
      tot += v[k];
    }
    v[OTHER_INDEX] = c[OTHER_INDEX] * otherShape[d];
    tot += v[OTHER_INDEX];
    if (tot <= 0) continue;
    for (let k = 0; k <= K; k++) v[k] /= tot;

    // stage 4: national gatekeeper — discarded votes are eliminated locally
    for (let k = 0; k <= K; k++) {
      const thr = k === OTHER_INDEX ? 1 : thresholds[k]; // OTHER never qualifies
      sCount[k] = c[k] >= thr ? v[k] : 0;
      seatCount[k] = 0;
    }

    // stage 5: D'Hondt — M_d rounds of max quotient
    const M = seats[d];
    for (let m = 0; m < M; m++) {
      let best = -1;
      let bi = -1;
      for (let k = 0; k <= K; k++) {
        const cur = sCount[k];
        if (cur <= 0) continue;
        const q = cur / (seatCount[k] + 1);
        if (q > best || (q === best && cur > sCount[bi])) {
          best = q;
          bi = k;
        }
      }
      if (bi < 0) break;
      seatCount[bi]++;
    }
    for (let k = 0; k < K; k++) seatTotals[k] += seatCount[k];
  }
}

/** Full deterministic pass with per-district diagnostics (stages 3–6).
 *  `c` is the full share vector incl. OTHER at index PARTY_IDS.length. */
export function runDeterministic(
  prep: Prepared,
  c: Float64Array
): DeterministicResult {
  const K = PARTY_IDS.length;
  const gatedNationally: PartyId[] = [];
  PARTY_IDS.forEach((p, i) => {
    if (c[i] < prep.thresholds[i]) gatedNationally.push(p);
  });

  const seats: Record<PartyId, number> = {} as Record<PartyId, number>;
  PARTY_IDS.forEach((p) => (seats[p] = 0));
  const districts: DistrictResult[] = [];

  for (let d = 0; d < N_DISTRICTS; d++) {
    const dd = DISTRICTS[d];
    // stage 3
    const raw = new Float64Array(K + 1);
    let tot = 0;
    for (let k = 0; k < K; k++) {
      raw[k] = c[k] * prep.dispersion[PARTY_IDS[k]][d];
      tot += raw[k];
    }
    raw[OTHER_INDEX] = c[OTHER_INDEX] * prep.otherShape[d];
    tot += raw[OTHER_INDEX];
    for (let k = 0; k <= K; k++) raw[k] /= tot;

    // stage 4
    const gated = new Array<boolean>(K + 1);
    const vq = new Float64Array(K + 1);
    let qTot = 0;
    for (let k = 0; k <= K; k++) {
      const thr = k === OTHER_INDEX ? 1 : prep.thresholds[k];
      gated[k] = c[k] < thr;
      vq[k] = gated[k] ? 0 : raw[k];
      qTot += vq[k];
    }
    const qualified = new Float64Array(K + 1);
    for (let k = 0; k <= K; k++) qualified[k] = qTot > 0 ? vq[k] / qTot : 0;

    // stage 5 — D'Hondt with full quotient audit
    const M = dd.seats;
    const seatCount = new Int32Array(K + 1);
    const quotients: QuotientEntry[] = [];
    for (let k = 0; k < K; k++) {
      if (vq[k] <= 0) continue;
      const p = PARTY_IDS[k];
      for (let m = 1; m <= M; m++) {
        quotients.push({ party: p, divisor: m, value: qualified[k] / m, won: false });
      }
    }
    quotients.sort((a, b) => b.value - a.value);
    let qStar = 0;
    let marginalParty: PartyId | null = null;
    for (let i = 0; i < Math.min(M, quotients.length); i++) {
      quotients[i].won = true;
      const k = PARTY_IDS.indexOf(quotients[i].party);
      seatCount[k]++;
      qStar = quotients[i].value;
      marginalParty = quotients[i].party;
    }

    // stage 6 — flip diagnostics
    const qualifiedVotes = Math.round(dd.sejm2023.valid * qTot);
    const flips: FlipDiagnostic[] = [];
    for (let k = 0; k < K; k++) {
      if (vq[k] <= 0) continue;
      const s = seatCount[k];
      const delta = Math.max(0, (s + 1) * qStar - qualified[k]);
      flips.push({
        party: PARTY_IDS[k],
        deltaShare: delta,
        deltaVotes: Math.round(delta * qualifiedVotes),
        fromParty: marginalParty ?? PARTY_IDS[k],
        seatNumber: s + 1,
      });
    }
    flips.sort((a, b) => a.deltaShare - b.deltaShare);

    const votes: DistrictVote[] = PARTY_IDS.map((p, i) => ({
      party: p,
      raw: raw[i],
      qualified: qualified[i],
      gated: gated[i],
      seats: seatCount[i],
    })).filter((v) => v.raw > 0.001 || v.seats > 0);

    for (let k = 0; k < K; k++) seats[PARTY_IDS[k]] += seatCount[k];

    districts.push({
      id: dd.id,
      name: dd.name,
      seats: M,
      votes,
      qStar,
      marginalParty,
      quotients,
      flips,
      qualifiedVotes,
      totalVotes: dd.sejm2023.valid,
    });
  }

  // dry national comparison: single-district D'Hondt over 460 on qualified shares
  const dryNationalSeats = dryNational(c, prep.thresholds);

  const nationalShares = {} as Record<PartyId, number>;
  PARTY_IDS.forEach((p, i) => (nationalShares[p] = c[i]));

  return { seats, nationalShares, gatedNationally, districts, dryNationalSeats };
}

/** Naive proportional D'Hondt on national qualified shares — the "dry simulator" baseline. */
export function dryNational(
  c: Float64Array,
  thresholds: Float64Array
): Record<PartyId, number> {
  const K = PARTY_IDS.length;
  const vq = new Float64Array(K);
  let tot = 0;
  for (let k = 0; k < K; k++) {
    vq[k] = c[k] >= thresholds[k] ? c[k] : 0;
    tot += vq[k];
  }
  if (tot <= 0) return Object.fromEntries(PARTY_IDS.map((p) => [p, 0])) as Record<
    PartyId,
    number
  >;
  const seatCount = new Int32Array(K);
  for (let m = 0; m < N_SEATS; m++) {
    let best = -1;
    let bi = -1;
    for (let k = 0; k < K; k++) {
      if (vq[k] <= 0) continue;
      const q = vq[k] / (seatCount[k] + 1);
      if (q > best) {
        best = q;
        bi = k;
      }
    }
    if (bi < 0) break;
    seatCount[bi]++;
  }
  return Object.fromEntries(
    PARTY_IDS.map((p, i) => [p, seatCount[i]])
  ) as Record<PartyId, number>;
}

/** Percentile helper over a seat histogram. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

const NAMED_COALITIONS: { name: string; members: PartyId[] }[] = [
  { name: "Incumbent bloc (KO+PSL+P2050+Lew)", members: ["KO", "PSL", "P2050", "LEW"] },
  { name: "Incumbent + Razem + R+", members: ["KO", "PSL", "P2050", "LEW", "RAZ", "RP"] },
  { name: "Right bloc (PiS+Konf+KKP)", members: ["PIS", "KONF", "KKP"] },
  { name: "PiS + Konfederacja", members: ["PIS", "KONF"] },
  { name: "KO + Lewica + Razem + R+", members: ["KO", "LEW", "RAZ", "RP"] },
];

export interface McOptions {
  onProgress?: (done: number, total: number) => void;
  customCoalition?: PartyId[];
  /** equicorrelation of logit shocks */
  rho?: number;
}

export function runMonteCarlo(
  scenario: Scenario,
  seed: number,
  opts: McOptions = {}
): MonteCarloResult {
  const t0 = performance.now();
  const prep = prepare(scenario);
  const { c, other } = sharesToFractions(scenario.shares);
  const K = PARTY_IDS.length;
  const gauss = new Gaussian(mulberry32(seed));
  const rho = opts.rho ?? 0.25;
  const sample = makeSampler(c, other, scenario.sigma, rho, gauss);

  const iters = scenario.iterations;
  const hist = PARTY_IDS.map(() => new Float64Array(N_SEATS + 1));
  const belowThr = new Float64Array(K);
  const zeroSeats = new Float64Array(K);
  const seatTotals = new Int32Array(K);
  const seatSamples = PARTY_IDS.map(() => new Float64Array(iters));

  const coalIdx = NAMED_COALITIONS.map((co) =>
    co.members.map((p) => PARTY_IDS.indexOf(p))
  );
  const coalSeats = NAMED_COALITIONS.map(() => new Float64Array(iters));
  const customIdx = (opts.customCoalition ?? []).map((p) => PARTY_IDS.indexOf(p));
  const customSeats = new Float64Array(iters);

  const progressEvery = Math.max(1, Math.floor(iters / 20));
  for (let it = 0; it < iters; it++) {
    const cs = sample();
    simulateSeats(cs, prep, seatTotals);
    for (let k = 0; k < K; k++) {
      const s = seatTotals[k];
      hist[k][s]++;
      seatSamples[k][it] = s;
      if (s === 0) zeroSeats[k]++;
      if (cs[k] < prep.thresholds[k]) belowThr[k]++;
    }
    coalIdx.forEach((members, ci) => {
      let s = 0;
      for (const k of members) s += seatTotals[k];
      coalSeats[ci][it] = s;
    });
    if (customIdx.length) {
      let s = 0;
      for (const k of customIdx) s += seatTotals[k];
      customSeats[it] = s;
    }
    if (opts.onProgress && it % progressEvery === 0) opts.onProgress(it, iters);
  }

  const distributions: SeatDistribution[] = SPECTRUM_ORDER.map((p) => {
    const k = PARTY_IDS.indexOf(p);
    const sorted = Array.from(seatSamples[k]).sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / iters;
    return {
      party: p,
      p10: percentile(sorted, 0.1),
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      mean,
      pZeroSeats: zeroSeats[k] / iters,
      pBelowThreshold: belowThr[k] / iters,
      histogram: Array.from(hist[k], (x) => x / iters),
    };
  });

  const toProb = (samples: Float64Array) => {
    const sorted = Array.from(samples).sort((a, b) => a - b);
    const mean = sorted.reduce((a, b) => a + b, 0) / iters;
    let nMaj = 0;
    let nCon = 0;
    for (const s of sorted) {
      if (s >= 231) nMaj++;
      if (s >= 276) nCon++;
    }
    return { nMaj, nCon, mean, median: percentile(sorted, 0.5) };
  };

  const coalitions: CoalitionProb[] = NAMED_COALITIONS.map((co, i) => {
    const { nMaj, nCon, mean, median } = toProb(coalSeats[i]);
    return {
      name: co.name,
      members: co.members,
      pMajority: nMaj / iters,
      pConstitutional: nCon / iters,
      meanSeats: mean,
      medianSeats: median,
    };
  });

  const customCoalition: CoalitionProb | null = customIdx.length
    ? (() => {
        const { nMaj, nCon, mean, median } = toProb(customSeats);
        return {
          name: "Custom coalition",
          members: opts.customCoalition!,
          pMajority: nMaj / iters,
          pConstitutional: nCon / iters,
          meanSeats: mean,
          medianSeats: median,
        };
      })()
    : null;

  // deterministic pass at mean shares for context
  const cFlat = new Float64Array(K + 1);
  cFlat.set(c);
  cFlat[OTHER_INDEX] = other;
  const detTotals = new Int32Array(K);
  simulateSeats(cFlat, prep, detTotals);
  const deterministicSeats = Object.fromEntries(
    PARTY_IDS.map((p, i) => [p, detTotals[i]])
  ) as Record<PartyId, number>;

  return {
    iterations: iters,
    elapsedMs: performance.now() - t0,
    distributions,
    coalitions,
    customCoalition,
    deterministicSeats,
  };
}
