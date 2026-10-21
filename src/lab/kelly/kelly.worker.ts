/// <reference lib="webworker" />
import { simulateKelly, type KellyParams } from '../../lib/kelly.mjs';

self.onmessage = (event: MessageEvent<{ id: number; params: KellyParams }>) => {
  const { id, params } = event.data;
  const result = simulateKelly(params);
  const transfer = [result.times.buffer, result.quantiles.buffer, result.paths.buffer];
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, result }, transfer);
};
