import type { DriftRunRequest, DriftRunResult } from '../domain/driftEngine.ts'

/** Worker message contract (structured-clone friendly). */
export type DriftWorkerRequest = {
  type: 'run'
  runId: number
  request: DriftRunRequest
}

export type DriftWorkerResponse =
  | { type: 'result'; runId: number; result: DriftRunResult }
  | { type: 'error'; runId: number; message: string }
