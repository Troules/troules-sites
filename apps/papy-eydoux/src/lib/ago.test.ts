import { describe, expect, it } from "vitest";
import { agoLabel } from "./ago";

// Intl fr-FR groups thousands with a narrow no-break space (U+202F).
const nnbsp = " ";

describe("agoLabel", () => {
  it("speaks in billions for the cosmic background", () => {
    expect(agoLabel(-13_800_000_000, 2026, true)).toBe("il y a environ 13,8 milliards d’années");
  });

  it("rounds millions", () => {
    expect(agoLabel(-375_000_000, 2026, true)).toBe("il y a environ 375 millions d’années");
  });

  it("counts years with French grouping", () => {
    expect(agoLabel(-36_000, 2026, true)).toBe(`il y a environ 38${nnbsp}000 ans`);
    expect(agoLabel(-1250, 2026, true)).toBe(`il y a environ 3${nnbsp}300 ans`);
    expect(agoLabel(1789, 2026)).toBe("il y a 237 ans");
  });

  it("handles the present", () => {
    expect(agoLabel(2026, 2026)).toBe("aujourd’hui");
    expect(agoLabel(2025, 2026)).toBe("il y a 1 an");
  });
});
