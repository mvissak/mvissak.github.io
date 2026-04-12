import { describe, expect, test } from "vitest";
import { buildCashOutMessage } from "@/presentation/view-models/buildCashOutMessage";

describe("buildCashOutMessage", () => {
  test("returns a congratulatory message with a funny purchase for positive winnings", () => {
    const result = buildCashOutMessage(150);

    expect(result.tone).toBe("positive");
    expect(result.sessionTotalLabel).toBe("$150.00");
    expect(result.headline).toContain("Nicely done");
    expect(result.description).toContain("karaoke machine");
  });

  test("returns a restrained message for negative winnings", () => {
    const result = buildCashOutMessage(-40);

    expect(result.tone).toBe("neutral");
    expect(result.sessionTotalLabel).toBe("-$40.00");
    expect(result.description).toContain("infinite bankroll");
  });
});
