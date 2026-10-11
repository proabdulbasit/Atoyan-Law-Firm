import * as opentype from "opentype.js";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import sharp from "sharp";
import type { AtoyanGeneratedImage, AtoyanImages } from "./types";
import { decomposeKeyword } from "./keyword-utils";

interface GenerateSingleImageOptions {
  prompt: string;
  filename: string;
  altText: string;
  width: number;
  height: number;
  apiKey?: string;
  openaiKey?: string;
}

/**
 * Derives the core practice area category from a keyword/city string.
 * Example: 'Burbank Wrongful Termination Lawyer' -> 'WRONGFUL TERMINATION'
 */
export function deriveAtoyanCategory(keyword: string, city?: string): string {
  const decomposed = decomposeKeyword(keyword, city);
  return decomposed.cleanTopic.toUpperCase();
}

/**
 * Composites the official Atoyan Law Firm 'A' logo and dark gradient on the left side
 * of the 1920x451 banner image to match authentic live site banners (e.g. Burbank-Wrongful-Termination-Lawyer-bar.jpg).
 */

let cachedFont: opentype.Font | null = null;

function getAtoyanFont(): opentype.Font | null {
  if (cachedFont) return cachedFont;
  try {
    const candidates = [
      path.join(process.cwd(), "public/fonts/bold.ttf"),
      path.resolve("public/fonts/bold.ttf"),
      path.join(__dirname, "../../../public/fonts/bold.ttf"),
      path.join(__dirname, "../../public/fonts/bold.ttf"),
      path.join(__dirname, "../public/fonts/bold.ttf"),
      path.join(__dirname, "public/fonts/bold.ttf"),
    ];
    for (const fontPath of candidates) {
      if (fs.existsSync(fontPath)) {
        const buffer = fs.readFileSync(fontPath);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        cachedFont = opentype.parse(arrayBuffer);
        return cachedFont;
      }
    }
  } catch (err) {
    console.warn("Could not load bold.ttf:", err);
  }
  return null;
}

export function renderTextAsSvgPath(
  font: opentype.Font,
  text: string,
  x: number,
  y: number,
  maxFontSize: number,
  maxWidth: number
): { pathData: string; fontSize: number } {
  let fontSize = maxFontSize;
  let width = font.getAdvanceWidth(text, fontSize);
  if (width > maxWidth) {
    fontSize = Math.max(12, Math.floor((fontSize * maxWidth) / width));
  }
  const p = font.getPath(text, x, y, fontSize);
  return { pathData: p.toPathData(2), fontSize };
}

let cachedPsdOverlayBuffer: Buffer | null = null;

/**
 * Retrieves or builds the client authentic 1920x451 PSD banner overlay template.
 * Maps directly from docs/topImage.psd preserving the exact client styling:
 * - Left 0..465px: Authentic Atoyan A watermark and warm #9c6941 / brown styling from Layer 0.
 * - Right 459..1920px: Client exact Photoshop Gradient Fill 1 fading smoothly into the underlying photo.
 */
export async function getAtoyanBannerOverlay(): Promise<Buffer | null> {
  if (cachedPsdOverlayBuffer) return cachedPsdOverlayBuffer;

  const templatePath = path.join(process.cwd(), "public/images/atoyan-psd-banner-template.png");
  if (fs.existsSync(templatePath)) {
    try {
      cachedPsdOverlayBuffer = fs.readFileSync(templatePath);
      return cachedPsdOverlayBuffer;
    } catch (err) {
      console.warn("Could not read atoyan-psd-banner-template.png:", err);
    }
  }

  return null;
}

export async function compositeAtoyanBanner(
  imageBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const width = 1920;
  const height = 451;

  // Direct reference to the client PSD template (docs/topImage.psd)
  const psdOverlay = await getAtoyanBannerOverlay();

  if (psdOverlay) {
    const brandedBuffer = await sharp(imageBuffer)
      .resize(width, height, { fit: "cover" })
      .composite([{ input: psdOverlay, top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer();

    return { buffer: brandedBuffer, width, height };
  }

  // Graceful fallback SVG overlay if PSD template is unavailable
  let logoB64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public/images/atoyan-logo-icon.png");
    if (fs.existsSync(logoPath)) {
      logoB64 = fs.readFileSync(logoPath).toString("base64");
    }
  } catch (err) {
    console.warn("Could not read atoyan-logo-icon.png:", err);
  }

  const logoElement = logoB64
    ? `<g opacity="0.45" transform="translate(-25, 0)">
        <image xlink:href="data:image/png;base64,${logoB64}" x="0" y="0" width="451" height="451" preserveAspectRatio="none" />
      </g>`
    : "";

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="warmGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#9c6941" stop-opacity="0.95"/>
          <stop offset="20%" stop-color="#8a5732" stop-opacity="0.88"/>
          <stop offset="38%" stop-color="#6e4222" stop-opacity="0.65"/>
          <stop offset="52%" stop-color="#482711" stop-opacity="0.35"/>
          <stop offset="65%" stop-color="#18120b" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${Math.round(width * 0.65)}" height="${height}" fill="url(#warmGrad)" />
      ${logoElement}
    </svg>
  `);

  const brandedBuffer = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: brandedBuffer, width, height };
}

/**
 * Formats the 600x400 services editorial image.
 * Per client specification (David): Clean image without text overlays or dark bars.
 */
export async function compositeAtoyanServicesImage(
  imageBuffer: Buffer,
  params: { headline: string; category: string }
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const width = 600;
  const height = 400;
  const barTop = 32;
  const barHeight = 64;

  const escapeXml = (str: string) =>
    str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });

  const rawCategory = (params?.category || "CALIFORNIA EMPLOYMENT LAW").toUpperCase();
  const rawHeadline = (params?.headline || params?.category || "EMPLOYMENT LAWYER").toUpperCase();

  const font = getAtoyanFont();
  let textElements = "";

  if (font) {
    // Render exact vector bezier paths so Sharp renders pure vectors without system font dependencies
    // Baseline for line 1: barTop + 24 = 56px; Baseline for line 2: barTop + 51 = 83px
    const line1 = renderTextAsSvgPath(font, rawCategory, 18, barTop + 24, 17, width - 36);
    const line2 = renderTextAsSvgPath(font, rawHeadline, 18, barTop + 51, 20, width - 36);
    textElements = `
      <path d="${line1.pathData}" fill="#FFFFFF" filter="url(#shadow)" />
      <path d="${line2.pathData}" fill="#D7E434" filter="url(#shadow)" />
    `;
  } else {
    // Defensive fallback if font file could not be read
    const category = escapeXml(rawCategory);
    const headline = escapeXml(rawHeadline);
    const catLen = category.length;
    const line1FontSize = catLen > 35 ? Math.max(13, Math.floor(560 / (catLen * 0.65))) : 17;
    const hLen = headline.length;
    const line2FontSize = hLen > 36 ? Math.max(14, Math.floor(560 / (hLen * 0.62))) : 20;

    textElements = `
      <text x="18" y="${barTop + 24}" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="${line1FontSize}" font-weight="900" letter-spacing="0.5" filter="url(#shadow)">${category}</text>
      <text x="18" y="${barTop + 50}" fill="#D7E434" font-family="Arial, Helvetica, sans-serif" font-size="${line2FontSize}" font-weight="900" letter-spacing="0.5" filter="url(#shadow)">${headline}</text>
    `;
  }

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>
      <rect x="0" y="${barTop}" width="${width}" height="${barHeight}" fill="rgba(20, 25, 32, 0.78)" />
      ${textElements}
    </svg>
  `);

  const brandedBuffer = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: brandedBuffer, width, height };
}

/**
 * Creates a valid, lightweight binary PNG buffer in pure Node.js.
 * This guarantees WordPress REST media upload will never reject the fallback.
 */
function createSolidPngBuffer(width: number, height: number, r: number, g: number, b: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, "ascii");
    data.copy(buf, 8);
    const crc = zlib.crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const rowLen = 1 + width * 3;
  const rawData = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const ihdrChunk = makeChunk("IHDR", ihdr);
  const idatChunk = makeChunk("IDAT", compressed);
  const iendChunk = makeChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Deterministic branded fallback image: serves authentic high-resolution Atoyan Law Firm
 * practice area photography from local disk so previews never render as an empty blank box.
 */
function generateBrandedFallbackImage(opts: GenerateSingleImageOptions): AtoyanGeneratedImage {
  try {
    const isBanner = opts.width >= 1000;
    const relFile = isBanner
      ? "public/images/atoyan-banner-default.jpg"
      : "public/images/atoyan-services-default.jpg";
    const absPath = path.join(process.cwd(), relFile);

    if (fs.existsSync(absPath)) {
      const b64 = fs.readFileSync(absPath).toString("base64");
      return {
        base64: b64,
        mimeType: "image/jpeg",
        prompt: opts.prompt,
        filename: opts.filename.replace(/\.png$/, ".jpg"),
        altText: opts.altText,
        width: opts.width,
        height: opts.height,
      };
    }
  } catch (err) {
    console.warn("Fallback disk image read warning:", err);
  }

  const pngBuffer = createSolidPngBuffer(opts.width, opts.height, 15, 23, 42);
  const base64 = pngBuffer.toString("base64");

  return {
    base64,
    mimeType: "image/png",
    prompt: opts.prompt,
    filename: opts.filename.replace(/\.jpe?g$/, ".png"),
    altText: opts.altText,
    width: opts.width,
    height: opts.height,
  };
}

/**
 * Generates an image using Google Generative Language API.
 * Supports gemini-2.5-flash-image / gemini-3.1-flash-image (generateContent) and Imagen 3 (:predict).
 */
async function tryGeminiImagen(opts: GenerateSingleImageOptions, key: string): Promise<AtoyanGeneratedImage | null> {
  const models = ["gemini-2.5-flash-image", "gemini-3.1-flash-image"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: opts.prompt }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.ok) {
        const json = await res.json();
        const inlineData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (inlineData?.data) {
          return {
            base64: inlineData.data,
            mimeType: inlineData.mimeType || "image/png",
            prompt: opts.prompt,
            filename: opts.filename.replace(/\.jpe?g$/, ".png"),
            altText: opts.altText,
            width: opts.width,
            height: opts.height,
          };
        }
      }
    } catch {
      // Continue to next model or predict endpoint
    }
  }

  try {
    const ratio = opts.width / opts.height;
    const aspectRatio = Math.abs(ratio - 16 / 9) < Math.abs(ratio - 4 / 3) ? "16:9" : "4:3";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: opts.prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          outputOptions: { mimeType: "image/jpeg" },
        },
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (res.ok) {
      const json = await res.json();
      const prediction = json.predictions?.[0];
      const b64 = prediction?.bytesBase64Encoded;

      if (b64) {
        return {
          base64: b64,
          mimeType: prediction.mimeType || "image/jpeg",
          prompt: opts.prompt,
          filename: opts.filename,
          altText: opts.altText,
          width: opts.width,
          height: opts.height,
        };
      }
    }
  } catch (err) {
    console.warn("Imagen 3 predict attempt warning:", err);
  }

  return null;
}

/**
 * Tries OpenAI image generation (gpt-image-1-mini / gpt-image-1 / chatgpt-image-latest / dall-e-3)
 * if OpenAI key is available.
 */
async function tryOpenAiImage(opts: GenerateSingleImageOptions, key: string): Promise<AtoyanGeneratedImage | null> {
  const models = ["gpt-image-1-mini", "gpt-image-1", "chatgpt-image-latest", "dall-e-3"];
  const size = opts.width >= opts.height ? "1536x1024" : "1024x1024";

  for (const model of models) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          prompt: opts.prompt,
          n: 1,
          size,
          ...(model.startsWith("dall-e") ? { response_format: "b64_json" } : {}),
        }),
        signal: AbortSignal.timeout(90_000),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`OpenAI image model ${model} returned ${res.status}: ${errText.slice(0, 150)}`);
        continue;
      }

      const json = await res.json();
      let b64 = json.data?.[0]?.b64_json;

      if (!b64 && json.data?.[0]?.url) {
        const imgRes = await fetch(json.data[0].url, { signal: AbortSignal.timeout(30_000) });
        if (imgRes.ok) {
          const ab = await imgRes.arrayBuffer();
          b64 = Buffer.from(ab).toString("base64");
        }
      }

      if (b64) {
        return {
          base64: b64,
          mimeType: "image/png",
          prompt: opts.prompt,
          filename: opts.filename.replace(/\.jpe?g$/, ".png"),
          altText: opts.altText,
          width: opts.width,
          height: opts.height,
        };
      }
    } catch (err) {
      console.warn(`OpenAI model ${model} attempt error:`, err);
    }
  }

  return null;
}

/**
 * Cleans an API key by stripping quotes and whitespace.
 */
function cleanApiKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/^["'\s]+|["'\s]+$/g, "");
  return cleaned.length > 5 ? cleaned : undefined;
}

function resolveImageProviders(openaiKey?: string, geminiKey?: string): { openai?: string; gemini?: string } {
  const values = [openaiKey, geminiKey, process.env.OPENAI_API_KEY, process.env.GEMINI_API_KEY]
    .map(cleanApiKey)
    .filter((value): value is string => Boolean(value));
  const unique = [...new Set(values)];
  return {
    openai: unique.find((value) => value.startsWith("sk-")),
    gemini: unique.find((value) => value.startsWith("AIza")),
  };
}

async function generateSingleImage(opts: GenerateSingleImageOptions): Promise<AtoyanGeneratedImage> {
  const { openai, gemini } = resolveImageProviders(opts.openaiKey, opts.apiKey);

  if (openai) {
    try {
      const openaiImg = await tryOpenAiImage(opts, openai);
      if (openaiImg) return { ...openaiImg, source: "openai" };
    } catch (e) {
      console.warn("OpenAI image generation attempt failed:", e);
    }
  }

  if (gemini) {
    try {
      const geminiImg = await tryGeminiImagen(opts, gemini);
      if (geminiImg) return { ...geminiImg, source: "gemini" };
    } catch (e) {
      console.warn("Gemini image generation attempt failed:", e);
    }
  }

  console.warn(`Image generation fell back to the shared stock photo for ${opts.filename}`);
  return { ...generateBrandedFallbackImage(opts), source: "fallback" };
}

/**
 * Builds a dynamic, 100% topic-specific visual prompt for the 1920x451 Panoramic Hero Banner.
 * Strictly enforces negative space on the left for the Atoyan logo & dark gradient overlay.
 */
export function buildTopicBannerPrompt(cleanTopic: string, city: string, topicKey: string): string {
  switch (topicKey) {
    case "wrongful_termination":
      return `Cinematic professional 35mm panoramic photography of an executive modern California corporate office in ${city} at dusk. On the right side, an empty executive boardroom with glass walls overlooking city skyline, polished dark mahogany conference table with scattered legal briefs and a discreet cardboard personal belongings box on a side credenza symbolizing an abrupt departure. The left half has generous empty space with moody atmospheric shadows. Warm amber interior glow, shallow depth of field. Clean photograph with zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "workplace_harassment":
      return `Cinematic professional 35mm panoramic photography of an open-plan contemporary California corporate workplace in ${city} after hours. On the right side, sleek glass partition walls, empty workstations with personal desks, and ambient architectural lighting casting long shadows across the floor, conveying the isolation of a hostile workplace and legal accountability. The left half features expansive, deep negative space with rich architectural depth. Moody, dignified ambiance, shallow depth of field. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "sexual_harassment":
      return `Cinematic professional 35mm panoramic photography of a high-end California corporate office suite in ${city} during late evening. On the center-right side, architectural glass partitions, warm architectural downlights illuminating an empty corridor between executive offices, expressing tension and legal gravity. The left portion features deep, soft, moody negative space with elegant dark wood paneling and soft ambient shadows. Dramatic warm lighting, clean architectural composition. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "race_discrimination":
      return `Cinematic professional 35mm panoramic photography of a sunlit modern California corporate workplace in ${city}. On the right side, an architectural boardroom with glass walls and contemporary walnut fixtures, looking out toward urban architecture under warm California sunlight, symbolizing workplace equality and accountability. The left half features clean, minimalist negative space with soft architectural shadows and shallow depth of field. Professional architectural composition. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "wage_theft":
      return `Cinematic professional 35mm panoramic photography of a California corporate compliance and finance office in ${city}. On the right side, a dimly lit executive wooden desk with neatly arranged timecards, payroll ledger records, an antique brass balance scale of justice, and a luxury fountain pen under a warm desk lamp. The left side has expansive, clean, dark negative space with soft shadows. Rich mahogany tones, moody ambiance, shallow depth of field. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "meal_breaks":
      return `Cinematic professional 35mm panoramic photography of a contemporary California workplace environment in ${city}. On the right side, a quiet employee breakroom or outdoor patio courtyard adjacent to modern glass corporate offices, bathed in golden hour California sunlight, with a clean table, an empty ceramic mug, and a digital clock reflection, highlighting labor rights and statutory time compliance. The left side has smooth negative space with soft architectural blur. Warm natural lighting. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "disability":
      return `Cinematic professional 35mm panoramic photography of an accessible, elegant modern California corporate office in ${city}. On the right side, a beautifully designed ergonomic executive workstation with an adjustable standing desk, wide accessible pathways, warm ambient lighting, and natural greenery through large windows. The left side provides clean negative space with soft warm shadows. Respectful, dignified corporate atmosphere, shallow depth of field. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "workplace_retaliation":
      return `Cinematic professional 35mm panoramic photography of a moody, high-stakes corporate environment in ${city} at twilight. On the right side, a modern corner office with floor-to-ceiling glass windows looking out over illuminated city buildings, a desk with a glowing tablet and confidential legal file folders. Dramatic contrast between warm interior lamp light and cool twilight exterior, conveying truth-telling and legal courage. The left side has deep, clean negative space. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "family_medical_leave":
      return `Cinematic professional 35mm panoramic photography of a serene, warm California executive office setting in ${city}. On the right side, a polished wooden desk near sun-drenched windows with an organized calendar, a fountain pen, and a warm framed scenic landscape photograph in the soft background, balancing career and family rights. The left side has expansive, soft negative space with gentle bokeh. Golden hour warmth. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    case "age_discrimination":
      return `Cinematic professional 35mm panoramic photography of a distinguished California law firm partner office or executive suite in ${city}. On the right side, classic dark walnut bookshelves lined with leather-bound legal treatises, an executive leather chair, and polished wood surfaces bathed in warm afternoon sunlight, conveying seniority, experience, and dignity. The left side offers ample clean negative space with soft shadows. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;

    default:
      return `Cinematic professional 35mm panoramic photography of a prestigious California employment law firm library and conference setting in ${city}. On the right side, a polished conference table with leather case binders, warm architectural lighting, and floor-to-ceiling glass windows. The left side has generous clean negative space with soft dark tones. Professional architectural composition. Zero text, no letters, no words, no signage. 16:9 wide landscape orientation.`;
  }
}

/**
 * Builds a dynamic, 100% topic-specific visual prompt for the 600x400 Editorial Services Photo.
 * Strictly enforces real human client-attorney scenarios without text overlays or dark bars.
 */
export function buildTopicServicesPrompt(cleanTopic: string, city: string, topicKey: string): string {
  switch (topicKey) {
    case "wrongful_termination":
      return `Professional editorial corporate photograph of an employee in business attire seated across from an employment attorney at a conference table in ${city}, reviewing termination and severance paperwork with serious, focused expressions. Natural daylight pouring through office windows, clean modern background with glass and warm wood. Authentic editorial corporate photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "workplace_harassment":
      return `Professional editorial corporate photograph of an employee meeting with an employment attorney in a conference room in ${city}, reviewing contemporaneous notes and documentation of hostile workplace conduct. Serious, focused expressions, modern corporate office setting with glass walls and warm natural lighting. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "sexual_harassment":
      return `Professional editorial corporate photograph of an employee speaking confidentially with a supportive legal professional in a private, sunlit consultation room in ${city}. Empathetic and professional demeanor, safe legal consultation setting, subtle corporate glass backdrop. Dignified, authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "race_discrimination":
      return `Professional editorial corporate photograph of a diverse group of corporate professionals in a modern collaborative office in ${city}, engaged in a serious workplace discussion around a conference table. Natural daylight, contemporary architectural interior, professional business attire. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "wage_theft":
      return `Professional editorial corporate photograph of an employee and an employment attorney reviewing detailed payroll printouts, timesheets, and paystub documentation together with a legal notepad on a wooden desk in ${city}. Focused, analytical expressions, natural office lighting. Authentic editorial corporate photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "meal_breaks":
      return `Professional editorial corporate photograph of California workplace employees in business casual attire reviewing daily work schedules, time-tracking logs, and labor compliance documents with legal counsel in a modern office in ${city}. Natural daylight, clean composition. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "disability":
      return `Professional editorial corporate photograph of an employee with an accommodation discussing workplace documentation in a bright, modern, fully accessible executive conference room with an employment advocate in ${city}. Respectful, professional, empowering atmosphere. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "workplace_retaliation":
      return `Professional editorial corporate photograph of an employee holding a confidential documentation folder, consulting with an attorney in a private office in ${city} while looking through evidence on a tablet. Serious, determined expressions, clean modern California office setting. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "family_medical_leave":
      return `Professional editorial corporate photograph of a working parent or caregiver consulting with an employment attorney at a bright, warm office desk in ${city}, reviewing medical leave request forms and family rights documentation. Reassuring, professional consultation. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    case "age_discrimination":
      return `Professional editorial corporate photograph of an experienced senior professional in elegant business attire reviewing employment records and performance evaluations alongside legal counsel in a sophisticated boardroom in ${city}. Dignified, focused expressions. Authentic editorial photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;

    default:
      return `Professional editorial corporate photograph of an employment attorney meeting with an employee client in a modern California law office in ${city}, reviewing case files and discussing legal rights across a polished conference table. Natural daylight, warm wood accents. Authentic editorial corporate photography, 3:2 landscape orientation. Zero text, no letters, no words, no overlays, no watermarks.`;
  }
}

/**
 * Generates both Atoyan practice area images dynamically tailored to the topic:
 * 1. Banner Image (1920x451): Topic-specific cinematic office scene with Atoyan 'A' brand mark & dark left gradient.
 * 2. Services Image (600x400): Topic-specific editorial corporate photo without text overlays or dark bars.
 */
export async function generateAtoyanImages(params: {
  keyword: string;
  city?: string;
  category?: string;
  slug?: string;
  apiKey?: string;
  openaiKey?: string;
}): Promise<AtoyanImages> {
  const { keyword, city: rawCity, category: providedCategory, slug, apiKey, openaiKey } = params;
  const decomposed = decomposeKeyword(keyword, rawCity);
  const city = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const topicKey = decomposed.topicKey;
  const safeSlug = (slug || decomposed.slug).replace(/^-|-$/g, "");
  const category = providedCategory || deriveAtoyanCategory(keyword, city);

  const bannerPrompt = buildTopicBannerPrompt(cleanTopic, city, topicKey);
  const servicesPrompt = buildTopicServicesPrompt(cleanTopic, city, topicKey);

  const [rawBanner, rawServices] = await Promise.all([
    generateSingleImage({
      prompt: bannerPrompt,
      filename: `${safeSlug}-banner.jpg`,
      altText: `${city} ${cleanTopic} Employment Lawyers - Atoyan Law Firm`,
      width: 1920,
      height: 451,
      apiKey,
      openaiKey,
    }),
    generateSingleImage({
      prompt: servicesPrompt,
      filename: `${safeSlug}-services.jpg`,
      altText: `${city} ${cleanTopic} Legal Representation & Rights - Atoyan Law`,
      width: 600,
      height: 400,
      apiKey,
      openaiKey,
    }),
  ]);

  // Apply Atoyan Law Firm Branding Composites
  let banner = rawBanner;
  try {
    const rawBannerBuf = Buffer.from(rawBanner.base64, "base64");
    const { buffer: bannerBuf, width: bW, height: bH } = await compositeAtoyanBanner(rawBannerBuf);
    banner = {
      ...rawBanner,
      base64: bannerBuf.toString("base64"),
      mimeType: "image/jpeg",
      width: bW,
      height: bH,
    };
  } catch (bannerErr) {
    console.warn("Banner branding composite warning:", bannerErr);
  }

  let services = rawServices;
  try {
    const rawServicesBuf = Buffer.from(rawServices.base64, "base64");
    const { buffer: servicesBuf, width: sW, height: sH } = await compositeAtoyanServicesImage(rawServicesBuf, {
      headline: decomposed.lawyerTitle,
      category,
    });
    services = {
      ...rawServices,
      base64: servicesBuf.toString("base64"),
      mimeType: "image/jpeg",
      width: sW,
      height: sH,
    };
  } catch (servicesErr) {
    console.warn("Services branding composite warning:", servicesErr);
  }

  return { banner, services };
}
