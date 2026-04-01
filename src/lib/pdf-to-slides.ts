/**
 * Extracts individual pages from a PDF as PNG data URLs using pdf.js
 * Runs entirely client-side — no server processing needed.
 */

import * as pdfjsLib from "pdfjs-dist";

// Point the worker to the bundled file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface SlideImage {
  pageNumber: number;
  dataUrl: string; // base64 PNG
  width: number;
  height: number;
}

/**
 * Render all pages of a PDF file to PNG data URLs.
 * @param file  The PDF File object from an <input> or drop event
 * @param scale Render scale (1 = 72dpi, 2 = 144dpi). Default 1.5 for good quality thumbnails.
 */
export async function extractSlidesFromPdf(
  file: File,
  scale = 1.5
): Promise<SlideImage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const slides: SlideImage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, viewport } as Parameters<typeof page.render>[0]).promise;

    slides.push({
      pageNumber: i,
      dataUrl: canvas.toDataURL("image/png"),
      width: viewport.width,
      height: viewport.height,
    });

    page.cleanup();
  }

  return slides;
}
