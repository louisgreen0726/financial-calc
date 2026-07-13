import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResetDefaultsButton } from "@/components/reset-defaults-button";

const mocks = vi.hoisted(() => ({ success: vi.fn() }));

vi.mock("@/lib/i18n", () => ({ useLanguage: () => ({ t: (key: string) => key }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));

describe("ResetDefaultsButton", () => {
  beforeEach(() => {
    mocks.success.mockReset();
    window.history.replaceState({}, "", "/calc/options/?options_spot=90&utm_source=review#results");
  });

  it("resets state, removes only calculator parameters, and restores both on undo", () => {
    const restoreState = vi.fn();
    const onReset = vi.fn(() => restoreState);
    render(<ResetDefaultsButton urlPrefix="options" onReset={onReset} />);

    fireEvent.click(screen.getByRole("button", { name: "common.resetDefaults" }));

    expect(onReset).toHaveBeenCalledOnce();
    expect(window.location.href).toBe("http://localhost:3000/calc/options/?utm_source=review#results");
    expect(mocks.success).toHaveBeenCalledWith(
      "common.defaultsRestored",
      expect.objectContaining({ action: expect.objectContaining({ label: "common.undo" }) })
    );

    const options = mocks.success.mock.calls[0][1] as { action: { onClick: () => void } };
    options.action.onClick();

    expect(restoreState).toHaveBeenCalledOnce();
    expect(window.location.href).toBe("http://localhost:3000/calc/options/?options_spot=90&utm_source=review#results");
  });
});
