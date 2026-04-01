"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ScriptBlock } from "@/lib/stores/courses-store";
import type { SlideImage } from "@/lib/pdf-to-slides";
import { Clapperboard, Loader2, CheckCircle, XCircle, Play, RefreshCw, Volume2, User } from "lucide-react";
import Button from "@/components/ui/button";
import { toast } from "sonner";

interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  gender?: string;
}

interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender?: string;
  is_cloned?: boolean;
  source?: string;
  preview_audio?: string;
}

interface HeyGenPanelProps {
  lessonTitle: string;
  lessonId?: string;
  blocks: ScriptBlock[];
  slides: SlideImage[];
  presentationUrl: string | null;
  onVideoGenerated: (videoUrl: string) => void;
}

type GenerationStatus = "idle" | "loading-config" | "generating" | "polling" | "saving" | "completed" | "failed";

export default function HeyGenPanel({
  lessonTitle,
  lessonId,
  blocks,
  slides,
  presentationUrl,
  onVideoGenerated,
}: HeyGenPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
  const [voices, setVoices] = useState<HeyGenVoice[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [avatarStyle, setAvatarStyle] = useState<"closeup" | "normal">("closeup");
  const [emotion, setEmotion] = useState("Friendly");
  const [speed, setSpeed] = useState(1.0);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const pollRef = useRef<NodeJS.Timeout>(undefined);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // ── Load avatars & voices on expand ──
  useEffect(() => {
    if (!expanded || avatars.length > 0) return;
    loadConfig();
  }, [expanded]);

  // ── Cleanup polling on unmount ──
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function loadConfig() {
    setStatus("loading-config");
    try {
      // Load sequentially to reduce API pressure
      const avatarRes = await fetch("/api/heygen?action=avatars", { signal: AbortSignal.timeout(60000) });
      if (!avatarRes.ok) {
        const err = await avatarRes.json().catch(() => ({}));
        throw new Error(err.error || "Error cargando avatares");
      }
      const avatarData = await avatarRes.json();

      const voiceRes = await fetch("/api/heygen?action=voices", { signal: AbortSignal.timeout(60000) });
      if (!voiceRes.ok) {
        const err = await voiceRes.json().catch(() => ({}));
        throw new Error(err.error || "Error cargando voces");
      }
      const voiceData = await voiceRes.json();

      const avatarList = avatarData.avatars || [];
      const rawVoiceList = voiceData.voices || [];

      // Sort voices: cloned first, then Spanish Colombian/LATAM, then other Spanish, then rest
      const voiceList = [...rawVoiceList].sort((a: HeyGenVoice, b: HeyGenVoice) => {
        const isOwn = (v: HeyGenVoice) => v.is_cloned || v.source === "clone" || (v.name || "").toLowerCase().includes("tobar");
        const aCloned = isOwn(a) ? 0 : 1;
        const bCloned = isOwn(b) ? 0 : 1;
        if (aCloned !== bCloned) return aCloned - bCloned;
        const aLang = (a.language || "").toLowerCase();
        const bLang = (b.language || "").toLowerCase();
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const scoreVoice = (lang: string, name: string) => {
          if (lang.includes("es-co") || name.includes("colombia")) return 0;
          if (lang.includes("es-mx") || lang.includes("es-la") || name.includes("latin") || name.includes("mexico")) return 1;
          if (lang.includes("es")) return 2;
          return 3;
        };
        const aScore = scoreVoice(aLang, aName);
        const bScore = scoreVoice(bLang, bName);
        if (aScore !== bScore) return aScore - bScore;
        return (a.name || "").localeCompare(b.name || "");
      });

      setAvatars(avatarList);
      setVoices(voiceList);

      // Auto-select first avatar and cloned voice (or first Spanish)
      if (avatarList.length > 0) setSelectedAvatar(avatarList[0].avatar_id);
      const clonedVoice = voiceList.find((v: HeyGenVoice) => v.is_cloned || v.source === "clone" || (v.name || "").toLowerCase().includes("tobar"));
      if (clonedVoice) {
        setSelectedVoice(clonedVoice.voice_id);
      } else {
        const spanishVoice = voiceList.find((v: HeyGenVoice) =>
          v.language?.toLowerCase().includes("es") || v.name?.toLowerCase().includes("spanish")
        );
        if (spanishVoice) setSelectedVoice(spanishVoice.voice_id);
        else if (voiceList.length > 0) setSelectedVoice(voiceList[0].voice_id);
      }

      setStatus("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error cargando HeyGen");
      setStatus("failed");
    }
  }

  // ── Generate video ──
  async function handleGenerate() {
    if (!selectedAvatar || !selectedVoice) {
      toast.error("Selecciona un avatar y una voz");
      return;
    }
    if (blocks.length === 0 || blocks.every((b) => !b.text.trim())) {
      toast.error("Necesitas al menos un bloque de guión con texto");
      return;
    }

    setStatus("generating");
    setErrorMsg(null);
    setVideoUrl(null);
    setVideoId(null);

    try {
      // If slides not loaded yet but presentation exists, extract them now
      let currentSlides = slides;
      if (currentSlides.length === 0 && presentationUrl) {
        setProgress("Extrayendo diapositivas del PDF...");
        try {
          const { extractSlidesFromPdf } = await import("@/lib/pdf-to-slides");
          const pdfRes = await fetch(presentationUrl);
          const pdfBlob = await pdfRes.blob();
          const pdfFile = new File([pdfBlob], "presentation.pdf", { type: "application/pdf" });
          currentSlides = await extractSlidesFromPdf(pdfFile);
        } catch (err) {
          console.error("Error extracting slides:", err);
        }
      }

      // Build blocks payload — upload slide images to get public URLs
      setProgress("Subiendo diapositivas...");
      const blockPayload: Array<{ text: string; slide_url: string | null }> = [];
      const uploadedSlides = new Map<number, string>(); // cache: slideNumber → url

      for (const block of blocks) {
        if (!block.text.trim()) continue;

        let slideUrl: string | null = null;

        if (block.slide_number && currentSlides.length >= block.slide_number) {
          // Check cache first (same slide used in multiple blocks)
          if (uploadedSlides.has(block.slide_number)) {
            slideUrl = uploadedSlides.get(block.slide_number)!;
          } else {
            const slide = currentSlides[block.slide_number - 1];
            if (slide) {
              setProgress(`Subiendo diapositiva ${block.slide_number}...`);
              const dataRes = await fetch(slide.dataUrl);
              const blob = await dataRes.blob();
              const formData = new FormData();
              formData.append("file", new File([blob], `slide-${block.slide_number}-${Date.now()}.png`, { type: "image/png" }));
              formData.append("folder", "slides");

              const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
              if (uploadRes.ok) {
                const { url } = await uploadRes.json();
                slideUrl = url;
                uploadedSlides.set(block.slide_number, url);
              } else {
                const errData = await uploadRes.json().catch(() => ({}));
                console.error("Slide upload failed:", errData);
              }
            }
          }
        }

        blockPayload.push({ text: block.text.trim(), slide_url: slideUrl });
      }

      const slidesUploaded = blockPayload.filter(b => b.slide_url).length;
      const slidesExpected = blocks.filter(b => b.text.trim() && b.slide_number).length;
      if (slidesExpected > 0 && slidesUploaded === 0) {
        toast.error("No se pudieron subir las diapositivas. Revisa que el PDF esté cargado.");
      }

      setProgress("Enviando a HeyGen...");

      const res = await fetch("/api/heygen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonTitle,
          avatar_id: selectedAvatar,
          voice_id: selectedVoice,
          avatar_style: avatarStyle,
          emotion,
          speed,
          blocks: blockPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error generando video");
      }

      setVideoId(data.video_id);
      setStatus("polling");
      setProgress("Video en cola de generación...");
      startPolling(data.video_id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error generando video");
      setStatus("failed");
    }
  }

  // ── Save video permanently to Supabase Storage ──
  async function saveVideoPermanently(heygenUrl: string) {
    setStatus("saving");
    setProgress("Guardando video en tu servidor...");
    try {
      const res = await fetch("/api/heygen", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heygen_video_url: heygenUrl,
          lesson_id: lessonId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error guardando video");

      setVideoUrl(data.url);
      setStatus("completed");
      setProgress("");
      onVideoGenerated(data.url);
      toast.success("Video guardado permanentemente");
    } catch (err) {
      // Fallback: use HeyGen URL (expires in 7 days)
      setVideoUrl(heygenUrl);
      setStatus("completed");
      setProgress("");
      onVideoGenerated(heygenUrl);
      toast.error("No se pudo guardar permanentemente. URL expira en 7 días.");
    }
  }

  // ── Poll for video status ──
  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/heygen?action=status&video_id=${id}`);
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(pollRef.current!);
          // Auto-save to Supabase Storage
          saveVideoPermanently(data.video_url);
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setErrorMsg(data.error || "La generación del video falló");
          setStatus("failed");
          setProgress("");
        } else if (data.status === "processing") {
          setProgress("Renderizando video...");
        } else {
          setProgress("En cola de generación...");
        }
      } catch {
        // Keep polling on network errors
      }
    }, 15000); // Poll every 15 seconds
  }

  const playPreview = useCallback((audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPreviewAudio(audioUrl);
    setTimeout(() => audioRef.current?.play(), 100);
  }, []);

  const blocksWithText = blocks.filter((b) => b.text.trim());
  const totalWords = blocksWithText.reduce((s, b) => s + b.text.trim().split(/\s+/).length, 0);

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">Generar video con HeyGen</span>
          {status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
          {status === "polling" && <Loader2 className="w-3.5 h-3.5 text-oro animate-spin" />}
        </div>
        <span className="text-beige/30 text-xs">
          {blocksWithText.length} escenas · {totalWords} palabras
        </span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          {/* Loading config */}
          {status === "loading-config" && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="w-5 h-5 text-oro animate-spin" />
              <span className="text-beige/50 text-sm">Cargando avatares y voces de HeyGen...</span>
            </div>
          )}

          {/* Config loaded — show selectors */}
          {status !== "loading-config" && (
            <>
              {/* Avatar selector */}
              <div>
                <label className="text-beige/60 text-xs font-medium mb-2 block">Avatar</label>
                {avatars.length === 0 ? (
                  <p className="text-beige/30 text-xs">No se encontraron avatares. Verifica tu API key de HeyGen.</p>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {avatars.slice(0, 20).map((av) => (
                      <button
                        key={av.avatar_id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.avatar_id)}
                        className={`flex-shrink-0 rounded-lg border-2 transition-all p-1 ${
                          selectedAvatar === av.avatar_id
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        {av.preview_image_url ? (
                          <img
                            src={av.preview_image_url}
                            alt={av.avatar_name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-white/5 flex items-center justify-center">
                            <User className="w-6 h-6 text-beige/30" />
                          </div>
                        )}
                        <p className="text-beige/50 text-[9px] mt-1 truncate w-16 text-center">
                          {av.avatar_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Voice selector */}
              <div>
                <label className="text-beige/60 text-xs font-medium mb-1.5 block">Voz</label>
                <div className="flex gap-2">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500/40 appearance-none"
                  >
                    <option value="" className="bg-jungle-dark">Selecciona una voz</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id} className="bg-jungle-dark">
                        {(v.is_cloned || v.source === "clone" || (v.name || "").toLowerCase().includes("tobar")) ? "🎤 " : ""}{v.name} ({v.language}{v.gender ? ` · ${v.gender}` : ""}{(v.is_cloned || v.source === "clone" || (v.name || "").toLowerCase().includes("tobar")) ? " · MI VOZ" : ""})
                      </option>
                    ))}
                  </select>
                  {selectedVoice && voices.find((v) => v.voice_id === selectedVoice)?.preview_audio && (
                    <button
                      type="button"
                      onClick={() => {
                        const voice = voices.find((v) => v.voice_id === selectedVoice);
                        if (voice?.preview_audio) playPreview(voice.preview_audio);
                      }}
                      className="p-2 border border-white/10 rounded-lg text-beige/40 hover:text-purple-400 transition-colors"
                      title="Escuchar preview"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {previewAudio && <audio ref={audioRef} src={previewAudio} className="hidden" />}
              </div>

              {/* Style controls */}
              <div className="grid grid-cols-3 gap-3">
                {/* Avatar style */}
                <div>
                  <label className="text-beige/60 text-xs font-medium mb-1.5 block">Encuadre</label>
                  <select
                    value={avatarStyle}
                    onChange={(e) => setAvatarStyle(e.target.value as "closeup" | "normal")}
                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-purple-500/40 appearance-none"
                  >
                    <option value="closeup" className="bg-jungle-dark">Closeup (cabeza)</option>
                    <option value="normal" className="bg-jungle-dark">Cuerpo completo</option>
                  </select>
                  <p className="text-beige/20 text-[9px] mt-1">Closeup evita problemas con manos</p>
                </div>

                {/* Emotion */}
                <div>
                  <label className="text-beige/60 text-xs font-medium mb-1.5 block">Emoción</label>
                  <select
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-2.5 py-2 rounded-lg focus:outline-none focus:border-purple-500/40 appearance-none"
                  >
                    <option value="Friendly" className="bg-jungle-dark">Amigable</option>
                    <option value="Serious" className="bg-jungle-dark">Serio</option>
                    <option value="Excited" className="bg-jungle-dark">Entusiasta</option>
                    <option value="Soothing" className="bg-jungle-dark">Calmado</option>
                    <option value="Broadcaster" className="bg-jungle-dark">Presentador</option>
                    <option value="Angry" className="bg-jungle-dark">Enérgico</option>
                    <option value="none" className="bg-jungle-dark">Sin emoción</option>
                  </select>
                </div>

                {/* Speed */}
                <div>
                  <label className="text-beige/60 text-xs font-medium mb-1.5 block">
                    Velocidad: {speed.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.2"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 h-2"
                  />
                  <div className="flex justify-between text-[9px] text-beige/20 mt-0.5">
                    <span>Lento</span>
                    <span>Natural</span>
                    <span>Rápido</span>
                  </div>
                </div>
              </div>

              {/* Scene summary */}
              <div className="bg-white/[0.03] rounded-lg p-3 space-y-1.5">
                <p className="text-beige/50 text-xs font-medium">Resumen de escenas:</p>
                {blocksWithText.map((block, i) => (
                  <div key={block.id} className="flex items-center gap-2 text-[11px]">
                    <span className="text-beige/30 w-6">#{i + 1}</span>
                    <span className="text-beige/50 flex-1 truncate">{block.text.slice(0, 60)}...</span>
                    {block.slide_number ? (
                      <span className="text-purple-400/60">Diap. {block.slide_number}</span>
                    ) : (
                      <span className="text-beige/20">Avatar solo</span>
                    )}
                    <span className="text-beige/20">{Math.ceil(block.text.split(/\s+/).length / 150 * 60)}s</span>
                  </div>
                ))}
                <div className="border-t border-white/5 pt-1.5 mt-1.5 flex justify-between text-[10px] text-beige/30">
                  <span>{blocksWithText.length} escenas · {totalWords} palabras</span>
                  <span>~{Math.ceil(totalWords / 150)} min de video</span>
                </div>
              </div>

              {/* Generate button */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={handleGenerate}
                  disabled={status === "generating" || status === "polling" || status === "saving" || !selectedAvatar || !selectedVoice || blocksWithText.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 border-purple-500"
                >
                  {status === "generating" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando a HeyGen...</>
                  ) : status === "polling" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando video...</>
                  ) : status === "saving" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando en servidor...</>
                  ) : (
                    <><Clapperboard className="w-3.5 h-3.5" /> Generar video</>
                  )}
                </Button>

                {status === "failed" && (
                  <button
                    type="button"
                    onClick={() => { setStatus("idle"); setErrorMsg(null); }}
                    className="text-beige/40 hover:text-white text-xs flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                )}
              </div>

              {/* Progress */}
              {progress && (
                <div className="flex items-center gap-2 text-xs text-oro">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{progress}</span>
                  {videoId && <span className="text-beige/20">ID: {videoId.slice(0, 12)}...</span>}
                </div>
              )}

              {/* Error */}
              {errorMsg && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs">{errorMsg}</p>
                </div>
              )}

              {/* Video result */}
              {videoUrl && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-sm font-medium">Video generado</span>
                  </div>
                  <video
                    src={videoUrl}
                    controls
                    className="w-full rounded-lg max-h-64"
                    poster=""
                  />
                  <div className="flex gap-2">
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 text-xs hover:underline flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Abrir en nueva pestaña
                    </a>
                    <span className="text-beige/20 text-[10px]">El enlace expira en 7 días</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
