import { APP_NAME, APP_DOMAIN } from "@/config/app";

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Legal</p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Who we are</h2>
          <p>
            {APP_NAME} is operated as a personal project. For questions about this policy,
            contact <a href={`mailto:hello@${APP_DOMAIN}`} className="underline underline-offset-4 hover:text-muted-foreground">hello@{APP_DOMAIN}</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. What data we collect</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Account data:</strong> your name and email address when you register.</li>
            <li><strong className="text-foreground">Content data:</strong> worlds, entities, maps, and any other content you create inside the app.</li>
            <li><strong className="text-foreground">Usage data:</strong> basic server logs (IP address, timestamp, route) used for security and debugging.</li>
            <li><strong className="text-foreground">Payment data:</strong> handled entirely by our payment processor. We do not store card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. How we use your data</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>To provide, maintain, and improve the service.</li>
            <li>To send transactional emails (account verification, password reset).</li>
            <li>To process payments for paid plans.</li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            We do not run ads. We do not sell your data. We do not use your content to train AI models.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Data storage and security</h2>
          <p className="text-muted-foreground">
            Data is stored on servers within the EU/UK. We use industry-standard encryption in transit (TLS)
            and at rest. Access to production data is strictly limited.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. Your rights (GDPR)</h2>
          <p className="text-muted-foreground mb-2">If you are in the UK or EU, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
            <li>Export your data at any time via the Markdown export feature.</li>
            <li>Lodge a complaint with the ICO (UK) or your local supervisory authority.</li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            To exercise any of these rights, email <a href={`mailto:hello@${APP_DOMAIN}`} className="underline underline-offset-4 hover:text-foreground">hello@{APP_DOMAIN}</a>.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Cookies</h2>
          <p className="text-muted-foreground">
            We use only essential cookies required for authentication and session management.
            See our <a href="/cookies" className="underline underline-offset-4 hover:text-foreground">Cookie Policy</a> for details.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Third-party services</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li><strong className="text-foreground">Vercel:</strong> hosting and edge infrastructure.</li>
            <li><strong className="text-foreground">Neon:</strong> PostgreSQL database.</li>
            <li><strong className="text-foreground">Resend:</strong> transactional email delivery.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Changes to this policy</h2>
          <p className="text-muted-foreground">
            We may update this policy from time to time. Significant changes will be communicated
            by email. Continued use of the service after changes constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}
