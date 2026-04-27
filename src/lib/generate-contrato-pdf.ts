import PDFDocument from "pdfkit";

const DEFAULT_CLAUSULAS = [
  { titulo: "CLÁUSULA PRIMERA — OBJETO", contenido: "EL PRESTADOR se obliga a prestar los servicios de asesoría y asistencia jurídica integral contemplados en el plan seleccionado por EL SUSCRIPTOR, conforme a los términos y condiciones descritos en la ficha de vinculación que hace parte integral de este contrato." },
  { titulo: "CLÁUSULA SEGUNDA — DURACIÓN", contenido: "El presente contrato tendrá una duración de cuarenta y ocho (48) meses contados a partir de la fecha de firma. Se renovará automáticamente por períodos iguales salvo que alguna de las partes manifieste por escrito su voluntad de no renovarlo con al menos treinta (30) días de anticipación." },
  { titulo: "CLÁUSULA TERCERA — VALOR Y FORMA DE PAGO", contenido: "EL SUSCRIPTOR pagará mensualmente la suma pactada en pesos colombianos, mediante descuento directo por libranza, transferencia electrónica o el medio que las partes acuerden." },
  { titulo: "CLÁUSULA CUARTA — OBLIGACIONES DEL PRESTADOR", contenido: "EL PRESTADOR se compromete a: a) Brindar asesoría jurídica en las áreas cubiertas por el plan contratado; b) Atender las consultas en un plazo máximo de 24 horas hábiles; c) Mantener la confidencialidad de la información suministrada por EL SUSCRIPTOR; d) Designar abogados titulados y con tarjeta profesional vigente." },
  { titulo: "CLÁUSULA QUINTA — OBLIGACIONES DEL SUSCRIPTOR", contenido: "EL SUSCRIPTOR se compromete a: a) Pagar oportunamente la cuota mensual del plan; b) Suministrar información veraz y completa; c) Hacer uso de los servicios de buena fe y conforme al plan contratado." },
  { titulo: "CLÁUSULA SEXTA — TERMINACIÓN", contenido: "El contrato podrá terminarse por: a) Mutuo acuerdo de las partes; b) Incumplimiento de las obligaciones por cualquiera de las partes; c) Vencimiento del término sin renovación; d) Mora superior a dos (2) meses en el pago de la cuota mensual." },
  { titulo: "CLÁUSULA SÉPTIMA — DATOS PERSONALES", contenido: "EL SUSCRIPTOR autoriza el tratamiento de sus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios, para los fines exclusivos de la ejecución del presente contrato." },
];

const DEFAULT_LIBRANZA = [
  { titulo: "AUTORIZACIÓN", contenido: "Autorizo de manera libre, voluntaria e irrevocable a mi pagaduría para que descuente de mi asignación mensual la suma pactada a favor de la empresa prestadora, por concepto de prestación de servicios jurídicos del plan seleccionado." },
  { titulo: "VIGENCIA", contenido: "Esta autorización se otorga en los términos de la Ley 1527 de 2012, y tendrá vigencia mientras subsista la obligación contractual. Declaro que este descuento no afecta mi mínimo vital y que mi capacidad de endeudamiento por libranza lo permite." },
];

const DEFAULT_PLANES = [
  { nombre: "Base", precio: "39.000", caracteristicas: ["Asesoría jurídica ilimitada", "Revisión de documentos (1/mes)"] },
  { nombre: "Plus", precio: "51.000", caracteristicas: ["Todo lo del Plan Base", "2 revisiones/mes", "Audiencias (1/sem)"] },
  { nombre: "Élite", precio: "69.000", caracteristicas: ["Todo lo del Plan Plus", "Docs ilimitados", "Línea 24/7"] },
];

function goldLine(doc: PDFKit.PDFDocument) {
  doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor("#C8A96E").lineWidth(1).stroke();
  doc.moveDown(0.4);
}

function pageHeader(doc: PDFKit.PDFDocument, empresa: string, nit: string) {
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#C8A96E").text("LEGIÓN JURÍDICA", { align: "center" });
  doc.fontSize(8).font("Helvetica").fillColor("#999999").text(`${empresa} — NIT ${nit}`, { align: "center" });
  doc.moveDown(0.2);
}

function checkPageSpace(doc: PDFKit.PDFDocument, needed: number) {
  const pageBottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > pageBottom) {
    doc.addPage();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateContratoPDF(contrato: any, plantilla: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 45, bottom: 45, left: 55, right: 55 }, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const empresa = plantilla?.empresa_nombre || "CA CONSULTORES SAS";
    const nit = plantilla?.empresa_nit || "901.234.567-8";
    const nombre = contrato.nombre || contrato.nombre_cliente || "—";
    const cedula = contrato.cedula || contrato.cedula_cliente || "—";
    const plan = contrato.plan || "—";
    const precio = contrato.precio || "—";
    const clausulas = plantilla?.clausulas_contrato?.length ? plantilla.clausulas_contrato : DEFAULT_CLAUSULAS;
    const libranza = plantilla?.secciones_libranza?.length ? plantilla.secciones_libranza : DEFAULT_LIBRANZA;
    const planes = plantilla?.planes?.length ? plantilla.planes : DEFAULT_PLANES;
    const fecha = new Date(contrato.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
    const departamento = contrato.datos_completos?.departamento || "";

    // ════════════════════════════════════════════════════════════
    // PAGE 1: FICHA DE VINCULACIÓN
    // ════════════════════════════════════════════════════════════
    pageHeader(doc, empresa, nit);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1a1a1a").text("FICHA DE VINCULACIÓN", { align: "center" });
    doc.moveDown(0.2);
    goldLine(doc);

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#C8A96E").text("DATOS PERSONALES");
    doc.moveDown(0.2);

    const fields: [string, string][] = [
      ["Nombre completo", nombre],
      ["Cédula", cedula],
      ["Teléfono 1", contrato.telefono || "—"],
      ["Teléfono 2", contrato.telefono2 || "—"],
      ["Estado civil", contrato.estado_civil || "—"],
      ["Email", contrato.email || "—"],
      ["Grado", contrato.grado || "—"],
      ["Fuerza", contrato.fuerza || "—"],
      ["Unidad", contrato.unidad || "—"],
      ["Dirección", contrato.direccion || "—"],
      ["Ciudad", contrato.ciudad || "—"],
      ["Departamento", departamento || "—"],
    ];

    for (const [label, value] of fields) {
      doc.fontSize(8).font("Helvetica").fillColor("#999999").text(`${label}: `, { continued: true });
      doc.font("Helvetica-Bold").fillColor("#333333").text(value);
    }

    doc.moveDown(0.6);
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#C8A96E").text("PLAN SELECCIONADO");
    doc.moveDown(0.2);

    // Plan boxes
    const planBoxW = 148;
    const planStartX = 55;
    const planY = doc.y;

    for (let i = 0; i < planes.length && i < 3; i++) {
      const p = planes[i];
      const x = planStartX + i * (planBoxW + 12);
      const isSelected = p.nombre === plan;
      doc.rect(x, planY, planBoxW, 42).lineWidth(isSelected ? 1.5 : 0.5).strokeColor(isSelected ? "#C8A96E" : "#ddd").stroke();
      doc.fontSize(9).font("Helvetica-Bold").fillColor(isSelected ? "#1a1a1a" : "#aaa").text(p.nombre, x, planY + 6, { width: planBoxW, align: "center" });
      doc.fontSize(11).font("Helvetica-Bold").fillColor(isSelected ? "#C8A96E" : "#ccc").text(`$${p.precio}`, x, planY + 18, { width: planBoxW, align: "center" });
      doc.fontSize(7).font("Helvetica").fillColor("#aaa").text("/mes", x, planY + 32, { width: planBoxW, align: "center" });
    }
    doc.y = planY + 50;

    const selectedPlan = planes.find((p: { nombre: string }) => p.nombre === plan) || planes[0];
    if (selectedPlan?.caracteristicas) {
      for (const feat of selectedPlan.caracteristicas) {
        doc.fontSize(8).font("Helvetica").fillColor("#444444").text(`✓  ${feat}`, 65);
      }
    }

    // ════════════════════════════════════════════════════════════
    // PAGE 2+: CONTRATO (auto page breaks)
    // ════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(doc, empresa, nit);
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a").text("CONTRATO DE PRESTACIÓN DE SERVICIOS JURÍDICOS", { align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor("#999").text(`${empresa} — NIT ${nit}`, { align: "center" });
    doc.moveDown(0.2);
    goldLine(doc);

    const introText = (plantilla?.intro_contrato || "Entre los suscritos, de una parte {empresa}, sociedad comercial identificada con NIT {nit}, representada legalmente, en adelante EL PRESTADOR, y de otra parte {nombre}, identificado(a) con cédula de ciudadanía No. {cedula}, en adelante EL SUSCRIPTOR, se celebra el presente contrato que se regirá por las siguientes cláusulas:")
      .replace(/\{empresa\}/g, empresa).replace(/\{nit\}/g, nit).replace(/\{nombre\}/g, nombre).replace(/\{cedula\}/g, cedula);

    doc.fontSize(8.5).font("Helvetica").fillColor("#333").text(introText, { align: "justify", lineGap: 2.5 });
    doc.moveDown(0.4);

    for (const c of clausulas) {
      checkPageSpace(doc, 60);
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#1a1a1a").text(c.titulo);
      doc.fontSize(8.5).font("Helvetica").fillColor("#333").text(c.contenido, { align: "justify", lineGap: 2.5 });
      doc.moveDown(0.3);
    }

    checkPageSpace(doc, 30);
    doc.moveDown(0.3);
    doc.fontSize(8.5).font("Helvetica").fillColor("#555")
      .text(`En constancia se firma en la ciudad de ${contrato.ciudad || "_______________"}, a los ${fecha}.`);

    // ════════════════════════════════════════════════════════════
    // NEXT PAGE: LIBRANZA + FIRMA
    // ════════════════════════════════════════════════════════════
    doc.addPage();
    pageHeader(doc, empresa, nit);
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a1a").text("AUTORIZACIÓN DE DESCUENTO POR LIBRANZA", { align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor("#999").text(`${empresa} — NIT ${nit}`, { align: "center" });
    doc.fontSize(7).fillColor("#999").text("Ley 1527 de 2012", { align: "center" });
    doc.moveDown(0.2);
    goldLine(doc);

    for (const s of libranza) {
      checkPageSpace(doc, 50);
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#1a1a1a").text(s.titulo);
      doc.fontSize(8.5).font("Helvetica").fillColor("#333").text(s.contenido, { align: "justify", lineGap: 2.5 });
      doc.moveDown(0.3);
    }

    // Firma
    doc.moveDown(0.3);
    goldLine(doc);
    doc.moveDown(0.2);

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#555").text("Firma del Suscriptor");
    doc.moveDown(0.2);

    if (contrato.firma_data) {
      try {
        const firmaBuffer = Buffer.from(contrato.firma_data.replace(/^data:image\/\w+;base64,/, ""), "base64");
        doc.image(firmaBuffer, 55, doc.y, { width: 170, height: 70 });
        doc.y += 75;
      } catch {
        doc.fontSize(8).font("Helvetica").fillColor("#888").text("Firma registrada en copia física del contrato.", 65);
        doc.moveDown(0.5);
      }
    } else {
      doc.fontSize(8).font("Helvetica-Oblique").fillColor("#888").text("Firma registrada en la copia física del contrato.", 65);
      doc.moveDown(0.5);
    }

    doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#333").text(nombre, 65);
    doc.fontSize(8).font("Helvetica").fillColor("#888").text(`C.C. ${cedula}`, 65);

    // Foto (solo si existe)
    if (contrato.foto_data) {
      doc.moveDown(0.8);
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#555").text("Foto del Suscriptor");
      doc.moveDown(0.2);
      try {
        const fotoBuffer = Buffer.from(contrato.foto_data.replace(/^data:image\/\w+;base64,/, ""), "base64");
        doc.image(fotoBuffer, 55, doc.y, { width: 110, height: 130 });
        doc.y += 135;
      } catch { /* skip */ }
    }

    // Hash + footer
    doc.moveDown(0.5);
    goldLine(doc);
    if (contrato.hash) {
      doc.fontSize(7).font("Courier").fillColor("#888").text(`Hash de autenticidad: ${contrato.hash}`, { align: "center" });
    }
    doc.fontSize(7).font("Helvetica").fillColor("#999").text(`Firmado digitalmente el ${fecha}`, { align: "center" });

    doc.end();
  });
}
