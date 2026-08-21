import { createWorker, type Worker } from 'tesseract.js'
import type { OCRProgress } from '@/types'

// Cache workers per language set to avoid re-downloading language data
const workerCache = new Map<string, Worker>()

// Mutable logger so the cached worker always reports into the active call
let activeLogger: ((p: OCRProgress) => void) | null = null

async function getWorker(langs: string): Promise<Worker> {
  let worker = workerCache.get(langs)
  if (!worker) {
    worker = await createWorker(langs, 1, {
      logger: (m: { status: string; progress: number }) => {
        activeLogger?.({ status: m.status, progress: m.progress ?? 0 })
      },
    })
    workerCache.set(langs, worker)
  }
  return worker
}

export type RecognizeInput = string | File | Blob | HTMLCanvasElement | HTMLImageElement

export async function recognizeText(
  input: RecognizeInput,
  langs: string,
  onProgress?: (p: OCRProgress) => void,
): Promise<string> {
  activeLogger = onProgress ?? null
  const worker = await getWorker(langs)
  const { data } = await worker.recognize(input)
  activeLogger = null
  return data.text.trim()
}

/** Terminate all cached workers (used when clearing state / changing context). */
export async function terminateAll(): Promise<void> {
  for (const worker of workerCache.values()) {
    await worker.terminate()
  }
  workerCache.clear()
}
