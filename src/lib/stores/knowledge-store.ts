import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface KnowledgeItem {
  id: string;
  pregunta: string;
  respuesta: string;
  categoria: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = [
  "General",
  "Disciplinarios",
  "Penal Militar",
  "Derechos Laborales",
  "Ascensos y Carrera",
  "Salud y Pensión",
  "Familia",
  "Documentos Legales",
  "Retiro y Pensión",
  "Situaciones Especiales",
  "Planes y Suscripción",
  "Contacto",
];

let idCounter = 200;
function nextId() { return `kb${++idCounter}`; }

const INITIAL_ITEMS: KnowledgeItem[] = [
  {
    id: "kb1", categoria: "Disciplinarios",
    pregunta: "¿Qué es un proceso disciplinario?",
    respuesta: "Es un procedimiento administrativo donde se investiga si un militar o policía cometió una falta contra el reglamento. Puede terminar en absolución, sanción (reprensión, multa, suspensión) o destitución. Tienes derecho a defensa en todas las etapas.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb2", categoria: "Disciplinarios",
    pregunta: "¿Qué hago si me notifican una investigación disciplinaria?",
    respuesta: "No firmes nada sin leer. Tienes derecho a un abogado defensor. Pide copia del expediente completo. No declares sin asesoría. Contacta a tu abogado de Legión de inmediato para revisar los cargos y preparar tu estrategia de defensa.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb3", categoria: "Disciplinarios",
    pregunta: "¿Cuánto tiempo tiene la institución para iniciar un proceso disciplinario?",
    respuesta: "La acción disciplinaria prescribe en 5 años desde la ocurrencia del hecho. Si te notifican después de ese plazo, puedes alegar prescripción como defensa.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb4", categoria: "Disciplinarios",
    pregunta: "¿Me pueden sancionar sin escucharme primero?",
    respuesta: "No. La Constitución garantiza el debido proceso. Debes ser notificado de los cargos, tener oportunidad de presentar descargos, aportar pruebas y ser escuchado antes de cualquier sanción. Si te sancionan sin esto, la sanción es nula.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb5", categoria: "Disciplinarios",
    pregunta: "¿Qué es una falta gravísima en el régimen disciplinario militar?",
    respuesta: "Son las faltas más severas: abandono del puesto, tortura, desaparición forzada, uso indebido de armas contra civiles, narcotráfico, entre otras. Pueden llevar a destitución e inhabilidad para ejercer cargos públicos.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb6", categoria: "Disciplinarios",
    pregunta: "¿Puedo apelar una sanción disciplinaria?",
    respuesta: "Sí. Tienes derecho a interponer recurso de apelación ante el superior jerárquico dentro de los 5 días siguientes a la notificación de la sanción. Tu abogado puede redactar el recurso con los argumentos jurídicos adecuados.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb7", categoria: "Disciplinarios",
    pregunta: "¿Qué pasa si no me presento a una citación disciplinaria?",
    respuesta: "Si no te presentas sin justa causa, el proceso continúa sin ti y pierdes la oportunidad de defenderte. Si tienes una razón válida (enfermedad, comisión), presenta la excusa documentada antes de la fecha.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb8", categoria: "Disciplinarios",
    pregunta: "¿Me pueden abrir proceso disciplinario estando de licencia o vacaciones?",
    respuesta: "Sí, el proceso puede iniciarse en cualquier momento. Pero todas las notificaciones deben hacerse correctamente. Si no te notificaron debidamente por estar ausente, eso puede ser un vicio procesal a tu favor.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb9", categoria: "Disciplinarios",
    pregunta: "¿Qué diferencia hay entre falta leve, grave y gravísima?",
    respuesta: "Leve: amonestación o multa de hasta 10 días. Grave: suspensión hasta 180 días o multa hasta 180 días. Gravísima: destitución e inhabilidad. La clasificación depende de la conducta, el daño causado y la intencionalidad.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb10", categoria: "Disciplinarios",
    pregunta: "¿Pueden obligarme a firmar un acta de compromiso?",
    respuesta: "Nadie puede obligarte a firmar nada. Un acta de compromiso es voluntaria. Antes de firmar, léela completamente y consulta con tu abogado. Lo que firmes puede usarse en tu contra en un proceso futuro.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb11", categoria: "Disciplinarios",
    pregunta: "¿Qué es un pliego de cargos?",
    respuesta: "Es el documento donde la autoridad disciplinaria te notifica formalmente qué falta se te imputa, las pruebas que tiene y los cargos específicos. A partir de la notificación, tienes un plazo para presentar descargos (tu defensa).",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb12", categoria: "Disciplinarios",
    pregunta: "¿Puedo tener un abogado civil en un proceso disciplinario militar?",
    respuesta: "Sí. Tienes derecho a elegir tu propio abogado defensor, ya sea militar o civil. No estás obligado a aceptar el defensor de oficio que te asigne la institución.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb13", categoria: "Disciplinarios",
    pregunta: "¿Me pueden trasladar como castigo?",
    respuesta: "Los traslados deben obedecer a necesidades del servicio, no pueden ser usados como sanción encubierta. Si puedes demostrar que el traslado fue retaliatorio, puedes impugnarlo mediante un derecho de petición o una tutela.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb14", categoria: "Disciplinarios",
    pregunta: "¿Qué es la presunción de inocencia en un proceso disciplinario?",
    respuesta: "Significa que eres inocente hasta que se demuestre lo contrario. La carga de la prueba la tiene la institución, no tú. No tienes que demostrar tu inocencia; ellos deben probar tu culpabilidad.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb15", categoria: "Disciplinarios",
    pregunta: "¿Puedo grabar las reuniones o audiencias disciplinarias?",
    respuesta: "Generalmente no puedes grabar sin autorización. Pero todo proceso disciplinario debe quedar documentado por escrito. Puedes pedir copia de las actas y del expediente en cualquier momento.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb16", categoria: "Penal Militar",
    pregunta: "¿Qué es la justicia penal militar?",
    respuesta: "Es un sistema judicial especial que investiga y juzga delitos cometidos por militares y policías en relación con el servicio. Tiene sus propios jueces, fiscales y tribunales (consejos de guerra). Solo aplica para conductas relacionadas con la función militar o policial.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb17", categoria: "Penal Militar",
    pregunta: "¿Qué delitos investiga la justicia penal militar?",
    respuesta: "Investiga delitos como: desobediencia, abandono del puesto, cobardía, hurto militar, abuso de autoridad, lesiones en operaciones, homicidio en combate cuestionado, entre otros. Si el delito no tiene relación con el servicio, pasa a la justicia ordinaria.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb18", categoria: "Penal Militar",
    pregunta: "¿Puedo ir preso por un proceso penal militar?",
    respuesta: "Sí. Dependiendo del delito, puedes enfrentar pena privativa de libertad. Por eso es fundamental tener defensa jurídica desde el primer momento. No declares sin abogado y no firmes nada que no entiendas.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb19", categoria: "Penal Militar",
    pregunta: "¿Qué es un consejo de guerra verbal?",
    respuesta: "Es una audiencia donde se juzga al militar o policía acusado de un delito. Se llama verbal porque es oral (no solo escrito). Tiene juez, fiscal, defensor y se presentan pruebas y testimonios. La sentencia puede ser absolutoria o condenatoria.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb20", categoria: "Penal Militar",
    pregunta: "¿Me pueden detener preventivamente en un proceso penal militar?",
    respuesta: "Sí, si el juez considera que puedes fugarte, obstaculizar la investigación o representar un peligro. Pero la detención preventiva debe cumplir requisitos legales estrictos y tu abogado puede solicitar libertad provisional.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb21", categoria: "Penal Militar",
    pregunta: "¿Qué hago si me investigan por lesiones a un civil durante una operación?",
    respuesta: "No hagas declaraciones sin abogado. Recopila toda la documentación de la operación (orden de operaciones, bitácora, testimonios de compañeros). Tu abogado analizará si la conducta estaba amparada por las reglas de enfrentamiento.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb22", categoria: "Penal Militar",
    pregunta: "¿Qué diferencia hay entre justicia penal militar y justicia ordinaria?",
    respuesta: "La penal militar juzga delitos relacionados con el servicio militar/policial. La ordinaria juzga delitos comunes. Si un militar comete un robo fuera de servicio, lo juzga la justicia ordinaria. Si dispara en una operación, lo juzga la penal militar.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb23", categoria: "Penal Militar",
    pregunta: "¿Puedo pasar de la justicia penal militar a la justicia ordinaria?",
    respuesta: "Sí, hay conflictos de competencia. Si la justicia ordinaria considera que el delito no tiene relación con el servicio, puede reclamar el caso. Tu abogado puede argumentar ante cuál jurisdicción te conviene más estar.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb24", categoria: "Penal Militar",
    pregunta: "¿Qué pasa si un superior me ordena algo ilegal?",
    respuesta: "La obediencia debida no aplica para órdenes manifiestamente ilegales. Si un superior te ordena cometer un delito (tortura, ejecución extrajudicial, etc.), tienes el deber legal de negarte. Cumplir la orden no te exime de responsabilidad penal.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb25", categoria: "Penal Militar",
    pregunta: "¿Puedo ser juzgado dos veces por los mismos hechos en justicia militar y ordinaria?",
    respuesta: "No. El principio de non bis in idem prohíbe ser juzgado dos veces por los mismos hechos. Si ya fuiste juzgado en una jurisdicción, la otra no puede procesarte por lo mismo.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb26", categoria: "Derechos Laborales",
    pregunta: "¿Cuánto debe ser mi salario como soldado profesional?",
    respuesta: "El salario de un soldado profesional depende del escalafón y antigüedad. Incluye salario básico, prima de actividad, subsidio de alimentación y bonificaciones. Si crees que te están pagando menos de lo debido, podemos revisar tu liquidación salarial.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb27", categoria: "Derechos Laborales",
    pregunta: "¿Tengo derecho a horas extras?",
    respuesta: "Los militares y policías no tienen régimen de horas extras como los civiles. Sin embargo, tienen compensatorios por servicios especiales, primas por orden público y otras bonificaciones que compensan la disponibilidad permanente.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb28", categoria: "Derechos Laborales",
    pregunta: "¿Cuántos días de vacaciones me corresponden?",
    respuesta: "Los miembros de la fuerza pública tienen derecho a 15 días hábiles de vacaciones por año de servicio. Si no las disfrutas, se pueden acumular hasta por dos periodos y luego compensar en dinero.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb29", categoria: "Derechos Laborales",
    pregunta: "¿Me pueden negar las vacaciones?",
    respuesta: "Solo por necesidades del servicio debidamente justificadas. Si te las niegan repetidamente, puedes solicitar compensación en dinero o interponer un derecho de petición exigiendo su programación.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb30", categoria: "Derechos Laborales",
    pregunta: "¿Qué es la prima de actividad?",
    respuesta: "Es un pago adicional al salario básico que reciben los miembros de la fuerza pública por estar en servicio activo. Su monto varía según el grado y la antigüedad.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb31", categoria: "Derechos Laborales",
    pregunta: "¿Tengo derecho a prima de navidad?",
    respuesta: "Sí. Los militares y policías reciben prima de navidad equivalente a un mes de los haberes percibidos en el año. Se paga en la primera quincena de diciembre.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb32", categoria: "Derechos Laborales",
    pregunta: "¿Qué es la prima de orden público?",
    respuesta: "Es una bonificación especial para quienes prestan servicio en zonas de conflicto o alto riesgo. El monto depende de la zona y la clasificación de riesgo. Verifica que te la estén pagando si estás en zona de orden público.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb33", categoria: "Derechos Laborales",
    pregunta: "¿Puedo pedir permiso para estudiar?",
    respuesta: "Sí. La fuerza pública tiene programas de formación. Puedes solicitar permiso especial para estudios universitarios o técnicos. Algunas instituciones tienen convenios con universidades y ofrecen becas parciales.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb34", categoria: "Derechos Laborales",
    pregunta: "¿Qué pasa si me enfermo en servicio?",
    respuesta: "Tienes derecho a atención médica inmediata por el sistema de salud de las fuerzas militares o la policía. Si la enfermedad es por causa del servicio, puedes tener derecho a indemnización adicional.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb35", categoria: "Derechos Laborales",
    pregunta: "¿Me pueden descontar del sueldo sin autorización?",
    respuesta: "Solo se pueden hacer descuentos autorizados por ley (aportes a salud, pensión) o por orden judicial. Cualquier otro descuento requiere tu autorización escrita. Si te están descontando sin tu consentimiento, puedes reclamar.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb36", categoria: "Derechos Laborales",
    pregunta: "¿Tengo derecho a subsidio de vivienda?",
    respuesta: "Sí. Los militares y policías pueden acceder a subsidios de vivienda a través de las cajas de vivienda militar y policial. Los requisitos varían según antigüedad y grado. Podemos asesorarte sobre cómo aplicar.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb37", categoria: "Derechos Laborales",
    pregunta: "¿Qué hago si no me pagan completo o a tiempo?",
    respuesta: "Presenta un derecho de petición ante la pagaduría exigiendo la liquidación detallada y el pago de lo adeudado. Si no responden en 15 días hábiles, puedes interponer una tutela por vulneración al mínimo vital.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb38", categoria: "Ascensos y Carrera",
    pregunta: "¿Cuáles son los requisitos para ascender?",
    respuesta: "Varían según el grado y la fuerza. Generalmente necesitas: tiempo mínimo en el grado, cursos de formación aprobados, evaluaciones de desempeño positivas, no tener investigaciones disciplinarias pendientes y clasificación en la lista de ascensos.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb39", categoria: "Ascensos y Carrera",
    pregunta: "¿Qué hago si me niegan el ascenso?",
    respuesta: "Primero solicita por escrito las razones de la negativa mediante derecho de petición. Si consideras que la negativa es injusta, podemos evaluar si procede una tutela o una acción de nulidad y restablecimiento del derecho.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb40", categoria: "Ascensos y Carrera",
    pregunta: "¿Me pueden negar el ascenso por tener un proceso disciplinario?",
    respuesta: "Depende. Si el proceso está en curso (no hay sanción ejecutoriada), no deberían negarte el ascenso solo por la existencia de la investigación. Si ya hay sanción firme, sí puede afectar. Cada caso requiere análisis individual.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb41", categoria: "Ascensos y Carrera",
    pregunta: "¿Qué es la lista de clasificación para ascensos?",
    respuesta: "Es el listado donde se ordenan los candidatos a ascenso según méritos, antigüedad, cursos y evaluaciones. Tu posición en la lista determina si asciendes o no en cada periodo. Puedes solicitar tu posición mediante derecho de petición.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb42", categoria: "Ascensos y Carrera",
    pregunta: "¿Puedo solicitar traslado a otra ciudad?",
    respuesta: "Sí, mediante solicitud escrita al mando. Los traslados se aprueban según necesidades del servicio, pero se consideran situaciones humanitarias (salud del familiar, madre cabeza de hogar, etc.). Si te niegan el traslado por razón humanitaria, una tutela puede proceder.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb43", categoria: "Ascensos y Carrera",
    pregunta: "¿Qué cursos necesito para ascender de soldado a cabo?",
    respuesta: "Generalmente necesitas completar el curso de ascenso específico para el grado, tener el tiempo mínimo en grado (varía), evaluaciones satisfactorias y no tener sanciones disciplinarias vigentes. Consulta con tu unidad los requisitos exactos actualizados.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb44", categoria: "Ascensos y Carrera",
    pregunta: "¿Puedo estudiar una carrera universitaria siendo militar activo?",
    respuesta: "Sí. La fuerza pública fomenta la educación. Puedes solicitar permisos especiales para asistir a clases. Algunas universidades tienen convenios y ofrecen horarios flexibles para militares y policías.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb45", categoria: "Ascensos y Carrera",
    pregunta: "¿Qué es el retiro temporal del servicio?",
    respuesta: "Es una situación administrativa donde te separan temporalmente del servicio activo (por ejemplo, por estar en disponibilidad). Sigues siendo militar pero no ejerces funciones. Tienes derechos laborales reducidos durante este periodo.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb46", categoria: "Ascensos y Carrera",
    pregunta: "¿Me pueden retirar del servicio sin justa causa?",
    respuesta: "El retiro discrecional existe pero tiene límites constitucionales. Si consideras que tu retiro fue arbitrario o sin motivación real, podemos impugnarlo. La Corte Constitucional ha protegido a militares retirados sin justa causa en múltiples sentencias.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb47", categoria: "Ascensos y Carrera",
    pregunta: "¿Qué hago si llevo años sin ascender?",
    respuesta: "Revisa si cumples todos los requisitos. Solicita por derecho de petición tu historial de evaluaciones y posición en la lista de clasificación. Si hay irregularidades, podemos ayudarte a reclamar ante la junta de ascensos.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb48", categoria: "Salud y Pensión",
    pregunta: "¿Cómo funciona el sistema de salud militar?",
    respuesta: "Los militares y sus beneficiarios están afiliados al Subsistema de Salud de las Fuerzas Militares (Direccion de Sanidad) o en el caso de la Policía, a la Dirección de Sanidad de la Policía. Cubre atención médica, hospitalización, medicamentos y cirugías.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb49", categoria: "Salud y Pensión",
    pregunta: "¿Qué hago si me niegan un tratamiento médico?",
    respuesta: "Presenta un derecho de petición ante Sanidad Militar o Policial solicitando el tratamiento. Si lo niegan o no responden en 15 días, interpón una tutela por vulneración al derecho a la salud. La tutela es rápida y efectiva para estos casos.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb50", categoria: "Salud y Pensión",
    pregunta: "¿Qué es una junta médica laboral?",
    respuesta: "Es una evaluación médica que determina si tienes una disminución de capacidad laboral por enfermedad o lesión sufrida en el servicio. El porcentaje de pérdida de capacidad determina si tienes derecho a pensión de invalidez o indemnización.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb51", categoria: "Salud y Pensión",
    pregunta: "¿Cuándo tengo derecho a pensión de invalidez?",
    respuesta: "Si la junta médica determina que tienes pérdida de capacidad laboral del 50% o más, tienes derecho a pensión de invalidez. Si es entre el 50% y el 75%, la pensión es proporcional. Si es mayor al 75%, recibes pensión completa.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb52", categoria: "Salud y Pensión",
    pregunta: "¿Cuántos años necesito para pensionarme?",
    respuesta: "Para la asignación de retiro (equivalente a pensión) necesitas mínimo 18 años de servicio si es retiro voluntario, o 15 años si es retiro por solicitud de la institución. Los años en zonas de orden público pueden contar doble.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb53", categoria: "Salud y Pensión",
    pregunta: "¿Qué pasa si me lesiono durante una operación?",
    respuesta: "Reporta la lesión inmediatamente a tu superior y ve a Sanidad. Asegúrate de que quede documentado que la lesión fue en servicio. Esto es fundamental para futuras reclamaciones de indemnización o pensión de invalidez.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb54", categoria: "Salud y Pensión",
    pregunta: "¿Mis hijos tienen derecho a atención médica militar?",
    respuesta: "Sí. Tus hijos menores de 18 años (o hasta 25 si estudian) son beneficiarios del sistema de salud militar/policial. También tu cónyuge o compañera permanente y tus padres si dependen económicamente de ti.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb55", categoria: "Salud y Pensión",
    pregunta: "¿Qué es el PTSD y tengo derecho a tratamiento?",
    respuesta: "El Trastorno de Estrés Postraumático (PTSD) es una condición de salud mental común en militares y policías. Tienes derecho a diagnóstico, tratamiento psicológico y psiquiátrico completo a través de Sanidad. Si no te lo brindan, podemos reclamar por tutela.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb56", categoria: "Salud y Pensión",
    pregunta: "¿Puedo elegir mi médico o especialista?",
    respuesta: "Dentro de la red de Sanidad Militar/Policial puedes solicitar cambio de médico tratante. Si necesitas un especialista que no está disponible en la red, puedes solicitar autorización para atención externa. Si la niegan, una tutela puede ordenarla.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb57", categoria: "Salud y Pensión",
    pregunta: "¿Qué hago si no estoy de acuerdo con el dictamen de la junta médica?",
    respuesta: "Tienes derecho a interponer recurso de reposición y apelación contra el dictamen. También puedes solicitar una nueva valoración por junta médica diferente. Tu abogado puede revisar si el dictamen tiene inconsistencias.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb58", categoria: "Salud y Pensión",
    pregunta: "¿Qué es la prima de invalidez?",
    respuesta: "Si sufres una disminución de capacidad laboral pero menor al 50% (que no da derecho a pensión), puedes recibir una indemnización por una sola vez. El monto depende del porcentaje de pérdida de capacidad y tu grado.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb59", categoria: "Salud y Pensión",
    pregunta: "¿Puedo pensionarme antes de los 18 años de servicio?",
    respuesta: "Sí, si tienes una invalidez del 50% o más causada por el servicio. También si eres retirado por la institución con 15 o más años de servicio. En casos excepcionales, por enfermedad grave relacionada con el servicio.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb60", categoria: "Familia",
    pregunta: "¿Cómo pido custodia de mis hijos siendo militar?",
    respuesta: "Puedes solicitar custodia ante un juez de familia o en un centro de conciliación. Ser militar no te quita ni te da ventaja. Lo que importa es el bienestar del menor. Preparamos tu caso con evidencia de que puedes brindar estabilidad al menor.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb61", categoria: "Familia",
    pregunta: "¿Cómo solicito cuota alimentaria para mis hijos?",
    respuesta: "Se solicita ante un juez de familia o se acuerda en conciliación. La cuota se fija según los ingresos del padre/madre obligado y las necesidades del menor. Como militar, se toman en cuenta todas tus asignaciones (salario, primas, bonificaciones).",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb62", categoria: "Familia",
    pregunta: "¿Me pueden embargar el sueldo por alimentos?",
    respuesta: "Sí. La cuota alimentaria es la única deuda por la que pueden embargarte más del 50% del sueldo. Si no pagas, el juez puede ordenar embargo directo a la pagaduría militar/policial. Es mejor conciliar un monto justo que enfrentar un embargo.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb63", categoria: "Familia",
    pregunta: "¿Cómo me divorcio siendo militar?",
    respuesta: "El proceso de divorcio es el mismo que para civiles: ante notaría (mutuo acuerdo) o ante juez de familia (contencioso). Tu abogado de Legión te asesora en la liquidación de bienes, custodia y alimentos.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb64", categoria: "Familia",
    pregunta: "¿Mi pareja tiene derecho a mi pensión si nos separamos?",
    respuesta: "Si tienes una sentencia de divorcio y tu ex cónyuge fue declarada beneficiaria de cuota alimentaria, puede tener derecho a una porción de tu asignación de retiro. Cada caso es diferente y requiere análisis jurídico.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb65", categoria: "Familia",
    pregunta: "¿Qué hago si mi ex pareja no me deja ver a mis hijos?",
    respuesta: "Puedes solicitar regulación de visitas ante un juez de familia o centro de conciliación. Si ya hay un régimen de visitas y no lo cumple, puedes denunciar desacato. La ley protege el derecho del menor a tener relación con ambos padres.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb66", categoria: "Familia",
    pregunta: "¿Tengo derecho a licencia de paternidad?",
    respuesta: "Sí. Los militares y policías tienen derecho a licencia de paternidad por 2 semanas. Debes presentar el registro civil de nacimiento del menor y la solicitud ante tu unidad.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb67", categoria: "Familia",
    pregunta: "¿Puedo reclamar la unión marital de hecho?",
    respuesta: "Sí. Si llevas más de 2 años de convivencia con tu pareja, pueden declarar la unión marital de hecho ante notaría (de común acuerdo) o ante juez (si hay conflicto). Esto da derechos patrimoniales y de seguridad social.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb68", categoria: "Familia",
    pregunta: "¿Mis padres pueden ser mis beneficiarios en salud y pensión?",
    respuesta: "Sí, si dependen económicamente de ti y no tienen otra cobertura de salud o pensión propia. Debes acreditarlos ante la entidad correspondiente con declaración juramentada y documentos de soporte.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb69", categoria: "Familia",
    pregunta: "¿Qué pasa con mis beneficios si me caso?",
    respuesta: "Tu cónyuge o compañera permanente se convierte en beneficiaria de salud y, en caso de fallecimiento, de tu pensión de sobrevivientes. Es importante actualizar tus datos de beneficiarios ante la institución.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb70", categoria: "Documentos Legales",
    pregunta: "¿Qué es un derecho de petición y para qué sirve?",
    respuesta: "Es un documento legal para solicitar información, hacer consultas o presentar quejas ante cualquier entidad. La entidad tiene 15 días hábiles para responder. Es tu herramienta más poderosa para reclamar derechos laborales, prestaciones, ascensos y más.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb71", categoria: "Documentos Legales",
    pregunta: "¿Qué es una tutela y cuándo la necesito?",
    respuesta: "Es una acción para proteger tus derechos fundamentales cuando están siendo vulnerados. Se usa cuando: te niegan salud, no te pagan, vulneran tu debido proceso, etc. El juez tiene 10 días para responder. Es gratuita y no necesitas abogado (pero es mejor tenerlo).",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb72", categoria: "Documentos Legales",
    pregunta: "¿Cuándo debo usar un derecho de petición vs una tutela?",
    respuesta: "Primero usa el derecho de petición. Si no responden en 15 días o la respuesta no resuelve tu problema, entonces interpón la tutela. La tutela es más rápida y el juez puede ordenar acciones inmediatas.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb73", categoria: "Documentos Legales",
    pregunta: "¿Puedo poner una tutela contra la Policía o las Fuerzas Militares?",
    respuesta: "Sí. Puedes interponer tutela contra cualquier entidad pública que vulnere tus derechos fundamentales, incluyendo tu propia institución. Es un derecho constitucional que nadie puede quitarte.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb74", categoria: "Documentos Legales",
    pregunta: "¿Qué es una acción de nulidad y restablecimiento del derecho?",
    respuesta: "Es una demanda ante un juez administrativo para anular un acto administrativo ilegal (como un retiro injusto, negativa de ascenso, sanción irregular). Tiene plazo de 4 meses desde la notificación del acto. Tu abogado evalúa si procede.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb75", categoria: "Documentos Legales",
    pregunta: "¿Cómo hago un reclamo formal ante mi institución?",
    respuesta: "Presenta un derecho de petición por escrito, dirigido al funcionario competente. Incluye: tus datos completos, grado, unidad, los hechos, lo que solicitas y los fundamentos legales. Guarda copia con sello de radicado.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb76", categoria: "Documentos Legales",
    pregunta: "¿Qué documentos debo guardar siempre?",
    respuesta: "Guarda copias de: tu hoja de vida militar, evaluaciones de desempeño, certificados de cursos, órdenes de traslado, notificaciones disciplinarias, colillas de pago, certificados de tiempo de servicio y cualquier comunicación oficial. Son fundamentales para reclamaciones futuras.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb77", categoria: "Documentos Legales",
    pregunta: "¿Qué es un recurso de reposición?",
    respuesta: "Es un recurso que presentas ante la misma autoridad que tomó una decisión para que la reconsidere. Se interpone dentro de los 10 días siguientes a la notificación. Es el primer paso antes de apelar ante un superior.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb78", categoria: "Documentos Legales",
    pregunta: "¿Puedo acceder a mi expediente militar completo?",
    respuesta: "Sí. Tienes derecho a conocer toda la información que la institución tiene sobre ti. Solicítalo mediante derecho de petición a la oficina de personal o al archivo de la unidad.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb79", categoria: "Documentos Legales",
    pregunta: "¿Qué es el habeas data y cómo me protege?",
    respuesta: "Es el derecho a conocer, actualizar y rectificar la información que las instituciones tienen sobre ti en sus bases de datos. Si hay información falsa o desactualizada en tu hoja de vida militar, puedes exigir su corrección.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb80", categoria: "Retiro y Pensión",
    pregunta: "¿Qué es la asignación de retiro?",
    respuesta: "Es el equivalente a la pensión para los miembros de la fuerza pública. Se calcula sobre el salario y las primas que percibías en servicio activo. El porcentaje depende de los años de servicio: a más años, mayor porcentaje.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb81", categoria: "Retiro y Pensión",
    pregunta: "¿Qué es el retiro discrecional?",
    respuesta: "Es la facultad que tiene la institución de retirar a un miembro sin expresar causa específica. Aunque es legal, la Corte Constitucional ha establecido que debe estar motivado y no puede ser arbitrario. Si fuiste retirado discrecionalmente, podemos evaluar si fue legal.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb82", categoria: "Retiro y Pensión",
    pregunta: "¿Qué prestaciones recibo al retirarme?",
    respuesta: "Al retirarte recibes: asignación de retiro (si cumples los años), cesantías, prima de navidad proporcional, vacaciones pendientes y partida de vivienda. Si no cumples los años para asignación de retiro, recibes cesantías acumuladas.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb83", categoria: "Retiro y Pensión",
    pregunta: "¿Puedo trabajar después de retirarme del servicio?",
    respuesta: "Sí. Puedes trabajar en el sector privado o público sin perder tu asignación de retiro. Solo hay restricciones si trabajas en entidades del sector defensa dentro del primer año después del retiro.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb84", categoria: "Retiro y Pensión",
    pregunta: "¿Qué pasa si me retiran antes de cumplir los años para pensión?",
    respuesta: "Si no alcanzas los 18 años de servicio, recibes tus cesantías acumuladas pero no asignación de retiro. Tus aportes a pensión se pueden trasladar a un fondo de pensiones civil para seguir cotizando.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb85", categoria: "Retiro y Pensión",
    pregunta: "¿Cómo se calcula mi asignación de retiro?",
    respuesta: "Se calcula sobre el promedio de los haberes percibidos en el último año de servicio. Con 18 años recibes el 70% y por cada año adicional se incrementa un porcentaje hasta llegar al 95% con 25 años o más.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb86", categoria: "Retiro y Pensión",
    pregunta: "¿Puedo impugnar un retiro que considero injusto?",
    respuesta: "Sí. Tienes 4 meses desde la notificación para interponer una demanda de nulidad y restablecimiento del derecho ante un juez administrativo. Tu abogado evaluará si el retiro cumplió con los requisitos legales.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb87", categoria: "Retiro y Pensión",
    pregunta: "¿Qué es la bonificación por retiro?",
    respuesta: "Es un pago que se hace una sola vez al momento del retiro, equivalente a un porcentaje del último salario multiplicado por los años de servicio. Es diferente a las cesantías y a la asignación de retiro mensual.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb88", categoria: "Situaciones Especiales",
    pregunta: "¿Qué hago si sufro acoso laboral (mobbing) en mi unidad?",
    respuesta: "Documenta todo: fechas, hechos, testigos, mensajes. Presenta queja ante el Comité de Convivencia Laboral de tu unidad. Si no funciona, puedes denunciar ante la Procuraduría o interponer una tutela. El acoso laboral es una falta disciplinaria grave.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb89", categoria: "Situaciones Especiales",
    pregunta: "¿Puedo denunciar corrupción en mi unidad de forma anónima?",
    respuesta: "Sí. Puedes denunciar ante la Procuraduría, la Contraloría o la Fiscalía de forma anónima. También existen líneas de denuncia internas. La ley protege a los denunciantes de represalias.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb90", categoria: "Situaciones Especiales",
    pregunta: "¿Qué hago si me ordenan algo que viola los derechos humanos?",
    respuesta: "Niégate. Tienes el deber legal de no cumplir órdenes manifiestamente ilegales. Documenta la orden (quién, cuándo, qué te pidieron). Reporta al superior inmediato del que dio la orden y a la oficina de derechos humanos de tu fuerza.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb91", categoria: "Situaciones Especiales",
    pregunta: "¿Tengo derechos especiales si soy madre cabeza de hogar o padre cabeza de hogar?",
    respuesta: "Sí. Tienes protección reforzada: no pueden trasladarte a zonas que afecten a tus hijos, tienes prioridad en permisos, y el retiro discrecional tiene mayores restricciones. Debes acreditar tu condición ante la institución.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb92", categoria: "Situaciones Especiales",
    pregunta: "¿Qué pasa si pierdo material o equipo del Estado?",
    respuesta: "Debes reportarlo inmediatamente. Se abrirá una investigación para determinar si hubo negligencia. Si se determina responsabilidad, pueden cobrarte el valor del equipo. Si fue pérdida en combate o por fuerza mayor, no hay responsabilidad personal.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb93", categoria: "Situaciones Especiales",
    pregunta: "¿Puedo participar en política siendo militar o policía?",
    respuesta: "No. Los miembros de la fuerza pública en servicio activo no pueden participar en política, votar, hacer proselitismo ni afiliarse a partidos políticos. Esta restricción termina cuando te retiras del servicio.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb94", categoria: "Situaciones Especiales",
    pregunta: "¿Qué hago si me discriminan por mi raza, género u orientación sexual?",
    respuesta: "La discriminación está prohibida por la Constitución. Documenta los hechos y presenta queja ante la oficina de derechos humanos de tu fuerza, la Defensoría del Pueblo o interpón una tutela. La institución debe garantizar un ambiente libre de discriminación.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb95", categoria: "Situaciones Especiales",
    pregunta: "¿Tengo derecho a objeción de conciencia?",
    respuesta: "La Corte Constitucional reconoce la objeción de conciencia en Colombia, pero su aplicación en las fuerzas militares es muy limitada y cada caso se evalúa individualmente. Si tienes convicciones religiosas o morales profundas que entran en conflicto con el servicio, consulta con un abogado.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb96", categoria: "Planes y Suscripción",
    pregunta: "¿Cuál plan me conviene si soy soldado raso?",
    respuesta: "Te recomendamos el Plan Base ($50.000/mes). Incluye asesoría ilimitada por WhatsApp y llamada, 1 revisión de documentos al mes y derecho de petición incluido. Es ideal para tener respaldo legal permanente sin gastar mucho.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb97", categoria: "Planes y Suscripción",
    pregunta: "¿El plan cubre a mi familia?",
    respuesta: "El Plan Élite ($80.000/mes) incluye cobertura familiar para tu cónyuge e hijos. Los planes Base y Plus cubren solo al titular. Si tu familia necesita asesoría legal, el Élite es la mejor opción.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb98", categoria: "Planes y Suscripción",
    pregunta: "¿Puedo cambiar de plan en cualquier momento?",
    respuesta: "Sí. Puedes subir o bajar de plan en cualquier momento. El cambio aplica desde el siguiente mes de pago. Solo comunícate con tu abogado o escríbenos por WhatsApp.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb99", categoria: "Planes y Suscripción",
    pregunta: "¿Qué pasa si me retiran del servicio, puedo seguir afiliado?",
    respuesta: "Sí. Nuestro servicio es para militares y policías activos y retirados. De hecho, muchos retirados nos necesitan más para temas de pensión, liquidación y reclamaciones ante la institución.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
  {
    id: "kb100", categoria: "Planes y Suscripción",
    pregunta: "¿Puedo cancelar mi suscripción cuando quiera?",
    respuesta: "Sí. No hay permanencia mínima ni cláusulas de penalización. Si decides cancelar, solo avísanos antes del siguiente periodo de pago. Si tienes casos en curso, te entregamos toda la documentación.",
    activo: true, created_at: "2026-03-01T10:00:00Z", updated_at: "2026-03-01T10:00:00Z",
  },
];

interface KnowledgeStore {
  items: KnowledgeItem[];
  categories: string[];
  addItem: (data: { pregunta: string; respuesta: string; categoria: string }) => KnowledgeItem;
  updateItem: (id: string, data: Partial<Pick<KnowledgeItem, "pregunta" | "respuesta" | "categoria" | "activo">>) => void;
  deleteItem: (id: string) => void;
  toggleItem: (id: string) => void;
  addCategory: (name: string) => void;
}

export const useKnowledgeStore = create<KnowledgeStore>()(
  persist(
    (set, get) => ({
      items: INITIAL_ITEMS,
      categories: DEFAULT_CATEGORIES,
      addItem: (data) => {
        const item: KnowledgeItem = {
          id: nextId(),
          ...data,
          activo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((s) => ({ items: [...s.items, item] }));
        return item;
      },
      updateItem: (id, data) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, ...data, updated_at: new Date().toISOString() } : i
          ),
        }));
      },
      deleteItem: (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
      },
      toggleItem: (id) => {
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, activo: !i.activo, updated_at: new Date().toISOString() } : i
          ),
        }));
      },
      addCategory: (name) => {
        const cats = get().categories;
        if (!cats.includes(name)) set({ categories: [...cats, name] });
      },
    }),
    { name: "legion-knowledge" }
  )
);
