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

// Military camouflage SVG pattern (woodland colors)
const CAMO_PATTERN = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23384d2c'/%3E%3Cpath d='M0,80 Q40,20 90,60 T180,40 Q220,90 280,50 T400,90 L400,160 Q340,130 280,170 T160,150 Q100,200 40,160 T0,180 Z' fill='%23556b3a'/%3E%3Cpath d='M50,0 Q120,40 180,10 T320,30 L400,0 L400,60 Q340,90 270,60 T130,80 Q70,50 0,70 L0,0 Z' fill='%232a3d22'/%3E%3Cpath d='M0,240 Q80,210 150,250 T290,230 Q350,270 400,240 L400,320 Q330,340 260,310 T120,330 Q60,290 0,310 Z' fill='%23556b3a'/%3E%3Cpath d='M0,360 Q70,320 140,360 T280,340 Q350,380 400,350 L400,400 L0,400 Z' fill='%232a3d22'/%3E%3Cpath d='M120,100 Q150,80 180,110 T240,100 Q260,130 220,150 T150,140 Q110,130 120,100 Z' fill='%231a2416'/%3E%3Cpath d='M280,180 Q320,160 350,200 T400,220 L400,280 Q360,270 320,240 T280,220 Q260,200 280,180 Z' fill='%231a2416'/%3E%3Cpath d='M20,180 Q60,160 90,200 T140,220 Q130,260 80,250 T20,230 Q0,210 20,180 Z' fill='%231a2416'/%3E%3C/svg%3E`;

// Render diploma as HTML string (for preview and PDF)
export function renderDiplomaHtml(
  template: DiplomaTemplate,
  data: { nombre: string; curso: string; fecha: string; certificateId: string }
): string {
  const camoBg = `url("data:image/svg+xml;utf8,${CAMO_PATTERN}")`;

  return `
<div style="width:800px;height:566px;position:relative;font-family:Georgia,'Times New Roman',serif;overflow:hidden;${template.showBorder ? `border:4px double ${template.borderColor};` : ""};box-shadow:0 20px 60px rgba(0,0,0,0.5)">
  <!-- Camo background layer -->
  <div style="position:absolute;inset:0;background:${camoBg};background-size:400px 400px;background-repeat:repeat;opacity:0.55"></div>

  <!-- Dark overlay for readability -->
  <div style="position:absolute;inset:0;background:linear-gradient(135deg,${template.bgColor}e6 0%,${template.bgColor}cc 40%,${template.bgColor}e6 100%)"></div>

  <!-- Vignette effect -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,${template.bgColor}99 100%)"></div>

  <!-- Inner decorative border -->
  <div style="position:absolute;top:18px;left:18px;right:18px;bottom:18px;border:1px solid ${template.borderColor}40;pointer-events:none"></div>
  <div style="position:absolute;top:22px;left:22px;right:22px;bottom:22px;border:1px solid ${template.borderColor}20;pointer-events:none"></div>

  <!-- Corner ornaments with stars -->
  <div style="position:absolute;top:32px;left:32px;width:48px;height:48px;border-top:2px solid ${template.accentColor};border-left:2px solid ${template.accentColor}"></div>
  <div style="position:absolute;top:32px;right:32px;width:48px;height:48px;border-top:2px solid ${template.accentColor};border-right:2px solid ${template.accentColor}"></div>
  <div style="position:absolute;bottom:32px;left:32px;width:48px;height:48px;border-bottom:2px solid ${template.accentColor};border-left:2px solid ${template.accentColor}"></div>
  <div style="position:absolute;bottom:32px;right:32px;width:48px;height:48px;border-bottom:2px solid ${template.accentColor};border-right:2px solid ${template.accentColor}"></div>

  <!-- Corner stars -->
  <div style="position:absolute;top:38px;left:38px;color:${template.accentColor};font-size:14px;line-height:1">★</div>
  <div style="position:absolute;top:38px;right:38px;color:${template.accentColor};font-size:14px;line-height:1">★</div>
  <div style="position:absolute;bottom:38px;left:38px;color:${template.accentColor};font-size:14px;line-height:1">★</div>
  <div style="position:absolute;bottom:38px;right:38px;color:${template.accentColor};font-size:14px;line-height:1">★</div>

  <!-- Content -->
  <div style="position:absolute;inset:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    ${template.showLogo ? `
    <div style="position:relative;margin-bottom:14px">
      <div style="position:absolute;inset:-8px;border:1px solid ${template.accentColor}50;border-radius:50%"></div>
      <div style="width:60px;height:60px;background:${template.bgColor};border:2px solid ${template.accentColor};border-radius:50%;display:flex;align-items:center;justify-content:center">
        <img src="${template.logoUrl}" width="40" height="40" style="opacity:0.95" />
      </div>
    </div>
    ` : ""}

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div style="width:40px;height:1px;background:${template.accentColor}60"></div>
      <p style="margin:0;font-size:10px;color:${template.accentColor}cc;letter-spacing:4px;text-transform:uppercase;font-weight:bold">Legión Jurídica</p>
      <div style="width:40px;height:1px;background:${template.accentColor}60"></div>
    </div>

    <h1 style="margin:0 0 8px;font-size:30px;font-weight:bold;color:${template.accentColor};letter-spacing:4px;text-shadow:0 2px 8px rgba(0,0,0,0.6)">${template.titleText}</h1>

    <div style="display:flex;align-items:center;gap:8px;margin:0 auto 18px">
      <div style="width:80px;height:1px;background:${template.accentColor}60"></div>
      <div style="color:${template.accentColor};font-size:10px;line-height:1">◆</div>
      <div style="width:80px;height:1px;background:${template.accentColor}60"></div>
    </div>

    <p style="margin:0 0 6px;font-size:11px;color:${template.accentColor}aa;letter-spacing:2px;text-transform:uppercase;font-style:italic">${template.subtitleText}</p>

    <p style="margin:0 0 14px;font-size:30px;color:#ffffff;font-weight:bold;max-width:620px;line-height:1.3;text-shadow:0 2px 8px rgba(0,0,0,0.6);font-family:Georgia,serif">${data.nombre}</p>

    <p style="margin:0 0 10px;font-size:12px;color:${template.accentColor}99;letter-spacing:0.5px">${template.bodyText}</p>

    <p style="margin:0;font-size:21px;color:${template.accentColor};font-weight:bold;font-style:italic;max-width:520px;line-height:1.3;text-shadow:0 2px 6px rgba(0,0,0,0.5)">"${data.curso}"</p>

    <p style="margin:16px 0 0;font-size:10px;color:${template.accentColor}80;letter-spacing:1px">COMPLETADO EL ${data.fecha.toUpperCase()}</p>

    <!-- Signatures -->
    <div style="display:flex;gap:100px;margin-top:26px">
      <div style="text-align:center">
        <div style="width:130px;border-bottom:1px solid ${template.accentColor}70;margin-bottom:6px"></div>
        <p style="margin:0;font-size:12px;color:#ffffff;font-weight:bold;letter-spacing:0.5px">${template.signatureName}</p>
        <p style="margin:3px 0 0;font-size:9px;color:${template.accentColor}90;letter-spacing:1px;text-transform:uppercase">${template.signatureTitle}</p>
      </div>
      <div style="text-align:center">
        <div style="width:130px;border-bottom:1px solid ${template.accentColor}70;margin-bottom:6px"></div>
        <p style="margin:0;font-size:12px;color:#ffffff;font-weight:bold;letter-spacing:0.5px">${template.signatureName2}</p>
        <p style="margin:3px 0 0;font-size:9px;color:${template.accentColor}90;letter-spacing:1px;text-transform:uppercase">${template.signatureTitle2}</p>
      </div>
    </div>

    <!-- Verification -->
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid ${template.accentColor}20;width:60%">
      <p style="margin:0;font-size:8px;color:${template.accentColor}60;letter-spacing:1.5px;font-family:'Courier New',monospace">ID: ${data.certificateId} · VERIFICAR EN LEGIONJURIDICA.COM/VERIFICAR</p>
    </div>
  </div>
</div>`;
}
