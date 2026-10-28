import { useCallback, useEffect, useRef } from 'react'
import type { DriftRunRequest, DriftRunResult } from '../domain/driftEngine.ts'
import type { DriftWorkerRequest, DriftWorkerResponse } from '../worker/driftProtocol.ts'

type Pending = {
  id: number
  resolve: (result: DriftRunResult) => void
  reject: (error: Error) => void
}

/**
 * Owns a single drift Web Worker and cancels stale runs by run-id.
 * `run` / `cancel` are stable so consumers can safely put them in effect deps.
 */
export function useDriftWorker() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  const runIdRef = useRef(0)

  useEffect(() => {
    const worker = new Worker(new URL('../worker/driftWorker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<DriftWorkerResponse>) => {
      const pending = pendingRef.current
      if (!pending || event.data.runId !== pending.id) {
        return
      }
      pendingRef.current = null
      const data = event.data
      if (data.type === 'result') {
        pending.resolve(data.result)
      } else {
        pending.reject(new Error(data.message))
      }
    }

    worker.onerror = (event) => {
      const pending = pendingRef.current
      if (!pending) {
        return
      }
      pendingRef.current = null
      pending.reject(new Error(event.message || 'Drift worker error'))
    }

    return () => {
      worker.terminate()
      workerRef.current = null
      const pending = pendingRef.current
      pendingRef.current = null
      if (pending) {
        pending.reject(new Error('Cancelled'))
      }
    }
  }, [])

  const cancel = useCallback(() => {
    const pending = pendingRef.current
    pendingRef.current = null
    runIdRef.current += 1
    if (pending) {
      pending.reject(new Error('Cancelled'))
    }
  }, [])

  const run = useCallback(
    (request: DriftRunRequest): Promise<DriftRunResult> => {
      const worker = workerRef.current
      if (!worker) {
        return Promise.reject(new Error('Drift worker is not ready'))
      }
      cancel()
      const id = ++runIdRef.current
      return new Promise<DriftRunResult>((resolve, reject) => {
        pendingRef.current = { id, resolve, reject }
        const message: DriftWorkerRequest = { type: 'run', runId: id, request }
        worker.postMessage(message)
      })
    },
    [cancel],
  )

  return { run, cancel }
}
