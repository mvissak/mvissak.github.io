import type { ReactNode } from "react";

interface TableSurfaceProps {
  children: ReactNode;
}

export function TableSurface({ children }: TableSurfaceProps) {
  return (
    <main className="min-h-screen bg-felt-radial px-4 pb-34 pt-6 text-ivory tablet:px-6 desktop:px-10 desktop:pb-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">{children}</div>
    </main>
  );
}
