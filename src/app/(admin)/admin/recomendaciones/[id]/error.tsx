"use client";

export default function AliadoDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
        <h2 className="text-red-800 font-bold text-lg">Error en la página</h2>
        <pre className="text-red-700 text-xs bg-red-100 rounded-lg p-3 overflow-auto whitespace-pre-wrap break-all max-h-60">
          {error.message}
          {error.stack && "\n\n" + error.stack}
        </pre>
        {error.digest && <p className="text-red-500 text-xs">Digest: {error.digest}</p>}
        <button
          onClick={reset}
          className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
