export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-1">Last Updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">By creating an account on PrivcybHub you agree to these Terms.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Description of Service</h2>
          <p className="text-muted-foreground">PrivcybHub provides a compliance assessment platform for the DPDP Act 2023 and related privacy and cyber standards. It is an informational and workflow tool — not legal advice.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. User Responsibilities</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>You are responsible for the accuracy of data you enter</li>
            <li>You must not share your login credentials</li>
            <li>You must not attempt to access other users' data</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Intellectual Property</h2>
          <p className="text-muted-foreground">Assessment templates and content are proprietary to PrivcybHub. You may download templates for your own compliance use only.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
          <p className="text-muted-foreground">PrivcybHub provides compliance guidance tools. We are not liable for regulatory outcomes, penalties, or legal consequences arising from use of this platform.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Termination</h2>
          <p className="text-muted-foreground">We reserve the right to suspend accounts that violate these Terms.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Governing Law</h2>
          <p className="text-muted-foreground">These Terms are governed by the laws of India.</p>
        </section>
      </div>
    </div>
  );
}
