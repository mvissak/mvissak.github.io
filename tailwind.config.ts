import type { Config } from "tailwindcss";
import { themeTokens } from "./src/presentation/theme/tokens";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/presentation/**/*.{ts,tsx}"],
  theme: {
    screens: themeTokens.breakpoints,
    extend: {
      colors: themeTokens.colors,
      spacing: themeTokens.spacing,
      borderRadius: themeTokens.radii,
      fontFamily: {
        display: [...themeTokens.fonts.display],
        body: [...themeTokens.fonts.body],
      },
      boxShadow: themeTokens.shadows,
      animation: {
        "card-draw": `card-draw ${themeTokens.motion.slow} ease-out`,
        "card-flip": `card-flip ${themeTokens.motion.flip} ease-in-out`,
        "table-fade": `table-fade ${themeTokens.motion.slow} ease-out`,
      },
      transitionDuration: {
        flip: themeTokens.motion.flip,
      },
      backgroundImage: {
        "felt-radial":
          "radial-gradient(circle at top, #1c8b5f 0%, #0f5b3a 48%, #072a1b 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
