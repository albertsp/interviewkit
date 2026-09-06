"use client";
import Hero from "@/components/home/hero";
import Features from "@/components/home/features";
import HowItWorks from "@/components/home/howitworks";
import Techs from "@/components/home/techs";
import Faq from "@/components/home/faq";
import CTA from "@/components/home/cta";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <Techs />
      <HowItWorks />
      <Features />
      <Faq />
      <CTA />
      <Footer />
    </div>
  );
}
