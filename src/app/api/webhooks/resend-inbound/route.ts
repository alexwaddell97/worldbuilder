import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Resend } from "resend";
import { APP_DOMAIN } from "@/config/app";

const resend = new Resend(process.env.RESEND_API_KEY!);
const SECURITY_ADDRESS = `security@${APP_DOMAIN}`;
const FORWARD_TO = "alexander.waddell1997@gmail.com";

// Resend's inbound MX is domain-wide, so this webhook fires for every
// address at APP_DOMAIN — only security@ reports get forwarded on.
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const { email_id, to } = event.data;
  if (!to.some((address) => address.toLowerCase() === SECURITY_ADDRESS)) {
    return NextResponse.json({ received: true });
  }

  const { error } = await resend.emails.receiving.forward({
    emailId: email_id,
    to: FORWARD_TO,
    from: SECURITY_ADDRESS,
  });

  if (error) {
    console.error("Failed to forward security report:", error);
    return NextResponse.json({ error: "Forward failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
