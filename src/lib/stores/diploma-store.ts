import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DiplomaTemplate {
  bgColor: string;
  borderColor: string;
  accentColor: string;
  titleText: string;
  subtitleText: string;
  bodyText: string;
  signatureName: string;
  signatureTitle: string;
  signatureName2: string;
  signatureTitle2: string;
  logoUrl: string;
  showBorder: boolean;
  showLogo: boolean;
}

const DEFAULT_TEMPLATE: DiplomaTemplate = {
  bgColor: "#0f1a0f",
  borderColor: "#C8A96E",
  accentColor: "#C8A96E",
  titleText: "DIPLOMA DE FINALIZACIÓN",
  subtitleText: "Legión Jurídica certifica que",
  bodyText: "ha completado satisfactoriamente el curso",
  signatureName: "Pedro Tobar",
  signatureTitle: "Director Académico",
  signatureName2: "Dr. Ramírez",
  signatureTitle2: "Director Legión Jurídica",
  logoUrl: "https://legionjuridica.com/images/logo.svg",
  showBorder: true,
  showLogo: true,
};

interface DiplomaStore {
  template: DiplomaTemplate;
  updateTemplate: (updates: Partial<DiplomaTemplate>) => void;
  resetTemplate: () => void;
}

export const useDiplomaStore = create<DiplomaStore>()(
  persist(
    (set) => ({
      template: DEFAULT_TEMPLATE,
      updateTemplate: (updates) =>
        set((s) => ({ template: { ...s.template, ...updates } })),
      resetTemplate: () => set({ template: DEFAULT_TEMPLATE }),
    }),
    { name: "legion-diploma" }
  )
);

// Render diploma as HTML string (for preview and PDF)
export function renderDiplomaHtml(
  template: DiplomaTemplate,
  data: { nombre: string; curso: string; fecha: string; certificateId: string }
): string {
  return `
<div style="width:800px;height:566px;background:${template.bgColor};position:relative;font-family:Georgia,'Times New Roman',serif;overflow:hidden;${template.showBorder ? `border:3px solid ${template.borderColor};` : ""}">
  <!-- Corner ornaments -->
  <div style="position:absolute;top:16px;left:16px;right:16px;bottom:16px;border:1px solid ${template.borderColor}30;pointer-events:none"></div>
  <div style="position:absolute;top:24px;left:24px;width:40px;height:40px;border-top:2px solid ${template.accentColor};border-left:2px solid ${template.accentColor}"></div>
  <div style="position:absolute;top:24px;right:24px;width:40px;height:40px;border-top:2px solid ${template.accentColor};border-right:2px solid ${template.accentColor}"></div>
  <div style="position:absolute;bottom:24px;left:24px;width:40px;height:40px;border-bottom:2px solid ${template.accentColor};border-left:2px solid ${template.accentColor}"></div>
  <div style="position:absolute;bottom:24px;right:24px;width:40px;height:40px;border-bottom:2px solid ${template.accentColor};border-right:2px solid ${template.accentColor}"></div>

  <!-- Content -->
  <div style="position:absolute;inset:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    ${template.showLogo ? `<img src="${template.logoUrl}" width="48" height="48" style="margin-bottom:12px;opacity:0.8" />` : ""}

    <p style="margin:0;font-size:10px;color:${template.accentColor}80;letter-spacing:4px;text-transform:uppercase">${template.subtitleText}</p>

    <h1 style="margin:8px 0 16px;font-size:28px;font-weight:bold;color:${template.accentColor};letter-spacing:3px">${template.titleText}</h1>

    <div style="width:60px;height:1px;background:${template.accentColor}40;margin:0 auto 20px"></div>

    <p style="margin:0 0 6px;font-size:11px;color:${template.accentColor}60;letter-spacing:1px">${template.bodyText.split("{curso}")[0] || template.bodyText}</p>

    <p style="margin:0 0 8px;font-size:26px;color:#ffffff;font-weight:bold;max-width:600px;line-height:1.3">${data.nombre}</p>

    <p style="margin:0 0 6px;font-size:11px;color:${template.accentColor}60">${template.bodyText}</p>

    <p style="margin:4px 0 0;font-size:18px;color:${template.accentColor};font-weight:bold;font-style:italic;max-width:500px;line-height:1.3">"${data.curso}"</p>

    <p style="margin:12px 0 0;font-size:10px;color:${template.accentColor}40">Completado el ${data.fecha}</p>

    <!-- Signatures -->
    <div style="display:flex;gap:100px;margin-top:28px">
      <div style="text-align:center">
        <div style="width:120px;border-bottom:1px solid ${template.accentColor}40;margin-bottom:6px"></div>
        <p style="margin:0;font-size:12px;color:#ffffff;font-weight:bold">${template.signatureName}</p>
        <p style="margin:2px 0 0;font-size:9px;color:${template.accentColor}60">${template.signatureTitle}</p>
      </div>
      <div style="text-align:center">
        <div style="width:120px;border-bottom:1px solid ${template.accentColor}40;margin-bottom:6px"></div>
        <p style="margin:0;font-size:12px;color:#ffffff;font-weight:bold">${template.signatureName2}</p>
        <p style="margin:2px 0 0;font-size:9px;color:${template.accentColor}60">${template.signatureTitle2}</p>
      </div>
    </div>

    <!-- Verification -->
    <p style="margin:16px 0 0;font-size:8px;color:${template.accentColor}30;letter-spacing:1px">ID: ${data.certificateId} · Verificar en legionjuridica.com/verificar</p>
  </div>
</div>`;
}
