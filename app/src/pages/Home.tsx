import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import SocialProofBar from "@/sections/SocialProofBar";
import ProblemSection from "@/sections/ProblemSection";
import HowItWorks from "@/sections/HowItWorks";
import Features from "@/sections/Features";
import ComparisonTable from "@/sections/ComparisonTable";
import Testimonials from "@/sections/Testimonials";
import Pricing from "@/sections/Pricing";
import FAQ from "@/sections/FAQ";
import FinalCTA from "@/sections/FinalCTA";
import Footer from "@/sections/Footer";
import SupportFab from "@/components/support/SupportFab";

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <SocialProofBar />
        <ProblemSection />
        <HowItWorks />
        <Features />
        <ComparisonTable />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
      <SupportFab audience="customer" />
    </div>
  );
}
