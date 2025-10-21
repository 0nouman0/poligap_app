import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

// TTL for re-sending invites (in seconds). For example 24 hours = 86400
const RESEND_TTL_SECONDS = 60 * 60 * 24;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role = "user" } = body || {};
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = createClient();

    // Look for existing invitation by email (case-insensitive)
    const { data: existing, error: selErr } = await supabase
      .from("invitations")
      .select("id,email,role,token,sent_at,created_at")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (selErr) throw selErr;

    const now = new Date();

    if (existing) {
      // If already sent recently, do not resend
      if (existing.sent_at) {
        const sentAt = new Date(existing.sent_at);
        const secondsSince = (now.getTime() - sentAt.getTime()) / 1000;
        if (secondsSince < RESEND_TTL_SECONDS) {
          return NextResponse.json({ status: "skipped", reason: "recently_sent" }, { status: 200 });
        }
      }

      // Update role if changed, generate a new token
      const newToken = crypto.randomUUID();
      const { error: updErr } = await supabase
        .from("invitations")
        .update({ role, token: newToken })
        .eq("id", existing.id);
      if (updErr) throw updErr;

  // send invite via Supabase Edge Function if configured, otherwise fallback to local stub
  await callSendInviteFunction(email, newToken);

      // mark sent_at
      const { error: sentErr } = await supabase
        .from("invitations")
        .update({ sent_at: now.toISOString() })
        .eq("id", existing.id);
      if (sentErr) throw sentErr;

      return NextResponse.json({ status: "sent", id: existing.id }, { status: 200 });
    }

    // No existing invitation - insert a new one
    const token = crypto.randomUUID();
    const payload = { email: email.toLowerCase(), role, token, sent_at: now.toISOString() };
    const { data, error: insErr } = await supabase.from("invitations").insert([payload]).select().single();
    if (insErr) throw insErr;

  // send invite via Supabase Edge Function if configured, otherwise fallback to local stub
  await callSendInviteFunction(email, token);

    return NextResponse.json({ status: "sent", id: data.id }, { status: 201 });
  } catch (e: any) {
    console.error("/api/invite error", e);
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}

async function sendInviteEmail(email: string, token: string) {
  // TODO: Replace this stub with a real email service (SendGrid, SES, etc.)
  // The function should send an email with a link like `${APP_URL}/accept-invite?token=${token}`
  console.log("[invite] would send email to", email, "token", token);
  // Simulate async delay
  await new Promise((r) => setTimeout(r, 200));
}

async function callSendInviteFunction(email: string, token: string) {
  try {
    const fnUrl = process.env.SUPABASE_FUNCTIONS_URL; // e.g. https://<project>.functions.supabase.co
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // optional; only needed if function requires it
    if (!fnUrl) {
      // fall back to local stub
      return sendInviteEmail(email, token);
    }

    const url = `${fnUrl.replace(/\/$/, "")}/send-invite`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(serviceKey ? { "Authorization": `Bearer ${serviceKey}` } : {}),
      },
      body: JSON.stringify({ email, token, appUrl: process.env.APP_URL || undefined }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("[invite] functions.send-invite failed", resp.status, text);
      // still return; do not block invite creation
    }
  } catch (err) {
    console.error("[invite] callSendInviteFunction error", err);
  }
}
