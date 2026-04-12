export const chipDenominations = [5000, 1000, 500, 100, 25, 20, 10, 5, 2, 1] as const;

export type ChipDenomination = (typeof chipDenominations)[number];

interface CasinoChipPalette {
  accent: string;
  centerBackground: string;
  centerBorder: string;
  edgeBase: string;
  edgeShadow: string;
  edgeText: string;
  edgeTint: string;
  valueColor: string;
}

export const casinoChipPalettes: Record<ChipDenomination, CasinoChipPalette> = {
  1: {
    accent: "#f1a6a0",
    centerBackground: "linear-gradient(180deg, #fffdf8 0%, #f1efe6 100%)",
    centerBorder: "#d8d4ca",
    edgeBase: "#efeee7",
    edgeShadow: "#cfcabf",
    edgeText: "#c8847c",
    edgeTint: "#faf8f1",
    valueColor: "#d36c67",
  },
  2: {
    accent: "#2b1f26",
    centerBackground: "linear-gradient(180deg, #ef8073 0%, #dc655d 100%)",
    centerBorder: "#c25751",
    edgeBase: "#f17368",
    edgeShadow: "#cf5a50",
    edgeText: "#f0a39b",
    edgeTint: "#ff9b90",
    valueColor: "#21161c",
  },
  5: {
    accent: "#f0dfb0",
    centerBackground: "linear-gradient(180deg, #fffef8 0%, #f5f1e6 100%)",
    centerBorder: "#d9d2c2",
    edgeBase: "#c65b72",
    edgeShadow: "#9f4659",
    edgeText: "#f4c9d3",
    edgeTint: "#da7088",
    valueColor: "#b04560",
  },
  10: {
    accent: "#ece5d7",
    centerBackground: "linear-gradient(180deg, #367fae 0%, #1e628a 100%)",
    centerBorder: "#1f5f87",
    edgeBase: "#2c7aa9",
    edgeShadow: "#1d577d",
    edgeText: "#c7d7e3",
    edgeTint: "#4490bf",
    valueColor: "#fbf8ef",
  },
  20: {
    accent: "#ff8c2f",
    centerBackground: "linear-gradient(180deg, #f1d548 0%, #ddb520 100%)",
    centerBorder: "#c9a318",
    edgeBase: "#e4c930",
    edgeShadow: "#ba9818",
    edgeText: "#b28a16",
    edgeTint: "#f2db65",
    valueColor: "#241c10",
  },
  25: {
    accent: "#f3f2ea",
    centerBackground: "linear-gradient(180deg, #fffef7 0%, #f1efe3 100%)",
    centerBorder: "#d7d3c7",
    edgeBase: "#72b375",
    edgeShadow: "#4d8350",
    edgeText: "#d4ead5",
    edgeTint: "#89c48b",
    valueColor: "#5d9a5f",
  },
  100: {
    accent: "#86d9ae",
    centerBackground: "linear-gradient(180deg, #f6f5fb 0%, #e9e8f3 100%)",
    centerBorder: "#d7d4e2",
    edgeBase: "#2e3137",
    edgeShadow: "#17191d",
    edgeText: "#d8def5",
    edgeTint: "#454a53",
    valueColor: "#111318",
  },
  500: {
    accent: "#d1a14f",
    centerBackground: "linear-gradient(180deg, #f4e9fb 0%, #ebe0f3 100%)",
    centerBorder: "#dacde6",
    edgeBase: "#c8ade9",
    edgeShadow: "#9d82c3",
    edgeText: "#7f5aaa",
    edgeTint: "#dbc6f4",
    valueColor: "#9a6ba2",
  },
  1000: {
    accent: "#7f8d47",
    centerBackground: "linear-gradient(180deg, #fffef2 0%, #faf4c5 100%)",
    centerBorder: "#d8cf8c",
    edgeBase: "#f0d42e",
    edgeShadow: "#c6a91d",
    edgeText: "#8f7a17",
    edgeTint: "#f8e96f",
    valueColor: "#c5ab12",
  },
  5000: {
    accent: "#6dd0e4",
    centerBackground: "linear-gradient(180deg, #ffffff 0%, #eef3fb 100%)",
    centerBorder: "#d8e0ed",
    edgeBase: "#f7f7fb",
    edgeShadow: "#d7ddeb",
    edgeText: "#345e9d",
    edgeTint: "#ffffff",
    valueColor: "#1f2227",
  },
};

const formatChipAmount = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatChipDenomination = (value: ChipDenomination): string => formatChipAmount(value);

export const decomposeBetAmountToChips = (amount: number): ChipDenomination[] => {
  let remaining = Math.max(0, Math.trunc(amount));
  const chips: ChipDenomination[] = [];

  for (const denomination of chipDenominations) {
    while (remaining >= denomination) {
      chips.push(denomination);
      remaining -= denomination;
    }
  }

  return chips;
};
