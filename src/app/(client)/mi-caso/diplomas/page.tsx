"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientStore } from "@/lib/stores/client-store";
import { getMyCertificates } from "@/lib/stores/courses-store";
import { useDiplomaStore, renderDiplomaHtml } from "@/lib/stores/diploma-store";
import { Award, Download, X, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DiplomasClientePage() {
  const session = useClientStore((s) => s.session);
  const template = useDiplomaStore((s) => s.template);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ["my-certs", session?.suscriptor_id],
    queryFn: () => getMyCertificates(session!.suscriptor_id),
    enabled: !!session,
  });

  const viewingCert = certificates?.find((c) => c.id === viewingId);

  const handleDownload = (cert: typeof certificates extends (infer T)[] | undefined ? T : never) => {
    const html = renderDiplomaHtml(template, {
      nombre: session?.nombre || "",
      curso: cert.course?.title || "Curso",
      fecha: new Date(cert.issued_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
      certificateId: cert.id.slice(0, 12).toUpperCase(),
    });

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html><head><title>Diploma - ${cert.course?.title}</title>
        <style>@page{size:landscape;margin:0}body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111}</style>
        </head><body>${html}
        <script>setTimeout(()=>window.print(),500)</script>
        </body></html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-4">
      <Link href="/mi-caso/perfil" className="inline-flex items-center gap-1.5 text-gray-400 text-xs hover:text-jungle-dark transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Inicio
      </Link>

      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-oro" />
        <h1 className="text-gray-900 font-bold text-lg">Mis Diplomas</h1>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-jungle-dark/30 border-t-jungle-dark rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (!certificates || certificates.length === 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Award className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Aún no tienes diplomas</p>
          <p className="text-gray-400 text-xs mt-1">Completa un curso para recibir tu diploma</p>
        </div>
      )}

      {/* Diplomas grid */}
      <div className="grid gap-3">
        {certificates?.map((cert) => {
          const diplomaHtml = renderDiplomaHtml(template, {
            nombre: session?.nombre || "",
            curso: cert.course?.title || "Curso",
            fecha: new Date(cert.issued_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
            certificateId: cert.id.slice(0, 12).toUpperCase(),
          });

          return (
            <div key={cert.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Mini preview */}
              <div className="bg-gray-900 p-3 cursor-pointer" onClick={() => setViewingId(viewingId === cert.id ? null : cert.id)}>
                <div style={{ transform: "scale(0.35)", transformOrigin: "top center", height: "180px", pointerEvents: "none" }}>
                  <div dangerouslySetInnerHTML={{ __html: diplomaHtml }} />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-gray-900 font-semibold text-sm truncate">{cert.course?.title || "Curso"}</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Emitido el {new Date(cert.issued_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setViewingId(viewingId === cert.id ? null : cert.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-jungle-dark hover:bg-gray-100 transition-colors" title="Ver">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDownload(cert)}
                    className="p-2 rounded-lg text-gray-400 hover:text-jungle-dark hover:bg-gray-100 transition-colors" title="Descargar / Imprimir">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full view modal */}
      {viewingCert && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingId(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingId(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="bg-gray-900 rounded-xl p-6 overflow-auto">
              <div className="mx-auto" style={{ width: "800px", transform: "scale(0.85)", transformOrigin: "top center" }}>
                <div dangerouslySetInnerHTML={{ __html: renderDiplomaHtml(template, {
                  nombre: session?.nombre || "",
                  curso: viewingCert.course?.title || "Curso",
                  fecha: new Date(viewingCert.issued_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }),
                  certificateId: viewingCert.id.slice(0, 12).toUpperCase(),
                }) }} />
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <button onClick={() => handleDownload(viewingCert)}
                className="flex items-center gap-2 bg-oro text-jungle-dark font-bold px-6 py-2.5 rounded-xl hover:bg-oro-light transition-colors">
                <Download className="w-4 h-4" /> Descargar / Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
