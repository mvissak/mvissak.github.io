import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TrainerApp } from "@/presentation/components/TrainerApp";
import { createCard, createTrainerWithCards } from "@tests/helpers";

const expectCount = (value: string) => {
  expect(within(screen.getByRole("group", { name: "Running Count" })).getByText(value)).toBeInTheDocument();
  const title = Number(value) > 0 ? "Positive count" : Number(value) < 0 ? "Negative count" : "Zero count";
  expect(screen.getByRole("article", { name: title })).toHaveAttribute("aria-current", "true");
};

describe("displayed running count", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("adds an initially hidden hole card only when it flips face up", async () => {
    const trainer = createTrainerWithCards([
      createCard("A"), createCard("5"), createCard("K"), createCard("A"),
      createCard("8"), createCard("9"),
    ], 6, undefined, true);
    render(<TrainerApp trainer={trainer} dealerRevealDelayMs={40} autoAdvanceDelayMs={10_000} />);

    expectCount("-3");
    await act(async () => { await vi.advanceTimersByTimeAsync(39); });
    expectCount("-3");
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expectCount("-2");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expectCount("-2");
  });

  test("counts dealer draws as they appear instead of counting the already-settled dealer hand early", async () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("2"), createCard("Q"), createCard("5"),
      createCard("3"), createCard("K"), createCard("8"), createCard("9"),
    ], 8, undefined, true);
    render(<TrainerApp
      trainer={trainer}
      dealerRevealDelayMs={30}
      dealerDrawIntervalMs={30}
      autoAdvanceDelayMs={10_000}
    />);

    expectCount("-1");
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expectCount("0");
    await act(async () => { await vi.advanceTimersByTimeAsync(29); });
    expectCount("0");
    fireEvent.click(screen.getByRole("button", { name: "3:2" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expectCount("+1");
    await act(async () => { await vi.advanceTimersByTimeAsync(29); });
    expectCount("+1");
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expectCount("0");
  });

  test("counts an opening dealer blackjack as revealed cards without requiring a player action", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("A"), createCard("10"), createCard("K"),
      createCard("8"), createCard("9"),
    ], 6, undefined, true);
    render(<TrainerApp trainer={trainer} autoAdvanceDelayMs={10_000} />);

    expectCount("-4");
    expect(screen.queryByRole("button", { name: "Stand" })).not.toBeInTheDocument();
  });

  test("keeps a flipped hole card counted after reload and does not count it twice", async () => {
    const trainer = createTrainerWithCards([
      createCard("A"), createCard("5"), createCard("K"), createCard("A"),
      createCard("8"), createCard("9"),
    ], 6, undefined, true);
    const props = { trainer, dealerRevealDelayMs: 40, autoAdvanceDelayMs: 10_000 };
    const rendered = render(React.createElement(TrainerApp, props));
    await act(async () => { await vi.advanceTimersByTimeAsync(40); });
    expectCount("-2");
    rendered.unmount();
    render(React.createElement(TrainerApp, props));

    expectCount("-2");
    await act(async () => { await vi.advanceTimersByTimeAsync(40); });
    expectCount("-2");
  });

  test("restores a partly revealed dealer hand without counting its later draws early", async () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("2"), createCard("Q"), createCard("5"),
      createCard("3"), createCard("K"), createCard("8"), createCard("9"),
    ], 8, undefined, true);
    const props = {
      trainer,
      dealerRevealDelayMs: 30,
      dealerDrawIntervalMs: 30,
      autoAdvanceDelayMs: 10_000,
    };
    const rendered = render(React.createElement(TrainerApp, props));
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(30); });
    expectCount("+1");
    rendered.unmount();
    render(React.createElement(TrainerApp, props));

    expectCount("+1");
    await act(async () => { await vi.advanceTimersByTimeAsync(59); });
    expectCount("+1");
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expectCount("0");
  });

  test("counts ace-upcard blackjack only after insurance is declined and the hole card is revealed", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("K"), createCard("10"), createCard("A"),
      createCard("8"), createCard("9"),
    ], 6, undefined, true);
    render(<TrainerApp trainer={trainer} autoAdvanceDelayMs={10_000} />);

    expectCount("-3");
    fireEvent.click(screen.getByRole("button", { name: "No Insurance" }));
    expectCount("-4");
  });

  test("persists the running count across rounds and reloads, then resets for a new session", async () => {
    const trainer = createTrainerWithCards([
      createCard("2"), createCard("A"), createCard("3"), createCard("6"),
      createCard("4"), createCard("9"),
      createCard("10"), createCard("9"), createCard("10"), createCard("9"),
      createCard("8"), createCard("9"),
    ], 12, undefined, true);
    const props = { trainer, autoAdvanceDelayMs: 10_000, winCelebrationDurationMs: 100 };
    const rendered = render(React.createElement(TrainerApp, props));

    expectCount("+3");
    fireEvent.click(screen.getByRole("button", { name: "Hit" }));
    expectCount("+4");
    fireEvent.click(screen.getByRole("button", { name: "Hit" }));
    expectCount("+4");
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expectCount("+3");
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    fireEvent.click(screen.getByRole("button", { name: /^Keep \$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next Hand/i }));
    expectCount("+1");

    fireEvent.click(screen.getByRole("button", { name: "3:2" }));
    expectCount("+1");
    rendered.unmount();
    render(React.createElement(TrainerApp, props));
    expectCount("+1");
    fireEvent.click(screen.getByRole("button", { name: "New Session" }));
    fireEvent.click(screen.getByRole("button", { name: "Start New Session" }));
    expectCount("+3");
  });

  test("keeps counting the old shoe's delayed draws through a reshuffle", async () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("2"), createCard("Q"), createCard("5"),
      createCard("3"), createCard("K"),
    ], 6, undefined, true);
    render(<TrainerApp
      trainer={trainer}
      dealerRevealDelayMs={30}
      dealerDrawIntervalMs={30}
      autoAdvanceDelayMs={10_000}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expectCount("0");
    await act(async () => { await vi.advanceTimersByTimeAsync(30); });
    expectCount("+1");
    await act(async () => { await vi.advanceTimersByTimeAsync(30); });
    expectCount("0");
  });
});
