import { StrategyReferenceSectionCard } from "@/presentation/components/StrategyReferenceSectionCard";
import type { TrainerViewStrategyReference } from "@/presentation/view-models/buildStrategyReferenceViewModel";

interface StrategyReferencePanelProps {
  reference: TrainerViewStrategyReference;
}

export function StrategyReferencePanel({ reference }: StrategyReferencePanelProps) {
  return (
    <section className="table-panel px-4 py-4 tablet:px-5 desktop:px-6" aria-label="Strategy reference">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-muted">Strategy Guide</p>
      <h2 className="mt-3 font-display text-2xl text-gold tablet:text-3xl">
        Tracked Strategy, In Plain English
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-ivory/85">
        This total-based chart is the baseline. Its moves remain accepted, and supported
        Hi-Lo count exceptions can also advance the hand when their true-count index applies.
      </p>

      <div className="mt-5">
        <h3 className="font-display text-lg text-gold">Assumptions</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ivory/85">
          {reference.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 grid gap-4 desktop:grid-cols-3">
        {reference.sections.map((section) => (
          <StrategyReferenceSectionCard key={section.title} section={section} />
        ))}
      </div>
    </section>
  );
}
