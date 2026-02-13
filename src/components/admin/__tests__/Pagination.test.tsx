/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("returns null when only one page", () => {
    const { container } = render(
      <Pagination page={1} pageSize={20} total={10} onPageChange={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders page info and navigation", () => {
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} />);
    expect(screen.getByText(/Showing/)).toBeDefined();
    expect(screen.getByText("1", { exact: true })).toBeDefined();
    expect(screen.getByText("20", { exact: true })).toBeDefined();
    expect(screen.getByText("50", { exact: true })).toBeDefined();
    expect(screen.getByText("Page 1 of 3")).toBeDefined();
  });

  it("disables Previous on first page", () => {
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={vi.fn()} />);
    const prev = screen.getByText("Previous") as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it("disables Next on last page", () => {
    render(<Pagination page={3} pageSize={20} total={50} onPageChange={vi.fn()} />);
    const next = screen.getByText("Next") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it("calls onPageChange when Next is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={20} total={50} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when Previous is clicked", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={20} total={50} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
