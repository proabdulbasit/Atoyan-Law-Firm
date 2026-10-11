import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const TEMPLATES: Record<string, { bg: string; accent: string; label: string }> = {
  sunset: { bg: "linear-gradient(135deg,#ff5f6d,#ffc371)", accent: "#7a1f2b", label: "Sunset" },
  midnight: { bg: "linear-gradient(135deg,#0f2027,#203a43,#2c5364)", accent: "#ffffff", label: "Midnight" },
  paper: { bg: "linear-gradient(135deg,#f5f0e6,#e6dfce)", accent: "#2c2416", label: "Paper" },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "Untitled Article").slice(0, 120);
  const templateKey = searchParams.get("template") ?? "sunset";
  const template = TEMPLATES[templateKey] ?? TEMPLATES.sunset;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: template.bg,
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: template.accent,
            opacity: 0.75,
            marginBottom: 16,
          }}
        >
          {template.label} Template
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            color: template.accent,
            maxWidth: "90%",
          }}
        >
          {title}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
