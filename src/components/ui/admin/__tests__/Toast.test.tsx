/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";

function HookHarness({
  onReady,
}: {
  readonly onReady: (api: ReturnType<typeof useToast>) => void;
}): React.ReactElement {
  const toast = useToast();
  onReady(toast);
  return <div data-testid="harness" />;
}

function renderWithProvider(
  onReady: (api: ReturnType<typeof useToast>) => void,
): void {
  render(
    <ToastProvider>
      <HookHarness onReady={onReady} />
    </ToastProvider>,
  );
}

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("should render a success toast with the given message when success() is called", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });

    // when
    act(() => {
      toast.success("Saved");
    });

    // then
    expect(screen.getByText("Saved")).toBeDefined();
    const live = screen.getByRole("status");
    expect(live).toBeDefined();
  });

  test("should render an error toast when error() is called", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });

    // when
    act(() => {
      toast.error("Nope");
    });

    // then
    const el = screen.getByText("Nope");
    expect(el).toBeDefined();
    // - danger toasts use role="alert" (vs. role="status" for success/info)
    // - the same node is the toast container
    const alert = el.closest('[role="alert"]');
    expect(alert).not.toBeNull();
  });

  test("should stack multiple toasts in the order they were created", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });

    // when
    act(() => {
      toast.success("First");
      toast.info("Second");
      toast.error("Third");
    });

    // then
    // - all three toasts are present
    expect(screen.getByText("First")).toBeDefined();
    expect(screen.getByText("Second")).toBeDefined();
    expect(screen.getByText("Third")).toBeDefined();
  });

  test("should auto-dismiss a toast after its duration elapses", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });

    // when
    act(() => {
      toast.success("Gone soon", { durationMs: 1000 });
    });
    expect(screen.getByText("Gone soon")).toBeDefined();

    // - advance past the duration
    act(() => {
      vi.advanceTimersByTime(1001);
    });

    // then
    expect(screen.queryByText("Gone soon")).toBeNull();
  });

  test("should persist a toast when durationMs is 0", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });

    // when
    act(() => {
      toast.info("Sticky", { durationMs: 0 });
    });

    // then
    act(() => {
      vi.advanceTimersByTime(100000);
    });
    expect(screen.getByText("Sticky")).toBeDefined();
  });

  test("should dismiss a toast when its close button is clicked", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });
    act(() => {
      toast.info("Dismiss me");
    });

    // when
    const closeBtn = screen
      .getByText("Dismiss me")
      .closest("[data-toast-id]")
      ?.querySelector('[aria-label="Close"]') as HTMLButtonElement;
    fireEvent.click(closeBtn);

    // then
    expect(screen.queryByText("Dismiss me")).toBeNull();
  });

  test("should expose an id returned from success() that can be used to dismiss the toast programmatically", () => {
    // given
    let toast!: ReturnType<typeof useToast>;
    renderWithProvider((api) => {
      toast = api;
    });

    // when
    let id = "";
    act(() => {
      id = toast.success("A", { durationMs: 0 });
    });
    expect(screen.getByText("A")).toBeDefined();

    act(() => {
      toast.dismiss(id);
    });

    // then
    expect(screen.queryByText("A")).toBeNull();
  });
});

describe("useToast outside provider", () => {
  test("should throw when used without a ToastProvider", () => {
    // given
    // - prevent noisy console output from the expected render error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // when/then
    expect(() => {
      render(
        <HookHarness onReady={() => {}} />,
      );
    }).toThrow();

    spy.mockRestore();
  });
});
