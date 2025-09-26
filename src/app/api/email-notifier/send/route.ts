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
  maintenance: { subject: "Scheduled Maintenance", body: "We will perform scheduled maintenance during the listed window." },
  downtime: { subject: "Incident: Service Downtime", body: "We experienced downtime. The issue has been resolved. Details inside." },
  security: { subject: "Security Advisory", body: "A security-related update requires your attention." },
  newsletter: { subject: "Monthly Newsletter", body: "Catch up on product updates, tips, and resources." },
  promotion: { subject: "Limited-time Promotion", body: "Unlock special discounts available for a short time." },
  survey: { subject: "We value your feedback", body: "Please take a quick survey to help us improve." },
  webinar: { subject: "You're invited: Webinar", body: "Join our upcoming webinar. Save your seat now!" },
  billing: { subject: "Billing Update", body: "There has been an update to your billing information or invoice." },
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
