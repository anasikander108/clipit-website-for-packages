import {
  CaptionDome, ClosingCta, Faq, FeaturesBento, Footer, Hero, Navbar, PlaygroundAndUseCases, Pricing, useReveal, useStack, WhatItDoes,
} from "../../components/landing/Sections";

export default function Landing() {
  useReveal();
  useStack();
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <WhatItDoes />
        <FeaturesBento />
        <CaptionDome />
        <PlaygroundAndUseCases />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
