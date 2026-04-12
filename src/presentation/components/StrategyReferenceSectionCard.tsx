import type { TrainerViewStrategyReference } from "@/presentation/view-models/buildStrategyReferenceViewModel";

interface StrategyReferenceSectionCardProps {
  section: TrainerViewStrategyReference["sections"][number];
}

export function StrategyReferenceSectionCard({
  section,
}: StrategyReferenceSectionCardProps) {
  return (
    <article className="table-panel px-4 py-4">
      <h3 className="font-display text-xl text-gold">{section.title}</h3>
      <ul className="mt-4 space-y-3">
        {section.rows.map((row) => (
          <li key={row.label} className="text-sm leading-6 text-ivory/85">
            <span className="font-semibold text-gold">{row.label}:</span> {row.summary}
          </li>
        ))}
      </ul>
    </article>
  );
}
