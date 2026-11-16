import { Footer, Navbar } from "../../components/landing/Sections";
import { useSite } from "../../lib/site";

function LegalPage({ title, sections }: { title: string; sections: [string, string][] }) {
  const { site } = useSite();
  return (
    <>
      <Navbar />
      <main className="container-x max-w-3xl pb-20 pt-32 sm:pt-40">
        <p className="eyebrow">Legal</p>
        <h1 className="h-display mt-3 text-[36px] sm:text-[44px]">{title}</h1>
        <p className="mt-3 text-[14px] text-muted">These terms apply to {site.product_name} and its website.</p>
        <div className="mt-10 space-y-8">
          {sections.map(([h, body]) => (
            <section key={h}>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{h}</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{body}</p>
            </section>
          ))}
          <section>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Contact</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
              Questions about this page can be sent to {site.support_email || "our support team through your dashboard"}.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Terms() {
  return (
    <LegalPage
      title="Terms and Conditions"
      sections={[
        ["Accounts", "You need an account with a verified email address to buy a subscription. Keep your password private; you are responsible for activity on your account."],
        ["Payments", "Subscriptions are paid by bank transfer in Pakistani rupees. A subscription is activated only after our team has matched your transfer with our bank records. Submitting a false reference or screenshot leads to rejection and may lead to the account being suspended."],
        ["Subscription period", "Your subscription starts on the day your payment is approved and lasts for the period of the package you bought (30, 90 or 365 days). Renewing before the end adds the new period after your current expiry date."],
        ["Daily limits", "Each package includes a daily allowance of video processing hours and exports. Allowances reset at midnight Pakistan time and unused time does not carry over."],
        ["Acceptable use", "Only process videos you own or have permission to use. Do not share your account, resell access or try to get around the daily limits or licence checks."],
        ["Refunds", "Because access is granted manually after verification, payments are not refundable once a subscription has been activated, except where required by law. Contact us if you were charged in error."],
        ["Changes and availability", "We may update the software and these terms. We aim for the service to be available at all times but do not guarantee uninterrupted access to third-party services used for transcription and analysis."],
      ]}
    />
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={[
        ["What we collect", "Your name, email address, phone number, payment references and the screenshots you upload as proof of payment, together with usage records (how many hours of video you process and how many exports you make each day)."],
        ["Why we collect it", "To create and secure your account, verify payments, provide the software, enforce plan limits and contact you about your subscription."],
        ["Payment screenshots", "Screenshots are stored in private storage. Only you and our administrators can view them, and only to verify your payment."],
        ["Your videos", "Videos are processed by the desktop software on your own computer. Audio may be sent to our transcription and analysis providers to create transcripts and clip suggestions; we do not sell or publish your content."],
        ["Emails", "We send account emails (verification, password reset) and service emails about payments and your subscription. We do not send marketing emails without your consent."],
        ["Retention and deletion", "Account and payment records are kept for as long as your account exists and as required for accounting. You can ask us to delete your account at any time."],
      ]}
    />
  );
}
