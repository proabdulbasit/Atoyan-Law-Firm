import { NextResponse } from "next/server";

export async function GET() {
  const hasWp = Boolean(process.env.WP_USER && process.env.WP_PASSWORD);
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    ok: true,
    status: "healthy",
    app: "WoodMart Law Content Autopilot",
    environment: {
      llm_default: hasOpenAi ? "OpenAI" : hasGemini ? "Gemini" : "Simulator",
      visual_assets: hasGemini ? "Google Imagen 3" : hasOpenAi ? "OpenAI DALL-E 3" : "Binary PNG Engine",
      wordpress_connection: hasWp ? "Configured" : "Browser Settings / Environment Ready",
      target_site: "demo.wp-post.com",
    },
  });
}
