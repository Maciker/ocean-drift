import type { DriftRunRequest, DriftRunResult } from '../domain/driftEngine.ts'

/** Worker message contract (structured-clone friendly). */
export type DriftWorkerRequest = {
  type: 'run'
  request: DriftRunRequest
}

export type DriftWorkerResponse =
  | { type: 'result'; result: DriftRunResult }
  | { type: 'error'; message: string }
