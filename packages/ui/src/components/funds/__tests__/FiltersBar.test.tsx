import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FiltersBar } from "@repo/ui/components/funds/FiltersBar";

describe("FiltersBar", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces onChange by ~300ms", async () => {
    const onChange = vi.fn();
    render(<FiltersBar q="" onChange={onChange} />);

    const input = screen.getByPlaceholderText(/search funds/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "holy" } });

    // Not called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Advance timers
    vi.advanceTimersByTime(310);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("holy");
  });
});
