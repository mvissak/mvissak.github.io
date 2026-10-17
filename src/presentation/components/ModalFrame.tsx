"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ViewportPortal } from "@/presentation/components/ViewportPortal";

interface ModalFrameProps {
  titleId: string;
  children: ReactNode;
}

const modalFrames: HTMLElement[] = [];
let backgroundOverflow: string | null = null;

function ModalContent({ titleId, children }: ModalFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const previousFocus = document.activeElement;
    if (modalFrames.length === 0) backgroundOverflow = document.body.style.overflow;
    modalFrames.push(frame);
    document.body.style.overflow = "hidden";
    // Focusing the dialog avoids opening the phone keyboard before the user
    // has chosen to edit their wager.
    frame.focus({ preventScroll: true });

    const syncViewport = () => {
      frame.style.height = `${window.visualViewport?.height ?? window.innerHeight}px`;
      frame.style.top = `${window.visualViewport?.offsetTop ?? 0}px`;
    };
    syncViewport();
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);

    const containFocus = (event: FocusEvent) => {
      if (modalFrames.at(-1) !== frame) return;
      if (event.target instanceof Node && !frame.contains(event.target)) frame.focus({ preventScroll: true });
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || modalFrames.at(-1) !== frame) return;
      const controls = Array.from(frame.querySelectorAll<HTMLElement>("*")).filter(
        (element) => element.matches('button, input, a[href], [tabindex]') &&
          element.tabIndex >= 0 && !element.matches(":disabled"),
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first || (event.shiftKey && (document.activeElement === first || document.activeElement === frame))) {
        event.preventDefault();
        (last ?? frame).focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("focusin", containFocus);
    frame.addEventListener("keydown", trapTab);
    return () => {
      window.visualViewport?.removeEventListener("resize", syncViewport);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.removeEventListener("focusin", containFocus);
      frame.removeEventListener("keydown", trapTab);
      const wasTopFrame = modalFrames.at(-1) === frame;
      modalFrames.splice(modalFrames.indexOf(frame), 1);
      const remainingFrame = modalFrames.at(-1);
      if (!remainingFrame) {
        document.body.style.overflow = backgroundOverflow ?? "";
        backgroundOverflow = null;
      }
      if (wasTopFrame) {
        const focusTarget = previousFocus instanceof HTMLElement && previousFocus.isConnected &&
          (!remainingFrame || remainingFrame.contains(previousFocus)) ? previousFocus : remainingFrame;
        focusTarget?.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div ref={frameRef} tabIndex={-1} className="modal-frame fixed inset-x-0 top-0 z-50 grid place-items-center bg-overlay outline-none" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="table-panel max-h-full min-h-0 w-full max-w-xl overflow-y-auto overscroll-contain px-5 py-5 mobile:px-6 mobile:py-6">
        {children}
      </div>
    </div>
  );
}

export function ModalFrame(props: ModalFrameProps) {
  return <ViewportPortal><ModalContent {...props} /></ViewportPortal>;
}
