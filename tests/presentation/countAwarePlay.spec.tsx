import React, { StrictMode } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TrainerApp } from "@/presentation/components/TrainerApp";
import { SessionStorageTrainerStore } from "@/infrastructure/SessionStorageTrainerStore";
import { createCard, createTrainerWithCards } from "@tests/helpers";

describe("count-aware player choices", () => {
  beforeEach(() => { window.sessionStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); });

  const seedOpportunity = (insurance = false) => {
    const trainer = createTrainerWithCards(insurance ? [
      createCard("10"), createCard("K"), createCard("10"), createCard("A"),
    ] : [
      createCard("10"), createCard("7"), createCard("6"), createCard("10"), createCard("2"),
    ], 200, undefined, true);
    const state = { ...trainer.startNewSession(), runningCountBeforeRound: insurance ? 21 : 8 };
    new SessionStorageTrainerStore().save(trainer.createSnapshot(state));
    return trainer;
  };

  test("accepts an indexed stand without correction or a mistake", () => {
    const trainer = createTrainerWithCards([
      createCard("2"), createCard("7"), createCard("2"), createCard("10"),
      createCard("3"), createCard("3"), createCard("6"), createCard("9"),
    ], 8, undefined, true);
    render(<TrainerApp trainer={trainer} />);
    fireEvent.click(screen.getByRole("button", { name: "Hit" }));
    fireEvent.click(screen.getByRole("button", { name: "Hit" }));
    fireEvent.click(screen.getByRole("button", { name: "Hit" }));
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expect(screen.getByRole("dialog", { name: "Good count read" })).toHaveTextContent("Hi-Lo favors stand on 16 vs 10");
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("status")).toHaveTextContent("Count play accepted");
    expect(screen.queryByRole("button", { name: "Choose Again" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Mistakes" })).getByText("0")).toBeInTheDocument();
  });

  test("does not substitute a positive running count for a qualifying true count", () => {
    const trainer = createTrainerWithCards([createCard("4"), createCard("10"), createCard("5"), createCard("2")], 4, undefined, true);
    render(<TrainerApp trainer={trainer} />);
    expect(within(screen.getByRole("group", { name: "Running Count" })).getByText("+3")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "True Count" })).getByText("+0.506")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Double" }));
    expect(screen.getByText("Hit is the chart play.")).toBeInTheDocument();
  });

  test.each([
    { choice: "Use Stand", cards: 2, notice: "Count play accepted" },
    { choice: "Keep Hit", cards: 3, notice: "Basic strategy accepted" },
  ])("teaches the count opportunity after a chart choice and honors $choice", async ({ choice, cards, notice }) => {
    vi.useFakeTimers();
    const trainer = seedOpportunity();
    render(<TrainerApp trainer={trainer} autoAdvanceDelayMs={40} winCelebrationDurationMs={60} drinkOfferInitialDelayMs={10} />);
    fireEvent.click(screen.getByRole("button", { name: "Hit" }));
    const lesson = screen.getByRole("dialog", { name: "Good chart recall" });
    expect(lesson).toHaveTextContent("You chose Hit, which follows basic strategy. The count favors Stand here.");
    expect(lesson).toHaveTextContent("At true count +1.181");
    expect(lesson).toHaveTextContent("Hi-Lo favors stand on 16 vs 10 when the true count is at or above 0");
    expect(lesson).toHaveTextContent("Keeping the chart move adds no mistake");
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(lesson).toBeInTheDocument();
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    const before = new SessionStorageTrainerStore().load();
    expect(before?.shoe.drawIndex).toBe(4);
    expect(before?.state.stats.decisionPointsResolved).toBe(0);
    fireEvent.click(within(lesson).getByRole("button", { name: choice }));
    expect(screen.queryByRole("dialog", { name: "Good chart recall" })).not.toBeInTheDocument();
    const after = new SessionStorageTrainerStore().load();
    expect(after?.state.round?.playerHands[0].cards).toHaveLength(cards);
    expect(after?.state.stats.mistakesMade).toBe(0);
    expect(after?.state.stats.correctFirstTryDecisions).toBe(1);
    expect(screen.getByRole("status")).toHaveTextContent(notice);
  });

  test("persists an unacknowledged lesson on reload and confirms once in StrictMode", () => {
    const trainer = seedOpportunity();
    const confirm = vi.spyOn(trainer, "confirmCountFeedback");
    const first = render(<TrainerApp trainer={trainer} />);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    expect(screen.getByRole("dialog", { name: "Good count read" })).toHaveFocus();
    first.unmount();
    render(<StrictMode><TrainerApp trainer={trainer} /></StrictMode>);
    const lesson = screen.getByRole("dialog", { name: "Good count read" });
    expect(lesson).toHaveTextContent("You chose Stand, the preferred count-based play");
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    fireEvent.click(within(lesson).getByRole("button", { name: "Continue" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "Good count read" })).not.toBeInTheDocument();
    expect(new SessionStorageTrainerStore().load()?.state.stats.decisionPointsResolved).toBe(1);
  });

  test.each(["Yes, Buy Insurance", "No Insurance"])("explains %s at a qualifying count before the insurance peek", (choice) => {
    const trainer = seedOpportunity(true);
    render(<TrainerApp trainer={trainer} />);
    fireEvent.click(screen.getByRole("button", { name: choice }));
    const lesson = screen.getByRole("dialog", { name: choice === "No Insurance" ? "Good chart recall" : "Good count read" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(lesson).toHaveTextContent("Hi-Lo favors buying insurance at a true count of 3 or higher");
    expect(lesson).toHaveTextContent("dealer's hole card is worth ten");
    expect(new SessionStorageTrainerStore().load()?.state.round?.insuranceBet).toBe(0);
    fireEvent.click(within(lesson).getByRole("button", { name: choice === "No Insurance" ? "Buy Insurance" : "Continue" }));
    expect(new SessionStorageTrainerStore().load()?.state.round?.insuranceBet).toBe(12.5);
  });

  test("starts dealer draws and the result only after the count lesson is confirmed", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("2"), createCard("6"), createCard("10"), createCard("3"), createCard("K"),
    ], 200, undefined, true);
    new SessionStorageTrainerStore().save(trainer.createSnapshot({ ...trainer.startNewSession(), runningCountBeforeRound: 8 }));
    render(<TrainerApp trainer={trainer} dealerRevealDelayMs={30} dealerDrawIntervalMs={30} winCelebrationDurationMs={60} />);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(screen.getByRole("dialog", { name: "Good count read" })).toBeInTheDocument();
    expect(new SessionStorageTrainerStore().load()?.shoe.drawIndex).toBe(4);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Running Count" })).getByText("+8")).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(30); });
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Running Count" })).getByText("+9")).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(30); });
    expect(screen.getByTestId("round-result-reaction")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Running Count" })).getByText("+8")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Choose your next bet" })).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(60); });
    expect(screen.getByRole("dialog", { name: "Choose your next bet" })).toBeInTheDocument();
  });
});
