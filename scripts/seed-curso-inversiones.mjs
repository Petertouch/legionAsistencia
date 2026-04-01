/**
 * Seed: Inversiones para Principiantes — De Cero a tu Primer CDT
 * Contexto 100% colombiano: CDTs, Bancolombia, Davivienda, Fogafín, etc.
 *
 * Run: node scripts/seed-curso-inversiones.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ezytsyqebczlpwbahmyw.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6eXRzeXFlYmN6bHB3YmFobXl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcyMjYxMiwiZXhwIjoyMDg5Mjk4NjEyfQ.H7iqybXXL2V0qRK79AKOdkP7pUdjpa2fdVaq-djdpZU";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

function slug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
}

function blk(order, text, slide_number = null) {
  return { id: `blk-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, order, text, slide_number };
}

// ═══════════════════════════════════════════════════════════════
// COURSE DATA
// ═══════════════════════════════════════════════════════════════

const COURSE = {
  title: "Inversiones para Principiantes: De Cero a tu Primer CDT",
  description: "Aprende desde cero cómo funciona el mundo de las inversiones en Colombia. Domina los CDTs, entiende las tasas de interés, compara opciones entre bancos colombianos y abre tu primer CDT paso a paso. Diseñado especialmente para servidores públicos y miembros de la fuerza pública.",
  price: 89000,
  status: "PUBLISHED",
  total_hours: 4,
  instructor_name: "Pedro Tobar",
  instructor_bio: "Especialista en finanzas personales para servidores públicos",
};

const MODULES = [
  {
    title: "Módulo 1: ¿Por qué invertir?",
    description: "Entiende por qué dejar la plata quieta en una cuenta de ahorros te está costando dinero.",
    lessons: [
      {
        title: "Bienvenida: Qué vas a aprender en este curso",
        description: "Presentación del curso, del instructor y de lo que vas a lograr al terminar.",
        duration: 5,
        script_blocks: [
          blk(0, `Hola, bienvenido o bienvenida a este curso de Inversiones para Principiantes. Mi nombre es Pedro Tobar, soy especialista en finanzas personales y llevo varios años ayudando a servidores públicos, militares y policías a manejar mejor su plata.

Este curso lo diseñé pensando en ti. Si nunca has invertido, si no sabes qué es un CDT, o si tienes plata en la cuenta de ahorros y sientes que no crece... este curso es para ti.`, null),

          blk(1, `En este curso vas a aprender cinco cosas fundamentales. Primero, por qué la inflación en Colombia se está comiendo tus ahorros. Segundo, cómo organizar tus finanzas antes de invertir. Tercero, qué es un CDT, cómo funciona y por qué es la inversión más segura para empezar. Cuarto, cómo comparar CDTs entre bancos como Bancolombia, Davivienda, Nu y Pibank. Y quinto, vas a abrir tu primer CDT paso a paso antes de terminar el curso.`, 1),

          blk(2, `No necesitas saber nada de finanzas. No necesitas tener millones de pesos. Con 100 mil pesos puedes empezar. Lo único que necesitas es la decisión de hacer que tu plata trabaje para ti en vez de quedarse quieta perdiendo valor.

Vamos a arrancar.`, null),
        ],
      },
      {
        title: "La inflación se está comiendo tu plata",
        description: "Datos reales de Colombia: cuánto pierde tu dinero cada año si no lo inviertes.",
        duration: 8,
        script_blocks: [
          blk(0, `Déjame hacerte una pregunta. Si hoy tienes un millón de pesos en tu cuenta de ahorros, ¿cuánto va a valer ese millón dentro de un año? La mayoría de la gente piensa que va a seguir siendo un millón. Pero la realidad es que no. Y te voy a explicar por qué.`, null),

          blk(1, `Esto es la inflación en Colombia de los últimos 5 años. En 2022, la inflación llegó al 13.12 por ciento. Eso significa que un mercado que te costaba 500 mil pesos en enero, en diciembre te costaba 566 mil pesos. Tu salario subió un 10 por ciento pero los precios subieron un 13. Perdiste poder adquisitivo.

En 2023 bajó al 9.28 por ciento, en 2024 al 5.2 por ciento, y en 2025 estamos alrededor del 5 por ciento. Pero ojo: que baje no significa que los precios bajen. Significa que suben más despacio.`, 1),

          blk(2, `Ahora mira este dato. Una cuenta de ahorros en Colombia te paga entre el 0.5 y el 2 por ciento efectivo anual. Pero la inflación es del 5 por ciento. Eso significa que tu plata en la cuenta de ahorros está perdiendo entre 3 y 4.5 por ciento de valor real cada año.

En plata: si tienes 10 millones en tu cuenta de ahorros, estás perdiendo entre 300 y 450 mil pesos de poder de compra cada año. Es como si alguien te robara esa plata pero sin que te des cuenta.`, 2),

          blk(3, `Entonces la pregunta no es "¿debo invertir?". La pregunta es "¿puedo darme el lujo de no hacerlo?". La respuesta es no. Cada día que tu plata está quieta en una cuenta de ahorros, está perdiendo valor. Y el primer paso para cambiar eso es entender qué opciones tienes. Eso es exactamente lo que vamos a ver en las siguientes lecciones.`, null),
        ],
      },
      {
        title: "Ahorrar vs Invertir: No es lo mismo",
        description: "La diferencia fundamental entre guardar plata y ponerla a trabajar.",
        duration: 6,
        script_blocks: [
          blk(0, `Mucha gente piensa que ahorrar e invertir es lo mismo. Y no. Son dos cosas completamente diferentes, y entender la diferencia es el primer paso para mejorar tus finanzas.`, null),

          blk(1, `Ahorrar es guardar plata. La pones debajo del colchón, en una cuenta de ahorros, en una alcancía. Está ahí, disponible, pero no crece. Es como tener un carro parqueado en el garaje: está ahí, pero no te está llevando a ningún lado.

Invertir es poner tu plata a trabajar. Es como poner ese carro a hacer carreras en una plataforma de transporte. Tu plata genera más plata mientras tú duermes, trabajas o estás con tu familia.`, 1),

          blk(2, `Ahora, esto no significa que ahorrar sea malo. De hecho, necesitas ahorrar primero antes de invertir. Pero la diferencia está en el propósito.

Ahorras para el corto plazo: la cuota del colegio, las vacaciones, un imprevisto. Inviertes para el mediano y largo plazo: comprar vivienda, la universidad de tus hijos, tu pensión.

La clave es tener los dos: un fondo de emergencia en ahorro líquido, y el resto en inversiones que le ganen a la inflación. Y el CDT es el primer escalón perfecto para pasar de ahorrador a inversionista.`, 2),
        ],
      },
    ],
  },
  {
    title: "Módulo 2: Organiza tus finanzas primero",
    description: "Antes de invertir un solo peso, necesitas tener claridad sobre tu situación financiera actual.",
    lessons: [
      {
        title: "Cuánto ganas, cuánto gastas, cuánto te queda",
        description: "El ejercicio más importante de tus finanzas personales: tu flujo de caja personal.",
        duration: 7,
        script_blocks: [
          blk(0, `Antes de invertir un solo peso necesitas saber tres números: cuánto ganas, cuánto gastas y cuánto te queda. Si no sabes estos tres números, invertir sería como salir a manejar sin saber cuánta gasolina tienes en el tanque.`, null),

          blk(1, `Vamos a hacer un ejercicio juntos. Toma papel y lápiz o abre una nota en el celular. Primero, tus ingresos. Escribe tu salario neto mensual, lo que te llega a la cuenta después de descuentos. Si tienes ingresos extras como horas extra, bonificaciones, o un negocio alterno, también anótalos pero solo los que sean regulares.

Para un soldado profesional o un patrullero, estamos hablando de un salario entre 1.8 y 3.5 millones según el grado y la antigüedad, más las primas y bonificaciones.`, 1),

          blk(2, `Ahora, los gastos. Y aquí es donde la mayoría de la gente se sorprende. Vamos a dividirlos en tres categorías.

Gastos fijos: arriendo o cuota del crédito hipotecario, servicios públicos, plan del celular, transporte, cuota del carro o la moto si tienes, seguros, pensiones voluntarias. Estos no cambian mucho mes a mes.

Gastos variables: mercado, alimentación fuera de casa, ropa, salidas, entretenimiento. Estos sí cambian.

Gastos hormiga: el tinto de la mañana, la gaseosa, las apuestas, la suscripción que no usas. Son pequeños pero se acumulan. Un tinto de 2 mil pesos diario son 60 mil al mes. 720 mil al año. Esa plata en un CDT al 11 por ciento te genera 79 mil pesos de intereses.`, 2),

          blk(3, `La regla que te recomiendo es el 50-30-20. El 50 por ciento de tu ingreso para necesidades básicas, el 30 para gastos personales, y el 20 para ahorro e inversión. Si ganas 2.5 millones, eso es 1.25 millones en gastos fijos, 750 mil en gastos personales, y 500 mil para invertir.

¿Suena difícil? Puede ser al principio. Pero empieza con lo que puedas. Aunque sea 100 mil pesos mensuales. Lo importante es empezar.`, 3),
        ],
      },
      {
        title: "Tu fondo de emergencia: la base de todo",
        description: "Por qué necesitas un colchón financiero antes de invertir y cómo construirlo.",
        duration: 6,
        script_blocks: [
          blk(0, `Imagina que inviertes toda tu plata en un CDT a 6 meses. Al mes 2, se te daña la moto y necesitas 800 mil pesos para el mecánico. Si no tienes plata líquida disponible, vas a tener que romper el CDT y perder los intereses. Por eso necesitas un fondo de emergencia antes de invertir.`, null),

          blk(1, `El fondo de emergencia es plata que tienes disponible inmediatamente para imprevistos: una urgencia médica, una reparación del vehículo, una emergencia familiar. No es para vacaciones. No es para antojos. Es tu red de seguridad.

¿Cuánto necesitas? La recomendación general es entre 3 y 6 meses de tus gastos fijos. Si tus gastos fijos son de 1.5 millones al mes, tu fondo de emergencia debe ser entre 4.5 y 9 millones de pesos.`, 1),

          blk(2, `¿Dónde guardar el fondo de emergencia? En algo líquido, que puedas sacar rápido. Las mejores opciones en Colombia son:

Cuenta de ahorros de alto rendimiento como la de Nu Bank que paga alrededor del 12.5 por ciento o Lulo Bank que paga alrededor del 10 por ciento. Eso es mucho mejor que el 0.5 por ciento que pagan los bancos tradicionales.

Otra opción son los fondos de inversión colectiva de corto plazo, como los que ofrecen Bancolombia o Davivienda. Tienen un poco más de rentabilidad y puedes retirar en 1 a 3 días hábiles.

Lo importante: el fondo de emergencia no es una inversión. Es un seguro. Una vez lo tengas armado, ahí sí toda la plata extra va directo a inversiones.`, 2),
        ],
      },
      {
        title: "Deudas buenas vs deudas malas",
        description: "No todas las deudas son iguales. Aprende a identificar cuáles pagar primero.",
        duration: 7,
        script_blocks: [
          blk(0, `Antes de hablar de inversiones necesitamos hablar de deudas. Y ojo con esto: no todas las deudas son malas. Hay deudas que te construyen patrimonio y deudas que te destruyen. Vamos a aprender a diferenciarlas.`, null),

          blk(1, `Las deudas buenas son las que te generan un activo o te hacen ganar más plata en el futuro. El crédito hipotecario es el ejemplo clásico: estás pagando por un activo que se valoriza. Un crédito educativo que te permite mejorar tu perfil profesional y ganar más. Un crédito para un negocio productivo.

Las deudas malas son las que financian consumo. La tarjeta de crédito rotativa es la peor. En Colombia, la tasa de usura está alrededor del 27 por ciento efectivo anual. Eso significa que si debes 5 millones en la tarjeta de crédito y solo pagas el mínimo, en un año esos 5 millones se convierten en 6.35 millones. Los intereses se están comiendo tu plata más rápido que cualquier inversión te la puede generar.`, 1),

          blk(2, `Entonces la regla es clara. Si tienes deudas de tarjeta de crédito, créditos de consumo o préstamos de gota a gota, lo primero es pagar esas deudas. Ninguna inversión te va a dar un 27 o 30 por ciento de retorno seguro. Pero pagar una deuda al 27 por ciento es equivalente a ganar ese 27 por ciento.

El orden es: primero paga deudas malas de mayor tasa, luego arma tu fondo de emergencia, y después empieza a invertir. Si ya tienes solo deudas buenas como el crédito hipotecario, puedes invertir al mismo tiempo que pagas esa deuda.`, 2),

          blk(3, `Te doy un truco que funciona muy bien para los que reciben prima de servicios o prima de navidad. Destina la mitad de esas primas a pagar la deuda más cara que tengas. Y la otra mitad al fondo de emergencia o a tu primer CDT. En un año puedes estar libre de deudas malas y listo para invertir.`, null),
        ],
      },
    ],
  },
  {
    title: "Módulo 3: El CDT explicado de verdad",
    description: "Todo lo que necesitas saber sobre los Certificados de Depósito a Término: cómo funcionan, tasas, y seguridad.",
    lessons: [
      {
        title: "¿Qué es un CDT y cómo funciona?",
        description: "Explicación sencilla y completa del instrumento de inversión más seguro de Colombia.",
        duration: 8,
        script_blocks: [
          blk(0, `El CDT, o Certificado de Depósito a Término, es probablemente la inversión más segura que existe en Colombia. Y es perfecta para empezar. Te voy a explicar cómo funciona con un ejemplo real.`, null),

          blk(1, `Imagina que tienes 5 millones de pesos. Vas al banco y le dices: "Quiero abrir un CDT". Lo que estás haciendo es prestarle tu plata al banco por un tiempo determinado. A cambio, el banco te paga intereses.

Es como si tú fueras el banco y el banco fuera tu cliente. Tú le prestas 5 millones, y al final del plazo el banco te devuelve esos 5 millones más los intereses. Simple.`, 1),

          blk(2, `Los componentes de un CDT son cuatro. Primero, el capital: cuánta plata metes. Segundo, la tasa de interés: cuánto te van a pagar. Tercero, el plazo: por cuánto tiempo le prestas al banco, que puede ser desde 30 días hasta 5 años. Y cuarto, la periodicidad del pago de intereses: te pueden pagar los intereses al vencimiento, mensual, trimestral o anual.

Ejemplo real: si pones 5 millones en un CDT al 10.5 por ciento efectivo anual a 360 días con pago al vencimiento, al final del año recibes tus 5 millones más 525 mil pesos de intereses. Antes de impuestos, claro, que eso lo vemos más adelante.`, 2),

          blk(3, `Ahora, lo importante: durante el plazo que elegiste, tú no puedes sacar esa plata. Por eso se llama "a término". Si necesitas la plata antes, puedes venderlo en el mercado secundario pero normalmente con una penalidad. Por eso es clave tener tu fondo de emergencia separado.

La ventaja es que la tasa es fija. El día que lo abres, sabes exactamente cuánto vas a recibir al final. No hay sorpresas. No hay riesgo de perder plata. Es predecible y seguro.`, null),
        ],
      },
      {
        title: "Tasas de interés: EA, NMV y cómo comparar",
        description: "Aprende a leer las tasas para que no te engañen y puedas comparar entre bancos.",
        duration: 8,
        script_blocks: [
          blk(0, `Cuando vas a un banco a preguntar por un CDT, te van a decir cosas como "tasa del 10.5 EA" o "tasa del 10 NMV". Si no entiendes estas siglas, no puedes comparar y te pueden dar la opción que más le conviene al banco y no a ti.`, null),

          blk(1, `EA significa Efectiva Anual. Es la tasa real que ganas en un año, incluyendo el efecto del interés compuesto. Esta es la que debes usar siempre para comparar. Si un banco te ofrece 10.5 por ciento EA, eso es lo que realmente ganas sobre tu plata en un año.

NMV significa Nominal Mes Vencido. Es la tasa nominal dividida en 12 meses. Una tasa del 10 por ciento NMV parece más baja que una del 10.5 EA, pero ojo: al convertirla a EA, el 10 NMV es equivalente aproximadamente a un 10.47 EA. Entonces son casi iguales.`, 1),

          blk(2, `La fórmula para convertir NMV a EA es: EA igual a la cantidad uno más la tasa NMV dividida entre 12, todo eso elevado a la 12, menos 1. Pero tranquilo, no necesitas hacer la cuenta a mano. Todos los bancos están obligados a mostrarte la tasa EA. Y en internet hay calculadoras gratis.

La regla simple: siempre compara en EA. Si el Banco A te ofrece 10.5 EA y el Banco B te ofrece 10.2 EA, el Banco A te paga más. Así de sencillo.

Y un tip importante: las tasas cambian según el monto y el plazo. Generalmente, entre más plata pongas y más largo sea el plazo, mejor tasa te dan.`, 2),
        ],
      },
      {
        title: "CDT vs Cuenta de ahorros vs FIC",
        description: "Compara las tres opciones más comunes para tu plata en Colombia.",
        duration: 7,
        script_blocks: [
          blk(0, `Ya sabes qué es un CDT. Pero seguramente te preguntas: ¿es mejor que una cuenta de ahorros? ¿Qué pasa con los fondos de inversión? Vamos a comparar las tres opciones más comunes en Colombia.`, null),

          blk(1, `Primero, la cuenta de ahorros tradicional. Bancolombia, Davivienda, Banco de Bogotá te pagan entre 0.5 y 2 por ciento EA. Es decir, si tienes 10 millones, al año ganas entre 50 mil y 200 mil pesos. Con una inflación del 5 por ciento, estás perdiendo plata. La ventaja es la liquidez total: puedes sacar tu plata cuando quieras.

Las cuentas de ahorro digitales son mejor opción. Nu Bank paga alrededor de 12.5 por ciento EA sobre los primeros 10 millones. Eso ya le gana a la inflación. Lulo Bank paga alrededor del 10 por ciento. Estas son buenas para tu fondo de emergencia.`, 1),

          blk(2, `El CDT, como ya vimos, te paga entre el 9 y el 12 por ciento EA dependiendo del banco, el monto y el plazo. La tasa es fija y garantizada. El precio que pagas es la falta de liquidez: tu plata queda amarrada durante el plazo.

Los FICs, o Fondos de Inversión Colectiva, son como una canasta donde mucha gente pone plata junta y un administrador profesional la invierte. Los hay de bajo riesgo que invierten en CDTs y bonos del gobierno, y de mayor riesgo que incluyen acciones. Los de bajo riesgo rinden entre 8 y 11 por ciento EA. La ventaja es que puedes retirar generalmente en 3 a 5 días hábiles.`, 2),

          blk(3, `Entonces, ¿cuál elegir? Las tres. No pongas toda la plata en un solo lugar.

Tu fondo de emergencia va en la cuenta de ahorros de alto rendimiento como Nu o Lulo: liquidez inmediata y buena tasa.

Tu inversión segura a mediano plazo va en CDTs: tasa fija, cero riesgo, y le gana a la inflación.

Si ya tienes más experiencia y quieres diversificar, los FICs de bajo riesgo son un buen complemento.

En este curso nos vamos a enfocar en el CDT porque es el punto de partida perfecto para todo inversionista principiante.`, 3),
        ],
      },
      {
        title: "Fogafín: tu plata está protegida",
        description: "Cómo funciona el seguro de depósitos en Colombia y por qué tu CDT es seguro.",
        duration: 5,
        script_blocks: [
          blk(0, `Una de las preguntas más comunes que me hacen es: ¿y si el banco quiebra? ¿Pierdo mi plata? La respuesta corta es no, hasta cierto monto. Y eso es gracias al Fogafín.`, null),

          blk(1, `Fogafín es el Fondo de Garantías de Instituciones Financieras. Es una entidad del gobierno colombiano que protege el dinero de los ahorradores e inversionistas. Funciona como un seguro.

Si tu banco quiebra, Fogafín te devuelve hasta 50 millones de pesos por persona, por entidad financiera. Eso cubre cuentas de ahorro, cuentas corrientes y CDTs.

Entonces, si tienes 30 millones en un CDT en Bancolombia y Bancolombia quebrara, que es prácticamente imposible, Fogafín te devuelve tus 30 millones completos.`, 1),

          blk(2, `Ahora, si tienes más de 50 millones para invertir, el truco es distribuirlos entre diferentes bancos. 50 millones en Bancolombia, 50 en Davivienda, 50 en Banco de Bogotá. Así cada porción está cubierta por Fogafín.

Pero seamos realistas: la probabilidad de que un banco grande en Colombia quiebre es extremadamente baja. Están regulados por la Superintendencia Financiera y tienen requisitos de capital muy estrictos. El Fogafín es una red de seguridad extra que te da total tranquilidad.

Esto es lo que hace al CDT la inversión más segura de Colombia: tasa fija garantizada más protección del Fogafín. Es casi imposible perder plata.`, 2),
        ],
      },
    ],
  },
  {
    title: "Módulo 4: Abre tu primer CDT paso a paso",
    description: "Guía práctica para comparar opciones, elegir el mejor banco y abrir tu CDT desde el celular.",
    lessons: [
      {
        title: "Comparar CDTs en Colombia: ¿Cuál banco paga más?",
        description: "Tabla comparativa actualizada de los principales bancos colombianos y sus tasas de CDT.",
        duration: 8,
        script_blocks: [
          blk(0, `Llegó la hora de la verdad. Vamos a comparar los CDTs de los principales bancos en Colombia para que tomes la mejor decisión. Las tasas que te voy a mostrar son aproximadas y pueden variar, pero te dan una idea clara de dónde buscar.`, null),

          blk(1, `Para CDTs a 360 días con un monto de 5 millones, así están las tasas aproximadas en 2026:

Pibank: 11.0 por ciento EA. Es un banco digital que consistentemente ofrece de las mejores tasas del mercado.
Banco Finandina: 10.8 por ciento EA. Otro banco que compite fuerte en tasas.
RappiPay: 10.5 por ciento EA. La ventaja es que todo se hace desde la app de Rappi.
Bancolombia: 9.5 por ciento EA. No es la mejor tasa pero es el banco más grande del país.
Davivienda: 9.3 por ciento EA. Similar a Bancolombia.
Nu Bank: No ofrece CDTs pero su cuenta de ahorros paga 12.5 por ciento EA sobre los primeros 10 millones, que en la práctica es mejor que muchos CDTs y con liquidez total.`, 1),

          blk(2, `Ahora, la tasa no es lo único que importa. También debes considerar:

Monto mínimo: algunos bancos piden mínimo un millón, otros desde 100 mil pesos. Pibank permite desde 100 mil.

Facilidad de apertura: los bancos digitales como Pibank, RappiPay y Nu te permiten abrir desde la app en minutos. Los bancos tradicionales a veces requieren ir a la sucursal.

Solidez del banco: todos los bancos regulados en Colombia están supervisados por la Superintendencia Financiera y cubiertos por Fogafín. Pero si te da más tranquilidad un banco grande, Bancolombia y Davivienda son opciones sólidas.

Mi recomendación para principiantes: abre tu primer CDT en un banco digital como Pibank por la tasa y la facilidad. Cuando tengas más confianza, puedes diversificar entre varios bancos.`, 2),
        ],
      },
      {
        title: "Requisitos y documentos para abrir un CDT",
        description: "Lo que necesitas tener listo antes de ir al banco o abrir uno digital.",
        duration: 5,
        script_blocks: [
          blk(0, `Abrir un CDT en Colombia es más fácil de lo que la mayoría piensa. Te voy a decir exactamente qué necesitas para que no pierdas tiempo.`, null),

          blk(1, `Los requisitos básicos son:

Cédula de ciudadanía vigente. Si eres militar o policía, tu cédula militar también funciona en la mayoría de bancos.

Tener una cuenta en el banco donde vas a abrir el CDT, o abrirla al mismo tiempo. En los bancos digitales esto se hace en la misma app en menos de 10 minutos.

El dinero disponible. Puede estar en tu cuenta del mismo banco o puedes hacer una transferencia desde otro banco.

Y en algunos bancos te piden firmar un formulario de vinculación y hacer el proceso de conocimiento del cliente, que básicamente es responder unas preguntas sobre tus ingresos y actividad económica.`, 1),

          blk(2, `Para servidores públicos y miembros de la fuerza pública, hay un dato importante: tu condición de servidor público puede requerir una declaración adicional de persona políticamente expuesta o PEP. No es nada complicado, solo es una casilla que marcas y un formulario corto. Esto aplica más para oficiales de alto rango.

Mi consejo: si nunca has tenido cuenta en el banco donde quieres abrir el CDT, haz todo junto. Abre la cuenta de ahorros y el CDT el mismo día. En bancos digitales como Pibank esto se hace completamente desde el celular sin ir a ninguna oficina.`, null),
        ],
      },
      {
        title: "Demo: Abrir tu CDT digital paso a paso",
        description: "Guía visual paso a paso para abrir un CDT desde tu celular.",
        duration: 10,
        script_blocks: [
          blk(0, `Ahora vamos con la parte práctica. Te voy a mostrar paso a paso cómo abrir un CDT digital. Voy a usar el proceso de un banco digital como ejemplo, pero los pasos son muy similares en cualquier banco.`, null),

          blk(1, `Paso uno: Descarga la app del banco. Ve a la tienda de aplicaciones de tu celular, busca la app del banco que elegiste, descárgala e instálala.

Paso dos: Crea tu cuenta. Te van a pedir tu número de cédula, tu correo electrónico, tu número de celular y crear una contraseña. Algunos bancos te piden tomarte una selfie y una foto de tu cédula para verificar tu identidad.

Paso tres: Espera la aprobación. En bancos digitales esto puede tomar desde minutos hasta 24 horas. Te llega una notificación cuando tu cuenta está activa.`, 1),

          blk(2, `Paso cuatro: Transfiere el dinero. Desde tu banco principal, haz una transferencia a tu nueva cuenta. Puedes usar PSE, transferencia directa o Transfiya. Recuerda que las transferencias entre bancos pueden tomar algunas horas.

Paso cinco: Ve a la sección de inversiones o CDTs dentro de la app. Generalmente está en el menú principal como "Inversiones", "CDT" o "Productos".

Paso seis: Elige las condiciones. Selecciona el monto que quieres invertir, el plazo en días que puede ser 90, 180, 360 o más, y la forma de pago de intereses que puede ser al vencimiento o periódico.`, 2),

          blk(3, `Paso siete: Revisa el resumen. La app te va a mostrar un resumen con el monto, la tasa, el plazo, la fecha de vencimiento y cuánto vas a recibir al final. Revisa que todo esté correcto.

Paso ocho: Confirma. Acepta los términos y condiciones y confirma la operación. En algunos bancos te piden un código de verificación por SMS o correo.

Y listo. Tu CDT queda abierto. Vas a recibir un certificado digital y puedes ver tu CDT dentro de la app en la sección de inversiones.

Recuerda: una vez abierto, tu plata queda invertida hasta la fecha de vencimiento. Marca esa fecha en tu calendario para decidir si renuevas o retiras.`, 3),
        ],
      },
      {
        title: "Impuestos: Retención en la fuente y 4x1000",
        description: "Lo que el banco te descuenta y cómo declarar los rendimientos de tu CDT.",
        duration: 7,
        script_blocks: [
          blk(0, `Este tema no es el más emocionante pero es fundamental que lo entiendas antes de abrir tu CDT. Porque la tasa que te muestra el banco no es exactamente lo que te va a llegar al bolsillo. Hay dos impuestos que debes conocer.`, null),

          blk(1, `El primero es la retención en la fuente. Cuando tu CDT genera rendimientos, el banco automáticamente te descuenta un porcentaje como anticipo de tu impuesto de renta. En 2026, la retención en la fuente sobre rendimientos financieros es del 4 por ciento para CDTs a más de un año, y del 7 por ciento para CDTs a menos de un año.

Ejemplo práctico: si tu CDT a 360 días genera 525 mil pesos de intereses, el banco te retiene el 7 por ciento que son 36,750 pesos. Te llegan 488,250 pesos netos. No es una pérdida, es un anticipo de tu declaración de renta que puedes descontar después.`, 1),

          blk(2, `El segundo es el 4 por mil o GMF, que es el Gravamen a los Movimientos Financieros. Cada vez que retiras plata de una cuenta, te cobran el 4 por mil. Es decir, por cada millón te cobran 4 mil pesos. En el caso del CDT, te lo cobran cuando el dinero vuelve a tu cuenta al vencimiento.

Sobre 5 millones más intereses, el 4 por mil son unos 22 mil pesos. No es mucho, pero sumado a la retención, debes tenerlo en cuenta.

Un tip importante: puedes marcar una cuenta como exenta del 4 por mil. Cada persona puede tener una cuenta de ahorros o corriente exenta. Si tu CDT vence y la plata cae en tu cuenta exenta, no te cobran el 4 por mil. Pregunta en tu banco cómo marcar tu cuenta.`, 2),

          blk(3, `Entonces, resumiendo con un ejemplo real. Si inviertes 5 millones a un año al 10.5 EA:

Intereses brutos: 525 mil pesos.
Retención en la fuente del 7 por ciento: menos 36,750.
4 por mil al retirar: menos 22 mil aproximadamente.
Te quedan alrededor de 466 mil pesos netos.

Tu rentabilidad real neta es de aproximadamente 9.3 por ciento. Sigue siendo mucho mejor que el 0.5 por ciento de la cuenta de ahorros y sigue ganándole a la inflación. Eso es lo que importa.`, 3),
        ],
      },
    ],
  },
  {
    title: "Módulo 5: Estrategias y siguientes pasos",
    description: "Técnicas avanzadas para maximizar tus CDTs y tu hoja de ruta como inversionista.",
    lessons: [
      {
        title: "La escalera de CDTs: tu primera estrategia",
        description: "Cómo distribuir tu dinero en varios CDTs para tener liquidez sin perder rentabilidad.",
        duration: 7,
        script_blocks: [
          blk(0, `Ahora que ya sabes cómo abrir un CDT, te voy a enseñar la primera estrategia de inversión real: la escalera de CDTs. Es simple, elegante, y te resuelve el problema de la liquidez.`, null),

          blk(1, `El problema de un CDT es que tu plata queda amarrada. Si pones 6 millones en un CDT a 12 meses, no puedes tocar esa plata en un año. Pero con la escalera de CDTs, resuelves eso.

En lugar de poner los 6 millones en un solo CDT, divides la plata en partes iguales con diferentes plazos:

CDT 1: 2 millones a 3 meses.
CDT 2: 2 millones a 6 meses.
CDT 3: 2 millones a 12 meses.

Cada 3 meses te vence un CDT. Si no necesitas la plata, lo renuevas a 12 meses para obtener la mejor tasa. Si la necesitas, la tienes disponible sin romper ningún CDT.`, 1),

          blk(2, `Después de un año, todos tus CDTs están a 12 meses pero con vencimientos escalonados cada 3 meses. Tienes la mejor tasa del mercado con acceso a una porción de tu plata cada trimestre.

Esta estrategia es perfecta para la prima de servicios y la prima de navidad. Recibiste 4 millones de prima? Abre un CDT a 3 meses con 1 millón, otro a 6 meses, otro a 9 y otro a 12. Listo: tu escalera está armada.

Con el tiempo, a medida que renuevas y agregas más plata, tu escalera crece y tus intereses se van reinvirtiendo. Ahí es donde empieza la magia del interés compuesto.`, 2),
        ],
      },
      {
        title: "¿Renovar o retirar? Qué hacer cuando vence tu CDT",
        description: "Las opciones que tienes al vencimiento y cómo tomar la mejor decisión.",
        duration: 6,
        script_blocks: [
          blk(0, `Se llegó la fecha de vencimiento de tu CDT. El banco te va a preguntar qué quieres hacer. Tienes tres opciones y te voy a explicar cuándo usar cada una.`, null),

          blk(1, `Opción 1: Renovar al mismo banco a la misma tasa o a la tasa vigente. Esta es la opción por defecto. Si no haces nada, muchos bancos renuevan automáticamente tu CDT a las condiciones del momento. Ojo con esto: la tasa puede haber bajado. Siempre revisa la tasa antes de dejar que se renueve solo.

Opción 2: Renovar capital más intereses. En lugar de sacar los intereses, los reinviertes. Si tu CDT original era de 5 millones y generó 525 mil de intereses, ahora tu nuevo CDT es de 5 millones 525 mil. El próximo año generas intereses sobre esos 5.525 millones. Esto es interés compuesto y es la forma más poderosa de hacer crecer tu plata.

Opción 3: Retirar todo o una parte. Si necesitas la plata o quieres moverla a otro banco con mejor tasa, retiras al vencimiento sin penalidad.`, 1),

          blk(2, `Mi consejo es: antes de renovar, compara. Cada vez que te venza un CDT, revisa las tasas de otros bancos. Si Pibank te ofrece medio punto porcentual más que tu banco actual, mueve la plata. Medio punto en 10 millones son 50 mil pesos extra al año. En 10 años, con interés compuesto, son más de 700 mil pesos de diferencia.

Y si las tasas están bajando en general, considera plazos más largos para asegurar una buena tasa. Si las tasas están subiendo, CDTs cortos para renovar pronto a mejor tasa.`, null),
        ],
      },
      {
        title: "Después del CDT: FICs, acciones y ETFs",
        description: "Una mirada al siguiente nivel de inversiones cuando ya domines los CDTs.",
        duration: 7,
        script_blocks: [
          blk(0, `El CDT es tu primer escalón. Pero no es el último. Cuando ya tengas confianza y experiencia con CDTs, hay un mundo de opciones para diversificar y potencialmente obtener mayores rendimientos. Te voy a dar un panorama rápido de lo que viene después.`, null),

          blk(1, `El siguiente paso natural son los Fondos de Inversión Colectiva o FICs. En Colombia los ofrecen las fiduciarias como Fiducolombia, Fidubogotá, o las comisionistas de bolsa como Valores Bancolombia o Davivienda Corredores.

Los FICs de renta fija invierten en CDTs, bonos del gobierno y deuda corporativa. Son de bajo riesgo y rinden entre 8 y 11 por ciento EA. La ventaja sobre el CDT es que son más líquidos: puedes retirar en 3 a 5 días.

Los FICs de renta variable incluyen acciones colombianas e internacionales. Mayor riesgo pero mayor potencial de rentabilidad a largo plazo.`, 1),

          blk(2, `Luego vienen las acciones individuales. En Colombia puedes invertir en la Bolsa de Valores de Colombia a través de una comisionista. Empresas como Ecopetrol, Bancolombia, ISA, Grupo Energía Bogotá. El mínimo para empezar es bajo, pero necesitas estudiar más antes de entrar.

Y los ETFs o fondos indexados son la forma más fácil de invertir en el mercado global. A través de plataformas como Tyba o las comisionistas colombianas, puedes invertir en un ETF que replica el índice S&P 500 de Estados Unidos, que históricamente ha rendido alrededor del 10 por ciento anual en dólares.`, 2),

          blk(3, `La pirámide de inversión que te recomiendo es así:

En la base, tu fondo de emergencia en cuenta de ahorros de alto rendimiento: 3 a 6 meses de gastos.

En el medio, CDTs y FICs de renta fija: tu inversión segura que le gana a la inflación.

En la parte alta, FICs de renta variable, acciones y ETFs: tu inversión de crecimiento a largo plazo.

Empiezas por la base y vas subiendo. No saltes escalones. Primero domina el CDT, y cuando tengas 6 a 12 meses de experiencia, explora los FICs. Las acciones y ETFs pueden esperar.

Pero eso es para otro curso. Por ahora, tu misión es abrir tu primer CDT.`, 3),
        ],
      },
      {
        title: "Tu plan de acción: abre tu CDT esta semana",
        description: "Resumen del curso y pasos concretos para empezar a invertir hoy.",
        duration: 6,
        script_blocks: [
          blk(0, `Llegamos al final del curso y quiero que te vayas con un plan de acción concreto. No con intenciones. Con pasos. Porque la diferencia entre las personas que logran sus metas financieras y las que no, es la acción.`, null),

          blk(1, `Tu plan de acción para esta semana es el siguiente:

Día 1 y 2: Haz el ejercicio del módulo 2. Anota cuánto ganas, cuánto gastas y cuánto te queda. Identifica tus gastos hormiga. Usa la regla 50-30-20.

Día 3: Si tienes deudas de tarjeta de crédito o créditos de consumo, haz un plan para pagarlas. Llama a tu banco y negocia la tasa si es muy alta. Si no tienes deudas malas, pasa al siguiente paso.

Día 4: Revisa cuánto tienes disponible para invertir. Recuerda: tu fondo de emergencia va primero. Si ya lo tienes, define cuánto vas a poner en tu primer CDT.`, 1),

          blk(2, `Día 5: Compara las tasas de CDT entre al menos 3 bancos. Usa la tabla que vimos en el módulo 4. Elige el banco que te ofrezca la mejor combinación de tasa y facilidad.

Día 6: Abre la cuenta y el CDT. Si elegiste un banco digital, todo lo haces desde el celular. Si elegiste un banco tradicional, agenda tu cita.

Día 7: Celebra. Acabas de dar el paso más importante de tu vida financiera. Ahora tu plata está trabajando para ti.

Y no te detengas ahí. Cada mes, cuando te llegue el salario, separa una parte para tu próximo CDT. En un año vas a tener una escalera de CDTs funcionando y vas a sentir la diferencia.`, 2),

          blk(3, `Gracias por tomar este curso. De verdad me alegra que hayas llegado hasta aquí. Esto demuestra que te importa tu futuro financiero y el de tu familia. Como servidor público y miembro de nuestra fuerza pública, mereces que tu esfuerzo se traduzca en estabilidad y crecimiento para los tuyos.

Si tienes preguntas, escríbeme por el chat de la plataforma o por WhatsApp. Estoy aquí para ayudarte.

Un abrazo. Y recuerda: la mejor inversión es la que haces hoy.`, null),
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// SEED EXECUTION
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log("🚀 Creando curso: Inversiones para Principiantes...\n");

  // 1. Create course
  const { data: course, error: courseErr } = await sb
    .from("courses")
    .insert({
      title: COURSE.title,
      slug: slug(COURSE.title),
      description: COURSE.description,
      price: COURSE.price,
      status: COURSE.status,
      total_hours: COURSE.total_hours,
      instructor_name: COURSE.instructor_name,
      instructor_bio: COURSE.instructor_bio,
    })
    .select()
    .single();

  if (courseErr) { console.error("❌ Error creando curso:", courseErr); return; }
  console.log(`✅ Curso creado: ${course.id}`);

  // 2. Create modules + lessons
  for (let mi = 0; mi < MODULES.length; mi++) {
    const mod = MODULES[mi];
    const { data: module, error: modErr } = await sb
      .from("course_modules")
      .insert({
        course_id: course.id,
        title: mod.title,
        description: mod.description,
        order: mi,
      })
      .select()
      .single();

    if (modErr) { console.error(`❌ Error módulo ${mi}:`, modErr); continue; }
    console.log(`  📦 Módulo ${mi + 1}: ${mod.title}`);

    for (let li = 0; li < mod.lessons.length; li++) {
      const les = mod.lessons[li];
      const { data: lesson, error: lesErr } = await sb
        .from("lessons")
        .insert({
          module_id: module.id,
          title: les.title,
          description: les.description,
          duration: les.duration,
          order: li,
          is_free: li === 0 && mi === 0, // First lesson is free
          script: les.script_blocks.map((b) => b.text).join("\n\n---\n\n"),
          script_blocks: les.script_blocks,
          presentation_url: null,
        })
        .select()
        .single();

      if (lesErr) { console.error(`    ❌ Error lección ${li}:`, lesErr); continue; }
      console.log(`    📝 Lección ${li + 1}: ${les.title} (${les.script_blocks.length} bloques)`);
    }
  }

  console.log(`\n🎉 ¡Curso creado exitosamente!`);
  console.log(`   ID: ${course.id}`);
  console.log(`   URL admin: /admin/cursos/${course.id}`);
  console.log(`   Módulos: ${MODULES.length}`);
  console.log(`   Lecciones: ${MODULES.reduce((sum, m) => sum + m.lessons.length, 0)}`);
  console.log(`   Bloques de guión: ${MODULES.reduce((sum, m) => sum + m.lessons.reduce((s, l) => s + l.script_blocks.length, 0), 0)}`);
}

seed().catch(console.error);
