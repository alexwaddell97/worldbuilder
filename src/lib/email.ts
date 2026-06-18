import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendVerificationEmail(email: string, url: string): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: "Verify your Worldbuilder account",
    html: `
      <p>Thanks for signing up for Worldbuilder.</p>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${url}">Verify email</a></p>
      <p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
    `,
  });
}
