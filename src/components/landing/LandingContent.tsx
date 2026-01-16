"use client";

import { useState } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import VacancyFeedSection from "./VacancyFeedSection";
import Benefits from "./Benefits";
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
            <HowItWorks />
            <VacancyFeedSection />
            <Benefits />
            <Pricing />
            <FAQ />
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
