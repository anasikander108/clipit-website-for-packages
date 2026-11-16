import {
  CaptionDome, ClosingCta, Faq, FeaturesBento, Footer, Hero, Intro, Navbar, PlaygroundAndUseCases, Pricing, useReveal, useStack, WhatItDoes,
} from "../../components/landing/Sections";

export default function Landing() {
  useReveal();
  useStack();
  return (
    <>
      <Intro />
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
