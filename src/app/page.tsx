import {
  Header,
  Hero,
  HowItWorks,
  VacancyFeedSection,
  Benefits,
  FAQ,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <VacancyFeedSection />
        <Benefits />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
