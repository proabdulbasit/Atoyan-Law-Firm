import { stripCopiedClasses } from "./seo-linking";

interface AccordionFaq {
  question?: string;
  answer?: string;
  accordion_content_title?: string;
  accordion_content_description?: string;
}

/** Easy Accordion whose display settings the demo pages should copy. */
const DEMO_ACCORDION_STYLE_POST_ID = 36907;

type FormField = [string, string];

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i"));
  if (!match) return undefined;
  return decodeEntities(match[1] ?? match[2] ?? match[3] ?? "");
}

function hasBooleanAttr(tag: string, name: string): boolean {
  return new RegExp(
    `\\b${name}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'=<>]+))?(?=$|[\\s/>])`,
    "i",
  ).test(tag);
}

function storeCookies(jar: Map<string, string>, response: Response) {
  const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const cookie of cookies) {
    const pair = cookie.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

export function parseAdminForm(html: string): FormField[] {
  const fields: FormField[] = [];

  for (const match of html.matchAll(/<input\b([^>]*?)\/?>/gi)) {
    const tag = match[1];
    const name = attr(tag, "name");
    if (!name || hasBooleanAttr(tag, "disabled")) continue;
    const type = (attr(tag, "type") || "text").toLowerCase();
    if (type === "submit" || type === "button" || type === "image" || type === "file") continue;
    if ((type === "radio" || type === "checkbox") && !hasBooleanAttr(tag, "checked")) continue;
    fields.push([name, attr(tag, "value") ?? ""]);
  }

  for (const match of html.matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi)) {
    const name = attr(match[1], "name");
    if (!name || hasBooleanAttr(match[1], "disabled")) continue;
    fields.push([name, decodeEntities(match[2])]);
  }

  for (const match of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
    const name = attr(match[1], "name");
    if (!name || hasBooleanAttr(match[1], "disabled")) continue;
    const options = [...match[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)];
    const chosen = options.find((option) => hasBooleanAttr(option[1], "selected")) || options[0];
    if (!chosen) {
      fields.push([name, ""]);
      continue;
    }
    const value = attr(chosen[1], "value");
    fields.push([name, value !== undefined ? value : decodeEntities(chosen[2]).trim()]);
  }

  return fields;
}

function toBody(fields: FormField[]): string {
  const params = new URLSearchParams();
  for (const [key, value] of fields) params.append(key, value);
  return params.toString();
}

export async function loginToWordPressAdmin(siteUrl: string, user: string, password: string): Promise<string> {
  const cleanBase = siteUrl.replace(/\/$/, "");
  const jar = new Map<string, string>([["wordpress_test_cookie", "WP Cookie check"]]);
  let url = `${cleanBase}/wp-login.php`;
  let response = await fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      log: user,
      pwd: password,
      "wp-submit": "Log In",
      redirect_to: `${cleanBase}/wp-admin/`,
      testcookie: "1",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  for (let hop = 0; hop < 5; hop += 1) {
    storeCookies(jar, response);
    const location = response.headers.get("location");
    if (!location || response.status < 300 || response.status >= 400) break;
    url = new URL(location, url).toString();
    response = await fetch(url, {
      redirect: "manual",
      headers: { Cookie: cookieHeader(jar) },
      signal: AbortSignal.timeout(30_000),
    });
  }

  const header = cookieHeader(jar);
  if (!header.includes("wordpress_logged_in")) {
    throw new Error("WordPress admin login failed");
  }
  return header;
}

async function readEditForm(siteUrl: string, cookie: string, postId: number): Promise<string> {
  const response = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-admin/post.php?post=${postId}&action=edit`, {
    headers: { Cookie: cookie },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Could not open WordPress editor for post ${postId}`);
  return response.text();
}

async function submitEditForm(siteUrl: string, cookie: string, fields: FormField[]): Promise<boolean> {
  const response = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-admin/post.php`, {
    method: "POST",
    redirect: "manual",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toBody(fields),
    signal: AbortSignal.timeout(60_000),
  });
  const location = response.headers.get("location") || "";
  const saved = response.status >= 300 && response.status < 400 && /post\.php\?post=\d+/.test(location);
  if (!saved) {
    const body = await response.text();
    console.warn(
      `[WordPress admin] Save was not accepted (${response.status}). ${body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 180)}`,
    );
  }
  return saved;
}

function replaceField(fields: FormField[], name: string, value: string): FormField[] {
  const next = fields.filter(([key]) => key !== name);
  next.push([name, value]);
  return next;
}

function applyYoastFields(
  fields: FormField[],
  seo: { title: string; description: string; focusKeyphrase: string },
): FormField[] {
  let next = fields;
  next = replaceField(next, "yoast_wpseo_title", seo.title);
  next = replaceField(next, "yoast_wpseo_metadesc", seo.description);
  next = replaceField(next, "yoast_wpseo_focuskw", seo.focusKeyphrase);
  next = replaceField(next, "yoast_wpseo_opengraph-title", seo.title);
  next = replaceField(next, "yoast_wpseo_opengraph-description", seo.description);
  next = replaceField(next, "yoast_wpseo_twitter-title", seo.title);
  next = replaceField(next, "yoast_wpseo_twitter-description", seo.description);
  return next;
}

function loginPassword(): string | undefined {
  return process.env.WP_LOGIN_PASSWORD?.trim() || undefined;
}

/**
 * Easy Accordion ignores FAQ meta sent through the REST API on this site.
 * The editor form is what actually stores the questions.
 */
export async function saveEasyAccordionItems(params: {
  wpSiteUrl: string;
  postId: number;
  title: string;
  faqs: AccordionFaq[];
  wpUser?: string;
  wpPassword?: string;
}): Promise<boolean> {
  const user = params.wpUser?.trim() || process.env.WP_USER?.trim();
  const password = params.wpPassword?.trim() || loginPassword();
  if (!user || !password) return false;

  const items = params.faqs
    .map((faq) => ({
      question: (faq.question || faq.accordion_content_title || "").trim(),
      answer: (faq.answer || faq.accordion_content_description || "").trim(),
    }))
    .filter((faq) => faq.question && faq.answer);
  if (items.length === 0) return false;

  const cookie = await loginToWordPressAdmin(params.wpSiteUrl, user, password);
  const ownHtml = await readEditForm(params.wpSiteUrl, cookie, params.postId);
  let fields = parseAdminForm(ownHtml);

  try {
    const styleHtml = await readEditForm(params.wpSiteUrl, cookie, DEMO_ACCORDION_STYLE_POST_ID);
    const styleFields = parseAdminForm(styleHtml).filter(
      ([key]) =>
        (key.startsWith("sp_eap_shortcode_options[") || key.startsWith("sp_eap_upload_options[")) &&
        !key.includes("accordion_content_source"),
    );
    fields = fields.filter(
      ([key]) => !key.startsWith("sp_eap_shortcode_options[") && !key.startsWith("sp_eap_upload_options["),
    );
    fields.push(...styleFields);
  } catch (styleErr) {
    console.warn("Could not copy the reference accordion style:", styleErr);
  }

  fields = fields.filter(([key]) => !key.includes("accordion_content_source") && key !== "publish" && key !== "save");
  items.forEach((faq, index) => {
    const answer = stripCopiedClasses(/<p[\s>]/i.test(faq.answer) ? faq.answer : `<p>${faq.answer}</p>`);
    fields.push([`sp_eap_upload_options[accordion_content_source][${index}][accordion_content_title]`, faq.question.trim()]);
    fields.push([`sp_eap_upload_options[accordion_content_source][${index}][accordion_content_description]`, answer]);
  });

  fields = replaceField(fields, "sp_eap_upload_options[eap_accordion_type]", "content-accordion");
  fields = replaceField(fields, "sp_eap_shortcode_options[eap_accordion_uniq_id]", `sp_easy_accordion-${Date.now()}`);
  fields = replaceField(fields, "post_title", params.title);
  fields = replaceField(fields, "post_status", "publish");
  fields = replaceField(fields, "hidden_post_status", "publish");
  fields = replaceField(fields, "visibility", "public");
  fields = replaceField(fields, "hidden_post_visibility", "public");
  fields = replaceField(fields, "action", "editpost");
  fields = replaceField(fields, "originalaction", "editpost");
  fields.push(["publish", "Publish"]);

  const saved = await submitEditForm(params.wpSiteUrl, cookie, fields);
  if (!saved) return false;

  const confirmed = await readEditForm(params.wpSiteUrl, cookie, params.postId);
  return confirmed.includes(items[0].question.trim().slice(0, 40));
}

/**
 * Removes editor classes that were pasted into an already saved page or accordion.
 */
export async function cleanStoredCopiedClasses(params: {
  wpSiteUrl: string;
  postIds: number[];
  wpUser?: string;
  wpPassword?: string;
}): Promise<Array<{ id: number; status: string }>> {
  const user = params.wpUser?.trim() || process.env.WP_USER?.trim();
  const password = params.wpPassword?.trim() || loginPassword();
  if (!user || !password) throw new Error("WordPress admin login is not configured");

  const cookie = await loginToWordPressAdmin(params.wpSiteUrl, user, password);
  const results: Array<{ id: number; status: string }> = [];

  for (const postId of params.postIds) {
    const html = await readEditForm(params.wpSiteUrl, cookie, postId);
    let fields = parseAdminForm(html);
    let changed = false;
    fields = fields.map(([key, value]) => {
      if (!value.includes("class=")) return [key, value] as FormField;
      const next = stripCopiedClasses(value);
      if (next !== value) changed = true;
      return [key, next] as FormField;
    });
    if (!changed) {
      results.push({ id: postId, status: "clean" });
      continue;
    }
    fields = fields.filter(([key]) => key !== "publish" && key !== "save");
    fields = replaceField(fields, "action", "editpost");
    fields = replaceField(fields, "originalaction", "editpost");
    fields.push(["save", "Update"]);
    const saved = await submitEditForm(params.wpSiteUrl, cookie, fields);
    results.push({ id: postId, status: saved ? "cleaned" : "save-failed" });
  }

  return results;
}

/**
 * The photo behind the page title is WoodMart's title image, separate from the body image.
 */
export async function setWoodmartTitleImage(params: {
  wpSiteUrl: string;
  postId: number;
  imageId: number;
  imageUrl: string;
  content?: string;
  seo?: { title: string; description: string; focusKeyphrase: string };
  wpUser?: string;
  wpPassword?: string;
}): Promise<boolean> {
  const user = params.wpUser?.trim() || process.env.WP_USER?.trim();
  const password = params.wpPassword?.trim() || loginPassword();
  if (!user || !password) return false;

  const cookie = await loginToWordPressAdmin(params.wpSiteUrl, user, password);
  let fields = parseAdminForm(await readEditForm(params.wpSiteUrl, cookie, params.postId));
  fields = fields.filter(([key]) => key !== "publish" && key !== "save");
  fields = replaceField(fields, "_woodmart_title_image[id]", String(params.imageId));
  fields = replaceField(fields, "_woodmart_title_image[url]", params.imageUrl);
  fields = replaceField(fields, "_woodmart_title_image_size", "full");
  fields = replaceField(fields, "_woodmart_title_color", "dark");
  fields = replaceField(fields, "_woodmart_title_bg_color", "rgb(255,255,255)");
  fields = replaceField(fields, "_thumbnail_id", String(params.imageId));
  if (params.content) fields = replaceField(fields, "content", params.content);
  if (params.seo?.description) fields = applyYoastFields(fields, params.seo);
  fields = replaceField(fields, "action", "editpost");
  fields = replaceField(fields, "originalaction", "editpost");
  fields.push(["save", "Update"]);
  return submitEditForm(params.wpSiteUrl, cookie, fields);
}

/**
 * Writes the Yoast snippet fields on the classic editor form.
 * The bulk REST route can report success while leaving the snippet blank.
 */
export async function saveYoastSeoFields(params: {
  wpSiteUrl: string;
  postId: number;
  title: string;
  description: string;
  focusKeyphrase: string;
  wpUser?: string;
  wpPassword?: string;
}): Promise<boolean> {
  const user = params.wpUser?.trim() || process.env.WP_USER?.trim();
  const password = params.wpPassword?.trim() || loginPassword();
  if (!user || !password || !params.description.trim()) return false;

  const cookie = await loginToWordPressAdmin(params.wpSiteUrl, user, password);
  let fields = parseAdminForm(await readEditForm(params.wpSiteUrl, cookie, params.postId));
  fields = fields.filter(([key]) => key !== "publish" && key !== "save");
  fields = applyYoastFields(fields, {
    title: params.title,
    description: params.description,
    focusKeyphrase: params.focusKeyphrase,
  });
  fields = replaceField(fields, "action", "editpost");
  fields = replaceField(fields, "originalaction", "editpost");
  fields.push(["save", "Update"]);
  return submitEditForm(params.wpSiteUrl, cookie, fields);
}
