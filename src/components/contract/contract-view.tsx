"use client";

import Image from "next/image";
import type { Clausula } from "./clause-editor";
import type { PlanConfig } from "./plan-editor";

interface ContractData {
  nombre: string;
  cedula: string;
  telefono: string;
  telefono2?: string;
  email: string;
  estado_civil: string;
  grado: string;
  fuerza: string;
  unidad: string;
  direccion: string;
  ciudad: string;
  departamento?: string;
  plan: string;
  plan_precio: string;
  beneficiarios?: { nombre: string; parentesco: string; cedula: string }[];
  firma_data?: string;
  foto_data?: string;
  cedula_frente?: string;
  cedula_reverso?: string;
  hash?: string;
  fecha?: string;
}

interface PlantillaConfig {
  empresa_nombre?: string;
  empresa_nit?: string;
  ficha_titulo?: string;
  intro_contrato?: string;
  clausulas_contrato?: Clausula[];
  secciones_libranza?: Clausula[];
  planes?: PlanConfig[];
}

// Defaults used when no plantilla is provided
const DEFAULT_CLAUSULAS: Clausula[] = [
  { titulo: "CLÁUSULA PRIMERA — OBJETO", contenido: "EL PRESTADOR se obliga a prestar los servicios de asesoría y asistencia jurídica integral contemplados en el plan seleccionado por EL SUSCRIPTOR, conforme a los términos y condiciones descritos en la ficha de vinculación que hace parte integral de este contrato." },
  { titulo: "CLÁUSULA SEGUNDA — DURACIÓN", contenido: "El presente contrato tendrá una duración de cuarenta y ocho (48) meses contados a partir de la fecha de firma. Se renovará automáticamente por períodos iguales salvo que alguna de las partes manifieste por escrito su voluntad de no renovarlo con al menos treinta (30) días de anticipación." },
  { titulo: "CLÁUSULA TERCERA — VALOR Y FORMA DE PAGO", contenido: "EL SUSCRIPTOR pagará mensualmente la suma pactada en pesos colombianos, mediante descuento directo por libranza, transferencia electrónica o el medio que las partes acuerden." },
  { titulo: "CLÁUSULA CUARTA — OBLIGACIONES DEL PRESTADOR", contenido: "EL PRESTADOR se compromete a: a) Brindar asesoría jurídica en las áreas cubiertas por el plan contratado; b) Atender las consultas en un plazo máximo de 24 horas hábiles; c) Mantener la confidencialidad de la información suministrada por EL SUSCRIPTOR; d) Designar abogados titulados y con tarjeta profesional vigente." },
  { titulo: "CLÁUSULA QUINTA — OBLIGACIONES DEL SUSCRIPTOR", contenido: "EL SUSCRIPTOR se compromete a: a) Pagar oportunamente la cuota mensual del plan; b) Suministrar información veraz y completa; c) Hacer uso de los servicios de buena fe y conforme al plan contratado." },
  { titulo: "CLÁUSULA SEXTA — TERMINACIÓN", contenido: "El contrato podrá terminarse por: a) Mutuo acuerdo de las partes; b) Incumplimiento de las obligaciones por cualquiera de las partes; c) Vencimiento del término sin renovación; d) Mora superior a dos (2) meses en el pago de la cuota mensual." },
  { titulo: "CLÁUSULA SÉPTIMA — DATOS PERSONALES", contenido: "EL SUSCRIPTOR autoriza el tratamiento de sus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios, para los fines exclusivos de la ejecución del presente contrato." },
];

const DEFAULT_LIBRANZA: Clausula[] = [
  { titulo: "AUTORIZACIÓN", contenido: "Autorizo de manera libre, voluntaria e irrevocable a mi pagaduría para que descuente de mi asignación mensual la suma pactada a favor de la empresa prestadora, por concepto de prestación de servicios jurídicos del plan seleccionado." },
  { titulo: "VIGENCIA", contenido: "Esta autorización se otorga en los términos de la Ley 1527 de 2012, y tendrá vigencia mientras subsista la obligación contractual. Declaro que este descuento no afecta mi mínimo vital y que mi capacidad de endeudamiento por libranza lo permite." },
];

const DEFAULT_PLANES: PlanConfig[] = [
  { nombre: "Base", precio: "39.000", caracteristicas: ["Asesoría jurídica ilimitada (WhatsApp, llamada)", "Revisión de documentos (1/mes)", "Derecho de petición incluido"] },
  { nombre: "Plus", precio: "51.000", caracteristicas: ["Todo lo del Plan Base", "2 revisiones de documentos/mes", "Acompañamiento a audiencias (1/semestre)", "Consulta familiar incluida"] },
  { nombre: "Élite", precio: "69.000", caracteristicas: ["Todo lo del Plan Plus", "Documentos ilimitados", "Audiencias ilimitadas", "Línea prioritaria 24/7", "Cobertura grupo familiar"] },
];

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 text-xs min-w-[100px] flex-shrink-0">{label}:</span>
      <span className="text-gray-900 text-xs font-medium">{value || "—"}</span>
    </div>
  );
}

function replaceVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Renders text with **bold** support and preserves line breaks
function RichText({ text, className = "" }: { text: string; className?: string }) {
  // Escape HTML first to prevent XSS, then apply markdown
  const escaped = escapeHtml(text);
  // Convert **bold** to <strong>
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Preserve line breaks
  const html = withBold.replace(/\n/g, "<br/>");
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

type ContractSection = "ficha" | "contrato" | "libranza";

interface ContractViewProps {
  data: ContractData;
  plantilla?: PlantillaConfig;
  readOnly?: boolean;
  sections?: ContractSection[];
}

export default function ContractView({ data, plantilla, readOnly = false, sections }: ContractViewProps) {
  const showFicha = !sections || sections.includes("ficha");
  const showContrato = !sections || sections.includes("contrato");
  const showLibranza = !sections || sections.includes("libranza");
  const fecha = data.fecha || new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

  const empresa = plantilla?.empresa_nombre || "CA CONSULTORES SAS";
  const nit = plantilla?.empresa_nit || "901.234.567-8";
  const fichaTitulo = plantilla?.ficha_titulo || "FICHA DE VINCULACIÓN";
  const clausulas = plantilla?.clausulas_contrato?.length ? plantilla.clausulas_contrato : DEFAULT_CLAUSULAS;
  const libranza = plantilla?.secciones_libranza?.length ? plantilla.secciones_libranza : DEFAULT_LIBRANZA;
  const planes = plantilla?.planes?.length ? plantilla.planes : DEFAULT_PLANES;

  const introText = replaceVars(
    plantilla?.intro_contrato || "Entre los suscritos, de una parte {empresa}, sociedad comercial identificada con NIT {nit}, representada legalmente, en adelante EL PRESTADOR, y de otra parte {nombre}, identificado(a) con cédula de ciudadanía No. {cedula}, en adelante EL SUSCRIPTOR, se celebra el presente contrato que se regirá por las siguientes cláusulas:",
    { empresa, nit, nombre: data.nombre || "_______________", cedula: data.cedula || "_______________" }
  );

  // Build price lookup from planes
  const planPrices: Record<string, string> = {};
  const planFeatures: Record<string, string[]> = {};
  planes.forEach((p) => {
    planPrices[p.nombre] = p.precio;
    planFeatures[p.nombre] = p.caracteristicas;
  });

  return (
    <div className="space-y-6 text-sm">
      {/* ═══ PÁGINA 1: FICHA DE DATOS ═══ */}
      {showFicha && (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="text-center border-b border-gray-200 pb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image src="/images/logo.svg" alt="Legión Jurídica" width={32} height={32} className="print-logo" />
            <div className="flex items-center gap-1">
              <span className="font-black text-base tracking-[0.12em] text-gray-900 print-logo-text">LEGIÓN</span>
              <span className="font-black text-base tracking-[0.12em] text-oro print-logo-oro">JURÍDICA</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs">{empresa} — NIT {nit}</p>
          <p className="text-gray-900 font-bold text-sm mt-1">{fichaTitulo}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-oro text-xs font-bold uppercase tracking-wider">Datos Personales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
            <Field label="Nombre completo" value={data.nombre} />
            <Field label="Cédula" value={data.cedula} />
            <Field label="Teléfono 1" value={data.telefono} />
            <Field label="Teléfono 2" value={data.telefono2 || ""} />
            <Field label="Estado civil" value={data.estado_civil} />
            <Field label="Email" value={data.email} />
            <Field label="Grado" value={data.grado} />
            <Field label="Fuerza" value={data.fuerza} />
            <Field label="Unidad" value={data.unidad} />
            <Field label="Dirección" value={data.direccion} />
            <Field label="Ciudad" value={data.ciudad} />
            <Field label="Departamento" value={data.departamento || ""} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-oro text-xs font-bold uppercase tracking-wider">Plan Seleccionado</h3>
          <div className="grid grid-cols-3 gap-2">
            {planes.map((p) => {
              const precio = p.precio_alianza || p.precio;
              return (
                <div
                  key={p.nombre}
                  className={`rounded-lg border p-3 text-center transition-all ${
                    data.plan === p.nombre
                      ? "border-oro bg-amber-50"
                      : "border-gray-200 bg-gray-50 opacity-50"
                  }`}
                >
                  <p className="text-gray-900 font-bold text-xs">{p.nombre}</p>
                  <p className="text-oro text-sm font-bold">${precio}</p>
                  <p className="text-gray-400 text-[10px]">/mes</p>
                </div>
              );
            })}
          </div>
          {data.plan && planFeatures[data.plan] && (
            <ul className="space-y-1 pl-2">
              {planFeatures[data.plan].map((f) => (
                <li key={f} className="text-gray-600 text-xs flex items-start gap-1.5">
                  <span className="text-green-600 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        {data.beneficiarios && data.beneficiarios.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-oro text-xs font-bold uppercase tracking-wider">Beneficiarios</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-gray-500 px-3 py-1.5 font-medium">Nombre</th>
                    <th className="text-left text-gray-500 px-3 py-1.5 font-medium">Parentesco</th>
                    <th className="text-left text-gray-500 px-3 py-1.5 font-medium">Cédula</th>
                  </tr>
                </thead>
                <tbody>
                  {data.beneficiarios.map((b, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="text-gray-900 px-3 py-1.5">{b.nombre}</td>
                      <td className="text-gray-600 px-3 py-1.5">{b.parentesco}</td>
                      <td className="text-gray-600 px-3 py-1.5">{b.cedula}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      )}

      {/* ═══ PÁGINA 2: CLÁUSULAS DEL CONTRATO ═══ */}
      {showContrato && (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="text-center border-b border-gray-200 pb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image src="/images/logo.svg" alt="Legión Jurídica" width={28} height={28} className="print-logo" />
            <div className="flex items-center gap-1">
              <span className="font-black text-sm tracking-[0.12em] text-gray-900 print-logo-text">LEGIÓN</span>
              <span className="font-black text-sm tracking-[0.12em] text-oro print-logo-oro">JURÍDICA</span>
            </div>
          </div>
          <h2 className="text-gray-900 font-bold text-sm">CONTRATO DE PRESTACIÓN DE SERVICIOS JURÍDICOS</h2>
          <p className="text-gray-500 text-xs mt-1">{empresa} — NIT {nit}</p>
        </div>

        <div className="space-y-3 text-gray-700 text-xs leading-relaxed">
          <RichText text={introText} className="block whitespace-pre-line" />

          {clausulas.map((c, i) => (
            <div key={i}>
              <p className="text-oro font-bold text-xs mb-1">{c.titulo}</p>
              <RichText text={c.contenido} className="block whitespace-pre-line" />
            </div>
          ))}

          <p className="pt-2">
            En constancia se firma en la ciudad de <strong className="text-gray-900">{data.ciudad || "_______________"}</strong>, a los {fecha}.
          </p>
        </div>
      </div>

      )}

      {/* ═══ PÁGINA 3: LIBRANZA + FIRMA ═══ */}
      {showLibranza && (
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="text-center border-b border-gray-200 pb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Image src="/images/logo.svg" alt="Legión Jurídica" width={28} height={28} className="print-logo" />
            <div className="flex items-center gap-1">
              <span className="font-black text-sm tracking-[0.12em] text-gray-900 print-logo-text">LEGIÓN</span>
              <span className="font-black text-sm tracking-[0.12em] text-oro print-logo-oro">JURÍDICA</span>
            </div>
          </div>
          <h2 className="text-gray-900 font-bold text-sm">AUTORIZACIÓN DE DESCUENTO POR LIBRANZA</h2>
          <p className="text-gray-500 text-xs mt-1">{empresa} — NIT {nit}</p>
          <p className="text-gray-500 text-xs mt-0.5">Ley 1527 de 2012</p>
        </div>

        <div className="text-gray-700 text-xs leading-relaxed space-y-3">
          {libranza.map((s, i) => (
            <div key={i}>
              {libranza.length > 1 && <p className="text-oro font-bold text-xs mb-1">{s.titulo}</p>}
              <RichText text={s.contenido} className="block whitespace-pre-line" />
            </div>
          ))}
        </div>

        {/* Firma + Foto section */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 space-y-2">
              <p className="text-gray-500 text-xs font-medium text-center">Firma del Suscriptor</p>
              {data.firma_data ? (
                <div className="border border-gray-200 rounded-lg bg-white p-2 h-28 flex items-center justify-center">
                  <img src={data.firma_data} alt="Firma" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg h-28 flex items-center justify-center">
                  <span className="text-gray-300 text-xs">Pendiente de firma</span>
                </div>
              )}
              <p className="text-gray-900 text-xs text-center font-medium">{data.nombre}</p>
              <p className="text-gray-500 text-xs text-center">C.C. {data.cedula}</p>
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-gray-500 text-xs font-medium text-center">Foto del Suscriptor</p>
              {data.foto_data ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden h-28 w-28 mx-auto">
                  <img src={data.foto_data} alt="Foto" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg h-28 w-28 mx-auto flex items-center justify-center">
                  <span className="text-gray-300 text-xs">Pendiente</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cédula adjunta */}
        {(data.cedula_frente || data.cedula_reverso) && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-gray-500 text-xs font-medium text-center mb-3">Documento de Identidad</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {data.cedula_frente && (
                <div className="space-y-1">
                  <div className="border border-gray-200 rounded-lg overflow-hidden aspect-[8.5/5.4]">
                    <img src={data.cedula_frente} alt="Cédula frente" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-gray-400 text-[10px] text-center">Frente</p>
                </div>
              )}
              {data.cedula_reverso && (
                <div className="space-y-1">
                  <div className="border border-gray-200 rounded-lg overflow-hidden aspect-[8.5/5.4]">
                    <img src={data.cedula_reverso} alt="Cédula reverso" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-gray-400 text-[10px] text-center">Reverso</p>
                </div>
              )}
            </div>
          </div>
        )}

        {data.hash && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <p className="text-gray-400 text-[10px] text-center font-mono break-all">
              Hash de autenticidad: {data.hash}
            </p>
            <p className="text-gray-400 text-[9px] text-center mt-0.5">
              Firmado digitalmente el {fecha}
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

export type { ContractData, PlantillaConfig };
