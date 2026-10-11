# Atoyan Law Firm • Practice Area Content Autopilot

> Automated California employment law practice area generation, visual asset synthesis, ACF Field Group 348 payload mapping, and direct WordPress REST API publishing for [atoyanlaw.com](https://www.atoyanlaw.com).

---

## ⚡ Overview

**WP Content Autopilot** is an enterprise programmatic publishing engine designed specifically for **Atoyan Law Firm**. It transforms practice area keywords (e.g., *"Burbank Wrongful Termination Lawyer"* or *"Adverse Employment Action in California"*) into published, SEO-optimized, ACF-mapped WordPress pages in seconds.

### Key Capabilities
- **Statutory California Legal Depth**: Strictly follows California legal standards, citing the Fair Employment and Housing Act (FEHA), Civil Rights Department (CRD), Labor Code §§ 98.6 & 1102.5, SB 497 (90-day rebuttable presumption of retaliation), and *Yanowitz v. L'Oreal*.
- **Atoyan Tone & Signature Elements**: Generates punchy 1–3 sentence paragraphs, question-style subheadings (`<h2 class="h2dav">`), phone click-to-calls `(888) 807-0077`, and exact callout box styling (`txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30`).
- **Complete ACF Field Group 348 Mapping**: Maps all 27 subfields across 6 tabs (`personal_injury_group`). Automatically preserves 8 verified client reviews, 27 practice area sidebar navigation links, Contact Form 7 shortcodes, and CTA backgrounds cloned from live Page 3933.
- **Dual AI Visual Asset Synthesis**: Generates 16:9 banner photography (moody mahogany law office) and 4:3 services illustrations using Google Imagen 3 or OpenAI DALL-E 3, backed by an in-memory binary PNG fallback engine.
- **WordPress & Yoast SEO REST Integration**: Creates pages under parent `#750` (Employment Law) using page template `templates/labor-law.php`, attaches media, and synchronizes Yoast SEO titles and meta descriptions.

---

## 🏗️ Architecture

```
                       ┌────────────────────────────────────────┐
                       │           Practice Area Topic          │
                       │ (e.g. "Burbank Wrongful Termination")  │
                       └───────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │ Multi-Provider LLM     │                    │ Visual Asset Engine    │
       │ • OpenAI (gpt-4o)      │                    │ • Google Imagen 3      │
       │ • Gemini 2.5 Flash     │                    │ • OpenAI DALL-E 3      │
       │ • Offline Simulator    │                    │ • In-Memory Binary PNG │
       └────────────┬───────────┘                    └────────────┬───────────┘
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           ▼
                       ┌────────────────────────────────────────┐
                       │ ACF Field Group 348 Transformer        │
                       │ • 27 Subfields Across 6 Tabs           │
                       │ • 8 Cloned Client Reviews              │
                       │ • 27 Cloned Sidebar Practice Areas     │
                       └───────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       ┌────────────────────────┐                    ┌────────────────────────┐
       │ WordPress REST API     │                    │ Yoast SEO REST API     │
       │ • POST /wp/v2/media    │                    │ • POST /yoast/v1/      │
       │ • POST /wp/v2/pages    │                    │   bulk_editor/update   │
       │ • Parent Page #750     │                    │ • SEO Title & Snippet  │
       │ • Template: labor-law  │                    │ • Focus Keyphrase      │
       └────────────────────────┘                    └────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm, pnpm, or yarn

### Installation
```bash
git clone https://github.com/exelentshakil/wp-content-autopilot.git
cd wp-content-autopilot
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Production Build
```bash
npm run build
npm start
```

---

## ⚙️ Configuration

Settings can be configured in two ways:
1. **In the Web UI**: Visit `/settings` to enter credentials in your browser session (stored locally via `localStorage`).
2. **Via Environment Variables**: Set server defaults in `.env.local` or your hosting provider dashboard:

```ini
# WordPress REST API Target
WP_SITE_URL=https://www.atoyanlaw.com
WP_USER=your_wp_username
WP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx  # Application Password

# Live Site Publishing Security Protection
WP_SUPER_ADMIN=your_super_admin_password   # Protects 1-Click Publish & live WordPress site

# AI Generation Engine API Keys
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...

# Optional Model Overrides
OPENAI_MODEL=gpt-4o,gpt-4o-mini
GEMINI_MODEL=gemini-2.5-flash,gemini-2.0-flash

# Supabase Persistence & Executive Reporting Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 🔒 Live Site Publishing Protection (`WP_SUPER_ADMIN`)

Because the application is connected directly to the live production site ([atoyanlaw.com](https://www.atoyanlaw.com)), live publishing is protected by the `WP_SUPER_ADMIN` environment variable:

- **Server Enforcement**: When `WP_SUPER_ADMIN` is set in Vercel environment variables, all publish requests (`POST /api/publish`) require authorization. Unauthorized or missing passwords return `401 Unauthorized` with a constant-time comparison check.
- **UI Modal & Memory**: The UI detects when publishing is protected. Clicking **1-Click Publish Now** or **Publish Previewed Page** prompts with an Admin Authorization modal. You can optionally check *"Remember password on this device"* to store it in your browser.
- **Lock / Reset**: An admin badge in the top navigation bar displays authorization status and provides an instant *"Lock / Reset"* button to clear stored credentials anytime.

> **Note**: To generate an Application Password in WordPress:
> Go to **WP Admin → Users → Profile → Application Passwords**, type a name (e.g. `Content Autopilot`), and click **Add New Application Password**.

---

## 📡 REST API Reference

### 1. Generate Preview
```http
POST /api/generate
Content-Type: application/json

{
  "title": "Burbank Wrongful Termination Lawyer",
  "settings": {
    "llm_provider": "openai",
    "openai_api_key": "sk-proj-..."
  }
}
```

### 2. Publish Page
```http
POST /api/publish
Content-Type: application/json

{
  "title": "Burbank Wrongful Termination Lawyer",
  "atoyan_content": { ... },
  "banner_image": { "base64": "..." },
  "services_image": { "base64": "..." },
  "settings": {
    "wp_site_url": "https://www.atoyanlaw.com",
    "wp_username": "admin",
    "wp_app_password": "xxxx xxxx xxxx xxxx"
  }
}
```

### 3. Health & Readiness Audit
```http
GET /api/health
```
Returns JSON status of OpenAI, Gemini, WordPress REST connectivity, and ACF Field Group 348 configuration.

---

### 4. Generation Reports & Analytics
```http
GET /api/reports
POST /api/reports
```
Fetches or stores persistent generation logs (word counts, tokens, exact $0.043 cost breakdown, generation duration, and live WordPress URLs) in Supabase.

---

## 🛡️ ACF Field Group 348 Schema

The payload structure conforms exactly to ACF Field Group 348 (`personal_injury_group`):

| Tab | Key Subfields | Behavior |
|---|---|---|
| **Top Banner** | `top_title`, `top_banner_img`, `form_shortcode` | Injects H1 title, banner image ID/URL, and CF7 form `[contact-form-7 id="32"]` |
| **Services Content** | `services_heading`, `services_sub_heading`, `services_content`, `services_img` | Injects legal body, callout boxes, and 4:3 services illustration |
| **How Do We Stand**| `how_do_heading`, `how_do_content` | Actionable employee guidance and rights protection |
| **Compensation** | `compensation_heading`, `compensation_content`, `read_more_content` | Damages breakdown and Easy Accordion shortcode `[sp_easyaccordion id="3932"]` |
| **Testimonials** | `testimonials_reviews_repet` | Clones all 8 verified 5-star client reviews from Page 3933 |
| **CTA & Sidebar** | `call_to_action_title`, `sidebar_navigation_id` | 27 practice area cross-links and firm contact details |

---

## 📄 License

Proprietary software built for **Atoyan Law Firm**.
