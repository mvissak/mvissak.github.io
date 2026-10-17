import { CountIndexStudyTable } from "@/presentation/components/CountIndexStudyTable";
import { CountReferenceSectionCard } from "@/presentation/components/CountReferenceSectionCard";
import type { TrainerViewCardCountingReference } from "@/presentation/view-models/buildCardCountingReferenceViewModel";

interface CardCountingReferencePanelProps {
  reference: TrainerViewCardCountingReference;
}

export function CardCountingReferencePanel({ reference }: CardCountingReferencePanelProps) {
  return (
    <section aria-label="Card counting reference" className="table-panel px-4 py-4 tablet:px-5 desktop:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-muted">Count Guide</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-gold tablet:text-3xl">What the Count Means</h2>
        <p className="rounded-pill border border-gold/45 px-3 py-2 text-sm font-semibold text-gold">
          {reference.currentCountLabel}
          <span className="mt-1 block text-xs text-ivory/85">{reference.currentTrueCountLabel}</span>
        </p>
      </div>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-ivory/85">{reference.trainerPolicy}</p>

      <div className="mt-5 grid gap-4 desktop:grid-cols-3">
        {reference.sections.map((section) => <CountReferenceSectionCard key={section.id} section={section} />)}
      </div>

      <div className="mt-5 text-sm leading-6 text-ivory/85">
        <h3 className="font-display text-lg text-gold">Running count vs. true count</h3>
        <p className="mt-2 font-semibold text-ivory">{reference.trueCountFormula}</p>
        <p className="mt-2">{reference.trueCountExample}</p>
        <p className="mt-2">{reference.payoutNote}</p>
      </div>
      <CountIndexStudyTable rows={reference.studyRows} />
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gold-muted">
        {reference.sources.map((source) => (
          <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-gold">
            {source.label}
          </a>
        ))}
      </div>
    </section>
  );
}
