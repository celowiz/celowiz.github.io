/// <reference lib="webworker" />
// A grade do simplex com 4 ativos tem ~177 mil carteiras: fora da thread principal.
import { efficientFrontier } from '../../lib/frontier.mjs';

type Params = Parameters<typeof efficientFrontier>[0];

self.onmessage = (event: MessageEvent<{ id: number; params: Params }>) => {
  const { id, params } = event.data;
  const result = efficientFrontier(params);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, result }, [result.random.buffer]);
};
