import {
  Announcement, ClosingCta, Faq, Footer, Hero, HowItWorks, Moments, Navbar, Platforms, Pricing, ProductCard, Stats, useReveal,
} from "../../components/landing/Sections";

export default function Landing() {
  useReveal();
  return (
    <>
      <Announcement />
      <Navbar />
      <main>
        <Hero />
        <ProductCard />
        <Moments />
        <Platforms />
        <HowItWorks />
        <Stats />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
