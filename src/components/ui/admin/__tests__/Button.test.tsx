/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../Button";

describe("admin Button", () => {
  test("should render children as the button label", () => {
    // when
    render(<Button>Save</Button>);

    // then
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });

  test("should invoke onClick when clicked", () => {
    // given
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);

    // when
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    // then
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("should disable itself and show spinner when loading is true", () => {
    // given
    // - loading state: button must remain present but not actionable
    render(<Button loading>Saving</Button>);

    // then
    const btn = screen.getByRole("button");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    // - the spinner announces a busy state
    expect(btn.getAttribute("aria-busy")).toBe("true");
  });

  test("should not invoke onClick when loading", () => {
    // given
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        Saving
      </Button>,
    );

    // when
    fireEvent.click(screen.getByRole("button"));

    // then
    expect(onClick).not.toHaveBeenCalled();
  });

  test("should not invoke onClick when disabled", () => {
    // given
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Blocked
      </Button>,
    );

    // when
    fireEvent.click(screen.getByRole("button"));

    // then
    expect(onClick).not.toHaveBeenCalled();
  });

  test("should apply distinct classes for each variant", () => {
    // given
    // - each variant has a data-variant marker for deterministic assertion
    const { rerender } = render(<Button variant="primary">P</Button>);
    const primary = screen.getByRole("button").getAttribute("data-variant");

    rerender(<Button variant="secondary">S</Button>);
    const secondary = screen.getByRole("button").getAttribute("data-variant");

    rerender(<Button variant="ghost">G</Button>);
    const ghost = screen.getByRole("button").getAttribute("data-variant");

    rerender(<Button variant="danger">D</Button>);
    const danger = screen.getByRole("button").getAttribute("data-variant");

    // then
    expect(primary).toBe("primary");
    expect(secondary).toBe("secondary");
    expect(ghost).toBe("ghost");
    expect(danger).toBe("danger");
  });

  test("should expose size marker when size prop is set", () => {
    // when
    render(<Button size="sm">Small</Button>);

    // then
    expect(screen.getByRole("button").getAttribute("data-size")).toBe("sm");
  });

  test("should default to type='button' when type is not specified", () => {
    // when
    render(<Button>Plain</Button>);

    // then
    expect(
      (screen.getByRole("button") as HTMLButtonElement).type,
    ).toBe("button");
  });
});
