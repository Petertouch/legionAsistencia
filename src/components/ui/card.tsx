export default function Card({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white/5 border border-white/10 rounded-xl p-5 ${className}`}
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
    <Card className={`flex items-start gap-4 ${className}`}>
      <div className="p-3 rounded-xl bg-oro/10 text-oro flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-beige/50 text-xs font-medium uppercase tracking-wider">{title}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? "text-green-400" : "text-red-400"}`}>
            {trend.positive ? "+" : ""}{trend.value}
          </p>
        )}
      </div>
    </Card>
  );
}
