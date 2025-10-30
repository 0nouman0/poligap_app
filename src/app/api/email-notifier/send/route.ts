import { NextResponse } from "next/server";

// Simple email template mapping matching the frontend options
const TEMPLATE_MAP: Record<string, { subject: string; body: string }> = {
  policy_changes: {
    subject: "Important: Policy Changes",
    body: "We have updated our policies. Please review the changes at your earliest convenience.",
  },
  terms_updates: {
    subject: "Update: Terms & Conditions",
    body: "Our Terms & Conditions have been updated. Visit your account to read the new terms.",
  },
  feature_launch: {
    subject: "New Feature Launch 🚀",
    body: "We're excited to announce a new feature now available in your workspace.",
  },
  maintenance: {
    subject: "Scheduled Maintenance",
    body:
      "We will perform scheduled maintenance during the listed window. During this time some features may be intermittently unavailable — we expect the window to last approximately 60 minutes.\n\nWhat to expect:\n- Read-only access to some dashboards during the window.\n- Short interruptions to background processing and notifications.\n\nIf you rely on scheduled tasks, please plan accordingly. We will post updates to the system status page and notify you once maintenance completes.",
  },
  downtime: {
    subject: "Incident: Service Downtime",
    body:
      "We experienced a service interruption affecting parts of the platform. Our engineering team identified the root cause and applied a fix; services have been restored.\n\nWhat happened:\n- Impact: brief interruption to API responses and background jobs between [start-time] and [end-time].\n- Cause: [short root cause summary].\n- Resolution: services have been verified and monitoring is stable.\n\nIf you continue to see issues, please reply to this message or open a support ticket and include any relevant logs.",
  },
  security: {
    subject: "Security Advisory",
    body:
      "We have released a security-related update that may require your attention. This update addresses [brief summary of vulnerability or change].\n\nRecommended actions:\n1) Review the advisory details in the security center.\n2) If you are using integrations that store credentials, rotate any affected keys.\n3) Apply any required configuration changes listed in the advisory.\n\nWe take security seriously — if you have questions, contact our security team at security@example.com.",
  },
  newsletter: {
    subject: "Monthly Newsletter",
    body:
      "Welcome to our monthly product newsletter. In this edition we cover: major product updates, useful tips to improve your workflow, and upcoming events.\n\nHighlights:\n- New Feature: [feature name] — briefly describe benefit.\n- Tip: how to get more value from [feature].\n- Events: upcoming webinar and office hours.\n\nRead the full newsletter in your dashboard for detailed walkthroughs and links to resources.",
  },
  promotion: {
    subject: "Limited-time Promotion",
    body:
      "We’re offering a limited-time promotion to help you get more value from the platform. For the next 14 days you can upgrade to [plan name] at a discounted rate and receive priority onboarding.\n\nHow to claim:\n1) Visit your Billing page.\n2) Click ‘Upgrade’ and apply the promo code: PROMO2025.\n\nIf you’d like a demo of plan features, reply to this email and we’ll schedule a walkthrough.",
  },
  survey: {
    subject: "We value your feedback",
    body:
      "Your feedback helps us improve. Please take 3–5 minutes to complete a short survey about your experience with the platform.\n\nWhat we ask:\n- What worked well for you?\n- What could be improved?\n- Which features would you like next?\n\nComplete the survey here: [survey link]. As a thank-you we’ll enter respondents into a small prize draw.",
  },
  webinar: {
    subject: "You're invited: Webinar",
    body:
      "Join our upcoming webinar where our product team will demo [feature] and answer live questions.\n\nWebinar details:\n- Date & Time: [date/time] (your timezone).\n- Topics: product demo, best practices, live Q&A.\n- How to join: register using the link below and we’ll email you the access details.\n\nRegister here: [registration link]. We look forward to your questions during the session.",
  },
  billing: {
    subject: "Billing Update",
    body:
      "There has been an update to your billing or invoice. Please review the following summary and log in to your account for the full invoice and billing history.\n\nSummary:\n- Period: [period dates]\n- Amount: [amount]\n- Due date: [due date]\n\nIf you believe this is an error, please contact billing@example.com with your account ID.",
  },
};

function isEmail(str: string) {
  return /.+@.+\..+/.test(str);
}

export async function POST(req: Request) {
  try {
    const { recipients, actionType } = (await req.json()) as {
      recipients?: string[];
      actionType?: string;
    };

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: "recipients must be an array" }, { status: 400 });
    }
    const validRecipients = Array.from(new Set(recipients.filter((e) => typeof e === "string" && isEmail(e))));
    if (validRecipients.length === 0) {
      return NextResponse.json({ error: "no valid recipients provided" }, { status: 400 });
    }

    const template = TEMPLATE_MAP[actionType || ""] || TEMPLATE_MAP["policy_changes"];

    // Simulate async bulk email send; in real impl, integrate with provider like SES/Sendgrid
    let sent = 0;
    let failed = 0;
    await Promise.all(
      validRecipients.map(async (to) => {
        // simulate random delivery outcome
        const ok = Math.random() > 0.02; // ~98% success
        await new Promise((r) => setTimeout(r, 5));
        if (ok) sent++; else failed++;
        // Here you would call the provider API with { to, subject: template.subject, body: template.body }
      })
    );

    return NextResponse.json({ ok: true, sent, failed, template: { subject: template.subject } });
  } catch (err) {
    console.error("/api/email-notifier/send error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
