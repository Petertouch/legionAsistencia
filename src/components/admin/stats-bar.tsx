import { Scale, AlertTriangle, CalendarClock, Clock } from "lucide-react";

export default function StatsBar({
  activos,
  stale,
  deadlines,
}: {
  activos: number;
  stale: number;
  deadlines: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Scale className="w-3.5 h-3.5 text-oro" />
        <span className="font-medium text-gray-900">{activos}</span> activos
      </div>
      {stale > 0 && (
        <div className="flex items-center gap-1.5 text-red-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="font-medium">{stale}</span> estancados
        </div>
      )}
      {deadlines > 0 && (
        <div className="flex items-center gap-1.5 text-yellow-600">
          <CalendarClock className="w-3.5 h-3.5" />
          <span className="font-medium">{deadlines}</span> con deadline próximo
        </div>
      )}
    </div>
  );
}
