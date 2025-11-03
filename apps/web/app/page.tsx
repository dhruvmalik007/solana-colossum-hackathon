import { FadeIn } from "@repo/ui/components/fade-in";
import { LandingHero } from "@repo/ui/components/LandingHero";
import { Announcement } from "@repo/ui/components/marketing/Announcement";
import { Customers } from "@repo/ui/components/marketing/Customers";
import { ProblemSolution } from "@repo/ui/components/marketing/ProblemSolution";
import { HowItWorks } from "@repo/ui/components/marketing/HowItWorks";
import { Pricing } from "@repo/ui/components/marketing/Pricing";
import { Articles } from "@repo/ui/components/marketing/Articles";
import { Footer } from "@repo/ui/components/marketing/Footer";
import MarketsSection from "../components/MarketsSection";

export default function Home(): React.ReactElement {
  return (
    <div className="space-y-10">
      <FadeIn>
        <Announcement title="Distributional Prediction Markets on Solana" ctaLabel="View docs" ctaHref="/docs" />
      </FadeIn>

      <FadeIn delay={0.05}>
        <LandingHero />
      </FadeIn>

      <FadeIn delay={0.1}>
        <Customers />
      </FadeIn>

      <FadeIn delay={0.15}>
        <ProblemSolution />
      </FadeIn>

      <FadeIn delay={0.2}>
        <HowItWorks />
      </FadeIn>

      <FadeIn delay={0.25}>
        <MarketsSection />
      </FadeIn>

      <FadeIn delay={0.3}>
        <Pricing />
      </FadeIn>

      <FadeIn delay={0.35}>
        <Articles />
      </FadeIn>

      <FadeIn delay={0.4}>
        <Footer />
      </FadeIn>
    </div>
  );
}
