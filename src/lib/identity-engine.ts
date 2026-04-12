/**
 * Identity Validation Engine v2
 * Runs entirely in the browser using face-api.js and tesseract.js
 *
 * Improvements over v1:
 * - Multi-threshold face detection (retries with lower confidence for ID photos)
 * - Face cropping from cédula before comparison (removes document background noise)
 * - Dual metric: cosine similarity + euclidean distance averaged
 * - Image upscaling for small faces in ID photos
 * - Better score curve calibrated for selfie-vs-ID comparison
 */

import * as faceapi from "face-api.js";

let modelsLoaded = false;

// Detection thresholds — try high first, fallback to lower for ID photos
const THRESHOLDS = [0.5, 0.3, 0.15];

/**
 * Load face-api.js models (SSD MobileNet + Landmarks + Recognition)
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

/**
 * Create an HTMLImageElement from a data URL or regular URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Upscale small images for better face detection (especially ID photos)
 */
function upscaleIfNeeded(img: HTMLImageElement, minSize = 500): HTMLCanvasElement | HTMLImageElement {
  if (img.width >= minSize && img.height >= minSize) return img;
  const scale = Math.max(minSize / img.width, minSize / img.height, 1);
  if (scale <= 1) return img;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Enhance image: convert to grayscale, increase contrast and sharpness
 * This normalizes lighting differences between a selfie and a printed ID photo
 */
function enhanceForComparison(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Step 1: Convert to grayscale (removes color bias between live photo and printed ID)
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // Step 2: Histogram equalization (normalizes brightness/contrast)
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) histogram[data[i]]++;
  const totalPixels = data.length / 4;
  const cdf = new Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + histogram[i];
  const cdfMin = cdf.find((v) => v > 0) || 0;
  const scale = 255 / (totalPixels - cdfMin);
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.round((cdf[data[i]] - cdfMin) * scale);
    data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, val));
  }

  ctx.putImageData(imageData, 0, 0);

  // Step 3: Sharpen using unsharp mask (draw blurred version subtracted)
  const sharpCanvas = document.createElement("canvas");
  sharpCanvas.width = canvas.width;
  sharpCanvas.height = canvas.height;
  const sCtx = sharpCanvas.getContext("2d")!;
  // Draw original
  sCtx.drawImage(canvas, 0, 0);
  // Overlay with sharpening: increase contrast at edges
  sCtx.globalCompositeOperation = "overlay";
  sCtx.globalAlpha = 0.3;
  sCtx.drawImage(canvas, 0, 0);
  sCtx.globalCompositeOperation = "source-over";
  sCtx.globalAlpha = 1;

  return sharpCanvas;
}

/**
 * Normalize a face crop to a standard 160x160 canvas (FaceNet input size)
 * This ensures both faces are compared at the same scale
 */
function normalizeFaceCrop(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const norm = document.createElement("canvas");
  norm.width = 160;
  norm.height = 160;
  const ctx = norm.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(canvas, 0, 0, 160, 160);
  return norm;
}

/**
 * Crop detected face from an image with padding, returns a data URL
 * This removes background noise (especially useful for cédula photos)
 */
async function cropFace(img: HTMLImageElement | HTMLCanvasElement, detection: faceapi.FaceDetection, padding = 0.4): Promise<string> {
  const box = detection.box;
  const padX = box.width * padding;
  const padY = box.height * padding;

  const srcW = "naturalWidth" in img ? img.naturalWidth : img.width;
  const srcH = "naturalHeight" in img ? img.naturalHeight : img.height;

  const x = Math.max(0, Math.round(box.x - padX));
  const y = Math.max(0, Math.round(box.y - padY));
  const w = Math.min(srcW - x, Math.round(box.width + padX * 2));
  const h = Math.min(srcH - y, Math.round(box.height + padY * 2));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, x, y, w, h, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * Detect face with multi-threshold retry
 * Tries highest confidence first, then lowers threshold for difficult images
 */
async function detectFaceMultiThreshold(
  input: HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | null> {
  for (const minConfidence of THRESHOLDS) {
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });
    const detection = await faceapi
      .detectSingleFace(input, options)
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (detection) return detection;
  }
  return null;
}

/**
 * Get face descriptor with upscaling and multi-threshold detection
 */
async function getFaceDescriptor(imageUrl: string): Promise<{
  descriptor: Float32Array | null;
  detected: boolean;
  confidence: number;
  detection: faceapi.FaceDetection | null;
  img: HTMLImageElement;
}> {
  try {
    const img = await loadImage(imageUrl);
    const input = upscaleIfNeeded(img);
    const result = await detectFaceMultiThreshold(input);

    if (!result) {
      return { descriptor: null, detected: false, confidence: 0, detection: null, img };
    }

    return {
      descriptor: result.descriptor,
      detected: true,
      confidence: Math.round(result.detection.score * 100),
      detection: result.detection,
      img,
    };
  } catch {
    const img = await loadImage(imageUrl).catch(() => new Image());
    return { descriptor: null, detected: false, confidence: 0, detection: null, img };
  }
}

/**
 * Cosine similarity between two vectors (0 to 1, higher = more similar)
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

/**
 * Get descriptor from a face crop canvas with enhancement
 */
async function getDescriptorFromCrop(cropUrl: string): Promise<Float32Array | null> {
  try {
    const img = await loadImage(cropUrl);
    // Create canvas from image
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0);

    // Enhance and normalize
    const enhanced = enhanceForComparison(canvas);
    const normalized = normalizeFaceCrop(enhanced);

    const detection = await detectFaceMultiThreshold(normalized);
    return detection?.descriptor || null;
  } catch {
    return null;
  }
}

/**
 * Compare two face images with improved algorithm v3:
 * Strategy A: Raw comparison (original images)
 * Strategy B: Cropped + enhanced comparison (grayscale, equalized, sharpened)
 * Strategy C: Selfie enhanced vs cédula enhanced
 * Final score = best of all strategies
 */
export async function compareFaces(
  selfieUrl: string,
  cedulaUrl: string
): Promise<{
  score: number;
  selfieDetected: boolean;
  cedulaDetected: boolean;
  selfieConfidence: number;
  cedulaConfidence: number;
}> {
  await loadModels();

  // Step 1: Detect faces in both images
  const selfie = await getFaceDescriptor(selfieUrl);
  let cedula = await getFaceDescriptor(cedulaUrl);

  // Step 2: Crop face from cédula if detected
  let cedulaCroppedUrl: string | null = null;
  if (cedula.detected && cedula.detection) {
    try {
      cedulaCroppedUrl = await cropFace(cedula.img, cedula.detection, 0.5);
      const croppedResult = await getFaceDescriptor(cedulaCroppedUrl);
      if (croppedResult.detected && croppedResult.descriptor) {
        cedula = croppedResult;
      }
    } catch { /* keep original */ }
  }

  // Also crop selfie face for cleaner descriptor
  let selfieCroppedUrl: string | null = null;
  if (selfie.detected && selfie.detection) {
    try {
      selfieCroppedUrl = await cropFace(selfie.img, selfie.detection, 0.5);
    } catch { /* keep original */ }
  }

  if (!selfie.descriptor || !cedula.descriptor) {
    return {
      score: 0,
      selfieDetected: selfie.detected,
      cedulaDetected: cedula.detected,
      selfieConfidence: selfie.confidence,
      cedulaConfidence: cedula.confidence,
    };
  }

  // ── Strategy A: Raw descriptors ──
  const scoreA = calculateDualScore(selfie.descriptor, cedula.descriptor);

  // ── Strategy B: Enhanced descriptors (grayscale + equalized + sharpened) ──
  let scoreB = 0;
  if (selfieCroppedUrl && cedulaCroppedUrl) {
    const [enhSelfie, enhCedula] = await Promise.all([
      getDescriptorFromCrop(selfieCroppedUrl),
      getDescriptorFromCrop(cedulaCroppedUrl),
    ]);
    if (enhSelfie && enhCedula) {
      scoreB = calculateDualScore(enhSelfie, enhCedula);
    }
  }

  // ── Strategy C: Original selfie vs enhanced cédula ──
  let scoreC = 0;
  if (cedulaCroppedUrl) {
    const enhCedula = await getDescriptorFromCrop(cedulaCroppedUrl);
    if (enhCedula && selfie.descriptor) {
      scoreC = calculateDualScore(selfie.descriptor, enhCedula);
    }
  }

  // Best of all strategies
  const score = Math.max(scoreA, scoreB, scoreC);

  return {
    score,
    selfieDetected: true,
    cedulaDetected: true,
    selfieConfidence: selfie.confidence,
    cedulaConfidence: cedula.confidence,
  };
}

/**
 * Calculate score from two descriptors using dual metrics
 */
function calculateDualScore(a: Float32Array, b: Float32Array): number {
  const euclideanDist = faceapi.euclideanDistance(a, b);
  const cosine = cosineSimilarity(a, b);

  // Euclidean: calibrated for selfie-vs-ID (more generous)
  // Distance 0 = 100%, 0.6 = ~50%, 1.0 = 17%, 1.2 = 0%
  const euclideanScore = Math.max(0, Math.min(100, Math.round((1 - euclideanDist / 1.2) * 100)));

  // Cosine: map [0.3, 1.0] → [0, 100] (wider range for cross-domain comparison)
  const cosineScore = Math.max(0, Math.min(100, Math.round((cosine - 0.3) / 0.7 * 100)));

  // Weighted: take the higher of the two, with a floor from the average
  const maxScore = Math.max(cosineScore, euclideanScore);
  const avgScore = Math.round(cosineScore * 0.6 + euclideanScore * 0.4);

  // Use the higher metric but don't let it be wildly above the average
  return Math.round(maxScore * 0.7 + avgScore * 0.3);
}

/**
 * Check if a face is detected and image quality is acceptable
 */
export async function checkImageQuality(imageUrl: string): Promise<{
  faceDetected: boolean;
  confidence: number;
}> {
  await loadModels();
  const result = await getFaceDescriptor(imageUrl);
  return {
    faceDetected: result.detected,
    confidence: result.confidence,
  };
}

/**
 * Extract text from a cédula image using Tesseract.js OCR
 */
export async function extractCedulaText(imageUrl: string): Promise<{
  nombre: string | null;
  cedula: string | null;
  rawText: string;
}> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("spa");
  const { data } = await worker.recognize(imageUrl);
  await worker.terminate();

  const text = data.text;

  // Try to extract cédula number (8-10 digit number)
  const cedulaMatch = text.match(/\b(\d{6,10})\b/);
  const cedula = cedulaMatch ? cedulaMatch[1] : null;

  // Try to extract name (lines with mostly uppercase letters, no numbers)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const nameLine = lines.find(
    (l) => l.length > 5 && /^[A-ZÁÉÍÓÚÑ\s]+$/.test(l) && !/\d/.test(l)
  );
  const nombre = nameLine || null;

  return { nombre, cedula, rawText: text };
}

/**
 * Compare extracted text with user-provided data
 */
export function compareData(
  ocrNombre: string | null,
  ocrCedula: string | null,
  inputNombre: string,
  inputCedula: string
): { nombreMatch: boolean; cedulaMatch: boolean } {
  const normalizeStr = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();

  const nombreMatch = ocrNombre
    ? normalizeStr(ocrNombre).includes(normalizeStr(inputNombre.split(" ").pop() || ""))
      || normalizeStr(inputNombre).includes(normalizeStr(ocrNombre.split(" ").pop() || ""))
    : false;

  const cedulaMatch = ocrCedula
    ? ocrCedula.replace(/\D/g, "") === inputCedula.replace(/\D/g, "")
    : false;

  return { nombreMatch, cedulaMatch };
}

/**
 * Generate a face embedding hash for duplicate detection
 */
export async function getFaceHash(imageUrl: string): Promise<string | null> {
  await loadModels();
  const result = await getFaceDescriptor(imageUrl);
  if (!result.descriptor) return null;

  // Quantize descriptor to create a rough hash (not cryptographic, for grouping)
  const quantized = Array.from(result.descriptor).map((v) => Math.round(v * 100));
  return quantized.join(",");
}
