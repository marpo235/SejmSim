import { PARTY_IDS, type PartyId, type Preset, type Scenario } from "@/data/parties";

/** Residual "others" bucket = 100 − Σ party shares (never < 0). */
export function otherShare(s: Scenario): number {
  let sum = 0;
  for (const p of PARTY_IDS) sum += s.shares[p];
  return Math.max(0, 100 - sum);
}

/**
 * Set one party's national share. When autoNormalize is on, all other parties
 * are rescaled so the total stays ≤ 100% (residual flows to "others").
 */
export function setShare(s: Scenario, party: PartyId, value: number): Scenario {
  const v = Math.min(100, Math.max(0, value));
  const shares = { ...s.shares };
  if (!s.autoNormalize) {
    shares[party] = v;
    return { ...s, shares };
  }
  const others = PARTY_IDS.filter((p) => p !== party);
  const sumOthers = others.reduce((a, p) => a + shares[p], 0);
  const remaining = Math.max(0, 100 - v);
  const f = sumOthers > 0 ? remaining / sumOthers : 0;
  shares[party] = Math.min(v, 100);
  for (const p of others) shares[p] = round1(shares[p] * f);
  return { ...s, shares };
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}

export function applyShares(s: Scenario, shares: Partial<Record<PartyId, number>>): Scenario {
  const next = { ...s.shares };
  for (const p of PARTY_IDS) next[p] = shares[p] ?? 0;
  return { ...s, shares: next };
}

/**
 * Apply a preset: base shares + vote-transfer merges. For each merge,
 * `keep` of `from` joins `into`, `redirect` fractions go to named parties,
 * the remainder falls into the "other" residual (abstention / poll
 * inflation). A dispersionBlend is derived so the merged committee inherits
 * a share-weighted mix of its components' geographic shapes.
 */
export function applyPreset(s: Scenario, pr: Preset): Scenario {
  const shares = applyShares(s, pr.shares).shares;
  const next: Scenario = { ...s, shares, dispersionBlend: undefined };
  if (!pr.merges?.length) return next;

  // collect component weights for the blend BEFORE moving shares around:
  // the target's own shape enters at its pre-merge weight, each absorbed
  // committee at its transferred (keep) share only
  const blend: Partial<Record<PartyId, Record<string, number>>> = {};
  for (const m of pr.merges) {
    const w = (blend[m.into] ??= {});
    if (!(m.into in w)) w[m.into] = shares[m.into];
    w[m.from] = (w[m.from] ?? 0) + shares[m.from] * m.keep;
  }

  for (const m of pr.merges) {
    const base = shares[m.from];
    shares[m.from] = 0;
    shares[m.into] = round1(shares[m.into] + base * m.keep);
    for (const [to, f] of Object.entries(m.redirect ?? {})) {
      shares[to as PartyId] = round1(shares[to as PartyId] + base * (f ?? 0));
    }
  }
  next.dispersionBlend = blend as Scenario["dispersionBlend"];
  return next;
}

export function thresholdOf(s: Scenario, p: PartyId): number {
  return s.coalitionFlag[p] ? 8 : 5;
}

export function isAboveThreshold(s: Scenario, p: PartyId): boolean {
  return s.shares[p] >= thresholdOf(s, p);
}
