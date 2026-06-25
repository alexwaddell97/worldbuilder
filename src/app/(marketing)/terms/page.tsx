import { APP_NAME, APP_DOMAIN } from "@/config/app";

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Legal</p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Acceptance</h2>
          <p className="text-muted-foreground">
            By creating an account or using {APP_NAME} (the "Service"), you agree to these Terms.
            If you do not agree, do not use the Service. These Terms are governed by English law.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. Your account</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>You must be 13 years or older to use the Service.</li>
            <li>You are responsible for keeping your credentials secure.</li>
            <li>You are responsible for all activity under your account.</li>
            <li>One person may not maintain multiple free accounts.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. Your content</h2>
          <p className="text-muted-foreground">
            You own all content you create. By uploading content, you grant us a limited licence
            to store and serve it solely for the purpose of providing the Service. We will never
            claim ownership of your worlds, entities, or lore.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Acceptable use</h2>
          <p className="text-muted-foreground mb-2">You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Upload content that is illegal, harmful, or violates third-party rights.</li>
            <li>Attempt to gain unauthorised access to other users&apos; data.</li>
            <li>Reverse engineer, scrape, or abuse the API.</li>
            <li>Use the Service to train AI models without prior written consent.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. Paid plans and billing</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Paid plans are billed monthly in advance.</li>
            <li>You may cancel at any time; access continues until the end of the billing period.</li>
            <li>We do not offer refunds for partial months, except where required by law.</li>
            <li>Prices may change with 30 days&apos; notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Data export</h2>
          <p className="text-muted-foreground">
            You can export all of your content as Markdown at any time, on any plan, for free.
            We will not hold your data hostage if you choose to leave.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Service availability</h2>
          <p className="text-muted-foreground">
            We aim for high availability but do not guarantee uninterrupted access.
            We are not liable for downtime, data loss caused by third-party infrastructure,
            or consequential damages arising from use of the Service.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Termination</h2>
          <p className="text-muted-foreground">
            We reserve the right to suspend or terminate accounts that violate these Terms.
            You may delete your account at any time from your account settings. On deletion,
            your data will be removed within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">9. Changes to these Terms</h2>
          <p className="text-muted-foreground">
            We may update these Terms. Significant changes will be communicated by email with
            at least 14 days&apos; notice. Continued use after the effective date constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">10. Contact</h2>
          <p className="text-muted-foreground">
            Questions about these Terms: <a href={`mailto:hello@${APP_DOMAIN}`} className="underline underline-offset-4 hover:text-foreground">hello@{APP_DOMAIN}</a>
          </p>
        </section>
      </div>
    </div>
  );
}
