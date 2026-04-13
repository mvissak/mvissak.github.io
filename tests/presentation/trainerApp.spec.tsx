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

  test("uses an insurance prompt for ace upcards and routes a wrong yes answer through correction", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("9", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    expect(await screen.findByText("Dealer shows an ace.")).toBeInTheDocument();
    expect(screen.getByText(/Insurance costs \$12\.50/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, Buy Insurance" }));

    expect(await screen.findByText("No Insurance is the chart play.")).toBeInTheDocument();
    expect(screen.getByText(/Insurance is a negative-expectation side bet/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Choose Again" }));

    expect(await screen.findByText("Dealer shows an ace.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "No Insurance" }));

    expect(await screen.findByRole("button", { name: "Stand" })).toBeInTheDocument();
    expect(screen.queryByText("Dealer shows an ace.")).not.toBeInTheDocument();
  });

  test("does not interrupt the opening deal when a ten upcard is hiding blackjack", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("10", "clubs"),
      createCard("7", "hearts"),
      createCard("A", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    expect(await screen.findByRole("button", { name: "Stand" })).toBeInTheDocument();
    expect(screen.queryByText("Dealer shows an ace.")).not.toBeInTheDocument();
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stand" }));

    expect(await screen.findByText("Dealer Blackjack")).toBeInTheDocument();
  });

  test("shows the action area title during player decisions", async () => {
    const trainer = createTrainerWithCards([
      createCard("5"),
      createCard("2", "clubs"),
      createCard("A", "hearts"),
      createCard("10", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    expect(await screen.findByText("Choose an action")).toBeInTheDocument();
    expect(
      screen.queryByText(/These buttons show every legal action/i),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("action-bar").className).toContain("fixed");
    expect(screen.getByTestId("action-bar").className).toContain("desktop:static");
  });

  test("renders the tracked strategy reference in plain English at the bottom of the page", async () => {
    const trainer = createTrainerWithCards([
      createCard("5"),
      createCard("2", "clubs"),
      createCard("A", "hearts"),
      createCard("10", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer }));

    expect(await screen.findByText("Tracked Strategy, In Plain English")).toBeInTheDocument();
    expect(
      screen.getByText(
        /This trainer uses a total-based chart, not composition-dependent deviations/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Dealer 10 means any ten-value upcard: 10, J, Q, or K\./i),
    ).toBeInTheDocument();
    expect(screen.getByText("Hard 16:")).toBeInTheDocument();
    expect(screen.getByText("Soft A,7:")).toBeInTheDocument();
    expect(screen.getByText("Pair 10,10:")).toBeInTheDocument();
  });

  test("shows the next-hand countdown in the action area only after the round resolves", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(React.createElement(TrainerApp, { trainer, winCelebrationDurationMs: 120 }));

    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cash Out" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    const overlay = await screen.findByTestId("round-result-reaction");

    expect(within(overlay).getByText("YOU WIN")).toBeInTheDocument();
    expect(within(overlay).getByText("+$25")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Next Hand \(3s\)/i })).toBeInTheDocument();
    });
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

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 1_000,
        winCelebrationDurationMs: 10,
      }),
    );

    const wagerInput = await screen.findByLabelText("Base Bet");
    await user.clear(wagerInput);
    await user.type(wagerInput, "30");
    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Next Hand \(1s\)/i })).toBeInTheDocument();
    });
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

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 10_000,
        winCelebrationDurationMs: 10,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Next Hand/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "New Session" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Start a new session?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keep Playing" }));

    expect(screen.queryByText("Start a new session?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next Hand/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Session" }));
    await user.click(screen.getByRole("button", { name: "Start New Session" }));

    await waitFor(() => {
      expect(screen.queryByText("Start a new session?")).not.toBeInTheDocument();
    });

    expect(screen.queryByText("YOU WIN")).not.toBeInTheDocument();
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

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 10_000,
        winCelebrationDurationMs: 10,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cash Out" })).toBeInTheDocument();
    });
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

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 10_000,
        winCelebrationDurationMs: 10,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cash Out" })).toBeInTheDocument();
    });
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

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 40,
        winCelebrationDurationMs: 10,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    expect(screen.queryByText(/20 beats dealer 17/i)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Next Hand \(1s\)/i })).toBeEnabled();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Stand" })).toBeInTheDocument();
    });
    expect(screen.queryByText(/20 beats dealer 17/i)).not.toBeInTheDocument();
  });

  test("uses a full-screen result overlay instead of an inline player callout for wins", async () => {
    const user = userEvent.setup();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 1_000,
        winCelebrationDurationMs: 10,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));

    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
    expect(screen.getByTestId("victory-confetti")).toBeInTheDocument();
    expect(screen.queryByText("Win")).not.toBeInTheDocument();
    expect(screen.queryByText(/20 beats dealer 17/i)).not.toBeInTheDocument();
  });

  test("waits for the full dealer draw sequence before showing the round outcome overlay", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("5", "clubs"),
      createCard("Q", "hearts"),
      createCard("2", "diamonds"),
      createCard("3", "spades"),
      createCard("8", "clubs"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 1_000,
        dealerRevealDelayMs: 30,
        dealerDrawIntervalMs: 30,
        winCelebrationDurationMs: 60,
      }),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Stand" }));
    });

    expect(
      screen.getByText("Hole card is revealing before dealer draws continue."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });

    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });

    expect(screen.getByTestId("round-result-reaction")).toBeInTheDocument();
    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
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

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 1_000,
        winCelebrationDurationMs: 10,
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Stand" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Next Hand \(1s\)/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /Next Hand \(1s\)/i }));

    expect(screen.getByRole("button", { name: "Stand" })).toBeInTheDocument();
    expect(screen.queryByText(/20 beats dealer 17/i)).not.toBeInTheDocument();
  });

  test("shows a temporary victory overlay after a winning hand and only then exposes next hand", async () => {
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

    expect(screen.getByTestId("round-result-reaction")).toBeInTheDocument();
    expect(screen.getByText("YOU WIN")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next Hand/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: "No Insurance" }));

    const overlay = screen.getByTestId("round-result-reaction");

    expect(overlay).toBeInTheDocument();
    expect(within(overlay).getByText("Dealer Blackjack")).toBeInTheDocument();
    expect(within(overlay).getByText("-$25")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
  });

  test("shows a temporary loss overlay after a losing hand", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("Q", "clubs"),
      createCard("7", "hearts"),
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

    const overlay = screen.getByTestId("round-result-reaction");

    expect(overlay).toBeInTheDocument();
    expect(within(overlay).getByText("Loss")).toBeInTheDocument();
    expect(within(overlay).getByText("-$25")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
  });

  test("shows a temporary push overlay before exposing the next hand controls", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("9", "clubs"),
      createCard("7", "hearts"),
      createCard("8", "diamonds"),
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

    const overlay = screen.getByTestId("round-result-reaction");

    expect(overlay).toBeInTheDocument();
    expect(within(overlay).getByText("Push")).toBeInTheDocument();
    expect(within(overlay).queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Next Hand/i })).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next Hand/i })).toBeInTheDocument();
  });

  test("shows a full-screen blackjack overlay for a player natural blackjack win", async () => {
    vi.useFakeTimers();
    const trainer = createTrainerWithCards([
      createCard("A"),
      createCard("6", "clubs"),
      createCard("K", "hearts"),
      createCard("9", "diamonds"),
    ]);

    render(
      React.createElement(TrainerApp, {
        trainer,
        autoAdvanceDelayMs: 10_000,
        winCelebrationDurationMs: 60,
      }),
    );

    const overlay = screen.getByTestId("round-result-reaction");
    expect(overlay).toBeInTheDocument();
    expect(within(overlay).getByText("Blackjack")).toBeInTheDocument();
    expect(within(overlay).getByText("+$37.50")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(screen.queryByTestId("round-result-reaction")).not.toBeInTheDocument();
  });
});
