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
 * Composites the official WP Post Project 'A' logo and dark gradient on the left side
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

/** Header photo size used by the Wrongful Termination reference page. */
export const SITE_BANNER_WIDTH = 1000;
export const SITE_BANNER_HEIGHT = 583;

/** Article photo size used by the Wrongful Termination reference page. */
export const SITE_BODY_WIDTH = 850;
export const SITE_BODY_HEIGHT = 567;

/**
 * Header photo for this site: the original photograph at the reference page size.
 * Readability is handled on the page with CSS opacity, not by fading the file.
 */
export async function compositeAtoyanBanner(
  imageBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const brandedBuffer = await sharp(imageBuffer)
    .resize(SITE_BANNER_WIDTH, SITE_BANNER_HEIGHT, { fit: "cover", position: "attention" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: brandedBuffer, width: SITE_BANNER_WIDTH, height: SITE_BANNER_HEIGHT };
}

/**
 * Article photo for this site: a plain photograph at the reference page size.
 * The previous project's dark caption bar and yellow title are not applied.
 */
export async function compositeAtoyanServicesImage(
  imageBuffer: Buffer,
  _params: { headline: string; category: string }
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const brandedBuffer = await sharp(imageBuffer)
    .resize(SITE_BODY_WIDTH, SITE_BODY_HEIGHT, { fit: "cover", position: "attention" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return { buffer: brandedBuffer, width: SITE_BODY_WIDTH, height: SITE_BODY_HEIGHT };
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
 * Deterministic branded fallback image: serves authentic high-resolution WP Post Project
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

const HEADER_PHOTO_RULES =
  "Bright high-key professional stock photograph for a law firm page header, natural daylight, light center so dark title text stays readable. No text, no letters, no logos, no watermarks, no dark gradient, no color overlay. Landscape photo.";

/**
 * Header photo prompt. Matches the bright reference photos on this site, not the previous project's dark logo banner.
 */
export function buildTopicBannerPrompt(cleanTopic: string, city: string, topicKey: string): string {
  const scene = (() => {
    switch (topicKey) {
      case "wrongful_termination":
        return `A professional in business clothes sitting beside a cardboard box of office belongings and loose papers outside a bright glass office in ${city}, looking concerned.`;
      case "workplace_harassment":
        return `An employee in business attire standing in a bright modern office in ${city}, holding a folder and looking uneasy while a coworker sits out of focus behind them.`;
      case "sexual_harassment":
        return `A professional woman in a light blazer holding documents in a bright white office in ${city}, with a coworker seated at a desk in the soft background.`;
      case "race_discrimination":
        return `Diverse professionals in a bright sunlit conference room in ${city}, seated around a light table with papers, in a serious but calm discussion.`;
      case "wage_theft":
        return `Close view of an employee and a notepad of timesheets on a bright wooden desk in ${city}, with pay stubs and a calculator, natural window light.`;
      case "meal_breaks":
        return `Employees in business casual clothes in a bright office break area in ${city}, with a wall clock and a simple table, natural daylight.`;
      case "disability":
        return `An employee at a bright accessible workstation in ${city}, reviewing workplace paperwork with a colleague, large windows and an open walkway.`;
      case "workplace_retaliation":
        return `An employee holding a closed folder in a bright private office in ${city}, looking determined, with a laptop and papers on a light desk.`;
      case "family_medical_leave":
        return `A working parent meeting with a professional at a bright sunlit desk in ${city}, reviewing leave forms, warm and calm.`;
      case "age_discrimination":
        return `An experienced older professional in a suit reviewing employment papers with a colleague at a bright conference table in ${city}.`;
      default:
        return `An employee and an employment lawyer reviewing case papers at a bright conference table in ${city}, natural daylight, ${cleanTopic}.`;
    }
  })();
  return `${scene} ${HEADER_PHOTO_RULES}`;
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
 * Generates both practice-area photos for this site:
 * 1. Header photo (1000x583): bright scene, no logo and no gradient. The theme draws the title.
 * 2. Article photo (850x567): plain editorial photo, no caption bar.
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
      altText: `${city} ${cleanTopic} Employment Lawyers - WP Post Project`,
      width: SITE_BANNER_WIDTH,
      height: SITE_BANNER_HEIGHT,
      apiKey,
      openaiKey,
    }),
    generateSingleImage({
      prompt: servicesPrompt,
      filename: `${safeSlug}-services.jpg`,
      altText: `${city} ${cleanTopic} Legal Representation & Rights - WP Post Project`,
      width: SITE_BODY_WIDTH,
      height: SITE_BODY_HEIGHT,
      apiKey,
      openaiKey,
    }),
  ]);

  // Apply WP Post Project Branding Composites
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
