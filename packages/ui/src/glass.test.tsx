import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Glass, supportsBackdropSvgFilter } from "./glass";

describe("Glass", () => {
  it("renders the requested element with glass classes", () => {
    render(
      <Glass as="a" href="/x" interactive className="p-4">
        link
      </Glass>,
    );
    const a = screen.getByRole("link", { name: "link" });
    expect(a.tagName).toBe("A");
    expect(a.className).toBe("glass glass-interactive p-4");
  });

  it("is not interactive by default", () => {
    render(<Glass>plain</Glass>);
    expect(screen.getByText("plain").className).toBe("glass");
  });
});

describe("supportsBackdropSvgFilter", () => {
  it("detects Chromium via userAgentData", () => {
    expect(supportsBackdropSvgFilter({ userAgentData: {} } as unknown as Navigator)).toBe(true);
    expect(supportsBackdropSvgFilter({} as Navigator)).toBe(false);
    expect(supportsBackdropSvgFilter(undefined)).toBe(false);
  });
});
