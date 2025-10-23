import { FadeIn } from "@repo/ui/components/fade-in";
import { LandingHero } from "@repo/ui/components/LandingHero";
import MarketsSection from "../components/MarketsSection";

export default async function Home(): Promise<any> {
  return (
    <div className="space-y-6">
      <FadeIn>
        <LandingHero />
      </FadeIn>

      <FadeIn delay={0.1}>
        <MarketsSection />
      </FadeIn>
    </div>
  );
}
