/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  it("renders a link with the correct href and text", () => {
    render(<Button href="/register">Register</Button>);
    const link = screen.getByRole("link", { name: "Register" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/register");
  });

  it("applies primary variant styles by default", () => {
    render(<Button href="/test">Click</Button>);
    const link = screen.getByRole("link", { name: "Click" });
    expect(link.className).toContain("bg-accent");
  });

  it("applies secondary variant styles", () => {
    render(
      <Button href="/test" variant="secondary">
        Link
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Link" });
    expect(link.className).toContain("underline");
    expect(link.className).not.toContain("bg-accent");
  });
});
