import { render } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const audioMocks = vi.hoisted(() => ({
  playDisappointedSound: vi.fn(),
  playDrinkPourSound: vi.fn(),
}));

vi.mock("@/presentation/audio/playDisappointedSound", () => ({
  playDisappointedSound: audioMocks.playDisappointedSound,
}));

vi.mock("@/presentation/audio/playDrinkPourSound", () => ({
  playDrinkPourSound: audioMocks.playDrinkPourSound,
}));

import { WaitressReactionModal } from "@/presentation/components/WaitressReactionModal";

describe("WaitressReactionModal", () => {
  beforeEach(() => {
    audioMocks.playDisappointedSound.mockReset();
    audioMocks.playDrinkPourSound.mockReset();
  });

  test("plays the drink pour sound for a valid drink confirmation", () => {
    render(
      <WaitressReactionModal
        onDismiss={() => undefined}
        reaction={{
          description: "The waitress says it will be right over.",
          title: "Cheers! Good luck with that.",
          tone: "neutral",
        }}
      />,
    );

    expect(audioMocks.playDrinkPourSound).toHaveBeenCalledTimes(1);
    expect(audioMocks.playDisappointedSound).not.toHaveBeenCalled();
  });

  test("plays the disappointed sound for negative waitress reactions", () => {
    render(
      <WaitressReactionModal
        onDismiss={() => undefined}
        reaction={{
          description: "The table thinks you are uncool.",
          title: "Bottled water?",
          tone: "disappointed",
        }}
      />,
    );

    expect(audioMocks.playDisappointedSound).toHaveBeenCalledTimes(1);
    expect(audioMocks.playDrinkPourSound).not.toHaveBeenCalled();
  });
});
