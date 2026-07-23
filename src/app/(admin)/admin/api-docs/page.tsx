"use client";

import { Webhook, Copy, KeyRound, Bell, ShieldAlert, Link2 } from "lucide-react";
import { toast } from "sonner";

const BASE = "https://legionjuridica.com";

function Code({ children }: { children: string }) {
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 pr-10 overflow-x-auto leading-relaxed"><code>{children}</code></pre>
      <button
        onClick={() => { navigator.clipboard.writeText(children); toast.success("Copiado"); }}
        className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-gray-200 p-1.5 rounded-md transition-colors"
        title="Copiar"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
      <h2 className="text-gray-900 font-bold text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-oro" /> {title}</h2>
      {children}
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
          <Webhook className="w-5 h-5 text-oro" /> API / Integración
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Documentación de las APIs que exponemos para que otros sistemas (ej. legalaid) consuman datos de Legión.
        </p>
      </div>

      {/* API de notificaciones */}
      <div className="bg-amber-50 border border-oro/20 rounded-xl p-4 flex items-start gap-3">
        <Bell className="w-5 h-5 text-oro flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-gray-900 font-bold text-sm">API de Notificaciones</p>
          <p className="text-gray-600 text-xs mt-0.5">
            Entrega, por usuario (según su email), los contadores para pintar las notificaciones (círculos) en un menú externo.
            No depende de la sesión de Legión: se consume server-to-server con una API key.
          </p>
        </div>
      </div>

      <Section icon={KeyRound} title="Autenticación">
        <p className="text-gray-600 text-sm">Toda petición requiere la API key en el header. Si falta o es incorrecta → <strong>401</strong>.</p>
        <Code>{`X-API-Key: TU_API_KEY`}</Code>
        <p className="text-gray-500 text-xs">
          También se acepta <span className="font-mono">Authorization: Bearer TU_API_KEY</span>.
          La clave se configura en la variable de entorno <span className="font-mono text-gray-700">NOTIF_API_KEY</span> (Vercel) y se comparte con el sistema que consume. Para rotarla, cambia esa variable.
        </p>
      </Section>

      <Section icon={Link2} title="Endpoint">
        <Code>{`GET ${BASE}/api/integracion/notificaciones?email=<EMAIL_DEL_USUARIO>`}</Code>
        <p className="text-gray-600 text-sm">
          <strong>email</strong> — el correo del usuario en sesión del sistema externo. Debe coincidir <em>exactamente</em> (sin distinguir mayúsculas) con el email del miembro en <span className="font-mono">Equipo</span> de Legión. Su rol se determina por ese registro.
        </p>
      </Section>

      <Section icon={Bell} title="Respuesta — Admin">
        <p className="text-gray-600 text-sm">Un contador: <strong>casos activos sin asignar</strong>.</p>
        <Code>{`{
  "email": "admin@ejemplo.com",
  "rol": "admin",
  "sin_asignar": {
    "count": 5,
    "casos": [
      { "id": "...", "titulo": "...", "cliente": "...", "area": "...", "etapa": "...", "fecha_limite": "..." }
    ]
  }
}`}</Code>
      </Section>

      <Section icon={Bell} title="Respuesta — Abogado">
        <p className="text-gray-600 text-sm">Dos contadores: <span className="text-green-600 font-medium">verde</span> = casos nuevos que no ha visto · <span className="text-red-600 font-medium">rojo</span> = casos por vencerse.</p>
        <Code>{`{
  "email": "abogado@ejemplo.com",
  "rol": "abogado",
  "nuevos_no_vistos": { "count": 3, "casos": [ /* ... */ ] },
  "por_vencer":       { "count": 1, "casos": [ /* ... */ ] }
}`}</Code>
      </Section>

      <Section icon={ShieldAlert} title="Cómo se calcula cada contador">
        <ul className="text-gray-600 text-sm space-y-1.5 list-disc pl-5">
          <li><strong>Admin · sin asignar:</strong> casos <strong>activos</strong> (no cerrados) sin abogado asignado.</li>
          <li><strong>Abogado · nuevos no vistos (verde):</strong> casos asignados a él, activos, que <strong>aún no ha abierto</strong> en la plataforma (sin registro de apertura). Cuando abre el caso, deja de contar.</li>
          <li><strong>Abogado · por vencer (rojo):</strong> casos asignados a él, activos, con fecha límite <strong>dentro de los próximos 2 días o ya vencidos</strong>.</li>
        </ul>
        <p className="text-gray-500 text-xs">Cada caso de la lista trae: <span className="font-mono">id, titulo, cliente, area, etapa, fecha_limite</span>.</p>
      </Section>

      <Section icon={ShieldAlert} title="Errores">
        <ul className="text-gray-600 text-sm space-y-1 list-disc pl-5">
          <li><span className="font-mono">401</span> — API key ausente o incorrecta.</li>
          <li><span className="font-mono">400</span> — falta el parámetro <span className="font-mono">email</span>.</li>
          <li><span className="font-mono">404</span> — el email no corresponde a ningún miembro del equipo.</li>
        </ul>
      </Section>

      <Section icon={Link2} title="Ejemplo (curl)">
        <Code>{`curl -H "X-API-Key: TU_API_KEY" \\
  "${BASE}/api/integracion/notificaciones?email=abogado@ejemplo.com"`}</Code>
      </Section>

      <Section icon={Link2} title="Abrir un caso desde la notificación">
        <p className="text-gray-600 text-sm">
          Con el <span className="font-mono">id</span> de cada caso, el sistema externo puede abrirlo dentro del iframe de Legión navegando a:
        </p>
        <Code>{`${BASE}/admin/casos/<ID_DEL_CASO>`}</Code>
      </Section>
    </div>
  );
}
