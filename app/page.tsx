import HeroSection from "@/app/landing/sections/HeroSection";
import SecondaryHeroSection from "@/app/landing/sections/SecondaryHeroSection";
import HowItWorksSection from "@/app/landing/sections/HowItWorksSection";
import FooterSection from "@/app/landing/sections/FooterSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <HeroSection />
      <SecondaryHeroSection />
      <HowItWorksSection />
      <FooterSection />
    </div>
  );
}
