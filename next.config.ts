import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://ezytsyqebczlpwbahmyw.supabase.co",
              "media-src 'self' blob: https://ezytsyqebczlpwbahmyw.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://ezytsyqebczlpwbahmyw.supabase.co",
              "frame-src https://www.youtube.com https://youtube.com https://player.vimeo.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            // Permitir cámara y micrófono en el propio dominio (necesario para
            // captura de selfie y cédula en el flujo de validación de identidad
            // y onboarding del suscriptor). Geolocalización sigue bloqueada.
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
