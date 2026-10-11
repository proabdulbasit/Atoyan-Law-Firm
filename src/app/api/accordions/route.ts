import { createEasyAccordion } from "@/lib/accordion-creator";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const KNOWN_ACCORDIONS = [
  { id: 4355, title: "Burbank Race Discrimination Attorney", shortcode: "[sp_easyaccordion id=\"4355\"]", topic: "Race Discrimination (Burbank)" },
  { id: 4200, title: "Burbank Hostile Work Environment Lawyer", shortcode: "[sp_easyaccordion id=\"4200\"]", topic: "Hostile Work Environment (Burbank)" },
  { id: 4176, title: "Burbank Wrongful Termination Lawyer", shortcode: "[sp_easyaccordion id=\"4176\"]", topic: "Wrongful Termination (Burbank)" },
  { id: 4167, title: "Burbank Wage Theft Attorney", shortcode: "[sp_easyaccordion id=\"4167\"]", topic: "Wage Theft (Burbank)" },
  { id: 4119, title: "Visalia Meal and Rest Break Violations", shortcode: "[sp_easyaccordion id=\"4119\"]", topic: "Meal & Rest Breaks (Visalia)" },
  { id: 4095, title: "Fresno Meal and Rest Break Violations", shortcode: "[sp_easyaccordion id=\"4095\"]", topic: "Meal & Rest Breaks (Fresno)" },
  { id: 4086, title: "Fresno Wage Theft Attorney", shortcode: "[sp_easyaccordion id=\"4086\"]", topic: "Wage Theft (Fresno)" },
  { id: 3989, title: "Meal Break Violation Lawyer", shortcode: "[sp_easyaccordion id=\"3989\"]", topic: "Meal Break Violation Lawyer" },
  { id: 3971, title: "Unpaid Wages Employment Attorney San Pedro", shortcode: "[sp_easyaccordion id=\"3971\"]", topic: "Unpaid Wages (San Pedro)" },
  { id: 3960, title: "Employment Attorney San Pedro, CA", shortcode: "[sp_easyaccordion id=\"3960\"]", topic: "Employment Law (San Pedro)" },
  { id: 3932, title: "What is an Adverse Employment Action?", shortcode: "[sp_easyaccordion id=\"3932\"]", topic: "Adverse Employment Action" },
  { id: 3897, title: "Disability", shortcode: "[sp_easyaccordion id=\"3897\"]", topic: "Disability Discrimination" },
  { id: 3894, title: "Burbank Disability Discrimination Lawyer", shortcode: "[sp_easyaccordion id=\"3894\"]", topic: "Disability Discrimination (Burbank)" },
  { id: 3877, title: "Burbank Gender Discrimination Lawyer", shortcode: "[sp_easyaccordion id=\"3877\"]", topic: "Gender Discrimination (Burbank)" },
  { id: 3873, title: "Visalia Gender Discrimination Lawyer", shortcode: "[sp_easyaccordion id=\"3873\"]", topic: "Gender Discrimination (Visalia)" },
  { id: 3830, title: "Visalia Unpaid Wages Lawyer", shortcode: "[sp_easyaccordion id=\"3830\"]", topic: "Unpaid Wages (Visalia)" },
  { id: 3828, title: "How Can I Sue My Employer on My Own in California?", shortcode: "[sp_easyaccordion id=\"3828\"]", topic: "Self-Representation / Legal FAQ" },
  { id: 3788, title: "Visalia Family and Medical Leave Lawyer", shortcode: "[sp_easyaccordion id=\"3788\"]", topic: "Family & Medical Leave (Visalia)" },
  { id: 3779, title: "Visalia Wage and Hour Claims Attorney", shortcode: "[sp_easyaccordion id=\"3779\"]", topic: "Wage & Hour Claims (Visalia)" },
  { id: 3740, title: "What is workplace retaliation?", shortcode: "[sp_easyaccordion id=\"3740\"]", topic: "Workplace Retaliation" },
  { id: 3738, title: "Frequently Asked Questions About Workplace Discrimination in Visalia", shortcode: "[sp_easyaccordion id=\"3738\"]", topic: "Workplace Discrimination (Visalia)" },
  { id: 3721, title: "Overtime questions", shortcode: "[sp_easyaccordion id=\"3721\"]", topic: "Overtime Questions" },
  { id: 3719, title: "overtime violations in Visalia", shortcode: "[sp_easyaccordion id=\"3719\"]", topic: "Overtime Violations (Visalia)" },
  { id: 3646, title: "What is whistleblower retaliation in Fresno, California?", shortcode: "[sp_easyaccordion id=\"3646\"]", topic: "Whistleblower Retaliation (Fresno)" },
  { id: 3619, title: "Fresno Overtime Violation lawyer", shortcode: "[sp_easyaccordion id=\"3619\"]", topic: "Overtime Violations (Fresno)" },
  { id: 3588, title: "Fresno Overtime Violation", shortcode: "[sp_easyaccordion id=\"3588\"]", topic: "Overtime Violation (Fresno)" },
  { id: 3586, title: "What is race discrimination in the workplace?", shortcode: "[sp_easyaccordion id=\"3586\"]", topic: "Race Discrimination in Workplace" },
  { id: 3549, title: "Ethnic and National Origin Discrimination in Los Angeles", shortcode: "[sp_easyaccordion id=\"3549\"]", topic: "Ethnic & National Origin (Los Angeles)" },
  { id: 3531, title: "Ethnic & National Origin Discrimination Attorney in San Pedro", shortcode: "[sp_easyaccordion id=\"3531\"]", topic: "Ethnic & National Origin (San Pedro)" },
  { id: 3515, title: "Paid Sick Time Off rights and attorneys in San Pedro", shortcode: "[sp_easyaccordion id=\"3515\"]", topic: "Paid Sick Time Off (San Pedro)" },
  { id: 3504, title: "Overtime Compensation Attorney in San Pedro", shortcode: "[sp_easyaccordion id=\"3504\"]", topic: "Overtime Compensation (San Pedro)" },
  { id: 3490, title: "Disability discrimination", shortcode: "[sp_easyaccordion id=\"3490\"]", topic: "Disability Discrimination" },
  { id: 3489, title: "Workplace Disability Discrimination", shortcode: "[sp_easyaccordion id=\"3489\"]", topic: "Workplace Disability Discrimination" },
  { id: 3480, title: "Workplace Retaliation", shortcode: "[sp_easyaccordion id=\"3480\"]", topic: "Workplace Retaliation" },
  { id: 3464, title: "San Pedro Sexual Harassment Lawyer", shortcode: "[sp_easyaccordion id=\"3464\"]", topic: "Sexual Harassment (San Pedro)" },
  { id: 3446, title: "Fresno Workplace Harassment Lawyer", shortcode: "[sp_easyaccordion id=\"3446\"]", topic: "Workplace Harassment (Fresno)" },
  { id: 3421, title: "Wrongful Termination Lawyer San Pedro CA", shortcode: "[sp_easyaccordion id=\"3421\"]", topic: "Wrongful Termination (San Pedro)" },
  { id: 3405, title: "Bakersfield Wage and Hour Violations Lawyer", shortcode: "[sp_easyaccordion id=\"3405\"]", topic: "Wage & Hour Violations (Bakersfield)" },
  { id: 3371, title: "Wrongful Termination", shortcode: "[sp_easyaccordion id=\"3371\"]", topic: "Wrongful Termination" },
  { id: 3365, title: "Race Discrimination", shortcode: "[sp_easyaccordion id=\"3365\"]", topic: "Race Discrimination" },
  { id: 3356, title: "Maternity Leave", shortcode: "[sp_easyaccordion id=\"3356\"]", topic: "Maternity Leave" },
  { id: 3348, title: "Landlord Eviction", shortcode: "[sp_easyaccordion id=\"3348\"]", topic: "Landlord Eviction" },
  { id: 3344, title: "Tenant Harassment & Intimidation", shortcode: "[sp_easyaccordion id=\"3344\"]", topic: "Tenant Harassment & Intimidation" },
  { id: 3312, title: "LGBTQ Discrimination Bakersfield", shortcode: "[sp_easyaccordion id=\"3312\"]", topic: "LGBTQ Discrimination (Bakersfield)" },
  { id: 3239, title: "LGBTQ Discrimination Attorney in Fresno, California", shortcode: "[sp_easyaccordion id=\"3239\"]", topic: "LGBTQ Discrimination (Fresno)" }
];

export async function GET() {
  const wpSiteUrl = process.env.WP_SITE_URL?.trim() || "https://www.atoyanlaw.com";
  const cleanBase = wpSiteUrl.replace(/\/$/, "");
  const wpUser = process.env.WP_USER?.trim();
  const wpPassword = process.env.WP_PASSWORD?.trim();

  // Try fetching live accordions: 1) Bridge endpoint, 2) Standard WP REST, 3) Catalog
  try {
    const headers: Record<string, string> = {};
    if (wpUser && wpPassword) {
      headers["Authorization"] = "Basic " + Buffer.from(wpUser + ":" + wpPassword).toString("base64");
    }

    // Tier 1: Try Autopilot Bridge endpoint
    try {
      const bridgeRes = await fetch(cleanBase + "/wp-json/autopilot/v1/accordions", {
        headers,
        signal: AbortSignal.timeout(6_000),
      });
      if (bridgeRes.ok) {
        const data = await bridgeRes.json();
        if (Array.isArray(data?.accordions) && data.accordions.length > 0) {
          return NextResponse.json({ accordions: data.accordions, source: "bridge" });
        }
      }
    } catch {
      // Bridge not yet updated on remote, proceed to Tier 2
    }

    // Tier 2: Try core WP REST API
    const res = await fetch(cleanBase + "/wp-json/wp/v2/sp_easy_accordion?per_page=100", {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const liveItems = await res.json();
      if (Array.isArray(liveItems) && liveItems.length > 0) {
        const mapped = liveItems.map((item) => ({
          id: item.id,
          title: (item.title && item.title.rendered) ? item.title.rendered : "Accordion " + item.id,
          shortcode: "[sp_easyaccordion id=\"" + item.id + "\"]",
        }));
        return NextResponse.json({ accordions: mapped, source: "live" });
      }
    }
  } catch {
    // Fallback to complete catalog
  }

  return NextResponse.json({ accordions: KNOWN_ACCORDIONS, source: "catalog" });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, faqs, city, topic, shortcode_options } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required to create an accordion" },
        { status: 400 }
      );
    }

    const result = await createEasyAccordion({
      title,
      faqs: Array.isArray(faqs) ? faqs : [],
      city: city || "California",
      topic: topic || "Employment Law",
      shortcode_options,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create accordion" },
      { status: 500 }
    );
  }
}
