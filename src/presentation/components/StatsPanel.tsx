import { MetricCard } from "@/presentation/components/MetricCard";
import type { TrainerViewMetric } from "@/presentation/view-models/buildTrainerViewModel";

interface StatsPanelProps {
  metrics: TrainerViewMetric[];
}

export function StatsPanel({ metrics }: StatsPanelProps) {
  return (
    <section className="grid gap-3 mobile:grid-cols-2 desktop:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </section>
  );
}
