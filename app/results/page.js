import { Nav } from "@/components/Nav";
import { ResultDashboard } from "@/components/ResultDashboard";
import { buildLocalRecommendation } from "@/lib/recommendation";

export default function ResultsPage() {
  const result = buildLocalRecommendation({
    plantingArea: 800,
    sunCondition: "Full sun",
    maintenance: "Low",
    selectedStyle: "california-native",
    uploadedPlanName: "sample-plan.pdf"
  });

  return (
    <main>
      <Nav />
      <div className="mx-auto max-w-7xl px-5 py-8">
        <ResultDashboard result={result} />
      </div>
    </main>
  );
}
