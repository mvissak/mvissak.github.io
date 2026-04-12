import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TrainerApp } from "@/presentation/components/TrainerApp";
import { createCard, createTrainerWithCards, FixedRandomSource } from "@tests/helpers";

describe("TrainerApp", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("shows the correction modal and keeps the hand in place on a wrong action", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("10", "clubs"),
      createCard("6", "hearts"),
      createCard("7", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    const standButton = await screen.findByRole("button", { name: "Stand" });
    await user.click(standButton);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Hit is the chart play.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Choose Again" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "$25 chip" })).toBeInTheDocument();
    expect(screen.queryByText("Bet $25.00")).not.toBeInTheDocument();
  });

  test("explains that the action buttons are legal options, not chart recommendations", async () => {
    const trainer = createTrainerWithCards([
      createCard("5"),
      createCard("2", "clubs"),
      createCard("A", "hearts"),
      createCard("10", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    expect(await screen.findByText("Choose an action")).toBeInTheDocument();
    expect(
      screen.getByText(
        "These buttons show every legal action, not the recommended chart play. The hand will not advance until you choose the correct basic-strategy move.",
      ),
    ).toBeInTheDocument();
  });

  test("shows the next-hand countdown in the action area only after the round resolves", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cash Out" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    expect(screen.getByRole("button", { name: /Next Hand \(5s\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cash Out" })).toBeInTheDocument();
    expect(screen.getByText("Hand complete")).toBeInTheDocument();
  });

  test("shows configured bets as stacked denominations on the next hand", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("9", "clubs"),
      createCard("6", "diamonds"),
      createCard("7", "spades"),
      createCard("K", "hearts"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 1_000 }));

    const wagerInput = await screen.findByLabelText("Base Bet");
    await user.clear(wagerInput);
    await user.type(wagerInput, "30");
    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await user.click(screen.getByRole("button", { name: /Next Hand \(1s\)/i }));

    expect(await screen.findByRole("img", { name: "$25 chip" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "$5 chip" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "$30 chip" })).not.toBeInTheDocument();
  });

  test("asks for confirmation before starting a new session", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 10_000 }));

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    expect(screen.getByText("Win")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Session" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Start a new session?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep Playing" }));

    expect(screen.queryByText("Start a new session?")).not.toBeInTheDocument();
    expect(screen.getByText("Win")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Session" }));
    await user.click(screen.getByRole("button", { name: "Start New Session" }));

    await waitFor(() => {
      expect(screen.queryByText("Start a new session?")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("Win")).not.toBeInTheDocument();
    expect(screen.getByText("Choose an action")).toBeInTheDocument();
  });

  test("shows a positive cash-out message with a ridiculous purchase example when the player is ahead", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 10_000 }));

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await user.click(screen.getByRole("button", { name: "Cash Out" }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText("Cash out approved. Nicely done.")).toBeInTheDocument();
    expect(within(dialog).getByText("$25.00")).toBeInTheDocument();
    expect(within(dialog).getByText(/victory diner breakfast/i)).toBeInTheDocument();
    expect(screen.getByText("Choose an action")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  test("shows a muted cash-out message when the player is down", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("Q", "clubs"),
      createCard("7", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 10_000 }));

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await user.click(screen.getByRole("button", { name: "Cash Out" }));

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText("Cash out logged. Nothing dramatic happened."),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("-$25.00")).toBeInTheDocument();
    expect(within(dialog).getByText(/infinite bankroll/i)).toBeInTheDocument();
    expect(screen.getByText("Choose an action")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  test("shows the first waitress interruption 30 seconds into a new session", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        drinkOfferInitialDelayMs: 30,
        drinkOfferMaximumIntervalMs: 100,
        drinkOfferMinimumIntervalMs: 100,
        drinkOfferRandomSource: new FixedRandomSource([0]),
        drinkOfferResponseTimeoutMs: 60,
      }),
    );

    expect(screen.queryByText("The waitress just walked over.")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29);
    });

    expect(screen.queryByText("The waitress just walked over.")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(screen.getByText("The waitress just walked over.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heineken" })).toBeInTheDocument();
  });

  test("treats bottled water as the wrong answer from the waitress", async () => {
    vi.useFakeTimers();
    render(
      React.createElement(TrainerApp, {
        drinkOfferInitialDelayMs: 10,
        drinkOfferMaximumIntervalMs: 100,
        drinkOfferMinimumIntervalMs: 100,
        drinkOfferRandomSource: new FixedRandomSource([0]),
        drinkOfferResponseTimeoutMs: 60,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    fireEvent.click(screen.getByRole("button", { name: "Bottled Water" }));

    expect(screen.getByText("Bottled water?")).toBeInTheDocument();
    expect(screen.getByText(/table thinks you are uncool/i)).toBeInTheDocument();
  });

  test("shows a follow-up confirmation for a valid drink order", async () => {
    vi.useFakeTimers();
    render(
      React.createElement(TrainerApp, {
        drinkOfferInitialDelayMs: 10,
        drinkOfferMaximumIntervalMs: 100,
        drinkOfferMinimumIntervalMs: 100,
        drinkOfferRandomSource: new FixedRandomSource([0]),
        drinkOfferResponseTimeoutMs: 60,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    fireEvent.click(screen.getByRole("button", { name: "Heineken" }));

    expect(screen.getByText("Cheers! Good luck with that.")).toBeInTheDocument();
    expect(screen.getByText(/bets this small/i)).toBeInTheDocument();
    expect(screen.getByText(/never makes it back to the table/i)).toBeInTheDocument();
  });

  test("shows a too-late waitress reaction after 15 seconds without an answer", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        drinkOfferInitialDelayMs: 10,
        drinkOfferMaximumIntervalMs: 100,
        drinkOfferMinimumIntervalMs: 100,
        drinkOfferRandomSource: new FixedRandomSource([0]),
        drinkOfferResponseTimeoutMs: 40,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(screen.getByText("The waitress just walked over.")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45);
    });

    expect(screen.getByText("Too slow.")).toBeInTheDocument();
    expect(screen.getByText(/waitress walked away/i)).toBeInTheDocument();
  });

  test("automatically deals the next hand after the countdown expires", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("9", "clubs"),
      createCard("6", "diamonds"),
      createCard("7", "spades"),
      createCard("K", "hearts"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 40 }));

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    expect(screen.getAllByText(/20 beats dealer 17/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Next Hand \(1s\)/i })).toBeEnabled();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Stand" })).toBeInTheDocument();
    });
    expect(screen.queryByText(/20 beats dealer 17/i)).not.toBeInTheDocument();
  });

  test("renders resolved outcomes as prominent callouts", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 1_000 }));

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    expect(screen.getByText("Win")).toBeInTheDocument();
    expect(screen.getByText("+$25.00")).toBeInTheDocument();
  });

  test("waits for the dealer hole-card flip before showing additional dealer draws and the round outcome", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("6", "clubs"),
      createCard("9", "hearts"),
      createCard("10", "diamonds"),
      createCard("3", "spades"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 1_000,
        dealerRevealDelayMs: 30,
        dealerDrawIntervalMs: 30,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    expect(
      screen.getByText("Hole card is revealing before dealer draws continue."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Push")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Push")).toBeInTheDocument();
    });
  });

  test("lets the player advance to the next hand before the countdown ends", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("9", "clubs"),
      createCard("6", "diamonds"),
      createCard("7", "spades"),
      createCard("K", "hearts"),
    ]);

    render(React.createElement(TrainerApp, { trainer, autoAdvanceDelayMs: 1_000 }));

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await user.click(screen.getByRole("button", { name: /Next Hand \(1s\)/i }));

    expect(screen.getByRole("button", { name: "Stand" })).toBeInTheDocument();
    expect(screen.queryByText(/20 beats dealer 17/i)).not.toBeInTheDocument();
  });

  test("shows a temporary celebration overlay after a winning hand", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 10_000,
        winCelebrationDurationMs: 60,
      }),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    });

    expect(screen.getByTestId("win-celebration")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("win-celebration")).not.toBeInTheDocument();
  });

  test("shows a temporary dealer-blackjack reaction overlay and clears it after the animation", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("K", "diamonds"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 10_000,
        winCelebrationDurationMs: 60,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId("dealer-blackjack-reaction")).toBeInTheDocument();
    expect(screen.getByText("Dealer Blackjack")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("dealer-blackjack-reaction")).not.toBeInTheDocument();
  });
});
