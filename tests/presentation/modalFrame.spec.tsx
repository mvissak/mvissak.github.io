import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { ModalFrame } from "@/presentation/components/ModalFrame";

test("contains keyboard focus, skips disabled controls, and restores background focus and scrolling", async () => {
  const user = userEvent.setup();
  const background = document.createElement("button");
  document.body.append(background);
  background.focus();
  document.body.style.overflow = "auto";
  const mounted = render(
    <ModalFrame titleId="title">
      <h2 id="title">Next bet</h2>
      <input aria-label="Wager" />
      <button disabled>Decrease</button>
      <button>Keep</button>
    </ModalFrame>,
  );
  expect(screen.getByRole("dialog")).toHaveFocus();
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
  expect(screen.getByRole("button", { name: "Keep" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("textbox")).toHaveFocus();
  await user.tab({ shift: true });
  expect(screen.getByRole("button", { name: "Keep" })).toHaveFocus();
  background.focus();
  expect(screen.getByRole("dialog")).toHaveFocus();
  mounted.unmount();
  expect(document.body.style.overflow).toBe("auto");
  expect(background).toHaveFocus();
  background.remove();
  document.body.style.overflow = "";
});

test("follows the visible viewport when the mobile keyboard reduces available space", () => {
  const previous = Object.getOwnPropertyDescriptor(window, "visualViewport");
  const viewport = Object.assign(new EventTarget(), { height: 640, offsetTop: 0 });
  Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  try {
    const mounted = render(<ModalFrame titleId="title"><h2 id="title">Next bet</h2></ModalFrame>);
    expect(screen.getByRole("dialog")).toHaveStyle({ height: "640px", top: "0px" });
    act(() => {
      viewport.height = 280;
      viewport.offsetTop = 40;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByRole("dialog")).toHaveStyle({ height: "280px", top: "40px" });
    mounted.unmount();
  } finally {
    if (previous) Object.defineProperty(window, "visualViewport", previous);
    else Reflect.deleteProperty(window, "visualViewport");
  }
});

test("returns focus to an underlying insurance dialog after dismissing a correction", async () => {
  const user = userEvent.setup();
  const insurance = render(<ModalFrame titleId="insurance"><h2 id="insurance">Insurance</h2><button>Decline</button></ModalFrame>);
  const correction = render(<ModalFrame titleId="correction"><h2 id="correction">Correction</h2><button>Choose Again</button></ModalFrame>);
  expect(screen.getByRole("dialog", { name: "Correction" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Choose Again" })).toHaveFocus();
  correction.unmount();
  expect(screen.getByRole("dialog", { name: "Insurance" })).toHaveFocus();
  expect(document.body.style.overflow).toBe("hidden");
  insurance.unmount();
  expect(document.body.style.overflow).toBe("");
});
