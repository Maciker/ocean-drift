/// <reference lib="webworker" />
import { runDrift } from '../domain/driftEngine.ts'
import type { DriftWorkerRequest, DriftWorkerResponse } from './driftProtocol.ts'

declare const self: DedicatedWorkerGlobalScope

self.onmessage = (event: MessageEvent<DriftWorkerRequest>) => {
  const payload = event.data
  try {
    if (payload.type !== 'run') {
      throw new Error(`Unknown worker message type: ${String((payload as { type?: string }).type)}`)
    }
    const result = runDrift(payload.request)
    const response: DriftWorkerResponse = { type: 'result', result }
    self.postMessage(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Drift worker failed'
    const response: DriftWorkerResponse = { type: 'error', message }
    self.postMessage(response)
  }
}
