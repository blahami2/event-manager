/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FormField } from "../FormField";

describe("FormField", () => {
  it("renders label and children", () => {
    render(
      <FormField label="Name" htmlFor="name">
        <input id="name" />
      </FormField>,
    );
    expect(screen.getByLabelText("Name")).toBeDefined();
  });

  it("renders error message when provided", () => {
    render(
      <FormField label="Name" htmlFor="name" error="Required">
        <input id="name" />
      </FormField>,
    );
    expect(screen.getByText("Required")).toBeDefined();
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("does not render error when not provided", () => {
    render(
      <FormField label="Name" htmlFor="name">
        <input id="name" />
      </FormField>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
