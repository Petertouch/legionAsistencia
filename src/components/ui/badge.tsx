type Variant = "success" | "warning" | "danger" | "info" | "neutral";
type Size = "xs" | "sm";

const variants: Record<Variant, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
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
  "Gratuito": "neutral", "Base": "neutral", "Plus": "info", "Elite": "success",
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
