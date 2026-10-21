/// <reference lib="webworker" />
// Roda a simulação fora da thread principal: os sliders continuam fluidos mesmo com 5.000
// trajetórias de 3 anos. Só a última requisição pendente é processada (as do meio são
// descartadas pela página, que espera a resposta antes de mandar a próxima).
import { simulateGbm, type GbmParams } from '../lib/gbm.mjs';

self.onmessage = (event: MessageEvent<{ id: number; params: GbmParams }>) => {
  const { id, params } = event.data;
  const result = simulateGbm(params);
  const transfer = [result.times.buffer, result.quantiles.buffer, result.paths.buffer, result.finals.buffer];
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, result }, transfer);
};
