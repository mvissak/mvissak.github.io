"use client";

interface PoopIconProps {
  className?: string;
  testId?: string;
}

export function PoopIcon({ className, testId }: PoopIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      data-testid={testId}
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="poop-fill" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#8c6034" />
          <stop offset="55%" stopColor="#6a4325" />
          <stop offset="100%" stopColor="#432617" />
        </linearGradient>
        <linearGradient id="poop-highlight" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#d8a97a" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#d8a97a" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M82 12c10 0 18 7 18 16 0 3-1 6-3 8 14 3 25 13 25 27 0 4-1 8-3 11 17 5 29 20 29 38 0 22-19 40-43 40H56c-25 0-44-18-44-40 0-18 12-33 29-38-2-3-3-7-3-11 0-15 12-27 28-27h2c-2-2-3-5-3-8 0-9 8-16 17-16Z"
        fill="url(#poop-fill)"
      />
      <path
        d="M54 42h28c11 0 19 8 19 18 0 3-1 5-2 8h7c16 0 28 11 28 26 0 15-12 27-28 27H54c-17 0-29-12-29-27 0-15 12-26 29-26h8c-2-3-3-5-3-8 0-10 8-18 18-18Z"
        fill="#7a4c29"
        opacity="0.38"
      />
      <path
        d="M70 26c0-4 5-7 12-7 7 0 12 3 12 7 0 3-3 5-7 6-1 1-2 1-4 1-7 0-13-3-13-7Z"
        fill="#a7774a"
        opacity="0.62"
      />
      <path
        d="M52 41c6-10 17-17 31-17 10 0 20 4 27 11-4-2-9-3-14-3-18 0-34 11-40 28-1-6-2-12-4-19Z"
        fill="url(#poop-highlight)"
      />
      <ellipse cx="61" cy="89" fill="#1d120d" rx="7" ry="9" />
      <ellipse cx="101" cy="89" fill="#1d120d" rx="7" ry="9" />
      <path
        d="M59 86c2-2 5-3 8-3 2 0 4 1 6 2-2 1-4 2-6 2s-5-1-8-1Z"
        fill="#fff"
        opacity="0.82"
      />
      <path
        d="M99 86c2-2 5-3 8-3 2 0 4 1 6 2-2 1-4 2-6 2s-5-1-8-1Z"
        fill="#fff"
        opacity="0.82"
      />
      <path
        d="M56 113c7 7 16 10 26 10s19-3 26-10"
        fill="none"
        stroke="#1d120d"
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  );
}
