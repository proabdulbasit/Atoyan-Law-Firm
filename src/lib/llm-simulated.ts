import { decomposeKeyword } from "./keyword-utils";
import { generateContextualCta, injectInternalLinks, formatHowDoContentWithLinks, formatCompensationContentWithLinks } from "./seo-linking";
import { trackPublishedArticle } from "./article-tracker";
import type { AtoyanLegalContent, AtoyanFaq } from "./types";
import { resolveDefaultAccordionShortcode, ATOYAN_PHONE, ATOYAN_CONTACT_URL } from "./atoyan";
import { getTopicEnrichmentModules } from "./topic-prompt-blueprints";

export type EmploymentTopic =
  | "race_discrimination"
  | "wage_theft"
  | "meal_breaks"
  | "sexual_harassment"
  | "workplace_harassment"
  | "disability"
  | "family_medical_leave"
  | "workplace_retaliation"
  | "wrongful_termination";

export function detectTopic(keyword: string): EmploymentTopic {
  const kw = keyword.toLowerCase();
  if (kw.includes("race") || kw.includes("racial") || kw.includes("color") || kw.includes("ethnic") || kw.includes("national origin") || kw.includes("ancestry") || kw.includes("bias")) {
    return "race_discrimination";
  }
  if (kw.includes("wage") || kw.includes("theft") || kw.includes("unpaid") || kw.includes("overtime") || kw.includes("minimum wage") || kw.includes("off the clock") || kw.includes("paycheck")) {
    return "wage_theft";
  }
  if (kw.includes("meal") || kw.includes("rest break") || kw.includes("break") || kw.includes("lunch")) {
    return "meal_breaks";
  }
  if (kw.includes("sexual") || kw.includes("quid pro quo")) {
    return "sexual_harassment";
  }
  if (kw.includes("harass") || kw.includes("hostile") || kw.includes("toxic")) {
    return "workplace_harassment";
  }
  if (kw.includes("disability") || kw.includes("medical condition") || kw.includes("accommodation") || kw.includes("interactive process") || kw.includes("handicap")) {
    return "disability";
  }
  if (kw.includes("leave") || kw.includes("fmla") || kw.includes("cfra") || kw.includes("pregnancy") || kw.includes("maternity") || kw.includes("paternity") || kw.includes("family")) {
    return "family_medical_leave";
  }
  if (kw.includes("retaliat") || kw.includes("whistleblower") || kw.includes("whistle") || kw.includes("complaint")) {
    return "workplace_retaliation";
  }
  return "wrongful_termination";
}

export function generateAtoyanSimulated(keyword: string, city: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const safeSlug = decomposed.slug;
  const heroTitle = decomposed.heroTitle;
  const lawyerTitle = decomposed.lawyerTitle;
  const topic = detectTopic(cleanTopic);
  const shortcode = resolveDefaultAccordionShortcode(cleanTopic, resolvedCity);

  let raw: AtoyanLegalContent;
  switch (topic) {
    case "race_discrimination":
      raw = buildRaceDiscriminationContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "wage_theft":
      raw = buildWageTheftContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "meal_breaks":
      raw = buildMealBreaksContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "sexual_harassment":
      raw = buildHarassmentContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "workplace_harassment":
      raw = buildWorkplaceHarassmentContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "disability":
      raw = buildDisabilityContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "family_medical_leave":
      raw = buildLeaveContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "workplace_retaliation":
      raw = buildRetaliationContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
    case "wrongful_termination":
    default:
      raw = buildWrongfulTerminationContent(cleanTopic, resolvedCity, safeSlug, shortcode);
      break;
  }

  // 1. Enforce 100% topic-specific, city-tailored CTAs with toll-free phone links
  const earlyCta = generateContextualCta({ topic: cleanTopic, city: resolvedCity, position: "early" });
  const midCta = generateContextualCta({ topic: cleanTopic, city: resolvedCity, position: "mid" });
  const closingCta = generateContextualCta({ topic: cleanTopic, city: resolvedCity, position: "closing" });

  let updatedServices = raw.servicesContent;
  const calloutRegex = /<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30"[^>]*>[\s\S]*?<\/p>/g;
  const matches = updatedServices.match(calloutRegex) || [];

  if (matches.length >= 3 && matches[0] && matches[1] && matches[2]) {
    updatedServices = updatedServices.replace(matches[0], earlyCta);
    updatedServices = updatedServices.replace(matches[1], midCta);
    updatedServices = updatedServices.replace(matches[2], closingCta);
  } else if (matches.length === 2 && matches[0] && matches[1]) {
    updatedServices = updatedServices.replace(matches[0], earlyCta);
    updatedServices = updatedServices.replace(matches[1], midCta);
    updatedServices = updatedServices + "\n\n" + closingCta;
  } else if (matches.length === 1 && matches[0]) {
    updatedServices = updatedServices.replace(matches[0], midCta);
    updatedServices = earlyCta + "\n\n" + updatedServices + "\n\n" + closingCta;
  } else {
    updatedServices = earlyCta + "\n\n" + updatedServices + "\n\n" + midCta + "\n\n" + closingCta;
  }

  // 2. Inject Contextual Internal Links into Services Content (3-5+ links, no self-links)
  const linkedServices = injectInternalLinks(updatedServices, {
    currentSlug: safeSlug,
    city: resolvedCity,
    maxLinks: 6,
  });

  // 3. Format How Do Section with diagnostic questions and contextual internal link
  const finalHowDo = formatHowDoContentWithLinks({
    topic: cleanTopic,
    city: resolvedCity,
    currentSlug: safeSlug,
  });

  // 4. Format Compensation Section with rights and contact link + accordion shortcode
  const finalComp = formatCompensationContentWithLinks({
    topic: cleanTopic,
    city: resolvedCity,
    accordionShortcode: shortcode,
  });

  const result: AtoyanLegalContent = {
    ...raw,
    heroTitle: heroTitle,
    slug: safeSlug,
    city: resolvedCity,
    keyword: cleanTopic,
    servicesHeading: decomposed.isArticle ? heroTitle : raw.servicesHeading,
    yoastTitle: decomposed.yoastTitle,
    yoastMetaDesc: decomposed.yoastMetaDesc,
    yoastFocusKw: decomposed.yoastFocusKw,
    servicesContent: linkedServices,
    howDoContent: finalHowDo,
    compensationIntro: finalComp,
  };

  // 5. Track article in internal SEO article tracker
  trackPublishedArticle({
    slug: safeSlug,
    title: result.heroTitle,
    keyword: cleanTopic,
    city: resolvedCity,
    category: topic,
    url: "https://www.atoyanlaw.com/practice-areas/employment-law/" + safeSlug + "/",
    publishedAt: new Date().toISOString(),
  });

  return result;
}


// -----------------------------------------------------------------------------
// DAVID ATOYAN APPROVED 10-QUESTION HIGH-INTENT GOOGLE SEARCH FAQ ENGINE
// -----------------------------------------------------------------------------
function faqP(text: string): string {
  return `<p class="my-2 [&+p]:mt-4 [&_strong:has(+br)]:inline-block [&_strong:has(+br)]:align-top">${text}</p>`;
}

function faqUl(items: string[]): string {
  return `<ul class="marker:text-secondary list-disc pl-8">\n` +
    items.map(it => ` \t<li class="py-0 my-0 prose-p:pt-0 prose-p:mb-2 prose-p:my-0 [&>p]:pt-0 [&>p]:mb-2 [&>p]:my-0">\n<p class="my-2 [&+p]:mt-4 [&_strong:has(+br)]:inline-block [&_strong:has(+br)]:align-top">${it}</p>\n</li>`).join("\n") +
    `\n</ul>`;
}

function faqOl(items: string[]): string {
  return `<ol class="marker:text-secondary list-decimal pl-8">\n` +
    items.map(it => ` \t<li class="py-0 my-0 prose-p:pt-0 prose-p:mb-2 prose-p:my-0 [&>p]:pt-0 [&>p]:mb-2 [&>p]:my-0">\n<p class="my-2 [&+p]:mt-4 [&_strong:has(+br)]:inline-block [&_strong:has(+br)]:align-top">${it}</p>\n</li>`).join("\n") +
    `\n</ol>`;
}

export function buildStatutoryDeadlineTableHtml(city: string): string {
  return faqP(`There is no single deadline — the clock depends on the specific legal theory behind your claim:`) +
`\n\n<div class="group relative my-[1em]">
<div class="sticky top-0 z-20 h-0" aria-hidden="true">
<div class="absolute left-0 top-0 w-full overflow-hidden bg-raised border-x md:max-w-[90vw] border-subtlest ring-subtlest divide-subtlest"></div>
</div>
<div class="w-full overflow-auto scrollbar-subtle rounded-lg border md:max-w-[90vw] border-subtlest ring-subtlest divide-subtlest bg-raised">
<table class="[&_tr:last-child_td]:border-b-0 my-0 w-full table-auto border-separate border-spacing-0 text-sm font-sans rounded-lg [&_tr:last-child_td:first-child]:rounded-bl-lg [&_tr:last-child_td:last-child]:rounded-br-lg">
<thead>
<tr>
<th class="border-subtlest p-2 min-w-[48px] break-normal border-b text-left align-bottom border-r last:border-r-0 font-bold bg-subtle first:border-radius-tl-lg last:border-radius-tr-lg" scope="col">Claim type</th>
<th class="border-subtlest p-2 min-w-[48px] break-normal border-b text-left align-bottom border-r last:border-r-0 font-bold bg-subtle first:border-radius-tl-lg last:border-radius-tr-lg" scope="col">Where to file</th>
<th class="border-subtlest p-2 min-w-[48px] break-normal border-b text-left align-bottom border-r last:border-r-0 font-bold bg-subtle first:border-radius-tl-lg last:border-radius-tr-lg" scope="col">Deadline</th>
</tr>
</thead>
<tbody>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">FEHA discrimination, harassment, or retaliation</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">California Civil Rights Department (CRD)</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>3 years</strong> from the adverse act, then 1 year to sue after a right-to-sue letter</td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Federal discrimination (Title VII, ADA, ADEA)</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">U.S. Equal Employment Opportunity Commission (EEOC)</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>300 days</strong> (California is a "deferral" state), then 90 days to sue after a right-to-sue notice</td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Public policy / <em>Tameny</em> claim</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">California Superior Court</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>2 years</strong> from termination</td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Breach of written employment contract</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">California Superior Court</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>4 years</strong></td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Breach of implied/oral contract</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">California Superior Court</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>2 years</strong></td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Whistleblower retaliation (Labor Code § 1102.5)</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Superior Court / Labor Commissioner</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>3 years</strong> civil (some administrative routes may be shorter)</td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Wage theft & overtime violations</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Labor Commissioner (DLSE) / Superior Court</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>3 years</strong> statutory (up to <strong>4 years</strong> under UCL Bus & Prof Code § 17200)</td>
</tr>
<tr>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Workers' comp retaliation (Labor Code § 132a)</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0">Workers' Compensation Appeals Board</td>
<td class="border-subtlest p-2 min-w-[48px] break-normal border-b border-r last:border-r-0"><strong>1 year</strong> from the adverse action</td>
</tr>
</tbody>
</table>
</div>
</div>\n\n` +
  faqP(`The clock generally starts on the date you are notified of the adverse action or termination, not the date you later realize the conduct was unlawful (<a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://leginfo.legislature.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California Code of Civil Procedure § 335.1</span></a>). Because these deadlines are firm and easy to miss, it is best to contact an attorney in ${city} as soon as possible.`);
}

function buildImmediateActionStepsHtml(): string {
  return faqP(`Taking the right steps early can protect a future claim:`) +
`\n\n` +
  faqOl([
    `<strong>Stay calm and professional</strong> — do not sign anything you do not understand, including severance agreements that may release your legal claims.`,
    `<strong>Request your personnel file</strong> — California employees have the statutory right to inspect and copy employment records under Labor Code § 1198.5.`,
    `<strong>Preserve documents you lawfully possess</strong>, such as pay stubs, termination or disciplinary letters, performance reviews, text messages, and personal notes. Do not access, download, or remove confidential company documents without first speaking to an attorney.`,
    `<strong>Write down a timeline</strong> of key events while your memory is fresh, including dates of any complaints, protected activity, and the employer's stated reasons.`,
    `<strong>Apply for unemployment benefits</strong> promptly through the <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://edd.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California EDD</span></a> (unlawful firings or constructive discharges are generally not disqualifying "misconduct").`,
    `<strong>Document job-search efforts</strong> — most damages require you to "mitigate" by actively seeking replacement work.`,
    `<strong>Contact an employment lawyer</strong> before filing deadlines run — some claims require an administrative filing (with the CRD or EEOC) before any lawsuit can be filed.`,
  ]);
}

function buildAtoyanAttorneyCtaBlock(city: string, cleanTopic: string): string {
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const topicSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `\r\n<h2 id="talk-to-a-${citySlug}-${topicSlug}-lawyer" class="font-semibold leading-tight text-pretty mb-2 mt-4 [.has-inline-images_&]:clear-end text-base first:mt-0">Talk to a ${city} ${cleanTopic} Lawyer</h2>\r\n<p class="my-2 [&+p]:mt-4 [&_strong:has(+br)]:inline-block [&_strong:has(+br)]:align-top">If you believe your workplace rights were violated in ${city}, time limits apply under California law. <strong>Contact Atoyan Law at (888) 807-0077</strong> or through the online form at <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://www.atoyanlaw.com/contact/" target="_blank" rel="noopener"><span class="text-box-trim-both">atoyanlaw.com</span></a> for a free, confidential case evaluation.</p>`;
}

export function buildDavidAtoyanFaqs(
  topic: EmploymentTopic,
  city: string,
  cleanTopic: string
): AtoyanFaq[] {
  const decomposed = decomposeKeyword(cleanTopic || topic, city);
  const resolvedCity = decomposed.city || city || "California";
  const resolvedTopic = decomposed.cleanTopic || cleanTopic || "Employment Law";
  const ctaBlock = buildAtoyanAttorneyCtaBlock(resolvedCity, resolvedTopic);

  switch (topic) {
    case "race_discrimination":
      return [
        {
          question: `What Qualifies as Race Discrimination in ${city}, California?`,
          answer: faqP(`Race discrimination occurs when an employer treats an employee or job applicant unfavorably because of their race, skin color, ancestry, or national origin. California law prohibits racial bias across all aspects of employment, including hiring, pay, job assignments, promotions, discipline, and termination.`) +
            `\n\n` +
            faqP(`Under California's Fair Employment and Housing Act (FEHA, <a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Gov Code § 12940(a)</span></a>), employers with five or more employees cannot discriminate based on protected characteristics. Furthermore, California's CROWN Act (Gov Code § 12926(w)) explicitly extends racial protection to hair texture and historical hairstyles such as braids, locs, twists, and afros.`)
        },
        {
          question: `What Are Common Examples of Race Discrimination at Work?`,
          answer: faqP(`Workplace racial discrimination is rarely admitted openly; it is usually reflected through unequal treatment and shifting standards. Common examples include:`) +
            `\n\n` +
            faqUl([
              `<strong>Compensation Disparities</strong>: Paying minority employees lower wages or bonuses than white coworkers performing substantially similar work under California Equal Pay standards.`,
              `<strong>Glass Ceiling & Denied Promotions</strong>: Systematically passing over qualified minority workers in favor of less-experienced colleagues for leadership roles.`,
              `<strong>Selective Disciplinary Enforcement</strong>: Disciplining or writing up minority workers for infractions that non-minority colleagues commit without consequence.`,
              `<strong>Job Steering</strong>: Funneling applicants of color into lower-paying, non-public-facing positions while reserving customer-facing roles for other workers.`,
              `<strong>Pretextual Firings</strong>: Manufacturing sudden negative reviews after years of positive feedback to justify terminating an employee based on race.`
            ])
        },
        {
          question: `Can I Sue My Employer for Race Discrimination in ${city}?`,
          answer: faqP(`Yes. If your employer subjected you to race discrimination or tolerated a racially hostile work environment in ${city}, you have the legal right to pursue civil justice under FEHA and federal Title VII of the Civil Rights Act.`) +
            `\n\n` +
            faqP(`Before filing a lawsuit in California Superior Court, an employee must first exhaust administrative remedies by securing a Right-to-Sue notice from the <a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California Civil Rights Department</span></a> (CRD). An experienced ${city} employment attorney can file this on your behalf and seek full financial compensation.`)
        },
        {
          question: `Can My Employer Fire Me Because of My Race?`,
          answer: faqP(`No. While California is an "at-will" employment state, at-will rules never authorize an employer to terminate someone for an unlawful discriminatory reason. Terminating an employee because of race, color, ancestry, or protective hairstyles is an unlawful wrongful termination under California public policy and FEHA.`) +
            `\n\n` +
            faqP(`Employers often attempt to conceal racial motives behind pretextual excuses like "downsizing," "restructuring," or "poor cultural fit." In litigation, your attorney can expose these justifications as false through comparator evidence and communication records.`)
        },
        {
          question: `Can My Employer Retaliate Against Me for Reporting Race Discrimination?`,
          answer: faqP(`No. California strictly forbids employers from taking adverse action against any employee for opposing racial discrimination, filing an HR complaint, or participating in an investigation.`) +
            `\n\n` +
            faqP(`Under <strong>California Senate Bill 497 (effective January 1, 2024)</strong>, when an employer takes an adverse action—such as termination, demotion, suspension, or hour reductions—within <strong>90 days</strong> of an employee's complaint, retaliation is legally presumed under <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://leginfo.legislature.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California Labor Code § 98.6</span></a> and § 1102.5. The employer bears the burden to prove a legitimate, non-retaliatory reason.`)
        },
        {
          question: `What Evidence Do I Need for a Workplace Race Discrimination Case?`,
          answer: faqP(`Because direct admissions of racism are rare, California employment discrimination cases are primarily proven through circumstantial and comparator evidence:`) +
            `\n\n` +
            faqUl([
              `<strong>Personnel Records</strong>: Performance evaluations, client commendations, and awards showing consistent solid performance prior to any adverse action.`,
              `<strong>Digital Communications</strong>: Emails, text messages, and workplace chat logs containing biased language, shifting justifications, or proof of unequal scrutiny.`,
              `<strong>Comparator Evidence</strong>: Documentation proving that employees of other races with similar or lesser qualifications were given higher pay, promotions, or leniency.`,
              `<strong>Suspicious Timing</strong>: Demonstrating that negative reviews or disciplinary warnings began only after you complained or opposed discriminatory practices.`
            ])
        },
        {
          question: `Can I Have a Race Discrimination Case If My Coworker Violated My Rights Instead of My Boss?`,
          answer: faqP(`Yes. Under California Government Code § 12940(j), workplace harassment protections protect workers against unlawful conduct by nonsupervisory coworkers.`) +
            `\n\n` +
            faqP(`While an employer is strictly liable for harassment committed by a supervisor or manager, the employer is also legally liable for coworker racial harassment if management or HR knew—or reasonably should have known—about the hostile conduct and failed to take immediate, effective corrective action.`)
        },
        {
          question: `Do I Have to Report Race Discrimination to HR Before I Can Sue?`,
          answer: faqP(`While reporting to HR or management creates a clear contemporaneous record putting the employer on notice, it is not an absolute barrier to filing a lawsuit in every circumstance—especially if the harasser is the business owner or HR itself.`) +
            `\n\n` +
            buildImmediateActionStepsHtml()
        },
        {
          question: `How Long Do I Have to File a Race Discrimination Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `How Much Is a Race Discrimination Case Worth in California?`,
          answer: faqP(`Damages in a California race discrimination lawsuit reflect both economic and non-economic harm suffered by the worker:`) +
            `\n\n` +
            faqUl([
              `<strong>Economic Damages</strong>: Full back pay for past lost earnings, front pay for future lost earning capacity, lost retirement contributions, and benefits.`,
              `<strong>Non-Economic Damages</strong>: Compensation for emotional distress, anxiety, depression, humiliation, and damage to professional reputation.`,
              `<strong>Punitive Damages</strong>: Awarded under California Civil Code § 3294 when corporate officers or managing agents acted with oppression, fraud, or malice.`,
              `<strong>Statutory Attorneys' Fees</strong>: Under Government Code § 12965(b), a prevailing employee can recover all reasonable attorneys' fees and litigation costs from the employer.`
            ]) +
            ctaBlock
        }
      ];

    case "wage_theft":
      return [
        {
          question: `What Qualifies as Wage Theft and Overtime Violations in ${city}, California?`,
          answer: faqP(`Wage theft occurs whenever an employer deprives an employee of wages, premiums, or statutory entitlements earned under the California Labor Code and Industrial Welfare Commission (IWC) Wage Orders.`) +
            `\n\n` +
            faqP(`In California, non-exempt employees are entitled to daily overtime (1.5x after 8 hours in a day, 2x after 12 hours), weekly overtime (1.5x after 40 hours in a week), seventh consecutive day premiums, paid off-the-clock time, meal and rest break premiums, and statutory minimum wages.`)
        },
        {
          question: `What Are Common Examples of Wage Theft at Work?`,
          answer: faqP(`Wage theft takes many forms in California workplaces. Common examples include:`) +
            `\n\n` +
            faqUl([
              `<strong>Off-the-Clock Work</strong>: Requiring prep work, closing duties, cleaning, or security bag checks before clocking in or after clocking out.`,
              `<strong>Shaving Hours & Altering Records</strong>: Supervisors manually editing electronic timecards or deducting meal breaks when workers were on duty.`,
              `<strong>Exempt Misclassification</strong>: Paying a flat salary to managers or coordinators whose daily duties are primarily non-exempt routine tasks.`,
              `<strong>Independent Contractor Misclassification</strong>: Improperly issuing a 1099 form instead of a W-2 under California's strict AB 5 "ABC Test."`,
              `<strong>Withholding Final Paychecks</strong>: Failing to provide all earned wages immediately upon discharge under Labor Code §§ 201-203.`
            ])
        },
        {
          question: `Can I Sue My Employer for Unpaid Wages and Overtime in ${city}?`,
          answer: faqP(`Yes. California law provides multiple legal avenues to recover unpaid wages, statutory interest, liquidated damages, and waiting time penalties.`) +
            `\n\n` +
            faqP(`You can file a civil lawsuit in California Superior Court or submit an administrative wage claim with the California Labor Commissioner (DLSE). Under California Labor Code § 218.5 and § 1194, when an employee prevails in a wage claim, the employer must pay all of the employee's reasonable attorneys' fees.`)
        },
        {
          question: `Can My Employer Require Me to Work Overtime Without Paying Me?`,
          answer: faqP(`An employer can require a non-exempt employee to work overtime, but requiring the work does not eliminate the legal obligation to pay for it at premium rates.`) +
            `\n\n` +
            faqP(`Some employees believe they are not entitled to overtime because their manager never explicitly pre-authorized it. Under California law, an employer's internal policy cannot erase an employee's right to compensation for work the employer suffered or permitted.`)
        },
        {
          question: `Can My Employer Retaliate Against Me for Inquiring About or Demanding Overtime?`,
          answer: faqP(`No. Employees should never have to choose between receiving their earned wages and keeping their job. California Labor Code § 98.6 strictly prohibits retaliation against workers who complain about unpaid wages.`) +
            `\n\n` +
            faqP(`Under <strong>Senate Bill 497 (effective 2024)</strong>, if an employer fires, demotes, reduces the hours of, or disciplines an employee within <strong>90 days</strong> of asking about unpaid wages or reporting wage theft, unlawful retaliation is legally presumed.`)
        },
        {
          question: `What Evidence Do I Need to Prove an Overtime or Wage Theft Violation?`,
          answer: faqP(`You do not need a perfect collection of company records to pursue an unpaid wage claim. Keep whatever evidence you lawfully possess:`) +
            `\n\n` +
            faqUl([
              `<strong>Pay Stubs and Wage Statements</strong>: Demonstrating your stated hourly rate, recorded hours, and missing premium lines.`,
              `<strong>Timecards and Electronic Badges</strong>: Copies of physical timecards or timestamped shift records before employers alter them.`,
              `<strong>Personal Contemporaneous Notes</strong>: A daily notebook, smartphone timestamp, or calendar logging exact start, meal, and end times.`,
              `<strong>Workplace Communications</strong>: Emails, text messages, or Slack chats instructing you to perform tasks before clocking in or after hours.`
            ])
        },
        {
          question: `What If My Employer Changed My Time Records or Forced Me Off the Clock?`,
          answer: faqP(`Altering time records to avoid paying earned overtime is unlawful and constitutes wage theft under California Labor Code § 1174 and § 226.`) +
            `\n\n` +
            faqP(`Under California Supreme Court precedent (Troester v. Starbucks Corp.), employers must pay for every minute an employee is suffered or permitted to work—California does not recognize the federal "de minimis" defense. If your supervisor shaved hours or ordered you off the clock, you are entitled to full pay plus statutory penalties.`)
        },
        {
          question: `Can Undocumented Workers Recover Unpaid Wages and Overtime in California?`,
          answer: faqP(`Yes, absolutely. Under <strong>California Labor Code § 1171.5</strong>, all labor protections and wage rights apply to workers in California regardless of immigration status.`) +
            `\n\n` +
            faqP(`An employer cannot use immigration status to withhold wages or overtime legally owed. Furthermore, threatening to report an employee's immigration status to silence a wage claim is severe unlawful retaliation under California Labor Code § 244.`)
        },
        {
          question: `How Long Do I Have to File a Wage Theft or Overtime Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `How Much Overtime Pay and Statutory Penalties Could I Be Owed?`,
          answer: faqP(`Unpaid overtime calculations add up rapidly. For example, an employee earning $25 per hour who works just 2 hours of unpaid overtime each week is missing $75 weekly. Over a year, that is $3,750 in base unpaid wages.`) +
            `\n\n` +
            faqP(`In addition to back wages, California law provides:`) +
            `\n\n` +
            faqUl([
              `<strong>Interest at 10% per annum</strong> on all unpaid wages under Labor Code § 218.6.`,
              `<strong>Waiting Time Penalties</strong> under Labor Code § 203: Up to 30 days of full daily wages if final pay was delayed.`,
              `<strong>Itemized Wage Statement Penalties</strong> under Labor Code § 226: Up to $4,000 for inaccurate paystubs.`,
              `<strong>Liquidated Damages</strong> matching unpaid minimum wages under Labor Code § 1194.2.`,
              `<strong>Full Attorneys' Fees</strong> paid by the employer under Labor Code § 218.5.`
            ]) +
            ctaBlock
        }
      ];

    case "meal_breaks":
      return [
        {
          question: `What Are Meal and Rest Break Rights Under California Labor Law?`,
          answer: faqP(`California Labor Code § 512 and IWC Wage Orders mandate generous, worker-protective meal and rest periods for non-exempt employees.`) +
            `\n\n` +
            faqP(`Employees working more than 5 hours in a workday are entitled to an uninterrupted, 30-minute off-duty meal period before the end of the 5th hour. A second 30-minute meal break is required when working more than 10 hours. Non-exempt employees also earn a paid 10-minute rest break for every four hours worked.`)
        },
        {
          question: `What Are Common Examples of Workplace Meal and Rest Break Violations?`,
          answer: faqP(`Break violations are frequent across California industries. Common examples include:`) +
            `\n\n` +
            faqUl([
              `<strong>On-Duty Lunch Mandates</strong>: Requiring workers to answer phones, monitor machinery, or remain on premises during lunch.`,
              `<strong>Late Meal Periods</strong>: Forcing employees to take lunch after the 5th hour of work without a valid written waiver.`,
              `<strong>Interrupted Breaks</strong>: Paging workers back to the floor or interrupting meals with work questions.`,
              `<strong>Skipped Rest Breaks</strong>: Understaffing shifts so workers cannot realistically take their 10-minute rest periods.`,
              `<strong>Failing to Pay Premiums</strong>: Not adding the statutory one-hour premium pay to paychecks for missed breaks.`
            ])
        },
        {
          question: `Can I Sue My Employer for Denying Meal or Rest Breaks in ${city}?`,
          answer: faqP(`Yes. Under <strong>California Labor Code § 226.7</strong>, when an employer fails to provide a compliant meal or rest break, the employer must pay the employee <strong>one additional hour of pay at the employee's regular rate</strong> for each workday the break was not provided.`) +
            `\n\n` +
            faqP(`You can pursue these premium wages through a civil lawsuit in California Superior Court or via an administrative claim with the Labor Commissioner (DLSE).`)
        },
        {
          question: `Can My Employer Force Me to Work Through Lunch or Eat at My Desk?`,
          answer: faqP(`No. Under the landmark California Supreme Court decision in <em>Brinker Restaurant Corp. v. Superior Court</em>, an employer must completely relieve the employee of all duty and relinquish control during meal periods.`) +
            `\n\n` +
            faqP(`If you are required to remain at your desk, monitor radios, or assist customers while eating, the break is legally considered on-duty work, triggering premium pay.`)
        },
        {
          question: `Can My Employer Retaliate Against Me for Taking or Demanding My Required Breaks?`,
          answer: faqP(`No. Retaliating against an employee for demanding their lawful rest or meal periods violates California Labor Code § 98.6.`) +
            `\n\n` +
            faqP(`Under <strong>Senate Bill 497</strong>, any adverse action taken against a worker within <strong>90 days</strong> of asserting break rights is presumed to be unlawful retaliation.`)
        },
        {
          question: `What Evidence Do I Need to Prove Missed Meal and Rest Breaks?`,
          answer: faqP(`Key evidence in a meal and rest break dispute includes:`) +
            `\n\n` +
            faqUl([
              `<strong>Pay Stubs</strong>: Proving the absence of California Labor Code § 226.7 premium payments.`,
              `<strong>Time Records</strong>: Demonstrating meal clock-outs after the 5th hour, meals lasting less than 30 minutes, or missing punches.`,
              `<strong>Electronic Activity Logs</strong>: Keycard swipes, computer logins, POS sales, or emails sent during designated break times.`,
              `<strong>Coworker Statements</strong>: Corroborating that shift staffing made taking breaks impossible.`
            ])
        },
        {
          question: `What If My Employer Automatically Deducts Lunch From My Paystub Even When I Work?`,
          answer: faqP(`Automatic 30-minute lunch deductions are illegal when employees actually work through lunch. If your employer automatically deducts time, they violate both wage recording requirements and overtime laws.`) +
            `\n\n` +
            faqP(`You are entitled to pay for the hours worked plus the one-hour statutory meal break premium for every shift this occurred.`)
        },
        {
          question: `Can Undocumented Workers Recover Meal and Rest Break Premiums in California?`,
          answer: faqP(`Yes. California Labor Code § 1171.5 protects all workers regardless of immigration status. You are fully entitled to collect all earned break premiums and statutory penalties.`)
        },
        {
          question: `How Long Do I Have to File a Meal and Rest Break Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `How Much Compensation Am I Owed for Missed Breaks Under Labor Code § 226.7?`,
          answer: faqP(`Break premiums accumulate quickly. An employee earning $22 per hour who misses both a meal break and a rest break each day is owed $44 per day in statutory premiums—that equals $220 weekly and over $11,000 across a single year.`) +
            `\n\n` +
            faqP(`In addition to back premiums, claims can recover waiting time penalties under Labor Code § 203, wage statement penalties under § 226, and full attorneys' fees.`) +
            ctaBlock
        }
      ];

    case "workplace_harassment":
      return [
        {
          question: `What Qualifies as Unlawful Workplace Harassment Under California FEHA?`,
          answer: faqP(`Under the California Fair Employment and Housing Act (FEHA, <a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Gov Code § 12940(j)</span></a>), workplace harassment consists of unwelcome, discriminatory verbal, visual, or physical conduct directed at an employee because of a legally protected characteristic.`) +
            `\n\n` +
            faqP(`Unlike routine workplace friction or personality clashes, unlawful harassment targets an individual's protected identity and creates an intimidating, hostile, offensive, or abusive working environment that unreasonably interferes with their job performance.`)
        },
        {
          question: `What Protected Characteristics Are Shielded from Harassment Under California Law?`,
          answer: faqP(`California Government Code § 12940(a) and (j) protect employees from harassment based on any of the following protected categories:`) +
            `\n\n` +
            faqUl([
              `<strong>Race, Color, Ancestry & National Origin</strong>: Racial slurs, xenophobic comments, mocking accents, or violations of the CROWN Act (Gov Code § 12926(w)) regarding natural hairstyles.`,
              `<strong>Religious Creed</strong>: Mocking religious practices, derogatory remarks regarding observances, or coercing participation in conflicting events.`,
              `<strong>Disability & Medical Conditions</strong>: Demeaning comments about physical mobility, mental health conditions, cancer history, or medical accommodation needs.`,
              `<strong>Age (40 and Over)</strong>: Pervasive ageist insults, pressuring older workers to retire, or mocking technology adoption.`,
              `<strong>Sex, Gender, Gender Identity & Sexual Orientation</strong>: Derogatory slurs, deadnaming, misgendering, or homophobic conduct.`,
              `<strong>Military and Veteran Status</strong>: Disparaging military service or obligations.`
            ])
        },
        {
          question: `What Is the Legal Difference Between Workplace Harassment and Workplace Discrimination?`,
          answer: faqP(`Under the California Supreme Court precedent in <em>Reno v. Baird</em> (1998), harassment and discrimination represent two distinct legal claims:`) +
            `\n\n` +
            faqUl([
              `<strong>Discrimination</strong>: Relates to official corporate management decisions—such as firing, demoting, setting unequal pay, or denying promotions based on a protected status.`,
              `<strong>Harassment</strong>: Relates to interpersonal workplace abuse, derogatory comments, hostility, or bullying that is outside the scope of legitimate managerial necessity.`
            ]) +
            `\n\n` +
            faqP(`Crucially, under California Government Code § 12940(j)(3), individual harassers can be sued and held personally liable in civil court, whereas individual supervisors cannot be held personally liable for discrimination.`)
        },
        {
          question: `What Is the "Severe or Pervasive" Legal Standard for Hostile Work Environments in California?`,
          answer: faqP(`To establish a hostile work environment claim under FEHA, an employee must show that the abusive conduct was either <strong>severe OR pervasive</strong>.`) +
            `\n\n` +
            faqP(`Under California <strong>Senate Bill 1300</strong> (codified at Gov Code § 12923), the California Legislature explicitly affirmed that a <strong>single egregious incident</strong> of harassment can be sufficient to create an actionable hostile work environment. Furthermore, workplace harassment claims are rarely suited for summary judgment dismissals because whether an environment is hostile is an issue of fact reserved for a jury.`)
        },
        {
          question: `When Is an Employer Strictly Liable for Supervisor Harassment in ${city}?`,
          answer: faqP(`Under California Government Code § 12940(j)(1), if an unlawful harassment act is committed by a <strong>supervisor or manager</strong>, the employer is <strong>strictly liable</strong>.`) +
            `\n\n` +
            faqP(`Strict liability means the employer is automatically legally responsible for all financial damages, regardless of whether executive management or human resources was aware of the conduct. The company cannot avoid liability by claiming the supervisor violated company policy.`)
        },
        {
          question: `Can My Employer Be Held Responsible If a Coworker or Customer Harassed Me?`,
          answer: faqP(`Yes. If the harasser is a non-supervisory coworker, independent contractor, client, or customer, the employer is liable under FEHA if management or HR <strong>knew or should have known</strong> of the abusive conduct and failed to take immediate and appropriate corrective action.`)
        },
        {
          question: `What Constitutes an Employer's "Failure to Prevent Harassment" Under Gov Code § 12940(k)?`,
          answer: faqP(`California Government Code § 12940(k) creates an independent statutory cause of action against employers who fail to take all reasonable steps necessary to prevent harassment and discrimination.`) +
            `\n\n` +
            faqP(`When an employer ignores worker complaints, conducts a sham or one-sided HR investigation, fails to discipline known harassers, or fails to provide mandatory anti-harassment training under Assembly Bill 2053 (abusive conduct), the employer violates § 12940(k) and incurs independent legal liability.`)
        },
        {
          question: `Can I Sue If Pervasive Harassment Forced Me to Quit (Constructive Discharge)?`,
          answer: faqP(`Yes. Under California law (<em>Turner v. Anheuser-Busch, Inc.</em>), if an employer knowingly permits workplace harassment so intolerable that no reasonable worker could endure it, a resignation is treated as a forced termination, known as <strong>constructive discharge</strong>.`) +
            `\n\n` +
            faqP(`A constructive discharge allows you to pursue all lost wages, future earnings, emotional distress damages, and punitive damages as if the employer had formally fired you.`)
        },
        {
          question: `How Long Do I Have to File a Workplace Harassment Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `How Much Is a Workplace Harassment Case Worth in California?`,
          answer: faqP(`Workplace harassment damages under California law compensate workers for both economic loss and personal trauma:`) +
            `\n\n` +
            faqUl([
              `<strong>Past & Future Lost Wages</strong>: Back pay, front pay, lost benefits, and career disruption damages if forced to resign or terminated.`,
              `<strong>Emotional Distress Damages</strong>: Compensation for severe psychological trauma, anxiety, depression, insomnia, and medical care, with <strong>no statutory cap</strong> under California FEHA.`,
              `<strong>Punitive Damages</strong>: Under California Civil Code § 3294, awarded against malicious corporate employers to punish egregious misconduct or conscious disregard for worker safety.`,
              `<strong>Mandatory Attorneys' Fees</strong>: California Government Code § 12965 requires the employer to pay all of your attorney fees and litigation costs when you prevail.`
            ]) +
            ctaBlock
        }
      ];

    case "sexual_harassment":
      return [
        {
          question: `What Qualifies as Sexual Harassment in the Workplace Under California Law?`,
          answer: faqP(`Under California's Fair Employment and Housing Act (FEHA, <a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Gov Code § 12940(j)</span></a>), sexual harassment includes unwelcome sexual advances, requests for sexual favors, and other verbal, visual, or physical conduct of a sexual nature.`) +
            `\n\n` +
            faqP(`California recognizes two primary forms of sexual harassment: <strong>Quid Pro Quo</strong> (where job benefits or continued employment are conditioned on submitting to sexual demands) and <strong>Hostile Work Environment</strong> (where severe or pervasive conduct alters working conditions and creates an intimidating, abusive workplace).`)
        },
        {
          question: `What Are Common Examples of Sexual Harassment at Work?`,
          answer: faqP(`Sexual harassment can take many non-physical forms in addition to unwanted contact. Common examples include:`) +
            `\n\n` +
            faqUl([
              `<strong>Verbal Misconduct</strong>: Inappropriate sexual comments, crude jokes, propositions, inquiries into an employee's personal sex life, or sexual pet names.`,
              `<strong>Physical Harassment</strong>: Unwanted touching, groping, hugging, kissing, rubbing shoulders, or blocking normal movement.`,
              `<strong>Visual Harassment</strong>: Displaying pornographic images, sending sexually suggestive text messages, memes, or explicit emails.`,
              `<strong>Coerced Quid Pro Quo</strong>: Promising a promotion, better schedule, or raise in exchange for dates or romantic compliance.`
            ])
        },
        {
          question: `Can I Sue My Employer for Sexual Harassment in ${city}?`,
          answer: faqP(`Yes. California employers have a strict affirmative legal duty under FEHA Gov Code § 12940(k) to take all reasonable steps to prevent harassment from occurring.`) +
            `\n\n` +
            faqP(`Under California law, sexual harassment protections apply to <strong>all California employers regardless of size</strong> (even businesses with only 1 employee). If management failed to protect you, you can file a civil lawsuit in California Superior Court after securing a Right-to-Sue notice from the CRD.`)
        },
        {
          question: `Can My Employer Fire Me for Reporting Sexual Harassment?`,
          answer: faqP(`No. Firing an employee for reporting sexual harassment is illegal workplace retaliation and wrongful termination under California Government Code § 12940(h).`) +
            `\n\n` +
            faqP(`If an employer terminates, demotes, cuts the hours of, or isolates an employee after they report harassment, the employer faces severe civil liability for retaliation, which often carries larger damage awards than the harassment claim itself.`)
        },
        {
          question: `Can My Employer Retaliate Against Me for Reporting Inappropriate Conduct?`,
          answer: faqP(`No. Under <strong>California Senate Bill 497</strong>, if an employer takes any adverse action within <strong>90 days</strong> of an employee reporting harassment or participating in an investigation, retaliation is legally presumed.`) +
            `\n\n` +
            faqP(`The employer must rebut this presumption with clear, credible evidence showing the action would have been taken regardless of the protected complaint.`)
        },
        {
          question: `What Evidence Do I Need to Prove a Workplace Sexual Harassment Case?`,
          answer: faqP(`Strong evidence in a sexual harassment claim includes:`) +
            `\n\n` +
            faqUl([
              `<strong>Electronic Communications</strong>: Texts, WhatsApp messages, voicemails, emails, or social media DMs from the harasser.`,
              `<strong>Contemporaneous Journal</strong>: A detailed personal record recording dates, times, exact words spoken, and witnesses present.`,
              `<strong>Internal Complaints</strong>: Copies of written emails or memos submitted to HR or management reporting the misconduct.`,
              `<strong>Witness Testimony</strong>: Statements from coworkers who observed the inappropriate conduct or experienced similar treatment.`
            ])
        },
        {
          question: `Can I Sue My Employer If a Coworker or Customer Harassed Me Instead of a Supervisor?`,
          answer: faqP(`Yes. Under FEHA Government Code § 12940(j), employers are strictly liable for supervisor harassment, but they are also liable for coworker or third-party (customer/client) harassment if management knew or should have known and failed to take immediate corrective action.`)
        },
        {
          question: `Do I Have to Report Sexual Harassment to HR Before I Can Sue?`,
          answer: faqP(`Reporting to HR is generally advisable to trigger the employer's duty to investigate, but it is not mandatory when the harasser is the owner, high-level executive, or when reporting would be futile or dangerous.`) +
            `\n\n` +
            buildImmediateActionStepsHtml()
        },
        {
          question: `How Long Do I Have to File a Sexual Harassment Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `How Much Is a Workplace Sexual Harassment Case Worth in California?`,
          answer: faqP(`Sexual harassment settlements and verdicts in California can be substantial, reflecting the severe emotional trauma inflicted on victims:`) +
            `\n\n` +
            faqUl([
              `<strong>Emotional Distress Damages</strong>: Compensation for anxiety, depression, PTSD, sleep disruption, and therapy costs.`,
              `<strong>Economic Damages</strong>: Back pay, front pay, lost bonuses, and health coverage if forced to resign (constructive discharge).`,
              `<strong>Punitive Damages</strong>: Substantial awards under Civil Code § 3294 to punish egregious corporate malice or cover-ups.`,
              `<strong>Statutory Attorneys' Fees</strong>: Paid entirely by the defendant employer under Government Code § 12965(b).`
            ]) +
            ctaBlock
        }
      ];

    case "disability":
      return [
        {
          question: `What Qualifies as Disability Discrimination in the Workplace Under California FEHA?`,
          answer: faqP(`California's Fair Employment and Housing Act (FEHA) provides much broader disability protections than the federal Americans with Disabilities Act (ADA).`) +
            `\n\n` +
            faqP(`Under FEHA (<a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Gov Code § 12926</span></a>), an employee has a protected disability if they have a physical or mental impairment that simply limits a major life activity (such as working, walking, sleeping, or concentrating). Under federal law, the impairment must "substantially" limit, making California significantly more protective of workers.`)
        },
        {
          question: `What Are Common Examples of Disability Discrimination and Failure to Accommodate?`,
          answer: faqP(`Common disability violations committed by California employers include:`) +
            `\n\n` +
            faqUl([
              `<strong>Refusing Reasonable Accommodations</strong>: Denying ergonomic chairs, modified duties, telecommuting, or medical leave.`,
              `<strong>Ignoring the Interactive Process</strong>: Refusing to communicate openly with the worker to identify effective accommodations.`,
              `<strong>Wrongful Discharge After Injury</strong>: Firing an employee shortly after they return from surgery or disclose a diagnosis.`,
              `<strong>Demoting or Reducing Hours</strong>: Shifting disabled workers to lower-paying shifts or stripping responsibilities.`
            ])
        },
        {
          question: `Can I Sue My Employer for Disability Discrimination in ${city}?`,
          answer: faqP(`Yes. If your employer discriminated against you, failed to provide accommodations, or failed to engage in the interactive process in ${city}, you can file a lawsuit under FEHA for substantial damages.`)
        },
        {
          question: `Can My Employer Fire Me Because I Have a Medical Condition or Disability?`,
          answer: faqP(`No. Terminating an employee because of a medical condition, cancer diagnosis, mental health struggle, or physical disability violates California Government Code § 12940(a) and constitutes wrongful termination.`)
        },
        {
          question: `Can My Employer Retaliate Against Me for Requesting a Reasonable Accommodation?`,
          answer: faqP(`No. Requesting a disability accommodation is a protected legal activity under California Government Code § 12940(m)(2).`) +
            `\n\n` +
            faqP(`Under <strong>Senate Bill 497</strong>, if an employer disciplines or fires a worker within <strong>90 days</strong> of an accommodation request, retaliation is legally presumed.`)
        },
        {
          question: `What Evidence Do I Need to Prove a Disability Discrimination Case?`,
          answer: faqP(`Key evidence in disability discrimination claims includes:`) +
            `\n\n` +
            faqUl([
              `<strong>Doctor's Work Restriction Notes</strong>: Proof of requested medical accommodations provided to HR.`,
              `<strong>Written Accommodation Requests</strong>: Emails or letters formally requesting adjustments or leave.`,
              `<strong>Employer Responses</strong>: Emails showing delays, dismissive attitudes, or outright denials by management.`,
              `<strong>Timeline Evidence</strong>: Showing sudden negative reviews appearing only after disability disclosure.`
            ])
        },
        {
          question: `What Is the Employer's Duty to Engage in a Timely, Good-Faith Interactive Process?`,
          answer: faqP(`Under California Government Code § 12940(n), it is a separate, independent legal violation for an employer to fail to engage in a <strong>timely, good-faith interactive process</strong> with an employee needing accommodation. An employer cannot simply say "no" without meaningful dialogue.`)
        },
        {
          question: `Do I Have to Disclose My Entire Medical History to HR to Get an Accommodation?`,
          answer: faqP(`No. You only need to provide medical documentation confirming the existence of functional limitations and recommended workplace accommodations. You are not required to disclose private medical records or full diagnostic histories.`) +
            `\n\n` +
            buildImmediateActionStepsHtml()
        },
        {
          question: `How Long Do I Have to File a Disability Discrimination Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `What Damages Can I Recover in a California Disability Discrimination Lawsuit?`,
          answer: faqP(`Damages include full back pay, future lost earnings (front pay), substantial emotional distress compensation, punitive damages under Civil Code § 3294, and statutory attorney fee recovery under Gov Code § 12965(b).`) +
            ctaBlock
        }
      ];

    case "family_medical_leave":
      return [
        {
          question: `What Are My Family and Medical Leave Rights Under CFRA and FMLA in California?`,
          answer: faqP(`Under the California Family Rights Act (CFRA, <a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Gov Code § 12945.2</span></a>) and federal FMLA, eligible employees have the right to take up to <strong>12 weeks of job-protected leave</strong> per year for their own serious health condition, to care for a family member, or to bond with a new child.`) +
            `\n\n` +
            faqP(`In California, CFRA applies to all employers with <strong>5 or more employees</strong> (compared to 50 under federal FMLA), dramatically expanding leave rights for California workers.`)
        },
        {
          question: `What Are Common Examples of Family and Medical Leave Violations at Work?`,
          answer: faqP(`Common violations of CFRA and FMLA include:`) +
            `\n\n` +
            faqUl([
              `<strong>Denying Eligible Leave</strong>: Refusing leave to an employee who meets statutory criteria.`,
              `<strong>Firing During or After Leave</strong>: Replacing or discharging an employee while out on approved medical leave.`,
              `<strong>Counting Leave as Absences</strong>: Using protected leave days to justify disciplinary action or attendance write-ups.`,
              `<strong>Demoting Upon Return</strong>: Failing to reinstate the worker to the same or virtually identical position.`
            ])
        },
        {
          question: `Can I Sue My Employer for Denying or Interfering With Protected Medical Leave?`,
          answer: faqP(`Yes. Under CFRA and FMLA, employers cannot interfere with, restrain, or deny the exercise of family or medical leave rights. Violations give rise to immediate civil claims for lost wages, benefits, and statutory damages.`)
        },
        {
          question: `Can My Employer Fire Me While I Am Out on Approved CFRA or FMLA Leave?`,
          answer: faqP(`No. CFRA specifically guarantees the right to reinstatement. Terminating a worker on leave or upon their return is unlawful unless the employer can prove by clear evidence that the worker would have been laid off regardless of taking leave.`)
        },
        {
          question: `Can My Employer Retaliate Against Me for Requesting or Taking Medical Leave?`,
          answer: faqP(`No. Retaliating against an employee for exercising CFRA rights violates California Government Code § 12945.2(k).`) +
            `\n\n` +
            faqP(`Under <strong>Senate Bill 497</strong>, any disciplinary action or firing within <strong>90 days</strong> of requesting or returning from leave creates a statutory presumption of unlawful retaliation.`)
        },
        {
          question: `What Evidence Do I Need to Prove an FMLA or CFRA Leave Violation?`,
          answer: faqP(`Essential evidence includes your written leave request, medical certifications submitted to HR, employer approval or denial letters, paystubs confirming 1,250 hours worked, and communications showing employer hostility toward your leave.`)
        },
        {
          question: `What Is the Difference Between CFRA Leave and Pregnancy Disability Leave (PDL)?`,
          answer: faqP(`Under California's Pregnancy Disability Leave law (PDL, Gov Code § 12945), employees disabled by pregnancy or childbirth can take up to <strong>4 months (17.3 weeks)</strong> of protected leave. Importantly, PDL is separate from and in addition to 12 weeks of CFRA baby bonding leave.`)
        },
        {
          question: `Can My Employer Force Me to Take Paid Vacation or Sick Time Instead of CFRA Leave?`,
          answer: faqP(`An employer cannot force an employee to exhaust all accrued vacation before beginning unpaid CFRA leave unless specific statutory exceptions apply.`) +
            `\n\n` +
            buildImmediateActionStepsHtml()
        },
        {
          question: `How Long Do I Have to File a Family and Medical Leave Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `What Compensation Can I Recover for a Medical Leave Violation in California?`,
          answer: faqP(`Remedies include back pay, front pay, value of lost healthcare benefits, emotional distress damages, punitive damages under Civil Code § 3294, and full attorney fee recovery under Government Code § 12965(b).`) +
            ctaBlock
        }
      ];

    case "workplace_retaliation":
      return [
        {
          question: `What Qualifies as Unlawful Workplace Retaliation Under California Law?`,
          answer: faqP(`Workplace retaliation occurs when an employer penalizes an employee for engaging in legally protected activity—such as reporting harassment, opposing discrimination, reporting safety violations, or filing a wage claim.`) +
            `\n\n` +
            faqP(`Under California Labor Code § 1102.5 and FEHA Gov Code § 12940(h), adverse actions include not only firing, but also demotion, pay reductions, unfavorable shift changes, unwarranted disciplinary write-ups, or intense workplace hostility.`)
        },
        {
          question: `What Are Common Examples of Retaliation by California Employers?`,
          answer: faqP(`Retaliation often follows a predictable playbook in California companies:`) +
            `\n\n` +
            faqUl([
              `<strong>Sudden Bogus Write-Ups</strong>: Issuing disciplinary warnings or PIPs within days or weeks of an internal complaint.`,
              `<strong>Schedule & Pay Slashing</strong>: Cutting an hourly worker's shifts or reassigning them to undesirable hours.`,
              `<strong>Exclusion and Ostracization</strong>: Excluding the employee from key meetings, projects, or training required for advancement.`,
              `<strong>Constructive Discharge</strong>: Making work conditions so intolerable that the employee is forced to resign.`
            ])
        },
        {
          question: `Can I Sue My Employer for Retaliation in ${city}?`,
          answer: faqP(`Yes. Retaliation claims are among the strongest employment claims in California because jurors understand that punishing an honest worker for speaking up is fundamentally unjust. You can sue in California Superior Court for all damages.`)
        },
        {
          question: `Can My Employer Fire Me for Reporting Misconduct or Cooperating in an Investigation?`,
          answer: faqP(`No. Whistleblowing under California Labor Code § 1102.5 and participating as a witness in an internal or government investigation are strictly protected by state law.`)
        },
        {
          question: `What Is California's 90-Day Retaliation Presumption Under Senate Bill 497?`,
          answer: faqP(`Effective January 1, 2024, California Senate Bill 497 amended <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://leginfo.legislature.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Labor Code § 98.6</span></a> and § 1102.5 to establish that if an employer takes adverse action within <strong>90 days</strong> of protected conduct, retaliation is legally presumed.`) +
            `\n\n` +
            faqP(`Under the California Supreme Court's ruling in <em>Lawson v. PPG Architectural Finishes, Inc.</em> (2022), the employee only needs to show that protected activity was a contributing factor. The employer must then prove by clear and convincing evidence that it would have made the same decision anyway.`)
        },
        {
          question: `What Evidence Do I Need to Prove Unlawful Workplace Retaliation?`,
          answer: faqP(`Crucial evidence includes proof of the initial protected complaint (emails, texts, formal reports), proof of the adverse action, documentation of suspicious timing, and evidence showing you were treated differently than coworkers who did not complain.`)
        },
        {
          question: `Can I Have a Retaliation Claim Even If the Underlying Complaint Was Not Proven?`,
          answer: faqP(`Yes! This is a critical legal rule. You do not need to prove that the underlying discrimination or wage issue was illegal, as long as you had a reasonable, good-faith belief that you were reporting unlawful conduct.`)
        },
        {
          question: `What If My Employer Fabricated Bogus Disciplinary Reviews After I Complained?`,
          answer: faqP(`Fabricated paper trails are standard corporate defense tactics. In litigation, your attorney will subpoena previous evaluations, cross-examine managers, and demonstrate that the sudden critiques were a pretext to conceal retaliatory motives.`) +
            `\n\n` +
            buildImmediateActionStepsHtml()
        },
        {
          question: `How Long Do I Have to File a Workplace Retaliation Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `How Much Is a Workplace Retaliation Case Worth in California?`,
          answer: faqP(`Retaliation cases often command substantial verdicts. Recoverable compensation includes lost past and future wages, emotional distress, civil penalties of up to $10,000 per violation under Labor Code § 1102.5, punitive damages, and full attorney fee reimbursement.`) +
            ctaBlock
        }
      ];

    case "wrongful_termination":
    default:
      return [
        {
          question: `What Counts as Wrongful Termination Under California Law?`,
          answer: faqP(`California is an "at-will" employment state, meaning an employer can generally end employment for any reason—as long as the reason is not illegal (<a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California Civil Rights Department</span></a>). A termination becomes wrongful when it violates statutory law, public policy, or an employment agreement.`) +
            `\n\n` +
            faqP(`The most common illegal grounds for termination include discrimination based on protected classes, retaliation for exercising legal rights, whistleblowing under Labor Code § 1102.5, taking protected medical leave under CFRA/FMLA, and violations of California's <em>Tameny</em> public policy doctrine.`)
        },
        {
          question: `If California Is an At-Will Employment State, Can My Employer Fire Me for Any Reason?`,
          answer: faqP(`Almost—but at-will is not a license to fire someone illegally. Your employer does not need a good reason to fire you, but they cannot fire you for an illegal reason.`) +
            `\n\n` +
            faqUl([
              `The firing cannot violate anti-discrimination laws (FEHA and Title VII).`,
              `The firing cannot be retaliation for reporting illegal conduct or wage violations.`,
              `The firing cannot violate public policy under the Tameny doctrine.`,
              `A written, oral, or implied contract may limit the employer's right to discharge without good cause.`,
              `The firing cannot penalize you for taking protected medical or pregnancy leave.`
            ])
        },
        {
          question: `What Are the Most Common Legal Exceptions to At-Will Employment in California?`,
          answer: faqP(`The primary exceptions to at-will employment include statutory civil rights protections under FEHA, whistleblower protections under Labor Code § 1102.5, workers' compensation protections under Labor Code § 132a, and public policy claims when fired for refusing to break the law.`)
        },
        {
          question: `Can I Sue for Wrongful Termination If I Was Forced to Quit (Constructive Discharge)?`,
          answer: faqP(`Yes. California recognizes "constructive discharge" when an employer intentionally creates or permits working conditions so intolerable that any reasonable person would feel forced to resign.`) +
            `\n\n` +
            faqP(`In the eyes of California law, a constructive discharge is treated the same as a formal firing, entitling you to full lost wage and emotional distress damages.`)
        },
        {
          question: `Can My Employer Retaliate Against Me With Termination for Exercising My Rights?`,
          answer: faqP(`No. Firing a worker for asserting workplace rights is illegal retaliation. Under <strong>California Senate Bill 497</strong>, any termination occurring within <strong>90 days</strong> of protected activity is legally presumed to be retaliatory.`)
        },
        {
          question: `What Evidence Do I Need to Prove a Wrongful Termination Lawsuit?`,
          answer: faqP(`The employee bears the initial burden of proving unlawful motivation. Key evidence includes:`) +
            `\n\n` +
            faqUl([
              `<strong>Personnel Records</strong>: Past positive performance reviews contradicting the employer's stated reason.`,
              `<strong>Inconsistent Explanations</strong>: Evidence that the employer changed its story over time regarding why you were let go.`,
              `<strong>Digital Communications</strong>: Emails, text messages, or Slack logs showing discriminatory bias or retaliatory intent.`,
              `<strong>Comparator Evidence</strong>: Proving that other employees who engaged in similar conduct were not fired.`
            ])
        },
        {
          question: `Can I Still Collect Unemployment Benefits (EDD) If I Was Fired?`,
          answer: faqP(`Yes, in most cases. Being terminated does not disqualify you from unemployment insurance unless you were fired for gross misconduct connected to your work (<a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://edd.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California EDD</span></a>). A wrongful termination is not legal misconduct, so you should apply promptly.`)
        },
        {
          question: `What Steps Should I Take Immediately After Being Wrongfully Terminated?`,
          answer: buildImmediateActionStepsHtml()
        },
        {
          question: `How Long Do I Have to File a Wrongful Termination Claim in California?`,
          answer: buildStatutoryDeadlineTableHtml(city)
        },
        {
          question: `What Damages Can I Recover in a Wrongful Termination Lawsuit?`,
          answer: faqP(`California wrongful termination damages include past lost earnings (back pay), future lost earning capacity (front pay), lost health insurance and benefits, severe emotional distress compensation, punitive damages under Civil Code § 3294, and statutory attorney fees.`) +
            ctaBlock
        }
      ];
  }
}


// -----------------------------------------------------------------------------
// TOPIC 1: RACE DISCRIMINATION
// -----------------------------------------------------------------------------
function buildRaceDiscriminationContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Race Discrimination Employment Lawyers - Workplace Bias`;
  const servicesHeading = `What Qualifies as Race Discrimination in the Workplace in California?`;
  const servicesSubHeading = `Holding California Employers Accountable Under FEHA and Federal Civil Rights Laws`;

  const servicesContent = `
When workers in ${resolvedCity} go to their jobs every morning, they have the absolute legal right to be judged solely on their performance, qualifications, and dedication. They should never have their careers derailed, their pay suppressed, or their daily dignity stripped away because of the color of their skin, their ancestral background, or their ethnic heritage.

Yet across California industries, race discrimination remains one of the most pervasive, damaging, and insidious violations of workplace rights. It appears in corporate boardrooms, creative entertainment studios, manufacturing plants, logistics hubs, retail stores, tech campuses, and healthcare networks throughout ${resolvedCity}.

<h3 class="h3dav">What qualifies as unlawful racial bias under California law?</h3>

Race discrimination in the workplace does not always look like an overt racial slur carved into a workstation or an explicit admission by human resources. In modern California workplaces, discrimination is frequently subtle, institutional, coded, and masked behind corporate jargon.

Under the California Fair Employment and Housing Act (FEHA), codified at California Government Code § 12940(a), it is unlawful for an employer to refuse to hire, discharge from employment, demote, cut the pay of, or otherwise discriminate against any person in compensation or in terms, conditions, or privileges of employment because of race, religious creed, color, national origin, ancestry, physical disability, mental disability, medical condition, genetic information, marital status, sex, gender, gender identity, gender expression, age, sexual orientation, or military and veteran status.

Under FEHA, racial discrimination generally falls into two foundational legal doctrines:
<ul>
  <li><strong>Disparate Treatment</strong>: When an employer intentionally treats an employee or job applicant less favorably than similarly situated colleagues specifically because of their race, skin color, ancestry, or national origin.</li>
  <li><strong>Disparate Impact</strong>: When an employer implements facially neutral policies or operational practices that fall with disproportionate harshness on a particular racial or ethnic group and cannot be justified by strict business necessity.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Experiencing racial harassment, slurs, or systemic bias at work in ${resolvedCity}? That is not just unfair - it is illegal under California law. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> to schedule a confidential case evaluation.</strong></em></p>

<h2 class="h2dav">How does racial discrimination manifest in California workplaces?</h2>

Racial bias distorts every stage of the employment relationship. In our litigation practice at Atoyan Law Firm, we see employers deploy countless deceptive tactics to marginalize employees of color while maintaining a veneer of professional compliance.

<h3 class="h3dav">1. Discriminatory Hiring, Assignment, and Channeling</h3>
Racial discrimination often begins before a worker even clocks in for their first shift. Qualified minority candidates are routinely steered away from high-visibility, customer-facing, or executive leadership roles and pushed into low-wage backroom positions. In ${resolvedCity}, this takes the form of subjective interview scoring where white applicants are praised for "cultural fit" while minority candidates with superior credentials are rejected without explanation.

<h3 class="h3dav">2. Pay Disparities and Unequal Compensation</h3>
Under the California Equal Pay Act (Labor Code § 1197.5), employers are strictly prohibited from paying employees of different races or ethnicities unequal wage rates for substantially similar work, when viewed as a composite of skill, effort, and responsibility. For example, paying a Black or Latino specialist $28 per hour while paying a white colleague $36 per hour for substantially similar job duties is an actionable violation yielding back pay, interest, and liquidated damages.

<h3 class="h3dav">3. Denied Promotions and the "Glass Ceiling"</h3>
You work late. You exceed all documented performance metrics. You mentor incoming staff and receive praise from clients. Yet whenever a senior management or supervisory opening appears, the promotion is handed to a less-experienced colleague behind closed doors. When you inquire why you were passed over, management offers shifting, subjective excuses: "You need more executive presence," "The other candidate was a better personality match," or "Your time is coming soon." That is not honest feedback. That is discriminatory pretext.

<h3 class="h3dav">4. Hostile Work Environment and Racial Harassment</h3>
Under California Government Code § 12940(j), employers are legally obligated to take all reasonable steps necessary to prevent harassment from occurring. A racially hostile work environment is created when unwelcome conduct based on race is severe or pervasive enough to alter the conditions of employment and create an intimidating, hostile, abusive, or offensive work environment.
Examples of actionable racial harassment include:
<ul>
  <li>Racial slurs, offensive epithets, derogatory comments, or racially charged jokes told in breakrooms, emails, or company messaging channels.</li>
  <li>Displaying racist symbols, memes, imagery, or graffiti on company property.</li>
  <li>Stereotyping an employee's intellect, work ethic, communication style, or emotional demeanor based on their racial background.</li>
  <li>Microaggressions designed to demean, undermine, isolate, or humiliate an employee in front of their colleagues and subordinates.</li>
  <li>Targeted hyper-scrutiny where supervisors closely police the arrival times, breaks, phone usage, or email drafts of minority employees while ignoring the identical conduct of white workers.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your employer ignore your complaints about racial slurs or workplace harassment? California law holds companies strictly liable when leadership fails to protect you. Atoyan Law Firm fights for California workers. Call <a href="tel:8888070077">(888) 807-0077</a> today.</strong></em></p>

<h2 class="h2dav">Can an employer enforce grooming codes against natural hair or braids?</h2>

California made civil rights history by enacting the CROWN Act (Senate Bill 188), which amended FEHA to explicitly clarify that the legal definition of race includes traits historically associated with race, including hair texture and protective hairstyles.

Under California law, an employer cannot legally enforce dress codes, grooming standards, or appearance guidelines that ban, restrict, or penalize:
<ul>
  <li>Afros, braids, twists, and cornrows</li>
  <li>Locs and dreadlocks</li>
  <li>Bantu knots and other natural or protective styling</li>
</ul>
Telling an employee their hair is "unprofessional," "too distracting," or "not client-ready" is racial discrimination under California Government Code § 12926(w).

<h2 class="h2dav">How do California employers disguise racial discrimination behind pretext?</h2>

California employers rarely announce their racial prejudice in writing. Instead, corporate human resources departments and defense attorneys construct elaborate paper trails to create a pretextual defense under the burden-shifting framework established in <em>McDonnell Douglas Corp. v. Green</em> and adopted by California in <em>Guz v. Bechtel National, Inc.</em> (2000).

When an employer decides to terminate or sideline an employee of color, it frequently engages in classic pretextual maneuvers:
<ul>
  <li><strong>The Sudden Performance Plunge</strong>: An employee with years of glowing reviews, salary increases, and commendations suddenly receives an unprecedented negative evaluation or is placed on a 30-day Performance Improvement Plan (PIP) containing vague, subjective benchmarks designed to ensure failure.</li>
  <li><strong>The Manufactured "Restructuring"</strong>: The company announces a reorganization or "reduction in force" (RIF) that conveniently eliminates only minority-held roles, only to rehire younger, non-minority workers for identical positions under modified job titles weeks later.</li>
  <li><strong>Selective Policy Enforcement</strong>: Strictly penalizing an employee of color for minor infractions (such as clocking in three minutes late or taking an extended lunch) while white colleagues who commit identical or worse infractions face zero consequences.</li>
</ul>

<h2 class="h2dav">Can an employer retaliate against me for reporting racial discrimination?</h2>

No. California law provides some of the strongest anti-retaliation protections in the nation under Government Code § 12940(h) and California Labor Code § 1102.5. An employer cannot legally terminate, demote, cut the hours of, transfer, or harass any employee because they:
<ul>
  <li>Reported racial discrimination, harassment, or microaggressions to HR, a supervisor, or an executive.</li>
  <li>Participated as a witness in an internal or external investigation.</li>
  <li>Filed a complaint with the California Civil Rights Department (CRD) or EEOC.</li>
  <li>Opposed discriminatory hiring, promotion, or compensation policies.</li>
</ul>

Under <strong>California Senate Bill 497 (effective January 1, 2024)</strong>, if an employer takes an adverse action against a worker within <strong>90 days</strong> of the worker engaging in protected activity, California law establishes a <strong>rebuttable presumption of retaliation</strong> under Labor Code §§ 98.6 and 1102.5. The legal burden immediately flips to the employer to prove by clear and convincing evidence that its actions were completely untainted by retaliatory motives.

<h2 class="h2dav">Can undocumented workers file race discrimination claims under California law?</h2>

Yes. Under <strong>California Labor Code § 1171.5</strong>, all civil rights, statutory protections, and legal remedies available under California law apply to every worker regardless of immigration status. Employers cannot threaten to contact ICE or weaponize immigration status to silence victims of racial discrimination. In fact, doing so constitutes criminal extortion and aggravated civil retaliation under California Labor Code § 244.

<h2 class="h2dav">What immediate steps should you take if you experience race discrimination in ${resolvedCity}?</h2>

Building a formidable race discrimination case requires strategic action from the moment you suspect unlawful bias:
<ol>
  <li><strong>Document Every Incident Contemporaneously</strong>: Maintain a detailed personal record of dates, times, exact statements, discriminatory remarks, and witnesses present. Store this outside of company systems (on a personal device).</li>
  <li><strong>Preserve Communications and Comparator Data</strong>: Safely retain personal copies of your performance reviews, emails, commendations, text messages, and publicly visible coworker salary/promotion announcements that demonstrate unequal treatment.</li>
  <li><strong>Report the Conduct in Writing</strong>: Submit a formal, professional written complaint to human resources or senior management detailing the racial bias. This establishes undeniable legal notice and triggers the employer's statutory duty to investigate under Gov Code § 12940(k).</li>
  <li><strong>Do Not Sign Severance or Releases Prematurely</strong>: Employers often try to push departing workers into signing broad releases of civil rights claims in exchange for a few weeks of severance pay. Have an experienced employment attorney review all severance agreements before signing.</li>
  <li><strong>Consult an Experienced Employment Attorney</strong>: California imposes strict filing deadlines. An attorney will guide you through filing with the CRD, obtaining an immediate Right-to-Sue notice, and demanding maximum financial recovery.</li>
</ol>


${buildEvidentiaryDeepDive("Race Discrimination", resolvedCity)}

${buildCorporateDefensePlaybook("Race Discrimination", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Race Discrimination", resolvedCity)}

${buildAdministrativeRoadmap("Race Discrimination", resolvedCity)}

${buildIndustryScenarios("Race Discrimination", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Race Discrimination Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Investigate and uncover hidden comparator evidence</strong>. Proving racial bias requires showing that white employees were treated more favorably. Atoyan Law subpoenas corporate personnel files, salary histories, and promotional data to demonstrate systemic bias.

<strong>Neutralize employer pretext</strong>. When companies claim a termination was based on "restructuring" or "poor performance," we dismantle their excuses by highlighting years of positive reviews and exposing shifting corporate explanations.

<strong>Hold corporate decision-makers personally accountable</strong>. Under California Government Code § 12940(j)(3), individual supervisors and harassers can be held personally liable for workplace harassment, ensuring complete accountability.

<strong>Maximize your financial compensation</strong>. From lost past and future earnings to substantial emotional distress and punitive damages under California Civil Code § 3294, we demand the full measure of justice you deserve.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Race Discrimination Claim?`;
  const compensationIntro = `
You have the right to work in an environment where your skills and labor are respected, free from the indignity of racial prejudice. You have the right to equal pay, fair promotions, and a workplace free from racial hostility. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report discrimination</a> without fearing retaliatory termination from your employer.

Racial discrimination inflicts deep financial, professional, and psychological harm on workers and their families. California law provides powerful civil remedies to right these wrongs. If you experienced racial discrimination or harassment in ${resolvedCity}, contact Atoyan Law. We provide confidential, compassionate, and aggressive legal representation. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} race discrimination lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("race_discrimination", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Race Discrimination Lawyer | Atoyan Law`,
    yoastMetaDesc: `Top-rated ${resolvedCity} race discrimination attorney fighting for employees facing workplace bias, harassment, and wrongful termination. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} race discrimination`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 2: WAGE THEFT & OVERTIME
// -----------------------------------------------------------------------------
function buildWageTheftContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Wage Theft Employment Lawyers - Unpaid Wages & Overtime`;
  const servicesHeading = `What Qualifies as Wage Theft and Overtime Violations in California?`;
  const servicesSubHeading = `Recovering Unpaid Wages, Overtime Premiums, and Statutory Penalties Under the Labor Code`;

  const servicesContent = `
Working extra hours should mean getting paid for those hours. In California, overtime rules are stronger than federal law in several important ways. Yet many employees in ${resolvedCity} work long shifts without receiving the overtime pay they have earned. Every employee in ${resolvedCity} who trades their time, labor, and energy deserves to be paid every single dollar they have legally earned. California maintains some of the most robust, worker-protective wage and hour laws in the United States, designed to guarantee daily overtime, weekly overtime, mandatory meal and rest premiums, and complete transparency on paychecks.

Yet wage theft remains the single largest category of economic theft in California, stealing billions of dollars annually from hardworking employees across ${resolvedCity}. Employers in hospitality, construction, healthcare, warehousing, logistics, technology, retail, and corporate services routinely engage in deliberate payroll manipulation to pad their bottom lines at the expense of their workforce.

<h3 class="h3dav">What Exactly Constitutes Wage Theft in California?</h3>

Wage theft is not limited to an employer outright refusing to hand you your paycheck. Under California Labor Code provisions and Industrial Welfare Commission (IWC) Wage Orders, wage theft encompasses any unlawful practice by an employer that deprives an employee of their rightfully earned wages, premiums, or statutory entitlements.

Common manifestations of wage theft under California law include:
<ul>
  <li><strong>Unpaid Overtime</strong>: Failing to pay 1.5 times the regular rate for hours worked beyond 8 in a workday or 40 in a workweek, and double time for hours worked beyond 12 in a workday.</li>
  <li><strong>Off-the-Clock Work</strong>: Requiring employees to perform pre-shift prep, post-shift closing duties, mandatory security checks, or travel between job sites without clocking in.</li>
  <li><strong>Misclassification as Exempt Salaried Employee</strong>: Labeling workers as "managers" or "supervisors" on a salary to evade overtime obligations when their actual daily duties are non-exempt.</li>
  <li><strong>Independent Contractor Misclassification</strong>: Improperly labeling employees as 1099 independent contractors under California's strict AB 5 "ABC Test."</li>
  <li><strong>Unpaid Minimum Wage</strong>: Failing to pay the state or local municipal minimum wage for all hours worked.</li>
  <li><strong>Waiting Time Penalties</strong>: Withholding final paychecks upon discharge or resignation in violation of California Labor Code §§ 201-203.</li>
  <li><strong>Illegal Wage Deductions and Stolen Tips</strong>: Deducting uniform costs, cash register shortages, equipment expenses, or stealing portions of customer gratuities.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your employer cheat you out of overtime, make you work off the clock, or misclassify your position in ${resolvedCity}? That is wage theft, and California law penalizes it heavily. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a>.</strong></em></p>

<h2 class="h2dav">What is overtime under California law?</h2>

Under California Labor Code § 510, California is one of the few states that enforces strict <strong>daily overtime</strong> rules alongside weekly overtime standards. Federal law only looks at hours exceeding 40 in a single week, but California protects workers on a day-by-day basis.

In California, non-exempt employees are entitled to:
<ul>
  <li><strong>Time and a Half (1.5x)</strong> for all hours worked beyond 8 hours up to and including 12 hours in any single workday.</li>
  <li><strong>Time and a Half (1.5x)</strong> for the first 8 hours worked on the seventh consecutive day of work in a single workweek.</li>
  <li><strong>Double Time (2.0x)</strong> for all hours worked beyond 12 hours in any single workday.</li>
  <li><strong>Double Time (2.0x)</strong> for all hours worked beyond 8 hours on the seventh consecutive day of work in a single workweek.</li>
</ul>

<h3 class="h3dav">When should a ${resolvedCity} employee receive time-and-a-half pay?</h3>
If your base hourly rate is $25.00 per hour, your time-and-a-half overtime rate is $37.50 per hour, and your double-time rate is $50.00 per hour. Many California employers calculate overtime based strictly on an employee's base hourly rate, which violates California law. Under Labor Code § 510 and California Supreme Court precedent in Alvarado v. Dart Container Corp., overtime must be calculated using the <strong>regular rate of pay</strong>, which includes non-discretionary bonuses, shift differentials, commissions, and piece-rate earnings. When an employer excludes bonuses from overtime calculations, every single overtime hour paid is legally underpaid.

<h2 class="h2dav">Can an employer require me to work overtime without paying me?</h2>

An employer can require a non-exempt employee to work overtime, but requiring the work does not eliminate the legal obligation to pay for it at premium rates. Some employers in ${resolvedCity} claim that because the employee did not obtain "advance written authorization" for overtime, they are not entitled to overtime pay. Under California law, an employer's internal policy cannot erase an employee's statutory right to compensation for work the employer suffered or permitted.

<h2 class="h2dav">What if my employer asks me to work off the clock?</h2>

In Troester v. Starbucks Corp. (2018), the California Supreme Court ruled that California wage law does not adopt the federal "de minimis" doctrine. In California, employers must compensate employees for <strong>all hours they are suffered or permitted to work</strong>, even if the work takes only a few minutes each day.

Working just 20 minutes a day off the clock adds up to over 1.6 hours per week, or approximately $3,600 in stolen wages every year for an employee earning $25 per hour.

Common off-the-clock violations in ${resolvedCity} include:
<ul>
  <li>Requiring employees to arrive 15 minutes before their shift to boot up computer systems, log into corporate software, or participate in morning briefings.</li>
  <li>Forcing warehouse, logistics, or retail workers to undergo mandatory bag checks and anti-theft security screenings while off the clock.</li>
  <li>Requiring workers to clean equipment, balance cash registers, lock facility doors, or secure merchandise after punching out for the evening.</li>
  <li>Contacting employees via phone, email, text message, or WhatsApp during off-duty hours to answer work inquiries or solve operational emergencies without compensation.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Were you forced to work before clocking in or after clocking out in ${resolvedCity}? In California, you are entitled to full pay plus statutory interest and penalties. Call Atoyan Law Firm at <a href="tel:8888070077">(888) 807-0077</a> for a free consultation.</strong></em></p>

<h2 class="h2dav">What if my employer says I am salaried or exempt?</h2>

One of the most widespread corporate strategies to evade overtime is misclassifying workers as "exempt." Employers assume that paying a worker a fixed salary and giving them a fancy title like "Assistant Manager" or "Lead Coordinator" automatically strips away their overtime rights.

That assumption is legally false. Under California law, an employee is only exempt if they meet both:
<ol>
  <li><strong>The Salary Basis Test</strong>: The employee must be paid a predetermined, fixed monthly salary equivalent to at least twice the California state minimum wage for full-time employment (40 hours per week).</li>
  <li><strong>The Duties Test</strong>: The employee must spend <strong>more than 50% of their working time</strong> performing true executive, administrative, or professional duties that involve the customary and regular exercise of discretion and independent judgment.</li>
</ol>
If you spend more than half your day ringing up customers, stocking shelves, making food, entering routine data, or performing manual labor, you are legally non-exempt—regardless of what your job title says or whether you signed an employment contract agreeing to a salary. You are entitled to retroactive overtime, meal and rest break premiums, and statutory penalties.

<h2 class="h2dav">What waiting time penalties apply under California Labor Code § 203?</h2>

California treats prompt final wage payment with extreme seriousness. Under California Labor Code § 201, if an employee is terminated or laid off, all earned and unpaid wages—including accrued, unused vacation or PTO—are due and payable <strong>immediately at the time of discharge</strong>. Under Labor Code § 202, if an employee quits without notice, wages are due within 72 hours; if at least 72 hours of notice is provided, wages are due on the final working day.

If an employer willfully fails to pay all earned wages within these deadlines, California Labor Code § 203 imposes substantial <strong>waiting time penalties</strong>:
<ul>
  <li>The employee's daily wage rate continues to accumulate as a penalty for every calendar day the payment is late, up to a maximum of <strong>30 calendar days</strong>.</li>
  <li>For an employee earning $25 per hour ($200 per day), waiting time penalties alone can reach up to <strong>$6,000</strong>, in addition to the underlying unpaid wages.</li>
</ul>

<h2 class="h2dav">Can undocumented workers recover unpaid overtime and wages in California?</h2>

Yes, absolutely. Under <strong>California Labor Code § 1171.5</strong>, all protections, rights, and remedies available under California labor law apply to all individuals regardless of immigration status. An employer cannot refuse to pay earned wages or overtime by claiming a worker is undocumented. Furthermore, under California Labor Code § 244, it is unlawful retaliation for an employer to report or threaten to report the immigration status of an employee or an employee's family member because the employee exercised labor rights.

<h2 class="h2dav">Wage Statements and Recordkeeping Violations: California Labor Code § 226</h2>

Under California Labor Code § 226, employers must provide accurate, itemized wage statements showing gross wages, total hours worked, all deductions, net wages, dates of the pay period, employee name, the last four digits of the SSN, and the employer's legal entity name and address.

When an employer fails to provide accurate pay stubs—or fails to record all hours worked—employees can recover up to $4,000 in statutory penalties under Labor Code § 226(e), plus reasonable attorney fees.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your employer fail to pay your final wages on time or give you inaccurate pay stubs? You could be owed thousands in California statutory penalties. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> today.</strong></em></p>

<h2 class="h2dav">How does an employee recover unpaid wages through the DLSE or California court?</h2>

When you have been victimized by wage theft, you have two primary legal avenues in California:
<ol>
  <li><strong>Filing a Wage Claim with the California Labor Commissioner (DLSE)</strong>: A state administrative process before a hearing officer.</li>
  <li><strong>Filing a Civil Lawsuit in Court</strong>: Litigating directly in California Superior Court, which allows you to pursue broad discovery, subpoena company payroll software records, add individual managers who violated the law under Labor Code § 558.1, and pursue Private Attorneys General Act (PAGA) representative claims.</li>
</ol>

At Atoyan Law Firm, we evaluate the full scope of your unpaid wage history. We analyze timesheets, POS records, GPS telematics, keycard swipes, and paystubs to build an ironclad accounting of every unpaid minute, overtime premium, and statutory penalty owed to you.


${buildEvidentiaryDeepDive("Wage Theft and Overtime Violations", resolvedCity)}

${buildCorporateDefensePlaybook("Wage Theft and Overtime Violations", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Wage Theft and Overtime Violations", resolvedCity)}

${buildAdministrativeRoadmap("Wage Theft and Overtime Violations", resolvedCity)}

${buildIndustryScenarios("Wage Theft and Overtime Violations", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Wage Theft and Overtime Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Gather and preserve your personal time records</strong>. Do not rely exclusively on your employer's electronic timekeeping portal, which management can edit or lock you out of upon termination. Keep photographs of your paper timesheets, punch logs, Google location history, and work schedules.

<strong>Save every itemized wage statement and paystub</strong>. Under California Labor Code § 226, paystubs are vital legal evidence. An attorney can examine them to uncover hidden overtime miscalculations, unlisted hours, and illegal payroll deductions.

<strong>Do not sign any severance or release of wage claims</strong>. Under California Labor Code § 206.5, it is a misdemeanor for an employer to require an employee to execute a release of claims for wages that are concededly due unless full payment has been made.

<strong>Let Atoyan Law Firm calculate your full damages</strong>. Many employees assume they are only owed a few hundred dollars, only to discover that statutory interest, waiting time penalties, meal break premiums, and liquidated damages push their total recovery into tens or hundreds of thousands of dollars.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Wage Theft Claim?`;
  const compensationIntro = `
You have the right to be paid every cent you have earned through your hard work and labor. You have the right to accurate overtime rates, complete wage statements, and prompt final paychecks. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report discrimination</a> and wage violations without facing retaliatory termination or harassment from management.

Wage theft takes a devastating toll on your household. It strains your ability to pay rent, afford healthcare, provide for your children, and plan for your future. But California labor law provides severe financial penalties against employers who cheat their workers. If your employer withheld your wages, cheated your overtime, or misclassified your job in ${resolvedCity}, call us. Atoyan Law offers confidential, no-pressure legal consultations. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} wage theft lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("wage_theft", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Wage Theft & Overtime Lawyer | Atoyan Law`,
    yoastMetaDesc: `Experienced ${resolvedCity} wage theft attorney fighting for unpaid overtime, off-the-clock pay, misclassification & waiting time penalties. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} wage theft`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 3: MEAL & REST BREAKS
// -----------------------------------------------------------------------------
function buildMealBreaksContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Meal and Rest Break Employment Lawyers - Labor Violations`;
  const servicesHeading = `What Are Your Rights Regarding Meal and Rest Breaks Under California Labor Law?`;
  const servicesSubHeading = `Enforcing California Labor Code § 226.7 and IWC Wage Order Premium Protections`;

  const servicesContent = `
In the fast-paced, high-pressure working environments of ${resolvedCity}, employees frequently find themselves running on empty. Shifts get busy, understaffing creates chaos, supervisors bark orders, and scheduled lunch breaks evaporate into thin air. Many workers are forced to eat a sandwich at their desk while answering phones, while others have their 10-minute rest breaks canceled altogether.

If this sounds familiar, your employer is violating California law. California has the strictest, most comprehensive meal and rest period requirements in the United States. These laws are not mere suggestions or optional guidelines; they are mandatory public health and safety protections embedded in the California Labor Code and Industrial Welfare Commission (IWC) Wage Orders.

<h3 class="h3dav">What is the fundamental California meal break rule under Labor Code § 512?</h3>

Under California Labor Code § 512 and the applicable IWC Wage Orders, non-exempt employees in ${resolvedCity} have explicit, legally protected rights to uninterrupted meal periods:
<ul>
  <li><strong>First Meal Break</strong>: An employer must provide an uninterrupted, 30-minute meal break if an employee works more than <strong>5 hours</strong> in a workday. The meal break must begin before the end of the employee's fifth hour of work.</li>
  <li><strong>Second Meal Break</strong>: If an employee works more than <strong>10 hours</strong> in a workday, the employer must provide a second uninterrupted 30-minute meal break. This second break must begin before the end of the employee's tenth hour of work.</li>
  <li><strong>Waivers</strong>: If a work shift does not exceed 6 hours, the meal break may be waived by mutual consent of the employer and employee. If a shift does not exceed 12 hours, the second meal break may be waived only if the first was taken.</li>
</ul>

<h3 class="h3dav">What constitutes a legal meal break under the Brinker standard?</h3>
In the landmark case Brinker Restaurant Corp. v. Superior Court (2012), the California Supreme Court established that an employer satisfies its legal obligation to provide a meal break only when:
<ol>
  <li>It relieves the employee of <strong>all duty</strong> for the entire 30-minute duration.</li>
  <li>It relinquishes control over the employee's activities.</li>
  <li>It permits the employee a reasonable opportunity to take an uninterrupted 30-minute break.</li>
  <li>It does not impede, discourage, or pressure the employee from taking their break.</li>
</ol>
If you are required to monitor a radio, answer client calls, remain on company premises, or sit at your workstation during your 30 minutes, your meal break is <strong>on-duty</strong> and illegal.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Were your meal or rest breaks interrupted, delayed, or denied by your employer in ${resolvedCity}? Under California law, you are owed a full hour of premium pay for every day this occurred. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a>.</strong></em></p>

<h2 class="h2dav">When should a ${resolvedCity} employee receive paid 10-minute rest breaks?</h2>

Under California IWC Wage Orders, every non-exempt employee is entitled to paid, 10-minute rest breaks based on the total hours worked each day:
<ul>
  <li>Employees are entitled to <strong>10 consecutive minutes</strong> of net rest time for every 4 hours of work or major fraction thereof.</li>
  <li>If an employee works between 3.5 and 6 hours, they are entitled to one 10-minute rest break.</li>
  <li>If an employee works between 6 and 10 hours, they are entitled to two 10-minute rest breaks.</li>
  <li>If an employee works between 10 and 14 hours, they are entitled to three 10-minute rest breaks.</li>
</ul>

Rest breaks must be counted as hours worked, meaning an employer cannot deduct pay for rest breaks. Furthermore, under Augustus v. ABM Security Services, Inc. (2016), the California Supreme Court ruled that rest breaks must be <strong>completely duty-free</strong>. Employers cannot require workers to remain on-call, carry pagers, or stay on company premises during their 10-minute rest breaks.

<h2 class="h2dav">What is the one-hour premium pay remedy under California Labor Code § 226.7?</h2>

California law does not just reprimand employers who violate break rules; it provides a powerful statutory financial remedy directly to the employee.

Under California Labor Code § 226.7:
<ul>
  <li>If an employer fails to provide a compliant meal break, the employer must pay the employee <strong>one additional hour of pay at the employee's regular rate</strong> for each workday that the meal break is not provided.</li>
  <li>If an employer fails to provide a compliant rest break, the employer must pay the employee <strong>one additional hour of pay at the employee's regular rate</strong> for each workday that the rest break is not provided.</li>
  <li>An employee can recover <strong>up to two hours of premium pay per day</strong> (one for a meal break violation and one for a rest break violation).</li>
</ul>

Over months or years of continuous employment, these statutory premium payments accumulate into substantial sums. For an employee earning $22 per hour who misses both a meal break and a rest break each day, the employer owes $44 per day in statutory premiums. That equals $220 weekly and over <strong>$11,000 across a single year</strong>, before adding statutory interest, waiting time penalties under Labor Code § 203, and attorney fees.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your supervisor pressure you to skip lunch or cut your rest breaks short? Atoyan Law Firm recovers unpaid break premiums for California workers. Call <a href="tel:8888070077">(888) 807-0077</a> for a confidential case evaluation.</strong></em></p>

<h2 class="h2dav">What deceptive tactics do employers use to evade break violations?</h2>

Employers in ${resolvedCity} use various deceptive methods to hide meal and rest break non-compliance:
<ul>
  <li><strong>Auto-Deductions on Timesheets</strong>: Payroll software automatically deducts 30 minutes from an employee's timecard every day, even when the employee worked straight through lunch without taking a break.</li>
  <li><strong>Unrealistic Workloads and Understaffing</strong>: Management tells employees they are "allowed" to take breaks, but assigns such crushing workloads that taking a break results in missed deadlines, disciplinary warnings, or lost client commissions.</li>
  <li><strong>The "On-Premises" Restriction</strong>: Forcing workers to remain in the breakroom or facility parking lot during their 30-minute lunch break, destroying their freedom to leave the premises.</li>
  <li><strong>Late Lunch Scheduling</strong>: Forcing workers to take their first meal break after 6, 7, or 8 hours on shift, directly violating the 5-hour statutory deadline.</li>
  <li><strong>Interrupted Breaks</strong>: Paging an employee, having a supervisor ask questions, or requiring them to assist a customer five minutes into their break without restarting the full 30-minute period.</li>
</ul>

<h2 class="h2dav">Must break premium pay appear on my regular wage paystubs?</h2>

In the landmark decision Naranjo v. Spectrum Security Services, Inc. (2022), the California Supreme Court established that statutory break premiums under Labor Code § 226.7 constitute "wages" for statutory reporting purposes. When an employer fails to include earned break premiums on an employee's paystub, it violates California Labor Code § 226, entitling the worker to up to $4,000 in wage statement penalties and waiting time penalties under Labor Code § 203.

<h2 class="h2dav">Can undocumented workers recover meal and rest break premiums in California?</h2>

Yes, absolutely. Under <strong>California Labor Code § 1171.5</strong>, all labor protections and remedies apply to workers in California regardless of immigration status. An employer cannot evade break penalties or wage obligations by questioning a worker's documentation. Threatening a worker's immigration status because they demanded compliant breaks is severe retaliation under Labor Code § 244.


${buildEvidentiaryDeepDive("Meal and Rest Break Violations", resolvedCity)}

${buildCorporateDefensePlaybook("Meal and Rest Break Violations", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Meal and Rest Break Violations", resolvedCity)}

${buildAdministrativeRoadmap("Meal and Rest Break Violations", resolvedCity)}

${buildIndustryScenarios("Meal and Rest Break Violations", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Meal and Rest Break Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Audit your electronic timecard history</strong>. Employers often alter punch times or delete recorded hours to make shifts appear compliant. Atoyan Law reviews timecard audit trails, keycard access logs, and POS logins to prove break deprivation.

<strong>Expose automatic meal deduction schemes</strong>. If your paycheck shows 30 minutes deducted every day while electronic logs prove you were answering emails, stocking, or serving clients, we prove systematic wage theft.

<strong>Recover up to four years of break premiums</strong>. Under California's Unfair Competition Law (Business and Professions Code § 17200), we can recover unpaid break premiums spanning back four full years from the date of filing.

<strong>Demand waiting time and wage statement penalties</strong>. In addition to premium pay, we seek penalties under Labor Code § 203 (up to 30 days of full pay) and Labor Code § 226 (up to $4,000 for inaccurate paystubs).
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Break Violation Claim?`;
  const compensationIntro = `
You have the right to take your mandatory rest and meal breaks without fear of managerial retaliation. You have the right to be paid full premium wages when breaks are denied. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report labor violations</a> without facing sudden discipline, cut hours, or termination.

Denied breaks lead to physical exhaustion, mental burnout, and workplace injuries. California law gives you powerful legal mechanisms to collect every dollar of premium pay your employer withheld. If your employer denied your meal or rest breaks in ${resolvedCity}, contact Atoyan Law. We provide aggressive, experienced representation. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} meal and rest break lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("meal_breaks", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Meal & Rest Break Lawyer | Atoyan Law`,
    yoastMetaDesc: `Aggressive ${resolvedCity} meal and rest break attorney fighting for unpaid Labor Code § 226.7 premium pay and waiting time penalties. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} meal breaks`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 4: SEXUAL HARASSMENT & HOSTILE WORK ENVIRONMENT
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// TOPIC 4B: WORKPLACE HARASSMENT & HOSTILE WORK ENVIRONMENT (NON-SEXUAL)
// -----------------------------------------------------------------------------
function buildWorkplaceHarassmentContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city || city;
  const cleanTopic = decomposed.cleanTopic || "Workplace Harassment";
  const heroTitle = `${resolvedCity} Workplace Harassment Lawyers - Hostile Work Environment Attorney`;
  const servicesHeading = `What Constitutes Workplace Harassment and Hostile Work Environment Under California Law?`;
  const servicesSubHeading = `Enforcing California FEHA Gov Code § 12940(j) and Holding Employers Accountable Across ${resolvedCity}`;

  const topicModules = getTopicEnrichmentModules("workplace_harassment", cleanTopic, resolvedCity);

  const servicesContent = `
Every worker across California is legally entitled to earn a living without enduring pervasive hostility, discriminatory slurs, or psychological abuse. Yet across corporate offices, healthcare facilities, logistics hubs, retail establishments, and local enterprises in ${resolvedCity}, unlawful workplace harassment remains a pervasive and damaging reality.

Under the California Fair Employment and Housing Act (FEHA), codified at California Government Code § 12940(j), workplace harassment based on any protected characteristic is strictly illegal. The law places an affirmative, non-delegable duty on every employer in ${resolvedCity} to maintain a work environment free from discriminatory abuse and to take all reasonable, immediate steps to stop misconduct when it occurs.

<h3 class="h3dav">Protected Characteristics Under California FEHA</h3>

California Government Code § 12940(j) extends broad protections against harassment targeting any of the following protected classes:
<ul>
  <li><strong>Race, Color, Ancestry, and National Origin</strong>: Slurs, derogatory stereotyping, mocking foreign accents, or discriminatory restrictions on natural hairstyles protected under California's CROWN Act (Gov Code § 12926(w)).</li>
  <li><strong>Physical and Mental Disability</strong>: Demeaning remarks regarding physical limitations, learning disabilities, mobility devices, clinical depression, anxiety disorders, or medical leave history.</li>
  <li><strong>Medical Condition and Genetic Information</strong>: Hostile commentary surrounding cancer diagnoses, autoimmune conditions, genetic traits, or rehabilitation.</li>
  <li><strong>Religious Creed and Observance</strong>: Mocking religious garments, derogatory slurs regarding faith, or forcing employees to attend conflicting corporate functions.</li>
  <li><strong>Age (40 and Over)</strong>: Pervasive ageist jokes, pushing senior employees toward early retirement, or hostile remarks regarding technological capabilities.</li>
  <li><strong>Sexual Orientation, Gender Identity, and Gender Expression</strong>: Deadnaming, misgendering, derogatory slurs, or abusive conduct aimed at LGBTQ+ workers.</li>
  <li><strong>Marital Status and Military/Veteran Status</strong>: Disparaging military deployment or veteran obligations.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Enduring slurs, hostile remarks, or severe harassment at your ${resolvedCity} workplace? You have enforceable rights under California FEHA. Call Atoyan Law Firm at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact our legal team online</a>.</strong></em></p>

<h2 class="h2dav">The Legal Standard: "Severe or Pervasive" Under California Senate Bill 1300</h2>

Corporate defense attorneys frequently argue that abusive workplace conduct was merely "innocuous friction," "stray remarks," or "management style." California law firmly rejects these corporate excuses.

Under <strong>California Senate Bill 1300</strong> (SB 1300, effective 2019, codifying Government Code § 12923), the California Legislature affirmed:
<ul>
  <li>An employee only needs to demonstrate that harassing conduct was severe <strong>OR</strong> pervasive. The legal standard is disjunctive, not conjunctive.</li>
  <li>A <strong>single incident of harassing conduct</strong> is legally sufficient to create a hostile work environment if the conduct has unreasonably interfered with the employee's work performance or created an intimidating, hostile, or offensive working environment.</li>
  <li>The existence of a hostile work environment must be judged based on the totality of circumstances from the perspective of a reasonable person in the plaintiff's position.</li>
  <li>Workplace harassment claims are rarely appropriate for summary judgment dismissal because the determination of whether an environment is hostile presents an issue of fact that belongs before a jury.</li>
</ul>

<h2 class="h2dav">Distinguishing Harassment from Discrimination Under Reno v. Baird</h2>

In the landmark decision <em>Reno v. Baird</em> (1998) 18 Cal.4th 640, the California Supreme Court established a vital legal distinction:
<ul>
  <li><strong>Employment Discrimination</strong>: Involves official managerial and personnel decisions—such as hiring, firing, job assignments, promotions, compensation, and performance reviews. Individual managers cannot be held personally liable for discrimination.</li>
  <li><strong>Workplace Harassment</strong>: Consists of conduct outside the necessary scope of legitimate personnel management—such as derogatory jokes, verbal insults, mocking, physical intimidation, or digital bullying.</li>
  <li><strong>Individual Personal Liability</strong>: Under California Government Code § 12940(j)(3), <strong>individual harassers can be sued directly in Superior Court and held personally liable</strong> for the damages they inflict, separate and apart from corporate employer liability.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did a supervisor or coworker subject you to hostile comments or targeted abuse in ${resolvedCity}? Harassers can be held individually liable under Gov Code § 12940(j)(3). <a href="tel:8888070077">Call (888) 807-0077</a> to speak with Atoyan Law Firm.</strong></em></p>

<h2 class="h2dav">Employer Liability: Strict Liability for Supervisors vs. Negligence for Coworkers</h2>

Under California Government Code § 12940(j)(1), employer liability is determined by the workplace hierarchy of the harasser:
<ul>
  <li><strong>Supervisor Harassment (Strict Liability)</strong>: If a supervisor, manager, lead, or corporate officer commits the harassment, the employer is <strong>strictly liable</strong>. It is legally irrelevant whether upper management knew about the conduct or had written anti-harassment policies. The company is automatically responsible for all resulting damages.</li>
  <li><strong>Coworker and Third-Party Harassment (Negligence Standard)</strong>: If the harasser is a non-supervisory coworker, client, vendor, or customer, the employer is liable if management or HR <strong>knew or should have known</strong> of the conduct and failed to take immediate and appropriate corrective action.</li>
</ul>

<h2 class="h2dav">The Standalone Claim: Failure to Prevent Harassment Under FEHA § 12940(k)</h2>

California law imposes an independent affirmative duty on every employer under Government Code § 12940(k) to "take all reasonable steps necessary to prevent harassment and discrimination from occurring."

When an employer fails to adopt clear complaint procedures, conducts a superficial or biased internal HR investigation, sweeps employee reports under the rug, fails to discipline known offenders, or fails to provide mandatory training under Assembly Bill 2053 (prevention of abusive conduct), the employer commits a standalone violation of California law that carries substantial statutory liability.

<h2 class="h2dav">Constructive Discharge: When Pervasive Hostility Forces You to Quit</h2>

Workers often ask whether they forfeit their legal claims if they resign because the workplace hostility became unbearable. Under the California Supreme Court standard in <em>Turner v. Anheuser-Busch, Inc.</em> (1994) 7 Cal.4th 1238, when an employer knowingly permits working conditions so intolerable that a reasonable person in the employee's position would be compelled to quit, the law treats the resignation as an unlawful termination, known as <strong>constructive discharge</strong>.

A constructive discharge claim allows the victim to seek full wrongful termination remedies, including back pay, front pay, lost future benefits, and emotional distress compensation.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Were you forced to resign because management refused to stop workplace harassment in ${resolvedCity}? You may have an actionable constructive discharge claim. Contact Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> for a free legal evaluation.</strong></em></p>

<h2 class="h2dav">Workplace Retaliation and California Senate Bill 497</h2>

Employers often retaliate against employees who report harassment by issuing manufactured write-ups, slashing hours, reassigning shifts, or terminating their employment.

Under California Government Code § 12940(h) and Labor Code § 1102.5, retaliation against an employee for opposing unlawful harassment or participating in an investigation is strictly prohibited. Furthermore, under <strong>Senate Bill 497</strong> (effective January 1, 2024), if an employer takes an adverse employment action within <strong>90 days</strong> of an employee engaging in protected activity, California law establishes a <strong>rebuttable presumption of unlawful retaliation</strong>.

${topicModules.join("\n\n")}

${buildDamagesAndRemediesAnalysis("Workplace Harassment and Hostile Work Environment", resolvedCity)}

${buildAdministrativeRoadmap("Workplace Harassment and Hostile Work Environment", resolvedCity)}

${buildIndustryScenarios("Workplace Harassment and Hostile Work Environment", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Workplace Harassment Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Preserve contemporaneous evidence outside of employer systems</strong>. Save emails, Slack or Teams messages, text messages, voicemails, and personal journal notes on personal devices. Document dates, times, exact words spoken, and witnesses present before your network access is revoked.

<strong>Submit your harassment complaint in writing</strong>. Follow your employer's handbook reporting procedures and submit your complaint in writing to HR or executive leadership. Explicitly identify that the hostility is based on your protected category to trigger the employer's mandatory duty under Gov Code § 12940(k).

<strong>Do not resign abruptly without legal counsel</strong>. Quitting prematurely can give corporate defense lawyers grounds to argue that you departed voluntarily. Our attorneys can evaluate whether the conditions satisfy California's constructive discharge standard under Turner v. Anheuser-Busch.

<strong>Let Atoyan Law Firm fight for you</strong>. We immediately secure your Right-to-Sue notice from the California Civil Rights Department (CRD), subpoena electronic records, depose supervisory personnel, and aggressively pursue the full compensation you deserve under California law.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Workplace Harassment Claim?`;
  const compensationIntro = `
You have the fundamental right to earn a living in ${resolvedCity} without enduring targeted discrimination, hostile insults, or retaliatory punishment. California law provides comprehensive legal remedies to restore your dignity and compensate you for financial and emotional injury.

Under California FEHA, you can recover economic damages for back pay, front pay, lost bonuses, and healthcare coverage, as well as uncapped non-economic damages for emotional distress, mental anguish, anxiety, depression, and reputational harm. Where corporate management acted with malice, oppression, or fraud, punitive damages under California Civil Code § 3294 can be awarded. Furthermore, California Government Code § 12965 requires the employer to pay all reasonable attorney fees and litigation costs. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> for a confidential, no-cost consultation with our <b>${resolvedCity} workplace harassment attorneys</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("workplace_harassment", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Workplace Harassment Lawyer | Atoyan Law`,
    yoastMetaDesc: `Experienced ${resolvedCity} workplace harassment attorney fighting hostile work environment, supervisor bias, and retaliation under California FEHA. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} workplace harassment`,
  };
}

function buildHarassmentContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const heroTitle = `${city} Sexual Harassment Employment Lawyers - Hostile Work Environment`;
  const servicesHeading = `What Constitutes Unlawful Sexual Harassment and Hostile Work Environment in California?`;
  const servicesSubHeading = `Holding California Employers Strictly Liable Under Government Code § 12940`;

  const servicesContent = `
No one should ever have to trade their personal dignity, bodily boundaries, or emotional safety for a paycheck. Yet across offices, studios, hospitals, tech campuses, restaurants, retail stores, and service companies in ${city}, sexual harassment continues to devastate California workers.

California maintains the strongest anti-harassment statutes in the nation. Under the California Fair Employment and Housing Act (FEHA), codified at California Government Code § 12940(j), sexual harassment in the workplace is strictly illegal. The law places an affirmative, mandatory duty on every California employer to take all reasonable steps necessary to prevent harassment and discrimination from occurring.

<h3 class="h3dav">The Two Legal Categories of Sexual Harassment</h3>

In California employment litigation, sexual harassment claims generally fall into two distinct legal categories:
<ul>
  <li><strong>Quid Pro Quo Harassment</strong>: Latin for "this for that." This occurs when a supervisor, manager, or person in authority conditions a job benefit—such as a promotion, raise, favorable shift, or continued employment—on an employee submitting to sexual advances, dates, or romantic demands, or when an adverse action is taken because the employee rejected such advances.</li>
  <li><strong>Hostile Work Environment Harassment</strong>: This occurs when an employee is subjected to unwelcome sexual, romantic, or gender-based conduct that is either <strong>severe or pervasive</strong> enough to alter the conditions of their working environment and create an intimidating, hostile, abusive, or offensive workplace.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Subjected to unwanted sexual advances, lewd comments, or a hostile work environment in ${city}? That is not just inappropriate - it is unlawful under California FEHA. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a>.</strong></em></p>

<h2 class="h2dav">The Legal Standard: California Law Does Not Require "Severe AND Pervasive"</h2>

A common defense deployed by corporate employers is arguing that the misconduct was merely "stray remarks" or "office banter." Under federal law, courts historically applied strict standards requiring conduct to be both severe AND pervasive.

In California, our legislature explicitly rejected that high hurdle by passing <strong>Senate Bill 1300</strong>, which amended Government Code § 12923. Under current California law:
<ul>
  <li>An employee only needs to show that the conduct was severe <strong>OR</strong> pervasive.</li>
  <li>A <strong>single incident of harassing conduct</strong> is legally sufficient to create a hostile work environment if the harassing conduct has unreasonably interfered with the employee's work performance or created an intimidating working environment.</li>
  <li>Workplace harassment cases are rarely appropriate for disposition on summary judgment because determining whether an environment is hostile is an issue of fact for a jury.</li>
  <li>The legal standard is viewed from the perspective of a reasonable person in the plaintiff's position, taking into account the totality of circumstances.</li>
</ul>

<h3 class="h3dav">What Does Sexual Harassment Look Like in Practice?</h3>
Harassment does not require physical touching. Actionable sexual harassment in ${city} workplaces includes:
<ul>
  <li>Unwanted physical contact: touching, hugging, brushing against, cornering, kissing, or rubbing shoulders.</li>
  <li>Verbal harassment: sexual jokes, graphic comments about an employee's body or clothing, inquiries about their sex life, sexual propositions, or romantic persistence after rejection.</li>
  <li>Non-verbal conduct: leering, ogling, making suggestive gestures, or blocking an employee's physical path.</li>
  <li>Digital and visual harassment: sending sexually explicit text messages, emails, memes, pornographic images, or inappropriate Slack/Teams DMs.</li>
  <li>Gender-based hostility: demeaning or insulting comments directed at women, men, or non-binary individuals simply because of their gender identity or presentation, even without sexual attraction.</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your supervisor touch you inappropriately, make lewd comments, or retaliate after you said no? California law holds employers strictly liable for supervisor harassment. Call Atoyan Law Firm at <a href="tel:8888070077">(888) 807-0077</a>.</strong></em></p>

<h2 class="h2dav">Employer Liability: Supervisors vs. Coworkers</h2>

Under California Government Code § 12940(j)(1), the legal rules governing employer liability depend on who committed the harassment:
<ul>
  <li><strong>Harassment by a Supervisor</strong>: The employer is <strong>strictly liable</strong>. It does not matter whether company owners or human resources knew about the harassment. If a supervisor harassed you, the company is automatically legally responsible for the damages.</li>
  <li><strong>Harassment by a Coworker or Third Party</strong>: The employer is liable if management, human resources, or a supervisor <strong>knew or should have known</strong> of the conduct and failed to take immediate and appropriate corrective action.</li>
  <li><strong>Individual Liability for the Harasser</strong>: Under California Government Code § 12940(j)(3), an individual harasser can be sued personally in court and held individually liable for damages, regardless of whether the employer is also held liable.</li>
</ul>

<h2 class="h2dav">The Failure to Prevent Harassment: Government Code § 12940(k)</h2>

California law imposes a standalone legal cause of action against employers who fail to maintain proactive anti-harassment measures. Under Government Code § 12940(k), an employer commits an independent unlawful employment practice when it fails to "take all reasonable steps necessary to prevent harassment and discrimination from occurring."

When an employee reports harassment to HR, and HR performs a biased, superficial investigation, sweeps the complaint under the rug, or orders the victim to "just get along," the employer has directly violated § 12940(k).

<h2 class="h2dav">Retaliation: When Speaking Up Puts Your Job at Risk</h2>

In an overwhelming number of sexual harassment cases, the victim suffers twice: first from the harassment itself, and second from unlawful workplace retaliation after reporting the misconduct.

Under California Government Code § 12940(h) and Labor Code § 1102.5, it is illegal for an employer to discharge, demote, suspend, discipline, or harass an employee because they opposed unlawful harassment or participated in an investigation.

Under California Senate Bill 497, if an employer takes an adverse action against you within <strong>90 days</strong> of making a harassment complaint, the law creates a <strong>rebuttable presumption of retaliation</strong>.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Were you fired, demoted, or isolated after reporting sexual harassment in ${city}? Under California SB 497, adverse action within 90 days is presumed retaliatory. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> today.</strong></em></p>

<h2 class="h2dav">The "Silenced No More Act": Non-Disclosure Agreements Are Banned</h2>

For decades, powerful corporate executives used secret non-disclosure agreements (NDAs) to silence victims of workplace harassment and conceal serial predators.

California ended this practice through the <strong>Silenced No More Act (Senate Bill 331)</strong>. Under California Code of Civil Procedure § 1001 and Government Code § 12964.5, employers are legally prohibited from enforcing non-disclosure or non-disparagement provisions that restrict an employee's right to speak out about factual information related to sexual harassment, sexual assault, gender discrimination, or workplace retaliation.


${getTopicEnrichmentModules("sexual_harassment", "Sexual Harassment", city).join("\n\n")}

${buildDamagesAndRemediesAnalysis("Sexual Harassment and Hostile Work Environment", city)}

${buildAdministrativeRoadmap("Sexual Harassment and Hostile Work Environment", city)}

${buildIndustryScenarios("Sexual Harassment and Hostile Work Environment", city)}
`.trim();

  const howDoHeading = `How Can a ${city} Sexual Harassment Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Preserve all digital evidence outside of company systems</strong>. Take screenshots of text messages, WhatsApp chats, social media interactions, Slack or Teams messages, and voicemail recordings before you are locked out of work devices.

<strong>Submit your harassment complaint in writing</strong>. Follow your company's written handbook policy and submit your complaint to Human Resources or executive management in writing via email, keeping a timestamped copy sent to your personal email account.

<strong>Do not quit your job prematurely without legal guidance</strong>. If you resign abruptly, the company will argue you departed voluntarily. An employment attorney can evaluate whether the harassment meets California's strict constructive discharge standard under Turner v. Anheuser-Busch.

<strong>Let Atoyan Law Firm stand between you and your employer</strong>. We protect you from retaliatory retaliation, obtain your Right to Sue notice from the California Civil Rights Department (CRD), depose the harasser and negligent HR executives, and aggressively pursue the maximum financial compensation available under California law.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${city} Sexual Harassment Claim?`;
  const compensationIntro = `
You have the right to work without being subjected to unwanted sexual advances, lewd comments, or an intimidating hostile working environment. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report discrimination</a> and harassment without fear of being fired, demoted, or ostracized by management. You have the right to hold both the harasser and the negligent company legally accountable under California law.

Workplace sexual harassment inflicts deep emotional trauma. It causes anxiety, insomnia, panic attacks, depression, and tears apart your sense of professional security. But California law gives you powerful legal tools to fight back. If you experienced sexual harassment, assault, or retaliation in ${city}, call us. Atoyan Law offers completely confidential consultations. No judgment. No pressure. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${city} sexual harassment lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("sexual_harassment", city, keyword);
  return {
    keyword,
    city,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${city} Sexual Harassment Lawyer | Atoyan Law`,
    yoastMetaDesc: `Experienced ${city} sexual harassment attorney fighting for victims of hostile work environment, quid pro quo & retaliation. Call (888) 807-0077.`,
    yoastFocusKw: `${city} sexual harassment`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 5: DISABILITY DISCRIMINATION & REASONABLE ACCOMMODATION
// -----------------------------------------------------------------------------
function buildDisabilityContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Disability Discrimination Employment Lawyers - Failure to Accommodate`;
  const servicesHeading = `What Are Your Rights Regarding Disability Discrimination and Accommodations Under California FEHA?`;
  const servicesSubHeading = `Enforcing the Interactive Process and Reasonable Accommodation Protections Across California`;

  const servicesContent = `
Living with a physical disability, chronic illness, or mental health condition presents daily challenges. When California workers show up and perform their jobs, they have the protected legal right to receive reasonable accommodations from their employers. They should never be treated as expendable liabilities or pushed out the door the moment an injury or medical diagnosis arises.

Yet disability discrimination and the unlawful refusal to provide reasonable accommodations remain among the most frequent employment claims in ${resolvedCity}. Employers in healthcare, logistics, manufacturing, retail, corporate offices, and tech routinely ignore medical notes, refuse to modify working hours, and terminate dedicated employees rather than engaging in the interactive process required by California law.

<h3 class="h3dav">What are your three core rights under California disability law?</h3>

Under the California Fair Employment and Housing Act (FEHA), codified at California Government Code § 12940, employers with 5 or more employees must satisfy three distinct, independent statutory legal duties:
<ol>
  <li><strong>Duty Not to Discriminate (Gov Code § 12940(a))</strong>: An employer cannot fire, demote, refuse to hire, reduce the pay of, or mistreat an employee because of a physical disability, mental disability, or medical condition.</li>
  <li><strong>Duty to Provide Reasonable Accommodations (Gov Code § 12940(m))</strong>: An employer must provide reasonable accommodations for known disabilities unless the employer can prove that doing so would cause an extreme, undue hardship.</li>
  <li><strong>Duty to Engage in the Interactive Process (Gov Code § 12940(n))</strong>: An employer must engage in a timely, good-faith interactive process with the employee to determine effective reasonable accommodations.</li>
</ol>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your employer ignore your doctor's note, refuse reasonable accommodations, or fire you after a medical leave in ${resolvedCity}? California law heavily penalizes these violations. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a>.</strong></em></p>

<h2 class="h2dav">What qualifies as a physical or mental disability under California FEHA?</h2>

California provides substantially broader protections than the federal Americans with Disabilities Act (ADA). Under federal law, an impairment must "substantially limit" a major life activity. Under California FEHA (Government Code § 12926), an impairment only needs to <strong>"limit"</strong> a major life activity—meaning it simply makes the achievement of the activity difficult.

Qualifying conditions under California law include:
<ul>
  <li>Orthopedic, spinal, joint, and musculoskeletal injuries</li>
  <li>Cancer, diabetes, epilepsy, and cardiovascular conditions</li>
  <li>Clinical depression, anxiety disorders, PTSD, and bipolar disorder</li>
  <li>Pregnancy-related medical complications</li>
  <li>Long COVID and chronic autoimmune conditions</li>
  <li>Conditions that are in remission or episodic in nature</li>
</ul>

<h2 class="h2dav">What is the mandatory good-faith interactive process under California law?</h2>

Under California Government Code § 12940(n), it is a separate and independent legal violation for an employer to fail to engage in a <strong>timely, good-faith interactive process</strong> once an employee requests an accommodation or when the employer becomes aware of the need.

The interactive process requires a two-way, collaborative dialogue between management and the worker to explore possible accommodations. An employer cannot simply ignore a doctor's note, say "no," or demand that an employee return with "zero restrictions."

<h2 class="h2dav">What are common examples of reasonable workplace accommodations?</h2>

Under California law, reasonable accommodations take many practical forms:
<ul>
  <li>Ergonomic office equipment, specialized chairs, or lifting assistance tools</li>
  <li>Adjusted working hours or modified shift schedules</li>
  <li>Temporary telecommuting or remote work flexibility</li>
  <li>Reassignment to a vacant position for which the employee is qualified</li>
  <li>Job restructuring or temporary reassignment of marginal non-essential duties</li>
  <li>Extended medical leave of absence for surgery, recovery, or treatment</li>
</ul>

<h3 class="h3dav">Is an employer's policy requiring a worker to be 100% healed legal?</h3>
No! Corporate "100% healed" policies are per se illegal under California law. Under California Supreme Court precedent, an employer cannot legally refuse to allow an employee to return to work simply because they have medical restrictions. The employer must evaluate whether the employee can perform the <strong>essential functions</strong> of the job with reasonable accommodations.

<h2 class="h2dav">Can extended medical leave qualify as a reasonable accommodation?</h2>

Yes. Under California law, a medical leave of absence—or an extension of leave beyond statutory CFRA/FMLA limits—is recognized as a reasonable accommodation if it is likely to allow the employee to return to work in the foreseeable future. An employer cannot fire an employee the moment their 12-week CFRA leave expires without engaging in the interactive process.

<h2 class="h2dav">Can an employer fire or discipline me for requesting a medical accommodation?</h2>

No. Requesting a disability accommodation is an explicitly protected activity under California Government Code § 12940(m)(2). Retaliating against an employee for asking for an accommodation or taking medical leave violates state law.

Under <strong>California Senate Bill 497</strong>, if an employer terminates, demotes, or disciplines an employee within <strong>90 days</strong> of an accommodation request, unlawful retaliation is legally presumed.

<h2 class="h2dav">Can undocumented workers recover damages for disability discrimination in California?</h2>

Yes. Under <strong>California Labor Code § 1171.5</strong>, all workers in California possess full legal rights and remedies under civil rights and disability statutes regardless of immigration status.


${buildEvidentiaryDeepDive("Disability Discrimination", resolvedCity)}

${buildCorporateDefensePlaybook("Disability Discrimination", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Disability Discrimination", resolvedCity)}

${buildAdministrativeRoadmap("Disability Discrimination", resolvedCity)}

${buildIndustryScenarios("Disability Discrimination", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Disability Discrimination Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Establish employer liability under Government Code § 12940(n)</strong>. Even if an employer claims an accommodation was impossible, their failure to engage in the interactive process creates independent liability under California law.

<strong>Dismantle corporate "undue hardship" defenses</strong>. Employers frequently claim accommodations are too expensive. We subpoena company financial records to prove the accommodation was readily affordable.

<strong>Subpoena doctor communications and HR records</strong>. We demonstrate that you provided clear medical notes and that management arbitrarily refused to accommodate your documented restrictions.

<strong>Recover maximum financial damages</strong>. From lost past and future earnings to substantial emotional distress and punitive damages, Atoyan Law fights for the full financial compensation you are owed.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Disability Claim?`;
  const compensationIntro = `
You have the right to earn a living without having your medical condition weaponized against you. You have the right to fair accommodations, an honest interactive dialogue, and a workplace free from disability bias. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report discrimination</a> without being terminated by your employer.

Disability discrimination threatens your livelihood at the exact moment you are most vulnerable. California law provides strong protections to restore your financial security. If your employer denied accommodations or fired you after an injury in ${resolvedCity}, call Atoyan Law. We provide confidential, experienced legal counsel. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} disability discrimination lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("disability", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Disability Discrimination Lawyer | Atoyan Law`,
    yoastMetaDesc: `Experienced ${resolvedCity} disability discrimination attorney fighting for employees denied reasonable accommodations & interactive process. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} disability discrimination`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 6: MEDICAL & FAMILY LEAVE (CFRA / FMLA)
// -----------------------------------------------------------------------------
function buildLeaveContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Medical and Family Leave Employment Lawyers - CFRA Violations`;
  const servicesHeading = `What Are Your Rights Regarding Family and Medical Leave Under California CFRA?`;
  const servicesSubHeading = `Protecting California Workers from Unlawful Leave Denial, Termination, and Retaliation`;

  const servicesContent = `
Welcoming a new baby, recovering from major surgery, managing a serious health condition, or caring for an ailing parent are universal human experiences. California workers should never have to risk their livelihoods, careers, or health benefits simply because life demands time away from work.

Recognizing this, California enacted the California Family Rights Act (CFRA), establishing some of the most comprehensive, job-protected family and medical leave rights in the United States. Under California law, taking protected medical or family leave is not a workplace favor or corporate courtesy—it is a statutory civil right.

Yet across businesses in ${resolvedCity}, employers frequently deny eligible leave, demand intrusive medical details, count protected leave days as "unexcused absences," and terminate employees while they are recovering or immediately upon their return.

<h3 class="h3dav">What are my key rights under the California Family Rights Act (CFRA)?</h3>

Under CFRA (<a href="https://calcivilrights.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">Gov Code § 12945.2</span></a>), eligible employees are entitled to up to <strong>12 weeks of job-protected, unpaid leave</strong> in a 12-month period for:
<ul>
  <li>The employee's own serious health condition that makes them unable to perform their job duties.</li>
  <li>Caring for a child, parent, spouse, domestic partner, grandparent, grandchild, sibling, or "designated person" with a serious health condition.</li>
  <li>Baby bonding with a newborn, adopted child, or foster child within the first year of birth or placement.</li>
  <li>Qualifying exigencies related to the active military duty of an employee's spouse, domestic partner, child, or parent.</li>
</ul>

To be eligible under CFRA, an employee must have worked for the employer for at least <strong>12 months</strong> and completed at least <strong>1,250 hours of service</strong> in the 12-month period preceding the leave. Crucially, CFRA applies to all employers with <strong>5 or more employees</strong> (dramatically broader than the 50-employee threshold under federal FMLA).

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did your employer fire you while on medical leave, deny your CFRA baby bonding, or demote you upon return in ${resolvedCity}? California law protects your right to reinstatement. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a>.</strong></em></p>

<h2 class="h2dav">Do I have a guaranteed right to get my job back after medical or family leave?</h2>

Yes. Reinstatement is the cornerstone of CFRA. Under California Government Code § 12945.2, an employee returning from CFRA leave is legally entitled to be returned to the <strong>exact same position</strong> or to a <strong>virtually identical position</strong> with equivalent pay, benefits, working conditions, shift schedule, and seniority.

An employer cannot replace you while on leave and tell you upon your return that "your position was filled" or "we restructured your department." The only narrow exception is if the employer can prove by clear evidence that your position would have been eliminated during a genuine, company-wide layoff regardless of whether you took leave.

<h2 class="h2dav">How does Pregnancy Disability Leave (PDL) interact with CFRA baby bonding?</h2>

Under California's Pregnancy Disability Leave law (PDL, Gov Code § 12945), employees disabled by pregnancy, childbirth, or related medical conditions can take up to <strong>4 months (17.3 weeks)</strong> of job-protected leave.

Crucially, PDL is completely separate from CFRA. Once a mother recovers from childbirth and her PDL concludes, she is entitled to take an additional <strong>12 full weeks of CFRA baby bonding leave</strong>. Combining both statutes gives eligible California mothers up to nearly 7 months of protected leave.

<h2 class="h2dav">Can an employer retaliate against me or count leave days as unexcused absences?</h2>

No. Under California Government Code § 12945.2(k), it is unlawful for an employer to interfere with, restrain, or deny the exercise of CFRA rights, or to discharge, fine, suspend, expel, or discriminate against any employee because they requested or took leave.

Under <strong>California Senate Bill 497</strong>, if an employer takes any adverse action against an employee within <strong>90 days</strong> of requesting or returning from leave, retaliation is legally presumed.

<h2 class="h2dav">Why is California's CFRA far more protective of workers than federal FMLA?</h2>

California workers enjoy far greater statutory protections under CFRA than workers in other states relying on the federal Family and Medical Leave Act (FMLA):
<ul>
  <li><strong>Small Employer Coverage</strong>: CFRA covers employers with 5 or more employees, while FMLA requires 50 employees within a 75-mile radius.</li>
  <li><strong>Broad Family Definitions</strong>: CFRA allows leave to care for siblings, grandparents, grandchildren, and any "designated person" chosen by the employee under AB 1041.</li>
  <li><strong>Strict Privacy Restrictions</strong>: Under CFRA, employers cannot demand to know your specific medical diagnosis or review medical records—a basic doctor's certification stating the need for leave is legally sufficient.</li>
</ul>

<h2 class="h2dav">Can undocumented workers exercise medical and family leave rights in California?</h2>

Yes. Under <strong>California Labor Code § 1171.5</strong>, all labor, employment, and civil rights protections apply to every employee in California regardless of immigration status. Threatening an employee's immigration status to stop them from taking protected leave is criminal extortion and severe civil retaliation under Labor Code § 244.


${buildEvidentiaryDeepDive("Medical and Family Leave Retaliation", resolvedCity)}

${buildCorporateDefensePlaybook("Medical and Family Leave Retaliation", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Medical and Family Leave Retaliation", resolvedCity)}

${buildAdministrativeRoadmap("Medical and Family Leave Retaliation", resolvedCity)}

${buildIndustryScenarios("Medical and Family Leave Retaliation", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} CFRA Leave Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Enforce your statutory right to reinstatement</strong>. If your employer claimed your job was "eliminated" or gave away your shift while you were recovering, Atoyan Law investigates to expose the pretext.

<strong>Protect your health insurance and benefit continuity</strong>. Under CFRA, employers must maintain your group health coverage during leave under the same conditions as if you were working. We recover out-of-pocket medical bills caused by illegal benefit cancellations.

<strong>Dismantle attendance-based discipline</strong>. If your employer issued attendance points, written warnings, or fired you for missing work on approved medical days, we prove unlawful leave interference under Gov Code § 12945.2.

<strong>Recover maximum financial compensation</strong>. From lost wages and front pay to emotional distress damages and attorney fee shifting, we demand full accountability from your employer.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} CFRA Claim?`;
  const compensationIntro = `
You have the right to care for your health and your family without sacrificing your career. You have the right to return to your job with your wages, benefits, and dignity intact. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report labor violations</a> without facing sudden termination from your employer.

Losing your job during a medical crisis or after having a child causes catastrophic financial and emotional stress. California law gives you the power to fight back and hold corporate employers fully responsible. If your employer violated your CFRA rights in ${resolvedCity}, contact Atoyan Law. We provide aggressive, experienced legal advocacy. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} family and medical leave lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("family_medical_leave", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} CFRA & Medical Leave Lawyer | Atoyan Law`,
    yoastMetaDesc: `Experienced ${resolvedCity} family and medical leave attorney protecting employee rights under CFRA & FMLA. Fighting wrongful termination & retaliation. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} medical leave`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 7: WORKPLACE RETALIATION & WHISTLEBLOWER
// -----------------------------------------------------------------------------
function buildRetaliationContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Workplace Retaliation Employment Lawyers - Whistleblower Protection`;
  const servicesHeading = `What Are Your Rights Against Workplace Retaliation Under California Law?`;
  const servicesSubHeading = `Enforcing California Labor Code § 1102.5, FEHA § 12940(h), and Senate Bill 497`;

  const servicesContent = `
Speaking truth to power takes immense personal courage. When an employee in ${resolvedCity} stands up against sexual harassment, objects to racial discrimination, questions unpaid overtime, or blows the whistle on fraudulent corporate conduct, they are acting as the conscience of the workplace.

Under California law, employees who speak up are fiercely protected. California maintains the most aggressive, worker-protective anti-retaliation and whistleblower statutes in the United States. Retaliation is not merely unethical; it is illegal under multiple California codes.

Yet when workers speak up, corporate leadership frequently responds with retaliation. Within weeks of an internal complaint, an employee who had years of stellar evaluations suddenly finds themselves iced out of meetings, slapped with unjustified disciplinary write-ups, demoted, or fired.

<h3 class="h3dav">What whistleblower protections exist under California Labor Code § 1102.5?</h3>

California Labor Code § 1102.5 is known as California's "general whistleblower statute." It prohibits an employer from adopting any rule or policy that prevents an employee from disclosing information, or retaliating against an employee for:
<ul>
  <li>Disclosing information to a government or law enforcement agency, or to a person with authority over the employee (such as a supervisor or HR manager), if the employee has reasonable cause to believe the information discloses a violation of state or federal statute, rule, or regulation.</li>
  <li>Refusing to participate in an activity that would result in a violation of state or federal law.</li>
  <li>Providing information to or testifying before any public body conducting an investigation or hearing.</li>
</ul>

Crucially, you do not need to prove that the company actually violated the law—you only need to have had a <strong>reasonable, good-faith belief</strong> that unlawful conduct occurred.

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Did management write you up, cut your hours, or fire you after you complained about illegal conduct in ${resolvedCity}? Under SB 497, retaliation is legally presumed. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a>.</strong></em></p>

<h2 class="h2dav">What burden of proof applies under the California Supreme Court's Lawson standard?</h2>

In the landmark case <em>Lawson v. PPG Architectural Finishes, Inc.</em> (2022), the California Supreme Court established a plaintiff-friendly burden of proof for retaliation claims under Labor Code § 1102.5:
<ol>
  <li>The employee only needs to establish by a <strong>preponderance of the evidence</strong> that their protected whistleblowing was a <strong>contributing factor</strong> in the adverse employment decision.</li>
  <li>Once shown, the legal burden shifts completely to the employer to prove by <strong>clear and convincing evidence</strong> (a very high evidentiary hurdle) that it would have taken the same adverse action anyway for legitimate, independent reasons.</li>
</ol>

<h2 class="h2dav">How does Senate Bill 497's 90-day presumption protect retaliated workers?</h2>

Effective January 1, 2024, California enacted <strong>Senate Bill 497 (the Equal Pay and Anti-Retaliation Protection Act)</strong>. SB 497 amended California Labor Code §§ 98.6, 1102.5, and 1197.5 to establish that:
<ul>
  <li>If an employer takes an adverse employment action against an employee within <strong>90 days</strong> of the employee engaging in protected conduct, California law establishes a <strong>rebuttable presumption of retaliation</strong>.</li>
  <li>The employer is legally presumed guilty of retaliation unless it can produce clear and credible business justification proving the action was completely unmotivated by the employee's protected complaints.</li>
</ul>

<h2 class="h2dav">What qualifies as an adverse employment action under California law?</h2>

Retaliation is not limited to formal termination. Under the California Supreme Court decision in <em>Yanowitz v. L'Oreal USA, Inc.</em>, an adverse action includes any treatment that is <strong>reasonably likely to impair an employee's job performance or prospects for advancement</strong>:
<ul>
  <li>Termination, constructive discharge, or suspension</li>
  <li>Demotion or reduction in base salary or hourly rate</li>
  <li>Cutting shift hours, taking away overtime opportunities, or assigning undesirable shifts</li>
  <li>Unjustified disciplinary write-ups, bogus PIPs, or hostile reprimands</li>
  <li>Excluding the worker from crucial meetings, training sessions, or high-value accounts</li>
  <li>Harassment, intense micromanagement, or cold-shoulder treatment by management</li>
</ul>

<h2 class="h2dav">What civil penalties can an employee recover under Labor Code § 1102.5?</h2>

In addition to lost wages, emotional distress damages, and attorney fees, California Labor Code § 1102.5(f) imposes a <strong>civil penalty of up to $10,000 per violation</strong> against the employer, payable directly to the employee.

<h2 class="h2dav">Can undocumented workers report illegal conduct without fear of deportation threats?</h2>

Yes. Under <strong>California Labor Code § 1171.5</strong> and Labor Code § 244, all workers in California have full legal rights to blow the whistle on illegal workplace conduct. An employer who threatens to contact immigration authorities or ICE to silence a whistleblower commits criminal extortion and severe civil retaliation.


${buildEvidentiaryDeepDive("Workplace Retaliation and Whistleblower Claims", resolvedCity)}

${buildCorporateDefensePlaybook("Workplace Retaliation and Whistleblower Claims", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Workplace Retaliation and Whistleblower Claims", resolvedCity)}

${buildAdministrativeRoadmap("Workplace Retaliation and Whistleblower Claims", resolvedCity)}

${buildIndustryScenarios("Workplace Retaliation and Whistleblower Claims", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Workplace Retaliation Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Leverage California's 90-day statutory presumption under SB 497</strong>. When an adverse action happens within 90 days of your complaint, we shift the legal burden onto the employer from day one.

<strong>Subpoena corporate communications and chat logs</strong>. Managers often reveal their retaliatory frustration in emails and Slack chats. We preserve and extract these digital smoking guns.

<strong>Dismantle pretextual performance improvement plans (PIPs)</strong>. We prove that sudden negative reviews were manufactured solely to justify firing you after you spoke up.

<strong>Demand maximum financial compensation and civil penalties</strong>. We seek full back pay, front pay, emotional distress damages, $10,000 statutory civil penalties under Labor Code § 1102.5, punitive damages, and attorney fees.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Retaliation Claim?`;
  const compensationIntro = `
You had the courage to speak up against unlawful workplace conduct. You have the right to work without being targeted, punished, or fired for doing the right thing. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">report violations</a> without management destroying your career.

Retaliation strikes at the core of your professional identity and financial security. California juries consistently award substantial damages to punish employers who punish honest workers. If you faced workplace retaliation in ${resolvedCity}, contact Atoyan Law. We provide confidential, relentless legal representation. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} workplace retaliation lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("workplace_retaliation", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Workplace Retaliation Lawyer | Atoyan Law`,
    yoastMetaDesc: `Tenacious ${resolvedCity} workplace retaliation & whistleblower attorney fighting for employees punished for reporting illegal conduct. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} workplace retaliation`,
  };
}

// -----------------------------------------------------------------------------
// TOPIC 8: WRONGFUL TERMINATION & UNLAWFUL FIRING (DEFAULT)
// -----------------------------------------------------------------------------
function buildWrongfulTerminationContent(keyword: string, city: string, slug: string, shortcode: string): AtoyanLegalContent {
  const decomposed = decomposeKeyword(keyword, city);
  const resolvedCity = decomposed.city;
  const cleanTopic = decomposed.cleanTopic;
  const heroTitle = `${resolvedCity} Wrongful Termination Employment Lawyers - Unlawful Firing`;
  const servicesHeading = `What Qualifies as Wrongful Termination Under California Employment Law?`;
  const servicesSubHeading = `Challenging Illegal Discharges, Pretextual Firings, and Public Policy Violations`;

  const servicesContent = `
Losing your job without warning is one of the most destabilizing events an individual or family can endure. Suddenly, your income evaporates, your health insurance vanishes, and your professional reputation is called into question. When that termination is illegal, the injustice is profound.

California is widely known as an "at-will" employment state, leading many workers—and unscrupulous employers—to believe that companies can fire anyone, anytime, for any reason whatsoever.

That belief is legally false. Under California law, at-will employment is not an absolute license to terminate workers illegally. California enforces powerful constitutional, statutory, and common law exceptions that make discharging an employee unlawful when it violates public policy, anti-discrimination laws, whistleblower protections, or employment agreements.

<h3 class="h3dav">What does at-will employment mean in California—and what are its legal exceptions?</h3>

Under California Labor Code § 2922, employment having no specified term may be terminated at the will of either party on notice to the other. However, an employer cannot legally terminate an employee for an <strong>unlawful reason</strong>.

Major legal exceptions to at-will employment in California include:
<ul>
  <li><strong>Statutory Discrimination</strong>: Firing an employee based on race, gender, pregnancy, disability, age (40+), sexual orientation, religion, or national origin under California FEHA (Gov Code § 12940).</li>
  <li><strong>Statutory Retaliation & Whistleblowing</strong>: Terminating an employee for reporting wage theft, safety violations, harassment, or corporate fraud under Labor Code § 1102.5, § 98.6, or § 6310.</li>
  <li><strong>Tameny Public Policy Claims</strong>: Discharging a worker for refusing to break the law, reporting statutory violations, or exercising a fundamental statutory right (<em>Tameny v. Atlantic Richfield Co.</em>).</li>
  <li><strong>Medical & Family Leave Violations</strong>: Terminating a worker who requested or took protected medical leave under CFRA, FMLA, or Pregnancy Disability Leave (PDL).</li>
  <li><strong>Breach of Employment Contract</strong>: Violating express written contracts, oral promises, or implied-in-fact contracts requiring "good cause" for termination (<em>Foley v. Interactive Data Corp.</em>).</li>
</ul>

<p class="txt-hlt bg-bx ulk-bg pd_v-30 pd_h-30" style="text-align:center;"><em><strong>Were you fired unfairly or forced to quit your job in ${resolvedCity}? At-will employment does not protect employers who break the law. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> for a free, confidential case review.</strong></em></p>

<h2 class="h2dav">How do California employers disguise unlawful firings behind pretextual reasons?</h2>

California employers rarely state their illegal motives in writing. Instead, corporate human resources departments and defense attorneys construct elaborate paper trails to create a pretextual defense under the burden-shifting framework established in <em>McDonnell Douglas Corp. v. Green</em> and adopted by California in <em>Guz v. Bechtel National, Inc.</em> (2000).

When an employer decides to terminate an employee illegally, it frequently deploys classic pretextual maneuvers:
<ul>
  <li><strong>The Sudden Performance Plunge</strong>: An employee with years of glowing reviews and promotions suddenly receives an unprecedented negative review or is placed on a bogus Performance Improvement Plan (PIP) containing impossible benchmarks designed to fail.</li>
  <li><strong>The Phantom "Restructuring"</strong>: Management claims your position was eliminated due to corporate downsizing, but rehires someone younger or outside your protected class for the same role weeks later.</li>
  <li><strong>Disproportionate Discipline</strong>: Firing an employee for a minor policy infraction that other workers commit daily without consequence.</li>
</ul>

<h2 class="h2dav">Can I sue for wrongful termination if I was forced to quit (constructive discharge)?</h2>

Yes! Under the California Supreme Court decision in <em>Turner v. Anheuser-Busch, Inc.</em> (1994), California recognizes <strong>constructive discharge</strong>. When an employer intentionally creates or knowingly permits working conditions so intolerable, abusive, or hostile that any reasonable employee in your position would feel compelled to resign, the law treats your resignation as a formal termination.

You do not lose your wrongful termination rights simply because you handed in a resignation letter after your working conditions became unbearable.

<h2 class="h2dav">What is a Tameny claim for termination in violation of California public policy?</h2>

In the landmark decision <em>Tameny v. Atlantic Richfield Co.</em> (1980), the California Supreme Court established that when an employer discharges an employee in violation of a fundamental public policy embodied in a statute or constitutional provision, the employee can bring a tort action for wrongful termination.

Crucially, because a Tameny claim sounds in tort rather than contract, you can recover <strong>full compensatory damages and punitive damages</strong> under California Civil Code § 3294.

<h2 class="h2dav">Can I still collect EDD unemployment benefits if I was wrongfully fired?</h2>

Yes, in the vast majority of cases. Being fired does not disqualify you from unemployment benefits through the <a class="reset interactable cursor-pointer decoration-1 underline-offset-1 text-super-primary hover:underline" href="https://edd.ca.gov" target="_blank" rel="nofollow noopener"><span class="text-box-trim-both">California EDD</span></a> unless you were discharged for gross misconduct connected with your work. Pretextual, unfair, or discriminatory terminations do not constitute legal misconduct, and you should file your EDD claim immediately.

<h2 class="h2dav">Can undocumented workers sue for wrongful termination in California?</h2>

Yes. Under <strong>California Labor Code § 1171.5</strong>, all workers in California possess full legal rights and remedies under state labor, employment, and civil rights laws regardless of immigration status. Threatening to contact ICE to prevent a worker from challenging an illegal firing is criminal extortion and severe unlawful retaliation under Labor Code § 244.


${buildEvidentiaryDeepDive("Wrongful Termination and Unlawful Firing", resolvedCity)}

${buildCorporateDefensePlaybook("Wrongful Termination and Unlawful Firing", resolvedCity)}

${buildDamagesAndRemediesAnalysis("Wrongful Termination and Unlawful Firing", resolvedCity)}

${buildAdministrativeRoadmap("Wrongful Termination and Unlawful Firing", resolvedCity)}

${buildIndustryScenarios("Wrongful Termination and Unlawful Firing", resolvedCity)}
`.trim();

  const howDoHeading = `How Can a ${resolvedCity} Wrongful Termination Lawyer at Atoyan Law Help?`;
  const howDoContent = `
<strong>Investigate and dismantle employer pretext</strong>. When your former employer claims you were fired for "performance" or "restructuring," Atoyan Law subpoenas years of performance records and internal emails to expose the truth.

<strong>Preserve crucial workplace evidence</strong>. We issue legal spoliation letters preventing the company from deleting incriminating electronic communications, Slack logs, and personnel files.

<strong>Secure Right-to-Sue notices from the CRD</strong>. We exhaust administrative remedies with the California Civil Rights Department and file comprehensive lawsuits in California Superior Court.

<strong>Demand maximum financial recovery</strong>. We fight for full back pay, future lost earnings (front pay), substantial emotional distress damages, punitive damages under Civil Code § 3294, and statutory attorney fee shifting.
`.trim();

  const compensationHeading = `What Results and Compensation Can I Expect from a ${resolvedCity} Wrongful Termination Claim?`;
  const compensationIntro = `
You dedicated your time, energy, and loyalty to your job. You have the right to be free from unlawful firing, discriminatory termination, and retaliatory discharge. You have the right to <a href="https://www.atoyanlaw.com/practice-areas/employment-law/what-is-employment-discrimination/">oppose illegal practices</a> without your employer taking away your livelihood.

Wrongful termination inflicts immense emotional trauma and financial devastation on workers and their families. California law provides the tools to fight back and hold corporate employers fully accountable. If you were wrongfully terminated in ${resolvedCity}, contact Atoyan Law. We provide aggressive, experienced, and confidential representation. Real answers. Call <a href="tel:8888070077">(888) 807-0077</a> or contact us online to schedule a free consultation with our <b>${resolvedCity} wrongful termination lawyers</b>.
`.trim();

  const faqs: AtoyanFaq[] = buildDavidAtoyanFaqs("wrongful_termination", resolvedCity, cleanTopic);
  return {
    keyword,
    city: resolvedCity,
    slug,
    heroTitle,
    servicesHeading,
    servicesSubHeading,
    servicesContent,
    howDoHeading,
    howDoContent,
    compensationHeading,
    compensationIntro,
    accordionShortcode: shortcode,
    faqs,
    yoastTitle: `${resolvedCity} Wrongful Termination Lawyer | Atoyan Law`,
    yoastMetaDesc: `Top-rated ${resolvedCity} wrongful termination attorney fighting for employees fired illegally or facing employer retaliation. Call (888) 807-0077.`,
    yoastFocusKw: `${resolvedCity} wrongful termination`,
  };
}

// -----------------------------------------------------------------------------
// COMPREHENSIVE CALIFORNIA EMPLOYMENT LITIGATION DEPTH EXPANSION (2,500-3,500+ WORDS)
// -----------------------------------------------------------------------------

export function buildIndustryScenarios(topicName: string, city: string): string {
  return `
<h2 class="h2dav">How ${topicName} Manifests Across ${city} Industries</h2>

Every industry throughout California possesses its own distinct workplace culture, operational tempo, management hierarchies, and regulatory pressures. In ${city}, unlawful workplace conduct rarely looks like a textbook violation. Instead, it takes nuanced, industry-specific forms designed to exploit workplace vulnerabilities:

<h3 class="h3dav">1. Entertainment Studios, Post-Production, and Media Production</h3>
In the entertainment, streaming, and digital production hubs of ${city}, corporate executives routinely abuse freelance structures, project-based deadlines, and intense creative pressure. Workers frequently experience systemic mistreatment masked as "creative collaboration" or "paying your industry dues." Long 14-hour shoot days without statutory meal or rest breaks, off-the-clock wrap duties, illegal misclassification of crew members as independent contractors, and retaliatory industry blacklisting against individuals who report sexual harassment or safety hazards violate fundamental California statutes.

<h3 class="h3dav">2. Healthcare Networks, Hospitals, and Clinical Facilities</h3>
Healthcare professionals in ${city} operate in demanding clinical settings under chronic institutional understaffing. Hospital administrators frequently pressure registered nurses, medical assistants, respiratory therapists, and technicians to skip their 30-minute off-duty meal breaks or remain tethered to hospital radios and pagers during rest periods. Furthermore, clinical staff who report patient safety violations, dangerous nurse-to-patient ratios, or medication errors face swift, retaliatory discipline in direct violation of California Health and Safety Code § 1278.5 and California Labor Code § 1102.5.

<h3 class="h3dav">3. Technology Companies, Software Startups, and Silicon Beach Hubs</h3>
Across high-tech firms, software startups, and venture-funded companies in Southern California, employers weaponize equity compensation against workers. Tech professionals routinely report "vesting cliff terminations"—where companies abruptly fire engineers or product managers weeks before substantial stock options or equity grants vest. Additionally, tech companies frequently misclassify software developers as exempt from overtime under California Labor Code § 515.5 without satisfying the strict statutory salary and discretionary duty thresholds, while enforcing unlawful non-compete agreements that violate California Business and Professions Code § 16600.

<h3 class="h3dav">4. Logistics, Warehousing, and Inland Distribution Centers</h3>
In regional supply chain centers, fulfillment facilities, and distribution hubs serving ${city}, electronic monitoring algorithms and punishing production quotas are weaponized against warehouse staff. Employees are penalized by automated attendance tracking for taking restroom breaks, forced to undergo off-the-clock security bag checks at facility exits, and terminated when taking protected medical leave under the California Family Rights Act (CFRA).

<h3 class="h3dav">5. Construction, Commercial Building Trades, and Public Works</h3>
In commercial construction, infrastructure projects, and residential developments across ${city}, general contractors and subcontractors frequently evade wage and hour laws. Workers are subjected to unlawful day-rate arrangements, denied prevailing wage rates on public works projects in violation of California Labor Code §§ 1771 and 1774, and denied separate hourly compensation for non-productive standby time under Labor Code § 226.2. Workers who report dangerous scaffolding, trenching hazards, or lack of personal protective equipment face immediate termination in violation of California Labor Code § 6310.

<h3 class="h3dav">6. Hospitality, Luxury Hotels, and Fine Dining Establishments</h3>
In restaurants, boutique hotels, bars, and catering operations across ${city}, service employees face pervasive wage theft and hostile working environments. Shift workers are routinely subjected to off-the-clock prep work, illegal tip pooling where managers or shift leads skim gratuities in violation of California Labor Code § 351, and sudden shift cancellations without reporting time pay under IWC Wage Orders. When staff report sexual harassment by high-spending guests, kitchen managers, or head chefs, management frequently responds by slashing their scheduled shifts to zero instead of protecting them.
`.trim();
}

export function buildEvidentiaryDeepDive(topicName: string, city: string): string {
  return `
<h2 class="h2dav">How California Courts Evaluate Evidence in ${topicName} Lawsuits</h2>

Proving an employment law claim in California rarely relies on a single "smoking gun" document where an employer openly admits wrongdoing. Sophisticated employers in ${city} are coached by human resources directors and corporate defense counsel to sanitize internal records, mask discriminatory animus behind bureaucratic jargon, and manufacture false paper trails.

In California Superior Courts, liability is established through a mosaic of direct, circumstantial, and forensic evidence evaluated under landmark California legal doctrines:

<h3 class="h3dav">1. The Power of Circumstantial and Comparative Evidence</h3>
Under California law, circumstantial evidence carries the exact same legal weight as direct testimony. In ${topicName.toLowerCase()} cases, circumstantial proof often centers on <strong>comparative treatment</strong>.

Did management enforce attendance policies or quality metrics strictly against you while excusing identical conduct from coworkers outside your protected group? Were other employees granted schedule flexibility, assigned high-value accounts, or provided promotional mentorship while you were systematically marginalized? Proving that similarly situated coworkers received preferential treatment is one of the most powerful ways to expose unlawful bias under the framework established in <em>McDonnell Douglas Corp. v. Green</em> and reaffirmed under California law in <em>Harris v. City of Santa Monica</em> (2013).

<h3 class="h3dav">2. Suspicious Timing and Temporal Proximity</h3>
In California employment litigation, timing is critical. When adverse employment actions follow closely after an employee engages in protected activity—such as requesting pregnancy leave, reporting wage theft, objecting to sexual comments, or requesting disability accommodations—courts recognize <strong>temporal proximity</strong> as compelling circumstantial proof of retaliatory causation.

Under California Senate Bill 497 (enacted as California Labor Code §§ 98.6 and 1102.5), when an employer takes any adverse action against a worker within <strong>90 days</strong> of protected activity, California law establishes a <strong>rebuttable presumption of retaliation</strong>. The legal burden immediately shifts to the employer to prove by clear evidence that its decision was completely unrelated to the employee's protected complaint.

<h3 class="h3dav">3. "Me-Too" Witness Evidence Under California Law</h3>
Under California appellate precedent established in <em>Johnson v. United Cerebral Palsy of Greater Los Angeles</em> (2009) and reinforced in <em>Pantoja v. Anton</em> (2011), testimony from former employees who experienced similar mistreatment by the same supervisors or managing agents is fully admissible as "me-too" evidence.

Showing that an employer in ${city} has an ongoing pattern or practice of mistreating employees completely dismantles the defense that your treatment was an "isolated misunderstanding" or an "unfortunate interpersonal personality clash."

<h3 class="h3dav">4. Digital Forensics, Electronic Trails, and Internal Audit Logs</h3>
In today's digital workplace, crucial evidence is preserved in corporate databases. At Atoyan Law Firm, our attorneys utilize digital discovery to uncover:
<ul>
  <li><strong>Slack, Microsoft Teams, and Chat Channels</strong>: Informal internal messaging platforms where supervisors, team leads, and human resources representatives let their guard down and reveal discriminatory bias or retaliatory frustration.</li>
  <li><strong>Document Metadata and Version Histories</strong>: Electronic timestamps revealing whether a negative performance review or disciplinary memo was authored weeks after the fact and backdated to create a false record.</li>
  <li><strong>Security Keycard Badge Logs and VPN Access Records</strong>: Objective electronic logs proving hours worked, arrival times, and presence on site, refuting false employer claims of unexcused absences.</li>
</ul>

<h3 class="h3dav">5. Spoliation of Evidence and Adverse Inference Instructions</h3>
California law imposes an affirmative legal duty on employers to preserve all relevant documents, emails, text messages, and internal records the moment litigation is reasonably anticipated. When an employer deletes emails, wipes an employee's laptop, or alters personnel records, California courts can impose severe evidentiary sanctions. Under California Evidence Code §§ 412 and 413, and California Civil Jury Instruction (CACI) No. 204, the trial judge can instruct the jury to infer that the destroyed evidence would have proven the employer's unlawful liability.
`.trim();
}

export function buildCorporateDefensePlaybook(topicName: string, city: string): string {
  return `
<h2 class="h2dav">The Corporate Defense Playbook: How Employers Try to Defeat Claims</h2>

When employees challenge unlawful workplace practices in ${city}, corporate defense firms deploy predictable, aggressive strategies designed to exhaust, intimidate, and financially strain workers into abandoning their rights. At Atoyan Law Firm, our litigation team anticipates and neutralizes these corporate maneuvers from day one:

<h3 class="h3dav">1. The Manufactured "Legitimate Business Reason" and Pretextual PIP</h3>
The primary defense to any California employment lawsuit is asserting that the termination, demotion, or adverse action was motivated by a "legitimate, non-discriminatory business reason." Employers routinely comb through years of personnel files searching for any minor blemish—a late arrival from six months ago, an informal customer remark, or an administrative error.

Employers frequently weaponize a <strong>Performance Improvement Plan (PIP)</strong> containing vague, subjective metrics and unrealistic deadlines designed specifically to create a paper trail justifying termination. California courts look past this corporate pretext by examining whether the employer followed its own progressive discipline guidelines, whether the punishment fit the infraction, and whether the timing correlates with the employee's protected complaints.

<h3 class="h3dav">2. The Biased Internal HR "Investigation" Shield</h3>
Human resources departments exist to protect the corporation from financial liability, not to safeguard workers. When employees report ${topicName.toLowerCase()}, companies often stage an internal "investigation" conducted by an internal HR manager or outside defense attorney.

These internal investigations frequently interview only management-friendly witnesses, ignore key digital evidence, refuse to review the employee's documentation, and issue a predetermined report concluding that "no policy violation occurred." Atoyan Law Firm deconstructs these biased reports during depositions, demonstrating that the investigation was a self-serving sham.

<h3 class="h3dav">3. The Mandatory Arbitration Trap and Unconscionability</h3>
Many California workers unknowingly signed mandatory arbitration agreements buried in electronic onboarding packets. Corporations use arbitration to avoid public jury trials, limit discovery, and shield their executives from public accountability.

However, California law strictly regulates unfair arbitration agreements. Under the landmark California Supreme Court decision <em>Armendariz v. Foundation Health Psychcare Services, Inc.</em>, an arbitration clause is unenforceable if it is procedurally and substantively unconscionable. If an arbitration clause lacks mutual discovery, limits statutory damages, restricts remedies, or forces the worker to pay arbitration fees, California courts will strike it down and allow the lawsuit to proceed in open court.

<h3 class="h3dav">4. The Severance Agreement Ambush and the Silenced No More Act</h3>
When terminating an employee, employers frequently offer a severance package—typically two to four weeks of salary—in exchange for a complete release of all legal claims under California Civil Code § 1542. Employers use financial desperation to pressure workers into signing away claims worth tens or hundreds of thousands of dollars.

Crucially, under California's <strong>Silenced No More Act (Senate Bill 331)</strong> and California Government Code § 12964.5, employers are legally prohibited from requiring workers to sign non-disclosure or non-disparagement provisions that prevent them from discussing workplace discrimination, harassment, or illegal conduct. For employees aged 40 and older, federal law under the Older Workers Benefit Protection Act (OWBPA) strictly mandates a 21-day review period and a 7-day revocation window.

<h3 class="h3dav">5. Retaliatory Defamation Threats and Anti-SLAPP Protection</h3>
Corporate employers occasionally attempt to intimidate whistleblowers by threatening retaliatory lawsuits for "defamation," "breach of fiduciary duty," or "theft of trade secrets." Under California Code of Civil Procedure § 425.16 (California's Anti-SLAPP statute), lawsuits filed against workers for exercising their constitutional right to petition the government or report illegal activity can be dismissed early, with mandatory attorney fees awarded against the employer.
`.trim();
}

export function buildDamagesAndRemediesAnalysis(topicName: string, city: string): string {
  return `
<h2 class="h2dav">Recovering Full Financial Damages for ${topicName} Under California Law</h2>

California employment statutes are deliberately designed to provide full financial restitution to harmed employees and impose substantial monetary consequences on corporate wrongdoers. In a successful ${topicName.toLowerCase()} claim in ${city}, potential recovery includes:

<ul>
  <li><strong>Back Pay (Past Economic Losses)</strong>: Compensation for all wages, overtime premiums, bonuses, commissions, profit sharing, and retirement 401(k) contributions you would have received from the date of the unlawful action through the date of settlement or trial judgment.</li>
  <li><strong>Front Pay (Future Economic Losses)</strong>: If reinstatement is impractical or impossible due to hostility, courts award front pay to compensate for future lost earnings and diminished earning capacity until you can secure comparable employment.</li>
  <li><strong>Loss of Employment Benefits</strong>: The economic cash value of health insurance coverage, COBRA premium reimbursement, dental, vision, life insurance, and accrued paid time off (PTO).</li>
  <li><strong>Emotional Distress and Compensatory Damages</strong>: Financial compensation for psychological suffering, severe anxiety, depression, insomnia, humiliation, panic attacks, and destruction of professional standing. Crucially, unlike federal law which caps emotional distress damages, California's Fair Employment and Housing Act (FEHA) contains <strong>no statutory cap</strong> on emotional distress damages.</li>
  <li><strong>Statutory and Civil Penalties</strong>:
    <ul>
      <li><strong>Labor Code § 203 Waiting Time Penalties</strong>: Up to 30 days of full daily wages if an employer willfully fails to pay all earned wages immediately upon discharge.</li>
      <li><strong>Labor Code § 226 Wage Statement Penalties</strong>: Up to $4,000 for failure to provide accurate, itemized pay stubs.</li>
      <li><strong>Labor Code § 226.7 Break Premiums</strong>: One additional hour of regular pay for each day a meal break was missed, and one additional hour for each day a rest break was denied.</li>
      <li><strong>Labor Code § 1102.5 Whistleblower Penalties</strong>: Civil penalties of up to $10,000 per violation awarded to the employee.</li>
    </ul>
  </li>
  <li><strong>Punitive Damages Under California Civil Code § 3294</strong>: When an employer acts with oppression, fraud, or malice—such as upper management knowingly concealing workplace abuse or retaliating against a vulnerable worker—a California jury can award significant punitive damages to punish the corporation and deter future misconduct. Under <em>White v. Ultramar, Inc.</em>, malice by corporate managing agents justifies substantial punitive awards.</li>
  <li><strong>Mandatory Prevailing Party Attorney Fees and Costs</strong>: Under California Government Code § 12965(c)(6) and California Labor Code §§ 218.5 and 1194, an employer that loses an employment lawsuit is legally required to pay all of the employee's reasonable attorney fees and litigation expenses.</li>
  <li><strong>Prejudgment Interest</strong>: Under California Civil Code § 3287, prejudgment interest accrues at a statutory rate of <strong>10% per annum</strong> on all unpaid wages and liquidated damages from the date they became due.</li>
</ul>
`.trim();
}

export function buildAdministrativeRoadmap(topicName: string, city: string): string {
  return `
<h2 class="h2dav">The Legal Process: From CRD Administrative Filing to Superior Court Trial for ${topicName}</h2>

Successfully prosecuting an employment lawsuit against an employer in ${city} requires strict compliance with statutory deadlines, administrative prerequisites, and California civil procedure:

<h3 class="h3dav">1. Administrative Exhaustion with the California Civil Rights Department (CRD)</h3>
Before an employee can file a civil lawsuit for statutory discrimination, harassment, or retaliation under FEHA, they must first exhaust their administrative remedies with the California Civil Rights Department (CRD).

Under California Government Code § 12960, employees have <strong>three years</strong> from the date of the unlawful act to file an administrative complaint. While the CRD can conduct an administrative investigation, in high-stakes litigation Atoyan Law Firm requests an <strong>immediate Right to Sue notice</strong>. This allows us to bypass administrative delays and file directly in California Superior Court within one year of issuance.

<h3 class="h3dav">2. Evaluating Labor Commissioner (DLSE) Claims vs. Direct Civil Lawsuits</h3>
For wage and hour violations—including unpaid overtime, missed meal and rest breaks, and minimum wage violations—workers can pursue an administrative wage claim (Berman hearing) before the California Labor Commissioner (DLSE) or file a direct civil lawsuit in court. While DLSE hearings are informal, complex claims involving high-dollar damages, executive compensation, or widespread corporate retaliation are almost always more effectively resolved through civil court litigation.

<h3 class="h3dav">3. Complying with Strict Government Claims Act Deadlines for Public Employees</h3>
If your employer is a public or municipal entity—such as a school district, county hospital, municipal water district, or city agency—California law imposes an extraordinarily strict deadline. Under California Government Code § 911.2, you must file a formal written government tort claim within <strong>six months (180 days)</strong> of the unlawful action before you can sue in court. Missing this six-month deadline permanently forfeits your claims.

<h3 class="h3dav">4. Commencing the Lawsuit and Conducting Aggressive Civil Discovery</h3>
Once administrative requirements are satisfied, our attorneys file a comprehensive Complaint in California Superior Court. We immediately initiate formal discovery under the California Civil Discovery Act:
<ul>
  <li>Serving demands for inspection to obtain electronic emails, internal memos, and payroll databases.</li>
  <li>Demanding your complete personnel file, payroll records, and signed documents under California Labor Code §§ 1198.5 and 226(c).</li>
  <li>Subpoenaing third-party records, including external HR consultants and background check providers.</li>
  <li>Taking sworn, recorded video depositions of corporate executives, supervisors, and HR representatives to lock in their testimony and expose contradictions.</li>
</ul>

<h3 class="h3dav">5. Defeating Defense Motions for Summary Judgment (CCP § 437c)</h3>
In almost every major employment case, the employer's defense attorneys file a Motion for Summary Judgment attempting to have the case dismissed before trial. Corporate defense firms argue there is "no triable issue of material fact." Atoyan Law Firm meticulously defeats these motions by presenting concrete evidence of pretext, contradictory witness statements, and suspicious temporal timing, forcing the employer to face trial.

<h3 class="h3dav">6. Private Mediation, High-Stakes Settlement, or Trial by California Jury</h3>
Once corporate employers face the prospect of public trial, high financial exposure, and our unyielding evidentiary record, the vast majority agree to participate in private mediation before a retired California Superior Court judge. If the employer refuses to offer a settlement that fully compensates your economic losses and emotional suffering, our veteran trial litigators will present your case before a California jury to fight for a complete verdict and punitive damages.
`.trim();
}
