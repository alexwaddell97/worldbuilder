import { APP_NAME, APP_DOMAIN } from "@/config/app";

export default function CookiesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Legal</p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

      <div className="space-y-8 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">What are cookies?</h2>
          <p className="text-muted-foreground">
            Cookies are small text files stored in your browser. They allow websites to remember
            information about your session and preferences.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Cookies we use</h2>
          <p className="text-muted-foreground mb-4">
            {APP_NAME} uses only <strong className="text-foreground">strictly necessary cookies</strong>.
            We do not use advertising cookies, tracking cookies, or third-party analytics cookies.
          </p>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-foreground">Cookie</th>
                  <th className="text-left px-4 py-2.5 font-medium text-foreground">Purpose</th>
                  <th className="text-left px-4 py-2.5 font-medium text-foreground">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">better-auth.session</td>
                  <td className="px-4 py-2.5 text-muted-foreground">Keeps you signed in</td>
                  <td className="px-4 py-2.5 text-muted-foreground">Session / 30 days</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">better-auth.csrf</td>
                  <td className="px-4 py-2.5 text-muted-foreground">Prevents cross-site request forgery</td>
                  <td className="px-4 py-2.5 text-muted-foreground">Session</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Do we require consent?</h2>
          <p className="text-muted-foreground">
            Because we only use strictly necessary cookies, we are not required to obtain consent
            under UK PECR or EU ePrivacy rules. These cookies are essential for the Service to
            function and cannot be disabled without breaking the site.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Managing cookies</h2>
          <p className="text-muted-foreground">
            You can clear cookies at any time through your browser settings. Clearing session
            cookies will sign you out of the Service. Most browsers allow you to block cookies,
            but doing so will prevent you from logging in.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">Contact</h2>
          <p className="text-muted-foreground">
            Questions about our use of cookies:{" "}
            <a href={`mailto:hello@${APP_DOMAIN}`} className="underline underline-offset-4 hover:text-foreground">
              hello@{APP_DOMAIN}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
