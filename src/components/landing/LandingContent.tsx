"use client";

import { useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import Hero from "./Hero";
import PainPoints from "./PainPoints";
import HowItWorks from "./HowItWorks";
import VacancyFeedSection from "./VacancyFeedSection";
import Benefits from "./Benefits";
import SocialProof from "./SocialProof";
import Pricing from "./Pricing";
import FAQ from "./FAQ";
import Footer from "./Footer";
import EmployerBenefits from "./EmployerBenefits";
import EmployerHowItWorks from "./EmployerHowItWorks";
import EmployerPricing from "./EmployerPricing";
import EmployerFAQ from "./EmployerFAQ";

type LandingMode = "jobseeker" | "employer";

export default function LandingContent() {
  const [mode, setMode] = useState<LandingMode>("jobseeker");
  const { isAdmin } = useIsAdmin();

  return (
    <>
      <main>
        <Hero
          defaultMode={mode}
          hideToggle={false}
          onModeChange={(newMode) => setMode(newMode)}
          isAdmin={isAdmin}
        />
        {mode === "jobseeker" ? (
          <>
            {/* 1. Обещание + CTA - Hero */}
            {/* 2. Кому и какая боль решается */}
            <PainPoints />
            {/* 3. Как работает (3 шага) */}
            <HowItWorks />
            {/* 4. Что входит / что получите */}
            <VacancyFeedSection />
            <Benefits />
            {/* 5. Кейсы / доказательства */}
            <SocialProof />
            {/* 6. Цены */}
            <Pricing />
            {/* 7. Возражения (FAQ) */}
            <FAQ />
            {/* 8. Финальный CTA - Footer */}
          </>
        ) : (
          <>
            <EmployerBenefits />
            <EmployerHowItWorks />
            <EmployerPricing />
            <EmployerFAQ />
          </>
        )}
      </main>
      <Footer mode={mode} />
    </>
  );
}
