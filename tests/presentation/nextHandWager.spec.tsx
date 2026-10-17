import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TrainerApp } from "@/presentation/components/TrainerApp";
import { createCard, createTrainerWithCards } from "@tests/helpers";

const createTrainer = (bet = 100) => createTrainerWithCards([
  createCard("10"), createCard("7"), createCard("Q"), createCard("10"),
  createCard("10"), createCard("7"), createCard("Q"), createCard("10"),
  createCard("9"), createCard("9"),
], 10, bet, true);

const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

describe("next-hand wager prompt", () => {
  beforeEach(() => { window.sessionStorage.clear(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test("waits for the result, blocks auto-advance, and applies a custom increase to the next hand", async () => {
    render(<TrainerApp trainer={createTrainer()} autoAdvanceDelayMs={40} winCelebrationDurationMs={60} />);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expect(screen.queryByRole("dialog", { name: "Choose your next bet" })).not.toBeInTheDocument();
    await advance(60);
    const prompt = screen.getByRole("dialog", { name: "Choose your next bet" });
    expect(prompt).toHaveFocus();
    expect(within(prompt).getByRole("spinbutton", { name: "Custom bet amount" })).not.toHaveFocus();
    await advance(10_000);
    expect(prompt).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Custom bet amount" }), { target: { value: "1001" } });
    fireEvent.click(screen.getByRole("button", { name: "Increase bet" }));
    expect(screen.getByRole("alert")).toHaveTextContent("from $25 to $1000");
    expect(screen.getByRole("spinbutton", { name: "Custom bet amount" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Base Bet" })).toHaveValue("100");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Custom bet amount" }), { target: { value: "137" } });
    fireEvent.click(screen.getByRole("button", { name: "Increase bet" }));
    expect(screen.queryByRole("dialog", { name: "Choose your next bet" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Base Bet" })).toHaveValue("137");
    await advance(40);
    expect(screen.getByRole("button", { name: "Stand" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expect(screen.queryByRole("dialog", { name: "Choose your next bet" })).not.toBeInTheDocument();
    await advance(60);
    expect(screen.getByRole("button", { name: "Keep $137.00" })).toBeInTheDocument();
  });

  test("supports a custom decrease and remembers the pending choice on reload", async () => {
    const trainer = createTrainer();
    const props = { trainer, autoAdvanceDelayMs: 40, winCelebrationDurationMs: 60 };
    const rendered = render(React.createElement(TrainerApp, props));
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    await advance(60);
    rendered.unmount();
    render(React.createElement(TrainerApp, props));
    await advance(60);
    expect(screen.getByRole("dialog", { name: "Choose your next bet" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Custom bet amount" }), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Decrease bet" }));
    expect(screen.getByRole("textbox", { name: "Base Bet" })).toHaveValue("25");
    await advance(40);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    await advance(60);
    expect(screen.getByRole("button", { name: "Decrease bet" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Keep $25.00" })).toBeEnabled();
  });

  test("disables increases at the maximum and lets the user keep the wager", async () => {
    render(<TrainerApp trainer={createTrainer(1000)} autoAdvanceDelayMs={40} winCelebrationDurationMs={60} />);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    await advance(60);
    expect(screen.getByRole("button", { name: "Increase bet" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Keep $1,000.00" }));
    expect(screen.getByRole("textbox", { name: "Base Bet" })).toHaveValue("1000");
    await advance(40);
    expect(screen.getByRole("button", { name: "Stand" })).toBeInTheDocument();
  });

  test("prompts after an opening natural blackjack and identifies a new shoe", async () => {
    const trainer = createTrainerWithCards([createCard("A"), createCard("9"), createCard("K"), createCard("6")], 4, undefined, true);
    render(<TrainerApp trainer={trainer} blackjackReactionDelayMs={40} winCelebrationDurationMs={60} />);
    await advance(99);
    expect(screen.queryByRole("dialog", { name: "Choose your next bet" })).not.toBeInTheDocument();
    await advance(1);
    expect(screen.getByRole("dialog", { name: "Choose your next bet" })).toBeInTheDocument();
    const notice = screen.getByRole("status", { name: "Shoe update" });
    expect(notice).toHaveTextContent("Shoe reshuffled");
    expect(notice).toHaveTextContent("A fresh 6-deck shoe is ready for the next hand");
    expect(notice).toHaveTextContent("running count will restart at 0 before the next deal");
  });

  test("keeps the new-shoe notice on the table after dealing and reloading the first hand", async () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
    ], 4, undefined, true);
    const props = { trainer, autoAdvanceDelayMs: 10_000, winCelebrationDurationMs: 60 };
    const mounted = render(<TrainerApp {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    await advance(60);
    expect(within(screen.getByRole("dialog", { name: "Choose your next bet" })).getByRole("status", { name: "Shoe update" })).toHaveTextContent("Shoe reshuffled");
    fireEvent.click(screen.getByRole("button", { name: "Keep $25.00" }));
    fireEvent.click(screen.getByRole("button", { name: /Next Hand/i }));
    expect(screen.getByRole("status", { name: "Shoe update" })).toHaveTextContent("New shoe in play");
    mounted.unmount();
    render(<TrainerApp {...props} />);
    expect(screen.getByRole("status", { name: "Shoe update" })).toHaveTextContent("running count restarted at 0 before this hand's face-up cards were counted");
  });
});
