import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DealerBlackjackOverlay } from "@/presentation/components/DealerBlackjackOverlay";

describe("DealerBlackjackOverlay", () => {
  test("renders the dealer-blackjack reaction with an svg icon", () => {
    render(<DealerBlackjackOverlay active />);

    expect(screen.getByTestId("dealer-blackjack-icon").tagName).toBe("svg");
  });
});
