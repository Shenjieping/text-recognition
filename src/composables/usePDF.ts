import * as pdfjsLib from 'pdfjs-dist'
// Vite loads the worker as a URL string
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export async function loadPdf(file: File): Promise<PDFDocumentProxy> {
  const data = await file.arrayBuffer()
  const task = pdfjsLib.getDocument({ data })
  return task.promise
}

export async function renderPageToCanvas(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  targetWidth: number,
): Promise<{ page: PDFPageProxy; scale: number; viewportWidth: number; viewportHeight: number }> {
  const page = await pdf.getPage(pageNumber)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = Math.max(1, targetWidth / baseViewport.width)
  const viewport = page.getViewport({ scale })

  const ctx = canvas.getContext('2d')!
  canvas.width = viewport.width
  canvas.height = viewport.height

  const renderTask: RenderTask = page.render({ canvasContext: ctx, viewport })
  await renderTask.promise

  return {
    page,
    scale,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  }
}

/**
 * Try to extract embedded text from a PDF page.
 * Returns empty string for scanned/image-only PDFs.
 */
export async function extractPageText(pdf: PDFDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const content = await page.getTextContent()
  const text = content.items
    .map((item) => ('str' in item ? item.str : ''))
    .join('')
    .replace(/\u0000/g, ' ')
  return text.trim()
}

/**
 * Render a PDF page to an offscreen canvas at higher resolution for OCR.
 */
export async function renderPageToBlob(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  renderScale = 2,
): Promise<Blob | null> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale: renderScale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}

export type { PDFDocumentProxy, PDFPageProxy }
