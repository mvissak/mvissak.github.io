import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { TrainerApp } from "@/presentation/components/TrainerApp";
import { createCard, createTrainerWithCards } from "@tests/helpers";

describe("count-aware player choices", () => {
  beforeEach(() => { window.sessionStorage.clear(); });

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
});
