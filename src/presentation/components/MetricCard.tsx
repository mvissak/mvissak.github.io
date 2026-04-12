interface MetricCardProps {
  label: string;
  value: string;
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="table-panel px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ivory">{value}</p>
    </div>
  );
}
