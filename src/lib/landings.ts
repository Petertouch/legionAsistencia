// Registro único de las landings/páginas públicas del sitio.
// Fuente de verdad del gestor en /admin/landings (MVP: config, no BD).
// Si a futuro se quiere estado editable/analítica, se promueve a tabla.

export type LandingCategoria = "marketing" | "referidos" | "contenido";
export type LandingEstado = "activa" | "legacy" | "borrador";

export interface Landing {
  id: string;
  nombre: string;
  ruta: string; // relativa, p. ej. "/esposa"
  categoria: LandingCategoria;
  estado: LandingEstado;
  descripcion: string;
}

export const SITE_BASE_URL = "https://legionjuridica.com";

export const CATEGORIA_LABEL: Record<LandingCategoria, string> = {
  marketing: "Marketing",
  referidos: "Referidos",
  contenido: "Contenido",
};

export const CATEGORIA_ORDER: LandingCategoria[] = ["marketing", "referidos", "contenido"];

export const ESTADO_LABEL: Record<LandingEstado, string> = {
  activa: "Activa",
  legacy: "Legacy",
  borrador: "Borrador",
};

export const LANDINGS: Landing[] = [
  // ── Marketing ──
  { id: "home", nombre: "Home", ruta: "/", categoria: "marketing", estado: "activa",
    descripcion: "Landing principal del sitio." },
  { id: "presentacion", nombre: "Presentación corporativa", ruta: "/presentacion", categoria: "marketing", estado: "activa",
    descripcion: "Presentación de la firma (para compartir con prospectos)." },

  // ── Referidos ──
  { id: "esposa", nombre: "Esposas", ruta: "/esposa", categoria: "referidos", estado: "activa",
    descripcion: "Landing del programa de esposas — captación principal de aliadas." },
  { id: "aliados", nombre: "Aliados", ruta: "/aliados", categoria: "referidos", estado: "activa",
    descripcion: "Portal/entrada de aliados." },
  { id: "aliados-registro", nombre: "Registro de aliado", ruta: "/aliados/registro", categoria: "referidos", estado: "activa",
    descripcion: "Formulario para que un nuevo aliado se registre." },
  { id: "lanzas", nombre: "Lanzas (alias)", ruta: "/lanzas", categoria: "referidos", estado: "legacy",
    descripcion: "Atajo antiguo — redirige. Se mantiene como alias." },

  // ── Contenido ──
  { id: "blog", nombre: "Blog", ruta: "/blog", categoria: "contenido", estado: "activa",
    descripcion: "Guía legal + consulta gratuita orientativa. Base de conocimiento en código." },
];

export const landingUrl = (l: Landing) => `${SITE_BASE_URL}${l.ruta === "/" ? "" : l.ruta}`;
