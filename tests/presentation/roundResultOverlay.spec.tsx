import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RoundResultOverlay } from "@/presentation/components/RoundResultOverlay";

describe("RoundResultOverlay", () => {
  test("renders the dealer-blackjack reaction with an svg icon", () => {
    render(<RoundResultOverlay amountLabel="$25" reaction="dealerBlackjack" />);

    expect(screen.getByTestId("dealer-blackjack-icon").tagName).toBe("svg");
    expect(screen.getByText("-$25")).toBeInTheDocument();
  });

  test("renders confetti for victory overlays", () => {
    render(<RoundResultOverlay amountLabel="$25" reaction="victory" />);

    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
    expect(screen.getByText("+$25")).toBeInTheDocument();
    expect(screen.getByTestId("victory-confetti").childElementCount).toBe(26);
  });

  test("renders a neutral push overlay without confetti, dealer icon, or amount", () => {
    render(<RoundResultOverlay amountLabel={null} reaction="push" />);

    expect(screen.getByText("Push")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("victory-confetti")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dealer-blackjack-icon")).not.toBeInTheDocument();
  });
});
