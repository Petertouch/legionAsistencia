/**
 * Identity Validation Engine
 * Runs entirely in the browser using face-api.js and tesseract.js
 */

import * as faceapi from "face-api.js";

let modelsLoaded = false;

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
 * Detect a face in an image and return its descriptor (128-dimension embedding)
 */
async function getFaceDescriptor(imageUrl: string): Promise<{
  descriptor: Float32Array | null;
  detected: boolean;
  confidence: number;
}> {
  try {
    const img = await loadImage(imageUrl);
    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return { descriptor: null, detected: false, confidence: 0 };
    }

    return {
      descriptor: detection.descriptor,
      detected: true,
      confidence: Math.round(detection.detection.score * 100),
    };
  } catch {
    return { descriptor: null, detected: false, confidence: 0 };
  }
}

/**
 * Compare two face images and return similarity score (0-100)
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

  const [selfie, cedula] = await Promise.all([
    getFaceDescriptor(selfieUrl),
    getFaceDescriptor(cedulaUrl),
  ]);

  if (!selfie.descriptor || !cedula.descriptor) {
    return {
      score: 0,
      selfieDetected: selfie.detected,
      cedulaDetected: cedula.detected,
      selfieConfidence: selfie.confidence,
      cedulaConfidence: cedula.confidence,
    };
  }

  // Euclidean distance — lower = more similar
  // face-api.js uses 0.6 as typical threshold for same person
  const distance = faceapi.euclideanDistance(selfie.descriptor, cedula.descriptor);

  // Convert distance to percentage (0 dist = 100%, 1.0 dist = 0%)
  const score = Math.max(0, Math.round((1 - distance / 1.0) * 100));

  return {
    score,
    selfieDetected: true,
    cedulaDetected: true,
    selfieConfidence: selfie.confidence,
    cedulaConfidence: cedula.confidence,
  };
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
