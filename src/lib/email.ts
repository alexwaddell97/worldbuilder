import { Resend } from "resend";
import { APP_NAME } from "@/config/app";

const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Validates that the URL belongs to the expected origin and encodes HTML
 * special characters to prevent injection via crafted URLs.
 */
function safeHref(url: string, expectedOrigin: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== expectedOrigin) {
      throw new Error(`Unexpected origin: ${parsed.origin}`);
    }
    return url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  } catch (err) {
    throw new Error(`sendVerificationEmail: invalid url: ${url} — ${err instanceof Error ? err.message : err}`);
  }
}

export async function sendVerificationEmail(email: string, url: string): Promise<void> {
  const expectedOrigin = `https://${process.env.APP_DOMAIN ?? "subcreation.app"}`;
  const safeUrl = safeHref(url, expectedOrigin);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: `Verify your ${APP_NAME} account`,
    html: `
      <p>Thanks for signing up for ${APP_NAME}.</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${safeUrl}">Verify email</a></p>
      <p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
