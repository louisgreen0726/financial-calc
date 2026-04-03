import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CopyButton } from "@/components/copy-button";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: "en",
  }),
}));

describe("CopyButton", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    // Ensure secure context so clipboard API is used
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it("renders with default props", () => {
    render(<CopyButton value="test-value" />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("calls clipboard API on click", async () => {
    render(<CopyButton value="test-value" />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("test-value");
    });
  });

  it("shows error state when clipboard write fails", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Clipboard error"));

    render(<CopyButton value="test-value" />);
    const button = screen.getByRole("button");

    fireEvent.click(button);

    await waitFor(async () => {
      const { toast } = await import("sonner");
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
