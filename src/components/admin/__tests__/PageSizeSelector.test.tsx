/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageSizeSelector } from "../PageSizeSelector";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("PageSizeSelector", () => {
  const defaultProps = {
    pageSize: 20,
    onPageSizeChange: vi.fn(),
  };

  it("should render a select element with rows per page label when component mounts", () => {
    // given
    // - default props

    // when
    render(<PageSizeSelector {...defaultProps} />);

    // then
    const select = screen.getByLabelText("rowsPerPage") as HTMLSelectElement;
    expect(select).toBeDefined();
  });

  it("should render all page size options when component mounts", () => {
    // given
    // - default props

    // when
    render(<PageSizeSelector {...defaultProps} />);

    // then
    const select = screen.getByLabelText("rowsPerPage") as HTMLSelectElement;
    expect(select.options).toHaveLength(4);
    expect(select.options[0]?.textContent).toBe("10");
    expect(select.options[1]?.textContent).toBe("20");
    expect(select.options[2]?.textContent).toBe("50");
    expect(select.options[3]?.textContent).toBe("100");
  });

  it("should reflect current page size value when pageSize provided", () => {
    // given
    // - a page size of 50

    // when
    render(<PageSizeSelector {...defaultProps} pageSize={50} />);

    // then
    const select = screen.getByLabelText("rowsPerPage") as HTMLSelectElement;
    expect(select.value).toBe("50");
  });

  it("should call onPageSizeChange with numeric value when selection changes", () => {
    // given
    const onPageSizeChange = vi.fn();

    // when
    render(<PageSizeSelector {...defaultProps} onPageSizeChange={onPageSizeChange} />);
    fireEvent.change(screen.getByLabelText("rowsPerPage"), { target: { value: "50" } });

    // then
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });

  it("should default to 20 when initial pageSize is 20", () => {
    // given
    // - default page size

    // when
    render(<PageSizeSelector {...defaultProps} />);

    // then
    const select = screen.getByLabelText("rowsPerPage") as HTMLSelectElement;
    expect(select.value).toBe("20");
  });
});
