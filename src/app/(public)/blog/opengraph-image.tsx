import { ImageResponse } from "next/og";

export const alt = "Consulta legal gratis para militares y policías — Legión Jurídica";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #12210F 0%, #0B160A 60%, #0B160A 100%)",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Barra de acento dorada */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: "#C8A96E", display: "flex" }} />

        {/* Marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 34 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(200,169,110,0.18)", border: "1px solid rgba(200,169,110,0.4)", display: "flex" }} />
          <div style={{ color: "#C8A96E", fontSize: 26, fontWeight: 800, letterSpacing: 6, display: "flex" }}>
            LEGIÓN JURÍDICA
          </div>
        </div>

        {/* Titular */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#FFFFFF", fontSize: 74, fontWeight: 800, lineHeight: 1.02, display: "flex" }}>
            Consulta legal
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 4 }}>
            <div style={{ color: "#C8A96E", fontSize: 74, fontWeight: 800, lineHeight: 1.02, display: "flex" }}>GRATIS</div>
            <div style={{ color: "#FFFFFF", fontSize: 40, fontWeight: 700, display: "flex" }}>para militares y policías</div>
          </div>
        </div>

        {/* Subtítulo */}
        <div style={{ color: "rgba(212,197,160,0.75)", fontSize: 30, lineHeight: 1.35, marginTop: 28, maxWidth: 900, display: "flex" }}>
          Un abogado experto en derecho militar y policial te orienta, directo a tu correo.
        </div>

        {/* Chips */}
        <div style={{ display: "flex", gap: 14, marginTop: 40 }}>
          {["100% gratis", "Confidencial", "Respuesta en ~8h"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                background: "rgba(200,169,110,0.12)",
                border: "1px solid rgba(200,169,110,0.35)",
                color: "#E8D9B8",
                fontSize: 26,
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: 999,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Pie */}
        <div style={{ position: "absolute", right: 80, bottom: 64, color: "rgba(200,169,110,0.6)", fontSize: 24, display: "flex" }}>
          legionjuridica.com/blog
        </div>
      </div>
    ),
    { ...size }
  );
}
