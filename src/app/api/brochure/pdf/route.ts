import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";

const DARK = "#0F1A0F";
const GOLD = "#C8A96E";
const WHITE = "#FFFFFF";
const GRAY = "#666666";
const LIGHT_BG = "#FAFAF8";

function goldLine(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(GOLD).lineWidth(2).stroke();
}

export async function GET() {
  try {
    const pdfBuffer = await generateBrochurePDF();
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Legion_Juridica_Brochure.pdf"',
      },
    });
  } catch (err) {
    console.error("[BROCHURE PDF]", err);
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 });
  }
}

async function generateBrochurePDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const W = 842; // A4 landscape width
    const H = 595; // A4 landscape height
    const doc = new PDFDocument({ size: [W, H], margins: { top: 0, bottom: 0, left: 0, right: 0 }, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PAD = 50;

    // ═══════════════════════════════════════════════
    // SLIDE 1: COVER
    // ═══════════════════════════════════════════════
    doc.rect(0, 0, W, H).fill(DARK);

    // Logo text
    doc.fontSize(18).font("Helvetica-Bold").fillColor(GOLD).text("LEGIÓN", PAD, 40, { continued: true });
    doc.font("Helvetica").fillColor(GOLD).text(" Jurídica", { continued: false });

    doc.fontSize(8).fillColor("#666").text("Presentación Corporativa", W - 200, 46, { width: 150, align: "right" });

    // Gold line
    goldLine(doc, PAD, 110, 60);

    // Tagline
    doc.fontSize(30).font("Helvetica-Bold").fillColor(WHITE).text("Tu misión es servir a la\npatria. La nuestra es\nprotegerte.", PAD, 125, { width: 500, lineGap: 4 });

    goldLine(doc, PAD, 260, 60);

    // Subtitle
    doc.fontSize(11).font("Helvetica").fillColor("#999").text("Asistencia jurídica integral y especializada para miembros\nde las Fuerzas Militares y Policía Nacional de Colombia.", PAD, 275, { width: 450, lineGap: 3 });

    // Stats bar
    const statsY = H - 80;
    doc.moveTo(PAD, statsY - 15).lineTo(W - PAD, statsY - 15).strokeColor("#1a2e1a").lineWidth(0.5).stroke();

    const stats = [
      { v: "500+", l: "Militares protegidos" },
      { v: "98%", l: "Casos resueltos" },
      { v: "24h", l: "Tiempo de respuesta" },
      { v: "7", l: "Áreas legales cubiertas" },
    ];
    stats.forEach((s, i) => {
      const x = PAD + i * 180;
      doc.fontSize(24).font("Helvetica-Bold").fillColor(GOLD).text(s.v, x, statsY);
      doc.fontSize(8).font("Helvetica").fillColor("#666").text(s.l, x, statsY + 28);
    });

    // ═══════════════════════════════════════════════
    // SLIDE 2: HISTORIA
    // ═══════════════════════════════════════════════
    doc.addPage({ size: [W, H] });
    doc.rect(0, 0, W, H).fill(WHITE);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("QUIÉNES SOMOS", PAD, PAD);
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a1a1a").text("Nuestra Historia", PAD, PAD + 16);

    goldLine(doc, PAD, PAD + 48, 40);

    doc.fontSize(11).font("Helvetica").fillColor(GRAY).text(
      "Legión Jurídica nace de la necesidad real de proteger legalmente a quienes dedican su vida a proteger a Colombia. Fundada por un equipo de abogados especializados en derecho militar, penal militar y disciplinario, entendemos las particularidades del servicio en la fuerza pública y las complejidades legales que enfrentan sus miembros a diario.\n\nNo somos un bufete genérico — somos el escudo legal de la fuerza pública.",
      PAD, PAD + 65, { width: W - PAD * 2, lineGap: 5 }
    );

    // ═══════════════════════════════════════════════
    // SLIDE 3: MISIÓN, VISIÓN, VALORES
    // ═══════════════════════════════════════════════
    doc.addPage({ size: [W, H] });
    doc.rect(0, 0, W, H).fill(WHITE);

    const colW = (W - PAD * 2 - 40) / 3;

    // Misión
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("MISIÓN", PAD, PAD);
    doc.fontSize(10).font("Helvetica").fillColor(GRAY).text(
      "Brindar asesoría y representación jurídica de excelencia a los miembros de las Fuerzas Militares y Policía Nacional, garantizando la protección de sus derechos con un servicio accesible, oportuno y especializado.",
      PAD, PAD + 20, { width: colW, lineGap: 4 }
    );

    // Visión
    const col2X = PAD + colW + 20;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("VISIÓN", col2X, PAD);
    doc.fontSize(10).font("Helvetica").fillColor(GRAY).text(
      "Ser la firma de referencia en asistencia legal militar en Colombia, reconocida por su compromiso con la justicia, la innovación en el servicio y la protección integral del servidor público.",
      col2X, PAD + 20, { width: colW, lineGap: 4 }
    );

    // Valores
    const col3X = col2X + colW + 20;
    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("VALORES", col3X, PAD);
    const valores = ["Compromiso con la fuerza pública", "Excelencia jurídica", "Confidencialidad absoluta", "Respuesta oportuna", "Accesibilidad", "Integridad profesional"];
    valores.forEach((v, i) => {
      const y = PAD + 20 + i * 18;
      doc.circle(col3X + 4, y + 5, 2).fill(GOLD);
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(v, col3X + 14, y, { width: colW - 14 });
    });

    // ═══════════════════════════════════════════════
    // SLIDE 4: SERVICIOS
    // ═══════════════════════════════════════════════
    doc.addPage({ size: [W, H] });
    doc.rect(0, 0, W, H).fill(LIGHT_BG);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("QUÉ HACEMOS", PAD, PAD);
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a1a1a").text("Nuestros Servicios", PAD, PAD + 16);
    goldLine(doc, PAD, PAD + 48, 40);

    const servicios = [
      { t: "Derecho Disciplinario", d: "Defensa en procesos disciplinarios, descargos, recursos de apelación y acompañamiento." },
      { t: "Derecho Penal y Penal Militar", d: "Representación ante jurisdicción penal ordinaria y militar. Audiencias y sentencias." },
      { t: "Derecho de Familia", d: "Custodia, alimentos, divorcios adaptados a la realidad del servicio militar." },
      { t: "Derecho Civil y Consumidor", d: "Reclamaciones por cobros indebidos, créditos de libranza, seguros." },
      { t: "Documentos Legales", d: "Derechos de petición, tutelas, recursos y documentos jurídicos." },
      { t: "Asesoría Legal Ilimitada", d: "Consultas ilimitadas por WhatsApp, llamada o portal digital." },
    ];

    const sColW = (W - PAD * 2 - 30) / 3;
    servicios.forEach((s, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = PAD + col * (sColW + 15);
      const y = PAD + 65 + row * 120;

      // Card background
      doc.roundedRect(x, y, sColW, 105, 6).fill(WHITE).strokeColor("#e5e5e5").lineWidth(0.5).stroke();
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a").text(s.t, x + 12, y + 14, { width: sColW - 24 });
      doc.fontSize(8).font("Helvetica").fillColor(GRAY).text(s.d, x + 12, y + 32, { width: sColW - 24, lineGap: 3 });
    });

    // ═══════════════════════════════════════════════
    // SLIDE 5: PLANES
    // ═══════════════════════════════════════════════
    doc.addPage({ size: [W, H] });
    doc.rect(0, 0, W, H).fill(WHITE);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("PLANES DE SUSCRIPCIÓN", PAD, PAD);
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a1a1a").text("Protección Para Cada Necesidad", PAD, PAD + 16);
    goldLine(doc, PAD, PAD + 48, 40);

    const planes = [
      { n: "Base", p: "$47.000", f: ["Asesoría jurídica ilimitada", "2 representaciones / año", "4 opiniones / mes", "Revisión de documentos", "Atención por WhatsApp", "2 familiares T&C"] },
      { n: "Plus", p: "$60.000", pop: true, f: ["Todo lo del Base, más:", "3 representaciones / año", "8 opiniones / mes", "Prioridad en asignación", "WhatsApp y llamada", "3 familiares T&C", "Junta Médica"] },
      { n: "Élite", p: "$78.000", f: ["Todo lo del Plus, más:", "5 representaciones / año", "Opiniones ilimitadas", "Abogado dedicado", "Atención prioritaria 24/7", "4 familiares T&C", "Junta Médica"] },
    ];

    const pColW = (W - PAD * 2 - 30) / 3;
    planes.forEach((plan, i) => {
      const x = PAD + i * (pColW + 15);
      const y = PAD + 65;
      const cardH = 440;

      if (plan.pop) {
        doc.roundedRect(x, y, pColW, cardH, 8).fill("#FAFAF8").strokeColor(GOLD).lineWidth(2).stroke();
        doc.roundedRect(x + pColW / 2 - 35, y - 8, 70, 16, 8).fill(GOLD);
        doc.fontSize(6).font("Helvetica-Bold").fillColor(WHITE).text("MÁS POPULAR", x + pColW / 2 - 28, y - 5);
      } else {
        doc.roundedRect(x, y, pColW, cardH, 8).fill(WHITE).strokeColor("#e0e0e0").lineWidth(0.5).stroke();
      }

      doc.fontSize(16).font("Helvetica-Bold").fillColor("#1a1a1a").text(plan.n, x, y + 20, { width: pColW, align: "center" });
      doc.fontSize(26).font("Helvetica-Bold").fillColor("#1a1a1a").text(plan.p, x, y + 45, { width: pColW, align: "center" });
      doc.fontSize(9).font("Helvetica").fillColor("#999").text("/mes", x, y + 75, { width: pColW, align: "center" });

      doc.moveTo(x + 15, y + 95).lineTo(x + pColW - 15, y + 95).strokeColor("#eee").lineWidth(0.5).stroke();

      plan.f.forEach((f, fi) => {
        const fy = y + 110 + fi * 22;
        doc.circle(x + 20, fy + 4, 3).fill(plan.pop ? GOLD : "#ccc");
        doc.fontSize(8).font("Helvetica").fillColor("#555").text("✓", x + 17, fy, { width: 10 });
        doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(f, x + 32, fy, { width: pColW - 50 });
      });
    });

    // ═══════════════════════════════════════════════
    // SLIDE 6: DIFERENCIADORES
    // ═══════════════════════════════════════════════
    doc.addPage({ size: [W, H] });
    doc.rect(0, 0, W, H).fill(WHITE);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("POR QUÉ ELEGIRNOS", PAD, PAD);
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a1a1a").text("Lo Que Nos Hace Diferentes", PAD, PAD + 16);
    goldLine(doc, PAD, PAD + 48, 40);

    const difs = [
      { t: "Especialización militar", d: "Nuestro equipo está formado exclusivamente por abogados con experiencia en justicia militar y policial." },
      { t: "Tecnología al servicio", d: "Portal digital donde el suscriptor sigue sus casos en tiempo real y se comunica con su abogado." },
      { t: "Cobertura familiar", d: "Los planes incluyen cobertura para cónyuge, hijos y padres dependientes del suscriptor." },
      { t: "Presencia en guarniciones", d: "Red de aliados en batallones y unidades militares para atención directa y personalizada." },
    ];

    const dColW = (W - PAD * 2 - 30) / 2;
    difs.forEach((d, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = PAD + col * (dColW + 30);
      const y = PAD + 70 + row * 130;

      // Icon circle
      doc.circle(x + 18, y + 18, 18).fill(DARK);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(GOLD).text("✓", x + 11, y + 10);

      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1a1a1a").text(d.t, x + 46, y + 4, { width: dColW - 50 });
      doc.fontSize(9).font("Helvetica").fillColor(GRAY).text(d.d, x + 46, y + 22, { width: dColW - 50, lineGap: 3 });
    });

    // ═══════════════════════════════════════════════
    // SLIDE 7: CONTACTO
    // ═══════════════════════════════════════════════
    doc.addPage({ size: [W, H] });
    doc.rect(0, 0, W, H).fill(DARK);

    doc.fontSize(9).font("Helvetica-Bold").fillColor(GOLD).text("CONTACTO", PAD, PAD);
    doc.fontSize(22).font("Helvetica-Bold").fillColor(WHITE).text("Hablemos", PAD, PAD + 16);
    goldLine(doc, PAD, PAD + 48, 40);

    const contactos = [
      { l: "Teléfono", v: "317 668 9580" },
      { l: "Email", v: "info@legionjuridica.com" },
      { l: "Web", v: "legionjuridica.com" },
      { l: "Dirección", v: "Cra 7 #81-49 Of. 301, Bogotá" },
    ];

    contactos.forEach((c, i) => {
      const y = PAD + 70 + i * 45;
      doc.fontSize(8).font("Helvetica").fillColor("#666").text(c.l.toUpperCase(), PAD, y);
      doc.fontSize(13).font("Helvetica-Bold").fillColor(WHITE).text(c.v, PAD, y + 14);
    });

    // Right side
    doc.fontSize(10).font("Helvetica").fillColor("#555").text(
      "Legión Jurídica es una firma\nespecializada en derecho militar\ny policial, comprometida con la\nprotección legal de quienes\nsirven a Colombia.",
      W / 2 + 40, PAD + 80, { width: 300, lineGap: 4 }
    );

    doc.moveTo(W / 2 + 40, H - 80).lineTo(W - PAD, H - 80).strokeColor("#1a2e1a").lineWidth(0.5).stroke();
    doc.fontSize(14).font("Helvetica-Bold").fillColor(GOLD).text("LEGIÓN Jurídica", W / 2 + 40, H - 65);
    doc.fontSize(8).font("Helvetica").fillColor("#444").text(`© ${new Date().getFullYear()} · Todos los derechos reservados`, W / 2 + 40, H - 45);

    doc.end();
  });
}