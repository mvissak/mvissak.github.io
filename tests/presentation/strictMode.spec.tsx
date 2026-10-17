import React, { StrictMode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { TrainerApp } from "@/presentation/components/TrainerApp";
import { createCard, createTrainerWithCards } from "@tests/helpers";

beforeEach(() => window.sessionStorage.clear());

test("consumes one card and records one decision per hit under StrictMode", () => {
  const trainer = createTrainerWithCards([
    createCard("2"), createCard("10"), createCard("3"), createCard("7"),
    createCard("4"), createCard("5"),
  ], 200, undefined, true);
  const submit = vi.spyOn(trainer, "submitAction");
  render(<StrictMode><TrainerApp trainer={trainer} /></StrictMode>);
  fireEvent.click(screen.getByRole("button", { name: "Hit" }));
  expect(submit).toHaveBeenCalledTimes(1);
  const state = submit.mock.results[0].value;
  expect(state.round.playerHands[0].cards.map((card: { rank: string }) => card.rank)).toEqual(["2", "3", "4"]);
  expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(5);
  expect(screen.getByRole("group", { name: "Current Streak" })).toHaveTextContent("1");
});

test.each([
  { action: "Double", player: ["5", "6"] as const, draw: "3" as const, expectedHands: 1 },
  { action: "Split", player: ["8", "8"] as const, draw: "3" as const, expectedHands: 2 },
])("consumes the prescribed cards once for $action under StrictMode", ({ action, player, draw, expectedHands }) => {
  const trainer = createTrainerWithCards([
    createCard(player[0]), createCard("10"), createCard(player[1]), createCard("6"),
    createCard(draw), createCard("2"), createCard("K"),
  ], 200, undefined, true);
  const submit = vi.spyOn(trainer, "submitAction");
  render(<StrictMode><TrainerApp trainer={trainer} /></StrictMode>);
  fireEvent.click(screen.getByRole("button", { name: action }));
  expect(submit).toHaveBeenCalledTimes(1);
  const state = submit.mock.results[0].value;
  expect(state.round.playerHands).toHaveLength(expectedHands);
  expect(state.round.playerHands[0].cards.at(-1).rank).toBe(draw);
  expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(action === "Double" ? 6 : 5);
});

test("starts one fresh session per confirmed reset under StrictMode", () => {
  const trainer = createTrainerWithCards([
    createCard("10"), createCard("9"), createCard("10"), createCard("10"),
  ], 200, undefined, true);
  const start = vi.spyOn(trainer, "startNewSession");
  render(<StrictMode><TrainerApp trainer={trainer} /></StrictMode>);
  expect(start).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "New Session" }));
  fireEvent.click(screen.getByRole("button", { name: "Start New Session" }));
  expect(start).toHaveBeenCalledTimes(2);
});
