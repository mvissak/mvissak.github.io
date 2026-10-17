import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { CardCountingReferencePanel } from "@/presentation/components/CardCountingReferencePanel";
import { buildCardCountingReferenceViewModel } from "@/presentation/view-models/buildCardCountingReferenceViewModel";

describe("card counting reference", () => {
  test.each([
    { count: 6, title: "Positive count", label: "+6 running count · positive" },
    { count: 0, title: "Zero count", label: "0 running count · neutral" },
    { count: -6, title: "Negative count", label: "-6 running count · negative" },
  ])("highlights $title using the running count", ({ count, title, label }) => {
    const reference = buildCardCountingReferenceViewModel(count, "6:5");
    render(<CardCountingReferencePanel reference={reference} />);

    expect(screen.getByText(label, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: title })).toHaveAttribute("aria-current", "true");
    expect(reference.sections.filter((section) => section.isCurrent)).toHaveLength(1);
    expect(screen.getByText(/Supported Hi-Lo exceptions are also accepted at their true-count indices/i)).toBeInTheDocument();
    expect(screen.getByText(/True count = running count ÷ estimated decks remaining/)).toBeInTheDocument();
    expect(screen.getByText(/validation uses the unrounded true count/)).toBeInTheDocument();
    expect(screen.getByText(/This hand pays 6:5/)).toBeInTheDocument();
  });

  test("shows sourced study thresholds separately from the trainer's enforced strategy", async () => {
    const user = userEvent.setup();
    render(<CardCountingReferencePanel reference={buildCardCountingReferenceViewModel(2, "3:2")} />);
    const summary = screen.getByText("Supported Hi-Lo true-count indices");
    expect(summary.closest("details")).not.toHaveAttribute("open");
    await user.click(summary);
    expect(summary.closest("details")).toHaveAttribute("open");
    const table = screen.getByRole("table", { name: /Supported Hi-Lo deviations by true count/ });
    const row = within(table).getByRole("row", { name: /≥ \+4/ });
    expect(within(row).getByText("Stand hard 15 vs 10.")).toBeInTheDocument();
    expect(within(row).getByText("Double hard 10 vs A.")).toBeInTheDocument();
    expect(screen.getByText(/These Hi-Lo plays are accepted alongside basic strategy when their index applies/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Hi-Lo and index reference" })).toHaveAttribute(
      "href", "https://wizardofodds.com/games/blackjack/card-counting/high-low/",
    );
    expect(screen.getByText(/This hand pays 3:2/)).toBeInTheDocument();
  });
});
