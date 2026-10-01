import Hero from "@/components/home/hero";
import HowItWorks from "@/components/home/howitworks";
import Features from "@/components/home/features";
import Faq from "@/components/home/faq";
import CTA from "@/components/home/cta";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Hero />
      <HowItWorks />
      <Features />
      <Faq />
      <CTA />
      <Footer />
    </div>
  );
}
