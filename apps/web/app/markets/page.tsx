import { FadeIn } from "@repo/ui/components/fade-in";
import MarketsSection from "../../components/MarketsSection";

export default async function MarketsPage(): Promise<any> {
  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="sr-only">Markets</h1>
      </FadeIn>
      <FadeIn delay={0.05}>
        <MarketsSection />
      </FadeIn>
    </div>
  );
}
