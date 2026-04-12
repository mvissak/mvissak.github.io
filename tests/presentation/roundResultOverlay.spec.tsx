import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RoundResultOverlay } from "@/presentation/components/RoundResultOverlay";

describe("RoundResultOverlay", () => {
  test("renders the dealer-blackjack reaction with an svg icon", () => {
    render(<RoundResultOverlay amountLabel="$25.00" reaction="dealerBlackjack" />);

    expect(screen.getByTestId("dealer-blackjack-icon").tagName).toBe("svg");
    expect(screen.getByText("$25.00")).toBeInTheDocument();
  });

  test("renders confetti for victory overlays", () => {
    render(<RoundResultOverlay amountLabel="$25.00" reaction="victory" />);

    expect(screen.getByText("Victory")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByTestId("victory-confetti").childElementCount).toBe(26);
  });
});
