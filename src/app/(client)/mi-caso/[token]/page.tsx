import { MOCK_CASOS } from "@/lib/mock-data";
import { PIPELINES } from "@/lib/pipelines";
import { MessageCircle, User, Scale, Clock, CalendarClock, Check, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ClientCasoPage({ params }: Props) {
  const { token } = await params;
  const caso = MOCK_CASOS.find((c) => c.id === token);

  if (!caso) {
    return (
      <div className="text-center py-12 md:py-16">
        <Scale className="w-10 md:w-12 h-10 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
        <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-2">Caso no encontrado</h2>
        <p className="text-gray-500 text-sm mb-6">El enlace puede haber expirado o ser incorrecto.</p>
        <a href="https://wa.me/573176689580" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-5 md:px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm md:text-base">
          <MessageCircle className="w-5 h-5" /> Contactar por WhatsApp
        </a>
      </div>
    );
  }

  const pipeline = PIPELINES[caso.area];
  const totalStages = pipeline.stages.length;
  const progressPercent = Math.round(((caso.etapa_index + 1) / totalStages) * 100);
  const currentStage = pipeline.stages[caso.etapa_index];
  const nextStage = caso.etapa_index + 1 < totalStages ? pipeline.stages[caso.etapa_index + 1] : null;
  const isCerrado = caso.etapa === "Cerrado";

  const daysInStage = Math.floor(
    (Date.now() - new Date(caso.fecha_ingreso_etapa).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{caso.titulo}</h1>
        <p className="text-gray-500 text-sm mt-1">{caso.area}</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2.5 md:mb-3">
          <span className="text-xs md:text-sm font-medium text-gray-700">Progreso del caso</span>
          <span className="text-xs md:text-sm font-bold text-jungle">{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 md:h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%`, backgroundColor: isCerrado ? "#22c55e" : "#C29613" }} />
        </div>

        {/* Stage dots */}
        <div className="flex items-center justify-between mt-3 md:mt-4 overflow-x-auto gap-0.5">
          {pipeline.stages.map((stage, i) => {
            const isPast = i < caso.etapa_index;
            const isCurrent = i === caso.etapa_index;
            return (
              <div key={stage.name} className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-bold border-2 transition-all ${
                  isPast ? "bg-green-500 border-green-500 text-white"
                  : isCurrent ? "bg-oro border-oro text-white"
                  : "bg-gray-100 border-gray-200 text-gray-400"
                }`}>
                  {isPast ? <Check className="w-2.5 md:w-3 h-2.5 md:h-3" /> : i + 1}
                </div>
                <span className={`text-[8px] md:text-[9px] mt-0.5 md:mt-1 text-center leading-tight truncate w-full ${
                  isCurrent ? "text-gray-900 font-medium" : "text-gray-400"
                }`}>
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current stage info */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2.5 md:mb-3">Etapa actual</h3>
        <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
          <div className={`w-2.5 md:w-3 h-2.5 md:h-3 rounded-full ${currentStage.color}`} />
          <span className="text-base md:text-lg font-semibold text-gray-800">{caso.etapa}</span>
          {isCerrado && <span className="bg-green-100 text-green-700 text-[10px] md:text-xs font-medium px-2 py-0.5 rounded-full">Finalizado</span>}
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:gap-3">
          <div className="bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 md:gap-2 text-gray-500 mb-0.5 md:mb-1">
              <Clock className="w-3.5 md:w-4 h-3.5 md:h-4" />
              <span className="text-[10px] md:text-xs">Dias en etapa</span>
            </div>
            <p className="text-base md:text-lg font-bold text-gray-900">{daysInStage}</p>
          </div>
          <div className="bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3">
            <div className="flex items-center gap-1.5 md:gap-2 text-gray-500 mb-0.5 md:mb-1">
              <CalendarClock className="w-3.5 md:w-4 h-3.5 md:h-4" />
              <span className="text-[10px] md:text-xs">Tiempo estimado</span>
            </div>
            <p className="text-base md:text-lg font-bold text-gray-900">{currentStage.expectedDays}d</p>
          </div>
        </div>

        {nextStage && !isCerrado && (
          <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs md:text-sm text-gray-500 bg-gray-50 rounded-lg md:rounded-xl p-2.5 md:p-3">
            <ArrowRight className="w-3.5 md:w-4 h-3.5 md:h-4 text-oro flex-shrink-0" />
            <span>Siguiente:</span>
            <span className="font-medium text-gray-700">{nextStage.name}</span>
          </div>
        )}
      </div>

      {/* Caso info */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-5 shadow-sm">
        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2.5 md:mb-3">Informacion del caso</h3>
        <div className="space-y-2.5 md:space-y-3">
          <div className="flex items-center gap-2.5 md:gap-3">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] md:text-xs text-gray-500">Abogado asignado</p>
              <p className="text-xs md:text-sm font-medium text-gray-800">{caso.abogado}</p>
            </div>
          </div>
          {caso.fecha_limite && (
            <div className="flex items-center gap-2.5 md:gap-3">
              <CalendarClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] md:text-xs text-gray-500">Fecha limite</p>
                <p className="text-xs md:text-sm font-medium text-gray-800">
                  {new Date(caso.fecha_limite).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 mb-1">Descripcion</p>
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">{caso.descripcion}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <a href="https://wa.me/573176689580" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-semibold text-base md:text-lg hover:bg-green-700 transition-colors shadow-sm active:scale-[0.98]">
        <MessageCircle className="w-5 md:w-6 h-5 md:h-6" /> Volver a WhatsApp
      </a>
    </div>
  );
}
