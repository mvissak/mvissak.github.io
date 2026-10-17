import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { BlackjackPayoutControl } from "@/presentation/components/BlackjackPayoutControl";

test("exposes the selected payout and lets the user choose with the keyboard", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const { rerender } = render(<BlackjackPayoutControl value="6:5" onChange={onChange} />);

  expect(screen.getByRole("button", { name: "6:5" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "3:2" })).toHaveAttribute("aria-pressed", "false");
  await user.tab();
  await user.tab();
  expect(screen.getByRole("button", { name: "3:2" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith("3:2");

  rerender(<BlackjackPayoutControl value="3:2" onChange={onChange} />);
  expect(screen.getByRole("button", { name: "6:5" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByRole("button", { name: "3:2" })).toHaveAttribute("aria-pressed", "true");
});
