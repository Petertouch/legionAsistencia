import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const HEYGEN_BASE = "https://api.heygen.com";
const BUCKET = "avatars";

// ── Cache to avoid re-fetching huge HeyGen responses ──
let cachedAvatars: Record<string, unknown>[] | null = null;
let cachedVoices: Record<string, unknown>[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function apiKey() {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("HEYGEN_API_KEY no configurada");
  return key;
}

function headers() {
  return {
    "X-Api-Key": apiKey(),
    "Content-Type": "application/json",
  };
}

// ── GET: list avatars, voices, or check video status ──
export async function GET(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (!role || !["admin", "profesor"].includes(role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "avatars") {
      // Return known avatars instantly — no API call needed
      return NextResponse.json({
        avatars: [
          { avatar_id: "tp_8f075f45b6d64be6a8c947464ee45192", avatar_name: "Pedro Tobar (Foto)", gender: "male", preview_image_url: "https://ezytsyqebczlpwbahmyw.supabase.co/storage/v1/object/public/avatars/heygen/pedro-foto.webp", is_talking_photo: true, talking_photo_id: "8f075f45b6d64be6a8c947464ee45192" },
          { avatar_id: "20e6fbc5a23440f0b4afdcb77906aa56", avatar_name: "Pedro Tobar (Animado)", gender: "male", preview_image_url: "https://ezytsyqebczlpwbahmyw.supabase.co/storage/v1/object/public/avatars/heygen/pedro-avatar1.jpg" },
          { avatar_id: "31b876bc68464b63bb34b1dd0b44ce06", avatar_name: "Pedro Tobar — v2 (Animado)", gender: "male", preview_image_url: "https://ezytsyqebczlpwbahmyw.supabase.co/storage/v1/object/public/avatars/heygen/pedro-avatar2.jpg" },
        ],
        talking_photos: [],
      });
    }

    if (action === "voices") {
      // Return known voices instantly — no API call needed
      return NextResponse.json({
        voices: [
          { voice_id: "806cfd1c06614a8fb565cae5267596f2", name: "Pedro Tobar", language: "Spanish", is_cloned: true },
          { voice_id: "016318d1f97c4cd3be9c1817dd18b582", name: "Pedro Tobar — v2", language: "Spanish", is_cloned: true },
          { voice_id: "95a9b3957f9849ea95e34c2f04a27495", name: "Pedro (alt)", language: "Spanish" },
          { voice_id: "a9433c4811814a77b2dfb6524842cd44", name: "Pedro (alt 2)", language: "Spanish" },
        ],
      });
    }

    if (action === "status") {
      const videoId = searchParams.get("video_id");
      if (!videoId) return NextResponse.json({ error: "video_id requerido" }, { status: 400 });
      const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: typeof data.error === "string" ? data.error : JSON.stringify(data.error || data) }, { status: res.status });
      return NextResponse.json(data.data);
    }

    return NextResponse.json({ error: "action inválida (avatars|voices|status)" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error HeyGen" },
      { status: 500 }
    );
  }
}

// ── Natural pauses — make the voice sound human ──
function addNaturalPauses(text: string): string {
  let result = text;

  // Pausa larga después de párrafo (doble salto de línea)
  result = result.replace(/\n\n/g, ' <break time="1.2s"/> ');

  // Pausa media después de punto seguido de mayúscula (nueva oración)
  result = result.replace(/\.(\s+)([A-ZÁÉÍÓÚÑ¿¡])/g, '. <break time="0.6s"/>$2');

  // Pausa corta después de dos puntos (antes de explicación)
  result = result.replace(/:(\s+)/g, ': <break time="0.5s"/>');

  // Pausa antes de "Primero," "Segundo," "Tercero," etc. (enumeraciones)
  result = result.replace(/(Primero|Segundo|Tercero|Cuarto|Quinto|Sexto)\b/g, '<break time="0.4s"/>$1');

  // Pausa después de signos de pregunta
  result = result.replace(/\?(\s+)/g, '? <break time="0.7s"/>');

  // Pausa después de signos de exclamación
  result = result.replace(/!(\s+)/g, '! <break time="0.5s"/>');

  // Pausa después de puntos suspensivos
  result = result.replace(/\.\.\.(\s*)/g, '... <break time="0.8s"/>');

  // Pausa sutil después de coma en frases largas (solo si la frase antes de la coma tiene 8+ palabras)
  result = result.replace(/(\S+(?:\s+\S+){7,}),(\s+)/g, '$1, <break time="0.3s"/>');

  // Limpiar breaks duplicados
  result = result.replace(/(<break[^/]*\/>)\s*(<break[^/]*\/>)/g, '$2');

  return result.trim();
}

// ── POST: generate video from script blocks ──
export async function POST(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (!role || !["admin", "profesor"].includes(role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title, avatar_id, voice_id, blocks, dimension,
      avatar_style, emotion, speed,
    } = body as {
      title: string;
      avatar_id: string;
      voice_id: string;
      blocks: Array<{
        text: string;
        slide_url: string | null;
      }>;
      dimension?: { width: number; height: number };
      avatar_style?: "normal" | "closeup";
      emotion?: string;
      speed?: number;
    };

    if (!avatar_id || !voice_id || !blocks?.length) {
      return NextResponse.json(
        { error: "avatar_id, voice_id y blocks son requeridos" },
        { status: 400 }
      );
    }

    const resolvedSpeed = speed || 1;
    const resolvedEmotion = emotion || "Friendly";

    // Build video_inputs — one scene per block
    // Detect if using a talking photo (avatar_id starts with "tp_")
    const isTalkingPhoto = avatar_id.startsWith("tp_");
    const realAvatarId = isTalkingPhoto ? avatar_id.replace("tp_", "") : avatar_id;

    const video_inputs = blocks.map((block) => {
      const hasSlide = !!block.slide_url;

      // When slide present: small avatar in bottom-right corner so slide text is readable
      // When no slide: full avatar/talking photo centered
      let character: Record<string, unknown>;

      if (isTalkingPhoto) {
        character = {
          type: "talking_photo",
          talking_photo_id: realAvatarId,
          scale: hasSlide ? 0.3 : 1,
          offset: hasSlide ? { x: 0.35, y: 0.35 } : { x: 0, y: 0 },
        };
      } else {
        character = {
          type: "avatar",
          avatar_id: realAvatarId,
          avatar_style: hasSlide ? "circle" : "closeUp",
          scale: hasSlide ? 0.3 : 1,
          offset: hasSlide ? { x: 0.35, y: 0.35 } : { x: 0, y: 0 },
        };
      }

      const scene: Record<string, unknown> = {
        character,
        voice: {
          type: "text",
          voice_id,
          input_text: addNaturalPauses(block.text),
          speed: resolvedSpeed,
          ...(resolvedEmotion !== "none" ? { emotion: resolvedEmotion } : {}),
        },
      };

      if (block.slide_url) {
        scene.background = { type: "image", url: block.slide_url };
      } else {
        scene.background = { type: "color", value: "#0F1923" };
      }

      return scene;
    });

    const payload = {
      title: title || "Lección generada",
      video_inputs,
      dimension: dimension || { width: 1920, height: 1080 },
    };

    const res = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = typeof data.error === "string" ? data.error
        : typeof data.message === "string" ? data.message
        : JSON.stringify(data.error || data);
      return NextResponse.json(
        { error: errMsg },
        { status: res.status }
      );
    }

    return NextResponse.json({ video_id: data.data?.video_id || data.video_id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generando video" },
      { status: 500 }
    );
  }
}

// ── PUT: download HeyGen video and upload to Supabase Storage (permanent) ──
export async function PUT(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (!role || !["admin", "profesor"].includes(role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { heygen_video_url, lesson_id } = await request.json() as {
      heygen_video_url: string;
      lesson_id?: string;
    };

    if (!heygen_video_url) {
      return NextResponse.json({ error: "heygen_video_url requerido" }, { status: 400 });
    }

    // SSRF protection: only allow HeyGen domains
    try {
      const url = new URL(heygen_video_url);
      const allowed = ["heygen.com", "api.heygen.com", "files.heygen.ai", "resource.heygen.com"];
      if (!allowed.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`))) {
        return NextResponse.json({ error: "URL no permitida — solo dominios HeyGen" }, { status: 400 });
      }
      if (url.protocol !== "https:") {
        return NextResponse.json({ error: "Solo HTTPS permitido" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    // 1. Download video from HeyGen
    const videoRes = await fetch(heygen_video_url);
    if (!videoRes.ok) {
      return NextResponse.json({ error: "No se pudo descargar el video de HeyGen" }, { status: 502 });
    }

    const videoBuffer = await videoRes.arrayBuffer();
    const supabase = createAdminClient();

    // 2. Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find((b) => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true });
    }

    // 3. Upload to Supabase Storage
    const fileName = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, videoBuffer, {
        contentType: "video/mp4",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // 4. Get permanent public URL
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    const permanentUrl = urlData.publicUrl;

    // 5. If lesson_id provided, update lesson directly
    if (lesson_id) {
      await supabase
        .from("lessons")
        .update({ video_url: permanentUrl })
        .eq("id", lesson_id);
    }

    return NextResponse.json({ url: permanentUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error guardando video" },
      { status: 500 }
    );
  }
}
