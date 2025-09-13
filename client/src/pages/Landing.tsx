import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { CTA } from "@/components/sections/CTA";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <CTA />
      </main>
    </div>
  );
};

export default Landing;