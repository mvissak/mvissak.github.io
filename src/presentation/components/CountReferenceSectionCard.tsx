import type { CountReferenceSection } from "@/presentation/view-models/buildCardCountingReferenceViewModel";

interface CountReferenceSectionCardProps {
  section: CountReferenceSection;
}

export function CountReferenceSectionCard({ section }: CountReferenceSectionCardProps) {
  return (
    <article
      aria-label={section.title}
      aria-current={section.isCurrent ? "true" : undefined}
      className={`table-panel px-4 py-4 ${section.isCurrent ? "ring-1 ring-gold" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl text-gold">{section.title}</h3>
        {section.isCurrent ? <span className="text-xs font-semibold text-gold">Current shoe</span> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-ivory/85">{section.meaning}</p>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-ivory/85">
        <li><span className="font-semibold text-gold">Betting:</span> {section.betting}</li>
        <li><span className="font-semibold text-gold">Playing:</span> {section.playing}</li>
      </ul>
    </article>
  );
}
