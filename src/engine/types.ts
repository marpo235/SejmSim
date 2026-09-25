import type { PartyId, Scenario } from "@/data/parties";

export interface DistrictVote {
  party: PartyId;
  /** share of all votes cast in the district (0..1) before gatekeeping */
  raw: number;
  /** share after national gatekeeper, renormalized over qualifying lists */
  qualified: number;
  gated: boolean;
  seats: number;
}

export interface QuotientEntry {
  party: PartyId;
  divisor: number;
  value: number;
  won: boolean;
}

export interface FlipDiagnostic {
  party: PartyId;
  /** additional qualified-vote share (fraction) needed to take the marginal seat */
  deltaShare: number;
  /** same delta expressed in votes (approx., vs current qualified vote pool) */
  deltaVotes: number;
  /** party currently holding the marginal quotient */
  fromParty: PartyId;
  /** seat ordinal this would be for `party` */
  seatNumber: number;
}

export interface DistrictResult {
  id: number;
  name: string;
  seats: number;
  votes: DistrictVote[];
  /** lowest quotient that won a seat */
  qStar: number;
  /** party holding the marginal quotient */
  marginalParty: PartyId | null;
  quotients: QuotientEntry[];
  flips: FlipDiagnostic[];
  /** approx. pool of votes cast for qualifying lists */
  qualifiedVotes: number;
  totalVotes: number;
}

export interface DeterministicResult {
  seats: Record<PartyId, number>;
  nationalShares: Record<PartyId, number>;
  gatedNationally: PartyId[];
  districts: DistrictResult[];
  /** seats each party would get from a naive single-district national D'Hondt */
  dryNationalSeats: Record<PartyId, number>;
}

export interface SeatDistribution {
  party: PartyId;
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  pZeroSeats: number;
  pBelowThreshold: number;
  histogram: number[];
}

export interface CoalitionProb {
  name: string;
  members: PartyId[];
  pMajority: number;
  pConstitutional: number;
  meanSeats: number;
  medianSeats: number;
}

export interface MonteCarloResult {
  iterations: number;
  elapsedMs: number;
  distributions: SeatDistribution[];
  coalitions: CoalitionProb[];
  customCoalition: CoalitionProb | null;
  /** deterministic pass evaluated at the mean shares, for context */
  deterministicSeats: Record<PartyId, number>;
}

export interface WorkerRequest {
  type: "run";
  scenario: Scenario;
  seed: number;
  coalition: PartyId[];
}

export interface WorkerProgress {
  type: "progress";
  done: number;
  total: number;
}

export interface WorkerDone {
  type: "done";
  result: MonteCarloResult;
}

export type WorkerMessage = WorkerProgress | WorkerDone;
