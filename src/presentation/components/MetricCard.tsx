interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <div aria-label={label} role="group" className="table-panel px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ivory">{value}</p>
      {description ? <p className="mt-1 text-xs text-ivory/65">{description}</p> : null}
    </div>
  );
}
