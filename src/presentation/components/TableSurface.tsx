import type { ReactNode } from "react";

interface TableSurfaceProps {
  children: ReactNode;
}

export function TableSurface({ children }: TableSurfaceProps) {
  return (
    <main className="table-surface min-h-screen bg-felt-radial px-4 pt-6 text-ivory tablet:px-6 desktop:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
    </main>
  );
}
