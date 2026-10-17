import type { TrainerViewShoeNotice } from "@/presentation/view-models/buildShoeNoticeViewModel";

interface ShoeNoticeProps {
  notice: TrainerViewShoeNotice | null;
}

export function ShoeNotice({ notice }: ShoeNoticeProps) {
  if (!notice) return null;
  return (
    <section role="status" aria-label="Shoe update" className="table-panel border-gold/70 bg-gold-surface/60 px-4 py-4">
      <p className="font-display text-lg font-semibold text-gold">{notice.title}</p>
      <p className="mt-2 text-sm leading-6 text-ivory/90">{notice.message}</p>
    </section>
  );
}
