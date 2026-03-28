export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-1">Last Updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Who We Are</h2>
          <p className="text-muted-foreground">PrivcybHub is a privacy and cyber compliance platform. <p className="text-muted-foreground">PrivcybHub is a privacy and cyber compliance platform. Operator: PrivcybHub, Pune, Maharashtra, India. Contact: privacy@privcybhub.com</p>. Contact: privacy@privcybhub.com</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. What Data We Collect</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Account data:</strong> name, email address, organisation name, role</li>
            <li><strong>Usage data:</strong> assessment responses, compliance scores, notes</li>
            <li><strong>Technical data:</strong> session tokens (essential only), browser type</li>
            <li><strong>We do NOT collect:</strong> location data, device fingerprints, advertising identifiers</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Why We Collect It (Lawful Basis)</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Account data:</strong> Contract performance (you signed up to use the service)</li>
            <li><strong>Usage data:</strong> Legitimate interest in providing the compliance service</li>
            <li>All processing is limited to the stated purpose</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Sub-Processors</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Supabase Inc. (USA)</strong> — database, authentication, storage. DPA in place. SCCs apply.</li>
            <li><strong>Google LLC</strong> — Google OAuth sign-in (email + profile scope only). Data: email address and display name only.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Your Rights</h2>
          <p className="text-muted-foreground">Under DPDP Act 2023 and applicable law you have the right to: Access, correct, erase, and export your data. Exercise your rights via: Settings → Account → Manage My Data. Or email: privacy@privcybhub.com</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p className="text-muted-foreground">Account data retained while your account is active. Deleted within 30 days of account deletion request. Assessment data deleted immediately upon account deletion.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Security</h2>
          <p className="text-muted-foreground">All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access is restricted by role-based controls.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
          <p className="text-muted-foreground">We will notify users of material changes via email and in-app notification.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p className="text-muted-foreground">Data Protection Officer: <p className="text-muted-foreground">Data Protection Officer: Privacy Office, PrivcybHub<br />Email: privacy@privcybhub.com</p><br />Email: privacy@privcybhub.com</p>
        </section>
      </div>
    </div>
  );
}
