import type { PartyId, Scenario } from "@/data/parties";
import { prepare, runDeterministic, sharesToFractions } from "./engine";
import type {
  DeterministicResult,
  MonteCarloResult,
  WorkerMessage,
  WorkerRequest,
} from "./types";

/** Deterministic pass is cheap — run it on the main thread for instant feedback. */
export function deterministic(scenario: Scenario): DeterministicResult {
  const prep = prepare(scenario);
  const { c, other } = sharesToFractions(scenario.shares);
  const full = new Float64Array(c.length + 1);
  full.set(c);
  full[c.length] = other;
  return runDeterministic(prep, full);
}

export interface McHandle {
  promise: Promise<MonteCarloResult>;
  cancel: () => void;
}

export function runMonteCarloAsync(
  scenario: Scenario,
  coalition: PartyId[],
  onProgress?: (done: number, total: number) => void
): McHandle {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });
  let settled = false;
  const promise = new Promise<MonteCarloResult>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === "progress") onProgress?.(msg.done, msg.total);
      else if (msg.type === "done") {
        settled = true;
        worker.terminate();
        resolve(msg.result);
      }
    };
    worker.onerror = (err) => {
      settled = true;
      worker.terminate();
      reject(err);
    };
    const req: WorkerRequest = {
      type: "run",
      scenario,
      coalition,
      seed: (Math.random() * 0xffffffff) >>> 0,
    };
    worker.postMessage(req);
  });
  return {
    promise,
    cancel: () => {
      if (!settled) worker.terminate();
    },
  };
}
