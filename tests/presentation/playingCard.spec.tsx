import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PlayingCard } from "@/presentation/components/PlayingCard";
import { createCard } from "@tests/helpers";

describe("PlayingCard", () => {
  test("uses the shared flip duration token for card turns", () => {
    const { container } = render(
      <PlayingCard card={createCard("A")} faceDown motionEnabled />,
    );

    expect(container.querySelector(".duration-flip.rotate-y-180")).toBeTruthy();
  });
});
