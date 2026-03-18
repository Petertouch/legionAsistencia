export interface NoticiaPost {
  id: string;
  slug: string;
  titulo: string;
  extracto: string;
  contenido: string;
  imagen: string;
  categoria: "Institucional" | "Legal" | "Noticias";
  fecha: string;
  autor: string;
}

export const CATEGORIA_COLORS: Record<string, { bg: string; text: string }> = {
  Institucional: { bg: "bg-oro/20", text: "text-oro" },
  Legal: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  Noticias: { bg: "bg-sky-500/20", text: "text-sky-400" },
};

export const NOTICIAS: NoticiaPost[] = [
  {
    id: "n1",
    slug: "presentacion-legion-juridica",
    titulo: "Legión Jurídica: Defensa Legal Especializada para la Fuerza Pública",
    extracto:
      "Conoce a Legión Jurídica, el respaldo legal que los miembros de la Fuerza Pública de Colombia merecen. Defensa especializada en derecho penal militar, disciplinario y más.",
    contenido: `
<p>En Legión Jurídica entendemos que quienes protegen a Colombia merecen ser protegidos. Somos un equipo de abogados especializados en la defensa legal de miembros activos y retirados de la Fuerza Pública — Ejército, Policía Nacional, Armada y Fuerza Aérea.</p>

<h2>¿Por qué Legión Jurídica?</h2>
<p>Porque sabemos que un proceso disciplinario, una investigación penal militar o un problema legal no espera. Nuestros abogados tienen experiencia directa en el sistema de justicia penal militar y conocen las particularidades que otros despachos ignoran.</p>

<h2>Nuestras Áreas de Práctica</h2>
<ul>
<li><strong>Derecho Penal Militar:</strong> Defensa en consejos de guerra, investigaciones y procesos penales dentro de la jurisdicción militar.</li>
<li><strong>Derecho Disciplinario:</strong> Representación ante la Procuraduría, inspecciones y oficinas de control disciplinario.</li>
<li><strong>Derecho de Familia:</strong> Custodias, divorcios, sucesiones y todo lo relacionado con la protección de tu familia.</li>
<li><strong>Derecho del Consumidor:</strong> Defensa ante entidades financieras, aseguradoras y prestadores de servicios.</li>
<li><strong>Documentos Legales:</strong> Derechos de petición, tutelas, recursos y cualquier documento que necesites.</li>
</ul>

<h2>Planes Accesibles</h2>
<p>Ofrecemos planes de suscripción diseñados para que tengas respaldo legal permanente sin sorpresas económicas. Desde consultas ilimitadas hasta representación completa, hay un plan para cada necesidad.</p>

<h2>Contacto Directo</h2>
<p>No creemos en las barreras. Nos puedes contactar directamente por WhatsApp al <strong>317 668 9580</strong> y recibir atención inmediata. Sin formularios eternos, sin esperas innecesarias.</p>

<p><strong>Legión Jurídica — Tu escudo legal.</strong></p>
    `.trim(),
    imagen: "/images/noticias/presentacion-legion.webp",
    categoria: "Institucional",
    fecha: "2026-03-18",
    autor: "Legión Jurídica",
  },
];

export function getNoticiaBySlug(slug: string): NoticiaPost | undefined {
  return NOTICIAS.find((n) => n.slug === slug);
}

export function getAllNoticias(): NoticiaPost[] {
  return [...NOTICIAS].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}
