import { Announcement, ClosingCta, Faq, Features, Footer, Hero, HowItWorks, Navbar, Pricing } from "../../components/landing/Sections";

export default function Landing() {
  return (
    <>
      <Announcement />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
