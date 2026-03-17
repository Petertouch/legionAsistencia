type Variant = "success" | "warning" | "danger" | "info" | "neutral";
type Size = "xs" | "sm";

const variants: Record<Variant, string> = {
  success: "bg-green-500/15 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  danger: "bg-red-500/15 text-red-400 border-red-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  neutral: "bg-white/10 text-beige/60 border-white/10",
};

const sizes: Record<Size, string> = {
  xs: "px-1.5 py-px text-[10px]",
  sm: "px-2.5 py-0.5 text-xs",
};

const STATUS_MAP: Record<string, Variant> = {
  // Suscriptores
  "Al dia": "success", "Pendiente": "warning", "Vencido": "danger",
  // Leads
  "Nuevo": "info", "Contactado": "info", "Interesado": "warning",
  "Convertido": "success", "Perdido": "danger",
  // Plans
  "Base": "neutral", "Plus": "info", "Elite": "success",
  // Prioridad
  "urgente": "danger", "alta": "warning", "normal": "info", "baja": "neutral",
  // Pipeline stages
  "Recepcion": "info", "Cerrado": "neutral",
  "En Proceso": "warning", "Audiencia": "danger", "Resuelto": "success",
};

export default function Badge({
  children,
  variant,
  size = "sm",
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const resolvedVariant = variant || STATUS_MAP[children as string] || "neutral";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${variants[resolvedVariant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
