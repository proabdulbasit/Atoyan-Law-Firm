/**
 * Topic Prompt Blueprints & Specialized Legal Architecture
 * 
 * Guarantees 100% distinct, bespoke question headings, statutory depth,
 * and search FAQs across every California employment practice area.
 * Eliminates generic cross-topic duplication and enforces attorney David Atoyan's
 * 2,200+ word requirement with pure, domain-specific legal doctrine.
 */

export interface TopicQuestionBlueprint {
  questionNumber: number;
  heading: string;
  instructions: string;
}

export interface TopicFaqBlueprint {
  question: string;
  focus: string;
}

export interface TopicPromptBlueprint {
  topicKey: string;
  coreStatutes: string[];
  earlyCtaText: string;
  midCtaText: string;
  closingCtaText: string;
  questions: TopicQuestionBlueprint[];
  faqs: TopicFaqBlueprint[];
}

export function getTopicPromptBlueprint(
  topicKey: string,
  cleanTopic: string,
  city: string,
): TopicPromptBlueprint {
  switch (topicKey) {
    case "workplace_harassment":
      return {
        topicKey: "workplace_harassment",
        coreStatutes: [
          "FEHA Gov Code § 12940(j) (Non-sexual harassment protections across all protected categories)",
          "FEHA Gov Code § 12940(k) (Affirmative legal duty to prevent harassment and discrimination)",
          "California Senate Bill 1300 / Gov Code § 12923 (Rejection of strict federal threshold; single incident sufficiency)",
          "Roby v. McKesson Corp. (2009) (Severe or pervasive hostile work environment legal standard)",
          "Reno v. Baird (1998) & Janken v. GM Hughes (1996) (Distinguishing actionable harassment from managerial actions)",
          "State Dept. of Health Services v. Superior Court (2003) (Strict supervisor liability without Faragher/Ellerth defense)",
          "Labor Code § 1102.5 & SB 497 (Whistleblower protections and 90-day rebuttable presumption of retaliation)"
        ],
        earlyCtaText: `If you or a loved one are enduring severe, pervasive, or discriminatory harassment in ${city}, call Atoyan Law. Call <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> for a confidential consultation with our ${city} Workplace Harassment lawyer.`,
        midCtaText: `Facing discriminatory slurs, relentless bullying, or employer hostility in ${city}? You have protected rights under California FEHA. Our ${city} Workplace Harassment Lawyers are prepared to hold management accountable. <a href="tel:8888070077">Call (888) 807-0077</a> for immediate help.`,
        closingCtaText: `Workplace harassment destroys personal dignity and career livelihoods. Don’t face your employer alone. <a href="tel:8888070077">Contact Atoyan Law Firm’s ${city} Workplace Harassment team</a> today at (888) 807-0077 to demand full financial restitution.`,
        questions: [
          {
            questionNumber: 1,
            heading: `What Qualifies as Workplace Harassment Under California Law?`,
            instructions: `Detail the comprehensive protections of California's Fair Employment and Housing Act (FEHA), Gov Code § 12940(j). Emphasize that workplace harassment encompasses non-sexual hostility based on race, religious creed, color, national origin, ancestry, physical disability, mental disability, medical condition, genetic info, marital status, gender identity, gender expression, age (40+), sexual orientation, or military/veteran status. Detail how harassment creates an abusive, hostile working atmosphere outside the scope of necessary business conduct.`
          },
          {
            questionNumber: 2,
            heading: `What Is the "Severe or Pervasive" Legal Standard for Hostile Work Environments in California?`,
            instructions: `Analyze California Senate Bill 1300 and California Government Code § 12923. Contrast California law with harsher federal Title VII standards: California does NOT require conduct to be both severe AND pervasive; it requires severe OR pervasive. Explain how a single egregious incident (such as a severe physical threat or explicit racial/ethnic slur) can legally constitute a hostile work environment under Roby v. McKesson Corp. and Dee v. Vintage Petroleum, Inc. Explain the totality of the circumstances test from the perspective of a reasonable person in the plaintiff's protected group.`
          },
          {
            questionNumber: 3,
            heading: `How Does California Law Distinguish Actionable Harassment From Routine Managerial Decisions?`,
            instructions: `Explain the critical legal distinction established by the California Supreme Court in Reno v. Baird (1998) and Janken v. GM Hughes Electronics (1996). Clarify that discrimination arises from explicit personnel actions (hiring, firing, demotion, job assignments), whereas harassment consists of actions outside the necessary scope of job performance (verbal abuse, epithets, mocking, sabotage, personal degradation). Explain California AB 2053 requirements regarding abusive workplace conduct and workplace bullying.`
          },
          {
            questionNumber: 4,
            heading: `What Are Real-World Examples of Workplace Harassment in ${city} Workplaces?`,
            instructions: `Provide 6-8 concrete, highly realistic workplace scenarios typical of employers in ${city} across local healthcare facilities, corporate offices, technology firms, logistics hubs, retail chains, and service companies. Detail incidents involving racial slurs or symbols, mocking physical or mental disabilities, religious hostility, age-based derogatory remarks, intentional misgendering and deadnaming, and assigning humiliating or hazardous tasks exclusively to marginalized employees. Use subheadings <h3 class="h3dav"> for Verbal Harassment, Visual & Digital Hostility, and Physical Intimidation.`
          },
          {
            questionNumber: 5,
            heading: `When Is a California Employer Strictly Liable for Supervisor Harassment?`,
            instructions: `Detail California Government Code § 12940(j)(1) and the landmark California Supreme Court decision State Dept. of Health Services v. Superior Court (2003). Explain that in California, an employer is strictly liable for harassment committed by a supervisor or managing agent—regardless of whether executive leadership knew of the conduct. Contrast this with federal law: California explicitly REJECTS the federal Faragher/Ellerth affirmative defense to liability.`
          },
          {
            questionNumber: 6,
            heading: `Can You Sue an Employer If a Coworker, Client, or Customer Harassed You?`,
            instructions: `Explain employer liability under the negligence standard in Gov Code § 12940(j)(1) for non-supervisory coworkers, independent contractors, clients, customers, and patients. Explain that employers are legally liable if management, HR, or any supervisor knew or should have known of the harassment and failed to take immediate and appropriate corrective action. Detail the legal duty of employers to intervene when third-party customers abuse front-line or service staff.`
          },
          {
            questionNumber: 7,
            heading: `What Is the Standalone "Failure to Prevent Harassment" Claim Under Gov Code § 12940(k)?`,
            instructions: `Analyze California Government Code § 12940(k), which makes it an independent, actionable violation for an employer to fail to take all reasonable steps necessary to prevent harassment and discrimination. Explain how employers violate § 12940(k) by failing to adopt clear anti-harassment policies, ignoring warning signs, appointing conflicted HR investigators, sweeping complaints under the rug, or instructing victims to "develop thicker skin" or "work it out privately."`
          },
          {
            questionNumber: 8,
            heading: `When Does Persistent Workplace Harassment Become Constructive Discharge?`,
            instructions: `Detail the doctrine of constructive termination under California law (Turner v. Anheuser-Busch, Inc.). Explain that when an employer deliberately permits or creates working conditions that are so intolerable, toxic, and hostile that a reasonable employee in the same position would feel compelled to resign, California law treats the resignation as an unlawful termination. Explain how constructive discharge preserves the right to recover full past and future lost wages and benefits.`
          },
          {
            questionNumber: 9,
            heading: `How Do Employers Retaliate Against Workers Who Oppose or Report Workplace Harassment?`,
            instructions: `Detail statutory protections under FEHA Gov Code § 12940(h) and California Labor Code § 1102.5. Explain how corporate employers retaliate through pretextual Performance Improvement Plans (PIPs), sudden negative evaluations, undesirable shifts, schedule cuts, social ostracization, and retaliatory firings. Explain California Senate Bill 497 (effective Jan 1, 2024), establishing a 90-day statutory rebuttable presumption of retaliation under Lawson v. PPG Architectural Finishes.`
          },
          {
            questionNumber: 10,
            heading: `How Should You Document Workplace Harassment to Build an Ironclad Evidentiary Record?`,
            instructions: `Provide an actionable, step-by-step documentation guide for employees in ${city}: keeping a contemporaneous personal journal off company devices, noting dates, times, witnesses, and exact words used; saving harassing emails, Slack/Teams chats, text messages, and photos; submitting formal written complaints to HR via trackable email; requesting complete personnel records under Labor Code § 1198.5. Warn workers about California Penal Code § 632 two-party consent recording restrictions.`
          },
          {
            questionNumber: 11,
            heading: `Can Immigrant and Undocumented Workers Bring a Workplace Harassment Lawsuit in California?`,
            instructions: `Detail California Labor Code § 1171.5, which guarantees that all civil rights, anti-harassment, and labor remedies apply to every California worker regardless of immigration status. Highlight California Labor Code § 244 and Civil Code § 3339, making it illegal retaliation, civil extortion, and a criminal misdemeanor for an employer to threaten immigration enforcement or contact ICE against a worker who complains about workplace harassment.`
          },
          {
            questionNumber: 12,
            heading: `What Is the Process for Filing with the California Civil Rights Department (CRD)?`,
            instructions: `Explain administrative exhaustion under California Government Code § 12960. Detail the generous 3-year statute of limitations to file an administrative complaint with the California Civil Rights Department (CRD, formerly DFEH). Explain why Atoyan Law Firm frequently requests an immediate Right-to-Sue notice to bypass slow administrative backlogs and proceed directly to filing a lawsuit in California Superior Court.`
          },
          {
            questionNumber: 13,
            heading: `What Financial Damages and Compensation Can You Recover for Workplace Harassment in ${city}?`,
            instructions: `Provide an exhaustive breakdown of recoverable damages under California law: economic damages (past lost earnings, future front pay, lost benefits, medical and psychological expenses); non-economic compensatory damages (emotional distress, humiliation, anxiety, depression, insomnia, with NO statutory dollar caps under California FEHA); punitive damages under California Civil Code § 3294 for corporate malice, oppression, or fraud by managing agents (White v. Ultramar); and mandatory statutory attorney fees under Gov Code § 12965.`
          },
          {
            questionNumber: 14,
            heading: `Why Choose Atoyan Law Firm to Fight Workplace Harassment in ${city}?`,
            instructions: `Describe Atoyan Law Firm's trial-tested representation of California workers: contingency fee model (no fees unless we win), aggressive discovery targeting corporate email servers and HR communications, personalized client focus, and fearless litigation against Fortune 500 companies and entrenched corporate defense firms in California Superior Court.`
          }
        ],
        faqs: [
          {
            question: `What Qualifies as Unlawful Workplace Harassment Under California FEHA?`,
            focus: `Explain Gov Code § 12940(j) covering non-sexual hostile conduct based on protected characteristics like race, religion, disability, medical condition, age, gender identity, or sexual orientation, creating an intimidating, offensive environment.`
          },
          {
            question: `What Protected Characteristics Are Shielded from Harassment Under California Law?`,
            focus: `List all 18+ protected classifications under California FEHA, explaining that harassment based on any of these traits is illegal.`
          },
          {
            question: `What Is the Legal Difference Between Workplace Harassment and Workplace Discrimination?`,
            focus: `Contrast personnel actions (discrimination) with hostile workplace conduct, slurs, epithets, and abusive behavior outside job performance (harassment) under Reno v. Baird.`
          },
          {
            question: `What Is the "Severe or Pervasive" Legal Standard for Hostile Work Environments in California?`,
            focus: `Explain Senate Bill 1300 and Gov Code § 12923: conduct must be severe OR pervasive, and a single egregious incident can suffice.`
          },
          {
            question: `When Is an Employer Strictly Liable for Supervisor Harassment in ${city}?`,
            focus: `Explain Gov Code § 12940(j)(1) and State Dept. of Health Services: strict liability applies to supervisors with no affirmative defense in California.`
          },
          {
            question: `Can My Employer Be Held Responsible If a Coworker or Customer Harassed Me?`,
            focus: `Explain negligence liability under FEHA: employers are liable if management knew or should have known and failed to take immediate corrective action.`
          },
          {
            question: `What Constitutes an Employer's "Failure to Prevent Harassment" Under Gov Code § 12940(k)?`,
            focus: `Detail the standalone violation for failing to maintain effective anti-harassment policies or conducting sham HR investigations.`
          },
          {
            question: `Can I Sue If Pervasive Harassment Forced Me to Quit (Constructive Discharge)?`,
            focus: `Explain constructive termination under Turner v. Anheuser-Busch: working conditions so intolerable that resignation is treated as an illegal firing.`
          },
          {
            question: `How Long Do I Have to File a Workplace Harassment Claim in California?`,
            focus: `Detail the 3-year statute of limitations to file with the CRD under Gov Code § 12960, followed by 1 year to file in Superior Court. Include statutory comparison table.`
          },
          {
            question: `How Much Is a Workplace Harassment Case Worth in California?`,
            focus: `Explain that FEHA has no cap on emotional distress damages, plus economic losses, punitive damages under CC § 3294, and mandatory attorney fees. Conclude with localized CTA.`
          }
        ]
      };

    case "sexual_harassment":
      return {
        topicKey: "sexual_harassment",
        coreStatutes: [
          "FEHA Gov Code § 12940(j) (Strict prohibition of sexual harassment in all California workplaces)",
          "FEHA Gov Code § 12940(k) (Affirmative legal duty to prevent sexual harassment)",
          "Senate Bill 1343 (Mandatory sexual harassment prevention training for all California employers with 5+ employees)",
          "Silenced No More Act (SB 331 / CCP § 1001 & Gov Code § 12964.5) (Prohibition of secret NDAs in sexual harassment settlements)",
          "Federal Speak Out Act (42 U.S.C. § 19401) (Pre-dispute NDAs unenforceable in sexual harassment and assault cases)",
          "State Dept. of Health Services v. Superior Court (2003) (Strict supervisor liability; no Faragher/Ellerth defense in California)",
          "Pantoja v. Anton (2011) (Admissibility of me-too witness evidence in sexual harassment litigation)",
          "Labor Code § 1102.5 & SB 497 (90-day statutory rebuttable presumption of retaliation)"
        ],
        earlyCtaText: `Subjected to unwanted sexual conduct, inappropriate comments, or a hostile work environment in ${city}? That violates California FEHA. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> for a confidential consultation.`,
        midCtaText: `Unwanted sexual advances? Quid pro quo demands? Retaliation for saying no in ${city}? You have protected legal rights. Our ${city} Sexual Harassment Lawyers are ready to fight for your dignity and financial recovery. <a href="tel:8888070077">Call (888) 807-0077</a> for immediate guidance.`,
        closingCtaText: `No worker should have to trade their personal dignity or endure sexual abuse to earn a living. Don’t suffer in silence. <a href="tel:8888070077">Contact Atoyan Law Firm’s ${city} Sexual Harassment team</a> today at (888) 807-0077 for aggressive, confidential representation.`,
        questions: [
          {
            questionNumber: 1,
            heading: `What Qualifies as Unlawful Sexual Harassment Under California Law?`,
            instructions: `Detail California Government Code § 12940(j) and FEHA regulations. Explain that sexual harassment includes unwelcome sexual advances, requests for sexual favors, and other verbal, visual, or physical conduct of a sexual nature. Explain that sexual harassment applies to all California employers regardless of employee count (even 1 employee).`
          },
          {
            questionNumber: 2,
            heading: `What Is Quid Pro Quo Sexual Harassment and How Is It Proven?`,
            instructions: `Examine "quid pro quo" ("this for that") harassment. Detail scenarios where a supervisor, executive, or manager explicitly or implicitly conditions tangible employment benefits (promotions, pay raises, bonuses, favorable shifts, continued employment) on submitting to sexual demands, dates, or romantic advances. Detail that even a single quid pro quo demand establishes complete employer liability.`
          },
          {
            questionNumber: 3,
            heading: `What Constitutes a Hostile Work Environment Based on Sex or Gender in California?`,
            instructions: `Explain hostile work environment sexual harassment under California Senate Bill 1300 and Gov Code § 12923. Detail that conduct must be severe OR pervasive, not both. Explain that conduct does not require physical touching: verbal comments, sexual jokes, graphic descriptions of bodies, inquiries into sex lives, suggestive gestures, and gender-based hostility all qualify.`
          },
          {
            questionNumber: 4,
            heading: `Why Are California Employers Strictly Liable for Supervisor Sexual Misconduct?`,
            instructions: `Detail the landmark California Supreme Court precedent State Dept. of Health Services v. Superior Court (2003). Explain that under California FEHA, employers are strictly liable for sexual harassment committed by supervisors and managing agents. Explain that California law explicitly rejects the federal Faragher/Ellerth defense: an employer cannot escape liability by claiming the victim didn't use an internal complaint procedure.`
          },
          {
            questionNumber: 5,
            heading: `What Are Employers Required to Do Under California Senate Bill 1343 Mandatory Training Laws?`,
            instructions: `Explain California Senate Bill 1343 (Government Code § 12950.1). Detail the legal requirement that all California employers with 5 or more employees must provide at least 2 hours of sexual harassment prevention training to supervisory employees and 1 hour to non-supervisory employees every 2 years. Explain how an employer's failure to provide mandatory training proves corporate negligence under § 12940(k).`
          },
          {
            questionNumber: 6,
            heading: `How Does California's "Silenced No More Act" (SB 331) and the Federal Speak Out Act Protect Victims?`,
            instructions: `Examine California's Silenced No More Act (Senate Bill 331, CCP § 1001 & Gov Code § 12964.5) and the Federal Speak Out Act (42 U.S.C. § 19401). Explain that employers are strictly prohibited from enforcing non-disclosure agreements (NDAs) or non-disparagement clauses that conceal factual information regarding sexual harassment, sexual assault, or workplace discrimination. Victims have the legal right to speak openly.`
          },
          {
            questionNumber: 7,
            heading: `What Are Common Examples of Sexual Harassment in ${city} Workplaces?`,
            instructions: `Provide 6-8 concrete, realistic workplace scenarios typical of employers in ${city} across local hospitality, entertainment, healthcare, technology, corporate offices, and service industries. Address unwanted touching, persistent propositions after rejection, graphic texts or Slack/Teams messages, leering, and retaliatory scheduling. Use subheadings <h3 class="h3dav"> for Physical Misconduct, Verbal & Digital Advances, and Hostile Workplace Retaliation.`
          },
          {
            questionNumber: 8,
            heading: `Does California Law Protect Against Same-Sex Harassment and Gender Identity Misconduct?`,
            instructions: `Detail that under California FEHA, sexual harassment laws protect all workers regardless of sexual orientation, gender identity, or gender expression. Explain that harassment does not require sexual desire; hostility, slurs, or harassment directed at someone because of their sex, non-conforming gender expression, or sexual orientation is strictly unlawful under Gov Code § 12940(j).`
          },
          {
            questionNumber: 9,
            heading: `What Steps Should You Take Immediately If You Experience Sexual Harassment at Work?`,
            instructions: `Provide an actionable guide: clearly stating rejection in writing if safe; preserving all digital evidence (text messages, voicemails, DMs, photos, emails) on personal devices outside corporate servers; maintaining a contemporaneous diary; reporting the conduct to HR or executive management in writing via trackable email; consulting an attorney before signing any severance or release.`
          },
          {
            questionNumber: 10,
            heading: `Can Your Employer Retaliate or Fire You for Reporting Sexual Harassment?`,
            instructions: `Detail workplace retaliation protections under California Gov Code § 12940(h) and Labor Code § 1102.5. Detail adverse actions: retaliatory demotions, shift cuts, disciplinary write-ups, or termination. Detail California Senate Bill 497 (effective Jan 1, 2024), which establishes a statutory 90-day rebuttable presumption of retaliation.`
          },
          {
            questionNumber: 11,
            heading: `How Do Digital Forensics and "Me-Too" Evidence Win Sexual Harassment Lawsuits?`,
            instructions: `Explain how sexual harassment claims are proven through electronic discovery: Slack/Teams messages, text message threads, cell phone records, and email timestamps. Detail the admissibility of "me-too" witness evidence under Pantoja v. Anton (2011) and Johnson v. United Cerebral Palsy (2009), showing a pattern of harassing behavior toward other employees.`
          },
          {
            questionNumber: 12,
            heading: `What Are the Deadlines to File a Sexual Harassment Lawsuit in California?`,
            instructions: `Detail California Government Code § 12960 administrative exhaustion: employees have 3 years from the date of the unlawful conduct to file a complaint with the California Civil Rights Department (CRD), followed by 1 year from the issuance of a Right-to-Sue notice to file in California Superior Court.`
          },
          {
            questionNumber: 13,
            heading: `What Financial Damages and Recovery Can You Obtain in a Sexual Harassment Lawsuit?`,
            instructions: `Detail full financial recovery under California law: past and future lost wages and benefits (back pay and front pay); emotional distress damages for psychological trauma, anxiety, depression, and therapy expenses (with NO statutory caps under FEHA); punitive damages under California Civil Code § 3294 for corporate malice; and mandatory statutory attorney fees under Gov Code § 12965.`
          },
          {
            questionNumber: 14,
            heading: `Why Choose Atoyan Law Firm for Confidential, Aggressive Sexual Harassment Advocacy in ${city}?`,
            instructions: `Highlight Atoyan Law Firm's compassionate, trauma-informed approach paired with an aggressive litigation posture: strict client confidentiality, no recovery/no fee contingency representation, comprehensive digital evidence preservation, and fearless courtroom advocacy against corporate defense firms.`
          }
        ],
        faqs: [
          {
            question: `What Qualifies as Sexual Harassment in the Workplace Under California Law?`,
            focus: `Explain FEHA Gov Code § 12940(j), defining quid pro quo and hostile work environment sexual harassment, unwelcome advances, and gender hostility.`
          },
          {
            question: `What Are Common Examples of Sexual Harassment at Work?`,
            focus: `Detail verbal misconduct, physical touching, visual/digital harassment, and quid pro quo propositions.`
          },
          {
            question: `Can I Sue My Employer for Sexual Harassment in ${city}?`,
            focus: `Explain that California anti-harassment laws apply to all employers (even with 1 employee), and management can be held liable in Superior Court.`
          },
          {
            question: `Can My Employer Fire Me for Reporting Sexual Harassment?`,
            focus: `Explain unlawful retaliation under Gov Code § 12940(h) and wrongful termination in violation of public policy.`
          },
          {
            question: `What Is California Senate Bill 497's 90-Day Retaliation Presumption?`,
            focus: `Detail the statutory presumption that adverse employment actions within 90 days of reporting harassment are retaliatory.`
          },
          {
            question: `What Evidence Do I Need to Prove a Sexual Harassment Lawsuit?`,
            focus: `Detail digital communications, contemporaneous notes, HR reports, witness testimony, and me-too evidence under Pantoja v. Anton.`
          },
          {
            question: `Why Is an Employer Strictly Liable for Supervisor Harassment in California?`,
            focus: `Explain State Dept. of Health Services: strict liability without the federal Faragher/Ellerth defense.`
          },
          {
            question: `Can My Employer Force Me to Sign a Non-Disclosure Agreement (NDA)?`,
            focus: `Explain the Silenced No More Act (SB 331) and Federal Speak Out Act banning secret NDAs for sexual harassment.`
          },
          {
            question: `How Long Do I Have to File a Sexual Harassment Lawsuit in California?`,
            focus: `Detail the 3-year CRD statute of limitations under Gov Code § 12960 and 1-year Right-to-Sue window. Include statutory comparison table.`
          },
          {
            question: `How Much Is a Sexual Harassment Case Worth in California?`,
            focus: `Explain uncapped emotional distress damages under FEHA, lost wages, psychiatric care, punitive damages under CC § 3294, and mandatory attorney fees. Conclude with localized CTA.`
          }
        ]
      };

    case "wrongful_termination":
    default:
      return {
        topicKey: "wrongful_termination",
        coreStatutes: [
          "California Labor Code § 2922 (Exceptions to at-will employment)",
          "Tameny v. Atlantic Richfield Co. (1980) (Wrongful termination in violation of public policy)",
          "California Labor Code § 1102.5 (Whistleblower protections against retaliatory discharge)",
          "California Senate Bill 497 (90-day statutory rebuttable presumption of retaliation)",
          "Turner v. Anheuser-Busch, Inc. (1994) (Constructive discharge doctrine)",
          "Guz v. Bechtel National, Inc. (2000) (Burden-shifting framework and pretext analysis)",
          "Labor Code § 1171.5 (Undocumented worker protections)"
        ],
        earlyCtaText: `Were you fired abruptly, unfairly, or in retaliation in ${city}? That may be wrongful termination under California law. Call Atoyan Law at <a href="tel:8888070077">(888) 807-0077</a> or <a href="/contact/">contact us online</a> for a free, confidential consultation.`,
        midCtaText: `Facing a sudden termination, bogus disciplinary write-up, or retaliatory firing in ${city}? You have protected rights under California labor statutes. Our ${city} Wrongful Termination Lawyers are ready to fight for you. <a href="tel:8888070077">Call (888) 807-0077</a> today.`,
        closingCtaText: `An unlawful firing can derail your financial security and career. Don’t let your former employer violate your rights with impunity. <a href="tel:8888070077">Contact Atoyan Law Firm’s ${city} Wrongful Termination team</a> today at (888) 807-0077 for a full case review.`,
        questions: [
          {
            questionNumber: 1,
            heading: `What Qualifies as Wrongful Termination Under California Law?`,
            instructions: `Explain the exceptions to at-will employment under California Labor Code § 2922. Detail Tameny v. Atlantic Richfield Co. (1980) public policy exceptions: employers cannot fire workers for exercising statutory rights, refusing to commit illegal acts, reporting violations of law, or based on protected classifications under FEHA.`
          },
          {
            questionNumber: 2,
            heading: `What Public Policies Protect California Employees from Being Fired?`,
            instructions: `Break down established California public policy protections: reporting wage theft or safety violations (Cal/OSHA), blowing the whistle on illegal corporate conduct (Labor Code § 1102.5), taking protected medical or family leave (CFRA/FMLA), requesting disability accommodations, serving on a jury, or filing a workers' comp claim.`
          },
          {
            questionNumber: 3,
            heading: `What Is Constructive Discharge and Can You Sue If You Were Forced to Resign?`,
            instructions: `Detail the constructive termination doctrine under Turner v. Anheuser-Busch, Inc. Explain that when an employer deliberately creates or knowingly permits working conditions so intolerable that any reasonable person would feel compelled to quit, California law treats that resignation as an unlawful termination with full damages.`
          },
          {
            questionNumber: 4,
            heading: `How Do California Employers Use Bogus PIPs to Mask Unlawful Firings?`,
            instructions: `Examine employer pretext under Guz v. Bechtel National. Explain how employers manufacture paper trails through weaponized Performance Improvement Plans (PIPs), sudden negative reviews, and shifting explanations. Explain how inconsistent timelines and disparate treatment expose employer pretext in court.`
          },
          {
            questionNumber: 5,
            heading: `What Are Common Examples of Wrongful Termination in ${city} Workplaces?`,
            instructions: `Provide 6-8 realistic wrongful termination scenarios across local ${city} employers in healthcare, warehousing, professional services, retail, and tech. Detail firings following injury reports, wage complaints, pregnancy disclosures, and medical leave requests. Use subheadings <h3 class="h3dav"> for Retaliatory Firings, Discriminatory Terminations, and Public Policy Violations.`
          },
          {
            questionNumber: 6,
            heading: `How Does California Labor Code § 1102.5 Protect Whistleblowers from Retaliatory Discharge?`,
            instructions: `Analyze California Labor Code § 1102.5. Explain that employees who disclose suspected legal violations to a supervisor, government agency, or public body are protected from discharge. Detail the burden-shifting standard under Lawson v. PPG Architectural Finishes, where the employer must prove by clear and convincing evidence that the firing would have occurred anyway.`
          },
          {
            questionNumber: 7,
            heading: `How Does California Senate Bill 497's 90-Day Retaliation Presumption Apply?`,
            instructions: `Detail California Senate Bill 497 (effective Jan 1, 2024). Explain that if an employer terminates or takes adverse action against an employee within 90 days of engaging in protected activity, the law establishes a rebuttable presumption of unlawful retaliation.`
          },
          {
            questionNumber: 8,
            heading: `Can an Employer Fire You for Taking Protected Medical or Family Leave (CFRA/FMLA)?`,
            instructions: `Detail the job restoration guarantees of the California Family Rights Act (CFRA) and federal FMLA. Explain that employers are strictly prohibited from terminating workers for exercising their rights to take medical leave, bond with a newborn, or care for a sick family member.`
          },
          {
            questionNumber: 9,
            heading: `What Steps Should You Take Immediately After Being Wrongfully Fired?`,
            instructions: `Provide an actionable guide: demanding personnel records under Labor Code § 1198.5; requesting complete payroll records under § 226; avoiding signing severance releases under California Civil Code § 1542 before legal review; preserving emails and performance records; applying for EDD unemployment benefits.`
          },
          {
            questionNumber: 10,
            heading: `Can Immigrant and Undocumented Workers Sue for Wrongful Termination in California?`,
            instructions: `Detail California Labor Code § 1171.5 and Labor Code § 244, emphasizing that immigration status is completely inadmissible in California employment lawsuits and employers cannot threaten immigration status to evade liability.`
          },
          {
            questionNumber: 11,
            heading: `What Are the Critical Statutes of Limitations and Deadlines for Wrongful Termination?`,
            instructions: `Detail California filing deadlines: FEHA claims (3 years with CRD + 1 year from Right-to-Sue), Whistleblower Labor Code § 1102.5 (3 years), Tameny public policy tort claims (2 years), Breach of contract claims (2-4 years), and public entity claims under Gov Code § 911.2 (strict 6-month deadline).`
          },
          {
            questionNumber: 12,
            heading: `What Financial Compensation Can You Recover for Wrongful Termination in ${city}?`,
            instructions: `Detail recoverable damages: past lost wages (back pay), future lost earnings (front pay), lost healthcare/retirement benefits, uncapped emotional distress damages under FEHA, punitive damages under Civil Code § 3294, and mandatory statutory attorney fees.`
          },
          {
            questionNumber: 13,
            heading: `How Do Employment Attorneys Prove Employer Pretext in California Superior Court?`,
            instructions: `Explain circumstantial evidence, comparative employee discipline, temporal proximity, and contradictory employer testimony obtained during depositions.`
          },
          {
            questionNumber: 14,
            heading: `Why Choose Atoyan Law Firm for Your Wrongful Termination Claim in ${city}?`,
            instructions: `Highlight Atoyan Law Firm's contingency fee representation (no recovery, no fees), trial experience, and dedication to protecting California workers against corporate defense firms.`
          }
        ],
        faqs: [
          {
            question: `What Qualifies as Wrongful Termination Under California Law?`,
            focus: `Explain Tameny exceptions to at-will employment, public policy violations, and FEHA protections.`
          },
          {
            question: `Can I Sue for Wrongful Termination If I Was an At-Will Employee?`,
            focus: `Explain that at-will employment does not permit illegal firings based on discrimination, retaliation, or public policy violations.`
          },
          {
            question: `Can My Employer Fire Me for Reporting Illegal Conduct or Safety Issues?`,
            focus: `Detail California Labor Code § 1102.5 whistleblower protections and Lawson v. PPG standards.`
          },
          {
            question: `What Is the 90-Day Retaliation Presumption Under California Senate Bill 497?`,
            focus: `Explain that firings within 90 days of protected complaints are legally presumed retaliatory under SB 497.`
          },
          {
            question: `Can I Sue If My Employer Forced Me to Quit (Constructive Termination)?`,
            focus: `Explain the legal standard for constructive discharge under Turner v. Anheuser-Busch.`
          },
          {
            question: `Should I Sign a Severance Agreement After Being Fired?`,
            focus: `Warn workers about broad releases under Civil Code § 1542 and explain why attorney review is essential before signing.`
          },
          {
            question: `What Evidence Do I Need to Prove a Wrongful Termination Lawsuit?`,
            focus: `Detail personnel files, positive past reviews, comparator evidence, and email trails.`
          },
          {
            question: `Can Undocumented Workers Sue for Wrongful Termination in California?`,
            focus: `Detail Labor Code § 1171.5 guaranteeing full remedies regardless of immigration status.`
          },
          {
            question: `How Long Do I Have to File a Wrongful Termination Lawsuit in California?`,
            focus: `Detail 3-year FEHA/whistleblower deadlines and 2-year Tameny tort deadlines. Include statutory comparison table.`
          },
          {
            question: `How Much Is a Wrongful Termination Case Worth in California?`,
            focus: `Explain back pay, front pay, emotional distress, punitive damages under CC § 3294, and statutory attorney fees. Conclude with localized CTA.`
          }
        ]
      };
  }
}

/**
 * Topic-Specific Enrichment Modules
 * 
 * Replaces static generic boilerplate (buildEvidentiaryDeepDive & buildCorporateDefensePlaybook)
 * with 100% domain-specific statutory analysis tailored to each legal category.
 */
export function getTopicEnrichmentModules(
  topicKey: string,
  cleanTopic: string,
  city: string,
): string[] {
  switch (topicKey) {
    case "workplace_harassment":
      return [
        `
<h2 class="h2dav">Proving Hostile Work Environment Under California Government Code § 12940(j)</h2>

Under California's Fair Employment and Housing Act (FEHA), non-sexual workplace harassment encompasses hostility directed at employees based on protected personal characteristics, including race, religious creed, color, national origin, ancestry, physical disability, mental disability, medical condition, genetic information, marital status, gender identity, gender expression, age (40 and over), sexual orientation, or military and veteran status.

In ${city} workplaces, unlawful harassment does not require physical violence. Under California Government Code § 12923 (enacted through landmark California Senate Bill 1300), California law explicitly rejected federal standards that set an excessively high bar for proving a hostile work environment. Under current California law:

<h3 class="h3dav">1. The "Severe or Pervasive" Legal Disjunction</h3>
California law does NOT require that harassing conduct be both severe AND pervasive. The statutory standard is disjunctive: conduct must be severe <strong>OR</strong> pervasive. A series of persistent offensive comments, slurs, or exclusionary acts over time satisfies the pervasiveness prong. Conversely, under <em>Dee v. Vintage Petroleum, Inc.</em> (2003) and <em>Roby v. McKesson Corp.</em> (2009), a <strong>single egregious incident</strong>—such as an explicit racial epithet or physical threat—is legally sufficient to create an actionable hostile work environment.

<h3 class="h3dav">2. The Subjective and Objective Standard</h3>
To prevail in a workplace harassment lawsuit in California Superior Court, an employee must satisfy two perspectives:
<ul>
  <li><strong>Subjective Hostility</strong>: The worker personally perceived the work environment to be hostile, intimidating, abusive, or offensive, causing emotional distress or impairing their ability to perform their job duties.</li>
  <li><strong>Objective Hostility</strong>: A reasonable person in the employee's exact circumstances, sharing the employee's protected characteristic, would have found the environment hostile, intimidating, or abusive.</li>
</ul>

<h3 class="h3dav">3. Distinguishing Unlawful Harassment from Routine Personnel Actions</h3>
In <em>Reno v. Baird</em> (1998) and <em>Janken v. GM Hughes Electronics</em> (1996), the California Supreme Court established the critical distinction between workplace discrimination and workplace harassment. Discrimination arises from official managerial personnel decisions—such as hiring, firing, job assignments, scheduling, or promotions. In contrast, harassment consists of conduct outside the necessary scope of job performance—such as verbal epithets, derogatory mocking, personal degradation, and workplace sabotage. Even if a supervisor claims they were merely "managing performance," abusive or derogatory hostility directed at a protected worker constitutes actionable harassment under FEHA.
`.trim(),

        `
<h2 class="h2dav">Employer Liability and Failure to Prevent Harassment Under FEHA § 12940(k)</h2>

California employment law imposes strict standards of accountability on employers when workplace harassment occurs. The legal framework governing liability in ${city} employment disputes depends on the institutional role of the perpetrator:

<h3 class="h3dav">1. Strict Liability for Supervisor Harassment</h3>
Under California Government Code § 12940(j)(1) and the landmark California Supreme Court ruling in <em>State Department of Health Services v. Superior Court</em> (2003), California employers are <strong>strictly liable</strong> for harassment committed by their supervisors and managing agents. 

Unlike federal law under Title VII, California law explicitly rejects the <em>Faragher/Ellerth</em> affirmative defense. An employer cannot avoid liability by claiming that executive leadership was unaware of the supervisor's actions or that the employee failed to exhaust internal HR reporting procedures. If an individual with supervisory authority engages in harassment, the employer is legally and financially responsible from the very first incident.

<h3 class="h3dav">2. Negligence Liability for Coworker and Third-Party Harassment</h3>
When harassment is perpetrated by non-supervisory coworkers, independent contractors, vendors, clients, or customers, the employer is liable under a negligence standard. Under California Government Code § 12940(j)(1), the employer is liable if management, human resources, or any supervisory employee <strong>knew or should have known</strong> of the conduct and failed to take immediate and appropriate corrective action.

Employers cannot escape responsibility by claiming that a customer or client is "too valuable to confront." California law obligates businesses in ${city} to protect their employees from third-party hostility and customer abuse.

<h3 class="h3dav">3. Standalone Liability for "Failure to Prevent" Under Gov Code § 12940(k)</h3>
Under California Government Code § 12940(k), it is an independent, actionable violation of civil rights for an employer to fail to take all reasonable steps necessary to prevent harassment and discrimination from occurring. Employers breach § 12940(k) when they:
<ul>
  <li>Fail to establish, distribute, and enforce clear, comprehensive written anti-harassment policies in languages understood by employees.</li>
  <li>Fail to conduct mandatory anti-harassment and abusive conduct training under California AB 2053 and SB 1343.</li>
  <li>Conduct biased, superficial, or conflicted internal HR investigations designed to protect corporate managers rather than uncover the truth.</li>
  <li>Dismiss employee complaints as "interpersonal friction" or advise targeted employees to "grow thicker skin."</li>
</ul>

<h3 class="h3dav">4. Constructive Discharge: When Pervasive Harassment Forces You to Quit</h3>
Under <em>Turner v. Anheuser-Busch, Inc.</em> (1994), when an employer deliberately permits working conditions that are so intolerable, toxic, and hostile that a reasonable employee would feel compelled to resign, California law treats that resignation as an unlawful termination. Workers forced out by severe workplace harassment in ${city} can pursue full economic damages, including past back pay and future front pay.
`.trim()
      ];

    case "sexual_harassment":
      return [
        `
<h2 class="h2dav">California Statutory Protections Against Quid Pro Quo and Hostile Sexual Conduct</h2>

California maintains the most stringent sexual harassment protections in the United States. Under California Government Code § 12940(j), sexual harassment in the workplace is strictly prohibited across all private, non-profit, and public employers, regardless of size—applying even to businesses with only a single employee.

In ${city} employment disputes, California law recognizes two foundational forms of actionable sexual misconduct:

<h3 class="h3dav">1. Quid Pro Quo Sexual Harassment</h3>
Quid pro quo ("this for that") harassment occurs when a supervisor, manager, or executive explicitly or implicitly conditions employment terms, pay raises, promotions, shift assignments, or continued job security on submitting to sexual demands, romantic dates, or physical advances. Under California law, a single instance of quid pro quo extortion creates immediate, strict corporate liability. The employee does not need to prove that the conduct was pervasive; the coercive abuse of managerial authority itself establishes liability.

<h3 class="h3dav">2. Hostile Work Environment Based on Sex or Gender</h3>
Hostile work environment sexual harassment occurs when an employee is subjected to unwelcome sexual or gender-based conduct that alters working conditions. Under California Senate Bill 1300 and Government Code § 12923:
<ul>
  <li>Physical touching is not required. Verbal comments, sexual jokes, inappropriate inquiries into personal sex lives, graphic text messages, and gender-based insults all qualify.</li>
  <li>Conduct must be severe <strong>OR</strong> pervasive. A single severe incident or a continuing pattern of lower-level hostility is legally sufficient.</li>
  <li>Same-sex sexual harassment is fully actionable. Harassment does not require sexual desire; hostility directed at an employee due to non-conforming gender expression or sexual orientation violates FEHA.</li>
</ul>

<h3 class="h3dav">3. Supervisor Strict Liability Under California Law</h3>
Under the landmark California Supreme Court decision <em>State Department of Health Services v. Superior Court</em> (2003), employers in California are strictly liable for sexual harassment committed by supervisors. California courts reject the federal <em>Faragher/Ellerth</em> defense: an employer cannot shield itself by claiming the employee failed to use internal corporate hotlines.
`.trim(),

        `
<h2 class="h2dav">Overcoming Secret NDAs Under California’s Silenced No More Act (SB 331) and Speak Out Act</h2>

For decades, corporate employers in California used non-disclosure agreements (NDAs) and confidentiality clauses in severance packages to conceal patterns of sexual harassment and protect serial predators. In recent years, California and federal lawmakers enacted historic legislation to dismantle corporate secrecy:

<h3 class="h3dav">1. The Silenced No More Act (Senate Bill 331)</h3>
Effective January 1, 2022, California's Silenced No More Act (codified at California Code of Civil Procedure § 1001 and Government Code § 12964.5) dramatically expanded protections for California workers:
<ul>
  <li>Employers are strictly prohibited from requiring employees to sign non-disclosure agreements or non-disparagement agreements that restrict their legal right to disclose factual information about sexual harassment, sexual assault, workplace discrimination, or retaliation.</li>
  <li>Any employment agreement, severance agreement, or settlement contract that attempts to muzzle an employee regarding unlawful workplace harassment is void and unenforceable as against California public policy.</li>
  <li>Workers have the absolute right to consult with an independent employment attorney before signing any severance or release document.</li>
</ul>

<h3 class="h3dav">2. The Federal Speak Out Act (42 U.S.C. § 19401)</h3>
Enacted by Congress in 2022, the Federal Speak Out Act prohibits the enforcement of pre-dispute non-disclosure and non-disparagement clauses in cases involving sexual assault or sexual harassment. Any clause signed upon hire attempting to waive a worker's right to speak out about sexual misconduct is legally invalid under federal law.

<h3 class="h3dav">3. Admissibility of "Me-Too" Evidence Under California Precedent</h3>
In California sexual harassment litigation, corporate defense counsel routinely argues that an incident was an "isolated misunderstanding." Under the California Supreme Court decision in <em>Pantoja v. Anton</em> (2011) and <em>Johnson v. United Cerebral Palsy of Greater Los Angeles</em> (2009), testimony from other current or former employees who were subjected to similar sexual harassment or misconduct by the same perpetrator is fully admissible as "me-too" evidence to prove corporate motive, discriminatory intent, and a hostile workplace environment.
`.trim()
      ];

    case "wrongful_termination":
    default:
      return [
        `
<h2 class="h2dav">Tameny Public Policy Doctrines and Whistleblower Retaliation Under Labor Code § 1102.5</h2>

While California Labor Code § 2922 establishes a general presumption of at-will employment, this rule is strictly bounded by state public policy. In the landmark decision <em>Tameny v. Atlantic Richfield Co.</em> (1980), the California Supreme Court established that an employer cannot terminate an employee in violation of a fundamental public policy rooted in California constitutional or statutory law.

In ${city} wrongful termination litigation, actionable public policy claims commonly arise from:

<h3 class="h3dav">1. Whistleblower Retaliation Under California Labor Code § 1102.5</h3>
California Labor Code § 1102.5 is among the most protective whistleblower statutes in the nation. It prohibits employers from retaliating against an employee who discloses suspected violations of state, federal, or local law to a government agency, law enforcement, or internally to a supervisor. Under <em>Lawson v. PPG Architectural Finishes, Inc.</em> (2022), the California Supreme Court confirmed a plaintiff-friendly standard: once an employee shows their whistleblowing was a contributing factor in their firing, the employer must prove by <strong>clear and convincing evidence</strong> that it would have made the same decision anyway.

<h3 class="h3dav">2. California Senate Bill 497: The 90-Day Retaliation Presumption</h3>
Effective January 1, 2024, California Senate Bill 497 amended California Labor Code §§ 98.6 and 1102.5 to establish a statutory <strong>rebuttable presumption of retaliation</strong>. If an employer discharges, demotes, disciplines, or takes adverse action against an employee within 90 days of the employee exercising protected rights (such as complaining about wage theft, safety issues, or discrimination), California law presumes the action was retaliatory.
`.trim(),

        `
<h2 class="h2dav">Dismantling Pretextual Disciplinary Actions and Bogus PIPs in California Courts</h2>

When terminating workers for unlawful reasons, corporate employers in ${city} rarely confess their true motives. Instead, human resources departments and corporate defense counsel manufacture elaborate pretextual explanations designed to shield the corporation from liability.

<h3 class="h3dav">1. Exposing Corporate Pretext Under the McDonnell Douglas Framework</h3>
Under California law (<em>Guz v. Bechtel National, Inc.</em>), once an employee presents a prima facie case of wrongful termination and the employer articulates a purported "legitimate business reason," the employee can prove liability by demonstrating that the employer's stated reason is false, inconsistent, or a pretext for unlawful retaliation. Common hallmarks of pretext include:
<ul>
  <li><strong>Weaponized Performance Improvement Plans (PIPs)</strong>: Setting impossible performance metrics with arbitrary deadlines immediately following a protected complaint.</li>
  <li><strong>Sudden Negative Reviews Following Years of Excellence</strong>: Fabricating disciplinary infractions against an employee who consistently received positive evaluations, raises, or commendations.</li>
  <li><strong>Disparate Enforcement of Company Policies</strong>: Punishing a targeted worker for minor attendance or clerical errors while ignoring identical conduct by coworkers who did not engage in protected activity.</li>
  <li><strong>Shifting and Contradictory Explanations</strong>: Altering the official reason for termination between the initial HR exit interview, EDD unemployment responses, and court filings.</li>
</ul>

<h3 class="h3dav">2. Protection for Undocumented Workers Under Labor Code § 1171.5</h3>
California Labor Code § 1171.5 explicitly mandates that all statutory protections, labor remedies, and civil rights apply to all California workers regardless of immigration status. Furthermore, California Labor Code § 244 makes it an unlawful practice and civil extortion for an employer to threaten to report a worker's immigration status because the worker exercised rights under the Labor Code.
`.trim()
      ];
  }
}
