import {
  Header,
  Hero,
  HowItWorks,
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
        <Benefits />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
