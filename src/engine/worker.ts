/// <reference lib="webworker" />
import { runMonteCarlo } from "./engine";
import type { WorkerDone, WorkerProgress, WorkerRequest } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type !== "run") return;
  const result = runMonteCarlo(msg.scenario, msg.seed, {
    customCoalition: msg.coalition,
    onProgress: (done, total) => {
      const p: WorkerProgress = { type: "progress", done, total };
      self.postMessage(p);
    },
  });
  const done: WorkerDone = { type: "done", result };
  self.postMessage(done);
};

export {};
