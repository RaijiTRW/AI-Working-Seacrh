"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAdmin } from "@/lib/useIsAdmin";
import Hero from "@/components/landing/Hero";
import EmployerBenefits from "@/components/landing/EmployerBenefits";
import EmployerHowItWorks from "@/components/landing/EmployerHowItWorks";
import EmployerPricing from "@/components/landing/EmployerPricing";
import EmployerFAQ from "@/components/landing/EmployerFAQ";
import { Header, Footer } from "@/components/landing";

export default function EmployersPage() {
  const router = useRouter();
  const { isAdmin, loading } = useIsAdmin();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "JobAISearch для работодателей",
    description:
      "Платформа для размещения вакансий и поиска кандидатов с AI-фильтрацией резюме",
    provider: {
      "@type": "Organization",
      name: "JobAISearch",
      url: "https://jobaisearch.ru",
    },
    areaServed: {
      "@type": "Country",
      name: "Россия",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Работодатели и HR-специалисты",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Бесплатный тариф",
        price: "0",
        priceCurrency: "RUB",
        description: "1 активная вакансия, базовая статистика",
      },
      {
        "@type": "Offer",
        name: "Стандарт",
        price: "499",
        priceCurrency: "RUB",
        description: "5 активных вакансий, AI-фильтрация",
      },
      {
        "@type": "Offer",
        name: "Бизнес",
        price: "1999",
        priceCurrency: "RUB",
        description: "Неограниченно вакансий, персональный менеджер",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <Hero defaultMode="employer" hideToggle={true} />
        <EmployerBenefits />
        <EmployerHowItWorks />
        <EmployerPricing />
        <EmployerFAQ />
      </main>
      <Footer mode="employer" />
    </>
  );
}
