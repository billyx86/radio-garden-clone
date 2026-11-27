// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { Search } from "./Search";
import { useRadioStore } from "../store/radio";

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  useRadioStore.setState({
    current: null,
    status: "idle",
    volume: 0.85,
    muted: false,
    errorMessage: null,
    favorites: [],
    searchOpen: false,
    searchQuery: "",
    flyToId: null,
    userInteracting: false,
    audioEl: null,
  });
});

afterEach(() => {
  cleanup();
});

describe("Search sheet keyboard & accessibility support (issue #22)", () => {
  it("exposes aria-expanded and aria-controls on the trigger and role=dialog on the sheet", () => {
    const { getByTestId, queryByTestId } = render(<Search />);
    const trigger = getByTestId("search-trigger");

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe("search-sheet");
    expect(queryByTestId("search-sheet")).toBeNull();

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const sheet = getByTestId("search-sheet");
    expect(sheet.id).toBe("search-sheet");
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(sheet.getAttribute("aria-label")).toBe("Search stations");
  });

  it("closes the sheet on Escape and returns focus to the trigger", () => {
    const { getByTestId, queryByTestId } = render(<Search />);
    const trigger = getByTestId("search-trigger");

    fireEvent.click(trigger);
    const input = getByTestId("search-input");
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });

    expect(queryByTestId("search-sheet")).toBeNull();
    expect(useRadioStore.getState().searchOpen).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("navigates result rows with ArrowDown/ArrowUp and clamps at boundaries", () => {
    const { getByTestId, getAllByTestId } = render(<Search />);
    fireEvent.click(getByTestId("search-trigger"));

    const input = getByTestId("search-input");
    // Narrow results to a small deterministic list so boundary clamping is fast.
    fireEvent.change(input, { target: { value: "jazz" } });
    const rows = getAllByTestId("station-row");
    expect(rows.length).toBeGreaterThanOrEqual(2);

    // Initially row 0 is the roving tab stop.
    expect(rows[0].tabIndex).toBe(0);
    expect(rows[1].tabIndex).toBe(-1);

    // ArrowDown from the input focuses the first row button.
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[0]);
    expect(rows[0].tabIndex).toBe(0);

    // ArrowUp at the top clamps at row 0.
    fireEvent.keyDown(rows[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[0]);
    expect(rows[0].tabIndex).toBe(0);

    // ArrowDown moves to row 1 and updates roving tabindex.
    fireEvent.keyDown(rows[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[1]);
    expect(rows[1].tabIndex).toBe(0);
    expect(rows[0].tabIndex).toBe(-1);

    // ArrowUp moves back to row 0.
    fireEvent.keyDown(rows[1], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[0]);
    expect(rows[0].tabIndex).toBe(0);

    // Walk to the last row and verify ArrowDown clamps at the bottom.
    for (let i = 0; i < rows.length + 2; i++) {
      fireEvent.keyDown(document.activeElement as Element, {
        key: "ArrowDown",
      });
    }
    const last = rows[rows.length - 1];
    expect(document.activeElement).toBe(last);
    expect(last.tabIndex).toBe(0);
  });

  it("activates the focused row button on Enter, selecting the station and closing the sheet", () => {
    const { getByTestId, getAllByTestId, queryByTestId } = render(<Search />);
    const trigger = getByTestId("search-trigger");

    fireEvent.click(trigger);
    const input = getByTestId("search-input");
    fireEvent.keyDown(input, { key: "ArrowDown" });

    const firstRow = getAllByTestId("station-row")[0];
    const stationId = firstRow.getAttribute("data-station-id");
    expect(document.activeElement).toBe(firstRow);
    expect(firstRow.tagName).toBe("BUTTON");
    expect(firstRow.getAttribute("type")).toBe("button");

    // Native <button> converts a non-default-prevented Enter keydown into click;
    // jsdom doesn't synthesize that click, so verify keydown isn't prevented and
    // dispatch the native button activation click.
    const notPrevented = fireEvent.keyDown(firstRow, { key: "Enter" });
    expect(notPrevented).toBe(true);
    fireEvent.click(firstRow);

    expect(useRadioStore.getState().current?.id).toBe(stationId);
    expect(useRadioStore.getState().searchOpen).toBe(false);
    expect(queryByTestId("search-sheet")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
