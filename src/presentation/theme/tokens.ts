export const themeTokens = {
  breakpoints: {
    mobile: "420px",
    tablet: "768px",
    desktop: "1200px",
  },
  colors: {
    felt: {
      DEFAULT: "#0f5b3a",
      dark: "#0a3f29",
      light: "#1c8b5f",
      edge: "#072a1b",
    },
    gold: {
      DEFAULT: "#f1c766",
      strong: "#d8a22c",
      muted: "#b88f35",
      surface: "#2b2411",
    },
    ivory: {
      DEFAULT: "#fffaf0",
      soft: "#f6edd8",
      muted: "#e9ddbe",
    },
    ink: {
      DEFAULT: "#112117",
      muted: "#294132",
      inverse: "#f9f4e6",
    },
    success: "#b2e176",
    danger: "#f1a4a4",
    overlay: "rgba(3, 15, 9, 0.72)",
  },
  spacing: {
    "3.5": "0.875rem",
    18: "4.5rem",
    22: "5.5rem",
    26: "6.5rem",
    30: "7.5rem",
  },
  radii: {
    card: "1rem",
    panel: "1.5rem",
    pill: "9999px",
  },
  fonts: {
    display: ['var(--font-display)', "Georgia", "serif"],
    body: ['var(--font-body)', "ui-sans-serif", "system-ui", "sans-serif"],
  },
  shadows: {
    card: "0 18px 32px rgba(7, 42, 27, 0.24)",
    panel: "0 24px 60px rgba(0, 0, 0, 0.28)",
  },
  motion: {
    fast: "140ms",
    base: "220ms",
    flip: "880ms",
    slow: "320ms",
  },
} as const;

export type ThemeTokens = typeof themeTokens;
