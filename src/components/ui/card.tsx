export default function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-3.5 md:p-5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className = "",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <Card className={`flex items-start gap-2.5 md:gap-4 ${className}`}>
      <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-amber-50 text-oro flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-gray-500 text-[10px] md:text-xs font-medium uppercase tracking-wider truncate">{title}</p>
        <p className="text-gray-900 text-lg md:text-2xl font-bold mt-0.5 md:mt-1">{value}</p>
        {trend && (
          <p className={`text-[10px] md:text-xs mt-0.5 md:mt-1 truncate ${trend.positive ? "text-green-600" : "text-red-600"}`}>
            {trend.positive ? "+" : ""}{trend.value}
          </p>
        )}
      </div>
    </Card>
  );
}
