/**
 * Generate presentation PDFs for "Inversiones para Principiantes" course
 * and upload them to Supabase Storage, then update the lessons.
 *
 * Run: node scripts/generate-slides.mjs
 */

import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://ezytsyqebczlpwbahmyw.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eXRzeXFlYmN6bHB3YmFobXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcyMjYxMiwiZXhwIjoyMDg5Mjk4NjEyfQ.H7iqybXXL2V0qRK79AKOdkP7pUdjpa2fdVaq-djdpZU";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = "avatars";

// ── Color palette ──
const COLORS = {
  darkBg: "#0F1923",
  cardBg: "#182633",
  oro: "#D4A843",
  oroLight: "#E8C96A",
  white: "#FFFFFF",
  beige: "#F5F0E8",
  beigeLight: "#FAF7F2",
  accent: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  purple: "#A855F7",
  gray: "#94A3B8",
  grayDark: "#64748B",
};

// ── Slide definitions per lesson ──
const LESSONS_SLIDES = [
  // ═══ MÓDULO 1 ═══
  {
    lessonTitle: "Bienvenida: Qué vas a aprender en este curso",
    slides: [
      {
        title: "¿Qué vas a aprender?",
        bullets: [
          "1. Por qué la inflación se come tus ahorros",
          "2. Cómo organizar tus finanzas",
          "3. Qué es un CDT y cómo funciona",
          "4. Comparar CDTs entre bancos colombianos",
          "5. Abrir tu primer CDT paso a paso",
        ],
        footer: "Inversiones para Principiantes · Pedro Tobar",
        style: "bullets",
      },
    ],
  },
  {
    lessonTitle: "La inflación se está comiendo tu plata",
    slides: [
      {
        title: "Inflación en Colombia",
        subtitle: "Últimos 5 años",
        rows: [
          ["2022", "13.12%", "🔴"],
          ["2023", "9.28%", "🟠"],
          ["2024", "5.20%", "🟡"],
          ["2025", "~5.00%", "🟡"],
          ["Cuenta ahorro", "0.5 - 2%", "⚪"],
        ],
        footer: "Fuente: DANE · Banco de la República",
        style: "table",
      },
      {
        title: "Tu plata pierde valor cada año",
        subtitle: "Con $10 millones en cuenta de ahorros",
        bigNumber: "- $300.000 a $450.000",
        bigLabel: "pérdida de poder adquisitivo por año",
        detail: "Inflación ~5% vs Cuenta ahorros ~1.5%",
        footer: "Diferencia real: -3.5% anual",
        style: "bigstat",
      },
    ],
  },
  {
    lessonTitle: "Ahorrar vs Invertir: No es lo mismo",
    slides: [
      {
        title: "Ahorrar vs Invertir",
        leftCol: { header: "💰 Ahorrar", items: ["Guardar plata", "Liquidez total", "No crece", "Corto plazo", "Fondo emergencia"] },
        rightCol: { header: "📈 Invertir", items: ["Plata trabaja", "Menor liquidez", "Genera rendimientos", "Mediano/largo plazo", "CDTs, FICs, acciones"] },
        footer: "Necesitas los dos: ahorros líquidos + inversiones",
        style: "comparison",
      },
      {
        title: "¿Para qué cada uno?",
        bullets: [
          "AHORRAR → Cuota colegio, vacaciones, imprevistos",
          "INVERTIR → Vivienda, universidad hijos, pensión",
          "",
          "🎯 Fondo de emergencia en ahorro líquido",
          "🎯 El resto en inversiones que ganen a la inflación",
          "🎯 El CDT es el primer escalón perfecto",
        ],
        footer: "El CDT: tu puerta de entrada al mundo de inversiones",
        style: "bullets",
      },
    ],
  },
  // ═══ MÓDULO 2 ═══
  {
    lessonTitle: "Cuánto ganas, cuánto gastas, cuánto te queda",
    slides: [
      {
        title: "Tu flujo de caja personal",
        subtitle: "Ingresos mensuales",
        bullets: [
          "✅ Salario neto (después de descuentos)",
          "✅ Horas extra y bonificaciones regulares",
          "✅ Primas (distribuir mensualmente)",
          "",
          "Soldado/Patrullero: $1.8M - $3.5M",
          "Según grado y antigüedad",
        ],
        footer: "Ejercicio: anota tu ingreso neto mensual",
        style: "bullets",
      },
      {
        title: "Tipos de gastos",
        subtitle: "Identifica cada categoría",
        rows: [
          ["Fijos", "Arriendo, servicios, transporte, seguros", ""],
          ["Variables", "Mercado, comida fuera, ropa, salidas", ""],
          ["Hormiga", "Tinto $2.000/día = $720.000/año", "⚠️"],
        ],
        footer: "$720.000 en un CDT al 11% = $79.000 de intereses",
        style: "table",
      },
      {
        title: "La regla 50 - 30 - 20",
        subtitle: "Ejemplo con salario de $2.500.000",
        rows: [
          ["50%", "$1.250.000", "Necesidades básicas"],
          ["30%", "$750.000", "Gastos personales"],
          ["20%", "$500.000", "Ahorro e inversión"],
        ],
        footer: "Empieza con lo que puedas, así sea $100.000",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Tu fondo de emergencia: la base de todo",
    slides: [
      {
        title: "Fondo de emergencia",
        subtitle: "Tu red de seguridad financiera",
        bigNumber: "3 a 6 meses",
        bigLabel: "de gastos fijos mensuales",
        detail: "Gastos de $1.5M/mes → Fondo de $4.5M a $9M",
        footer: "NO es para vacaciones ni antojos",
        style: "bigstat",
      },
      {
        title: "¿Dónde guardar el fondo?",
        subtitle: "Opciones líquidas en Colombia",
        rows: [
          ["Nu Bank", "~12.5% EA", "Primeros $10M"],
          ["Lulo Bank", "~10% EA", "Sin restricción"],
          ["FIC corto plazo", "8-10% EA", "Retiro 1-3 días"],
          ["Banco tradicional", "0.5-2% EA", "❌ Evitar"],
        ],
        footer: "El fondo NO es inversión, es un seguro",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Deudas buenas vs deudas malas",
    slides: [
      {
        title: "Deudas buenas vs malas",
        leftCol: { header: "✅ Buenas", items: ["Crédito hipotecario", "Crédito educativo", "Crédito para negocio", "Construyen patrimonio"] },
        rightCol: { header: "❌ Malas", items: ["Tarjeta de crédito rotativa", "Crédito de consumo", "Gota a gota", "Tasa usura: ~27% EA"] },
        footer: "Pagar deuda al 27% = ganar 27% de retorno",
        style: "comparison",
      },
      {
        title: "Orden de prioridades",
        bullets: [
          "1️⃣  Pagar deudas malas (mayor tasa primero)",
          "2️⃣  Armar fondo de emergencia",
          "3️⃣  Empezar a invertir (CDT)",
          "",
          "💡 Truco: mitad de primas a deuda,",
          "   mitad al fondo o CDT",
        ],
        footer: "En un año puedes estar libre de deudas malas",
        style: "bullets",
      },
    ],
  },
  // ═══ MÓDULO 3 ═══
  {
    lessonTitle: "¿Qué es un CDT y cómo funciona?",
    slides: [
      {
        title: "CDT: Certificado de Depósito a Término",
        subtitle: "Tú le prestas plata al banco",
        bigNumber: "$5.000.000",
        bigLabel: "al 10.5% EA a 360 días",
        detail: "Recibes: $5.000.000 + $525.000 de intereses",
        footer: "Tasa fija · Sin sorpresas · Garantizado",
        style: "bigstat",
      },
      {
        title: "Componentes de un CDT",
        rows: [
          ["Capital", "Cuánta plata inviertes", "$5.000.000"],
          ["Tasa", "Cuánto te pagan", "10.5% EA"],
          ["Plazo", "Por cuánto tiempo", "30 a 1.800 días"],
          ["Pago intereses", "Cuándo cobras", "Vencimiento / Mes / Trim"],
        ],
        footer: "La plata queda amarrada hasta el vencimiento",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Tasas de interés: EA, NMV y cómo comparar",
    slides: [
      {
        title: "EA vs NMV",
        leftCol: { header: "EA", items: ["Efectiva Anual", "Incluye interés compuesto", "Tasa REAL por año", "Usa esta para comparar"] },
        rightCol: { header: "NMV", items: ["Nominal Mes Vencido", "Tasa nominal / 12", "10% NMV ≈ 10.47% EA", "Parece menor pero no lo es"] },
        footer: "SIEMPRE compara en EA · Bancos deben mostrarla",
        style: "comparison",
      },
      {
        title: "Factores que afectan la tasa",
        bullets: [
          "📊 Mayor monto → Mejor tasa",
          "📅 Mayor plazo → Mejor tasa",
          "🏦 Banco digital → Generalmente mejor tasa",
          "📉 Tasa del Banco de la República baja → CDTs bajan",
          "",
          "🎯 Regla: compara SIEMPRE en EA entre 3+ bancos",
        ],
        footer: "Las tasas cambian constantemente — revisa antes de abrir",
        style: "bullets",
      },
    ],
  },
  {
    lessonTitle: "CDT vs Cuenta de ahorros vs FIC",
    slides: [
      {
        title: "Comparativa de opciones",
        rows: [
          ["Cuenta ahorros", "0.5-2% EA", "Inmediata", "Muy bajo"],
          ["Cuenta digital", "10-12.5% EA", "Inmediata", "Muy bajo"],
          ["CDT", "9-12% EA", "Al vencimiento", "Cero"],
          ["FIC renta fija", "8-11% EA", "3-5 días", "Bajo"],
        ],
        headers: ["Producto", "Rendimiento", "Liquidez", "Riesgo"],
        footer: "Cada producto tiene su lugar en tu estrategia",
        style: "table",
      },
      {
        title: "¿Dónde poner tu plata?",
        subtitle: "Los tres niveles",
        bullets: [
          "🟢 Emergencia → Cuenta digital (Nu, Lulo)",
          "🟡 Inversión segura → CDT (tasa fija)",
          "🔵 Diversificación → FIC renta fija",
          "",
          "💡 Este curso se enfoca en CDTs:",
          "   punto de partida perfecto",
        ],
        footer: "No pongas toda la plata en un solo lugar",
        style: "bullets",
      },
      {
        title: "Ejemplo práctico: $10M disponibles",
        rows: [
          ["Fondo emergencia", "$4.000.000", "Cuenta Nu (12.5% EA)"],
          ["CDT 6 meses", "$3.000.000", "Pibank (11% EA)"],
          ["CDT 12 meses", "$3.000.000", "Pibank (11.5% EA)"],
        ],
        footer: "Rendimiento estimado anual: ~$1.100.000",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Fogafín: tu plata está protegida",
    slides: [
      {
        title: "Fogafín protege tu dinero",
        subtitle: "Fondo de Garantías de Instituciones Financieras",
        bigNumber: "$50.000.000",
        bigLabel: "máximo cubierto por persona, por banco",
        detail: "Cubre: cuentas de ahorro, corrientes y CDTs",
        footer: "Si el banco quiebra, Fogafín te devuelve tu plata",
        style: "bigstat",
      },
      {
        title: "Estrategia con más de $50M",
        subtitle: "Distribuir entre bancos",
        bullets: [
          "🏦 Banco A: hasta $50M → Cubierto",
          "🏦 Banco B: hasta $50M → Cubierto",
          "🏦 Banco C: hasta $50M → Cubierto",
          "",
          "⚡ Probabilidad de quiebra de banco grande",
          "   en Colombia: extremadamente baja",
          "🔒 Supervisión: Superfinanciera de Colombia",
        ],
        footer: "CDT = tasa fija + Fogafín = la inversión más segura",
        style: "bullets",
      },
    ],
  },
  // ═══ MÓDULO 4 ═══
  {
    lessonTitle: "Comparar CDTs en Colombia: ¿Cuál banco paga más?",
    slides: [
      {
        title: "Tasas CDT a 360 días ($5M) — 2026",
        rows: [
          ["Pibank", "11.0% EA", "⭐⭐⭐"],
          ["Banco Finandina", "10.8% EA", "⭐⭐⭐"],
          ["RappiPay", "10.5% EA", "⭐⭐"],
          ["Bancolombia", "9.5% EA", "⭐⭐"],
          ["Davivienda", "9.3% EA", "⭐⭐"],
        ],
        headers: ["Banco", "Tasa EA", "Rating"],
        footer: "Tasas aproximadas · Verificar en cada banco",
        style: "table",
      },
      {
        title: "¿Qué más considerar?",
        rows: [
          ["Monto mínimo", "Pibank: desde $100K", ""],
          ["Facilidad", "Digitales: desde la app", ""],
          ["Solidez", "Todos regulados por Superfinanciera", ""],
          ["Fogafín", "Todos cubiertos hasta $50M", ""],
        ],
        footer: "Recomendación: empieza con banco digital por tasa y facilidad",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Requisitos y documentos para abrir un CDT",
    slides: [
      {
        title: "Requisitos para abrir un CDT",
        bullets: [
          "📄 Cédula de ciudadanía vigente",
          "   (Cédula militar también funciona)",
          "",
          "🏦 Cuenta en el banco (o abrirla al tiempo)",
          "",
          "💰 Dinero disponible para invertir",
          "",
          "📝 Formulario de vinculación",
          "   (conocimiento del cliente)",
          "",
          "⚠️  Servidores públicos: declaración PEP",
          "   (aplica más para altos rangos)",
        ],
        footer: "En bancos digitales todo se hace desde el celular",
        style: "bullets",
      },
    ],
  },
  {
    lessonTitle: "Demo: Abrir tu CDT digital paso a paso",
    slides: [
      {
        title: "Pasos 1 a 3: Preparación",
        bullets: [
          "1️⃣  Descarga la app del banco elegido",
          "",
          "2️⃣  Crea tu cuenta:",
          "    • Número de cédula",
          "    • Correo electrónico",
          "    • Número de celular",
          "    • Selfie + foto de cédula",
          "",
          "3️⃣  Espera aprobación",
          "    (minutos a 24 horas)",
        ],
        footer: "Todo desde tu celular, sin ir a ninguna oficina",
        style: "bullets",
      },
      {
        title: "Pasos 4 a 6: Apertura",
        bullets: [
          "4️⃣  Transfiere el dinero",
          "    PSE / Transferencia / Transfiya",
          "",
          "5️⃣  Ve a sección de Inversiones / CDT",
          "    en el menú principal de la app",
          "",
          "6️⃣  Elige condiciones:",
          "    • Monto a invertir",
          "    • Plazo (90, 180, 360 días...)",
          "    • Pago de intereses (vencimiento / mensual)",
        ],
        footer: "Paso 6 es el más importante — compara antes de elegir",
        style: "bullets",
      },
      {
        title: "Pasos 7 y 8: Confirmación",
        bullets: [
          "7️⃣  Revisa el resumen:",
          "    • Monto, tasa, plazo",
          "    • Fecha de vencimiento",
          "    • Cuánto recibirás al final",
          "",
          "8️⃣  Confirma la operación",
          "    • Acepta términos y condiciones",
          "    • Código de verificación SMS",
          "",
          "🎉 ¡CDT abierto!",
          "📅 Marca la fecha de vencimiento",
        ],
        footer: "Recibes certificado digital en la app",
        style: "bullets",
      },
    ],
  },
  {
    lessonTitle: "Impuestos: Retención en la fuente y 4x1000",
    slides: [
      {
        title: "Retención en la fuente",
        subtitle: "Anticipo de impuesto de renta",
        rows: [
          ["CDT > 1 año", "4%", "Sobre rendimientos"],
          ["CDT < 1 año", "7%", "Sobre rendimientos"],
        ],
        headers: ["Plazo", "Retención", "Base"],
        footer: "No es pérdida: se descuenta en tu declaración de renta",
        style: "table",
      },
      {
        title: "GMF: 4 por mil",
        subtitle: "Gravamen a Movimientos Financieros",
        bigNumber: "$4.000",
        bigLabel: "por cada $1.000.000 que retires",
        detail: "Sobre $5.5M → GMF = ~$22.000",
        footer: "💡 Marca una cuenta como exenta del 4x1000",
        style: "bigstat",
      },
      {
        title: "Ejemplo real: $5M al 10.5% EA a 1 año",
        rows: [
          ["Intereses brutos", "", "+$525.000"],
          ["Retención (7%)", "", "-$36.750"],
          ["4 por mil", "", "-$22.000"],
          ["", "", "─────────"],
          ["Neto recibido", "", "$466.250"],
        ],
        footer: "Rentabilidad neta: ~9.3% EA · Sigue ganándole a la inflación",
        style: "table",
      },
    ],
  },
  // ═══ MÓDULO 5 ═══
  {
    lessonTitle: "La escalera de CDTs: tu primera estrategia",
    slides: [
      {
        title: "Escalera de CDTs",
        subtitle: "Divide $6M en tres CDTs",
        rows: [
          ["CDT 1", "$2.000.000", "3 meses"],
          ["CDT 2", "$2.000.000", "6 meses"],
          ["CDT 3", "$2.000.000", "12 meses"],
        ],
        headers: ["", "Monto", "Plazo"],
        footer: "Cada 3 meses te vence un CDT → Liquidez sin perder tasa",
        style: "table",
      },
      {
        title: "Después de 1 año",
        bullets: [
          "✅ Todos los CDTs a 12 meses (mejor tasa)",
          "✅ Vencimientos cada 3 meses (liquidez)",
          "✅ Intereses se reinvierten (compuesto)",
          "",
          "💡 Perfecto para primas:",
          "   $4M de prima → 4 CDTs escalonados",
          "   $1M a 3m, $1M a 6m, $1M a 9m, $1M a 12m",
        ],
        footer: "La escalera crece con cada renovación",
        style: "bullets",
      },
    ],
  },
  {
    lessonTitle: "¿Renovar o retirar? Qué hacer cuando vence tu CDT",
    slides: [
      {
        title: "Opciones al vencimiento",
        rows: [
          ["Renovar mismo banco", "Automático si no haces nada", "⚠️ Tasa puede cambiar"],
          ["Renovar capital + intereses", "Interés compuesto", "⭐ Recomendado"],
          ["Retirar", "Sin penalidad", "Comparar otros bancos"],
        ],
        headers: ["Opción", "Detalle", "Nota"],
        footer: "Antes de renovar: SIEMPRE compara tasas de otros bancos",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Después del CDT: FICs, acciones y ETFs",
    slides: [
      {
        title: "Más allá del CDT",
        subtitle: "Opciones en Colombia",
        rows: [
          ["FIC renta fija", "8-11% EA", "Bajo", "3-5 días"],
          ["FIC renta variable", "Variable", "Medio", "5-10 días"],
          ["Acciones BVC", "Variable", "Alto", "T+2"],
          ["ETFs (S&P 500)", "~10% USD/año", "Medio", "T+2"],
        ],
        headers: ["Producto", "Rendimiento", "Riesgo", "Liquidez"],
        footer: "Empieza por FICs cuando domines CDTs (6-12 meses)",
        style: "table",
      },
      {
        title: "Pirámide de inversión",
        bullets: [
          "",
          "            🔺 Acciones / ETFs",
          "           (largo plazo, más riesgo)",
          "",
          "          🔸 FICs renta variable",
          "         (mediano plazo, riesgo medio)",
          "",
          "        🟡 CDTs + FICs renta fija",
          "       (seguro, le gana a inflación)",
          "",
          "      🟢 Fondo de emergencia",
          "     (3-6 meses, cuenta de ahorros)",
        ],
        footer: "No saltes escalones · Primero domina el CDT",
        style: "bullets",
      },
      {
        title: "Tu hoja de ruta",
        rows: [
          ["Mes 1-3", "Fondo emergencia + primer CDT", ""],
          ["Mes 3-6", "Escalera de CDTs", ""],
          ["Mes 6-12", "Explorar FICs renta fija", ""],
          ["Año 2+", "FICs mixtos, acciones, ETFs", ""],
        ],
        footer: "Cada paso construye sobre el anterior",
        style: "table",
      },
    ],
  },
  {
    lessonTitle: "Tu plan de acción: abre tu CDT esta semana",
    slides: [
      {
        title: "Plan de acción: 7 días",
        bullets: [
          "📋 Día 1-2: Ejercicio flujo de caja",
          "     Ingresos - Gastos = Disponible",
          "",
          "💳 Día 3: Plan de pago de deudas malas",
          "",
          "💰 Día 4: Definir monto para invertir",
          "",
          "🔍 Día 5: Comparar tasas de 3+ bancos",
          "",
          "📱 Día 6: Abrir cuenta + CDT",
          "",
          "🎉 Día 7: Celebrar — tu plata trabaja para ti",
        ],
        footer: "La mejor inversión es la que haces HOY",
        style: "bullets",
      },
      {
        title: "¡Gracias por tomar este curso!",
        subtitle: "Inversiones para Principiantes",
        bullets: [
          "",
          "Tu esfuerzo merece estabilidad financiera",
          "para ti y para tu familia.",
          "",
          "📲 Chat de la plataforma",
          "📱 WhatsApp para dudas",
          "",
          "Instructor: Pedro Tobar",
          "Legión Jurídica · LegisAcademy",
        ],
        footer: "La mejor inversión es la que haces hoy 🚀",
        style: "bullets",
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// PDF RENDERING
// ═══════════════════════════════════════════════════════════════

// ── Convert SVG logo to PNG buffer ──
let logoPngBuffer = null;

async function getLogoPng() {
  if (logoPngBuffer) return logoPngBuffer;
  const svgPath = path.resolve(__dirname, "../public/images/logo.svg");
  const svgBuffer = fs.readFileSync(svgPath);
  // Original SVG is 200x171 — preserve aspect ratio
  logoPngBuffer = await sharp(svgBuffer).resize({ width: 120, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return logoPngBuffer;
}

function createSlidePdf(slides, logoBuf) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [1920, 1080], // Full HD 16:9
      margin: 0,
      autoFirstPage: false,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    for (const slide of slides) {
      doc.addPage();
      renderSlide(doc, slide, logoBuf);
    }

    doc.end();
  });
}

function renderSlide(doc, slide, logoBuf) {
  const W = 1920, H = 1080;

  // ── Background ──
  doc.rect(0, 0, W, H).fill(COLORS.darkBg);
  doc.rect(0, 0, W, 10).fill(COLORS.oro);

  // ── Logo top-right: icon + text side by side ──
  // Logo icon is ~120x103 (200:171 ratio), rendered at height 45
  const logoW = 52; // proportional width for h=45
  const logoH = 45;
  const textW = 120;
  const totalLogoW = logoW + 10 + textW; // icon + gap + text
  const logoStartX = W - totalLogoW - 30; // 30px right margin
  if (logoBuf) {
    doc.image(logoBuf, logoStartX, 16, { height: logoH });
  }
  doc.font("Helvetica-Bold").fontSize(19).fillColor(COLORS.oro);
  doc.text("LEGIÓN", logoStartX + logoW + 10, 18, { width: textW, align: "left" });
  doc.font("Helvetica-Bold").fontSize(19).fillColor(COLORS.grayDark);
  doc.text("JURÍDICA", logoStartX + logoW + 10, 40, { width: textW, align: "left" });

  // ── Title ──
  doc.font("Helvetica-Bold").fontSize(82).fillColor(COLORS.white);
  doc.text(slide.title, 80, 45, { width: W - 300, align: "left" });

  // ── Subtitle ──
  let yPos = 150;
  if (slide.subtitle) {
    doc.font("Helvetica").fontSize(44).fillColor(COLORS.oro);
    doc.text(slide.subtitle, 80, yPos, { width: W - 200 });
    yPos += 72;
  } else {
    yPos += 28;
  }

  // ── Content by style ──
  switch (slide.style) {
    case "bullets":
      renderBullets(doc, slide, yPos);
      break;
    case "table":
      renderTable(doc, slide, yPos);
      break;
    case "bigstat":
      renderBigStat(doc, slide, yPos);
      break;
    case "comparison":
      renderComparison(doc, slide, yPos);
      break;
  }

  // ── Footer ──
  if (slide.footer) {
    doc.rect(0, H - 80, W, 80).fill("#0A1118");
    doc.font("Helvetica").fontSize(28).fillColor(COLORS.grayDark);
    doc.text(slide.footer, 80, H - 58, { width: W - 160, align: "center" });
  }
}

function renderBullets(doc, slide, yStart) {
  const items = slide.bullets || [];
  let y = yStart + 25;
  for (const item of items) {
    if (!item) { y += 34; continue; }
    doc.font("Helvetica").fontSize(44).fillColor(COLORS.beige);
    doc.text(item, 100, y, { width: 1720 });
    y += 74;
  }
}

function renderTable(doc, slide, yStart) {
  const rows = slide.rows || [];
  const headers = slide.headers;
  let y = yStart + 15;
  const colWidths = rows[0]?.length === 4 ? [440, 400, 400, 400] : rows[0]?.length === 2 ? [1000, 640] : [600, 580, 460];
  const xStart = 90;

  // Headers
  if (headers) {
    let x = xStart;
    doc.font("Helvetica-Bold").fontSize(34).fillColor(COLORS.oro);
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], x, y, { width: colWidths[i] || 400 });
      x += colWidths[i] || 400;
    }
    y += 60;
    doc.rect(xStart, y - 10, 1740, 3).fill(COLORS.oro).opacity(0.3).fill(COLORS.oro);
    doc.opacity(1);
    y += 15;
  }

  // Rows
  for (const row of rows) {
    const rowIdx = rows.indexOf(row);
    if (rowIdx % 2 === 0) {
      doc.opacity(0.05).rect(xStart - 20, y - 14, 1760, 80).fill(COLORS.white).opacity(1);
    }

    let x = xStart;
    for (let i = 0; i < row.length; i++) {
      const isFirst = i === 0;
      doc.font(isFirst ? "Helvetica-Bold" : "Helvetica").fontSize(39).fillColor(isFirst ? COLORS.white : COLORS.beige);
      doc.text(row[i], x, y, { width: colWidths[i] || 400 });
      x += colWidths[i] || 400;
    }
    y += 84;
  }
}

function renderBigStat(doc, slide, yStart) {
  const centerY = yStart + 80;
  const W = 1920;

  // Big number
  doc.font("Helvetica-Bold").fontSize(150).fillColor(COLORS.oro);
  doc.text(slide.bigNumber, 80, centerY, { width: W - 160, align: "center" });

  // Label
  doc.font("Helvetica").fontSize(50).fillColor(COLORS.beige);
  doc.text(slide.bigLabel, 80, centerY + 190, { width: W - 160, align: "center" });

  // Detail
  if (slide.detail) {
    doc.font("Helvetica").fontSize(39).fillColor(COLORS.grayDark);
    doc.text(slide.detail, 80, centerY + 270, { width: W - 160, align: "center" });
  }
}

function renderComparison(doc, slide, yStart) {
  const W = 1920;
  const colW = 780;
  const gap = 60;
  const leftX = (W - colW * 2 - gap) / 2;
  const rightX = leftX + colW + gap;
  let y = yStart + 20;

  // Left column
  doc.opacity(0.08).roundedRect(leftX - 30, y - 20, colW + 60, 640, 16).fill(COLORS.green).opacity(1);
  doc.font("Helvetica-Bold").fontSize(48).fillColor(COLORS.green);
  doc.text(slide.leftCol.header, leftX, y, { width: colW });
  y += 80;
  for (const item of slide.leftCol.items) {
    doc.font("Helvetica").fontSize(39).fillColor(COLORS.beige);
    doc.text("• " + item, leftX + 20, y, { width: colW - 40 });
    y += 68;
  }

  // Right column
  y = yStart + 20;
  doc.opacity(0.08).roundedRect(rightX - 30, y - 20, colW + 60, 640, 16).fill(COLORS.red).opacity(1);
  doc.font("Helvetica-Bold").fontSize(48).fillColor(COLORS.red);
  doc.text(slide.rightCol.header, rightX, y, { width: colW });
  y += 80;
  for (const item of slide.rightCol.items) {
    doc.font("Helvetica").fontSize(39).fillColor(COLORS.beige);
    doc.text("• " + item, rightX + 20, y, { width: colW - 40 });
    y += 68;
  }
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD & UPDATE
// ═══════════════════════════════════════════════════════════════

async function ensureBucket() {
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await sb.storage.createBucket(BUCKET, { public: true });
  }
}

async function uploadPdf(buffer, fileName) {
  const filePath = `presentaciones/${fileName}`;
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function main() {
  console.log("🎨 Generando presentaciones PDF...\n");

  const logoBuf = await getLogoPng();
  console.log("✅ Logo convertido a PNG\n");

  await ensureBucket();

  // Get the most recent "Inversiones para Principiantes" course
  const { data: courses } = await sb
    .from("courses")
    .select("id")
    .ilike("title", "%Inversiones para Principiantes%")
    .order("created_at", { ascending: false })
    .limit(1);

  const course = courses?.[0];
  if (!course) { console.error("❌ Curso no encontrado"); return; }

  const { data: modules } = await sb
    .from("course_modules")
    .select("id, title, order, lessons(id, title, order, script_blocks)")
    .eq("course_id", course.id)
    .order("order")
    .order("order", { referencedTable: "lessons" });

  if (!modules) { console.error("❌ No se encontraron módulos"); return; }

  // Flatten lessons in order
  const dbLessons = [];
  for (const mod of modules) {
    for (const les of (mod.lessons || [])) {
      dbLessons.push(les);
    }
  }

  console.log(`📚 Encontradas ${dbLessons.length} lecciones en DB`);
  console.log(`🎨 Preparadas ${LESSONS_SLIDES.length} presentaciones\n`);

  let updated = 0;

  for (let i = 0; i < LESSONS_SLIDES.length; i++) {
    const slideDef = LESSONS_SLIDES[i];
    const dbLesson = dbLessons.find((l) => l.title === slideDef.lessonTitle);

    if (!dbLesson) {
      console.log(`  ⚠️  No match: "${slideDef.lessonTitle}"`);
      continue;
    }

    // Generate PDF
    const pdfBuffer = await createSlidePdf(slideDef.slides, logoBuf);
    const fileName = `inversiones-leccion-${i + 1}-${Date.now().toString(36)}.pdf`;

    // Upload
    const url = await uploadPdf(pdfBuffer, fileName);
    console.log(`  📄 ${slideDef.slides.length} slides → ${slideDef.lessonTitle.slice(0, 50)}`);

    // Update lesson with presentation_url
    const { error } = await sb
      .from("lessons")
      .update({ presentation_url: url })
      .eq("id", dbLesson.id);

    if (error) {
      console.log(`    ❌ Error actualizando: ${error.message}`);
    } else {
      updated++;
    }
  }

  console.log(`\n✅ ${updated} lecciones actualizadas con presentaciones`);
  console.log("🎉 ¡Listo! Las presentaciones están en Supabase Storage");
}

main().catch(console.error);
