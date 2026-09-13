import HeroSection from "@/app/landing/sections/HeroSection";
import HowItWorksSection from "@/app/landing/sections/HowItWorksSection";
import ConsultationSection from "@/app/landing/sections/ConsultationSection";
import SecondaryHeroSection from "@/app/landing/sections/SecondaryHeroSection";
import TestimonialsSection from "@/app/landing/sections/TestimonialsSection";
import PlatformGridSection from "@/app/landing/sections/PlatformGridSection";
import FooterSection from "@/app/landing/sections/FooterSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <HeroSection />
      <HowItWorksSection />
      <ConsultationSection />
      <SecondaryHeroSection />
      <TestimonialsSection />
      <PlatformGridSection />
      <FooterSection />
    </div>
  );
}
